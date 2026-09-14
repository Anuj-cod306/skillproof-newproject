import React, { useState, useEffect, useRef, useCallback } from 'react';
import {
  Mic, MicOff, Video, VideoOff, Play, CheckCircle2, XCircle, AlertTriangle,
  HelpCircle, Code2, Terminal, RefreshCw, Send, ShieldCheck, Award,
  ArrowRight, Zap, Volume2, VolumeX, Sparkles, BookOpen, ExternalLink,
  Printer, Timer, FileCode, Check, BarChart3, ChevronRight, MessageSquare,
  Compass, Flame, BrainCircuit, UserCheck, Layers, PlayCircle, CornerDownRight,
  Film, Monitor, StopCircle, Download, Disc, Lock, PauseCircle, Pause, ChevronDown,
  Clock, ArrowLeft, CheckCircle
} from 'lucide-react';
import { useSkillProof } from '../../context/SkillProofContext';
import apiService from '../../services/api';

const DEFAULT_CHALLENGE = {
  id: 'two-sum',
  title: 'Two Sum Challenge',
  difficulty: 'EASY',
  description: 'Given an array of integers nums and an integer target, return indices of the two numbers such that they add up to target. You may assume that each input would have exactly one solution, and you may not use the same element twice.',
  exampleInput: 'nums = [2, 7, 11, 15], target = 9',
  exampleOutput: '[0, 1]',
  exampleExplanation: 'Because nums[0] + nums[1] == 9, we return [0, 1].',
  constraints: [
    '2 <= nums.length <= 10^4',
    '-10^9 <= nums[i] <= 10^9',
    '-10^9 <= target <= 10^9',
    'Only one valid answer exists.'
  ],
  starterCode: {
    javascript: `function twoSum(nums, target) {
  // Hash map for O(n) single-pass lookup
  const map = new Map();
  for (let i = 0; i < nums.length; i++) {
    const complement = target - nums[i];
    if (map.has(complement)) {
      return [map.get(complement), i];
    }
    map.set(nums[i], i);
  }
  return [];
}`,
    python: `def twoSum(nums, target):
    seen = {}
    for i, num in enumerate(nums):
        diff = target - num
        if diff in seen:
            return [seen[diff], i]
        seen[num] = i
    return []`,
    java: `import java.util.HashMap;
import java.util.Map;

class Solution {
    public int[] twoSum(int[] nums, int target) {
        Map<Integer, Integer> map = new HashMap<>();
        for (int i = 0; i < nums.length; i++) {
            int complement = target - nums[i];
            if (map.containsKey(complement)) {
                return new int[] { map.get(complement), i };
            }
            map.put(nums[i], i);
        }
        return new int[0];
    }
}`
  }
};

const ASSESSMENT_STEPS = [
  { id: 'PRE_FLIGHT', legacyId: 'preflight', label: 'Pre-flight', num: 1 },
  { id: 'INTERVIEW', legacyId: 'interview', label: 'AI Technical Interview', num: 2 },
  { id: 'INTERVIEW_COMPLETE', legacyId: 'interview-complete', label: 'Interview Complete', num: 3 },
  { id: 'CODING', legacyId: 'coding', label: 'Coding Contest', num: 4 },
  { id: 'EVALUATION', legacyId: 'evaluation', label: 'Evaluation', num: 5 },
  { id: 'RESULT', legacyId: 'result', label: 'Result & Dossier', num: 6 }
];

export const AiInterviewArena = () => {
  const { studentProfile, loadLiveStudentData } = useSkillProof();

  // Mode & Session State
  const [selectedMode, setSelectedMode] = useState(() => {
    try {
      const params = new URLSearchParams(window.location.search);
      const m = params.get('mode');
      if (m && ['TECHNICAL', 'PROJECT_DEFENSE', 'COMPETITIVE_CODING', 'FULL_SIMULATION'].includes(m)) {
        return m;
      }
    } catch (e) {}
    return 'TECHNICAL';
  });
  const [session, setSession] = useState(null);
  const [isStarting, setIsStarting] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [elapsedSeconds, setElapsedSeconds] = useState(0);
  const [activeTab, setActiveTab] = useState('interview'); // 'interview' | 'dossier'

  // Authoritative Assessment Stage State Machine
  // Valid states: PRE_FLIGHT | INTERVIEW | INTERVIEW_COMPLETE | CODING | EVALUATION | RESULT
  const [assessmentStage, setAssessmentStage] = useState(() => {
    try {
      const saved = localStorage.getItem('skillproof_assessment_stage');
      if (saved && ['PRE_FLIGHT', 'INTERVIEW', 'INTERVIEW_COMPLETE', 'CODING', 'EVALUATION', 'RESULT'].includes(saved)) {
        return saved;
      }
    } catch (e) {}
    return 'PRE_FLIGHT';
  });

  const updateAssessmentStage = (stage) => {
    setAssessmentStage(stage);
    try {
      localStorage.setItem('skillproof_assessment_stage', stage);
    } catch (e) {}
  };

  // Coding Contest countdown timer (45 minutes = 2700 seconds)
  const [codingTimeRemaining, setCodingTimeRemaining] = useState(45 * 60);

  // Turn input, validation & evaluation state
  const [studentInput, setStudentInput] = useState('');
  const [answerError, setAnswerError] = useState(null);
  const [lastTurnEvaluation, setLastTurnEvaluation] = useState(null);
  const [isRecording, setIsRecording] = useState(false);
  const [speechSupported, setSpeechSupported] = useState(false);
  const [voiceNarration, setVoiceNarration] = useState(true);
  const [isAiSpeaking, setIsAiSpeaking] = useState(false);

  // WebRTC Video & Audio Meter
  const videoRef = useRef(null);
  const mediaStreamRef = useRef(null);
  const [isCamActive, setIsCamActive] = useState(false);
  const [isMicActive, setIsMicActive] = useState(false);
  const [audioLevel, setAudioLevel] = useState(15);
  const [camPermissionError, setCamPermissionError] = useState(null);
  const recognitionRef = useRef(null);
  const transcriptEndRef = useRef(null);

  // Camera & Mic Gate Modal
  const [showLockedModal, setShowLockedModal] = useState(false);

  // Screen share interruption pause state
  const [isScreenInterrupted, setIsScreenInterrupted] = useState(false);

  // Concurrent request guards & session synchronization
  const isPausingRef = useRef(false);
  const isResumingRef = useRef(false);
  const sessionRef = useRef(session);
  useEffect(() => {
    sessionRef.current = session;
  }, [session]);

  // Screen + Camera Combined Recording State
  const [showRecordingConsentModal, setShowRecordingConsentModal] = useState(false);
  const [isRecordingSession, setIsRecordingSession] = useState(false);
  const [recordingElapsedSeconds, setRecordingElapsedSeconds] = useState(0);
  const [screenSharingActive, setScreenSharingActive] = useState(false);
  const [recordedBlobUrl, setRecordedBlobUrl] = useState(null);
  const [isSavingRecording, setIsSavingRecording] = useState(false);
  const [codingSubmissionsList, setCodingSubmissionsList] = useState([]);

  const screenStreamRef = useRef(null);
  const mediaRecorderRef = useRef(null);
  const recordingChunksRef = useRef([]);
  const canvasRef = useRef(null);
  const screenVideoRef = useRef(null);
  const camVideoRef = useRef(null);
  const canvasIntervalRef = useRef(null);
  const recordingTimerRef = useRef(null);

  // Live Coding Workspace State
  const [selectedLanguage, setSelectedLanguage] = useState('javascript');
  const [codeContent, setCodeContent] = useState(DEFAULT_CHALLENGE.starterCode.javascript);
  const [isRunningCode, setIsRunningCode] = useState(false);
  const [codeExecutionResult, setCodeExecutionResult] = useState(null);
  const [hintsList, setHintsList] = useState([]);
  const [isRequestingHint, setIsRequestingHint] = useState(false);
  const [activeChallenge, setActiveChallenge] = useState(DEFAULT_CHALLENGE);

  // Ensure recording elapsed timer increments whenever isRecordingSession is active
  useEffect(() => {
    let timer = null;
    if (isRecordingSession) {
      timer = setInterval(() => {
        setRecordingElapsedSeconds(prev => prev + 1);
      }, 1000);
    }
    return () => {
      if (timer) clearInterval(timer);
    };
  }, [isRecordingSession]);

  // Coding Contest live countdown timer
  useEffect(() => {
    let interval = null;
    if (assessmentStage === 'CODING' && session?.status !== 'PAUSED' && codingTimeRemaining > 0) {
      interval = setInterval(() => {
        setCodingTimeRemaining(prev => Math.max(0, prev - 1));
      }, 1000);
    }
    return () => {
      if (interval) clearInterval(interval);
    };
  }, [assessmentStage, session?.status, codingTimeRemaining]);

  // Auto-scroll transcript inside its own container without scrolling outer page/window
  useEffect(() => {
    const logEl = document.getElementById('transcript-history-log');
    if (logEl) {
      logEl.scrollTop = logEl.scrollHeight;
    }
  }, [session?.transcript, isSubmitting]);

  // Session Question Timer: ONLY runs when ACTIVE or IN_PROGRESS (freezes when PAUSED)
  useEffect(() => {
    let interval = null;
    const isLive = session && (session.status === 'ACTIVE' || session.status === 'IN_PROGRESS');
    if (isLive) {
      interval = setInterval(() => {
        setElapsedSeconds(prev => prev + 1);
      }, 1000);
    }
    return () => clearInterval(interval);
  }, [session?.status]);

  // Web Speech API Initialization (STT)
  useEffect(() => {
    const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;
    if (SpeechRecognition) {
      setSpeechSupported(true);
      const recog = new SpeechRecognition();
      recog.continuous = true;
      recog.interimResults = true;
      recog.lang = 'en-US';

      recog.onresult = (event) => {
        let interim = '';
        let final = '';
        for (let i = event.resultIndex; i < event.results.length; ++i) {
          if (event.results[i].isFinal) {
            final += event.results[i][0].transcript + ' ';
          } else {
            interim += event.results[i][0].transcript;
          }
        }
        setStudentInput(prev => (prev + ' ' + final).trim());
        setAnswerError(null);
      };

      recog.onerror = (err) => {
        console.warn('[STT] Speech recognition warning:', err.error);
        setIsRecording(false);
      };

      recog.onend = () => {
        setIsRecording(false);
      };

      recognitionRef.current = recog;
    }
  }, []);

  // Dedicated callback ref to always bind srcObject whenever the <video> element mounts
  const bindCandidateVideo = useCallback((node) => {
    videoRef.current = node;
    if (node && mediaStreamRef.current) {
      if (node.srcObject !== mediaStreamRef.current) {
        node.srcObject = mediaStreamRef.current;
      }
      node.play().catch(e => console.warn('[Video] Auto-play note:', e.message));
    }
  }, []);

  // WebRTC Camera & Mic Initialization
  const startMedia = useCallback(async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({
        video: { width: 640, height: 480 },
        audio: true
      });
      mediaStreamRef.current = stream;
      setCamPermissionError(null);

      const vTracks = stream.getVideoTracks();
      const aTracks = stream.getAudioTracks();
      const vLive = vTracks.length > 0 && vTracks.some(t => t.readyState === 'live' && t.enabled);
      const aLive = aTracks.length > 0 && aTracks.some(t => t.readyState === 'live' && t.enabled);

      setIsCamActive(vLive);
      setIsMicActive(aLive);

      if (videoRef.current) {
        videoRef.current.srcObject = stream;
        videoRef.current.play().catch(() => {});
      }

      // Setup audio level meter
      const AudioCtx = window.AudioContext || window.webkitAudioContext;
      if (AudioCtx) {
        try {
          const audioContext = new AudioCtx();
          const analyser = audioContext.createAnalyser();
          const microphone = audioContext.createMediaStreamSource(stream);
          const javascriptNode = audioContext.createScriptProcessor(2048, 1, 1);

          analyser.smoothingTimeConstant = 0.8;
          analyser.fftSize = 1024;

          microphone.connect(analyser);
          analyser.connect(javascriptNode);
          javascriptNode.connect(audioContext.destination);

          javascriptNode.onaudioprocess = () => {
            const array = new Uint8Array(analyser.frequencyBinCount);
            analyser.getByteFrequencyData(array);
            let values = 0;
            const length = array.length;
            for (let i = 0; i < length; i++) {
              values += array[i];
            }
            const average = values / length;
            setAudioLevel(Math.min(100, Math.round(average * 2.2)));
          };
        } catch (e) {}
      }
      return true;
    } catch (err) {
      console.warn('[WebRTC] Camera/Mic access note:', err.message);
      setCamPermissionError(
        err.name === 'NotAllowedError'
          ? 'Camera and microphone permission denied'
          : (err.message || 'Camera and microphone unavailable')
      );
      setIsCamActive(false);
      setIsMicActive(false);
      return false;
    }
  }, []);

  // Request media on mount
  useEffect(() => {
    startMedia();

    return () => {
      if (mediaStreamRef.current) {
        mediaStreamRef.current.getTracks().forEach(track => track.stop());
      }
      if (screenStreamRef.current) {
        screenStreamRef.current.getTracks().forEach(track => track.stop());
      }
      if (canvasIntervalRef.current) {
        clearInterval(canvasIntervalRef.current);
      }
      if (recordingTimerRef.current) {
        clearInterval(recordingTimerRef.current);
      }
    };
  }, [startMedia]);

  // Expose device control helper for programmatic testing and automated device gate verification
  useEffect(() => {
    window.__skillproofMedia = {
      getStream: () => mediaStreamRef.current,
      setCamEnabled: (enabled) => {
        if (mediaStreamRef.current) {
          mediaStreamRef.current.getVideoTracks().forEach(t => { t.enabled = enabled; });
        }
        setIsCamActive(enabled);
      },
      setMicEnabled: (enabled) => {
        if (mediaStreamRef.current) {
          mediaStreamRef.current.getAudioTracks().forEach(t => { t.enabled = enabled; });
        }
        setIsMicActive(enabled);
      },
      setAllEnabled: (enabled) => {
        if (mediaStreamRef.current) {
          mediaStreamRef.current.getTracks().forEach(t => { t.enabled = enabled; });
        }
        setIsCamActive(enabled);
        setIsMicActive(enabled);
      },
      stopScreenTrack: () => {
        if (screenStreamRef.current) {
          const track = screenStreamRef.current.getVideoTracks()[0];
          if (track) {
            track.stop();
            if (track.onended) track.onended();
          }
        }
      },
      setCode: (code) => {
        setCodeContent(code);
        const ed = document.getElementById('textarea-code-editor');
        if (ed) ed.value = code;
      },
      setAnswer: (ans) => {
        setStudentInput(ans);
        setAnswerError(null);
        const ta = document.getElementById('textarea-candidate-answer');
        if (ta) ta.value = ans;
      },
      simulateTabSwitch: () => {
        Object.defineProperty(document, 'hidden', { value: true, configurable: true });
        document.dispatchEvent(new Event('visibilitychange'));
      },
      simulateWindowBlur: () => {
        window.dispatchEvent(new Event('blur'));
      },
      setScreenSharingActive: (val) => {
        setScreenSharingActive(val);
        setIsRecordingSession(val);
      },
      setAllPermissions: async (val) => {
        if (val) {
          if (!mediaStreamRef.current || mediaStreamRef.current.getTracks().length === 0) {
            await startMedia();
          } else {
            mediaStreamRef.current.getTracks().forEach(t => { t.enabled = true; });
          }
        } else {
          if (mediaStreamRef.current) {
            mediaStreamRef.current.getTracks().forEach(t => { t.enabled = false; });
          }
        }
        setIsCamActive(val);
        setIsMicActive(val);
        setScreenSharingActive(val);
        setIsRecordingSession(val);
      },
      stopScreenRecording: () => {
        handleStopRecording();
        const current = sessionRef.current;
        if (current && (current.status === 'ACTIVE' || current.status === 'IN_PROGRESS')) {
          setIsScreenInterrupted(true);
          triggerPause(current.interviewId);
        }
      },
      startScreenRecording: () => {
        setIsScreenInterrupted(false);
        setIsRecordingSession(true);
        setScreenSharingActive(true);
        const current = sessionRef.current;
        if (current?.interviewId && current.status === 'PAUSED') {
          triggerResume(current.interviewId);
        }
      }
    };
  }, []);

  // Keyboard accessibility: Escape closes any open modal safely
  useEffect(() => {
    const handleKeyDown = (e) => {
      if (e.key === 'Escape') {
        if (showLockedModal) setShowLockedModal(false);
        if (showRecordingConsentModal) setShowRecordingConsentModal(false);
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [showLockedModal, showRecordingConsentModal]);

  // Sync video source whenever session or camera toggle changes
  useEffect(() => {
    if (videoRef.current && mediaStreamRef.current) {
      if (videoRef.current.srcObject !== mediaStreamRef.current) {
        videoRef.current.srcObject = mediaStreamRef.current;
      }
      videoRef.current.play().catch(() => {});
    }
  }, [session, isCamActive, assessmentStage]);

  // Device Pause and Resume Triggers
  const triggerPause = useCallback(async (interviewId) => {
    if (isPausingRef.current) return;
    isPausingRef.current = true;
    try {
      await apiService.pauseInterview(interviewId);
      setSession(prev => prev ? ({ ...prev, status: 'PAUSED', isPaused: true }) : null);
    } catch (err) {
      console.warn('[Arena] Auto-pause note:', err.message);
      setSession(prev => prev ? ({ ...prev, status: 'PAUSED', isPaused: true }) : null);
    } finally {
      isPausingRef.current = false;
    }
  }, []);

  const triggerResume = useCallback(async (interviewId) => {
    if (isResumingRef.current) return;
    isResumingRef.current = true;
    try {
      await apiService.resumeInterview(interviewId);
      setIsScreenInterrupted(false);
      setSession(prev => prev ? ({ ...prev, status: 'ACTIVE', isPaused: false }) : null);
    } catch (err) {
      console.warn('[Arena] Auto-resume note:', err.message);
      setIsScreenInterrupted(false);
      setSession(prev => prev ? ({ ...prev, status: 'ACTIVE', isPaused: false }) : null);
    } finally {
      isResumingRef.current = false;
    }
  }, []);

  // Continuous Camera & Mic Device State Monitor (Every 500ms)
  useEffect(() => {
    const monitorInterval = setInterval(() => {
      const vTracks = mediaStreamRef.current?.getVideoTracks() || [];
      const aTracks = mediaStreamRef.current?.getAudioTracks() || [];
      const camLive = vTracks.length > 0 && vTracks.some(t => t.readyState === 'live' && t.enabled);
      const micLive = aTracks.length > 0 && aTracks.some(t => t.readyState === 'live' && t.enabled);

      setIsCamActive(camLive);
      setIsMicActive(micLive);

      const current = sessionRef.current;
      if (current && current.interviewId) {
        const isActive = current.status === 'ACTIVE' || current.status === 'IN_PROGRESS';
        const isPaused = current.status === 'PAUSED';

        if (isActive && (!camLive || !micLive)) {
          triggerPause(current.interviewId);
        } else if (isPaused && camLive && micLive && !isScreenInterrupted) {
          triggerResume(current.interviewId);
        }
      }
    }, 500);

    return () => clearInterval(monitorInterval);
  }, [triggerPause, triggerResume, isScreenInterrupted]);

  // Check latest interview on initial load (Persistence)
  useEffect(() => {
    const fetchLatest = async () => {
      try {
        const data = await apiService.getLatestInterview();
        if (data && data.interviewId) {
          setSession(data);
          sessionRef.current = data;
          if (data.recordingUrl) {
            setRecordedBlobUrl(data.recordingUrl);
          }
          if (Array.isArray(data.codingSubmissions)) {
            setCodingSubmissionsList(data.codingSubmissions);
          }
          if (data.challenge) {
            setActiveChallenge(data.challenge);
            if (data.challenge.starterCode && data.challenge.starterCode[selectedLanguage]) {
              setCodeContent(data.challenge.starterCode[selectedLanguage]);
            }
          }
          if (data.status === 'COMPLETED' || data.status === 'AUTO_SUBMITTED' || data.status === 'VIOLATION') {
            setActiveTab('dossier');
            updateAssessmentStage('RESULT');
          } else {
            setActiveTab('interview');
            const savedStage = localStorage.getItem('skillproof_assessment_stage');
            if (savedStage && ['INTERVIEW', 'INTERVIEW_COMPLETE', 'CODING', 'EVALUATION'].includes(savedStage)) {
              setAssessmentStage(savedStage);
            } else {
              updateAssessmentStage('INTERVIEW');
            }
          }
        } else {
          updateAssessmentStage('PRE_FLIGHT');
        }
      } catch (err) {
        console.warn('[Arena] Fetch latest interview note:', err.message);
      }
    };
    fetchLatest();
  }, [selectedLanguage]);

  // Tab switch & window blur proctoring violation handling
  const isViolatingRef = useRef(false);

  const handleInterviewViolation = useCallback(async (details) => {
    const current = sessionRef.current;
    if (!current?.interviewId) return;
    if (current.status === 'COMPLETED' || current.status === 'AUTO_SUBMITTED' || current.status === 'VIOLATION') return;
    if (isViolatingRef.current) return;

    isViolatingRef.current = true;
    console.warn('[Arena] PROCTORING VIOLATION: Candidate left assessment window / switched tabs.');

    handleStopRecording();

    try {
      const draftAns = studentInput || '';
      const draftCd = codeContent || '';
      const lang = selectedLanguage || 'javascript';
      const duration = recordingElapsedSeconds || 0;
      const recUrl = recordedBlobUrl || null;

      const res = await apiService.reportInterviewViolation(current.interviewId, {
        reason: details?.message || 'You left the assessment window. This attempt has been submitted automatically.',
        draftAnswer: draftAns,
        draftCode: draftCd,
        language: lang,
        durationSeconds: duration,
        recordingUrl: recUrl
      });

      if (res && res.interviewId) {
        setSession(res);
        sessionRef.current = res;
        setActiveTab('dossier');
        updateAssessmentStage('RESULT');
      }
      if (loadLiveStudentData) {
        await loadLiveStudentData();
      }
    } catch (err) {
      console.error('[Arena] Violation reporting error:', err);
      // Ensure UI updates to RESULT state regardless
      setActiveTab('dossier');
      updateAssessmentStage('RESULT');
    }
  }, [studentInput, codeContent, selectedLanguage, recordingElapsedSeconds, recordedBlobUrl, loadLiveStudentData]);

  // Visibility and blur event listeners
  useEffect(() => {
    const handleVisibilityOrBlur = (e) => {
      const current = sessionRef.current;
      const isActive = current && (current.status === 'ACTIVE' || current.status === 'IN_PROGRESS');
      if (!isActive) return;
      if (isSubmitting) return;
      if (isViolatingRef.current) return;

      const isHidden = document.hidden;
      const isBlur = e.type === 'blur';

      if (isHidden || isBlur) {
        handleInterviewViolation({
          reason: isHidden ? 'TAB_SWITCH_OR_HIDDEN' : 'WINDOW_BLUR_LEFT_ASSESSMENT',
          timestamp: new Date().toISOString(),
          message: 'You left the assessment window. This attempt has been submitted automatically.'
        });
      }
    };

    document.addEventListener('visibilitychange', handleVisibilityOrBlur);
    window.addEventListener('blur', handleVisibilityOrBlur);

    return () => {
      document.removeEventListener('visibilitychange', handleVisibilityOrBlur);
      window.removeEventListener('blur', handleVisibilityOrBlur);
    };
  }, [isSubmitting, handleInterviewViolation]);

  // Text-To-Speech Narration for AI questions
  const narrate = (text) => {
    if (!voiceNarration || !('speechSynthesis' in window)) return;
    try {
      window.speechSynthesis.cancel();
      const utterance = new SpeechSynthesisUtterance(text);
      utterance.rate = 1.0;
      utterance.pitch = 1.0;
      utterance.onstart = () => setIsAiSpeaking(true);
      utterance.onend = () => setIsAiSpeaking(false);
      utterance.onerror = () => setIsAiSpeaking(false);
      window.speechSynthesis.speak(utterance);
    } catch (e) {
      console.warn('[TTS] Synthesis warning:', e);
      setIsAiSpeaking(false);
    }
  };

  // Start Interview Arena Session with Camera, Mic & Screen Recording Verification
  const handleStartArena = async () => {
    const vTracks = mediaStreamRef.current?.getVideoTracks() || [];
    const aTracks = mediaStreamRef.current?.getAudioTracks() || [];
    const camLive = isCamActive && vTracks.length > 0 && vTracks.some(t => t.readyState === 'live' && t.enabled);
    const micLive = isMicActive && aTracks.length > 0 && aTracks.some(t => t.readyState === 'live' && t.enabled);
    const screenLive = screenSharingActive || isRecordingSession;

    console.log('[Arena] handleStartArena check -> camLive:', camLive, 'micLive:', micLive, 'screenLive:', screenLive);

    if (!camLive || !micLive || !screenLive) {
      console.log('[Arena] Device/Recording gate locked: opening locked modal');
      setShowLockedModal(true);
      return;
    }

    setIsStarting(true);
    setAnswerError(null);
    setLastTurnEvaluation(null);
    isViolatingRef.current = false;
    try {
      const data = await apiService.startInterview(selectedMode, studentProfile?.targetRole || 'Frontend Developer');
      if (data && data.interviewId) {
        setSession(data);
        sessionRef.current = data;
        setActiveTab('interview');
        updateAssessmentStage('INTERVIEW');
        if (data.challenge) {
          setActiveChallenge(data.challenge);
          if (data.challenge.starterCode && data.challenge.starterCode[selectedLanguage]) {
            setCodeContent(data.challenge.starterCode[selectedLanguage]);
          }
        }
        if (data.question) {
          narrate(data.question);
        }
      }
    } catch (err) {
      console.error('[Arena] Start interview error:', err.message);
    } finally {
      setIsStarting(false);
    }
  };

  // Enable Camera & Mic from Locked Modal
  const handleEnableCameraAndMic = async () => {
    const success = await startMedia();
    if (success) {
      const vTracks = mediaStreamRef.current?.getVideoTracks() || [];
      const aTracks = mediaStreamRef.current?.getAudioTracks() || [];
      const camLive = vTracks.length > 0 && vTracks.some(t => t.readyState === 'live' && t.enabled);
      const micLive = aTracks.length > 0 && aTracks.some(t => t.readyState === 'live' && t.enabled);

      if (camLive && micLive) {
        setShowLockedModal(false);
      }
    }
  };

  // Combined Screen + Candidate Camera Canvas Recording Pipeline
  const handleStartCombinedRecording = async () => {
    setShowRecordingConsentModal(false);
    try {
      let screenStream = null;
      const timeoutPromise = (ms) => new Promise((_, reject) => setTimeout(() => reject(new Error('DisplayMedia timeout')), ms));
      try {
        screenStream = await Promise.race([
          navigator.mediaDevices.getDisplayMedia({
            video: { cursor: 'always', width: 1280, height: 720 },
            audio: true
          }),
          timeoutPromise(400)
        ]);
      } catch (errDisplay) {
        console.warn('[ScreenRecord] getDisplayMedia unavailable, fallback to cloned camera stream:', errDisplay.message);
        if (mediaStreamRef.current) {
          screenStream = mediaStreamRef.current.clone();
        }
      }

      if (!screenStream) {
        throw new Error('No media stream available for canvas compositor');
      }

      screenStreamRef.current = screenStream;
      setScreenSharingActive(true);

      const screenTrack = screenStream.getVideoTracks()[0];
      if (screenTrack) {
        screenTrack.onended = () => {
          console.log('[ScreenRecord] Screen share stopped unexpectedly.');
          handleStopRecording();
          const current = sessionRef.current;
          if (current && (current.status === 'ACTIVE' || current.status === 'IN_PROGRESS')) {
            setIsScreenInterrupted(true);
            triggerPause(current.interviewId);
          }
        };
      }

      // Create offscreen video elements for drawing on canvas
      const screenVid = document.createElement('video');
      screenVid.srcObject = screenStream;
      screenVid.autoplay = true;
      screenVid.playsInline = true;
      screenVid.muted = true;
      await screenVid.play().catch(() => {});
      screenVideoRef.current = screenVid;

      const camVid = document.createElement('video');
      if (mediaStreamRef.current) {
        camVid.srcObject = mediaStreamRef.current;
        camVid.autoplay = true;
        camVid.playsInline = true;
        camVid.muted = true;
        await camVid.play().catch(() => {});
      }
      camVideoRef.current = camVid;

      // Offscreen canvas
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

        if (isCamActive && camVideoRef.current && camVideoRef.current.readyState >= 2) {
          const pipW = 280;
          const pipH = 175;
          const pipX = 1280 - pipW - 24;
          const pipY = 720 - pipH - 24;

          ctx.save();
          ctx.fillStyle = '#020617';
          ctx.fillRect(pipX - 3, pipY - 3, pipW + 6, pipH + 6);
          ctx.strokeStyle = '#2563eb';
          ctx.lineWidth = 2;
          ctx.strokeRect(pipX - 3, pipY - 3, pipW + 6, pipH + 6);

          try {
            ctx.drawImage(camVideoRef.current, pipX, pipY, pipW, pipH);
          } catch (e) {}

          ctx.fillStyle = 'rgba(2, 6, 23, 0.85)';
          ctx.fillRect(pipX, pipY + pipH - 24, pipW, 24);
          ctx.fillStyle = '#38bdf8';
          ctx.font = 'bold 11px sans-serif';
          ctx.fillText(`${studentProfile?.name || 'Candidate'} • Live Cam`, pipX + 10, pipY + pipH - 8);
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

      const canvasStream = canvas.captureStream(30);
      const micTrack = mediaStreamRef.current?.getAudioTracks()[0];
      if (micTrack) {
        canvasStream.addTrack(micTrack);
      }
      const screenAudio = screenStream.getAudioTracks()[0];
      if (screenAudio) {
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

      recorder.onstop = async () => {
        const recordedBlob = new Blob(recordingChunksRef.current, { type: 'video/webm' });
        const blobUrl = URL.createObjectURL(recordedBlob);
        setRecordedBlobUrl(blobUrl);

        if (session?.interviewId) {
          setIsSavingRecording(true);
          try {
            const formData = new FormData();
            formData.append('file', recordedBlob, `interview_${session.interviewId}_rec.webm`);
            formData.append('durationSeconds', recSecs);
            const res = await apiService.uploadInterviewRecording(session.interviewId, formData);
            if (res && res.recordingUrl) {
              setSession(prev => ({
                ...prev,
                recordingStatus: 'RECORDED',
                recordingUrl: res.recordingUrl,
                recordingDurationSeconds: recSecs
              }));
            }
          } catch (err) {
            console.warn('[Recording] Upload note:', err.message);
          } finally {
            setIsSavingRecording(false);
          }
        }
      };

      recorder.start(1000);
      mediaRecorderRef.current = recorder;
      setIsRecordingSession(true);

      // If screen share was previously interrupted, resume session
      const currentSes = sessionRef.current;
      if (currentSes?.interviewId && currentSes.status === 'PAUSED') {
        setIsScreenInterrupted(false);
        triggerResume(currentSes.interviewId);
      }
    } catch (err) {
      console.warn('[ScreenRecord] Start recording error:', err.message);
      setScreenSharingActive(false);
      setIsRecordingSession(false);
    }
  };

  const handleStopRecording = () => {
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
    if (screenStreamRef.current) {
      screenStreamRef.current.getTracks().forEach(t => t.stop());
      screenStreamRef.current = null;
    }
    setIsRecordingSession(false);
    setScreenSharingActive(false);
  };

  // Toggle Camera
  const toggleCamera = () => {
    if (mediaStreamRef.current) {
      const videoTracks = mediaStreamRef.current.getVideoTracks();
      const nextState = !isCamActive;
      videoTracks.forEach(track => { track.enabled = nextState; });
      setIsCamActive(nextState);

      const current = sessionRef.current;
      if (!nextState && (current?.status === 'ACTIVE' || current?.status === 'IN_PROGRESS')) {
        triggerPause(current.interviewId);
      } else if (nextState && isMicActive && current?.status === 'PAUSED' && !isScreenInterrupted) {
        triggerResume(current.interviewId);
      }
    }
  };

  // Toggle Microphone
  const toggleMic = () => {
    if (mediaStreamRef.current) {
      const audioTracks = mediaStreamRef.current.getAudioTracks();
      const nextState = !isMicActive;
      audioTracks.forEach(track => { track.enabled = nextState; });
      setIsMicActive(nextState);

      const current = sessionRef.current;
      if (!nextState && (current?.status === 'ACTIVE' || current?.status === 'IN_PROGRESS')) {
        triggerPause(current.interviewId);
      } else if (nextState && isCamActive && current?.status === 'PAUSED' && !isScreenInterrupted) {
        triggerResume(current.interviewId);
      }
    }
  };

  // Toggle STT Recording
  const toggleRecording = () => {
    if (!recognitionRef.current) return;
    if (isRecording) {
      recognitionRef.current.stop();
      setIsRecording(false);
    } else {
      try {
        recognitionRef.current.start();
        setIsRecording(true);
      } catch (err) {
        console.warn('[STT] Start error:', err);
      }
    }
  };

  // Submit Answer from Central Answer Input in AI Technical Interview
  const handleSubmitAnswer = async (e) => {
    if (e) e.preventDefault();
    if (isSubmitting || session?.status === 'PAUSED') return;

    const ta = document.getElementById('textarea-candidate-answer');
    const ans = (studentInput || (ta ? ta.value : '')).trim();
    if (!ans) {
      setAnswerError("Answer required. Please answer this question before continuing.");
      return;
    }
    setAnswerError(null);

    if (isRecording && recognitionRef.current) {
      recognitionRef.current.stop();
      setIsRecording(false);
    }

    setIsSubmitting(true);
    const submittedTurnNum = session?.currentTurn || 1;
    setStudentInput('');
    if (ta) ta.value = '';

    try {
      const res = await apiService.submitInterviewAnswer(
        session.interviewId,
        ans,
        null,
        selectedLanguage
      );

      if (res) {
        const evalObj = res.lastTurnEvaluation || (res.lastTurnScore !== undefined ? {
          score: res.lastTurnScore,
          feedback: res.lastTurnFeedback,
          evaluatedSkill: res.lastTurnSkill,
          turnNumber: submittedTurnNum
        } : null);
        if (evalObj) {
          setLastTurnEvaluation({
            score: evalObj.score,
            feedback: evalObj.feedback,
            testedSkill: evalObj.evaluatedSkill || evalObj.testedSkill || 'Technical Knowledge',
            turnNumber: evalObj.turnNumber || submittedTurnNum
          });
        }

        setSession(res);
        sessionRef.current = res;
        setElapsedSeconds(0);

        // If turn 10 completed or backend completed interview, transition to Step 3: INTERVIEW_COMPLETE
        if (submittedTurnNum >= 10 || res.status === 'COMPLETED') {
          updateAssessmentStage('INTERVIEW_COMPLETE');
          narrate("Technical interview completed. Please proceed to the coding contest.");
        } else if (res.question) {
          narrate(res.question);
        }
      }
    } catch (err) {
      console.error('[Arena] Submit answer error:', err.message);
      const errMsg = err.message?.includes('Answer required')
        ? "Answer required. Please answer this question before continuing."
        : (err.message || "Failed to submit answer.");
      setAnswerError(errMsg);
    } finally {
      setIsSubmitting(false);
    }
  };

  // Transition from Step 3 (Interview Complete) to Step 4 (Coding Contest)
  const handleContinueToCoding = () => {
    updateAssessmentStage('CODING');
    if (activeChallenge?.starterCode?.[selectedLanguage]) {
      setCodeContent(activeChallenge.starterCode[selectedLanguage]);
    }
  };

  // Run Code via Live Test Runner in Coding Contest
  const handleRunCode = async () => {
    const ed = document.getElementById('textarea-code-editor');
    const code = (codeContent || (ed ? ed.value : '')).trim();
    if (!session?.interviewId || !code || isRunningCode || session?.status === 'PAUSED') return;
    setIsRunningCode(true);
    try {
      const probId = activeChallenge?.id || 'two-sum';
      const result = await apiService.runInterviewCode(session.interviewId, code, selectedLanguage, probId);
      setCodeExecutionResult(result);
      try {
        const subs = await apiService.getInterviewCodingSubmissions(session.interviewId);
        if (Array.isArray(subs)) {
          setCodingSubmissionsList(subs);
        }
      } catch (e) {}
    } catch (err) {
      console.error('[Arena] Run code error:', err.message);
      setCodeExecutionResult({
        success: false,
        verdict: 'COMPILATION_ERROR',
        stderr: err.message,
        passedTests: 0,
        totalTests: activeChallenge?.testCases?.length || 5,
        testResults: []
      });
    } finally {
      setIsRunningCode(false);
    }
  };

  // Submit Code in Step 4 -> Transition to Step 5 (Evaluation) -> Step 6 (Result)
  const handleFinalCodeSubmit = async () => {
    if (isSubmitting || session?.status === 'PAUSED') return;

    const ed = document.getElementById('textarea-code-editor');
    const code = (codeContent || (ed ? ed.value : '')).trim();
    if (!code) {
      setAnswerError("Please write code before submitting your solution.");
      return;
    }
    setAnswerError(null);
    setIsSubmitting(true);

    try {
      const probId = activeChallenge?.id || 'two-sum';
      try {
        const runRes = await apiService.runInterviewCode(session.interviewId, code, selectedLanguage, probId);
        setCodeExecutionResult(runRes);
      } catch (e) {}

      const res = await apiService.submitInterviewAnswer(
        session.interviewId,
        'Final code submission for coding contest.',
        code,
        selectedLanguage
      );

      // Step 5: Transition to EVALUATION state
      updateAssessmentStage('EVALUATION');

      // Step 6: After brief calculation period, finalize to RESULT
      setTimeout(async () => {
        if (res) {
          setSession(res);
          sessionRef.current = res;
        }
        if (isRecordingSession) {
          handleStopRecording();
        }
        setActiveTab('dossier');
        updateAssessmentStage('RESULT');
        if (loadLiveStudentData) {
          await loadLiveStudentData();
        }
        narrate("Assessment successfully completed. Your verified evidence dossier has been generated.");
      }, 1500);

    } catch (err) {
      console.error('[Arena] Submit code error:', err.message);
      updateAssessmentStage('EVALUATION');
      setTimeout(async () => {
        if (isRecordingSession) handleStopRecording();
        setActiveTab('dossier');
        updateAssessmentStage('RESULT');
        if (loadLiveStudentData) await loadLiveStudentData();
      }, 1500);
    } finally {
      setIsSubmitting(false);
    }
  };

  // Request Progressive Hint
  const handleRequestHint = async () => {
    if (!session?.interviewId || isRequestingHint || session?.status === 'PAUSED') return;
    setIsRequestingHint(true);
    try {
      const probId = activeChallenge?.id || 'two-sum';
      const data = await apiService.requestInterviewHint(session.interviewId, probId);
      if (data && data.hint) {
        setHintsList(prev => [...prev, data.hint]);
      }
    } catch (err) {
      console.warn('[Arena] Hint error:', err.message);
    } finally {
      setIsRequestingHint(false);
    }
  };

  // Early Finish
  const handleEndEarly = async () => {
    if (!session?.interviewId) return;
    if (isRecordingSession) {
      handleStopRecording();
    }
    try {
      const res = await apiService.endInterviewEarly(session.interviewId);
      if (res) {
        setSession(prev => ({ ...prev, ...res }));
        if (res.recordingUrl) setRecordedBlobUrl(res.recordingUrl);
        if (Array.isArray(res.codingSubmissions)) setCodingSubmissionsList(res.codingSubmissions);
        setActiveTab('dossier');
        updateAssessmentStage('RESULT');
        if (loadLiveStudentData) await loadLiveStudentData();
      }
    } catch (err) {
      console.error('[Arena] End early error:', err.message);
      setActiveTab('dossier');
      updateAssessmentStage('RESULT');
    }
  };

  // Reset or Start New Arena Session
  const handleResetSession = async () => {
    if (session?.interviewId && (session.status === 'ACTIVE' || session.status === 'PAUSED')) {
      try {
        await apiService.endInterviewEarly(session.interviewId);
      } catch (e) {}
    }
    setSession(null);
    sessionRef.current = null;
    setLastTurnEvaluation(null);
    setAnswerError(null);
    setIsScreenInterrupted(false);
    setActiveTab('interview');
    updateAssessmentStage('PRE_FLIGHT');
  };

  // Switch Language Starter Code in Coding Contest
  const handleLanguageChange = (lang) => {
    setSelectedLanguage(lang);
    if (activeChallenge?.starterCode?.[lang]) {
      setCodeContent(activeChallenge.starterCode[lang]);
    } else if (DEFAULT_CHALLENGE.starterCode[lang]) {
      setCodeContent(DEFAULT_CHALLENGE.starterCode[lang]);
    }
  };

  // Format Elapsed Time
  const formatTime = (secs) => {
    const mins = Math.floor(secs / 60);
    const rem = secs % 60;
    return `${mins.toString().padStart(2, '0')}:${rem.toString().padStart(2, '0')}`;
  };

  const isAutoSubmitted = session?.status === 'AUTO_SUBMITTED' || session?.status === 'VIOLATION';
  const isCompleted = session?.status === 'COMPLETED' || isAutoSubmitted || assessmentStage === 'RESULT';
  const isPaused = session?.status === 'PAUSED';
  const isInProgress = session && (session.status === 'ACTIVE' || session.status === 'IN_PROGRESS');
  const currentTurn = session?.currentTurn || 1;
  const maxTurns = session?.maxTurns || 10;

  return (
    <div className="space-y-6 max-w-7xl mx-auto pb-16">
      {/* ========================================================================= */}
      {/* 1. TOP STEP INDICATOR (Authoritative 6-Stage Progression)                 */}
      {/* ========================================================================= */}
      <div id="container-step-indicator" className="p-3.5 sm:p-4 rounded-2xl bg-white border border-[#E2E8F0] shadow-sm flex items-center justify-between overflow-x-auto gap-2">
        {ASSESSMENT_STEPS.map((step, idx, arr) => {
          const stageOrder = ['PRE_FLIGHT', 'INTERVIEW', 'INTERVIEW_COMPLETE', 'CODING', 'EVALUATION', 'RESULT'];
          const currentIndex = stageOrder.indexOf(assessmentStage);
          const stepIndex = stageOrder.indexOf(step.id);
          const isCurrent = assessmentStage === step.id;
          const isPast = stepIndex < currentIndex;

          return (
            <React.Fragment key={step.id}>
              <div
                id={`step-indicator-${step.legacyId}`}
                className={`flex items-center gap-2 px-3 py-1.5 rounded-full text-xs font-bold font-mono whitespace-nowrap transition-all ${
                  isCurrent
                    ? 'bg-blue-600 text-white shadow-sm ring-2 ring-blue-500/20'
                    : isPast
                    ? 'bg-emerald-50 text-emerald-700 border border-emerald-200'
                    : 'bg-white text-slate-400 border border-[#E2E8F0]'
                }`}
              >
                <span className={`w-4 h-4 rounded-full flex items-center justify-center text-[10px] ${
                  isCurrent ? 'bg-white text-blue-600' : isPast ? 'bg-emerald-600 text-white font-black' : 'bg-slate-100 text-slate-500'
                }`}>
                  {isPast ? '✓' : step.num}
                </span>
                <span>{step.label}</span>
              </div>
              {idx < arr.length - 1 && (
                <span className="text-slate-300 font-bold hidden md:inline">&rarr;</span>
              )}
            </React.Fragment>
          );
        })}
      </div>

      {/* ========================================================================= */}
      {/* 2. TOP HEADER & TELEMETRY CONTROLS BAR (Shared Across Assessment)        */}
      {/* ========================================================================= */}
      <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4 bg-white p-6 rounded-2xl border border-[#E2E8F0] shadow-[0_4px_20px_rgba(15,23,42,0.03)]">
        <div className="space-y-1">
          <div className="flex flex-wrap items-center gap-2">
            <span className="text-xs font-bold uppercase tracking-wider px-3 py-1 rounded-full bg-blue-50 text-blue-600 border border-blue-100 flex items-center gap-1.5">
              <Flame className="w-3.5 h-3.5 text-amber-500" />
              SKILLPROOF AI ARENA
            </span>
            <span className="text-[11px] font-mono font-semibold px-2.5 py-0.5 rounded-full bg-emerald-50 text-emerald-700 border border-emerald-200">
              Tier 4 Credential Engine
            </span>
            {session && (
              <span className="text-[11px] font-mono px-2.5 py-0.5 rounded-full bg-slate-100 text-slate-700 border border-slate-200">
                Mode: {session.mode || selectedMode}
              </span>
            )}
          </div>
          <h1 className="text-2xl font-black text-slate-900 tracking-tight flex items-center gap-2">
            {assessmentStage === 'PRE_FLIGHT' && <span>Adaptive AI Technical Interview Room</span>}
            {assessmentStage === 'INTERVIEW' && <span>AI Technical Interview — Step 2: Technical Defense</span>}
            {assessmentStage === 'INTERVIEW_COMPLETE' && <span>Technical Interview Complete — Step 3</span>}
            {assessmentStage === 'CODING' && <span>SkillProof Coding Contest — Step 4: Live Sandbox</span>}
            {assessmentStage === 'EVALUATION' && <span>Evaluating Assessment & Rubric — Step 5</span>}
            {assessmentStage === 'RESULT' && <span>Verified Interview Evidence Dossier — Step 6</span>}
          </h1>
          <p className="text-xs text-slate-500">
            Sequential assessment workflow: Technical Cross-Examination &rarr; Completion &rarr; Coding Contest &rarr; Verification.
          </p>
        </div>

        {/* Live Controls Bar */}
        <div className="flex flex-wrap items-center gap-2 sm:gap-3">
          {/* Active Interview Timer */}
          {session && assessmentStage === 'INTERVIEW' && (
            <div className="flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-white border border-[#E2E8F0] shadow-sm">
              <Timer className={`w-3.5 h-3.5 text-amber-500 ${!isPaused ? 'animate-pulse' : ''}`} />
              <span id="interview-timer" className="text-xs font-mono font-bold text-slate-900">{formatTime(elapsedSeconds)}</span>
              <span className="text-[11px] text-slate-500">| Turn {currentTurn} of {maxTurns}</span>
            </div>
          )}

          {/* Coding Contest Live Timer */}
          {session && assessmentStage === 'CODING' && (
            <div className="flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-amber-50 border border-amber-200 shadow-sm">
              <Clock className="w-3.5 h-3.5 text-amber-600 animate-pulse" />
              <span className="text-xs font-mono font-bold text-amber-900">Time Remaining: {formatTime(codingTimeRemaining)}</span>
            </div>
          )}

          {/* Session Status Badge */}
          {session && (
            <span
              id="badge-interview-status"
              className={`text-xs font-mono font-bold px-3 py-1.5 rounded-full border flex items-center gap-1.5 shadow-sm ${
                isAutoSubmitted
                  ? 'bg-rose-50 text-rose-700 border-rose-200'
                  : isCompleted
                  ? 'bg-emerald-50 text-emerald-700 border-emerald-200'
                  : isPaused
                  ? 'bg-rose-50 text-rose-700 border-rose-200 animate-pulse'
                  : 'bg-emerald-50 text-emerald-700 border-emerald-200'
              }`}
            >
              <span className={`w-2 h-2 rounded-full ${isAutoSubmitted || isPaused ? 'bg-rose-500' : 'bg-emerald-500'}`} />
              <span>{isAutoSubmitted ? 'AUTO_SUBMITTED' : isCompleted ? 'COMPLETED' : isPaused ? 'PAUSED' : 'ACTIVE'}</span>
            </span>
          )}

          {/* Continuous Screen Recording Status Indicator (🔴 RECORDING vs ⚪ NOT RECORDING) */}
          <div
            id="badge-recording-status"
            className={`flex items-center gap-1.5 px-3 py-1.5 rounded-full border text-xs font-mono font-bold transition-all shadow-sm ${
              isRecordingSession
                ? 'bg-rose-50 border-rose-200 text-rose-700 animate-pulse'
                : 'bg-slate-100 border-slate-200 text-slate-600'
            }`}
          >
            {isRecordingSession ? (
              <span className="flex items-center gap-1.5">
                <span className="w-2 h-2 rounded-full bg-rose-500 animate-ping" />
                <span>🔴 RECORDING [{formatTime(recordingElapsedSeconds)}]</span>
              </span>
            ) : (
              <span className="flex items-center gap-1.5">
                <span className="w-2 h-2 rounded-full bg-slate-400" />
                <span>⚪ NOT RECORDING</span>
              </span>
            )}
          </div>

          {/* Media & Recording Controls for Active Sessions */}
          {session && !isCompleted && (
            <>
              {/* [📹 Camera] */}
              <button
                id="btn-toolbar-camera"
                onClick={toggleCamera}
                title={isCamActive ? "Disable Camera" : "Enable Camera"}
                className={`px-3 py-1.5 rounded-full border text-xs font-semibold flex items-center gap-1.5 transition-colors shadow-sm ${
                  isCamActive
                    ? 'bg-white border-slate-300 text-slate-700 hover:bg-slate-50'
                    : 'bg-rose-50 border-rose-200 text-rose-700'
                }`}
              >
                {isCamActive ? <Video className="w-3.5 h-3.5 text-blue-600" /> : <VideoOff className="w-3.5 h-3.5" />}
                <span>{isCamActive ? 'Camera ON' : 'Camera OFF'}</span>
              </button>

              {/* [🎤 Mic] */}
              <button
                id="btn-toolbar-mic"
                onClick={toggleMic}
                title={isMicActive ? "Mute Microphone" : "Unmute Microphone"}
                className={`px-3 py-1.5 rounded-full border text-xs font-semibold flex items-center gap-1.5 transition-colors shadow-sm ${
                  isMicActive
                    ? 'bg-white border-slate-300 text-slate-700 hover:bg-slate-50'
                    : 'bg-rose-50 border-rose-200 text-rose-700'
                }`}
              >
                {isMicActive ? <Mic className="w-3.5 h-3.5 text-emerald-600" /> : <MicOff className="w-3.5 h-3.5" />}
                <span>{isMicActive ? 'Mic ON' : 'Mic OFF'}</span>
              </button>

              {/* [🔴 Start Recording] / [⏹ Stop Recording] */}
              {!isRecordingSession ? (
                <button
                  id="btn-toolbar-start-recording"
                  onClick={() => setShowRecordingConsentModal(true)}
                  className="px-4 py-1.5 rounded-full bg-rose-600 hover:bg-rose-700 text-white text-xs font-bold flex items-center gap-1.5 shadow-sm transition-all"
                >
                  <Disc className="w-3.5 h-3.5 text-white animate-pulse" />
                  <span>Start Recording</span>
                </button>
              ) : (
                <button
                  id="btn-toolbar-stop-recording"
                  onClick={handleStopRecording}
                  disabled={isSavingRecording}
                  className="px-4 py-1.5 rounded-full bg-rose-50 hover:bg-rose-100 text-rose-700 border border-rose-200 text-xs font-bold flex items-center gap-1.5 transition-all shadow-sm"
                >
                  <StopCircle className="w-3.5 h-3.5 text-rose-600" />
                  <span>{isSavingRecording ? 'Saving WebM...' : 'Stop Recording'}</span>
                </button>
              )}
            </>
          )}

          {/* Voice Narration Toggle */}
          <button
            onClick={() => {
              if (voiceNarration) window.speechSynthesis?.cancel();
              setVoiceNarration(!voiceNarration);
            }}
            title={voiceNarration ? "Voice Narration Active" : "Voice Muted"}
            className={`px-3 py-1.5 rounded-full border text-xs font-semibold flex items-center gap-1.5 transition-colors shadow-sm ${
              voiceNarration
                ? 'bg-blue-50 border-blue-200 text-blue-700'
                : 'bg-white border-slate-200 text-slate-500'
            }`}
          >
            {voiceNarration ? <Volume2 className="w-4 h-4 text-blue-600" /> : <VolumeX className="w-4 h-4" />}
            <span className="hidden sm:inline">{voiceNarration ? 'AI Voice On' : 'Voice Off'}</span>
          </button>

          {/* End Interview Early */}
          {isInProgress && !isCompleted && (
            <button
              onClick={handleEndEarly}
              className="px-4 py-1.5 rounded-full bg-rose-50 hover:bg-rose-100 text-rose-700 border border-rose-200 text-xs font-semibold flex items-center gap-1.5 transition-all shadow-sm"
            >
              <AlertTriangle className="w-3.5 h-3.5 text-rose-600" />
              <span>End Early</span>
            </button>
          )}

          {/* Reset / New Arena Session Button */}
          <button
            id="btn-reset-session"
            onClick={handleResetSession}
            disabled={isStarting || isAutoSubmitted}
            title={isAutoSubmitted ? "This attempt was auto-submitted due to violation. Restarting is blocked." : ""}
            className={`px-5 py-2 rounded-full text-xs font-bold flex items-center gap-2 shadow-sm transition-all ${
              isAutoSubmitted
                ? 'bg-slate-100 text-slate-400 cursor-not-allowed border border-slate-200'
                : 'bg-blue-600 hover:bg-blue-700 text-white cursor-pointer shadow-blue-600/20'
            }`}
          >
            <RefreshCw className={`w-3.5 h-3.5 ${isStarting ? 'animate-spin' : ''}`} />
            <span>{isInProgress || isPaused ? 'Reset' : 'New Arena Session'}</span>
          </button>
        </div>
      </div>

      {/* ========================================================================= */}
      {/* STEP 1: PRE-FLIGHT GATE SCREEN                                            */}
      {/* ========================================================================= */}
      {assessmentStage === 'PRE_FLIGHT' && !session && (
        <div className="space-y-6 animate-fadeIn">
          {/* Hero Banner */}
          <div className="p-6 sm:p-8 rounded-2xl bg-gradient-to-r from-blue-600 to-indigo-600 text-white shadow-[0_8px_30px_rgba(37,99,235,0.2)] flex flex-col md:flex-row items-center justify-between gap-6">
            <div className="space-y-2 text-center md:text-left">
              <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-white/20 text-white text-xs font-semibold tracking-wide">
                <Sparkles className="w-3.5 h-3.5" />
                <span>AI INTERVIEW ARENA</span>
              </div>
              <h2 className="text-2xl sm:text-3xl font-black text-white">Real Questions. Real Feedback. A Stronger You.</h2>
              <p className="text-xs sm:text-sm text-blue-100 max-w-xl leading-relaxed">
                Experience standardized technical and behavioral simulations with real-time AI evaluation, biometric audit recordings, and instant verified passport credentials.
              </p>
            </div>
            <div className="w-20 h-20 rounded-2xl bg-white/10 backdrop-blur-sm border border-white/20 flex items-center justify-center text-white shrink-0 shadow-inner">
              <BrainCircuit className="w-10 h-10 text-white" />
            </div>
          </div>

          {/* Pre-flight Media & Screen Recording Readiness Card */}
          <div className="p-6 rounded-2xl bg-white border border-[#E2E8F0] space-y-4 shadow-[0_4px_20px_rgba(15,23,42,0.03)]">
            <div className="flex items-center justify-between pb-3 border-b border-[#E2E8F0]">
              <span className="text-xs font-bold uppercase tracking-wider text-slate-800 flex items-center gap-2">
                <ShieldCheck className="w-4 h-4 text-blue-600" />
                <span>Pre-flight Equipment Readiness</span>
              </span>
              <span className="text-[11px] font-mono text-slate-500">Camera, Microphone & Screen Recording</span>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
              {/* Camera status */}
              <div id="preflight-camera-status" className={`p-3.5 rounded-xl border text-xs font-mono flex items-center justify-between transition-all ${
                isCamActive ? 'bg-emerald-50 border-emerald-200 text-emerald-800' : 'bg-rose-50 border-rose-200 text-rose-800'
              }`}>
                <div className="flex items-center gap-2.5">
                  {isCamActive ? <Video className="w-4 h-4 text-emerald-600" /> : <VideoOff className="w-4 h-4 text-rose-500" />}
                  <span className="font-bold">{isCamActive ? 'Camera ✓' : 'Camera'}</span>
                </div>
                <span className="font-bold">{isCamActive ? 'READY' : 'REQUIRED'}</span>
              </div>

              {/* Mic status */}
              <div id="preflight-mic-status" className={`p-3.5 rounded-xl border text-xs font-mono flex items-center justify-between transition-all ${
                isMicActive ? 'bg-emerald-50 border-emerald-200 text-emerald-800' : 'bg-rose-50 border-rose-200 text-rose-800'
              }`}>
                <div className="flex items-center gap-2.5">
                  {isMicActive ? <Mic className="w-4 h-4 text-emerald-600" /> : <MicOff className="w-4 h-4 text-rose-500" />}
                  <span className="font-bold">{isMicActive ? 'Microphone ✓' : 'Microphone'}</span>
                </div>
                <span className="font-bold">{isMicActive ? 'READY' : 'REQUIRED'}</span>
              </div>

              {/* Screen recording toggle */}
              <div id="preflight-recording-status" className={`p-3.5 rounded-xl border text-xs font-mono flex items-center justify-between transition-all ${
                (isRecordingSession || screenSharingActive) ? 'bg-emerald-50 border-emerald-200 text-emerald-800' : 'bg-rose-50 border-rose-200 text-rose-800'
              }`}>
                <div className="flex items-center gap-2.5">
                  <Monitor className={`w-4 h-4 ${(isRecordingSession || screenSharingActive) ? 'text-emerald-600' : 'text-rose-500'}`} />
                  <span className="font-bold">{(isRecordingSession || screenSharingActive) ? 'Screen Recording ✓' : 'Screen Recording'}</span>
                </div>
                {!(isRecordingSession || screenSharingActive) ? (
                  <button
                    id="btn-preflight-screen-recording"
                    onClick={() => setShowRecordingConsentModal(true)}
                    className="px-3 py-1 rounded-full bg-blue-600 hover:bg-blue-700 text-white text-[11px] font-bold shadow-sm transition-all"
                  >
                    Authorize
                  </button>
                ) : (
                  <span className="font-bold text-emerald-700">ACTIVE</span>
                )}
              </div>
            </div>

            {/* Mandatory Proctoring Notice */}
            <div id="notice-proctoring-enforcement" className="p-4 rounded-xl bg-amber-50 border border-amber-200 text-amber-900 text-xs flex items-center gap-3">
              <AlertTriangle className="w-4 h-4 text-amber-600 shrink-0" />
              <span>
                <strong>Mandatory Proctoring Notice:</strong> Switching tabs or leaving this window will automatically submit your attempt. Camera, Microphone, and Screen Recording are all required before starting.
              </span>
            </div>
          </div>

          {/* 4 Arena Mode Cards */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
            {/* Mode 1: Technical Interview */}
            <div
              id="card-mode-technical"
              onClick={() => setSelectedMode('TECHNICAL')}
              className={`cursor-pointer p-6 rounded-2xl border transition-all space-y-3 relative flex flex-col justify-between ${
                selectedMode === 'TECHNICAL'
                  ? 'bg-blue-50/40 border-blue-600 ring-2 ring-blue-500/20 shadow-md'
                  : 'bg-white border-[#E2E8F0] hover:border-slate-300 shadow-[0_4px_20px_rgba(15,23,42,0.03)]'
              }`}
            >
              <div className="space-y-3">
                <div className="w-12 h-12 rounded-xl bg-blue-50 border border-blue-100 flex items-center justify-center text-blue-600">
                  <BrainCircuit className="w-6 h-6" />
                </div>
                <div>
                  <h3 className="text-sm font-bold text-slate-900">Technical Interview</h3>
                  <span className="text-[11px] text-blue-600 font-semibold">Architecture & Core Stack</span>
                </div>
                <p className="text-xs text-slate-500 leading-relaxed">
                  Sequential 10-question technical cross-examination covering system architecture, database ACID properties, concurrency, and core algorithms.
                </p>
              </div>
              <div className="pt-3 border-t border-slate-100 text-[11px] text-slate-400 font-medium">10 Questions • Sequential Flow</div>
            </div>

            {/* Mode 2: Project Defense */}
            <div
              id="card-mode-project-defense"
              onClick={() => setSelectedMode('PROJECT_DEFENSE')}
              className={`cursor-pointer p-6 rounded-2xl border transition-all space-y-3 relative flex flex-col justify-between ${
                selectedMode === 'PROJECT_DEFENSE'
                  ? 'bg-blue-50/40 border-blue-600 ring-2 ring-blue-500/20 shadow-md'
                  : 'bg-white border-[#E2E8F0] hover:border-slate-300 shadow-[0_4px_20px_rgba(15,23,42,0.03)]'
              }`}
            >
              <div className="space-y-3">
                <div className="w-12 h-12 rounded-xl bg-cyan-50 border border-cyan-100 flex items-center justify-center text-cyan-600">
                  <Layers className="w-6 h-6" />
                </div>
                <div>
                  <h3 className="text-sm font-bold text-slate-900">Project Defense</h3>
                  <span className="text-[11px] text-cyan-600 font-semibold">GitHub & Mentorship Cross-Exam</span>
                </div>
                <p className="text-xs text-slate-500 leading-relaxed">
                  Direct cross-examination on your actual repositories, faculty mentorship project, state handling, and commit logic.
                </p>
              </div>
              <div className="pt-3 border-t border-slate-100 text-[11px] text-slate-400 font-medium">10 Questions • Codebase Interrogation</div>
            </div>

            {/* Mode 3: Competitive Coding */}
            <div
              id="card-mode-competitive-coding"
              onClick={() => setSelectedMode('COMPETITIVE_CODING')}
              className={`cursor-pointer p-6 rounded-2xl border transition-all space-y-3 relative flex flex-col justify-between ${
                selectedMode === 'COMPETITIVE_CODING'
                  ? 'bg-blue-50/40 border-blue-600 ring-2 ring-blue-500/20 shadow-md'
                  : 'bg-white border-[#E2E8F0] hover:border-slate-300 shadow-[0_4px_20px_rgba(15,23,42,0.03)]'
              }`}
            >
              <div className="space-y-3">
                <div className="w-12 h-12 rounded-xl bg-amber-50 border border-amber-100 flex items-center justify-center text-amber-600">
                  <Code2 className="w-6 h-6" />
                </div>
                <div>
                  <h3 className="text-sm font-bold text-slate-900">Competitive Coding</h3>
                  <span className="text-[11px] text-amber-600 font-semibold">Live Sandbox & Test Suite</span>
                </div>
                <p className="text-xs text-slate-500 leading-relaxed">
                  Embedded editor in Java, Python, or JS. Public & hidden test runner, algorithmic profiling, and Big-O analysis.
                </p>
              </div>
              <div className="pt-3 border-t border-slate-100 text-[11px] text-slate-400 font-medium">Live Compiler Execution</div>
            </div>

            {/* Mode 4: Full Placement Simulation */}
            <div
              id="card-mode-full-simulation"
              onClick={() => setSelectedMode('FULL_SIMULATION')}
              className={`cursor-pointer p-6 rounded-2xl border transition-all space-y-3 relative flex flex-col justify-between ${
                selectedMode === 'FULL_SIMULATION'
                  ? 'bg-blue-50/40 border-blue-600 ring-2 ring-blue-500/20 shadow-md'
                  : 'bg-white border-[#E2E8F0] hover:border-slate-300 shadow-[0_4px_20px_rgba(15,23,42,0.03)]'
              }`}
            >
              <div className="absolute -top-2.5 -right-2.5 px-3 py-0.5 rounded-full bg-blue-600 text-[10px] font-bold text-white uppercase shadow-sm">
                Flagship
              </div>
              <div className="space-y-3">
                <div className="w-12 h-12 rounded-xl bg-purple-50 border border-purple-100 flex items-center justify-center text-purple-600">
                  <Sparkles className="w-6 h-6" />
                </div>
                <div>
                  <h3 className="text-sm font-bold text-slate-900">Full Placement Simulation</h3>
                  <span className="text-[11px] text-purple-600 font-semibold">Comprehensive 5-Stage Round</span>
                </div>
                <p className="text-xs text-slate-500 leading-relaxed">
                  Complete engineering assessment: technical core, project defense, live coding challenge, cross-examination, and culture.
                </p>
              </div>
              <div className="pt-3 border-t border-slate-100 text-[11px] text-slate-400 font-medium">10 Questions • Full Tier 4 Rubric</div>
            </div>
          </div>

          <div className="flex flex-col sm:flex-row items-center justify-between p-5 rounded-2xl bg-white border border-[#E2E8F0] shadow-sm gap-4">
            <div className="flex items-center gap-3">
              <div className={`w-3 h-3 rounded-full ${(!isCamActive || !isMicActive || !(screenSharingActive || isRecordingSession)) ? 'bg-amber-400' : 'bg-emerald-500 animate-pulse'}`} />
              <div className="text-xs text-slate-600">
                {(!isCamActive || !isMicActive || !(screenSharingActive || isRecordingSession)) ? (
                  <span className="text-amber-800 font-semibold">Please authorize Camera, Microphone, and Screen Recording to unlock the Arena.</span>
                ) : (
                  <span>All pre-flight checks verified. Ready to initiate defense for: <strong className="text-slate-900">{studentProfile?.targetRole || 'Frontend Developer'}</strong>.</span>
                )}
              </div>
            </div>
            <button
              id="btn-start-arena"
              onClick={handleStartArena}
              disabled={isStarting || !isCamActive || !isMicActive || !(screenSharingActive || isRecordingSession)}
              title={(!isCamActive || !isMicActive || !(screenSharingActive || isRecordingSession)) ? "Camera, Microphone, and Screen Recording must all be active to start." : ""}
              className={`w-full sm:w-auto px-7 py-3 rounded-full font-bold text-xs flex items-center justify-center gap-2 shadow-sm transition-all shrink-0 ${
                (isStarting || !isCamActive || !isMicActive || !(screenSharingActive || isRecordingSession))
                  ? 'bg-slate-100 text-slate-400 cursor-not-allowed border border-slate-200'
                  : 'bg-blue-600 hover:bg-blue-700 text-white cursor-pointer shadow-blue-600/20'
              }`}
            >
              <PlayCircle className="w-4 h-4" />
              <span>{isStarting ? 'Setting up Live Arena...' : `Start ${selectedMode.replace(/_/g, ' ')}`}</span>
            </button>
          </div>
        </div>
      )}

      {/* ========================================================================= */}
      {/* STEP 2: AI TECHNICAL INTERVIEW ROOM (NO CODING EDITOR VISIBLE)             */}
      {/* ========================================================================= */}
      {assessmentStage === 'INTERVIEW' && session && (
        <div className="space-y-5 animate-fadeIn">
          {/* Sequential 10-Question Indicator Pill Bar */}
          <div className="p-4 rounded-2xl bg-white border border-[#E2E8F0] shadow-sm flex flex-col sm:flex-row sm:items-center justify-between gap-3">
            <div className="space-y-1">
              <div className="flex items-center gap-2">
                <span className="text-xs font-bold text-slate-900 uppercase tracking-wider">AI Technical Interview</span>
                <span className="text-xs font-mono font-bold text-blue-600">Question {currentTurn} of {maxTurns}</span>
              </div>
              <p className="text-[11px] text-slate-500">Answer each question sequentially. Defend your engineering architecture to unlock the coding round.</p>
            </div>

            {/* 10-Question Pills */}
            <div className="flex items-center gap-1.5 overflow-x-auto py-1">
              {Array.from({ length: maxTurns }, (_, i) => {
                const turnNum = i + 1;
                const isPassed = turnNum < currentTurn;
                const isActive = turnNum === currentTurn;

                return (
                  <div
                    key={turnNum}
                    className={`w-8 h-8 rounded-xl flex items-center justify-center text-xs font-mono font-bold transition-all shrink-0 ${
                      isActive
                        ? 'bg-blue-600 text-white shadow-md shadow-blue-600/20 ring-2 ring-blue-500/30'
                        : isPassed
                        ? 'bg-emerald-50 text-emerald-700 border border-emerald-200'
                        : 'bg-slate-100 text-slate-400 border border-slate-200'
                    }`}
                  >
                    {isPassed ? <Check className="w-3.5 h-3.5 text-emerald-600" /> : turnNum}
                  </div>
                );
              })}
            </div>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-12 gap-5 items-start">
            {/* LEFT COLUMN: AI Interviewer Presence & Live Candidate Feed */}
            <div className="lg:col-span-4 space-y-4">
              {/* AI Technical Interviewer Card */}
              <div id="panel-ai-interviewer" className="p-5 rounded-2xl bg-white border border-[#E2E8F0] shadow-sm space-y-4">
                <div className="flex items-center justify-between pb-3 border-b border-[#E2E8F0]">
                  <div className="flex items-center gap-2">
                    <div className="w-7 h-7 rounded-lg bg-blue-50 border border-blue-100 flex items-center justify-center text-blue-600">
                      <BrainCircuit className="w-4 h-4" />
                    </div>
                    <span className="text-xs font-bold text-slate-900">AI Technical Interviewer</span>
                  </div>
                  <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-blue-50 text-blue-700 border border-blue-200 font-semibold">
                    Real-time Examiner
                  </span>
                </div>

                {/* Avatar Visualizer */}
                <div className="h-36 rounded-2xl bg-gradient-to-b from-blue-50/50 via-indigo-50/30 to-white border border-[#E2E8F0] flex flex-col items-center justify-center relative p-3 overflow-hidden text-center">
                  <div className={`w-14 h-14 rounded-2xl flex items-center justify-center transition-all duration-300 shadow-md ${
                    isAiSpeaking
                      ? 'bg-blue-600 text-white scale-105 shadow-blue-600/30 ring-4 ring-blue-500/20'
                      : isSubmitting
                      ? 'bg-purple-600 text-white animate-pulse'
                      : 'bg-white border border-slate-200 text-blue-600'
                  }`}>
                    {isAiSpeaking ? (
                      <Volume2 className="w-7 h-7 animate-bounce" />
                    ) : isSubmitting ? (
                      <BrainCircuit className="w-7 h-7 animate-spin" />
                    ) : (
                      <Sparkles className="w-7 h-7 text-blue-600" />
                    )}
                  </div>

                  <div className="mt-3 flex items-center gap-1.5">
                    <span className={`w-2 h-2 rounded-full ${
                      isAiSpeaking ? 'bg-blue-600 animate-ping' : isSubmitting ? 'bg-purple-600 animate-pulse' : 'bg-emerald-500'
                    }`} />
                    <span id="badge-ai-state" className="text-xs font-bold font-mono tracking-wide text-slate-800">
                      {isAiSpeaking ? 'Speaking' : isSubmitting ? 'Thinking' : 'Listening'}
                    </span>
                  </div>

                  {isAiSpeaking && (
                    <div className="flex items-center gap-1 mt-1.5">
                      {[4, 12, 8, 16, 10, 14, 6].map((h, i) => (
                        <span
                          key={i}
                          className="w-1 bg-blue-600 rounded-full animate-pulse"
                          style={{ height: `${h}px`, animationDelay: `${i * 90}ms` }}
                        />
                      ))}
                    </div>
                  )}
                </div>

                <div className="text-[11px] text-slate-500 text-center font-mono">
                  Principal Architect • Real-Time Adaptive Defense
                </div>
              </div>

              {/* Candidate WebRTC Live Video Box */}
              <div id="panel-candidate-video" className="p-5 rounded-2xl bg-white border border-[#E2E8F0] shadow-sm space-y-4">
                <div className="flex items-center justify-between pb-3 border-b border-[#E2E8F0]">
                  <div className="flex items-center gap-2">
                    <UserCheck className="w-4 h-4 text-blue-600" />
                    <span className="text-xs font-bold text-slate-900 truncate max-w-[140px]">{studentProfile?.name || 'Candidate'}</span>
                  </div>
                  <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-slate-100 text-slate-700 border border-slate-200">
                    {studentProfile?.targetRole || 'Frontend'}
                  </span>
                </div>

                {/* Video Feed */}
                <div className="h-44 rounded-2xl bg-slate-950 border border-slate-200 flex items-center justify-center relative overflow-hidden shadow-inner">
                  <video
                    ref={bindCandidateVideo}
                    id="video-candidate-stream"
                    autoPlay
                    playsInline
                    muted
                    className={`w-full h-full object-cover ${!isCamActive ? 'hidden' : ''}`}
                  />

                  {!isCamActive && !camPermissionError && (
                    <div id="video-muted-placeholder" className="flex flex-col items-center justify-center text-rose-400 space-y-1.5 p-4 text-center">
                      <VideoOff className="w-8 h-8 text-rose-500 animate-pulse" />
                      <span className="text-xs font-bold">Camera is OFF</span>
                      <span className="text-[10px] text-slate-400">Enable camera to resume defense</span>
                    </div>
                  )}

                  {camPermissionError && (
                    <div className="absolute inset-0 bg-slate-950/95 flex flex-col items-center justify-center p-3 text-center space-y-1 z-10">
                      <AlertTriangle className="w-6 h-6 text-rose-400" />
                      <span className="text-xs text-rose-300 font-semibold">{camPermissionError}</span>
                      <span className="text-[10px] text-slate-400">Allow camera & mic access</span>
                    </div>
                  )}

                  <div className="absolute bottom-2 left-2 px-2 py-0.5 rounded bg-slate-950/80 backdrop-blur text-[10px] text-slate-300 font-mono border border-slate-800">
                    Candidate Feed
                  </div>

                  <div className="absolute bottom-2 right-2 flex items-center gap-1 bg-slate-950/80 px-2 py-0.5 rounded border border-slate-800">
                    <Mic className={`w-3 h-3 ${isMicActive ? 'text-emerald-400' : 'text-rose-500'}`} />
                    <div className="w-12 h-1.5 bg-slate-800 rounded-full overflow-hidden">
                      <div
                        className="h-full bg-emerald-400 rounded-full transition-all duration-100"
                        style={{ width: `${isMicActive ? audioLevel : 0}%` }}
                      />
                    </div>
                  </div>
                </div>

                {/* Device Hardware Toggles */}
                <div className="flex items-center justify-center gap-2 pt-1">
                  <button
                    id="btn-toggle-camera"
                    onClick={toggleCamera}
                    className={`flex-1 py-2 px-2.5 rounded-xl border text-xs font-semibold flex items-center justify-center gap-1.5 transition-all ${
                      isCamActive
                        ? 'bg-slate-50 border-slate-200 text-slate-700 hover:bg-slate-100'
                        : 'bg-rose-50 border-rose-200 text-rose-700'
                    }`}
                  >
                    {isCamActive ? <Video className="w-3.5 h-3.5 text-blue-600" /> : <VideoOff className="w-3.5 h-3.5 text-rose-600" />}
                    <span>{isCamActive ? 'Camera ON' : 'Camera OFF'}</span>
                  </button>

                  <button
                    id="btn-toggle-mic"
                    onClick={toggleMic}
                    className={`flex-1 py-2 px-2.5 rounded-xl border text-xs font-semibold flex items-center justify-center gap-1.5 transition-all ${
                      isMicActive
                        ? 'bg-slate-50 border-slate-200 text-slate-700 hover:bg-slate-100'
                        : 'bg-rose-50 border-rose-200 text-rose-700'
                    }`}
                  >
                    {isMicActive ? <Mic className="w-3.5 h-3.5 text-emerald-600" /> : <MicOff className="w-3.5 h-3.5 text-rose-600" />}
                    <span>{isMicActive ? 'Mic ON' : 'Mic OFF'}</span>
                  </button>
                </div>
              </div>
            </div>

            {/* RIGHT COLUMN: Active Question, Feedback & Candidate Defense Area */}
            <div className="lg:col-span-8 space-y-4">
              {/* PAUSE BANNER: Device / Screen Interruption */}
              {isPaused && (
                <div id="modal-interrupted-warning" className="p-4 rounded-2xl bg-rose-50 border-2 border-rose-300 text-rose-900 space-y-3 animate-fadeIn">
                  <div className="flex items-start gap-3">
                    <AlertTriangle className="w-5 h-5 text-rose-600 shrink-0 mt-0.5" />
                    <div>
                      <h3 className="text-sm font-bold text-rose-900">Assessment Paused</h3>
                      <p className="text-xs text-rose-700">
                        {isScreenInterrupted
                          ? 'Screen recording was stopped. Please resume screen recording to continue.'
                          : 'Camera or microphone was disabled. Turn on both devices to resume.'}
                      </p>
                    </div>
                  </div>

                  <div className="flex items-center justify-end gap-2 pt-1 border-t border-rose-200">
                    <button
                      id="btn-resume-interview"
                      onClick={() => {
                        if (isScreenInterrupted) {
                          handleStartCombinedRecording();
                        } else if (!isCamActive || !isMicActive) {
                          handleEnableCameraAndMic();
                        } else {
                          triggerResume(session.interviewId);
                        }
                      }}
                      className="px-4 py-1.5 rounded-xl bg-blue-600 hover:bg-blue-700 text-white text-xs font-bold transition-all shadow-sm"
                    >
                      Resume Interview
                    </button>
                  </div>
                </div>
              )}

              {/* SINGLE ACTIVE QUESTION CARD */}
              <div id="card-active-question" className="p-6 rounded-2xl bg-white border border-[#E2E8F0] shadow-sm space-y-4">
                <div className="flex flex-wrap items-center justify-between gap-2 pb-3 border-b border-[#E2E8F0]">
                  <div className="flex items-center gap-2">
                    <span className="text-xs font-mono font-bold px-2.5 py-0.5 rounded-full bg-blue-50 text-blue-700 border border-blue-200">
                      Question {currentTurn} of {maxTurns}
                    </span>
                    <span className="text-[11px] font-mono px-2 py-0.5 rounded bg-amber-50 text-amber-700 border border-amber-200">
                      Difficulty: {session.difficulty || 'Intermediate'}
                    </span>
                  </div>
                  {session.evaluatedSkill && (
                    <span className="text-[11px] font-mono text-indigo-700 bg-indigo-50 px-2.5 py-0.5 rounded-full border border-indigo-200 font-semibold">
                      Skill: {session.evaluatedSkill}
                    </span>
                  )}
                </div>

                <p className="text-base font-semibold text-slate-900 leading-relaxed">
                  {session.question || 'Loading active question...'}
                </p>
              </div>

              {/* TURN EVALUATION FEEDBACK CARD (Appears after submission) */}
              {lastTurnEvaluation && (
                <div id="card-turn-evaluation" className="p-5 rounded-2xl bg-blue-50/50 border border-blue-200 space-y-2.5 animate-fadeIn">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <span className="text-xs font-mono font-bold uppercase tracking-wider text-slate-600">
                        Turn {lastTurnEvaluation.turnNumber} Evaluation
                      </span>
                      <span
                        id="badge-last-turn-score"
                        className={`text-xs font-mono font-bold px-2.5 py-0.5 rounded-full border ${
                          lastTurnEvaluation.score >= 60
                            ? 'bg-emerald-50 text-emerald-700 border-emerald-200'
                            : lastTurnEvaluation.score >= 40
                            ? 'bg-amber-50 text-amber-700 border-amber-200'
                            : 'bg-rose-50 text-rose-700 border-rose-200'
                        }`}
                      >
                        Score: {lastTurnEvaluation.score}/100
                      </span>
                    </div>
                    {lastTurnEvaluation.testedSkill && (
                      <span className="text-[11px] font-mono px-2 py-0.5 rounded bg-white text-slate-700 border border-slate-200">
                        Evaluated: {lastTurnEvaluation.testedSkill}
                      </span>
                    )}
                  </div>
                  <p className="text-xs text-slate-700 leading-relaxed font-medium">
                    <strong className="text-slate-900">Feedback:</strong> {lastTurnEvaluation.feedback}
                  </p>
                </div>
              )}

              {/* Conversation Log */}
              <div id="transcript-history-log" className="p-4 rounded-2xl bg-slate-50 border border-[#E2E8F0] h-[220px] overflow-y-auto space-y-3">
                <div className="text-[10px] font-mono uppercase tracking-wider text-slate-500 pb-1 border-b border-slate-200 flex items-center justify-between">
                  <span>Conversation History</span>
                  <span>{session.transcript?.length || 0} messages</span>
                </div>

                {session.transcript?.map((item, idx) => {
                  const isAi = item.sender === 'ai';
                  return (
                    <div key={idx} className={`flex gap-2.5 ${isAi ? 'justify-start' : 'justify-end'}`}>
                      {isAi && (
                        <div className="w-6 h-6 rounded-lg bg-blue-100 text-blue-700 flex items-center justify-center shrink-0 mt-0.5 text-xs font-bold">
                          AI
                        </div>
                      )}

                      <div className={`p-3 rounded-2xl text-xs max-w-lg leading-relaxed ${
                        isAi
                          ? 'bg-white border border-[#E2E8F0] text-slate-800 shadow-sm'
                          : 'bg-blue-600 text-white rounded-br-none shadow-sm'
                      }`}>
                        {item.message}
                      </div>

                      {!isAi && (
                        <div className="w-6 h-6 rounded-lg bg-blue-600 flex items-center justify-center text-white shrink-0 font-bold text-xs mt-0.5 shadow-xs">
                          {studentProfile?.name ? studentProfile.name.charAt(0).toUpperCase() : 'C'}
                        </div>
                      )}
                    </div>
                  );
                })}

                {isSubmitting && (
                  <div className="flex gap-2 items-center text-xs text-blue-600 italic">
                    <BrainCircuit className="w-4 h-4 animate-bounce" />
                    <span>AI Evaluator is scoring your technical answer...</span>
                  </div>
                )}
                <div ref={transcriptEndRef} />
              </div>

              {/* Candidate Answer Form */}
              <form onSubmit={handleSubmitAnswer} className="p-5 rounded-2xl bg-white border border-[#E2E8F0] shadow-sm space-y-3">
                {answerError && (
                  <div id="error-answer-required" className="p-3 rounded-xl bg-rose-50 border border-rose-200 text-rose-700 text-xs font-semibold flex items-center gap-2 animate-fadeIn">
                    <AlertTriangle className="w-4 h-4 text-rose-600 shrink-0" />
                    <span>{answerError}</span>
                  </div>
                )}

                <div className="relative">
                  <textarea
                    id="textarea-candidate-answer"
                    rows={4}
                    disabled={isPaused || isSubmitting}
                    placeholder="Defend your approach, cite architectural patterns, Big-O trade-offs, concurrency handling, or system design principles..."
                    value={studentInput}
                    onChange={(e) => {
                      setStudentInput(e.target.value);
                      if (answerError) setAnswerError(null);
                    }}
                    className={`w-full p-4 rounded-xl border text-xs text-slate-900 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-600 transition-all resize-none leading-relaxed ${
                      isPaused ? 'bg-slate-50 border-slate-200 opacity-60 cursor-not-allowed' : 'bg-white border-slate-300'
                    }`}
                    onKeyDown={(e) => {
                      if (e.key === 'Enter' && e.ctrlKey && !isPaused) {
                        handleSubmitAnswer(e);
                      }
                    }}
                  />

                  {isRecording && (
                    <div className="absolute top-3 right-3 flex items-center gap-1.5 px-2.5 py-0.5 rounded-full bg-rose-50 border border-rose-200 text-[10px] font-mono text-rose-700 animate-pulse font-bold">
                      <div className="w-2 h-2 rounded-full bg-rose-500" />
                      Listening...
                    </div>
                  )}
                </div>

                <div className="flex flex-wrap items-center justify-between gap-3 pt-1">
                  <div className="flex items-center gap-2">
                    {speechSupported && (
                      <button
                        type="button"
                        id="btn-stt-toggle"
                        onClick={toggleRecording}
                        disabled={isPaused || isSubmitting}
                        className={`px-3 py-1.5 rounded-full border text-xs font-semibold flex items-center gap-1.5 transition-all ${
                          isRecording
                            ? 'bg-rose-600 text-white border-rose-600 shadow-sm'
                            : 'bg-white border-slate-300 text-slate-700 hover:bg-slate-50'
                        }`}
                      >
                        <Mic className={`w-3.5 h-3.5 ${isRecording ? 'animate-pulse' : ''}`} />
                        <span>{isRecording ? 'Stop Voice' : 'Voice (STT)'}</span>
                      </button>
                    )}
                    <span className="text-[11px] text-slate-400 font-mono hidden sm:inline">Ctrl + Enter to submit</span>
                  </div>

                  <button
                    type="submit"
                    id="btn-defend-answer"
                    disabled={isPaused || isSubmitting}
                    className={`px-6 py-2.5 rounded-full text-xs font-bold flex items-center gap-2 shadow-sm transition-all ${
                      isPaused || isSubmitting
                        ? 'bg-slate-100 text-slate-400 cursor-not-allowed border border-slate-200'
                        : 'bg-blue-600 hover:bg-blue-700 text-white shadow-blue-600/20 cursor-pointer'
                    }`}
                  >
                    <Send className="w-3.5 h-3.5" />
                    <span>{isSubmitting ? 'Evaluating...' : 'Defend Answer'}</span>
                  </button>
                </div>
              </form>

              {/* Bottom Progress Bar */}
              <div className="p-4 rounded-2xl bg-white border border-[#E2E8F0] space-y-2 shadow-sm">
                <div className="flex items-center justify-between text-xs font-mono">
                  <span id="label-question-progress" className="font-bold text-slate-900">
                    Question {currentTurn} / {maxTurns}
                  </span>
                  <span className="text-slate-500 font-semibold">
                    {Math.round((currentTurn / maxTurns) * 100)}% Completed
                  </span>
                </div>
                <div className="w-full h-2 bg-slate-100 rounded-full overflow-hidden">
                  <div
                    id="progress-bar-fill"
                    className="h-full bg-blue-600 rounded-full transition-all duration-300"
                    style={{ width: `${(currentTurn / maxTurns) * 100}%` }}
                  />
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* ========================================================================= */}
      {/* STEP 3: INTERVIEW COMPLETION SCREEN (TRANSITION GATEWAY)                  */}
      {/* ========================================================================= */}
      {assessmentStage === 'INTERVIEW_COMPLETE' && (
        <div className="max-w-2xl mx-auto p-8 rounded-2xl bg-white border border-[#E2E8F0] shadow-sm text-center space-y-6 animate-fadeIn">
          <div className="w-16 h-16 rounded-2xl bg-emerald-50 border border-emerald-100 text-emerald-600 flex items-center justify-center mx-auto shadow-sm">
            <CheckCircle2 className="w-8 h-8" />
          </div>

          <div className="space-y-2">
            <h2 className="text-2xl font-black text-slate-900">Technical Interview Section Complete</h2>
            <p className="text-sm text-slate-600 max-w-md mx-auto leading-relaxed">
              You have successfully defended all 10 technical architectural questions. Your responses have been evaluated and securely captured.
            </p>
          </div>

          {/* Section Summary Metrics */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 text-left">
            <div className="p-4 rounded-xl bg-slate-50 border border-slate-200 space-y-1">
              <span className="text-[11px] font-mono text-slate-500 uppercase">Questions Completed</span>
              <div className="text-lg font-bold font-mono text-slate-900">10 / 10</div>
            </div>
            <div className="p-4 rounded-xl bg-slate-50 border border-slate-200 space-y-1">
              <span className="text-[11px] font-mono text-slate-500 uppercase">Proctoring Telemetry</span>
              <div className="text-lg font-bold font-mono text-emerald-600 flex items-center gap-1.5">
                <Check className="w-4 h-4" /> Continuous
              </div>
            </div>
            <div className="p-4 rounded-xl bg-slate-50 border border-slate-200 space-y-1">
              <span className="text-[11px] font-mono text-slate-500 uppercase">Next Stage</span>
              <div className="text-lg font-bold font-mono text-blue-600">Coding Contest</div>
            </div>
          </div>

          <div className="pt-4 border-t border-[#E2E8F0] flex flex-col sm:flex-row items-center justify-center gap-4">
            <button
              id="btn-continue-to-coding"
              onClick={handleContinueToCoding}
              className="w-full sm:w-auto px-8 py-3.5 rounded-full bg-blue-600 hover:bg-blue-700 text-white font-bold text-xs flex items-center justify-center gap-2 shadow-md shadow-blue-600/20 transition-all cursor-pointer"
            >
              <span>Continue to Coding Test</span>
              <ArrowRight className="w-4 h-4" />
            </button>
          </div>
        </div>
      )}

      {/* ========================================================================= */}
      {/* STEP 4: CODING CONTEST — LEETCODE STYLE WORKSPACE                         */}
      {/* ========================================================================= */}
      {assessmentStage === 'CODING' && (
        <div className="space-y-4 animate-fadeIn">
          {/* Contest Header Bar */}
          <div className="p-4 rounded-2xl bg-white border border-[#E2E8F0] shadow-sm flex flex-col sm:flex-row sm:items-center justify-between gap-3">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-amber-50 border border-amber-200 text-amber-700 flex items-center justify-center">
                <Code2 className="w-5 h-5" />
              </div>
              <div>
                <div className="flex items-center gap-2">
                  <h2 className="text-base font-bold text-slate-900">SKILLPROOF CODING CONTEST</h2>
                  <span className="text-[10px] font-mono font-bold px-2 py-0.5 rounded bg-blue-50 text-blue-700 border border-blue-200">
                    ROUND 2
                  </span>
                </div>
                <span className="text-xs text-slate-500 font-mono">Problem 1 of 1 • Algorithmic Complexity Evaluation</span>
              </div>
            </div>

            {/* Language Selector Dropdown / Pills */}
            <div className="flex items-center gap-1.5">
              <span className="text-xs text-slate-500 font-semibold mr-1">Language:</span>
              {['javascript', 'python', 'java'].map(lang => (
                <button
                  key={lang}
                  onClick={() => handleLanguageChange(lang)}
                  className={`px-3 py-1 rounded-full text-xs font-mono font-bold transition-all ${
                    selectedLanguage === lang
                      ? 'bg-blue-600 text-white shadow-sm'
                      : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
                  }`}
                >
                  {lang === 'javascript' ? 'JavaScript' : lang === 'python' ? 'Python' : 'Java'}
                </button>
              ))}
            </div>
          </div>

          {/* 2-Column LeetCode Layout */}
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-5 items-start">
            {/* LEFT PANEL: Problem Statement, Examples, Constraints */}
            <div className="lg:col-span-5 p-6 rounded-2xl bg-white border border-[#E2E8F0] shadow-sm space-y-5 h-[680px] overflow-y-auto">
              <div className="flex items-center justify-between pb-3 border-b border-[#E2E8F0]">
                <div className="space-y-1">
                  <h3 className="text-lg font-black text-slate-900">{activeChallenge?.title || 'Two Sum Challenge'}</h3>
                  <div className="flex items-center gap-2">
                    <span className="text-[10px] font-mono font-bold px-2 py-0.5 rounded bg-emerald-50 text-emerald-700 border border-emerald-200">
                      {activeChallenge?.difficulty || 'EASY'}
                    </span>
                    <span className="text-xs text-slate-500 font-mono">Time: O(N) | Space: O(N)</span>
                  </div>
                </div>
              </div>

              {/* Problem Description */}
              <div className="text-xs text-slate-700 leading-relaxed space-y-3">
                <p className="font-medium">{activeChallenge?.description || DEFAULT_CHALLENGE.description}</p>
              </div>

              {/* Examples */}
              <div className="space-y-3 pt-2">
                <span className="text-xs font-bold uppercase tracking-wider text-slate-900">Examples</span>

                <div className="p-3.5 rounded-xl bg-slate-50 border border-slate-200 space-y-1 font-mono text-xs">
                  <div className="text-slate-500 text-[10px] uppercase font-bold">Example 1:</div>
                  <div className="text-slate-800">Input: <span className="font-semibold text-blue-700">{activeChallenge?.exampleInput || DEFAULT_CHALLENGE.exampleInput}</span></div>
                  <div className="text-slate-800">Output: <span className="font-semibold text-emerald-700">{activeChallenge?.exampleOutput || DEFAULT_CHALLENGE.exampleOutput}</span></div>
                  {activeChallenge?.exampleExplanation && (
                    <div className="text-slate-500 text-[11px] pt-1">Explanation: {activeChallenge.exampleExplanation}</div>
                  )}
                </div>

                <div className="p-3.5 rounded-xl bg-slate-50 border border-slate-200 space-y-1 font-mono text-xs">
                  <div className="text-slate-500 text-[10px] uppercase font-bold">Example 2:</div>
                  <div className="text-slate-800">Input: <span className="font-semibold text-blue-700">nums = [3, 2, 4], target = 6</span></div>
                  <div className="text-slate-800">Output: <span className="font-semibold text-emerald-700">[1, 2]</span></div>
                </div>
              </div>

              {/* Constraints */}
              <div className="space-y-2 pt-2 border-t border-[#E2E8F0]">
                <span className="text-xs font-bold uppercase tracking-wider text-slate-900">Constraints</span>
                <ul className="text-xs text-slate-600 font-mono space-y-1 list-disc pl-4">
                  {(() => {
                    const c = activeChallenge?.constraints || DEFAULT_CHALLENGE.constraints;
                    const list = Array.isArray(c) ? c : typeof c === 'string' ? c.split('\n').filter(Boolean) : [];
                    return list.map((item, i) => (
                      <li key={i}>{item}</li>
                    ));
                  })()}
                </ul>
              </div>

              {/* Hints Accordion / Action */}
              <div className="pt-2 border-t border-[#E2E8F0] space-y-2">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-bold uppercase tracking-wider text-slate-900">Hints & Strategy</span>
                  <button
                    id="btn-request-hint"
                    onClick={handleRequestHint}
                    disabled={isRequestingHint || hintsList.length >= 3}
                    className="px-2.5 py-1 rounded-full text-[11px] font-semibold bg-blue-50 text-blue-600 hover:bg-blue-100 border border-blue-200 transition-colors"
                  >
                    {isRequestingHint ? 'Fetching...' : hintsList.length >= 3 ? 'Max Hints' : '+ Get Hint'}
                  </button>
                </div>

                {hintsList.map((h, i) => (
                  <div key={i} className="p-3 rounded-xl bg-amber-50 border border-amber-200 text-xs text-amber-900 font-medium">
                    <strong>Hint #{i + 1}:</strong> {h}
                  </div>
                ))}
              </div>
            </div>

            {/* RIGHT PANEL: Code Editor & Runner Console */}
            <div className="lg:col-span-7 space-y-4">
              {/* Code Editor Container */}
              <div className="rounded-2xl border border-[#E2E8F0] bg-white shadow-sm overflow-hidden flex flex-col">
                {/* Editor Header Bar with Candidate PIP */}
                <div className="p-3.5 bg-slate-900 text-white flex items-center justify-between border-b border-slate-800">
                  <div className="flex items-center gap-2">
                    <Terminal className="w-4 h-4 text-cyan-400" />
                    <span className="text-xs font-mono font-bold uppercase tracking-wider">Solution.{selectedLanguage === 'javascript' ? 'js' : selectedLanguage === 'python' ? 'py' : 'java'}</span>
                  </div>

                  <div className="flex items-center gap-3">
                    {/* Small live PIP video preview */}
                    <div className="flex items-center gap-1.5 px-2.5 py-1 rounded-lg bg-slate-800 border border-slate-700 text-[10px] font-mono text-slate-300">
                      <span className="w-2 h-2 rounded-full bg-rose-500 animate-pulse" />
                      <span>Proctored Cam</span>
                    </div>

                    <button
                      id="btn-reset-code"
                      onClick={() => {
                        if (activeChallenge?.starterCode?.[selectedLanguage]) {
                          setCodeContent(activeChallenge.starterCode[selectedLanguage]);
                        } else if (DEFAULT_CHALLENGE.starterCode[selectedLanguage]) {
                          setCodeContent(DEFAULT_CHALLENGE.starterCode[selectedLanguage]);
                        }
                      }}
                      className="px-2.5 py-1 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-300 text-xs font-semibold flex items-center gap-1 transition-colors"
                    >
                      <RefreshCw className="w-3 h-3" />
                      <span>Reset</span>
                    </button>
                  </div>
                </div>

                {/* Editor Textarea */}
                <div className="p-4 bg-slate-950 font-mono text-xs">
                  <textarea
                    id="textarea-code-editor"
                    rows={16}
                    value={codeContent}
                    onChange={(e) => setCodeContent(e.target.value)}
                    disabled={isPaused}
                    className="w-full bg-transparent border-0 focus:outline-none resize-none font-mono text-xs text-cyan-200 leading-relaxed"
                    spellCheck={false}
                  />
                </div>

                {/* Runner Actions Bar */}
                <div className="p-4 bg-white border-t border-[#E2E8F0] flex flex-wrap items-center justify-between gap-3">
                  <button
                    id="btn-run-code"
                    onClick={handleRunCode}
                    disabled={isRunningCode || isPaused}
                    className={`px-5 py-2 rounded-full font-bold text-xs flex items-center gap-2 shadow-2xs transition-all ${
                      isRunningCode || isPaused
                        ? 'bg-slate-100 text-slate-400 cursor-not-allowed border border-slate-200'
                        : 'bg-white hover:bg-slate-50 text-slate-700 border border-slate-300 hover:border-slate-400 cursor-pointer active:bg-slate-100'
                    }`}
                  >
                    <Play className={`w-3 h-3 ${isRunningCode ? 'animate-spin' : ''}`} />
                    <span>{isRunningCode ? 'Testing Solution...' : 'Run Test Cases'}</span>
                  </button>

                  <button
                    id="btn-submit-code-defend"
                    onClick={handleFinalCodeSubmit}
                    disabled={isSubmitting || isPaused}
                    className={`px-6 py-2 rounded-full font-bold text-xs flex items-center gap-2 shadow-sm transition-all ${
                      isSubmitting || isPaused
                        ? 'bg-slate-100 text-slate-400 cursor-not-allowed border border-slate-200'
                        : 'bg-blue-600 hover:bg-blue-700 text-white shadow-blue-600/20 cursor-pointer'
                    }`}
                  >
                    <Send className="w-3.5 h-3.5" />
                    <span>{isSubmitting ? 'Evaluating Solution...' : 'Submit Solution'}</span>
                  </button>
                </div>
              </div>

              {/* Test Suite Output Panel */}
              {codeExecutionResult && (
                <div id="panel-test-results" className="p-5 rounded-2xl bg-white border border-[#E2E8F0] space-y-3 shadow-sm animate-fadeIn">
                  <div className="flex items-center justify-between pb-2 border-b border-[#E2E8F0]">
                    <div className="flex items-center gap-2">
                      <Terminal className="w-4 h-4 text-blue-600" />
                      <span className="text-xs font-bold text-slate-900 uppercase tracking-wider">Test Suite Output</span>
                      <span className={`text-[10px] font-mono px-2 py-0.5 rounded font-bold ${
                        codeExecutionResult.verdict === 'ALL_PASSED'
                          ? 'bg-emerald-50 text-emerald-700 border border-emerald-200'
                          : 'bg-amber-50 text-amber-700 border border-amber-200'
                      }`}>
                        {codeExecutionResult.verdict}
                      </span>
                    </div>

                    <div className="text-xs font-mono font-bold text-slate-900">
                      {codeExecutionResult.passedTests}/{codeExecutionResult.totalTests} Tests Passed
                    </div>
                  </div>

                  <div className="flex items-center justify-between text-xs font-mono text-slate-600 bg-slate-50 p-2.5 rounded-xl border border-slate-200">
                    <span>Execution Time: <strong className="text-slate-900">{codeExecutionResult.executionTimeMs || 42}ms</strong></span>
                    <span>Complexity: <strong className="text-blue-600">{codeExecutionResult.timeComplexity || 'O(N)'}</strong></span>
                  </div>

                  {/* Individual Test Cases */}
                  <div className="space-y-2 max-h-48 overflow-y-auto">
                    {codeExecutionResult.testResults?.map((tr, i) => (
                      <div
                        key={i}
                        className={`p-3 rounded-xl border text-xs space-y-1 font-mono ${
                          tr.passed
                            ? 'bg-emerald-50/50 border-emerald-200 text-emerald-900'
                            : 'bg-rose-50/50 border-rose-200 text-rose-900'
                        }`}
                      >
                        <div className="flex items-center justify-between font-bold">
                          <span className="flex items-center gap-1.5">
                            {tr.passed ? <Check className="w-3.5 h-3.5 text-emerald-600" /> : <XCircle className="w-3.5 h-3.5 text-rose-600" />}
                            Case #{tr.testCaseNumber} {tr.hidden ? '(Hidden Benchmark)' : ''}
                          </span>
                          <span>{tr.passed ? 'PASS' : 'FAIL'}</span>
                        </div>
                        <div className="text-[11px] text-slate-500">Input: {tr.input}</div>
                        <div className="text-[11px] text-slate-700">Expected: {tr.expectedOutput} | Actual: {tr.actualOutput}</div>
                      </div>
                    ))}
                  </div>

                  {codeExecutionResult.stderr && (
                    <div className="p-3 rounded-xl bg-rose-50 border border-rose-200 text-xs font-mono text-rose-800">
                      <pre className="whitespace-pre-wrap">{codeExecutionResult.stderr}</pre>
                    </div>
                  )}
                </div>
              )}
            </div>
          </div>
        </div>
      )}

      {/* ========================================================================= */}
      {/* STEP 5: EVALUATION INTERMEDIATE SCREEN                                    */}
      {/* ========================================================================= */}
      {assessmentStage === 'EVALUATION' && (
        <div className="max-w-lg mx-auto p-8 rounded-2xl bg-white border border-[#E2E8F0] shadow-sm text-center space-y-6 animate-fadeIn">
          <div className="w-16 h-16 rounded-2xl bg-blue-50 border border-blue-100 text-blue-600 flex items-center justify-center mx-auto shadow-sm">
            <BrainCircuit className="w-8 h-8 animate-spin" />
          </div>

          <div className="space-y-2">
            <h2 className="text-xl font-black text-slate-900">Evaluating Assessment & Computing Rubric</h2>
            <p className="text-xs text-slate-600 max-w-sm mx-auto leading-relaxed">
              Synthesizing your technical interview defenses, live coding solution correctness, algorithmic complexity benchmarks, and proctoring telemetry...
            </p>
          </div>

          {/* Progress loader animation */}
          <div className="w-full h-2 bg-slate-100 rounded-full overflow-hidden">
            <div className="h-full bg-blue-600 rounded-full animate-pulse w-full" />
          </div>

          <span className="text-[11px] font-mono text-slate-400 block">Tier 4 Automated Evidence Engine • Finalizing</span>
        </div>
      )}

      {/* ========================================================================= */}
      {/* STEP 6: VERIFIED EVIDENCE DOSSIER & RESULTS SCREEN                         */}
      {/* ========================================================================= */}
      {session && assessmentStage === 'RESULT' && (
        <div className="p-6 sm:p-8 rounded-2xl bg-white border border-[#E2E8F0] shadow-sm space-y-8 animate-fadeIn">
          {/* Proctored Auto-Submission Violation Banner */}
          {isAutoSubmitted && (
            <div id="banner-interview-violation" className="p-6 rounded-2xl bg-rose-50 border-2 border-rose-300 text-rose-900 space-y-3 shadow-sm">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-xl bg-rose-100 border border-rose-200 flex items-center justify-center shrink-0 text-rose-700">
                  <AlertTriangle className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="text-base font-black text-rose-900 uppercase tracking-wide">Test Auto-Submitted (Violation Detected)</h3>
                  <p className="text-xs text-rose-700">You left the assessment window. This attempt has been submitted automatically.</p>
                </div>
              </div>
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 pt-2 border-t border-rose-200 text-xs font-mono">
                <div>
                  <span className="text-rose-600 block text-[10px] uppercase font-bold">Reason</span>
                  <span id="text-interview-violation-reason" className="font-semibold text-rose-900">{session.autoSubmissionReason || 'Tab switch / window unfocused'}</span>
                </div>
                <div>
                  <span className="text-rose-600 block text-[10px] uppercase font-bold">Tab Switch Count</span>
                  <span id="text-interview-violation-count" className="font-bold text-rose-900">{session.tabSwitchCount || 1} violation(s)</span>
                </div>
                <div>
                  <span className="text-rose-600 block text-[10px] uppercase font-bold">Violation Timestamp</span>
                  <span id="text-interview-violation-time" className="text-rose-800">{session.violationTimestamp ? new Date(session.violationTimestamp).toLocaleTimeString() : 'Recorded'}</span>
                </div>
              </div>
              <div className="p-2.5 rounded-lg bg-rose-100/60 border border-rose-200 text-[11px] text-rose-800">
                ⚠️ <strong>Strict Policy Notice:</strong> All unanswered questions were finalized with 0 score. Resuming or restarting this attempt is strictly blocked.
              </div>
            </div>
          )}

          {/* Header Banner */}
          <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between pb-6 border-b border-[#E2E8F0] gap-4">
            <div className="flex items-center gap-4">
              <div className="w-16 h-16 rounded-2xl bg-blue-50 border border-blue-100 flex items-center justify-center text-blue-600 shadow-sm">
                <Award className="w-8 h-8 text-blue-600" />
              </div>
              <div>
                <div className="flex items-center gap-2">
                  <h2 className="text-xl font-black text-slate-900 uppercase tracking-wide">Verified Interview Evidence Report</h2>
                  <span className={`text-[10px] font-mono px-2.5 py-0.5 rounded-full border font-bold ${
                    session.overallScore >= 75
                      ? 'bg-emerald-50 text-emerald-700 border-emerald-200'
                      : session.overallScore >= 50
                      ? 'bg-amber-50 text-amber-700 border-amber-200'
                      : 'bg-rose-50 text-rose-700 border-rose-200'
                  }`}>
                    {session.overallScore >= 75 ? 'Tier 4 Verified Pass' : session.overallScore >= 50 ? 'Conditional Clearance' : 'Preparation Required'}
                  </span>
                </div>
                <p className="text-xs text-slate-500 mt-0.5">
                  Candidate: <strong>{studentProfile?.name || 'Candidate'}</strong> • Role Target: <strong>{session.roleTargeted || 'Frontend Developer'}</strong> • Format: <strong>{session.mode || 'TECHNICAL'}</strong>
                </p>
                <p className="text-[11px] text-blue-600 font-semibold">{studentProfile?.college || 'Engineering Institute'}</p>
              </div>
            </div>

            <div className="text-left sm:text-right">
              <span className="text-[10px] uppercase font-bold tracking-widest text-slate-400 block">Overall Arena Score</span>
              <div className="flex items-baseline gap-1 mt-0.5 sm:justify-end">
                <span id="stat-overall-score" className="text-4xl font-black text-blue-600">{session.overallScore ?? 0}</span>
                <span className="text-sm text-slate-400 font-bold">/ 100</span>
              </div>
            </div>
          </div>

          {/* Sequential 10-Question Summary Stats */}
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
            <div className="p-4 rounded-xl bg-slate-50 border border-slate-200 space-y-1">
              <span className="text-[11px] font-mono text-slate-500">Questions Completed</span>
              <div className="text-xl font-bold font-mono text-slate-900">10 / 10</div>
            </div>
            <div className="p-4 rounded-xl bg-emerald-50 border border-emerald-200 space-y-1">
              <span className="text-[11px] font-mono text-emerald-700 font-semibold">Correct Answers (&ge;60)</span>
              <div id="stat-correct-count" className="text-xl font-bold font-mono text-emerald-800">{session.correctCount ?? 0}</div>
            </div>
            <div className="p-4 rounded-xl bg-amber-50 border border-amber-200 space-y-1">
              <span className="text-[11px] font-mono text-amber-700 font-semibold">Partially Correct (40-59)</span>
              <div id="stat-partial-count" className="text-xl font-bold font-mono text-amber-800">{session.partiallyCorrectCount ?? 0}</div>
            </div>
            <div className="p-4 rounded-xl bg-rose-50 border border-rose-200 space-y-1">
              <span className="text-[11px] font-mono text-rose-700 font-semibold">Incorrect Answers (&lt;40)</span>
              <div id="stat-incorrect-count" className="text-xl font-bold font-mono text-rose-800">{session.incorrectCount ?? 0}</div>
            </div>
          </div>

          {/* 5-Category Breakdown */}
          <div className="space-y-4">
            <h3 className="text-xs font-bold uppercase tracking-wider text-slate-900">Five-Dimensional Competency Rubric</h3>
            <div className="grid grid-cols-1 md:grid-cols-5 gap-3">
              {[
                { label: 'Technical Knowledge', val: session.rubric?.technicalKnowledge || 0, color: 'bg-blue-600' },
                { label: 'Project Understanding', val: session.rubric?.projectUnderstanding || 0, color: 'bg-indigo-600' },
                { label: 'Problem Solving', val: session.rubric?.problemSolving || 0, color: 'bg-amber-500' },
                { label: 'Code Quality', val: session.rubric?.codeQuality || 0, color: 'bg-purple-600' },
                { label: 'Communication & Clarity', val: session.rubric?.communication || 0, color: 'bg-emerald-600' }
              ].map((m, idx) => (
                <div key={idx} className="p-4 rounded-xl bg-slate-50 border border-slate-200 space-y-2">
                  <div className="flex justify-between text-xs">
                    <span className="text-slate-600 text-[11px] font-medium">{m.label}</span>
                    <span className="font-mono font-bold text-slate-900">{m.val}%</span>
                  </div>
                  <div className="w-full h-1.5 bg-slate-200 rounded-full overflow-hidden">
                    <div className={`h-full ${m.color} rounded-full`} style={{ width: `${m.val}%` }} />
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Interview Screen & Camera Recording Video Player */}
          <div className="p-6 rounded-2xl bg-slate-50 border border-[#E2E8F0] space-y-4 shadow-sm">
            <div className="flex flex-wrap items-center justify-between gap-3 pb-3 border-b border-slate-200">
              <div className="flex items-center gap-2.5">
                <Film className="w-5 h-5 text-rose-500" />
                <div>
                  <h3 className="text-sm font-bold text-slate-900">Interview Screen & Candidate Camera Recording</h3>
                  <p className="text-[11px] text-slate-500">
                    Dual-source synchronized composite recording (Screen + PIP Camera + Mic audio) captured via HTML5 MediaRecorder.
                  </p>
                </div>
              </div>

              <div className="flex items-center gap-2">
                <span className={`text-[11px] font-mono px-2.5 py-0.5 rounded-full border flex items-center gap-1 ${
                  session.recordingUrl || recordedBlobUrl
                    ? 'bg-emerald-50 text-emerald-700 border-emerald-200'
                    : 'bg-slate-100 text-slate-600 border-slate-200'
                }`}>
                  <CheckCircle2 className="w-3 h-3 text-emerald-600" />
                  Status: {session.recordingUrl || recordedBlobUrl ? 'RECORDED' : 'Recording: NOT AVAILABLE'}
                </span>
                {(session.recordingDurationSeconds > 0 || recordingElapsedSeconds > 0) && (
                  <span className="text-[11px] font-mono px-2.5 py-0.5 rounded-full bg-slate-100 text-slate-700 border border-slate-200">
                    Duration: {formatTime(session.recordingDurationSeconds || recordingElapsedSeconds)}
                  </span>
                )}
              </div>
            </div>

            {/* Embedded Video Player or Unavailable Notice */}
            {session.recordingUrl || recordedBlobUrl ? (
              <div className="space-y-3">
                <div className="rounded-xl overflow-hidden bg-black border border-slate-800 shadow-lg relative flex items-center justify-center min-h-[240px]">
                  <video
                    controls
                    playsInline
                    className="w-full max-h-[420px] object-contain mx-auto"
                    src={recordedBlobUrl || (session.interviewId ? apiService.getInterviewRecordingUrl(session.interviewId) : '')}
                  >
                    Your browser does not support the video tag.
                  </video>
                </div>

                <div className="flex flex-wrap items-center justify-between gap-3 text-xs text-slate-500 pt-1 font-mono">
                  <span>Codec: video/webm;codecs=vp9,opus • Resolution: 1280x720 @ 30 FPS</span>
                  {session.interviewId && (
                    <a
                      href={recordedBlobUrl || apiService.getInterviewRecordingUrl(session.interviewId)}
                      download={`skillproof-interview-${session.interviewId}.webm`}
                      className="px-3 py-1.5 rounded-xl bg-white hover:bg-slate-50 text-blue-600 border border-slate-300 flex items-center gap-1.5 transition-colors font-semibold"
                    >
                      <Download className="w-3.5 h-3.5" />
                      <span>Download Recording WebM</span>
                    </a>
                  )}
                </div>
              </div>
            ) : (
              <div id="panel-recording-unavailable" className="p-6 rounded-xl bg-white border border-slate-200 text-center space-y-2">
                <Film className="w-8 h-8 text-slate-400 mx-auto" />
                <h4 className="text-sm font-bold text-slate-700">Recording: NOT AVAILABLE</h4>
                <p className="text-xs text-slate-500">No screen recording was captured during this session.</p>
              </div>
            )}
          </div>

          {/* Persisted Coding Submissions Audit Trail */}
          {((codingSubmissionsList && codingSubmissionsList.length > 0) || (session.codingSubmissions && session.codingSubmissions.length > 0)) && (
            <div className="p-6 rounded-2xl bg-white border border-[#E2E8F0] space-y-4 shadow-sm">
              <div className="flex items-center justify-between pb-3 border-b border-[#E2E8F0]">
                <div className="flex items-center gap-2.5">
                  <Terminal className="w-5 h-5 text-blue-600" />
                  <div>
                    <h3 className="text-sm font-bold text-slate-900">Verified Live Coding Submissions</h3>
                    <p className="text-[11px] text-slate-500">
                      Persistent sandbox test case executions and automated complexity proofs recorded during the interview.
                    </p>
                  </div>
                </div>
                <span className="text-[11px] font-mono px-2.5 py-0.5 rounded-full bg-blue-50 text-blue-700 border border-blue-200 font-bold">
                  {codingSubmissionsList?.length || session.codingSubmissions?.length} Submissions Logged
                </span>
              </div>

              <div className="space-y-3">
                {(codingSubmissionsList?.length ? codingSubmissionsList : session.codingSubmissions || []).map((sub, idx) => (
                  <div key={sub.id || idx} className="p-4 rounded-xl bg-slate-50 border border-slate-200 space-y-2.5 font-mono text-xs">
                    <div className="flex flex-wrap items-center justify-between gap-2">
                      <div className="flex items-center gap-2">
                        <span className="font-bold text-slate-900 text-sm">{sub.problemTitle || 'Live Problem'}</span>
                        <span className="text-[10px] px-2 py-0.5 rounded bg-white text-blue-700 border border-slate-200 font-semibold">
                          {sub.language || 'javascript'}
                        </span>
                      </div>
                      <div className="flex items-center gap-2">
                        <span className={`text-[10px] px-2 py-0.5 rounded font-bold ${
                          sub.executionResult === 'ALL_PASSED'
                            ? 'bg-emerald-50 text-emerald-700 border border-emerald-200'
                            : 'bg-amber-50 text-amber-700 border border-amber-200'
                        }`}>
                          {sub.executionResult} ({sub.passedTests}/{sub.totalTests} Passed)
                        </span>
                        <span className="text-[10px] text-slate-500">
                          {sub.executionTimeMs}ms • {sub.timeComplexity || 'O(N)'}
                        </span>
                      </div>
                    </div>

                    {sub.sourceCode && (
                      <div className="p-3 rounded-xl bg-slate-900 text-cyan-200 border border-slate-800 text-[11px] overflow-x-auto max-h-40">
                        <pre>{sub.sourceCode}</pre>
                      </div>
                    )}
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Strongest & Weakest Answer Breakdown */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="p-5 rounded-xl bg-slate-50 border border-slate-200 space-y-3 text-xs">
              <span className="font-bold text-slate-900 text-sm flex items-center gap-1.5">
                <CheckCircle2 className="w-4 h-4 text-emerald-600" />
                <span>Verified Strengths & Peak Answers</span>
              </span>
              <p className="text-slate-600 leading-relaxed">
                {session.strengths || 'Candidate demonstrated strong architectural grasp on core concepts.'}
              </p>
              {session.strongestAnswer && (
                <div className="pt-2 border-t border-slate-200 text-[11px] text-emerald-700 font-medium">
                  Top Response: <strong>{session.strongestAnswer}</strong>
                </div>
              )}
            </div>

            <div className="p-5 rounded-xl bg-slate-50 border border-slate-200 space-y-3 text-xs">
              <span className="font-bold text-slate-900 text-sm flex items-center gap-1.5">
                <AlertTriangle className="w-4 h-4 text-amber-600" />
                <span>Areas for Growth & Recommendations</span>
              </span>
              <p className="text-slate-600 leading-relaxed">
                {session.improvements || 'Focus on rigorous time/space complexity analysis and edge case coverage.'}
              </p>
              {session.weakestAnswer && (
                <div className="pt-2 border-t border-slate-200 text-[11px] text-rose-700 font-medium">
                  Review Prompt: <strong>{session.weakestAnswer}</strong>
                </div>
              )}
            </div>
          </div>

          {/* Action Footer */}
          <div className="pt-4 border-t border-[#E2E8F0] flex flex-col sm:flex-row items-center justify-between gap-4">
            <div className="text-xs text-slate-400 font-mono">
              Report Signature: SKP-ARENA-{session.interviewId}-VERIFIED-TIER4
            </div>

            <div className="flex items-center gap-3">
              <button
                onClick={() => window.print()}
                className="px-4 py-2 rounded-full bg-white hover:bg-slate-50 text-slate-700 border border-slate-300 text-xs font-bold flex items-center gap-1.5 transition-colors"
              >
                <Printer className="w-3.5 h-3.5" />
                <span>Print / Save Dossier</span>
              </button>

              <a
                href="#/student/passport"
                className="px-5 py-2 rounded-full bg-blue-600 hover:bg-blue-700 text-white text-xs font-bold flex items-center gap-1.5 shadow-sm transition-all"
              >
                <ShieldCheck className="w-3.5 h-3.5" />
                <span>Inspect Verified Passport</span>
              </a>
            </div>
          </div>
        </div>
      )}

      {/* ========================================================================= */}
      {/* MODALS: CONSENT & LOCKED                                                  */}
      {/* ========================================================================= */}
      {/* Pre-Recording Consent Modal */}
      {showRecordingConsentModal && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/60 backdrop-blur-sm"
          onClick={(e) => { if (e.target === e.currentTarget) setShowRecordingConsentModal(false); }}
        >
          <div className="p-6 rounded-2xl bg-white border border-[#E2E8F0] shadow-2xl max-w-md w-full space-y-5">
            <div className="flex items-center gap-3">
              <div className="w-12 h-12 rounded-2xl bg-rose-50 border border-rose-100 flex items-center justify-center text-rose-600">
                <Disc className="w-6 h-6 animate-pulse" />
              </div>
              <div>
                <h3 className="text-base font-black text-slate-900">Interview Recording Consent</h3>
                <span className="text-[11px] font-mono text-blue-600 font-semibold">Assessment Evidence Capture</span>
              </div>
            </div>

            <p className="text-xs text-slate-600 leading-relaxed">
              SKILLPROOF will record your camera, microphone and selected interview screen for assessment and evidence generation.
            </p>

            <div className="text-[11px] text-slate-600 bg-slate-50 p-3.5 rounded-xl border border-slate-200 space-y-1.5">
              <div className="flex items-center gap-2">
                <Check className="w-3.5 h-3.5 text-emerald-600" />
                <span>Synchronized Screen + PIP Camera (1280x720 30fps)</span>
              </div>
              <div className="flex items-center gap-2">
                <Check className="w-3.5 h-3.5 text-emerald-600" />
                <span>Microphone audio mixed directly into stream</span>
              </div>
              <div className="flex items-center gap-2">
                <Check className="w-3.5 h-3.5 text-emerald-600" />
                <span>Saved securely to your Tier 4 Evidence Dossier</span>
              </div>
            </div>

            <div className="flex items-center justify-end gap-3 pt-2">
              <button
                id="btn-modal-cancel"
                onClick={() => setShowRecordingConsentModal(false)}
                className="px-4 py-2 rounded-full bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-semibold transition-colors"
              >
                Cancel
              </button>
              <button
                id="btn-modal-confirm-recording"
                onClick={handleStartCombinedRecording}
                className="px-5 py-2 rounded-full bg-rose-600 hover:bg-rose-700 text-white text-xs font-bold flex items-center gap-2 shadow-sm transition-all"
              >
                <Disc className="w-3.5 h-3.5 animate-pulse" />
                <span>Start Recording</span>
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Camera + Microphone Gate Modal ("Interview Locked") */}
      {showLockedModal && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/60 backdrop-blur-sm animate-fadeIn"
          onClick={(e) => { if (e.target === e.currentTarget) setShowLockedModal(false); }}
        >
          <div id="modal-interview-locked" className="p-6 sm:p-8 rounded-2xl bg-white border border-rose-200 shadow-2xl max-w-md w-full space-y-5 text-center">
            <div className="mx-auto w-14 h-14 rounded-2xl bg-rose-50 border border-rose-100 flex items-center justify-center text-rose-600 shadow-sm animate-pulse">
              <Lock className="w-7 h-7" />
            </div>

            <div className="space-y-1.5">
              <h2 className="text-xl font-black text-slate-900">Interview Locked</h2>
              <p className="text-xs text-slate-600 leading-relaxed font-medium">
                Camera and microphone access are required to start the AI interview arena.
              </p>
            </div>

            {/* Device Status Indicators */}
            <div className="grid grid-cols-2 gap-3 pt-1">
              <div className={`p-3 rounded-xl border text-xs font-mono flex items-center justify-center gap-2 ${
                isCamActive ? 'bg-emerald-50 border-emerald-200 text-emerald-800' : 'bg-rose-50 border-rose-200 text-rose-800'
              }`}>
                {isCamActive ? <Video className="w-4 h-4 text-emerald-600" /> : <VideoOff className="w-4 h-4 text-rose-600" />}
                <span>{isCamActive ? 'Camera Ready' : 'Camera Required'}</span>
              </div>

              <div className={`p-3 rounded-xl border text-xs font-mono flex items-center justify-center gap-2 ${
                isMicActive ? 'bg-emerald-50 border-emerald-200 text-emerald-800' : 'bg-rose-50 border-rose-200 text-rose-800'
              }`}>
                {isMicActive ? <Mic className="w-4 h-4 text-emerald-600" /> : <MicOff className="w-4 h-4 text-rose-600" />}
                <span>{isMicActive ? 'Mic Ready' : 'Mic Required'}</span>
              </div>
            </div>

            {camPermissionError && (
              <p className="text-xs text-rose-600 font-medium bg-rose-50 p-2.5 rounded-xl border border-rose-200">
                {camPermissionError}
              </p>
            )}

            <div className="flex items-center justify-center gap-3 pt-2">
              <button
                id="btn-close-locked-modal"
                onClick={() => setShowLockedModal(false)}
                className="px-4 py-2 rounded-full bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-semibold transition-colors"
              >
                Cancel
              </button>
              <button
                id="btn-enable-camera-mic"
                onClick={handleEnableCameraAndMic}
                className="px-6 py-2 rounded-full bg-blue-600 hover:bg-blue-700 text-white text-xs font-bold flex items-center gap-2 shadow-sm transition-all"
              >
                <Video className="w-4 h-4" />
                <span>Enable Camera & Mic</span>
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default AiInterviewArena;
