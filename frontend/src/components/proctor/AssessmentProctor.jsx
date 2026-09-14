import React from 'react';
import {
  Camera,
  Mic,
  Monitor,
  CheckCircle2,
  XCircle,
  AlertTriangle,
  ShieldAlert,
  ShieldCheck,
  Radio,
  Lock,
  RefreshCw,
  Award
} from 'lucide-react';

/**
 * Reusable Proctoring UI Component providing:
 * 1. Pre-flight device checklist & permission gates
 * 2. Active session continuous 🔴 RECORDING indicator
 * 3. Session interruption warning / locked state
 * 4. Auto-submitted violation modal/view (with restart blocked)
 */
export const AssessmentProctor = ({
  // Pre-flight props
  showPreFlight = false,
  isCamActive = false,
  isMicActive = false,
  isScreenActive = false,
  allPermissionsGranted = false,
  permissionError = null,
  onRequestPermissions = () => {},
  onStartSession = () => {},
  isStarting = false,
  assessmentTitle = 'Technical Assessment',

  // Active session props
  isActive = false,
  isRecording = false,
  recordingElapsedSeconds = 0,

  // Interruption props
  isInterrupted = false,
  interruptionReason = null,
  onResumeInterrupted = () => {},

  // Violation auto-submitted props
  isViolated = false,
  violationData = null,
  finalScore = null
}) => {

  const formatTime = (secs) => {
    const mins = Math.floor(secs / 60).toString().padStart(2, '0');
    const remainingSecs = (secs % 60).toString().padStart(2, '0');
    return `${mins}:${remainingSecs}`;
  };

  // 1. Auto-Submitted Violation Modal / Full View
  if (isViolated) {
    return (
      <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-sm flex items-center justify-center p-4">
        <div id="modal-assessment-violation" className="max-w-lg w-full p-6 sm:p-8 rounded-3xl bg-white border border-rose-200 shadow-2xl text-center space-y-5 animate-in fade-in zoom-in duration-300">
          <div className="w-16 h-16 rounded-full bg-rose-50 border border-rose-200 flex items-center justify-center mx-auto text-rose-600">
            <ShieldAlert className="w-8 h-8" />
          </div>

          <div className="space-y-2">
            <span className="text-[11px] font-bold uppercase tracking-wider px-3 py-1 rounded-full bg-rose-50 text-rose-700 border border-rose-200">
              Proctoring Violation
            </span>
            <h2 className="text-2xl font-black text-slate-900">Test Auto-Submitted</h2>
            <p className="text-xs text-slate-600 max-w-md mx-auto leading-relaxed">
              You left the assessment window. This attempt has been submitted automatically.
            </p>
          </div>

          <div className="p-4 rounded-2xl bg-slate-50 border border-slate-200 text-left space-y-2 text-xs">
            <div className="flex items-center justify-between text-slate-500">
              <span>Violation Reason:</span>
              <span id="text-proctor-violation-reason" className="font-mono text-rose-600 font-bold">
                {violationData?.reason || 'TAB_SWITCH_OR_WINDOW_BLUR'}
              </span>
            </div>
            <div className="flex items-center justify-between text-slate-500">
              <span>Timestamp:</span>
              <span className="font-mono text-slate-700">
                {violationData?.timestamp ? new Date(violationData.timestamp).toLocaleTimeString() : new Date().toLocaleTimeString()}
              </span>
            </div>
            <div className="flex items-center justify-between text-slate-500">
              <span>Attempt Status:</span>
              <span className="font-mono text-amber-700 font-bold">AUTO_SUBMITTED (Locked)</span>
            </div>
            {finalScore !== null && (
              <div className="flex items-center justify-between text-slate-500 pt-2 border-t border-slate-200">
                <span>Verified Score on Partial Attempt:</span>
                <span className="font-mono text-blue-600 font-bold text-sm">{finalScore}%</span>
              </div>
            )}
          </div>

          <div className="p-3.5 rounded-xl bg-rose-50 border border-rose-200 text-[11px] text-rose-800 text-left space-y-1">
            <div className="font-bold flex items-center gap-1.5 text-rose-900">
              <Lock className="w-3.5 h-3.5 text-rose-600 shrink-0" />
              <span>Restart Blocked</span>
            </div>
            <p className="text-rose-700">
              Per proctoring integrity requirements, this attempt cannot be resumed or restarted. All unanswered rounds have received a score of 0.
            </p>
          </div>

          <div className="pt-2">
            <a
              href="/student/dashboard"
              className="inline-flex px-6 py-2.5 rounded-full bg-slate-900 hover:bg-slate-800 text-white text-xs font-semibold transition-colors shadow-md"
            >
              Return to Student Dashboard
            </a>
          </div>
        </div>
      </div>
    );
  }

  // 2. Interrupted Session Locked Modal / Alert
  if (isInterrupted) {
    return (
      <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-sm flex items-center justify-center p-4">
        <div className="max-w-md w-full p-6 sm:p-8 rounded-3xl bg-white border border-amber-200 shadow-2xl text-center space-y-4">
          <div className="w-14 h-14 rounded-full bg-amber-50 border border-amber-200 flex items-center justify-center mx-auto text-amber-600">
            <AlertTriangle className="w-7 h-7" />
          </div>

          <div className="space-y-1">
            <h3 className="text-lg font-bold text-slate-900">SESSION LOCKED</h3>
            <p className="text-xs text-slate-600 leading-relaxed">
              {interruptionReason || 'Camera, microphone, or screen recording was interrupted. Please re-enable devices to resume.'}
            </p>
          </div>

          <div className="p-3 rounded-xl bg-amber-50 border border-amber-200 text-[11px] text-amber-800 text-left">
            <span>Leaving this window or switching tabs while paused will auto-submit this attempt.</span>
          </div>

          <button
            onClick={onResumeInterrupted}
            className="w-full py-2.5 rounded-full bg-amber-600 hover:bg-amber-700 text-white text-xs font-semibold flex items-center justify-center gap-2 transition-all shadow-md shadow-amber-600/20"
          >
            <RefreshCw className="w-4 h-4" />
            <span>Re-Authorize & Resume Session</span>
          </button>
        </div>
      </div>
    );
  }

  // 3. Pre-Flight Device Checklist Card
  if (showPreFlight) {
    return (
      <div id="card-assessment-preflight" className="bg-white p-6 sm:p-8 rounded-2xl border border-[#E2E8F0] shadow-[0_4px_20px_rgba(15,23,42,0.06)] space-y-6 max-w-xl mx-auto text-left">
        <div className="flex items-center justify-between pb-4 border-b border-[#E2E8F0]">
          <div>
            <div className="flex items-center gap-2">
              <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-blue-50 text-blue-600 border border-blue-100 uppercase tracking-wider">
                Proctored Assessment
              </span>
              <span className="text-[10px] text-slate-500 font-mono">Pre-Flight Gate</span>
            </div>
            <h2 className="text-xl font-bold text-slate-900 mt-1">{assessmentTitle}</h2>
          </div>
          <div className="w-10 h-10 rounded-xl bg-blue-50 border border-blue-100 flex items-center justify-center text-blue-600">
            <ShieldCheck className="w-5 h-5" />
          </div>
        </div>

        {/* Warning Notice Banner */}
        <div id="notice-assessment-proctor-warning" className="p-4 rounded-xl bg-rose-50 border border-rose-200 flex items-start gap-3 text-xs text-rose-800">
          <AlertTriangle className="w-4 h-4 text-rose-600 shrink-0 mt-0.5" />
          <div>
            <strong className="text-rose-900 block mb-0.5 font-semibold">Strict Window Leaving Enforcement</strong>
            <span>Switching tabs or leaving this window will automatically submit your attempt.</span>
          </div>
        </div>

        {/* Device Checklist Items */}
        <div className="space-y-3">
          <h4 className="text-xs font-bold text-slate-700 uppercase tracking-wider">Required Device Authorizations</h4>

          {/* Camera */}
          <div className={`p-3.5 rounded-xl border flex items-center justify-between transition-all ${
            isCamActive
              ? 'bg-emerald-50/60 border-emerald-200 text-emerald-900'
              : 'bg-[#F8FAFC] border-[#E2E8F0] text-slate-600'
          }`}>
            <div className="flex items-center gap-3">
              <Camera className={`w-4 h-4 ${isCamActive ? 'text-emerald-600' : 'text-slate-400'}`} />
              <div>
                <span className="text-xs font-semibold text-slate-900 block">Camera</span>
                <span className="text-[10px] text-slate-500">Candidate presence & room monitoring</span>
              </div>
            </div>
            <div id="status-proctor-camera" className="flex items-center gap-1.5 text-xs font-bold font-mono">
              {isCamActive ? (
                <>
                  <CheckCircle2 className="w-4 h-4 text-emerald-600" />
                  <span className="text-emerald-600">Camera ✓</span>
                </>
              ) : (
                <>
                  <XCircle className="w-4 h-4 text-rose-500" />
                  <span className="text-rose-600">Required ✗</span>
                </>
              )}
            </div>
          </div>

          {/* Microphone */}
          <div className={`p-3.5 rounded-xl border flex items-center justify-between transition-all ${
            isMicActive
              ? 'bg-emerald-50/60 border-emerald-200 text-emerald-900'
              : 'bg-[#F8FAFC] border-[#E2E8F0] text-slate-600'
          }`}>
            <div className="flex items-center gap-3">
              <Mic className={`w-4 h-4 ${isMicActive ? 'text-emerald-600' : 'text-slate-400'}`} />
              <div>
                <span className="text-xs font-semibold text-slate-900 block">Microphone</span>
                <span className="text-[10px] text-slate-500">Verbal answers & acoustic verification</span>
              </div>
            </div>
            <div id="status-proctor-mic" className="flex items-center gap-1.5 text-xs font-bold font-mono">
              {isMicActive ? (
                <>
                  <CheckCircle2 className="w-4 h-4 text-emerald-600" />
                  <span className="text-emerald-600">Microphone ✓</span>
                </>
              ) : (
                <>
                  <XCircle className="w-4 h-4 text-rose-500" />
                  <span className="text-rose-600">Required ✗</span>
                </>
              )}
            </div>
          </div>

          {/* Screen Recording */}
          <div className={`p-3.5 rounded-xl border flex items-center justify-between transition-all ${
            isScreenActive
              ? 'bg-emerald-50/60 border-emerald-200 text-emerald-900'
              : 'bg-[#F8FAFC] border-[#E2E8F0] text-slate-600'
          }`}>
            <div className="flex items-center gap-3">
              <Monitor className={`w-4 h-4 ${isScreenActive ? 'text-emerald-600' : 'text-slate-400'}`} />
              <div>
                <span className="text-xs font-semibold text-slate-900 block">Screen Recording</span>
                <span className="text-[10px] text-slate-500">Continuous session audit recording</span>
              </div>
            </div>
            <div id="status-proctor-screen" className="flex items-center gap-1.5 text-xs font-bold font-mono">
              {isScreenActive ? (
                <>
                  <CheckCircle2 className="w-4 h-4 text-emerald-600" />
                  <span className="text-emerald-600">Screen Recording ✓</span>
                </>
              ) : (
                <>
                  <XCircle className="w-4 h-4 text-rose-500" />
                  <span className="text-rose-600">Required ✗</span>
                </>
              )}
            </div>
          </div>
        </div>

        {permissionError && (
          <div className="p-3 rounded-xl bg-rose-50 border border-rose-200 text-xs text-rose-700">
            {permissionError}
          </div>
        )}

        {/* Action Controls */}
        <div className="pt-2 flex flex-col sm:flex-row items-center gap-3">
          {!allPermissionsGranted && (
            <button
              id="btn-authorize-devices"
              onClick={onRequestPermissions}
              className="w-full sm:flex-1 py-2.5 rounded-full bg-white hover:bg-slate-50 text-slate-700 text-xs font-semibold flex items-center justify-center gap-2 transition-all border border-slate-300 shadow-sm"
            >
              <RefreshCw className="w-3.5 h-3.5" />
              <span>Authorize Devices & Screen</span>
            </button>
          )}

          <button
            id="btn-start-proctored-session"
            onClick={onStartSession}
            disabled={!allPermissionsGranted || isStarting}
            className={`w-full ${allPermissionsGranted ? 'flex-1' : 'sm:flex-1'} py-2.5 rounded-full text-xs font-semibold flex items-center justify-center gap-2 transition-all shadow-sm ${
              allPermissionsGranted && !isStarting
                ? 'bg-blue-600 hover:bg-blue-700 text-white cursor-pointer'
                : 'bg-slate-100 text-slate-400 border border-slate-200 cursor-not-allowed opacity-70'
            }`}
          >
            {isStarting ? (
              <>
                <RefreshCw className="w-3.5 h-3.5 animate-spin" />
                <span>Launching Proctored Session...</span>
              </>
            ) : allPermissionsGranted ? (
              <>
                <ShieldCheck className="w-4 h-4 text-white" />
                <span>Start Assessment</span>
              </>
            ) : (
              <>
                <Lock className="w-3.5 h-3.5" />
                <span>Authorize All 3 to Unlock</span>
              </>
            )}
          </button>
        </div>
      </div>
    );
  }

  // 4. Active Session Indicator (Rendered into navbar or header of active session)
  if (isActive) {
    return (
      <div className="flex items-center gap-2.5">
        <div
          id="proctor-recording-badge"
          className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-rose-50 border border-rose-200 text-rose-700 text-xs font-mono font-bold shadow-sm animate-pulse"
        >
          <span className="w-2 h-2 rounded-full bg-rose-500 animate-ping inline-block" />
          <span>🔴 RECORDING</span>
          <span className="text-rose-900 font-mono">{formatTime(recordingElapsedSeconds)}</span>
        </div>

        <div className="hidden sm:inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-slate-50 border border-slate-200 text-[11px] text-slate-600 font-medium">
          <ShieldCheck className="w-3.5 h-3.5 text-blue-600" />
          <span>Proctored Window</span>
        </div>
      </div>
    );
  }

  return null;
};

export default AssessmentProctor;
