import React, { useState, useEffect } from 'react';
import { Link, useSearchParams } from 'react-router-dom';
import {
  Award,
  Clock,
  CheckCircle2,
  XCircle,
  ArrowRight,
  RotateCcw,
  ShieldCheck,
  Sparkles,
  AlertCircle,
  Loader2,
  BrainCircuit,
  ShieldAlert,
  Lock
} from 'lucide-react';
import apiService, { api } from '../../services/api';
import { useSkillProof } from '../../context/SkillProofContext';
import { useAssessmentProctor } from '../../components/proctor/useAssessmentProctor';
import { AssessmentProctor } from '../../components/proctor/AssessmentProctor';
import { PageHeader } from '../../components/common/PageHeader';
import { Button } from '../../components/common/Button';
import { Badge } from '../../components/common/Badge';
import { Card } from '../../components/common/Card';
import { ProgressBar } from '../../components/common/ProgressBar';
import { EmptyState } from '../../components/common/EmptyState';

export const SkillAssessmentPage = () => {
  const { updateSkillScore, loadLiveStudentData, studentProfile } = useSkillProof();
  const [searchParams] = useSearchParams();
  const requestedSkillParam = searchParams.get('skill');

  const [availableAssessments, setAvailableAssessments] = useState([]);
  const [loadingSubjects, setLoadingSubjects] = useState(true);
  const [selectedSubject, setSelectedSubject] = useState(null);

  const [showPreFlight, setShowPreFlight] = useState(false);
  const [inQuiz, setInQuiz] = useState(false);
  const [loadingQuestions, setLoadingQuestions] = useState(false);
  const [currentQuestions, setCurrentQuestions] = useState([]);
  const [assessmentMeta, setAssessmentMeta] = useState(null);
  const [currentQIndex, setCurrentQIndex] = useState(0);
  const [selectedAnswers, setSelectedAnswers] = useState({});
  const [submitting, setSubmitting] = useState(false);
  const [quizFinished, setQuizFinished] = useState(false);
  const [submissionResult, setSubmissionResult] = useState(null);
  const [error, setError] = useState(null);

  // Auto-submit on tab switch / window blur
  const handleProctorViolation = async (details) => {
    const targetId = assessmentMeta?.assessmentId || selectedSubject?.assessmentId;
    if (!targetId) return;
    setSubmitting(true);
    try {
      const res = await api.reportAssessmentViolation(targetId, {
        answers: selectedAnswers,
        reason: details?.message || 'You left the assessment window. This attempt has been submitted automatically.',
        durationSeconds: proctor.recordingElapsedSeconds
      });
      setSubmissionResult(res);
      setQuizFinished(true);
      setInQuiz(false);
      setShowPreFlight(false);
      if (loadLiveStudentData) {
        await loadLiveStudentData();
      }
    } catch (err) {
      console.warn('[SkillAssessment] Violation recording note:', err.message);
    } finally {
      setSubmitting(false);
    }
  };

  const proctor = useAssessmentProctor({
    candidateName: studentProfile?.name || 'Candidate',
    isActiveSession: inQuiz,
    isCompleted: quizFinished,
    isSubmitting: submitting,
    onViolation: handleProctorViolation,
    onRecordingReady: async (blob, url, duration) => {
      const targetId = assessmentMeta?.assessmentId || selectedSubject?.assessmentId;
      if (targetId) {
        try {
          const fd = new FormData();
          fd.append('file', blob, `assessment_${targetId}_rec.webm`);
          fd.append('durationSeconds', duration);
          await api.uploadAssessmentRecording(targetId, fd);
        } catch (e) {
          console.warn('[SkillAssessment] Upload recording note:', e.message);
        }
      }
    }
  });

  // Reload protection: check if latest assessment was auto-submitted
  useEffect(() => {
    const checkLatest = async () => {
      try {
        const latest = await api.getLatestAssessmentResult();
        if (latest && latest.status === 'AUTO_SUBMITTED') {
          setSubmissionResult(latest);
          setQuizFinished(true);
          setInQuiz(false);
        }
      } catch (e) {
        // non-blocking
      }
    };
    checkLatest();
  }, []);

  const fetchAvailableAssessments = async () => {
    setLoadingSubjects(true);
    setError(null);
    try {
      const data = await api.getAvailableAssessments();
      const list = Array.isArray(data) ? data : [];
      setAvailableAssessments(list);

      if (list.length > 0) {
        if (requestedSkillParam) {
          const match = list.find(s => s.skillName.toLowerCase() === requestedSkillParam.toLowerCase());
          setSelectedSubject(match || list[0]);
        } else if (!selectedSubject || !list.some(s => s.skillName === selectedSubject.skillName)) {
          setSelectedSubject(list[0]);
        }
      } else {
        setSelectedSubject(null);
      }
    } catch (err) {
      console.error('Failed to load available assessments:', err);
      setError(err.message || 'Could not load available assessment subjects.');
    } finally {
      setLoadingSubjects(false);
    }
  };

  useEffect(() => {
    fetchAvailableAssessments();
  }, [requestedSkillParam]);

  const handleOpenPreFlight = () => {
    if (!selectedSubject) return;
    setShowPreFlight(true);
  };

  const handleStartQuiz = async () => {
    if (!selectedSubject) return;
    setLoadingQuestions(true);
    setError(null);
    try {
      await proctor.startRecording();

      const data = await api.getAssessmentQuestions(selectedSubject.skillName);
      if (!data || !data.questions || data.questions.length === 0) {
        throw new Error(`No assessment questions found for ${selectedSubject.skillName}.`);
      }
      setAssessmentMeta(data);
      setCurrentQuestions(data.questions);
      setCurrentQIndex(0);
      setSelectedAnswers({});
      setQuizFinished(false);
      setSubmissionResult(null);
      setShowPreFlight(false);
      setInQuiz(true);
    } catch (err) {
      console.error('Failed to start proctored assessment:', err);
      setError(err.message || 'Failed to start assessment.');
    } finally {
      setLoadingQuestions(false);
    }
  };

  const handleSelectOption = (questionId, optKey) => {
    setSelectedAnswers(prev => ({ ...prev, [questionId]: optKey }));
  };

  const handleNextOrFinish = async () => {
    if (currentQIndex < currentQuestions.length - 1) {
      setCurrentQIndex(prev => prev + 1);
    } else {
      await handleSubmitQuiz();
    }
  };

  const handleSubmitQuiz = async () => {
    if (!assessmentMeta || !assessmentMeta.assessmentId) return;
    setSubmitting(true);
    setError(null);
    try {
      proctor.stopRecording();
      const result = await api.submitAssessment(assessmentMeta.assessmentId, selectedAnswers);
      setSubmissionResult(result);
      setQuizFinished(true);
      setInQuiz(false);

      if (updateSkillScore && selectedSubject) {
        updateSkillScore(selectedSubject.skillName, Math.round(result.scorePercentage || 0), 3);
      }
      if (loadLiveStudentData) {
        await loadLiveStudentData();
      }
    } catch (err) {
      console.error('Failed to submit assessment:', err);
      setError(err.message || 'Failed to submit assessment answers.');
    } finally {
      setSubmitting(false);
    }
  };

  const restartQuiz = () => {
    if (submissionResult?.status === 'AUTO_SUBMITTED') return;
    proctor.cleanupMedia();
    setInQuiz(false);
    setShowPreFlight(false);
    setCurrentQIndex(0);
    setSelectedAnswers({});
    setQuizFinished(false);
    setSubmissionResult(null);
    fetchAvailableAssessments();
  };

  const [filterTab, setFilterTab] = useState('all');
  const [searchQuery, setSearchQuery] = useState('');

  const currentQ = currentQuestions[currentQIndex];

  // Filter available assessments by tab and search
  const filteredAssessments = availableAssessments.filter(item => {
    const matchesSearch = item.skillName.toLowerCase().includes(searchQuery.toLowerCase()) ||
      (item.category && item.category.toLowerCase().includes(searchQuery.toLowerCase()));
    if (!matchesSearch) return false;
    if (filterTab === 'in-progress') return !item.isAssessed;
    if (filterTab === 'completed') return item.isAssessed;
    return true;
  });

  return (
    <div className="max-w-5xl mx-auto space-y-6">
      <PageHeader
        title="Skill Assessment"
        subtitle="Validate your proficiency with timed, standardized technical evaluations."
        badge={<Badge variant="primary" size="xs">Tier 3 Verification</Badge>}
        breadcrumbs={['Student Portal', 'Skill Verification', 'Standardized Assessments']}
      />

      {/* Global Error Banner */}
      {error && (
        <div className="p-4 rounded-xl bg-rose-50 border border-rose-200 flex items-center justify-between text-xs text-rose-700">
          <div className="flex items-center gap-2">
            <AlertCircle className="w-4 h-4 text-rose-600 shrink-0" />
            <span>{error}</span>
          </div>
          <button
            onClick={() => setError(null)}
            className="text-rose-700 hover:text-rose-900 font-semibold text-xs"
          >
            Dismiss
          </button>
        </div>
      )}

      {/* Loading state */}
      {loadingSubjects ? (
        <div className="p-16 rounded-2xl border border-slate-200 bg-white text-center space-y-3 shadow-sm">
          <Loader2 className="w-8 h-8 animate-spin text-blue-600 mx-auto" />
          <p className="text-xs font-medium text-slate-500">Loading candidate assessment catalog...</p>
        </div>
      ) : availableAssessments.length === 0 ? (
        <EmptyState
          icon={BrainCircuit}
          title="No skills available for assessment"
          description="Upload your resume to extract candidate skills and unlock standardized technical diagnostic tests."
          actionLabel="Upload Resume"
          onAction={() => window.location.hash = '#/student/resume-upload'}
          actionIcon={Sparkles}
        />
      ) : !showPreFlight && !inQuiz && !quizFinished ? (
        /* Screen 5: Subject Selection View matching Reference Mockup */
        <div className="space-y-6">
          {/* Filter Tabs & Search Bar */}
          <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-4">
            <div className="flex items-center p-1 bg-slate-100 rounded-full border border-slate-200 w-fit">
              <button
                onClick={() => setFilterTab('all')}
                className={`px-4 py-1.5 rounded-full text-xs font-medium transition-all ${
                  filterTab === 'all'
                    ? 'bg-white text-slate-900 shadow-sm font-semibold'
                    : 'text-slate-600 hover:text-slate-900'
                }`}
              >
                All Assessments
              </button>
              <button
                onClick={() => setFilterTab('in-progress')}
                className={`px-4 py-1.5 rounded-full text-xs font-medium transition-all ${
                  filterTab === 'in-progress'
                    ? 'bg-white text-slate-900 shadow-sm font-semibold'
                    : 'text-slate-600 hover:text-slate-900'
                }`}
              >
                Available ({availableAssessments.filter(a => !a.isAssessed).length})
              </button>
              <button
                onClick={() => setFilterTab('completed')}
                className={`px-4 py-1.5 rounded-full text-xs font-medium transition-all ${
                  filterTab === 'completed'
                    ? 'bg-white text-slate-900 shadow-sm font-semibold'
                    : 'text-slate-600 hover:text-slate-900'
                }`}
              >
                Completed ({availableAssessments.filter(a => a.isAssessed).length})
              </button>
            </div>

            <div className="relative">
              <input
                type="text"
                placeholder="Search assessments..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full sm:w-64 pl-4 pr-4 py-1.5 text-xs bg-white border border-[#E2E8F0] rounded-full text-slate-800 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-600 transition-all shadow-sm"
              />
            </div>
          </div>

          {/* Assessment Cards Grid */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
            {filteredAssessments.map((item) => {
              const isSelected = selectedSubject && selectedSubject.skillName === item.skillName;
              return (
                <div
                  key={item.skillName}
                  onClick={() => setSelectedSubject(item)}
                  className={`bg-white rounded-2xl border transition-all duration-200 cursor-pointer p-5 flex flex-col justify-between shadow-[0_4px_20px_rgba(15,23,42,0.03)] hover:shadow-[0_8px_30px_rgba(15,23,42,0.08)] ${
                    isSelected
                      ? 'border-blue-600 ring-2 ring-blue-500/20'
                      : 'border-[#E2E8F0] hover:border-slate-300'
                  }`}
                >
                  <div className="space-y-3">
                    <div className="flex items-start justify-between gap-2">
                      <div className="w-10 h-10 rounded-xl bg-blue-50 border border-blue-100 flex items-center justify-center text-blue-600 font-bold text-sm">
                        {item.skillName.substring(0, 2).toUpperCase()}
                      </div>
                      <span className="text-[10px] font-semibold px-2.5 py-1 rounded-full bg-slate-100 text-slate-700 border border-slate-200">
                        {item.category || 'General'}
                      </span>
                    </div>

                    <div>
                      <h3 className="text-base font-bold text-slate-900">{item.skillName}</h3>
                      <p className="text-xs text-slate-500 mt-1 line-clamp-2 leading-relaxed">
                        {item.description || `Standardized diagnostic evaluating core concepts, best practices, and performance patterns in ${item.skillName}.`}
                      </p>
                    </div>

                    <div className="flex items-center gap-3 pt-2 text-[11px] text-slate-500 font-medium">
                      <div className="flex items-center gap-1">
                        <Clock className="w-3.5 h-3.5 text-blue-600" />
                        <span>15 mins</span>
                      </div>
                      <span>•</span>
                      <div className="flex items-center gap-1">
                        <Award className="w-3.5 h-3.5 text-blue-600" />
                        <span>{item.totalQuestions || 5} Qs</span>
                      </div>
                    </div>
                  </div>

                  <div className="mt-5 pt-4 border-t border-[#E2E8F0] flex items-center justify-between">
                    <div>
                      {item.isAssessed ? (
                        <div className="flex items-center gap-1.5 text-xs font-semibold text-emerald-600">
                          <ShieldCheck className="w-4 h-4 text-emerald-600" />
                          <span>Passed ({item.pastScore}%)</span>
                        </div>
                      ) : (
                        <span className="text-[11px] text-slate-500">
                          Claim Conf: <strong className="text-slate-800">{item.claimConfidence || 75}%</strong>
                        </span>
                      )}
                    </div>

                    <span className={`text-xs font-semibold px-3 py-1 rounded-full transition-colors ${
                      isSelected
                        ? 'bg-blue-600 text-white'
                        : 'bg-slate-100 text-slate-700 hover:bg-slate-200'
                    }`}>
                      {isSelected ? 'Selected' : 'Select'}
                    </span>
                  </div>
                </div>
              );
            })}
          </div>

          {/* Sticky/Bottom Launch Action Strip */}
          <div className="bg-white p-5 rounded-2xl border border-[#E2E8F0] shadow-sm flex flex-col sm:flex-row items-center justify-between gap-4">
            <div className="flex items-center gap-3 text-xs text-slate-600">
              <div className="w-8 h-8 rounded-full bg-blue-50 flex items-center justify-center text-blue-600 shrink-0">
                <ShieldCheck className="w-4 h-4" />
              </div>
              <div>
                <span className="font-semibold text-slate-900 block">
                  {selectedSubject ? selectedSubject.skillName : 'Select an assessment'}
                </span>
                <span className="text-slate-500 text-[11px]">
                  15 min timed diagnostic • Continuous proctoring • Instant verified score
                </span>
              </div>
            </div>

            <Button
              id="btn-open-diagnostic-preflight"
              onClick={handleOpenPreFlight}
              disabled={loadingQuestions || !selectedSubject}
              isLoading={loadingQuestions}
              size="md"
              icon={Award}
              className="w-full sm:w-auto"
            >
              Start Diagnostic: {selectedSubject?.skillName || 'Select Skill'}
            </Button>
          </div>

          {/* Bottom Motivation Trophy Card (Screen 5 Reference) */}
          <div className="p-6 sm:p-7 rounded-2xl bg-gradient-to-r from-blue-500 to-blue-600 text-white shadow-[0_8px_30px_rgba(37,99,235,0.2)] flex flex-col sm:flex-row items-center justify-between gap-5">
            <div className="space-y-1.5 text-center sm:text-left">
              <div className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full bg-white/20 text-white text-[11px] font-semibold tracking-wide">
                <Sparkles className="w-3.5 h-3.5" />
                <span>CRYPTOGRAPHIC VERIFICATION</span>
              </div>
              <h3 className="text-xl font-bold text-white">Challenge yourself. Get verified.</h3>
              <p className="text-xs text-blue-100 max-w-xl leading-relaxed">
                Objective proctored assessments provide tamper-evident proof of your technical expertise directly on your verified Skill Passport.
              </p>
            </div>
            <Link to="/student/ai-interview" className="shrink-0">
              <button className="px-5 py-2.5 rounded-full bg-white text-blue-600 font-semibold text-xs shadow-md hover:bg-blue-50 transition-all">
                Explore AI Arena
              </button>
            </Link>
          </div>
        </div>
      ) : showPreFlight && !inQuiz && !quizFinished ? (
        /* Pre-Flight Proctoring Device Gate */
        <div className="space-y-4">
          <AssessmentProctor
            showPreFlight={true}
            isCamActive={proctor.isCamActive}
            isMicActive={proctor.isMicActive}
            isScreenActive={proctor.isScreenActive}
            allPermissionsGranted={proctor.allPermissionsGranted}
            permissionError={proctor.permissionError}
            onRequestPermissions={proctor.requestAllPermissions}
            onStartSession={handleStartQuiz}
            isStarting={loadingQuestions}
            assessmentTitle={`Diagnostic: ${selectedSubject?.skillName}`}
          />
          <div className="text-center">
            <button
              onClick={() => setShowPreFlight(false)}
              className="text-xs text-slate-500 hover:text-slate-800 underline transition-colors"
            >
              Cancel and return to assessment catalog
            </button>
          </div>
        </div>
      ) : quizFinished && submissionResult ? (
        /* Quiz Completed or Auto-Submitted View */
        submissionResult.status === 'AUTO_SUBMITTED' || submissionResult.isViolated ? (
          <div id="banner-assessment-violation" className="p-6 sm:p-8 rounded-2xl border border-rose-200 bg-white text-center space-y-5 shadow-[0_4px_25px_rgba(244,63,94,0.08)] animate-in fade-in max-w-2xl mx-auto">
            <div className="w-16 h-16 rounded-full border border-rose-200 bg-rose-50 text-rose-600 flex items-center justify-center mx-auto">
              <ShieldAlert className="w-8 h-8" />
            </div>

            <div className="space-y-1">
              <span className="text-[11px] font-bold uppercase tracking-wider px-3 py-1 rounded-full bg-rose-50 text-rose-700 border border-rose-200">
                Proctoring Violation
              </span>
              <h2 className="text-2xl font-black text-slate-900 mt-2">Test Auto-Submitted</h2>
              <p className="text-xs text-slate-600 max-w-md mx-auto leading-relaxed">
                You left the assessment window. This attempt has been submitted automatically.
              </p>
            </div>

            <div className="p-4 rounded-xl bg-slate-50 border border-[#E2E8F0] max-w-md mx-auto space-y-2 text-xs text-slate-600 text-left">
              <div className="flex justify-between">
                <span>Verified Score on Attempt:</span>
                <strong className="text-rose-600 font-mono text-sm">{submissionResult.scorePercentage}%</strong>
              </div>
              <div className="flex justify-between">
                <span>Attempt Status:</span>
                <span className="font-mono text-amber-700 font-semibold">AUTO_SUBMITTED</span>
              </div>
              <div className="flex justify-between">
                <span>Violation Reason:</span>
                <span id="text-assessment-violation-reason" className="text-slate-800 font-mono font-medium">{submissionResult.autoSubmissionReason || 'Tab switch / Window blur'}</span>
              </div>
              <div className="flex justify-between">
                <span>Tab Switch Count:</span>
                <span id="text-assessment-violation-count" className="text-rose-600 font-mono font-bold">{submissionResult.tabSwitchCount || 1} violation(s)</span>
              </div>
            </div>

            {/* Questions review */}
            {submissionResult.review && submissionResult.review.length > 0 && (
              <div className="text-left space-y-2.5 max-h-60 overflow-y-auto pr-1">
                <h4 className="text-xs font-semibold text-slate-700 uppercase tracking-wider">Attempted Questions Review</h4>
                {submissionResult.review.map((item, idx) => (
                  <div
                    key={idx}
                    className={`p-3 rounded-xl border text-xs space-y-1 ${
                      item.isCorrect
                        ? 'bg-emerald-50/70 border-emerald-200 text-slate-700'
                        : 'bg-rose-50/70 border-rose-200 text-slate-700'
                    }`}
                  >
                    <div className="flex items-start justify-between gap-2 font-medium">
                      <span className="text-slate-900">Q{idx + 1}: {item.questionText}</span>
                      {item.isCorrect ? (
                        <span className="text-emerald-700 text-[11px] font-mono shrink-0 flex items-center gap-1 font-semibold">
                          <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600" /> Correct
                        </span>
                      ) : (
                        <span className="text-rose-700 text-[11px] font-mono shrink-0 flex items-center gap-1 font-semibold">
                          <XCircle className="w-3.5 h-3.5 text-rose-600" /> Incorrect
                        </span>
                      )}
                    </div>
                    <div className="text-[11px] text-slate-500">
                      Your choice: <span className="font-mono text-slate-800 font-medium">{item.yourAnswer || 'Unanswered (0)'}</span> • Correct: <span className="font-mono text-emerald-700 font-semibold">{item.correctAnswer}</span>
                    </div>
                  </div>
                ))}
              </div>
            )}

            <div id="notice-retake-blocked" className="p-3.5 rounded-xl bg-rose-50 border border-rose-200 text-[11px] text-rose-800 text-left flex items-start gap-2.5 max-w-md mx-auto">
              <Lock className="w-4 h-4 text-rose-600 shrink-0 mt-0.5" />
              <span>Retaking or restarting an auto-submitted attempt is strictly blocked. All unanswered questions received 0.</span>
            </div>

            <div className="flex justify-center gap-3 pt-2">
              <button
                id="btn-retake-assessment"
                disabled={true}
                className="px-5 py-2.5 rounded-full bg-slate-100 text-slate-400 border border-slate-200 text-xs font-medium cursor-not-allowed opacity-60"
                title="Retaking an auto-submitted attempt is strictly blocked."
              >
                <span>Restart Blocked</span>
              </button>
              <Link to="/student/skill-map">
                <Button variant="primary" size="sm" icon={ShieldCheck}>
                  View Updated Skill Map
                </Button>
              </Link>
            </div>
          </div>
        ) : (
          /* Normal Quiz Completed View */
          <Card className="p-6 sm:p-8 text-center space-y-5 max-w-2xl mx-auto shadow-sm">
            <div className={`w-16 h-16 rounded-full border flex items-center justify-center mx-auto ${
              submissionResult.passed
                ? 'bg-emerald-50 text-emerald-600 border-emerald-200'
                : 'bg-amber-50 text-amber-600 border-amber-200'
            }`}>
              <Award className="w-8 h-8" />
            </div>

            <div>
              <h2 className="text-2xl font-bold text-slate-900">Assessment Completed</h2>
              <p className="text-xs text-slate-500 mt-1">
                Results recorded into your Verified Skill Map for <strong className="text-blue-600">{submissionResult.skillName}</strong>.
              </p>
            </div>

            <div className="p-5 rounded-2xl bg-[#F8FAFC] border border-[#E2E8F0] max-w-sm mx-auto">
              <span className="text-[11px] text-slate-500 uppercase font-semibold">Tier 3 Verified Score</span>
              <div className={`text-4xl font-black font-mono mt-1 ${submissionResult.passed ? 'text-emerald-600' : 'text-amber-600'}`}>
                {submissionResult.scorePercentage}%
              </div>
              <div className={`text-xs mt-1 font-semibold ${submissionResult.passed ? 'text-emerald-600' : 'text-amber-600'}`}>
                {submissionResult.verdict} ({submissionResult.correctCount}/{submissionResult.totalCount} correct)
              </div>
            </div>

            {/* Question Breakdown */}
            {submissionResult.review && submissionResult.review.length > 0 && (
              <div className="text-left space-y-2.5 max-h-72 overflow-y-auto pr-1">
                <h4 className="text-xs font-semibold text-slate-700 uppercase tracking-wider">Audit Question Breakdown</h4>
                {submissionResult.review.map((item, idx) => (
                  <div
                    key={idx}
                    className={`p-3 rounded-xl border text-xs space-y-1.5 ${
                      item.isCorrect
                        ? 'bg-emerald-50/70 border-emerald-200 text-slate-700'
                        : 'bg-rose-50/70 border-rose-200 text-slate-700'
                    }`}
                  >
                    <div className="flex items-start justify-between gap-2 font-medium">
                      <span className="text-slate-900">Q{idx + 1}: {item.questionText}</span>
                      {item.isCorrect ? (
                        <span className="text-emerald-700 text-[11px] font-mono shrink-0 flex items-center gap-1 font-semibold">
                          <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600" /> Correct
                        </span>
                      ) : (
                        <span className="text-rose-700 text-[11px] font-mono shrink-0 flex items-center gap-1 font-semibold">
                          <XCircle className="w-3.5 h-3.5 text-rose-600" /> Incorrect
                        </span>
                      )}
                    </div>
                    <div className="text-[11px] text-slate-500">
                      Your choice: <span className="font-mono text-slate-800 font-medium">{item.yourAnswer || 'None'}</span> • Correct: <span className="font-mono text-emerald-700 font-semibold">{item.correctAnswer}</span>
                    </div>
                    {item.explanation && (
                      <p className="text-[11px] text-slate-600 italic pt-1 border-t border-slate-200">
                        {item.explanation}
                      </p>
                    )}
                  </div>
                ))}
              </div>
            )}

            <div className="flex justify-center gap-3 pt-2">
              <Button variant="secondary" size="sm" onClick={restartQuiz} icon={RotateCcw}>
                Take Another Test
              </Button>
              <Link to="/student/skill-map">
                <Button variant="primary" size="sm" icon={ShieldCheck}>
                  View Skill Map
                </Button>
              </Link>
            </div>
          </Card>
        )
      ) : inQuiz && currentQ ? (
        /* Active Quiz Question View */
        <Card className="p-6 sm:p-8 space-y-6 max-w-3xl mx-auto shadow-sm">
          <div className="flex items-center justify-between pb-4 border-b border-[#E2E8F0] text-xs text-slate-500">
            <div className="flex items-center gap-2">
              <span className="font-bold text-blue-600">{assessmentMeta?.skillName}</span>
              <span>•</span>
              <span className="font-medium text-slate-700">Question {currentQIndex + 1} of {currentQuestions.length}</span>
            </div>
            <div className="flex items-center gap-3">
              <AssessmentProctor
                isActive={true}
                isRecording={proctor.isRecording}
                recordingElapsedSeconds={proctor.recordingElapsedSeconds}
              />
              <span className="font-mono text-slate-600 flex items-center gap-1 bg-slate-100 px-2.5 py-1 rounded-full text-xs font-semibold">
                <Clock className="w-3.5 h-3.5 text-blue-600" /> 14:30
              </span>
            </div>
          </div>

          <AssessmentProctor
            isInterrupted={proctor.isInterrupted}
            interruptionReason={proctor.interruptionReason}
            onResumeInterrupted={proctor.resumeAfterInterruption}
          />

          <div className="space-y-3">
            <h2 className="text-base sm:text-lg font-bold text-slate-900 leading-relaxed">
              {currentQ.questionText}
            </h2>

            {currentQ.codeSnippet && (
              <pre className="p-4 rounded-xl bg-slate-900 font-mono text-xs text-blue-200 overflow-x-auto whitespace-pre border border-slate-800 shadow-inner">
                <code>{currentQ.codeSnippet}</code>
              </pre>
            )}
          </div>

          {/* Options with test class selector support: space-y-2.5 */}
          <div className="space-y-2.5">
            {Object.entries(currentQ.options || {}).map(([key, text]) => {
              const isSelected = selectedAnswers[currentQ.id] === key;
              return (
                <button
                  key={key}
                  id={`option-${key}`}
                  onClick={() => handleSelectOption(currentQ.id, key)}
                  className={`w-full p-3.5 rounded-xl border text-left text-xs transition-all flex items-start gap-3 ${
                    isSelected
                      ? 'bg-blue-50/70 border-blue-600 text-blue-900 font-semibold shadow-sm'
                      : 'bg-white border-[#E2E8F0] text-slate-700 hover:border-slate-300 hover:bg-slate-50'
                  }`}
                >
                  <span className={`w-6 h-6 rounded-lg flex items-center justify-center text-xs shrink-0 font-mono font-bold ${
                    isSelected ? 'bg-blue-600 text-white' : 'bg-slate-100 text-slate-600 border border-slate-200'
                  }`}>
                    {key}
                  </span>
                  <span className="flex-1 mt-0.5 leading-relaxed">{text}</span>
                </button>
              );
            })}
          </div>

          <div className="pt-4 border-t border-[#E2E8F0] flex items-center justify-between">
            <span className="text-xs text-slate-500 font-medium">
              {Object.keys(selectedAnswers).length} of {currentQuestions.length} answered
            </span>
            <Button
              onClick={handleNextOrFinish}
              disabled={submitting || selectedAnswers[currentQ.id] === undefined}
              isLoading={submitting}
              size="md"
              icon={currentQIndex === currentQuestions.length - 1 ? Award : ArrowRight}
              iconPosition="right"
            >
              {currentQIndex === currentQuestions.length - 1 ? 'Finish & Submit' : 'Next Question'}
            </Button>
          </div>
        </Card>
      ) : null}
    </div>
  );
};

export default SkillAssessmentPage;
