import React, { useState, useEffect } from 'react';
import {
  Code2,
  Trophy,
  Terminal,
  Award,
  CheckCircle2,
  AlertCircle,
  RefreshCw,
  ExternalLink,
  Trash2,
  ShieldCheck,
  Zap,
  Activity,
  ArrowRight,
  Video,
  Mic,
  Monitor,
  AlertTriangle
} from 'lucide-react';
import { Link } from 'react-router-dom';
import apiService from '../../services/api';
import { PageHeader } from '../../components/common/PageHeader';
import { Button } from '../../components/common/Button';
import { Badge } from '../../components/common/Badge';
import { Card } from '../../components/common/Card';

export const CompetitiveCodingPage = () => {
  const [loading, setLoading] = useState(true);
  const [actionLoading, setActionLoading] = useState(false);
  const [data, setData] = useState({
    connected: false,
    profiles: [],
    overallEvidenceScore: 0,
    totalProblemsSolved: 0,
    peakRating: 0,
    verifiedLanguages: []
  });

  const [leetcodeInput, setLeetcodeInput] = useState('');
  const [codeforcesInput, setCodeforcesInput] = useState('');
  const [statusMessage, setStatusMessage] = useState('');
  const [errorMessage, setErrorMessage] = useState('');

  const loadData = async () => {
    try {
      setLoading(true);
      setErrorMessage('');
      const res = await apiService.getCompetitiveCodingData();
      if (res) {
        setData(res);
        const lc = res.profiles?.find(p => p.platform?.toUpperCase() === 'LEETCODE');
        if (lc?.username) setLeetcodeInput(lc.username);
        const cf = res.profiles?.find(p => p.platform?.toUpperCase() === 'CODEFORCES');
        if (cf?.username) setCodeforcesInput(cf.username);
      }
    } catch (err) {
      console.warn('[CompetitiveCodingPage] Load error:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, []);

  const leetcodeProfile = data.profiles?.find(p => p.platform?.toUpperCase() === 'LEETCODE');
  const codeforcesProfile = data.profiles?.find(p => p.platform?.toUpperCase() === 'CODEFORCES');

  const handleVerifyLeetCode = async () => {
    const username = (leetcodeInput || '').trim();
    if (!username) {
      setErrorMessage('Please enter a valid LeetCode username.');
      return;
    }
    setActionLoading(true);
    setStatusMessage('Querying LeetCode public GraphQL profile and contest history...');
    setErrorMessage('');
    try {
      const res = await apiService.verifyLeetCode(username);
      if (res && res.verificationStatus === 'VERIFIED') {
        setStatusMessage(`Successfully verified LeetCode profile for @${username}! Solved: ${res.problemsSolved}, Contest Rating: ${res.contestRating || 'N/A'}.`);
        await loadData();
      } else {
        setErrorMessage(res?.keyFinding || 'Verification could not be completed. Please check your username.');
        await loadData();
      }
    } catch (err) {
      setErrorMessage(err.message || 'Failed to verify LeetCode profile. Please verify username and network connectivity.');
    } finally {
      setActionLoading(false);
    }
  };

  const handleVerifyCodeforces = async () => {
    const handle = (codeforcesInput || '').trim();
    if (!handle) {
      setErrorMessage('Please enter a valid Codeforces handle.');
      return;
    }
    setActionLoading(true);
    setStatusMessage('Querying Codeforces public API and contest rankings...');
    setErrorMessage('');
    try {
      const res = await apiService.verifyCodeforces(handle);
      if (res && res.verificationStatus === 'VERIFIED') {
        setStatusMessage(`Successfully verified Codeforces profile for @${handle}! Rating: ${res.contestRating || 'N/A'}, Rank: ${res.badgeOrRank || 'Unrated'}.`);
        await loadData();
      } else {
        setErrorMessage(res?.keyFinding || 'Verification could not be completed. Please check your handle.');
        await loadData();
      }
    } catch (err) {
      setErrorMessage(err.message || 'Failed to verify Codeforces handle. Please verify handle and network connectivity.');
    } finally {
      setActionLoading(false);
    }
  };

  const handleDisconnect = async (platform) => {
    if (!window.confirm(`Are you sure you want to disconnect ${platform}? Your competitive coding evidence for this platform will be removed.`)) {
      return;
    }
    setActionLoading(true);
    setStatusMessage(`Disconnecting ${platform}...`);
    setErrorMessage('');
    try {
      await apiService.disconnectCompetitiveCoding(platform);
      setStatusMessage(`Disconnected ${platform}.`);
      if (platform.toUpperCase() === 'LEETCODE') setLeetcodeInput('');
      if (platform.toUpperCase() === 'CODEFORCES') setCodeforcesInput('');
      await loadData();
    } catch (err) {
      setErrorMessage(err.message || `Failed to disconnect ${platform}.`);
    } finally {
      setActionLoading(false);
    }
  };

  return (
    <div className="space-y-6 max-w-7xl mx-auto pb-12">
      <PageHeader
        title="Competitive Programming Verification"
        subtitle="Audit and substantiate algorithmic problem-solving competency from LeetCode and Codeforces with verified contest Elo and solved problem counts."
        badge={<Badge variant="primary" size="xs">Tier 5 Verification</Badge>}
        breadcrumbs={['Student Portal', 'Skill Verification', 'Competitive Coding']}
        actions={
          <div className="flex items-center gap-2">
            <Button
              variant="secondary"
              size="sm"
              onClick={loadData}
              disabled={loading || actionLoading}
              icon={RefreshCw}
            >
              Sync Profiles
            </Button>
            <Link to="/student/skill-map">
              <Button variant="primary" size="sm" icon={ArrowRight} iconPosition="right">
                View Skill Map
              </Button>
            </Link>
          </div>
        }
      />

      {/* Status or Alert Banners */}
      {statusMessage && (
        <div className="p-3.5 rounded-xl bg-emerald-50 border border-emerald-200 flex items-center gap-3 text-xs text-emerald-800 font-medium shadow-2xs">
          <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
          <span className="flex-1">{statusMessage}</span>
          <button onClick={() => setStatusMessage('')} className="text-emerald-700 hover:text-emerald-900 text-xs font-bold px-1">✕</button>
        </div>
      )}

      {errorMessage && (
        <div className="p-3.5 rounded-xl bg-rose-50 border border-rose-200 flex items-center gap-3 text-xs text-rose-800 font-medium shadow-2xs">
          <AlertCircle className="w-4 h-4 text-rose-600 shrink-0" />
          <span className="flex-1">{errorMessage}</span>
          <button onClick={() => setErrorMessage('')} className="text-rose-700 hover:text-rose-900 text-xs font-bold px-1">✕</button>
        </div>
      )}

      {/* Aggregate Metrics Bar */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
        <Card className="p-5 space-y-1.5 border border-[#E2E8F0] bg-white shadow-[0_4px_20px_rgba(15,23,42,0.04)]">
          <span className="text-[11px] font-bold text-slate-500 uppercase tracking-wider block">Competitive Score</span>
          <div className="flex items-baseline gap-1">
            <span className="text-2xl font-black font-mono text-slate-900">{data.overallEvidenceScore || 0}</span>
            <span className="text-xs text-slate-400 font-semibold">/ 100</span>
          </div>
          <span className="inline-flex items-center text-[10px] font-semibold px-2 py-0.5 rounded-full bg-amber-50 text-amber-700 border border-amber-200">Evidence Tier 5</span>
        </Card>

        <Card className="p-5 space-y-1.5 border border-[#E2E8F0] bg-white shadow-[0_4px_20px_rgba(15,23,42,0.04)]">
          <span className="text-[11px] font-bold text-slate-500 uppercase tracking-wider block">Problems Solved</span>
          <div className="flex items-baseline gap-1">
            <span className="text-2xl font-black font-mono text-slate-900">{data.totalProblemsSolved || 0}</span>
            <span className="text-xs text-slate-400 font-semibold">AC</span>
          </div>
          <span className="text-[11px] text-slate-500 block">Across Verified Handles</span>
        </Card>

        <Card className="p-5 space-y-1.5 border border-[#E2E8F0] bg-white shadow-[0_4px_20px_rgba(15,23,42,0.04)]">
          <span className="text-[11px] font-bold text-slate-500 uppercase tracking-wider block">Peak Contest Rating</span>
          <div className="flex items-baseline gap-1">
            <span className="text-2xl font-black font-mono text-slate-900">{data.peakRating || '—'}</span>
          </div>
          <span className="text-[11px] text-slate-500 block">Calibrated Competitive Elo</span>
        </Card>

        <Card className="p-5 space-y-1.5 border border-[#E2E8F0] bg-white shadow-[0_4px_20px_rgba(15,23,42,0.04)]">
          <span className="text-[11px] font-bold text-slate-500 uppercase tracking-wider block">Verified Languages</span>
          <div className="flex flex-wrap gap-1.5 mt-1">
            {Array.isArray(data.verifiedLanguages) && data.verifiedLanguages.length > 0 ? (
              data.verifiedLanguages.map(l => (
                <span key={l} className="text-[10px] font-mono px-2 py-0.5 rounded-full bg-blue-50 text-blue-700 border border-blue-200 font-semibold">
                  {l}
                </span>
              ))
            ) : (
              <span className="text-xs text-slate-400 italic">None verified yet</span>
            )}
          </div>
          <span className="inline-flex items-center text-[10px] font-semibold px-2 py-0.5 rounded-full bg-blue-50 text-blue-700 border border-blue-200 mt-1">Language Rigor Verified</span>
        </Card>
      </div>

      {/* Proctored Timed Competitive Coding Test Arena Banner */}
      <Card id="section-proctored-coding-arena" className="p-6 sm:p-7 border border-[#E2E8F0] bg-white shadow-[0_4px_20px_rgba(15,23,42,0.04)] space-y-5">
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
          <div className="space-y-1.5">
            <div className="flex items-center gap-2">
              <span className="text-[11px] font-bold uppercase tracking-wider text-blue-600">Live Assessment</span>
              <Badge variant="danger" size="xs">
                Mandatory Proctoring
              </Badge>
            </div>
            <h2 className="text-base sm:text-lg font-bold text-slate-900 flex items-center gap-2">
              <Terminal className="w-5 h-5 text-blue-600" />
              Proctored Algorithmic Coding Arena
            </h2>
            <p className="text-xs text-slate-500 max-w-2xl leading-relaxed">
              Take a timed algorithmic defense challenge in Java, Python, or JavaScript with our AI proctor.
              Features compiler execution, hidden test cases, and tab-switch auto-submission.
            </p>
          </div>

          <Link id="btn-launch-proctored-arena" to="/student/ai-interview?mode=COMPETITIVE_CODING">
            <Button variant="primary" size="sm" icon={ArrowRight} iconPosition="right">
              Enter Proctored Coding Arena
            </Button>
          </Link>
        </div>

        {/* Proctoring Pre-requisites & Rules Bar */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 pt-3 border-t border-slate-100 text-xs">
          <div className="p-3 rounded-xl bg-slate-50 border border-slate-200/80 flex items-center gap-2.5 text-slate-700 font-medium">
            <Video className="w-4 h-4 text-blue-600 shrink-0" />
            <span><strong className="text-slate-900">Camera:</strong> Continuous candidate monitoring</span>
          </div>
          <div className="p-3 rounded-xl bg-slate-50 border border-slate-200/80 flex items-center gap-2.5 text-slate-700 font-medium">
            <Mic className="w-4 h-4 text-emerald-600 shrink-0" />
            <span><strong className="text-slate-900">Microphone:</strong> Verbal defense audio</span>
          </div>
          <div className="p-3 rounded-xl bg-slate-50 border border-slate-200/80 flex items-center gap-2.5 text-slate-700 font-medium">
            <Monitor className="w-4 h-4 text-indigo-600 shrink-0" />
            <span><strong className="text-slate-900">Screen:</strong> Session recording capture</span>
          </div>
        </div>

        <div className="p-3.5 rounded-xl bg-amber-50 border border-amber-200 text-amber-800 text-xs flex items-center gap-2.5 font-medium">
          <AlertTriangle className="w-4 h-4 text-amber-600 shrink-0" />
          <span>
            <strong className="font-bold text-amber-900">Enforcement Rule:</strong> Leaving the window or switching tabs triggers immediate auto-submission with 0 score on remaining problems.
          </span>
        </div>
      </Card>

      {/* Main Platform Cards Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* 1. LEETCODE CARD */}
        <Card className={`p-6 space-y-5 border border-[#E2E8F0] bg-white shadow-[0_4px_20px_rgba(15,23,42,0.04)] ${
          leetcodeProfile?.verificationStatus === 'VERIFIED' ? 'ring-1 ring-amber-500/20' : ''
        }`}>
          {/* Card Header */}
          <div className="flex items-center justify-between pb-4 border-b border-slate-100">
            <div className="flex items-center gap-3.5">
              <div className="w-11 h-11 rounded-xl bg-amber-50 border border-amber-200 flex items-center justify-center">
                <Code2 className="w-5 h-5 text-amber-600" />
              </div>
              <div>
                <h3 className="text-base font-bold text-slate-900 flex items-center gap-2">
                  LeetCode
                  {leetcodeProfile?.verificationStatus === 'VERIFIED' && (
                    <Badge variant="success" size="xs" icon={CheckCircle2}>
                      VERIFIED
                    </Badge>
                  )}
                  {leetcodeProfile?.verificationStatus === 'FAILED' && (
                    <Badge variant="danger" size="xs">
                      VERIFICATION FAILED
                    </Badge>
                  )}
                  {(!leetcodeProfile || leetcodeProfile.verificationStatus === 'UNVERIFIED') && (
                    <Badge variant="neutral" size="xs">
                      NOT CONNECTED
                    </Badge>
                  )}
                </h3>
                <p className="text-xs text-slate-500">DSA problem count & contest rating</p>
              </div>
            </div>

            {leetcodeProfile?.username && (
              <a
                href={leetcodeProfile.profileUrl || `https://leetcode.com/${leetcodeProfile.username}`}
                target="_blank"
                rel="noreferrer"
                className="text-xs text-amber-700 hover:text-amber-800 font-mono font-semibold flex items-center gap-1.5 bg-amber-50 border border-amber-200 px-3 py-1 rounded-full shadow-2xs"
              >
                <span>@{leetcodeProfile.username}</span>
                <ExternalLink className="w-3 h-3" />
              </a>
            )}
          </div>

          {/* Body Content */}
          <div className="space-y-4">
            {leetcodeProfile?.verificationStatus === 'VERIFIED' ? (
              <>
                {/* Solved Statistics Grid */}
                <div className="grid grid-cols-4 gap-2.5 text-center text-xs">
                  <div className="p-3 rounded-xl bg-slate-50 border border-slate-200">
                    <span className="text-[10px] text-slate-500 uppercase font-bold block">Total Solved</span>
                    <strong className="text-base font-mono font-black text-slate-900 mt-0.5 block">{leetcodeProfile.problemsSolved}</strong>
                  </div>
                  <div className="p-3 rounded-xl bg-emerald-50 border border-emerald-200">
                    <span className="text-[10px] text-emerald-700 uppercase font-bold block">Easy</span>
                    <strong className="text-base font-mono font-black text-emerald-800 mt-0.5 block">{leetcodeProfile.easySolved || 0}</strong>
                  </div>
                  <div className="p-3 rounded-xl bg-amber-50 border border-amber-200">
                    <span className="text-[10px] text-amber-700 uppercase font-bold block">Medium</span>
                    <strong className="text-base font-mono font-black text-amber-800 mt-0.5 block">{leetcodeProfile.mediumSolved || 0}</strong>
                  </div>
                  <div className="p-3 rounded-xl bg-rose-50 border border-rose-200">
                    <span className="text-[10px] text-rose-700 uppercase font-bold block">Hard</span>
                    <strong className="text-base font-mono font-black text-rose-800 mt-0.5 block">{leetcodeProfile.hardSolved || 0}</strong>
                  </div>
                </div>

                {/* Contest Rating & Global Rank */}
                <div className="grid grid-cols-2 gap-3 text-xs">
                  <div className="p-3 rounded-xl bg-slate-50 border border-slate-200 flex items-center justify-between">
                    <div>
                      <span className="text-[10px] text-slate-500 font-bold uppercase block">Contest Rating</span>
                      <strong className="text-sm font-mono font-black text-amber-800">
                        {leetcodeProfile.contestRating ? Math.round(leetcodeProfile.contestRating) : 'Not Ranked'}
                      </strong>
                    </div>
                    <Trophy className="w-5 h-5 text-amber-500" />
                  </div>

                  <div className="p-3 rounded-xl bg-slate-50 border border-slate-200 flex items-center justify-between">
                    <div>
                      <span className="text-[10px] text-slate-500 font-bold uppercase block">Global Ranking</span>
                      <strong className="text-sm font-mono font-black text-slate-900">
                        {leetcodeProfile.globalRank ? `#${leetcodeProfile.globalRank.toLocaleString()}` : 'Active'}
                      </strong>
                    </div>
                    <Activity className="w-5 h-5 text-blue-600" />
                  </div>
                </div>

                {/* Verified Languages */}
                <div className="p-3 rounded-xl bg-slate-50 border border-slate-200">
                  <span className="text-[10px] text-slate-500 font-bold uppercase block mb-1.5">Languages Verified</span>
                  <div className="flex flex-wrap gap-1.5">
                    {leetcodeProfile.verifiedLanguages && leetcodeProfile.verifiedLanguages.length > 0 ? (
                      leetcodeProfile.verifiedLanguages.map(lang => (
                        <span key={lang} className="text-[10px] font-mono px-2 py-0.5 rounded-full bg-white text-slate-700 border border-slate-200 font-semibold shadow-2xs">
                          {lang}
                        </span>
                      ))
                    ) : (
                      <span className="text-xs text-slate-400 italic">No specific languages registered</span>
                    )}
                  </div>
                </div>

                {/* Actions: Re-verify / Disconnect */}
                <div className="pt-3 border-t border-slate-100 flex items-center justify-between gap-3">
                  <span className="text-xs text-slate-500">
                    Evidence Weight: <strong className="text-amber-600 font-bold">{Math.round(leetcodeProfile.evidenceScore || 0)}%</strong>
                  </span>
                  <div className="flex items-center gap-2">
                    <Button
                      size="xs"
                      variant="secondary"
                      onClick={handleVerifyLeetCode}
                      disabled={actionLoading}
                      isLoading={actionLoading}
                      icon={RefreshCw}
                    >
                      Re-verify
                    </Button>
                    <button
                      onClick={() => handleDisconnect('LEETCODE')}
                      disabled={actionLoading}
                      className="p-1.5 rounded-lg text-slate-400 hover:text-rose-600 hover:bg-rose-50 transition-colors"
                      title="Disconnect LeetCode"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                </div>
              </>
            ) : (
              /* Connect Form */
              <div className="space-y-3">
                <p className="text-xs text-slate-500 leading-relaxed">
                  Enter your public LeetCode username to verify your AC problem stats and contest ranking via GraphQL.
                </p>
                <div className="flex items-center gap-2">
                  <input
                    type="text"
                    value={leetcodeInput}
                    onChange={(e) => setLeetcodeInput(e.target.value)}
                    placeholder="e.g. your_handle"
                    disabled={actionLoading}
                    className="flex-1 px-3.5 py-2 rounded-xl bg-white border border-slate-300 text-xs text-slate-900 placeholder-slate-400 focus:outline-none focus:border-blue-600 focus:ring-1 focus:ring-blue-600/30 font-mono shadow-2xs"
                  />
                  <Button
                    size="sm"
                    variant="primary"
                    onClick={handleVerifyLeetCode}
                    disabled={actionLoading || !leetcodeInput.trim()}
                    isLoading={actionLoading}
                    icon={ShieldCheck}
                  >
                    Verify
                  </Button>
                </div>
              </div>
            )}
          </div>
        </Card>

        {/* 2. CODEFORCES CARD */}
        <Card className={`p-6 space-y-5 border border-[#E2E8F0] bg-white shadow-[0_4px_20px_rgba(15,23,42,0.04)] ${
          codeforcesProfile?.verificationStatus === 'VERIFIED' ? 'ring-1 ring-blue-500/20' : ''
        }`}>
          {/* Card Header */}
          <div className="flex items-center justify-between pb-4 border-b border-slate-100">
            <div className="flex items-center gap-3.5">
              <div className="w-11 h-11 rounded-xl bg-blue-50 border border-blue-200 flex items-center justify-center">
                <Terminal className="w-5 h-5 text-blue-600" />
              </div>
              <div>
                <h3 className="text-base font-bold text-slate-900 flex items-center gap-2">
                  Codeforces
                  {codeforcesProfile?.verificationStatus === 'VERIFIED' && (
                    <Badge variant="success" size="xs" icon={CheckCircle2}>
                      VERIFIED
                    </Badge>
                  )}
                  {codeforcesProfile?.verificationStatus === 'FAILED' && (
                    <Badge variant="danger" size="xs">
                      VERIFICATION FAILED
                    </Badge>
                  )}
                  {(!codeforcesProfile || codeforcesProfile.verificationStatus === 'UNVERIFIED') && (
                    <Badge variant="neutral" size="xs">
                      NOT CONNECTED
                    </Badge>
                  )}
                </h3>
                <p className="text-xs text-slate-500">Contest Elo & official rank</p>
              </div>
            </div>

            {codeforcesProfile?.username && (
              <a
                href={codeforcesProfile.profileUrl || `https://codeforces.com/profile/${codeforcesProfile.username}`}
                target="_blank"
                rel="noreferrer"
                className="text-xs text-blue-700 hover:text-blue-800 font-mono font-semibold flex items-center gap-1.5 bg-blue-50 border border-blue-200 px-3 py-1 rounded-full shadow-2xs"
              >
                <span>@{codeforcesProfile.username}</span>
                <ExternalLink className="w-3 h-3" />
              </a>
            )}
          </div>

          {/* Body Content */}
          <div className="space-y-4">
            {codeforcesProfile?.verificationStatus === 'VERIFIED' ? (
              <>
                {/* Rating and Rank Badges */}
                <div className="grid grid-cols-3 gap-2.5 text-center text-xs">
                  <div className="p-3 rounded-xl bg-blue-50 border border-blue-200">
                    <span className="text-[10px] text-blue-700 uppercase font-bold block">Current Rating</span>
                    <strong className="text-base font-mono font-black text-blue-900 mt-0.5 block">
                      {codeforcesProfile.contestRating ? Math.round(codeforcesProfile.contestRating) : 'Unrated'}
                    </strong>
                  </div>
                  <div className="p-3 rounded-xl bg-slate-50 border border-slate-200">
                    <span className="text-[10px] text-slate-500 uppercase font-bold block">Title / Rank</span>
                    <strong className="text-xs font-bold text-slate-900 mt-0.5 block truncate">
                      {codeforcesProfile.badgeOrRank || 'Candidate'}
                    </strong>
                  </div>
                  <div className="p-3 rounded-xl bg-slate-50 border border-slate-200">
                    <span className="text-[10px] text-slate-500 uppercase font-bold block">Submissions</span>
                    <strong className="text-base font-mono font-black text-slate-900 mt-0.5 block">
                      {codeforcesProfile.problemsSolved || 'Active'}
                    </strong>
                  </div>
                </div>

                {/* Verified Languages */}
                <div className="p-3 rounded-xl bg-slate-50 border border-slate-200">
                  <span className="text-[10px] text-slate-500 font-bold uppercase block mb-1.5">Languages Verified</span>
                  <div className="flex flex-wrap gap-1.5">
                    {codeforcesProfile.verifiedLanguages && codeforcesProfile.verifiedLanguages.length > 0 ? (
                      codeforcesProfile.verifiedLanguages.map(lang => (
                        <span key={lang} className="text-[10px] font-mono px-2 py-0.5 rounded-full bg-white text-slate-700 border border-slate-200 font-semibold shadow-2xs">
                          {lang}
                        </span>
                      ))
                    ) : (
                      <span className="text-xs text-slate-400 italic">No specific languages registered</span>
                    )}
                  </div>
                </div>

                {/* Actions: Re-verify / Disconnect */}
                <div className="pt-3 border-t border-slate-100 flex items-center justify-between gap-3">
                  <span className="text-xs text-slate-500">
                    Evidence Weight: <strong className="text-blue-600 font-bold">{Math.round(codeforcesProfile.evidenceScore || 0)}%</strong>
                  </span>
                  <div className="flex items-center gap-2">
                    <Button
                      size="xs"
                      variant="secondary"
                      onClick={handleVerifyCodeforces}
                      disabled={actionLoading}
                      isLoading={actionLoading}
                      icon={RefreshCw}
                    >
                      Re-verify
                    </Button>
                    <button
                      onClick={() => handleDisconnect('CODEFORCES')}
                      disabled={actionLoading}
                      className="p-1.5 rounded-lg text-slate-400 hover:text-rose-600 hover:bg-rose-50 transition-colors"
                      title="Disconnect Codeforces"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                </div>
              </>
            ) : (
              /* Connect Form */
              <div className="space-y-3">
                <p className="text-xs text-slate-500 leading-relaxed">
                  Enter your Codeforces handle to query your official contest rating and submission distribution.
                </p>
                <div className="flex items-center gap-2">
                  <input
                    type="text"
                    value={codeforcesInput}
                    onChange={(e) => setCodeforcesInput(e.target.value)}
                    placeholder="e.g. your_handle"
                    disabled={actionLoading}
                    className="flex-1 px-3.5 py-2 rounded-xl bg-white border border-slate-300 text-xs text-slate-900 placeholder-slate-400 focus:outline-none focus:border-blue-600 focus:ring-1 focus:ring-blue-600/30 font-mono shadow-2xs"
                  />
                  <Button
                    size="sm"
                    variant="primary"
                    onClick={handleVerifyCodeforces}
                    disabled={actionLoading || !codeforcesInput.trim()}
                    isLoading={actionLoading}
                    icon={ShieldCheck}
                  >
                    Verify
                  </Button>
                </div>
              </div>
            )}
          </div>
        </Card>
      </div>

      {/* Transparent Weighting Model Card */}
      <Card className="p-6 space-y-4 border border-[#E2E8F0] bg-white shadow-[0_4px_20px_rgba(15,23,42,0.04)]">
        <div className="flex items-center gap-2">
          <Zap className="w-5 h-5 text-blue-600" />
          <h3 className="text-xs font-bold text-slate-900 uppercase tracking-wider">
            Evidence Engine & Weighting Model
          </h3>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-xs">
          <div className="p-4 rounded-xl bg-amber-50/70 border border-amber-200/80 space-y-1.5">
            <span className="text-[11px] font-bold text-amber-800 uppercase tracking-wider block">40% Volume & Difficulty</span>
            <p className="text-slate-600 text-xs leading-relaxed">
              Medium problems count 2× and Hard problems count 4× relative to Easy problems.
            </p>
          </div>

          <div className="p-4 rounded-xl bg-blue-50/70 border border-blue-200/80 space-y-1.5">
            <span className="text-[11px] font-bold text-blue-800 uppercase tracking-wider block">40% Contest Elo Calibration</span>
            <p className="text-slate-600 text-xs leading-relaxed">
              Performance under timed contest pressure scaled against global competitive percentiles.
            </p>
          </div>

          <div className="p-4 rounded-xl bg-emerald-50/70 border border-emerald-200/80 space-y-1.5">
            <span className="text-[11px] font-bold text-emerald-800 uppercase tracking-wider block">20% Language Precision</span>
            <p className="text-slate-600 text-xs leading-relaxed">
              Algorithmic solutions authored in standard languages mapped to respective skills.
            </p>
          </div>
        </div>
      </Card>
    </div>
  );
};

export default CompetitiveCodingPage;
