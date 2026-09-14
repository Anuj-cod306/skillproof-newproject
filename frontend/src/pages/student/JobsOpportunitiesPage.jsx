import React, { useState, useEffect } from 'react';
import { useSearchParams } from 'react-router-dom';
import {
  Briefcase,
  MapPin,
  DollarSign,
  ShieldCheck,
  CheckCircle2,
  AlertTriangle,
  ArrowRight,
  Check,
  FileText,
  Clock,
  X,
  Sparkles,
  Loader2
} from 'lucide-react';
import { useSkillProof } from '../../context/SkillProofContext';
import { PageHeader } from '../../components/common/PageHeader';
import { Button } from '../../components/common/Button';
import { Badge } from '../../components/common/Badge';
import { Card } from '../../components/common/Card';
import { EmptyState } from '../../components/common/EmptyState';

export const JobsOpportunitiesPage = () => {
  const { jobs, applyForJob, respondToOffer, skillPassport, loadLiveStudentData } = useSkillProof();
  const [searchParams] = useSearchParams();
  const highlightedJobId = Number(searchParams.get('jobId'));
  const [respondingJobId, setRespondingJobId] = useState(null);
  const [responseMsg, setResponseMsg] = useState({});

  useEffect(() => {
    if (loadLiveStudentData) {
      loadLiveStudentData();
    }
  }, [loadLiveStudentData]);

  const handleOfferResponse = async (job, action) => {
    if (!job.applicationId) return;
    setRespondingJobId(job.id);
    try {
      await respondToOffer(job.applicationId, action);
      setResponseMsg(prev => ({
        ...prev,
        [job.id]: action === 'ACCEPT' ? 'Offer successfully accepted! Academic mentor notified for endorsement.' : 'Offer declined.'
      }));
    } catch (err) {
      console.error('Failed to respond to offer:', err);
    } finally {
      setRespondingJobId(null);
    }
  };

  useEffect(() => {
    if (highlightedJobId) {
      const el = document.getElementById(`job-card-${highlightedJobId}`);
      if (el) {
        el.scrollIntoView({ behavior: 'smooth', block: 'center' });
      }
    }
  }, [highlightedJobId, jobs]);

  const [searchTerm, setSearchTerm] = useState('');
  const [filterType, setFilterType] = useState('ALL');

  const filteredJobs = jobs.filter(job => {
    const matchesSearch = job.title?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      job.company?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      job.location?.toLowerCase().includes(searchTerm.toLowerCase());
    if (!matchesSearch) return false;
    if (filterType === 'APPLIED') return job.applied;
    if (filterType === 'SHORTLISTED') return job.status === 'Shortlisted' || job.rawStatus === 'SHORTLISTED';
    return true;
  });

  return (
    <div className="space-y-6 max-w-5xl mx-auto">
      <PageHeader
        title="Job Opportunities"
        subtitle="Opportunities ranked transparently against your multi-tier verified competencies. Algorithmic matching without black-box filters."
        badge={<Badge variant="primary" size="xs">AI Matching</Badge>}
        breadcrumbs={['Student Portal', 'Career & Jobs', 'Job Matches']}
      />

      {/* Filter & Search Bar - Screen 9 Reference */}
      <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-4">
        <div className="flex items-center p-1 bg-slate-100 rounded-full border border-slate-200 w-fit">
          <button
            onClick={() => setFilterType('ALL')}
            className={`px-4 py-1.5 rounded-full text-xs font-medium transition-all ${
              filterType === 'ALL'
                ? 'bg-white text-slate-900 shadow-sm font-semibold'
                : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            All Matches ({jobs.length})
          </button>
          <button
            onClick={() => setFilterType('APPLIED')}
            className={`px-4 py-1.5 rounded-full text-xs font-medium transition-all ${
              filterType === 'APPLIED'
                ? 'bg-white text-slate-900 shadow-sm font-semibold'
                : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            Applied ({jobs.filter(j => j.applied).length})
          </button>
          <button
            onClick={() => setFilterType('SHORTLISTED')}
            className={`px-4 py-1.5 rounded-full text-xs font-medium transition-all ${
              filterType === 'SHORTLISTED'
                ? 'bg-white text-slate-900 shadow-sm font-semibold'
                : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            Shortlisted ({jobs.filter(j => j.status === 'Shortlisted' || j.rawStatus === 'SHORTLISTED').length})
          </button>
        </div>

        <div className="relative">
          <input
            type="text"
            placeholder="Search roles, companies, cities..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full sm:w-72 pl-4 pr-4 py-2 text-xs bg-white border border-[#E2E8F0] rounded-full text-slate-800 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-600 transition-all shadow-sm"
          />
        </div>
      </div>

      <div className="space-y-4">
        {filteredJobs.length === 0 ? (
          <EmptyState
            icon={Briefcase}
            title="No matching job postings found"
            description="Try changing your search filters or verify additional skills to unlock more opportunities."
          />
        ) : (
          filteredJobs.map((job) => {
            const isHighlighted = highlightedJobId === job.id;
            const isShortlisted = job.status === 'Shortlisted' || job.rawStatus === 'SHORTLISTED';

            return (
              <div
                key={job.id}
                id={`job-card-${job.id}`}
                className={`bg-white rounded-2xl border p-6 sm:p-7 space-y-5 transition-all duration-200 shadow-[0_4px_20px_rgba(15,23,42,0.03)] hover:shadow-[0_8px_30px_rgba(15,23,42,0.08)] ${
                  isHighlighted
                    ? 'border-blue-600 ring-2 ring-blue-500/20'
                    : 'border-[#E2E8F0] hover:border-slate-300'
                }`}
              >
                {/* Top row */}
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                  <div className="flex items-start gap-4">
                    <div className="w-12 h-12 rounded-2xl bg-blue-50 border border-blue-100 flex items-center justify-center text-blue-600 font-bold text-sm shrink-0">
                      {job.company ? job.company.substring(0, 2).toUpperCase() : 'CO'}
                    </div>
                    <div className="space-y-1">
                      <div className="flex flex-wrap items-center gap-2">
                        <h2 className="text-base font-bold text-slate-900">{job.title}</h2>
                        <span className="text-[11px] font-semibold px-2.5 py-0.5 rounded-full bg-slate-100 text-slate-700 border border-slate-200">
                          {job.type || 'Full Time'}
                        </span>
                        {isShortlisted && (
                          <span className="text-[11px] font-semibold px-2.5 py-0.5 rounded-full bg-amber-50 text-amber-700 border border-amber-200 flex items-center gap-1">
                            <CheckCircle2 className="w-3 h-3 text-amber-600" /> Shortlisted
                          </span>
                        )}
                        {isHighlighted && (
                          <span className="text-[11px] font-semibold px-2.5 py-0.5 rounded-full bg-blue-50 text-blue-700 border border-blue-200">
                            Focused View
                          </span>
                        )}
                      </div>
                      <div className="flex flex-wrap items-center gap-3 text-xs text-slate-500 font-medium">
                        <span className="font-bold text-slate-800">{job.company}</span>
                        <span>•</span>
                        <span className="flex items-center gap-1"><MapPin className="w-3.5 h-3.5 text-slate-400" /> {job.location}</span>
                        <span>•</span>
                        <span className="text-emerald-700 font-mono font-bold flex items-center gap-1">
                          <DollarSign className="w-3.5 h-3.5 text-emerald-600" /> {job.salary}
                        </span>
                      </div>
                    </div>
                  </div>

                  {/* Match Score Badge */}
                  <div className="flex items-center gap-3 self-start sm:self-center shrink-0">
                    <div className="text-left sm:text-right">
                      <div className="text-2xl font-black font-mono text-blue-600">{job.matchScore}%</div>
                      <div className="text-[10px] text-slate-400 uppercase font-bold tracking-wider">Match Score</div>
                    </div>
                    <div className="w-12 h-12 rounded-2xl bg-blue-50 border border-blue-100 flex items-center justify-center text-blue-600">
                      <ShieldCheck className="w-6 h-6" />
                    </div>
                  </div>
                </div>

                {/* Explainable Matching Breakdown */}
                <div className="p-4 rounded-xl bg-[#F8FAFC] border border-[#E2E8F0] space-y-3 text-xs">
                  <div className="text-[11px] font-bold uppercase tracking-wider text-slate-500">
                    AI Match Explanation
                  </div>
                  <p className="text-slate-700 italic leading-relaxed">
                    "{job.explanation}"
                  </p>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-3 border-t border-slate-200">
                    {/* Verified matches */}
                    <div className="space-y-1.5">
                      <span className="text-[11px] font-bold text-emerald-700 flex items-center gap-1">
                        <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600" /> Verified Fulfillments:
                      </span>
                      <div className="flex flex-wrap gap-1.5">
                        {job.verifiedMatches.map((m, idx) => (
                          <span key={idx} className="text-[10px] px-2.5 py-0.5 rounded-full bg-emerald-50 text-emerald-700 border border-emerald-200 font-medium font-mono">
                            {m}
                          </span>
                        ))}
                      </div>
                    </div>

                    {/* Missing / low */}
                    <div className="space-y-1.5">
                      <span className="text-[11px] font-bold text-rose-700 flex items-center gap-1">
                        <AlertTriangle className="w-3.5 h-3.5 text-rose-500" /> Gaps to Close:
                      </span>
                      <div className="flex flex-wrap gap-1.5">
                        {job.missingOrLow.map((m, idx) => (
                          <span key={idx} className="text-[10px] px-2.5 py-0.5 rounded-full bg-rose-50 text-rose-700 border border-rose-200 font-medium font-mono">
                            {m}
                          </span>
                        ))}
                      </div>
                    </div>
                  </div>
                </div>

                {/* Joining Letter Section if extended */}
                {(job.joiningLetterSentAt || job.rawStatus === 'AWAITING_STUDENT_ACCEPTANCE' || job.rawStatus === 'STUDENT_ACCEPTED' || job.rawStatus === 'CONFIRMED') && (
                  <div className="p-5 rounded-2xl bg-blue-50/50 border border-blue-200 space-y-4">
                    <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 pb-3 border-b border-blue-100">
                      <div className="flex items-center gap-2.5">
                        <FileText className="w-5 h-5 text-blue-600" />
                        <div>
                          <h3 className="text-xs font-bold text-slate-900 uppercase tracking-wider">Employment Offer Letter</h3>
                          <p className="text-[11px] text-slate-500">Issued by {job.company} via SkillProof Passport</p>
                        </div>
                      </div>
                      <Badge
                        variant={job.rawStatus === 'CONFIRMED' ? 'success' : job.rawStatus === 'STUDENT_ACCEPTED' ? 'warning' : 'primary'}
                        size="xs"
                      >
                        {job.rawStatus === 'CONFIRMED' ? 'Confirmed' : job.rawStatus === 'STUDENT_ACCEPTED' ? 'Offer Accepted (Faculty Review)' : 'Review & Respond'}
                      </Badge>
                    </div>

                    <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 p-4 rounded-xl bg-white border border-blue-100 text-xs">
                      <div>
                        <span className="text-slate-400 text-[10px] uppercase font-bold">Role</span>
                        <div className="font-bold text-slate-900 mt-0.5">{job.joiningLetterRole || job.title}</div>
                      </div>
                      <div>
                        <span className="text-slate-400 text-[10px] uppercase font-bold">Compensation</span>
                        <div className="font-bold text-emerald-700 font-mono mt-0.5">{job.joiningLetterSalary || job.salary}</div>
                      </div>
                      <div>
                        <span className="text-slate-400 text-[10px] uppercase font-bold">Joining Date</span>
                        <div className="font-bold text-slate-700 mt-0.5">{job.joiningLetterJoiningDate || '01 Nov 2026'}</div>
                      </div>
                    </div>

                    {job.joiningLetterText && (
                      <div className="p-4 rounded-xl bg-white border border-blue-100 text-xs text-slate-700 whitespace-pre-wrap font-mono leading-relaxed">
                        {job.joiningLetterText}
                      </div>
                    )}

                    {job.rawStatus === 'AWAITING_STUDENT_ACCEPTANCE' && (
                      <div className="flex flex-col sm:flex-row items-center justify-between gap-3 pt-2">
                        <span className="text-xs text-slate-600">
                          Accepting routes this offer for faculty mentor approval.
                        </span>
                        <div className="flex items-center gap-2">
                          <Button
                            variant="secondary"
                            size="sm"
                            onClick={() => handleOfferResponse(job, 'DECLINE')}
                            disabled={respondingJobId === job.id}
                            icon={X}
                          >
                            Decline
                          </Button>
                          <Button
                            variant="success"
                            size="sm"
                            onClick={() => handleOfferResponse(job, 'ACCEPT')}
                            disabled={respondingJobId === job.id}
                            isLoading={respondingJobId === job.id}
                            icon={Check}
                          >
                            Accept Offer
                          </Button>
                        </div>
                      </div>
                    )}

                    {job.rawStatus === 'STUDENT_ACCEPTED' && (
                      <div className="p-3 rounded-xl bg-amber-50 border border-amber-200 text-xs text-amber-800 flex items-center gap-2">
                        <Clock className="w-4 h-4 text-amber-600 shrink-0" />
                        <span>Accepted. Faculty academician verification in progress.</span>
                      </div>
                    )}

                    {job.rawStatus === 'CONFIRMED' && (
                      <div className="p-3 rounded-xl bg-emerald-50 border border-emerald-200 text-xs text-emerald-800 flex items-center gap-2">
                        <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
                        <span>Placement confirmed and endorsed by department faculty!</span>
                      </div>
                    )}

                    {responseMsg[job.id] && (
                      <div className="p-3 rounded-xl bg-white border border-blue-200 text-xs text-blue-700 font-medium">
                        {responseMsg[job.id]}
                      </div>
                    )}
                  </div>
                )}

                {/* Application Action Bar */}
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pt-3 border-t border-[#E2E8F0]">
                  <div className="text-xs text-slate-500 flex items-center gap-1.5">
                    <span>Attached Credential: </span>
                    <strong className="text-blue-600 font-mono font-semibold">
                      {skillPassport.id ? `#${skillPassport.id}` : '(Generating on apply)'}
                    </strong>
                  </div>

                  {job.applied ? (
                    <span className="inline-flex items-center gap-1.5 px-4 py-2 rounded-full bg-emerald-50 text-emerald-700 text-xs font-semibold border border-emerald-200">
                      <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600" />
                      {job.status || 'Application Submitted'}
                    </span>
                  ) : (
                    <Button
                      variant="primary"
                      size="sm"
                      onClick={() => applyForJob(job.id)}
                      icon={ShieldCheck}
                    >
                      Apply with Skill Passport
                    </Button>
                  )}
                </div>
              </div>
            );
          })
        )}
      </div>
    </div>
  );
};

export default JobsOpportunitiesPage;
