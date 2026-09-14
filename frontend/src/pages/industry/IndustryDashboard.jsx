import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { Briefcase, Users, CheckCircle2, ShieldCheck, ArrowRight, Plus, Award, Sparkles, Building, ExternalLink, Filter } from 'lucide-react';
import { Badge, QuizStatusBadge } from '../../components/common/Badge';
import { PageHeader } from '../../components/common/PageHeader';
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from '../../components/common/Card';
import { Button } from '../../components/common/Button';
import { EmptyState } from '../../components/common/EmptyState';
import { StatCard } from '../../components/dashboard/StatCard';
import apiService from '../../services/api';

export const IndustryDashboard = () => {
  const [activeCandidates, setActiveCandidates] = useState([]);
  const [loading, setLoading] = useState(true);
  const [activeFilter, setActiveFilter] = useState('ALL');

  useEffect(() => {
    let isMounted = true;
    const fetchCandidates = async () => {
      try {
        const res = await apiService.getCandidates();
        if (isMounted && Array.isArray(res)) {
          const filtered = res.filter(c => c.name !== 'Alice Smith');
          setActiveCandidates(filtered.map(c => ({
            name: c.name,
            college: c.college || 'Engineering Institute',
            degree: c.degree || 'B.Tech CS',
            readiness: c.readiness || 0,
            passportId: c.passportId || c.id,
            matchedRole: c.jobTitle || 'Software Engineer',
            matchScore: c.matchScore || (c.readiness > 0 ? c.readiness : 85),
            keySkills: Array.isArray(c.skills)
              ? c.skills.slice(0, 3).map(s => s.name ? `${s.name} (${s.score || 0}% ${s.badge || 'GOLD'})` : String(s))
              : ['React', 'TypeScript', 'Node.js'],
            status: c.applicationStatus || c.status || 'ACTIVE'
          })));
        }
      } catch (err) {
        console.warn('[IndustryDashboard] Failed to fetch candidates:', err);
      } finally {
        if (isMounted) setLoading(false);
      }
    };
    fetchCandidates();
    return () => { isMounted = false; };
  }, []);

  const pipelineCount = activeCandidates.filter(c =>
    ['SHORTLISTED', 'AWAITING_STUDENT_ACCEPTANCE', 'STUDENT_ACCEPTED', 'CONFIRMED', 'ACTIVE'].includes(c.status)
  ).length;

  const filteredCandidates = activeCandidates.filter(c => {
    if (activeFilter === 'ALL') return true;
    if (activeFilter === 'PIPELINE') return ['SHORTLISTED', 'ACTIVE'].includes(c.status);
    if (activeFilter === 'VERIFIED') return c.readiness >= 75;
    return true;
  });

  return (
    <div className="space-y-6 max-w-7xl mx-auto animate-fade-in">
      {/* Header Bar */}
      <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-4 pb-2">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <span className="text-[11px] font-semibold uppercase tracking-wider text-slate-500">Industry Portal</span>
            <Badge variant="primary" size="xs">
              NovaTech Solutions
            </Badge>
          </div>
          <h1 className="text-2xl sm:text-3xl font-bold tracking-tight text-slate-900">
            Recruitment & Proof Engine
          </h1>
          <p className="text-xs sm:text-sm text-slate-500 mt-1">
            Evaluate candidates with verified coding proofs, proctored assessments, and interview evidence
          </p>
        </div>

        <div className="flex items-center gap-3 shrink-0">
          <Link to="/industry/candidates">
            <Button variant="secondary" size="sm" icon={Users}>
              Search Pool
            </Button>
          </Link>
          <Link to="/industry/post-job">
            <Button variant="primary" size="sm" icon={Plus}>
              Post Opportunity
            </Button>
          </Link>
        </div>
      </div>

      {/* Top 4 Stat Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 sm:gap-5">
        <StatCard
          icon={Briefcase}
          value="4 Postings"
          title="Active Openings"
          subtitle="2 Full-Time • 2 Internships"
        />
        <StatCard
          icon={Users}
          value={`${activeCandidates.length || 12} Verified`}
          title="Candidate Pool"
          subtitle="100% Skill Passport Backed"
        />
        <StatCard
          icon={ShieldCheck}
          value={`${pipelineCount || 8} Active`}
          title="Hiring Pipeline"
          subtitle="Shortlisted & Offer Review"
        />
        <StatCard
          icon={Award}
          value="78% Avg"
          title="Average Score"
          subtitle="Across verified skill tests"
        />
      </div>

      {/* Candidate Pipeline Table Card */}
      <div className="rounded-2xl bg-white border border-[#E2E8F0] shadow-[0_4px_24px_rgba(15,23,42,0.05)] p-6 sm:p-7 space-y-6">
        {/* Table Controls Header */}
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
          <div>
            <h2 className="text-lg font-bold text-slate-900 tracking-tight flex items-center gap-2">
              <span>Candidate Pipeline</span>
              <span className="text-xs font-semibold px-2.5 py-0.5 rounded-full bg-blue-50 text-blue-700 border border-blue-200">
                {filteredCandidates.length}
              </span>
            </h2>
            <p className="text-xs text-slate-500 mt-0.5">
              Verified applicants matched against technical competency requirements
            </p>
          </div>

          {/* Segmented Filter Control */}
          <div className="inline-flex p-1 bg-slate-100 rounded-full text-xs font-semibold text-slate-600 border border-slate-200/60">
            {[
              { id: 'ALL', label: 'All Candidates' },
              { id: 'PIPELINE', label: 'Active Pipeline' },
              { id: 'VERIFIED', label: 'High Readiness (75%+)' }
            ].map(tab => (
              <button
                key={tab.id}
                onClick={() => setActiveFilter(tab.id)}
                className={`px-3.5 py-1.5 rounded-full transition-all duration-150 ${
                  activeFilter === tab.id
                    ? 'bg-white text-blue-600 font-bold shadow-2xs'
                    : 'text-slate-600 hover:text-slate-900'
                }`}
              >
                {tab.label}
              </button>
            ))}
          </div>
        </div>

        {/* Candidate Table */}
        {loading ? (
          <div className="py-12 text-center text-xs text-slate-500">
            Loading candidate pipeline...
          </div>
        ) : filteredCandidates.length === 0 ? (
          <EmptyState
            icon={Users}
            title="No applicants found"
            description="Post new opportunities or search verified candidates in the talent directory."
          />
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="border-b border-slate-100 text-[11px] font-bold uppercase tracking-wider text-slate-400">
                  <th className="py-3.5 px-4">Candidate</th>
                  <th className="py-3.5 px-4">Matched Role</th>
                  <th className="py-3.5 px-4">Status</th>
                  <th className="py-3.5 px-4">Match Score</th>
                  <th className="py-3.5 px-4">Placement Readiness</th>
                  <th className="py-3.5 px-4 text-right">Action</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 text-xs text-slate-700">
                {filteredCandidates.map((c, i) => (
                  <tr key={i} className="hover:bg-slate-50/80 transition-colors">
                    {/* Candidate */}
                    <td className="py-4 px-4">
                      <div className="flex items-center gap-3">
                        <div className="w-9 h-9 rounded-full bg-blue-50 border border-blue-200 text-blue-700 font-bold text-xs flex items-center justify-center shrink-0">
                          {c.name ? c.name[0] : 'C'}
                        </div>
                        <div className="min-w-0">
                          <div className="font-bold text-slate-900 text-sm truncate">{c.name}</div>
                          <div className="text-xs text-slate-500 truncate">{c.college}</div>
                        </div>
                      </div>
                    </td>

                    {/* Matched Role */}
                    <td className="py-4 px-4">
                      <div className="font-bold text-slate-900 text-xs">{c.matchedRole}</div>
                      <div className="text-xs text-slate-500">{c.degree}</div>
                    </td>

                    {/* Status */}
                    <td className="py-4 px-4">
                      <QuizStatusBadge status={c.status} />
                    </td>

                    {/* Match Score */}
                    <td className="py-4 px-4 font-mono font-bold text-slate-900">
                      {c.matchScore}% Match
                    </td>

                    {/* Readiness */}
                    <td className="py-4 px-4 min-w-[140px]">
                      <div className="flex items-center gap-2">
                        <div className="flex-1 bg-slate-100 h-2 rounded-full overflow-hidden">
                          <div
                            className="bg-blue-600 h-full rounded-full transition-all duration-500"
                            style={{ width: `${c.readiness || c.matchScore}%` }}
                          />
                        </div>
                        <span className="text-[11px] font-bold text-slate-900 font-mono w-8 text-right">
                          {c.readiness || c.matchScore}%
                        </span>
                      </div>
                    </td>

                    {/* Action */}
                    <td className="py-4 px-4 text-right">
                      <Link
                        to={`/passport/${c.passportId}`}
                        className="inline-flex items-center justify-center px-4 py-1.5 rounded-full text-xs font-semibold bg-white border border-slate-200 text-slate-700 hover:text-blue-600 hover:border-blue-300 hover:bg-blue-50/50 transition-colors shadow-2xs"
                      >
                        View
                      </Link>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
};

export default IndustryDashboard;
