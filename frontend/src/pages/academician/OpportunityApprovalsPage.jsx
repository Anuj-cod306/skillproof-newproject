import React, { useState, useEffect } from 'react';
import { useSearchParams, Link } from 'react-router-dom';
import {
  CheckCircle2, XCircle, Clock, ShieldCheck, User, Building,
  DollarSign, Calendar, ExternalLink, MessageSquare, AlertCircle,
  FileText, Check, X
} from 'lucide-react';
import { PageHeader } from '../../components/common/PageHeader';
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from '../../components/common/Card';
import { Button } from '../../components/common/Button';
import { Badge } from '../../components/common/Badge';
import { EmptyState } from '../../components/common/EmptyState';
import apiService from '../../services/api';

export const OpportunityApprovalsPage = () => {
  const [approvals, setApprovals] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchParams] = useSearchParams();
  const highlightedAppId = Number(searchParams.get('applicationId'));

  const [activeComments, setActiveComments] = useState({});
  const [processingId, setProcessingId] = useState(null);
  const [statusFilter, setStatusFilter] = useState('ALL');

  const fetchApprovals = async () => {
    setLoading(true);
    try {
      const res = await apiService.getOpportunityApprovals();
      if (Array.isArray(res)) {
        setApprovals(res);
        const commentsMap = {};
        res.forEach(item => {
          commentsMap[item.applicationId] = item.academicComments || 'Verified curriculum compliance, minimum credit requirements satisfied, and department endorsement granted for joining.';
        });
        setActiveComments(commentsMap);
      }
    } catch (err) {
      console.warn('[OpportunityApprovals] Error loading approvals:', err);
      setApprovals([]);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchApprovals();
  }, []);

  useEffect(() => {
    if (highlightedAppId && approvals.length > 0) {
      const el = document.getElementById(`approval-card-${highlightedAppId}`);
      if (el) {
        el.scrollIntoView({ behavior: 'smooth', block: 'center' });
      }
    }
  }, [highlightedAppId, approvals]);

  const handleRespond = async (appId, action) => {
    setProcessingId(appId);
    try {
      const comments = activeComments[appId] || '';
      await apiService.respondToOpportunityApproval(appId, { action, comments });
      await fetchApprovals();
      window.dispatchEvent(new CustomEvent('skillproof_application_updated', {
        detail: { applicationId: appId, status: action === 'APPROVE' ? 'CONFIRMED' : 'ACADEMICALLY_REJECTED' }
      }));
    } catch (err) {
      console.error('[OpportunityApprovals] Failed to respond:', err);
    } finally {
      setProcessingId(null);
    }
  };

  const filteredApprovals = approvals.filter(item => {
    if (statusFilter === 'PENDING') {
      return item.status === 'STUDENT_ACCEPTED' || item.status === 'AWAITING_STUDENT_ACCEPTANCE';
    }
    if (statusFilter === 'CONFIRMED') {
      return item.status === 'CONFIRMED' || item.academicApprovedAt;
    }
    return true;
  });

  return (
    <div className="space-y-6 max-w-5xl mx-auto pb-12 animate-fade-in">
      <PageHeader
        title="Student Opportunity Approvals"
        description="Verify company offers accepted by your students, confirm academic credit eligibility, and issue official departmental endorsements"
        badge={<Badge variant="warning" size="sm">Institutional Governance</Badge>}
        breadcrumbs={[
          { label: 'Academician Portal', href: '#/academician/dashboard' },
          { label: 'Opportunity Approvals' }
        ]}
        actions={
          <div className="flex items-center gap-1.5 bg-white p-1 rounded-xl border border-slate-200 shadow-2xs">
            <button
              onClick={() => setStatusFilter('ALL')}
              className={`px-3 py-1.5 rounded-lg text-xs font-medium transition-colors ${
                statusFilter === 'ALL'
                  ? 'bg-blue-50 text-blue-700 font-semibold border border-blue-200 shadow-2xs'
                  : 'text-slate-600 hover:text-slate-900 hover:bg-slate-50'
              }`}
            >
              All ({approvals.length})
            </button>
            <button
              onClick={() => setStatusFilter('PENDING')}
              className={`px-3 py-1.5 rounded-lg text-xs font-medium transition-colors ${
                statusFilter === 'PENDING'
                  ? 'bg-blue-50 text-blue-700 font-semibold border border-blue-200 shadow-2xs'
                  : 'text-slate-600 hover:text-slate-900 hover:bg-slate-50'
              }`}
            >
              Pending ({approvals.filter(a => a.status === 'STUDENT_ACCEPTED').length})
            </button>
            <button
              onClick={() => setStatusFilter('CONFIRMED')}
              className={`px-3 py-1.5 rounded-lg text-xs font-medium transition-colors ${
                statusFilter === 'CONFIRMED'
                  ? 'bg-blue-50 text-blue-700 font-semibold border border-blue-200 shadow-2xs'
                  : 'text-slate-600 hover:text-slate-900 hover:bg-slate-50'
              }`}
            >
              Confirmed ({approvals.filter(a => a.status === 'CONFIRMED').length})
            </button>
          </div>
        }
      />

      {/* Loading state */}
      {loading && (
        <div className="flex items-center justify-center py-16 gap-3 text-slate-400 text-sm">
          <div className="w-5 h-5 border-2 border-indigo-500 border-t-transparent rounded-full animate-spin" />
          <span>Loading student opportunity acceptances...</span>
        </div>
      )}

      {/* Empty state */}
      {!loading && filteredApprovals.length === 0 && (
        <EmptyState
          icon={CheckCircle2}
          title="No Approvals Found"
          description="When industry recruiters extend offers and students accept them, academic endorsement requests will appear here for faculty sign-off."
        />
      )}

      {/* Approvals List */}
      {!loading && filteredApprovals.length > 0 && (
        <div className="space-y-4">
          {filteredApprovals.map((item) => {
            const isHighlighted = highlightedAppId === item.applicationId;
            const isConfirmed = item.status === 'CONFIRMED';
            const isStudentAccepted = item.status === 'STUDENT_ACCEPTED';
            const isRejected = item.status === 'ACADEMICALLY_REJECTED';
            const passportId = item.passportId || `SKP-2027-STU${item.studentId}-4233`;

            return (
              <Card
                key={item.applicationId}
                id={`approval-card-${item.applicationId}`}
                className={`${
                  isHighlighted
                    ? 'border-indigo-500 ring-1 ring-indigo-500/50'
                    : isConfirmed
                    ? 'border-emerald-500/40'
                    : ''
                }`}
              >
                <CardContent className="p-6 space-y-5">
                  {/* Student & Offer Card Header */}
                  <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-slate-100">
                    <div className="flex items-center gap-3.5">
                      <div className="w-11 h-11 rounded-full bg-blue-600 text-white flex items-center justify-center font-bold text-base shadow-xs shrink-0">
                        {item.studentName ? item.studentName[0].toUpperCase() : 'S'}
                      </div>
                      <div>
                        <div className="flex flex-wrap items-center gap-2">
                          <h2 className="text-base font-bold text-slate-900">{item.studentName}</h2>
                          <span className="text-[11px] font-mono font-semibold px-2.5 py-0.5 rounded-full bg-blue-50 border border-blue-200 text-blue-700">
                            #{passportId}
                          </span>
                          {isHighlighted && (
                            <Badge variant="primary" size="sm" dot>Direct Notification Focus</Badge>
                          )}
                        </div>
                        <p className="text-xs text-slate-600 mt-0.5 font-medium">
                          {item.degree} • {item.college || 'IIT Delhi'} (Roll: {item.rollNumber || '9'})
                        </p>
                      </div>
                    </div>

                    <div className="flex items-center gap-4 self-start sm:self-center">
                      <div className="text-right">
                        <div className="text-2xl font-mono font-bold text-blue-600">{item.readiness}%</div>
                        <div className="text-[10px] text-slate-500 uppercase font-bold tracking-wider">Readiness</div>
                      </div>
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

                  {/* Offer & Company Details (Dark Card with High Contrast) */}
                  <div className="grid grid-cols-1 sm:grid-cols-3 gap-3.5 p-4 rounded-xl bg-slate-900 border border-slate-800 text-xs shadow-xs">
                    <div>
                      <span className="text-slate-300 text-[10px] uppercase font-bold tracking-wider flex items-center gap-1.5">
                        <Building className="w-3.5 h-3.5 text-blue-400" /> Company & Role
                      </span>
                      <div className="font-bold text-white text-sm mt-1">{item.company}</div>
                      <div className="text-blue-300 text-xs font-medium mt-0.5">{item.joiningLetterRole || item.jobTitle}</div>
                    </div>

                    <div>
                      <span className="text-slate-300 text-[10px] uppercase font-bold tracking-wider flex items-center gap-1.5">
                        <DollarSign className="w-3.5 h-3.5 text-emerald-400" /> Compensation
                      </span>
                      <div className="font-bold text-emerald-300 font-mono text-sm mt-1">{item.joiningLetterSalary || '₹8,50,000 / annum'}</div>
                      <div className="text-slate-300 text-[11px] font-medium mt-0.5">Location: {item.location || 'Bangalore / Hybrid'}</div>
                    </div>

                    <div>
                      <span className="text-slate-300 text-[10px] uppercase font-bold tracking-wider flex items-center gap-1.5">
                        <Calendar className="w-3.5 h-3.5 text-cyan-400" /> Expected Joining
                      </span>
                      <div className="font-bold text-white text-sm mt-1">{item.joiningLetterJoiningDate || '01 November 2026'}</div>
                      <div className="text-[10px] text-slate-300 mt-0.5 font-medium">
                        {item.joiningLetterSentAt ? `Extended: ${new Date(item.joiningLetterSentAt).toLocaleDateString()}` : 'Official Offer'}
                      </div>
                    </div>
                  </div>

                  {/* Joining Letter Body */}
                  {item.joiningLetterText && (
                    <div className="space-y-1.5">
                      <span className="text-xs font-semibold text-slate-700 flex items-center gap-1.5">
                        <FileText className="w-3.5 h-3.5 text-blue-600" />
                        Joining Letter Summary:
                      </span>
                      <div className="p-3.5 rounded-xl bg-slate-50 border border-slate-200 text-xs text-slate-700 whitespace-pre-wrap font-mono leading-relaxed max-h-32 overflow-y-auto">
                        {item.joiningLetterText}
                      </div>
                    </div>
                  )}

                  {/* Workflow Status Tracker (Dark Card with High Contrast) */}
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 p-3.5 rounded-xl bg-slate-900 border border-slate-800 text-xs shadow-xs">
                    <div className="space-y-1">
                      <div className="flex items-center justify-between">
                        <span className="font-bold text-white">1. Student Acceptance</span>
                        <Badge
                          variant={item.studentAcceptedAt || isStudentAccepted || isConfirmed ? 'success' : 'neutral'}
                          size="sm"
                        >
                          {item.studentAcceptedAt || isStudentAccepted || isConfirmed ? 'ACCEPTED' : 'PENDING'}
                        </Badge>
                      </div>
                      <p className="text-[11px] text-slate-300 font-medium">
                        {item.studentAcceptedAt
                          ? `Accepted on ${new Date(item.studentAcceptedAt).toLocaleString()}`
                          : 'Candidate notified; awaiting confirmation'}
                      </p>
                    </div>

                    <div className="space-y-1">
                      <div className="flex items-center justify-between">
                        <span className="font-bold text-white">2. Academic Endorsement</span>
                        <Badge
                          variant={isConfirmed ? 'success' : isRejected ? 'danger' : 'warning'}
                          size="sm"
                          dot={!isConfirmed && !isRejected}
                        >
                          {isConfirmed ? 'APPROVED / CONFIRMED' : (isRejected ? 'REJECTED' : 'REQUIRES FACULTY ACTION')}
                        </Badge>
                      </div>
                      <p className="text-[11px] text-slate-300 font-medium">
                        {isConfirmed
                          ? `Approved by ${item.academicApproverName || 'Dr. S. K. Verma'}`
                          : (isRejected ? 'Approval withheld' : 'Review & issue department clearance below')}
                      </p>
                    </div>
                  </div>

                  {/* If already Confirmed */}
                  {isConfirmed && (
                    <div className="p-4 rounded-xl bg-emerald-50 border border-emerald-200 text-xs text-emerald-800 space-y-1.5">
                      <div className="flex items-center gap-2 font-bold text-sm text-emerald-900">
                        <CheckCircle2 className="w-4 h-4 text-emerald-600" />
                        <span>OFFICIAL PLACEMENT CONFIRMED & ENDORSED</span>
                      </div>
                      <p className="text-[11px] text-slate-700">
                        Endorsed by: <strong className="text-slate-900">{item.academicApproverName || 'Dr. S. K. Verma'}</strong>
                      </p>
                      <p className="text-[11px] text-slate-600 italic">
                        Faculty Remarks: "{item.academicComments || 'Verified curriculum compliance, minimum credit requirements satisfied, and department endorsement granted for joining.'}"
                      </p>
                      {item.academicApprovedAt && (
                        <div className="text-[10px] text-emerald-700 font-mono font-semibold">
                          Approved on: {new Date(item.academicApprovedAt).toLocaleString()}
                        </div>
                      )}
                    </div>
                  )}

                  {/* If Rejected */}
                  {isRejected && (
                    <div className="p-4 rounded-xl bg-rose-50 border border-rose-200 text-xs text-rose-800 space-y-1">
                      <div className="flex items-center gap-2 font-bold text-sm text-rose-900">
                        <XCircle className="w-4 h-4 text-rose-600" />
                        <span>Academic Endorsement Withheld</span>
                      </div>
                      <p className="text-[11px] text-slate-600">
                        Remarks: "{item.academicComments || 'Criteria not met'}"
                      </p>
                    </div>
                  )}

                  {/* Action Section (if not yet confirmed or rejected) */}
                  {!isConfirmed && !isRejected && (
                    <div className="space-y-3 pt-2 border-t border-slate-100">
                      <div className="space-y-1.5">
                        <label className="text-xs font-semibold text-slate-700 flex items-center gap-1.5">
                          <MessageSquare className="w-3.5 h-3.5 text-blue-600" />
                          Faculty Mentorship & Department Comments:
                        </label>
                        <input
                          type="text"
                          value={activeComments[item.applicationId] || ''}
                          onChange={(e) => setActiveComments(prev => ({
                            ...prev,
                            [item.applicationId]: e.target.value
                          }))}
                          placeholder="Enter faculty endorsement comments / curricular clearance..."
                          className="w-full px-3.5 py-2.5 rounded-xl bg-white border border-slate-300 text-slate-900 placeholder:text-slate-400 text-xs focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-600 transition-all shadow-2xs"
                        />
                      </div>

                      <div className="flex flex-col sm:flex-row items-center justify-between gap-3 pt-1">
                        <div className="text-xs text-slate-600">
                          Granting endorsement transitions the candidate to <strong className="text-emerald-700 font-bold">CONFIRMED / JOINING</strong>.
                        </div>
                        <div className="flex items-center gap-2.5 w-full sm:w-auto">
                          <Button
                            variant="outline"
                            size="sm"
                            icon={X}
                            disabled={processingId === item.applicationId}
                            onClick={() => handleRespond(item.applicationId, 'REJECT')}
                          >
                            Withhold Approval
                          </Button>
                          <Button
                            variant="success"
                            size="sm"
                            icon={Check}
                            isLoading={processingId === item.applicationId}
                            onClick={() => handleRespond(item.applicationId, 'APPROVE')}
                          >
                            Approve Placement & Issue Endorsement
                          </Button>
                        </div>
                      </div>
                    </div>
                  )}
                </CardContent>
              </Card>
            );
          })}
        </div>
      )}
    </div>
  );
};

export default OpportunityApprovalsPage;
