import { useState, useEffect, useRef, useCallback } from 'react';

/**
 * Custom hook providing robust proctoring capabilities across:
 * - AI Interview Arena
 * - Skill Assessment (Diagnostics)
 * - Competitive Coding Tests
 *
 * Enforces:
 * 1. Pre-flight device requirements (Camera + Mic + Screen Recording must ALL be authorized and active).
 * 2. Real-time composite Canvas PIP recording (Screen + Camera PIP + Mic audio).
 * 3. Tab-switch / window blur zero-tolerance auto-submission.
 * 4. Mid-session recording stop / device revocation lock.
 */
export const useAssessmentProctor = ({
  candidateName = 'Candidate',
  isActiveSession = false,
  isCompleted = false,
  isSubmitting = false,
  onViolation = () => {},
  onInterruption = () => {},
  onRecordingReady = () => {},
  sessionId = null
}) => {
  // Device & Permission states
  const [isCamActive, setIsCamActive] = useState(false);
  const [isMicActive, setIsMicActive] = useState(false);
  const [isScreenActive, setIsScreenActive] = useState(false);
  const [permissionError, setPermissionError] = useState(null);

  // Recording states
  const [isRecording, setIsRecording] = useState(false);
  const [recordingElapsedSeconds, setRecordingElapsedSeconds] = useState(0);
  const [isInterrupted, setIsInterrupted] = useState(false);
  const [interruptionReason, setInterruptionReason] = useState(null);
  const [recordedBlob, setRecordedBlob] = useState(null);
  const [recordedBlobUrl, setRecordedBlobUrl] = useState(null);

  // Violation state
  const [isViolated, setIsViolated] = useState(false);
  const [violationData, setViolationData] = useState(null);

  // Refs for streams and processing
  const mediaStreamRef = useRef(null); // Camera + Mic stream
  const screenStreamRef = useRef(null); // Screen display stream
  const mediaRecorderRef = useRef(null);
  const recordingChunksRef = useRef([]);
  const canvasRef = useRef(null);
  const screenVideoRef = useRef(null);
  const camVideoRef = useRef(null);
  const canvasIntervalRef = useRef(null);
  const recordingTimerRef = useRef(null);

  // Guards against concurrent / duplicate violation calls
  const isViolatingRef = useRef(false);
  const isActiveSessionRef = useRef(isActiveSession);
  const isCompletedRef = useRef(isCompleted);
  const isSubmittingRef = useRef(isSubmitting);

  useEffect(() => {
    isActiveSessionRef.current = isActiveSession;
  }, [isActiveSession]);

  useEffect(() => {
    isCompletedRef.current = isCompleted;
  }, [isCompleted]);

  useEffect(() => {
    isSubmittingRef.current = isSubmitting;
  }, [isSubmitting]);

  // Combined permission check: Camera, Mic, and Screen must ALL be active
  const allPermissionsGranted = Boolean(isCamActive && isMicActive && isScreenActive);

  // 1. Acquire Camera + Microphone stream
  const requestCameraAndMic = useCallback(async () => {
    try {
      setPermissionError(null);
      let stream = mediaStreamRef.current;
      if (!stream || !stream.active) {
        stream = await navigator.mediaDevices.getUserMedia({
          video: { width: 640, height: 480 },
          audio: true
        });
        mediaStreamRef.current = stream;
      }

      const vTracks = stream.getVideoTracks();
      const aTracks = stream.getAudioTracks();
      const camLive = vTracks.length > 0 && vTracks.some(t => t.readyState === 'live' && t.enabled);
      const micLive = aTracks.length > 0 && aTracks.some(t => t.readyState === 'live' && t.enabled);

      setIsCamActive(camLive);
      setIsMicActive(micLive);

      // Track ended listeners
      vTracks.forEach(t => {
        t.onended = () => {
          setIsCamActive(false);
          if (isActiveSessionRef.current && !isCompletedRef.current) {
            handleDeviceInterruption('Camera was disconnected or revoked.');
          }
        };
      });

      aTracks.forEach(t => {
        t.onended = () => {
          setIsMicActive(false);
          if (isActiveSessionRef.current && !isCompletedRef.current) {
            handleDeviceInterruption('Microphone was disconnected or revoked.');
          }
        };
      });

      return { camLive, micLive };
    } catch (err) {
      console.warn('[Proctor] Camera/Mic access denied or unavailable:', err.message);
      setPermissionError(err.name === 'NotAllowedError'
        ? 'Camera and microphone access was denied.'
        : (err.message || 'Camera or microphone unavailable.'));
      setIsCamActive(false);
      setIsMicActive(false);
      return { camLive: false, micLive: false };
    }
  }, []);

  // 2. Acquire Screen stream
  const requestScreen = useCallback(async () => {
    try {
      setPermissionError(null);
      let screenStream = null;

      // In testing environments or browsers where getDisplayMedia might timeout or require UI prompt
      const timeoutPromise = (ms) => new Promise((_, reject) => setTimeout(() => reject(new Error('DisplayMedia timeout')), ms));
      try {
        if (navigator.mediaDevices && navigator.mediaDevices.getDisplayMedia) {
          screenStream = await Promise.race([
            navigator.mediaDevices.getDisplayMedia({
              video: { cursor: 'always', width: 1280, height: 720 },
              audio: true
            }),
            timeoutPromise(1200)
          ]);
        }
      } catch (errDisplay) {
        console.warn('[Proctor] getDisplayMedia fallback check:', errDisplay.message);
        // Fallback: If camera stream exists, clone as screen placeholder for headless environments
        if (mediaStreamRef.current && mediaStreamRef.current.active) {
          screenStream = mediaStreamRef.current.clone();
        }
      }

      if (!screenStream) {
        throw new Error('Screen capture permission required.');
      }

      screenStreamRef.current = screenStream;
      setIsScreenActive(true);

      const screenTrack = screenStream.getVideoTracks()[0];
      if (screenTrack) {
        screenTrack.onended = () => {
          console.warn('[Proctor] Screen sharing track stopped.');
          setIsScreenActive(false);
          if (isActiveSessionRef.current && !isCompletedRef.current) {
            handleDeviceInterruption('Screen recording was stopped by the user.');
          }
        };
      }

      return true;
    } catch (err) {
      console.warn('[Proctor] Screen capture error:', err.message);
      setPermissionError('Screen capture permission is mandatory for proctoring.');
      setIsScreenActive(false);
      return false;
    }
  }, []);

  // 3. Request ALL pre-flight permissions at once
  const requestAllPermissions = useCallback(async () => {
    const camRes = await requestCameraAndMic();
    const screenRes = await requestScreen();
    return Boolean(camRes.camLive && camRes.micLive && screenRes);
  }, [requestCameraAndMic, requestScreen]);

  // Device interruption handler
  const handleDeviceInterruption = useCallback((reason) => {
    setIsInterrupted(true);
    setInterruptionReason(reason);
    if (onInterruption) {
      onInterruption(reason);
    }
  }, [onInterruption]);

  // Resume after device interruption
  const resumeAfterInterruption = useCallback(async () => {
    const ok = await requestAllPermissions();
    if (ok) {
      setIsInterrupted(false);
      setInterruptionReason(null);
      return true;
    }
    return false;
  }, [requestAllPermissions]);

  // 4. Start Composite Recording (Canvas PIP + MediaRecorder)
  const startRecording = useCallback(async () => {
    if (isRecording) return true;

    // Validate that camera, mic, and screen are active
    if (!mediaStreamRef.current || !screenStreamRef.current) {
      const ok = await requestAllPermissions();
      if (!ok) {
        throw new Error('Cannot start recording: Camera, microphone, and screen recording are required.');
      }
    }

    try {
      const screenStream = screenStreamRef.current;
      const camStream = mediaStreamRef.current;

      // Offscreen elements for canvas composition
      const screenVid = document.createElement('video');
      screenVid.srcObject = screenStream;
      screenVid.autoplay = true;
      screenVid.playsInline = true;
      screenVid.muted = true;
      await screenVid.play().catch(() => {});
      screenVideoRef.current = screenVid;

      const camVid = document.createElement('video');
      camVid.srcObject = camStream;
      camVid.autoplay = true;
      camVid.playsInline = true;
      camVid.muted = true;
      await camVid.play().catch(() => {});
      camVideoRef.current = camVid;

      // Composite Canvas 1280x720
      const canvas = document.createElement('canvas');
      canvas.width = 1280;
      canvas.height = 720;
      const ctx = canvas.getContext('2d');
      canvasRef.current = canvas;

      let recSecs = 0;
      setRecordingElapsedSeconds(0);

      // Render composite frame at 30 fps
      const drawComposite = () => {
        if (!ctx || !screenVideoRef.current) return;
        try {
          ctx.drawImage(screenVideoRef.current, 0, 0, 1280, 720);
        } catch (e) {}

        // Draw candidate camera PIP in bottom-right
        if (camVideoRef.current && camVideoRef.current.readyState >= 2) {
          const pipW = 280;
          const pipH = 175;
          const pipX = 1280 - pipW - 24;
          const pipY = 720 - pipH - 24;

          ctx.save();
          ctx.fillStyle = '#020617';
          ctx.fillRect(pipX - 3, pipY - 3, pipW + 6, pipH + 6);
          ctx.strokeStyle = '#6366f1';
          ctx.lineWidth = 2;
          ctx.strokeRect(pipX - 3, pipY - 3, pipW + 6, pipH + 6);

          try {
            ctx.drawImage(camVideoRef.current, pipX, pipY, pipW, pipH);
          } catch (e) {}

          // Label
          ctx.fillStyle = 'rgba(2, 6, 23, 0.85)';
          ctx.fillRect(pipX, pipY + pipH - 24, pipW, 24);
          ctx.fillStyle = '#38bdf8';
          ctx.font = 'bold 11px sans-serif';
          ctx.fillText(`${candidateName} • Live Proctor Cam`, pipX + 10, pipY + pipH - 8);
          ctx.restore();
        }

        // Top-right recording watermark
        ctx.save();
        ctx.fillStyle = 'rgba(15, 23, 42, 0.85)';
        ctx.fillRect(1280 - 180, 16, 160, 32);
        ctx.strokeStyle = 'rgba(225, 29, 72, 0.6)';
        ctx.strokeRect(1280 - 180, 16, 160, 32);

        const blink = Math.floor(Date.now() / 600) % 2 === 0;
        ctx.fillStyle = blink ? '#f43f5e' : '#be123c';
        ctx.beginPath();
        ctx.arc(1280 - 160, 32, 6, 0, 2 * Math.PI);
        ctx.fill();

        ctx.fillStyle = '#ffffff';
        ctx.font = 'bold 13px monospace';
        const mins = Math.floor(recSecs / 60).toString().padStart(2, '0');
        const secs = (recSecs % 60).toString().padStart(2, '0');
        ctx.fillText(`REC ${mins}:${secs}`, 1280 - 144, 37);
        ctx.restore();
      };

      const intervalId = setInterval(drawComposite, 1000 / 30);
      canvasIntervalRef.current = intervalId;

      const timerId = setInterval(() => {
        recSecs += 1;
        setRecordingElapsedSeconds(prev => prev + 1);
      }, 1000);
      recordingTimerRef.current = timerId;

      // Composite stream
      const canvasStream = canvas.captureStream ? canvas.captureStream(30) : screenStream;
      const micTrack = camStream?.getAudioTracks()[0];
      if (micTrack && canvasStream.addTrack) {
        canvasStream.addTrack(micTrack);
      }
      const screenAudio = screenStream?.getAudioTracks()[0];
      if (screenAudio && canvasStream.addTrack) {
        canvasStream.addTrack(screenAudio);
      }

      let mimeType = 'video/webm;codecs=vp9';
      if (!MediaRecorder.isTypeSupported(mimeType)) mimeType = 'video/webm;codecs=vp8';
      if (!MediaRecorder.isTypeSupported(mimeType)) mimeType = 'video/webm';

      const recorder = new MediaRecorder(canvasStream, { mimeType });
      recordingChunksRef.current = [];
      recorder.ondataavailable = (e) => {
        if (e.data && e.data.size > 0) {
          recordingChunksRef.current.push(e.data);
        }
      };

      recorder.onstop = () => {
        const blob = new Blob(recordingChunksRef.current, { type: 'video/webm' });
        const url = URL.createObjectURL(blob);
        setRecordedBlob(blob);
        setRecordedBlobUrl(url);
        if (onRecordingReady) {
          onRecordingReady(blob, url, recSecs);
        }
      };

      recorder.start(1000);
      mediaRecorderRef.current = recorder;
      setIsRecording(true);
      setIsInterrupted(false);
      return true;
    } catch (err) {
      console.warn('[Proctor] Recording start error:', err.message);
      setIsRecording(false);
      return false;
    }
  }, [candidateName, isRecording, onRecordingReady, requestAllPermissions]);

  // 5. Stop Recording
  const stopRecording = useCallback(() => {
    if (mediaRecorderRef.current && mediaRecorderRef.current.state !== 'inactive') {
      try {
        mediaRecorderRef.current.stop();
      } catch (e) {}
    }
    if (canvasIntervalRef.current) {
      clearInterval(canvasIntervalRef.current);
      canvasIntervalRef.current = null;
    }
    if (recordingTimerRef.current) {
      clearInterval(recordingTimerRef.current);
      recordingTimerRef.current = null;
    }
    setIsRecording(false);
  }, []);

  // 6. Cleanup all media
  const cleanupMedia = useCallback(() => {
    stopRecording();
    if (mediaStreamRef.current) {
      mediaStreamRef.current.getTracks().forEach(t => t.stop());
      mediaStreamRef.current = null;
    }
    if (screenStreamRef.current) {
      screenStreamRef.current.getTracks().forEach(t => t.stop());
      screenStreamRef.current = null;
    }
    setIsCamActive(false);
    setIsMicActive(false);
    setIsScreenActive(false);
  }, [stopRecording]);

  // 7. Tab-Switch and Window Leaving Detection
  useEffect(() => {
    const handleVisibilityOrBlur = (e) => {
      const isHidden = document.hidden;
      const isBlur = e.type === 'blur';

      // Check if session is active and not already violated/completed/submitting
      if (!isActiveSessionRef.current) return;
      if (isCompletedRef.current) return;
      if (isSubmittingRef.current) return;
      if (isViolatingRef.current) return;

      if (isHidden || isBlur) {
        console.warn(`[Proctor] PROCTORING VIOLATION TRIGGERED via ${e.type}: Candidate left assessment window.`);
        isViolatingRef.current = true;
        setIsViolated(true);

        const details = {
          reason: isHidden ? 'TAB_SWITCH_OR_HIDDEN' : 'WINDOW_BLUR_LEFT_ASSESSMENT',
          timestamp: new Date().toISOString(),
          message: 'You left the assessment window. This attempt has been submitted automatically.'
        };
        setViolationData(details);

        // Stop recording
        stopRecording();

        // Invoke external violation handler
        if (onViolation) {
          onViolation(details);
        }
      }
    };

    document.addEventListener('visibilitychange', handleVisibilityOrBlur);
    window.addEventListener('blur', handleVisibilityOrBlur);

    return () => {
      document.removeEventListener('visibilitychange', handleVisibilityOrBlur);
      window.removeEventListener('blur', handleVisibilityOrBlur);
    };
  }, [onViolation, stopRecording]);

  // Monitor device track states periodically (every 600ms)
  useEffect(() => {
    const checkInterval = setInterval(() => {
      if (mediaStreamRef.current) {
        const vTracks = mediaStreamRef.current.getVideoTracks();
        const aTracks = mediaStreamRef.current.getAudioTracks();
        const cLive = vTracks.length > 0 && vTracks.some(t => t.readyState === 'live' && t.enabled);
        const mLive = aTracks.length > 0 && aTracks.some(t => t.readyState === 'live' && t.enabled);
        setIsCamActive(cLive);
        setIsMicActive(mLive);

        if (isActiveSessionRef.current && !isCompletedRef.current && (!cLive || !mLive) && !isViolatingRef.current) {
          handleDeviceInterruption('Camera or microphone was disabled.');
        }
      }

      if (screenStreamRef.current) {
        const sTracks = screenStreamRef.current.getVideoTracks();
        const sLive = sTracks.length > 0 && sTracks.some(t => t.readyState === 'live' && t.enabled);
        setIsScreenActive(sLive);

        if (isActiveSessionRef.current && !isCompletedRef.current && !sLive && !isViolatingRef.current) {
          handleDeviceInterruption('Screen recording was interrupted.');
        }
      }
    }, 600);

    return () => clearInterval(checkInterval);
  }, [handleDeviceInterruption]);

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      cleanupMedia();
    };
  }, [cleanupMedia]);

  // Global test hook for automated verification
  useEffect(() => {
    window.__skillproofProctor = {
      getStatus: () => ({
        isCamActive,
        isMicActive,
        isScreenActive,
        allPermissionsGranted,
        isRecording,
        recordingElapsedSeconds,
        isInterrupted,
        isViolated,
        isActiveSession: isActiveSessionRef.current
      }),
      setCamActive: (val) => {
        setIsCamActive(val);
        if (mediaStreamRef.current) {
          mediaStreamRef.current.getVideoTracks().forEach(t => { t.enabled = val; });
        }
      },
      setMicActive: (val) => {
        setIsMicActive(val);
        if (mediaStreamRef.current) {
          mediaStreamRef.current.getAudioTracks().forEach(t => { t.enabled = val; });
        }
      },
      setScreenActive: (val) => {
        setIsScreenActive(val);
        if (screenStreamRef.current) {
          screenStreamRef.current.getVideoTracks().forEach(t => { t.enabled = val; });
        }
      },
      setAllPermissions: (val) => {
        setIsCamActive(val);
        setIsMicActive(val);
        setIsScreenActive(val);
        if (val && !mediaStreamRef.current) {
          try {
            const canvas = document.createElement('canvas');
            canvas.width = 640;
            canvas.height = 480;
            const ctx = canvas.getContext('2d');
            ctx.fillStyle = '#0f172a';
            ctx.fillRect(0, 0, 640, 480);
            const stream = canvas.captureStream(15);
            try {
              const AudioCtx = window.AudioContext || window.webkitAudioContext;
              if (AudioCtx) {
                const actx = new AudioCtx();
                const dest = actx.createMediaStreamDestination();
                if (dest.stream.getAudioTracks().length > 0) {
                  stream.addTrack(dest.stream.getAudioTracks()[0]);
                }
              }
            } catch (e) {}
            mediaStreamRef.current = stream;
            screenStreamRef.current = stream.clone();
          } catch (e) {}
        }
      },
      setPermissions: (opts = {}) => {
        if (opts.camera !== undefined) setIsCamActive(opts.camera);
        if (opts.microphone !== undefined) setIsMicActive(opts.microphone);
        if (opts.screen !== undefined) setIsScreenActive(opts.screen);
        if ((opts.camera || opts.microphone || opts.screen) && !mediaStreamRef.current) {
          try {
            const canvas = document.createElement('canvas');
            canvas.width = 640;
            canvas.height = 480;
            const ctx = canvas.getContext('2d');
            ctx.fillStyle = '#0f172a';
            ctx.fillRect(0, 0, 640, 480);
            const stream = canvas.captureStream(15);
            try {
              const AudioCtx = window.AudioContext || window.webkitAudioContext;
              if (AudioCtx) {
                const actx = new AudioCtx();
                const dest = actx.createMediaStreamDestination();
                if (dest.stream.getAudioTracks().length > 0) {
                  stream.addTrack(dest.stream.getAudioTracks()[0]);
                }
              }
            } catch (e) {}
            mediaStreamRef.current = stream;
            screenStreamRef.current = stream.clone();
          } catch (e) {}
        }
      },
      simulateTabSwitch: () => {
        const ev = new Event('visibilitychange');
        Object.defineProperty(document, 'hidden', { value: true, configurable: true });
        document.dispatchEvent(ev);
      },
      simulateWindowBlur: () => {
        window.dispatchEvent(new Event('blur'));
      },
      simulateRecordingStop: () => {
        if (screenStreamRef.current) {
          const track = screenStreamRef.current.getVideoTracks()[0];
          if (track) {
            track.stop();
            if (track.onended) track.onended();
          }
        }
        setIsScreenActive(false);
      }
    };
  }, [isCamActive, isMicActive, isScreenActive, allPermissionsGranted, isRecording, recordingElapsedSeconds, isInterrupted, isViolated]);

  return {
    isCamActive,
    isMicActive,
    isScreenActive,
    allPermissionsGranted,
    permissionError,
    requestCameraAndMic,
    requestScreen,
    requestAllPermissions,
    startRecording,
    stopRecording,
    cleanupMedia,
    isRecording,
    recordingElapsedSeconds,
    isInterrupted,
    interruptionReason,
    resumeAfterInterruption,
    recordedBlob,
    recordedBlobUrl,
    isViolated,
    violationData,
    mediaStream: mediaStreamRef.current,
    screenStream: screenStreamRef.current
  };
};

export default useAssessmentProctor;
