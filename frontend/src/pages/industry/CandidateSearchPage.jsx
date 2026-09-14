import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import {
  Search, Filter, ShieldCheck, Award, CheckCircle2, User, ExternalLink,
  Star, X, Loader2, Sparkles, Building2, Send, FileText, Check, Clock,
  AlertCircle, Briefcase, ChevronRight
} from 'lucide-react';
import { VerifiedBadge, Badge } from '../../components/common/Badge';
import { PageHeader } from '../../components/common/PageHeader';
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from '../../components/common/Card';
import { Button } from '../../components/common/Button';
import { EmptyState } from '../../components/common/EmptyState';
import apiService from '../../services/api';

export const CandidateSearchPage = () => {
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedSkill, setSelectedSkill] = useState('ALL');
  const [minScore, setMinScore] = useState(0);
  const [candidates, setCandidates] = useState([]);
  const [loading, setLoading] = useState(true);
  const [updatingId, setUpdatingId] = useState(null);

  // Joining Letter state
  const [selectedCandidateForLetter, setSelectedCandidateForLetter] = useState(null);
  const [viewingCandidateLetter, setViewingCandidateLetter] = useState(null);
  const [letterRole, setLetterRole] = useState('');
  const [letterSalary, setLetterSalary] = useState('');
  const [letterJoiningDate, setLetterJoiningDate] = useState('01 November 2026');
  const [letterText, setLetterText] = useState('');
  const [isSendingLetter, setIsSendingLetter] = useState(false);
  const [letterSuccessMsg, setLetterSuccessMsg] = useState('');

  const fetchCandidates = async (search, skill, readiness) => {
    setLoading(true);
    try {
      const res = await apiService.getCandidates(
        search || '',
        skill === 'ALL' ? '' : skill,
        readiness
      );
      if (Array.isArray(res)) {
        setCandidates(res.filter(c => c.name !== 'Alice Smith'));
      } else {
        setCandidates([]);
      }
    } catch (err) {
      console.warn('[CandidateSearch] Failed to fetch candidates:', err.message);
      setCandidates([]);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    const timer = setTimeout(() => {
      fetchCandidates(searchQuery, selectedSkill, minScore);
    }, 250);
    return () => clearTimeout(timer);
  }, [searchQuery, selectedSkill, minScore]);

  const toggleShortlist = async (cand) => {
    const isCurrentlyShortlisted = cand.applicationStatus === 'SHORTLISTED' || cand.status === 'SHORTLISTED';
    const newStatus = isCurrentlyShortlisted ? 'APPLIED' : 'SHORTLISTED';

    if (cand.applicationId && cand.applicationId > 0) {
      try {
        setUpdatingId(cand.applicationId);
        await apiService.updateApplicationStatus(cand.applicationId, newStatus);
        setCandidates(prev => prev.map(c =>
          c.applicationId === cand.applicationId
            ? { ...c, applicationStatus: newStatus, status: newStatus }
            : c
        ));
        const studentEmail = cand.email || cand.candidateEmail || 'leooo@gmail.com';
        const companyName = cand.company || cand.companyName || 'NovaTech Solutions';
        const jobTitle = cand.jobTitle || 'Opportunity';

        if (newStatus === 'SHORTLISTED') {
          const notif = {
            id: `shortlist_${cand.applicationId || cand.jobId}`,
            title: `Shortlisted by ${companyName}!`,
            message: `Congratulations! You have been shortlisted for ${jobTitle} at ${companyName}. Click to view details.`,
            company: companyName,
            jobTitle: jobTitle,
            status: 'Shortlisted',
            jobId: cand.jobId,
            applicationId: cand.applicationId,
            time: 'Just now',
            type: 'job',
            link: `/student/jobs?jobId=${cand.jobId}`,
            read: false
          };

          const key1 = `skillproof_real_notifs_${studentEmail}`;
          const existing = JSON.parse(localStorage.getItem(key1) || '[]');
          const updated = [notif, ...existing.filter(n => n.id !== notif.id)];
          localStorage.setItem(key1, JSON.stringify(updated));

          const genKey = 'skillproof_student_notifications';
          const genExisting = JSON.parse(localStorage.getItem(genKey) || '[]');
          localStorage.setItem(genKey, JSON.stringify([notif, ...genExisting.filter(n => n.id !== notif.id)]));
        } else {
          const key1 = `skillproof_real_notifs_${studentEmail}`;
          const existing = JSON.parse(localStorage.getItem(key1) || '[]');
          const updated = existing.filter(n => n.id !== `shortlist_${cand.applicationId || cand.jobId}`);
          localStorage.setItem(key1, JSON.stringify(updated));
        }

        window.dispatchEvent(new CustomEvent('skillproof_application_updated', {
          detail: {
            applicationId: cand.applicationId,
            jobId: cand.jobId,
            status: newStatus,
            company: companyName,
            jobTitle,
            studentEmail
          }
        }));
      } catch (err) {
        console.error('Failed to update candidate application status:', err);
      } finally {
        setUpdatingId(null);
      }
    } else {
      setCandidates(prev => prev.map(c =>
        c.id === cand.id
          ? { ...c, applicationStatus: newStatus, status: newStatus }
          : c
      ));
    }
  };

  const openSendLetterModal = (cand) => {
    setSelectedCandidateForLetter(cand);
    setLetterRole(cand.jobTitle || cand.targetRole || 'Junior Full-Stack Engineer');
    setLetterSalary(cand.salary || '₹8,50,000 / annum');
    setLetterJoiningDate(cand.joiningLetterJoiningDate || '01 November 2026');
    const company = cand.company || 'NovaTech Solutions';
    setLetterText(
      `Dear ${cand.name},\n\nWe were highly impressed by your verified 4-Tier Skill Passport (#${cand.passportId || cand.id}) and demonstrated competencies. On behalf of ${company}, we are delighted to offer you the position of ${cand.jobTitle || cand.targetRole || 'Junior Full-Stack Engineer'}.\n\nReporting Date: 01 November 2026\nAnnual CTC: ₹8,50,000 / annum\nLocation: Hybrid / Bangalore Campus\n\nPlease review and submit your formal acceptance through the SKILLPROOF verified portal.`
    );
    setLetterSuccessMsg('');
  };

  const handleSendJoiningLetter = async (e) => {
    e.preventDefault();
    if (!selectedCandidateForLetter || !selectedCandidateForLetter.applicationId) return;

    setIsSendingLetter(true);
    try {
      const payload = {
        role: letterRole,
        salary: letterSalary,
        joiningDate: letterJoiningDate,
        letterText: letterText
      };
      await apiService.sendJoiningLetter(selectedCandidateForLetter.applicationId, payload);
      setLetterSuccessMsg('Official Joining Letter successfully dispatched to student!');

      setCandidates(prev => prev.map(c =>
        c.applicationId === selectedCandidateForLetter.applicationId
          ? {
              ...c,
              applicationStatus: 'AWAITING_STUDENT_ACCEPTANCE',
              status: 'AWAITING_STUDENT_ACCEPTANCE',
              joiningLetterRole: letterRole,
              joiningLetterSalary: letterSalary,
              joiningLetterJoiningDate: letterJoiningDate,
              joiningLetterText: letterText,
              joiningLetterSentAt: new Date().toISOString()
            }
          : c
      ));

      window.dispatchEvent(new CustomEvent('skillproof_application_updated', {
        detail: {
          applicationId: selectedCandidateForLetter.applicationId,
          status: 'AWAITING_STUDENT_ACCEPTANCE'
        }
      }));

      setTimeout(() => {
        setSelectedCandidateForLetter(null);
        setLetterSuccessMsg('');
      }, 1000);
    } catch (err) {
      console.error('Failed to send joining letter:', err);
    } finally {
      setIsSendingLetter(false);
    }
  };

  return (
    <div className="space-y-6 max-w-6xl mx-auto pb-12 animate-fade-in">
      <PageHeader
        title="Candidate Discovery Engine"
        description="Filter and evaluate applicants with verified 4-tier skill passports, proctored code, and interview defense scores"
        badge={<Badge variant="primary" size="sm">Proof-Based Sourcing</Badge>}
        breadcrumbs={[
          { label: 'Industry Portal', href: '#/industry/dashboard' },
          { label: 'Candidate Search' }
        ]}
      />

      {/* Filter & Search Bar */}
      <Card className="border border-[#E2E8F0] bg-white shadow-[0_4px_24px_rgba(15,23,42,0.05)] rounded-2xl">
        <CardContent className="p-5 sm:p-6 space-y-4">
          <div className="relative">
            <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400 pointer-events-none" />
            <input
              type="text"
              placeholder="Search candidate name, skill, degree, institution, or passport ID..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pl-10 pr-10 py-2.5 bg-white border border-[#E2E8F0] rounded-xl text-sm text-slate-900 placeholder-[#94A3B8] focus:outline-none focus:border-[#2563EB] focus:ring-2 focus:ring-blue-500/10 shadow-2xs transition-all"
            />
            {searchQuery && (
              <button
                onClick={() => setSearchQuery('')}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600"
              >
                <X className="w-4 h-4" />
              </button>
            )}
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 items-center pt-3 border-t border-slate-100">
            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1.5">Technology Specialization</label>
              <select
                value={selectedSkill}
                onChange={(e) => setSelectedSkill(e.target.value)}
                className="w-full px-3.5 py-2.5 bg-white border border-[#E2E8F0] rounded-xl text-sm text-slate-900 focus:outline-none focus:border-[#2563EB] focus:ring-2 focus:ring-blue-500/10 shadow-2xs transition-colors"
              >
                <option value="ALL">All Technologies</option>
                <option value="Java">Java</option>
                <option value="Spring Boot">Spring Boot</option>
                <option value="SQL">SQL / PostgreSQL</option>
                <option value="React">React</option>
                <option value="Go">Go / Golang</option>
                <option value="Docker">Docker</option>
                <option value="TypeScript">TypeScript</option>
                <option value="Python">Python</option>
              </select>
            </div>

            <div>
              <div className="flex justify-between text-xs font-bold text-slate-700 mb-1.5">
                <span>Minimum Placement Readiness</span>
                <span className="font-mono text-blue-600 font-bold">{minScore}%</span>
              </div>
              <input
                type="range"
                min="0"
                max="100"
                step="5"
                value={minScore}
                onChange={(e) => setMinScore(Number(e.target.value))}
                className="w-full accent-blue-600 h-2 bg-slate-100 rounded-lg cursor-pointer"
              />
            </div>

            <div className="sm:text-right pt-2 sm:pt-0">
              <span className="text-xs text-slate-500">Verified Candidates: </span>
              <span className="text-sm font-bold text-blue-600 font-mono ml-1">
                {loading ? '...' : `${candidates.length} Profiles`}
              </span>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Loading state */}
      {loading && (
        <div className="flex items-center justify-center py-16 gap-3 text-slate-500 text-sm">
          <div className="w-5 h-5 border-2 border-blue-600 border-t-transparent rounded-full animate-spin" />
          <span>Searching verified candidate database...</span>
        </div>
      )}

      {/* Candidates List */}
      {!loading && candidates.length === 0 && (
        <EmptyState
          icon={User}
          title="No Matching Candidates Found"
          description="Adjust your search filters, lower the minimum readiness score, or select 'All Technologies' to widen candidate matching."
          actionLabel={searchQuery || selectedSkill !== 'ALL' || minScore > 0 ? "Reset All Filters" : undefined}
          onAction={() => {
            setSearchQuery('');
            setSelectedSkill('ALL');
            setMinScore(0);
          }}
        />
      )}

      {!loading && candidates.length > 0 && (
        <div className="space-y-4">
          {candidates.map((cand) => {
            const isShortlisted = cand.applicationStatus === 'SHORTLISTED' || cand.status === 'SHORTLISTED';
            const isLive = cand.isRealApplication;
            const passportId = cand.passportId || cand.id;

            return (
              <Card
                key={cand.applicationId || cand.id}
                className={`border border-[#E2E8F0] bg-white shadow-[0_4px_24px_rgba(15,23,42,0.05)] rounded-2xl hover:border-blue-200 transition-all ${
                  isLive ? 'ring-1 ring-blue-500/20' : ''
                }`}
              >
                <CardContent className="p-6 space-y-4">
                  {/* Card Header */}
                  <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-4 border-b border-slate-100">
                    <div className="flex items-center gap-3.5">
                      <div className="w-11 h-11 rounded-xl bg-blue-50 border border-blue-200 flex items-center justify-center font-bold text-blue-600 text-base shrink-0 shadow-2xs">
                        {cand.name ? cand.name[0].toUpperCase() : 'C'}
                      </div>
                      <div>
                        <div className="flex flex-wrap items-center gap-2">
                          <h3 className="font-bold text-slate-900 text-base">{cand.name}</h3>
                          <span className="text-[11px] font-mono font-semibold px-2.5 py-0.5 rounded-full bg-blue-50 text-blue-700 border border-blue-200">
                            #{passportId}
                          </span>
                          {isLive ? (
                            <Badge variant="success" size="sm" dot>Live Applicant</Badge>
                          ) : (
                            <Badge variant="neutral" size="sm">Sample Profile</Badge>
                          )}
                          {cand.jobTitle && (
                            <Badge variant="primary" size="sm">
                              Opportunity: {cand.jobTitle}
                            </Badge>
                          )}
                        </div>
                        <p className="text-xs text-slate-500 mt-0.5">
                          {cand.degree} • {cand.college}
                        </p>
                      </div>
                    </div>

                    <div className="flex items-center gap-3 self-start sm:self-center">
                      <div className="p-2 px-3.5 rounded-xl bg-blue-50/80 border border-blue-100 text-center">
                        <div className="text-xl font-mono font-black text-blue-600">{cand.readiness}%</div>
                        <div className="text-[10px] text-blue-700 uppercase font-bold tracking-wider">Readiness</div>
                      </div>
                      <Badge variant="success" size="sm">
                        {cand.tier || 'Tier 4 Verified'}
                      </Badge>
                    </div>
                  </div>

                  {/* Verified Skills */}
                  {Array.isArray(cand.skills) && cand.skills.length > 0 && (
                    <div className="flex flex-wrap gap-2">
                      {cand.skills.map((skill, sIdx) => (
                        <div
                          key={sIdx}
                          className="px-3 py-1 rounded-full bg-slate-50 border border-slate-200/90 flex items-center gap-2 shadow-2xs"
                        >
                          <span className="text-xs font-bold text-slate-800">{skill.name}</span>
                          <span className="text-xs font-mono font-bold text-blue-600">{skill.score}%</span>
                          <VerifiedBadge level={skill.badge || 'SILVER'} size="sm" compact={true} />
                        </div>
                      ))}
                    </div>
                  )}

                  {/* AI Interview Arena Verification Tag */}
                  {(cand.tier === 'ALL_4_TIERS_VERIFIED' || cand.readiness >= 20) && (
                    <div className="flex items-center gap-2 text-[11px] font-mono text-blue-700 bg-blue-50 px-3 py-1 rounded-full border border-blue-200 w-fit font-semibold shadow-2xs">
                      <span className="w-1.5 h-1.5 rounded-full bg-blue-600 animate-pulse" />
                      <span>AI Interview Arena: Tier 4 Adaptive Defense Evaluated</span>
                    </div>
                  )}

                  {/* 3-Actor Workflow Status Banners */}
                  {cand.status === 'AWAITING_STUDENT_ACCEPTANCE' && (
                    <div className="p-3.5 rounded-xl bg-blue-50 border border-blue-200 flex items-center justify-between gap-2 text-xs text-blue-800 font-medium">
                      <div className="flex items-center gap-2 text-blue-700">
                        <Clock className="w-4 h-4 text-blue-600 shrink-0" />
                        <span>Joining Letter Dispatched ({cand.joiningLetterRole || cand.jobTitle}) — Awaiting Student Response</span>
                      </div>
                      <Button
                        variant="secondary"
                        size="xs"
                        icon={FileText}
                        onClick={() => setViewingCandidateLetter(cand)}
                      >
                        View Letter
                      </Button>
                    </div>
                  )}

                  {cand.status === 'STUDENT_ACCEPTED' && (
                    <div className="p-3.5 rounded-xl bg-amber-50 border border-amber-200 flex items-center justify-between gap-2 text-xs text-amber-800 font-medium">
                      <div className="flex items-center gap-2 text-amber-700">
                        <Check className="w-4 h-4 text-amber-600 shrink-0" />
                        <span>Student Accepted Offer! Pending Academic Verification & Department Approval.</span>
                      </div>
                      <Button
                        variant="secondary"
                        size="xs"
                        icon={FileText}
                        onClick={() => setViewingCandidateLetter(cand)}
                      >
                        View Offer & Acceptance
                      </Button>
                    </div>
                  )}

                  {cand.status === 'CONFIRMED' && (
                    <div className="p-4 rounded-xl bg-emerald-50 border border-emerald-200 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 text-xs text-emerald-800 font-medium">
                      <div className="space-y-0.5">
                        <div className="flex items-center gap-2 text-emerald-800 font-bold">
                          <CheckCircle2 className="w-4 h-4 text-emerald-600" />
                          <span>PLACEMENT CONFIRMED / JOINING APPROVED</span>
                        </div>
                        <p className="text-[11px] text-emerald-700">
                          Candidate accepted offer • Academic Endorsement granted by <strong className="text-emerald-900">{cand.academicApproverName || 'Faculty Mentor'}</strong>
                        </p>
                      </div>
                      <Button
                        variant="success"
                        size="xs"
                        icon={ShieldCheck}
                        onClick={() => setViewingCandidateLetter(cand)}
                      >
                        Placement Dossier
                      </Button>
                    </div>
                  )}

                  {cand.status === 'STUDENT_DECLINED' && (
                    <div className="p-3.5 rounded-xl bg-rose-50 border border-rose-200 flex items-center gap-2 text-xs text-rose-800 font-medium">
                      <AlertCircle className="w-4 h-4 text-rose-600 shrink-0" />
                      <span>Student declined this offer. Remarks: {cand.studentRemarks || 'Declined'}</span>
                    </div>
                  )}

                  {cand.status === 'ACADEMICALLY_REJECTED' && (
                    <div className="p-3.5 rounded-xl bg-rose-50 border border-rose-200 flex items-center gap-2 text-xs text-rose-800 font-medium">
                      <AlertCircle className="w-4 h-4 text-rose-600 shrink-0" />
                      <span>Academic approval withheld: {cand.academicComments || 'Criteria not met'}</span>
                    </div>
                  )}

                  {/* Actions & Footer */}
                  <div className="flex flex-col sm:flex-row items-center justify-between gap-3 pt-2">
                    <div className="flex flex-wrap items-center gap-3 text-xs text-slate-500">
                      <span className="flex items-center gap-1.5 text-slate-700 font-medium">
                        <Briefcase className="w-4 h-4 text-blue-600" />
                        <span>Opportunity: <strong className="text-slate-900 font-bold">{cand.jobTitle || cand.targetRole}</strong></span>
                      </span>
                      {cand.appliedAt && (
                        <span className="text-slate-400 hidden sm:inline">
                          • Applied: {new Date(cand.appliedAt).toLocaleDateString()}
                        </span>
                      )}
                    </div>

                    <div className="flex flex-wrap items-center gap-2 w-full sm:w-auto">
                      <Button
                        variant={isShortlisted ? 'warning' : 'outline'}
                        size="sm"
                        icon={Star}
                        disabled={updatingId === cand.applicationId || cand.status === 'CONFIRMED'}
                        onClick={() => toggleShortlist(cand)}
                      >
                        {isShortlisted ? 'Shortlisted' : 'Shortlist'}
                      </Button>

                      {(isShortlisted || cand.status === 'SHORTLISTED') && cand.status !== 'AWAITING_STUDENT_ACCEPTANCE' && cand.status !== 'STUDENT_ACCEPTED' && cand.status !== 'CONFIRMED' && (
                        <Button
                          variant="primary"
                          size="sm"
                          icon={Send}
                          onClick={() => openSendLetterModal(cand)}
                        >
                          Send Joining Letter
                        </Button>
                      )}

                      <Link
                        to={`/verify/${passportId}`}
                        target="_blank"
                        rel="noopener noreferrer"
                      >
                        <Button variant="secondary" size="sm" icon={ShieldCheck}>
                          Inspect Passport
                        </Button>
                      </Link>
                    </div>
                  </div>
                </CardContent>
              </Card>
            );
          })}
        </div>
      )}

      {/* Send Joining Letter Modal */}
      {selectedCandidateForLetter && (
        <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-white border border-slate-200 rounded-2xl w-full max-w-xl p-6 space-y-5 shadow-2xl relative animate-fade-in">
            <button
              onClick={() => setSelectedCandidateForLetter(null)}
              className="absolute top-5 right-5 text-slate-400 hover:text-slate-600 p-1.5 rounded-full hover:bg-slate-100 transition-colors"
            >
              <X className="w-5 h-5" />
            </button>

            <div className="space-y-1">
              <div className="flex items-center gap-2">
                <Send className="w-5 h-5 text-blue-600" />
                <h2 className="text-lg font-bold text-slate-900">Send Official Joining Letter</h2>
              </div>
              <p className="text-xs text-slate-500">
                Extend formal offer to <strong className="text-slate-900 font-semibold">{selectedCandidateForLetter.name}</strong> ({selectedCandidateForLetter.degree}) for opportunity: <strong className="text-blue-600 font-semibold">{selectedCandidateForLetter.jobTitle}</strong>.
              </p>
            </div>

            {letterSuccessMsg ? (
              <div className="p-4 rounded-xl bg-emerald-50 border border-emerald-200 text-emerald-800 text-xs font-medium flex items-center gap-2">
                <CheckCircle2 className="w-5 h-5 text-emerald-600 shrink-0" />
                <span>{letterSuccessMsg}</span>
              </div>
            ) : (
              <form onSubmit={handleSendJoiningLetter} className="space-y-4">
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-xs font-semibold text-slate-700 mb-1.5">Designation / Role</label>
                    <input
                      type="text"
                      value={letterRole}
                      onChange={(e) => setLetterRole(e.target.value)}
                      required
                      className="w-full px-3 py-2 bg-white border border-slate-300 rounded-xl text-sm text-slate-900 placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-600 transition-all"
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-semibold text-slate-700 mb-1.5">Annual CTC / Compensation</label>
                    <input
                      type="text"
                      value={letterSalary}
                      onChange={(e) => setLetterSalary(e.target.value)}
                      required
                      className="w-full px-3 py-2 bg-white border border-slate-300 rounded-xl text-sm text-slate-900 placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-600 transition-all"
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1.5">Expected Joining Date</label>
                  <input
                    type="text"
                    value={letterJoiningDate}
                    onChange={(e) => setLetterJoiningDate(e.target.value)}
                    required
                    className="w-full px-3 py-2 bg-white border border-slate-300 rounded-xl text-sm text-slate-900 placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-600 transition-all"
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1.5">Official Joining Letter Content</label>
                  <textarea
                    rows={5}
                    value={letterText}
                    onChange={(e) => setLetterText(e.target.value)}
                    required
                    className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-300 rounded-xl text-xs font-mono text-slate-800 placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-600 transition-all resize-none leading-relaxed"
                  />
                </div>

                <div className="flex items-center justify-end gap-3 pt-2">
                  <Button
                    type="button"
                    variant="outline"
                    onClick={() => setSelectedCandidateForLetter(null)}
                  >
                    Cancel
                  </Button>
                  <Button
                    type="submit"
                    variant="primary"
                    isLoading={isSendingLetter}
                    icon={Send}
                  >
                    Dispatch Joining Letter
                  </Button>
                </div>
              </form>
            )}
          </div>
        </div>
      )}

      {/* View Joining Letter / Dossier Modal */}
      {viewingCandidateLetter && (
        <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-white border border-slate-200 rounded-2xl w-full max-w-xl p-6 space-y-5 shadow-2xl relative max-h-[90vh] overflow-y-auto animate-fade-in">
            <button
              onClick={() => setViewingCandidateLetter(null)}
              className="absolute top-5 right-5 text-slate-400 hover:text-slate-600 p-1.5 rounded-full hover:bg-slate-100 transition-colors"
            >
              <X className="w-5 h-5" />
            </button>

            <div className="space-y-1">
              <div className="flex items-center gap-2">
                <FileText className="w-5 h-5 text-blue-600" />
                <h2 className="text-lg font-bold text-slate-900">Placement & Joining Dossier</h2>
              </div>
              <p className="text-xs text-slate-500">
                Candidate: <strong className="text-slate-900 font-semibold">{viewingCandidateLetter.name}</strong> • #{viewingCandidateLetter.passportId}
              </p>
            </div>

            <div className="space-y-4">
              <div className="grid grid-cols-2 gap-3 p-4 rounded-xl bg-slate-50 border border-slate-200 text-xs">
                <div>
                  <span className="text-slate-400 text-[10px] uppercase font-semibold tracking-wider">Designation</span>
                  <div className="font-semibold text-slate-800 mt-0.5">{viewingCandidateLetter.joiningLetterRole || viewingCandidateLetter.jobTitle}</div>
                </div>
                <div>
                  <span className="text-slate-400 text-[10px] uppercase font-semibold tracking-wider">Compensation</span>
                  <div className="font-bold text-emerald-600 font-mono mt-0.5">{viewingCandidateLetter.joiningLetterSalary || '₹8,50,000 / annum'}</div>
                </div>
                <div>
                  <span className="text-slate-400 text-[10px] uppercase font-semibold tracking-wider">Joining Date</span>
                  <div className="font-semibold text-slate-800 mt-0.5">{viewingCandidateLetter.joiningLetterJoiningDate || '01 November 2026'}</div>
                </div>
                <div>
                  <span className="text-slate-400 text-[10px] uppercase font-semibold tracking-wider">Current Status</span>
                  <div className="font-semibold text-blue-600 mt-0.5">{viewingCandidateLetter.status}</div>
                </div>
              </div>

              {viewingCandidateLetter.joiningLetterText && (
                <div className="space-y-1.5">
                  <span className="text-xs font-semibold text-slate-700">Offer Letter Body:</span>
                  <div className="p-4 rounded-xl bg-slate-50 border border-slate-200 text-xs text-slate-700 whitespace-pre-wrap font-mono leading-relaxed">
                    {viewingCandidateLetter.joiningLetterText}
                  </div>
                </div>
              )}

              {/* Student Acceptance Record */}
              <div className="p-4 rounded-xl bg-slate-50 border border-slate-200 space-y-1.5 text-xs">
                <div className="flex items-center justify-between">
                  <span className="font-semibold text-slate-800">1. Student Acceptance</span>
                  <Badge
                    variant={
                      viewingCandidateLetter.studentAcceptedAt
                        ? 'success'
                        : viewingCandidateLetter.studentDeclinedAt
                        ? 'danger'
                        : 'neutral'
                    }
                    size="sm"
                  >
                    {viewingCandidateLetter.studentAcceptedAt ? 'ACCEPTED' : (viewingCandidateLetter.studentDeclinedAt ? 'DECLINED' : 'PENDING')}
                  </Badge>
                </div>
                {viewingCandidateLetter.studentAcceptedAt && (
                  <p className="text-[11px] text-slate-500">
                    Accepted on: {new Date(viewingCandidateLetter.studentAcceptedAt).toLocaleString()}
                    {viewingCandidateLetter.studentRemarks && ` • "${viewingCandidateLetter.studentRemarks}"`}
                  </p>
                )}
              </div>

              {/* Academic Approval Record */}
              <div className="p-4 rounded-xl bg-slate-50 border border-slate-200 space-y-1.5 text-xs">
                <div className="flex items-center justify-between">
                  <span className="font-semibold text-slate-800">2. Academic Endorsement & Approval</span>
                  <Badge
                    variant={
                      viewingCandidateLetter.academicApprovedAt || viewingCandidateLetter.status === 'CONFIRMED'
                        ? 'success'
                        : viewingCandidateLetter.academicRejectedAt
                        ? 'danger'
                        : 'neutral'
                    }
                    size="sm"
                  >
                    {viewingCandidateLetter.academicApprovedAt || viewingCandidateLetter.status === 'CONFIRMED' ? 'APPROVED' : (viewingCandidateLetter.academicRejectedAt ? 'REJECTED' : 'PENDING')}
                  </Badge>
                </div>
                {(viewingCandidateLetter.academicApprovedAt || viewingCandidateLetter.status === 'CONFIRMED') && (
                  <p className="text-[11px] text-slate-500">
                    Approved by: <strong className="text-slate-800">{viewingCandidateLetter.academicApproverName || 'Dr. S. K. Verma'}</strong>
                    {viewingCandidateLetter.academicComments && ` • "${viewingCandidateLetter.academicComments}"`}
                  </p>
                )}
              </div>
            </div>

            <div className="flex justify-end pt-2">
              <Button
                variant="outline"
                onClick={() => setViewingCandidateLetter(null)}
              >
                Close Dossier
              </Button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default CandidateSearchPage;
