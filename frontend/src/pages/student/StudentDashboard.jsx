import React from 'react';
import { Link } from 'react-router-dom';
import {
  ShieldCheck,
  TrendingUp,
  FileText,
  Award,
  GitBranch,
  BotMessageSquare,
  Briefcase,
  ArrowRight,
  Sparkles,
  CheckCircle2,
  Clock,
  ExternalLink,
  Code2
} from 'lucide-react';
import { useSkillProof } from '../../context/SkillProofContext';
import { Badge, VerifiedBadge } from '../../components/common/Badge';
import { Card, CardHeader, CardTitle, CardContent } from '../../components/common/Card';
import { Button } from '../../components/common/Button';
import { ProgressBar } from '../../components/common/ProgressBar';
import { EmptyState } from '../../components/common/EmptyState';
import { ResponsiveContainer, RadarChart, PolarGrid, PolarAngleAxis, PolarRadiusAxis, Radar } from 'recharts';

export const StudentDashboard = () => {
  const { studentProfile, skillMap, skillPassport, roadmap, jobs, resumeData, githubData, interviewSession } = useSkillProof();

  const radarData = skillMap.map(s => ({
    subject: s.name,
    score: s.score,
    fullMark: 100
  }));

  const verifiedSkillsCount = skillMap.filter(s => s.verified).length;
  const completedMilestones = roadmap.filter(m => m.completed).length;

  const isVerified = (studentProfile?.placementReadiness > 0) || (skillPassport && skillPassport.isGenerated);
  const passportIdDisplay = (skillPassport && skillPassport.isGenerated && skillPassport.id)
    ? skillPassport.id
    : 'Not Generated';

  const assessedSkills = skillMap.filter(s => s.tiers && s.tiers.assessment > 0);
  const avgAssessmentScore = assessedSkills.length > 0
    ? Math.round(assessedSkills.reduce((acc, s) => acc + s.tiers.assessment, 0) / assessedSkills.length)
    : 0;

  return (
    <div className="space-y-6 max-w-7xl mx-auto">
      {/* Executive Welcome Hero - Screen 1 Reference */}
      <div className="rounded-2xl border border-[#E2E8F0] bg-white p-6 sm:p-7 shadow-[0_4px_20px_rgba(15,23,42,0.03)] flex flex-col md:flex-row items-start md:items-center justify-between gap-6">
        <div className="space-y-2">
          <div className="flex items-center gap-2">
            <span className="text-[11px] font-bold uppercase tracking-wider px-2.5 py-0.5 rounded-full bg-slate-100 text-slate-600 border border-slate-200">
              Student Portal
            </span>
            {isVerified ? (
              <span className="inline-flex items-center gap-1 text-[11px] font-semibold px-2.5 py-0.5 rounded-full bg-emerald-50 text-emerald-700 border border-emerald-200">
                <ShieldCheck className="w-3.5 h-3.5 text-emerald-600" /> Verified Candidate
              </span>
            ) : (
              <span className="text-[11px] font-semibold px-2.5 py-0.5 rounded-full bg-slate-100 text-slate-600 border border-slate-200">
                Verification Pending
              </span>
            )}
          </div>
          <h1 className="text-2xl sm:text-3xl font-black tracking-tight text-slate-900">
            Good morning, {studentProfile.name || 'Candidate'} 👋
          </h1>
          <p className="text-xs text-slate-500">
            {studentProfile.degree || 'Degree In Progress'} • {studentProfile.college || 'Affiliated Institution'}
          </p>
          <div className="flex flex-wrap items-center gap-3 pt-1 text-xs text-slate-500 font-medium">
            <span>Target Role: <strong className="text-slate-900 font-bold">{studentProfile.targetRole || 'Software Engineer'}</strong></span>
            <span className="text-slate-300">•</span>
            <span>Passport ID: <strong className="text-blue-600 font-mono font-bold">{passportIdDisplay}</strong></span>
          </div>
        </div>

        {/* Placement Readiness Capsule */}
        <div className="p-4 rounded-2xl bg-gradient-to-r from-blue-50 to-indigo-50/50 border border-blue-100 flex items-center gap-4 shrink-0 shadow-sm">
          <div className="relative w-16 h-16 flex items-center justify-center">
            <div className="w-16 h-16 rounded-full border-4 border-slate-200 border-t-blue-600 border-r-blue-500" />
            <span className="absolute text-lg font-black text-slate-900 font-mono">{studentProfile.placementReadiness || 0}%</span>
          </div>
          <div>
            <div className="text-[11px] text-blue-600 font-bold uppercase tracking-wider">Placement Readiness</div>
            <div className="text-xs font-bold text-slate-900">
              {studentProfile.placementReadiness > 0 ? 'Verified Employability' : 'Uncalculated'}
            </div>
            <Link to="/student/passport" className="text-xs text-blue-600 hover:text-blue-700 font-semibold flex items-center gap-1 mt-1">
              <span>View Passport</span>
              <ArrowRight className="w-3 h-3" />
            </Link>
          </div>
        </div>
      </div>

      {/* 4 Verification Pillars - Screen 1 Reference */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {/* Tier 1: Resume */}
        <Link
          to="/student/resume-upload"
          className="p-5 rounded-2xl border border-[#E2E8F0] bg-white hover:border-blue-400 hover:shadow-[0_8px_30px_rgba(15,23,42,0.08)] transition-all group flex flex-col justify-between"
        >
          <div className="flex items-center justify-between mb-3">
            <div className="w-10 h-10 rounded-xl bg-blue-50 text-blue-600 border border-blue-100 flex items-center justify-center">
              <FileText className="w-5 h-5" />
            </div>
            {resumeData.parsed ? (
              <span className="text-[10px] font-bold px-2.5 py-0.5 rounded-full bg-emerald-50 text-emerald-700 border border-emerald-200">Uploaded</span>
            ) : (
              <span className="text-[10px] font-bold px-2.5 py-0.5 rounded-full bg-slate-100 text-slate-600 border border-slate-200">Pending</span>
            )}
          </div>
          <div>
            <h3 className="font-bold text-sm text-slate-900 group-hover:text-blue-600 transition-colors">
              1. Resume Ingestion
            </h3>
            <p className="text-xs text-slate-500 mt-1 leading-relaxed">
              {resumeData.parsed
                ? `${resumeData.extractedSkills?.length || 0} skills extracted`
                : 'Upload PDF to extract evidence'}
            </p>
          </div>
        </Link>

        {/* Tier 2: GitHub */}
        <Link
          to="/student/github-verify"
          className="p-5 rounded-2xl border border-[#E2E8F0] bg-white hover:border-blue-400 hover:shadow-[0_8px_30px_rgba(15,23,42,0.08)] transition-all group flex flex-col justify-between"
        >
          <div className="flex items-center justify-between mb-3">
            <div className="w-10 h-10 rounded-xl bg-emerald-50 text-emerald-600 border border-emerald-100 flex items-center justify-center">
              <GitBranch className="w-5 h-5" />
            </div>
            {githubData.connected ? (
              <span className="text-[10px] font-bold px-2.5 py-0.5 rounded-full bg-emerald-50 text-emerald-700 border border-emerald-200">Linked</span>
            ) : (
              <span className="text-[10px] font-bold px-2.5 py-0.5 rounded-full bg-slate-100 text-slate-600 border border-slate-200">Unlinked</span>
            )}
          </div>
          <div>
            <h3 className="font-bold text-sm text-slate-900 group-hover:text-blue-600 transition-colors">
              2. GitHub Proof
            </h3>
            <p className="text-xs text-slate-500 mt-1 leading-relaxed">
              {githubData.connected
                ? `${githubData.totalRepos || githubData.verifiedRepos?.length || 0} repos evaluated`
                : 'Audit commit provenance'}
            </p>
          </div>
        </Link>

        {/* Tier 3: Assessment */}
        <Link
          to="/student/assessments"
          className="p-5 rounded-2xl border border-[#E2E8F0] bg-white hover:border-blue-400 hover:shadow-[0_8px_30px_rgba(15,23,42,0.08)] transition-all group flex flex-col justify-between"
        >
          <div className="flex items-center justify-between mb-3">
            <div className="w-10 h-10 rounded-xl bg-indigo-50 text-indigo-600 border border-indigo-100 flex items-center justify-center">
              <Award className="w-5 h-5" />
            </div>
            {assessedSkills.length > 0 ? (
              <span className="text-[10px] font-bold px-2.5 py-0.5 rounded-full bg-blue-50 text-blue-700 border border-blue-200">{avgAssessmentScore}% Avg</span>
            ) : (
              <span className="text-[10px] font-bold px-2.5 py-0.5 rounded-full bg-slate-100 text-slate-600 border border-slate-200">0 Taken</span>
            )}
          </div>
          <div>
            <h3 className="font-bold text-sm text-slate-900 group-hover:text-blue-600 transition-colors">
              3. Skill Assessment
            </h3>
            <p className="text-xs text-slate-500 mt-1 leading-relaxed">
              {assessedSkills.length > 0
                ? `${assessedSkills.length} tests completed`
                : 'Proctored knowledge tests'}
            </p>
          </div>
        </Link>

        {/* Tier 4: Interview */}
        <Link
          to="/student/ai-interview"
          className="p-5 rounded-2xl border border-[#E2E8F0] bg-white hover:border-blue-400 hover:shadow-[0_8px_30px_rgba(15,23,42,0.08)] transition-all group flex flex-col justify-between"
        >
          <div className="flex items-center justify-between mb-3">
            <div className="w-10 h-10 rounded-xl bg-amber-50 text-amber-600 border border-amber-100 flex items-center justify-center">
              <BotMessageSquare className="w-5 h-5" />
            </div>
            {interviewSession.status === 'COMPLETED' ? (
              <span className="text-[10px] font-bold px-2.5 py-0.5 rounded-full bg-amber-50 text-amber-700 border border-amber-200">Cleared</span>
            ) : interviewSession.status === 'IN_PROGRESS' ? (
              <span className="text-[10px] font-bold px-2.5 py-0.5 rounded-full bg-blue-50 text-blue-700 border border-blue-200">Active</span>
            ) : (
              <span className="text-[10px] font-bold px-2.5 py-0.5 rounded-full bg-slate-100 text-slate-600 border border-slate-200">Ready</span>
            )}
          </div>
          <div>
            <h3 className="font-bold text-sm text-slate-900 group-hover:text-blue-600 transition-colors">
              4. AI Interview
            </h3>
            <p className="text-xs text-slate-500 mt-1 leading-relaxed">
              {interviewSession.status === 'COMPLETED'
                ? `Score: ${interviewSession.overallScore}/100`
                : 'Interactive defense session'}
            </p>
          </div>
        </Link>
      </div>

      {/* Main Grid: Skill Health & Career Roadmap */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* Left: Skill Health & Competency */}
        <div className="lg:col-span-7 rounded-2xl border border-[#E2E8F0] bg-white p-6 space-y-4 shadow-[0_4px_20px_rgba(15,23,42,0.03)]">
          <div className="flex items-center justify-between pb-3 border-b border-slate-100">
            <div>
              <h2 className="text-sm font-bold text-slate-900">Skill Competency Profile</h2>
              <p className="text-xs text-slate-500 mt-0.5">Calculated across all 4 verification tiers</p>
            </div>
            <Link to="/student/skill-map" className="text-xs text-blue-600 font-medium hover:underline flex items-center gap-1">
              <span>Full Map</span>
              <ArrowRight className="w-3 h-3" />
            </Link>
          </div>

          {skillMap.length > 0 ? (
            <div className="space-y-4">
              <div className="h-60 w-full">
                <ResponsiveContainer width="100%" height="100%">
                  <RadarChart data={radarData}>
                    <PolarGrid stroke="#E2E8F0" />
                    <PolarAngleAxis dataKey="subject" stroke="#64748B" tick={{ fontSize: 11 }} />
                    <PolarRadiusAxis angle={30} domain={[0, 100]} stroke="#CBD5E1" />
                    <Radar name="Competency" dataKey="score" stroke="#2563EB" fill="#3B82F6" fillOpacity={0.2} />
                  </RadarChart>
                </ResponsiveContainer>
              </div>

              {/* Horizontal Skill Health Bars */}
              <div className="space-y-2.5 pt-2 border-t border-slate-100">
                {skillMap.slice(0, 4).map(skill => (
                  <div key={skill.id} className="p-2.5 rounded-lg bg-slate-50 border border-slate-200 flex items-center justify-between gap-4">
                    <div className="min-w-0 flex-1">
                      <div className="flex items-center justify-between text-xs mb-1">
                        <span className="font-semibold text-slate-900 truncate">{skill.name}</span>
                        <span className="text-slate-500 font-mono font-medium">{skill.score}%</span>
                      </div>
                      <ProgressBar value={skill.score} max={100} size="sm" color={skill.score >= 80 ? 'emerald' : skill.score >= 60 ? 'indigo' : 'amber'} />
                    </div>
                    <VerifiedBadge level={skill.badge} size="xs" compact />
                  </div>
                ))}
              </div>
            </div>
          ) : (
            <EmptyState
              icon={TrendingUp}
              title="No skills verified yet"
              description="Upload your resume or link your GitHub profile to begin establishing your verifiable skill profile."
              actionLabel="Upload Resume"
              onAction={() => window.location.hash = '#/student/resume-upload'}
              actionIcon={FileText}
            />
          )}
        </div>

        {/* Right: AI Career Roadmap */}
        <div className="lg:col-span-5 rounded-2xl border border-[#E2E8F0] bg-white p-6 flex flex-col justify-between space-y-4 shadow-[0_4px_20px_rgba(15,23,42,0.03)]">
          <div>
            <div className="flex items-center justify-between pb-3 border-b border-slate-100">
              <div className="flex items-center gap-2">
                <Sparkles className="w-4 h-4 text-blue-600" />
                <h2 className="text-sm font-bold text-slate-900">Target Role Roadmap</h2>
              </div>
              <Link to="/student/skill-gap-roadmap" className="text-xs text-blue-600 font-semibold hover:underline flex items-center gap-1">
                <span>Roadmap</span>
                <ArrowRight className="w-3 h-3" />
              </Link>
            </div>
            <p className="text-xs text-slate-500 mt-1.5">
              Milestones tailored for <strong className="text-slate-800">{studentProfile.targetRole || 'Software Engineer'}</strong>
            </p>
          </div>

          {roadmap.length > 0 ? (
            <div className="space-y-3 my-auto">
              {roadmap.slice(0, 3).map((item) => (
                <div
                  key={item.week}
                  className={`p-3.5 rounded-xl border transition-all ${
                    item.completed
                      ? 'bg-slate-50 border-slate-200 text-slate-500'
                      : 'bg-white border-[#E2E8F0] text-slate-900 shadow-sm'
                  }`}
                >
                  <div className="flex items-center justify-between text-xs mb-1">
                    <span className="font-mono font-bold text-blue-600">Phase {item.week}</span>
                    {item.completed ? (
                      <span className="flex items-center gap-1 text-[10px] text-emerald-700 font-semibold bg-emerald-50 px-2 py-0.5 rounded-full border border-emerald-200">
                        <CheckCircle2 className="w-3 h-3 text-emerald-600" /> Done
                      </span>
                    ) : (
                      <span className="flex items-center gap-1 text-[10px] text-amber-700 font-semibold bg-amber-50 px-2 py-0.5 rounded-full border border-amber-200">
                        <Clock className="w-3 h-3 text-amber-600" /> In Progress
                      </span>
                    )}
                  </div>
                  <h4 className="text-xs font-bold text-slate-900">{item.title}</h4>
                  <p className="text-[11px] text-slate-500 line-clamp-1 mt-0.5">{item.action}</p>
                </div>
              ))}
            </div>
          ) : (
            <EmptyState
              icon={Clock}
              title="Roadmap not generated"
              description="Complete skill verification to generate an adaptive AI upskilling plan."
            />
          )}

          <div className="pt-3 border-t border-slate-100 flex items-center justify-between text-xs">
            <span className="text-slate-500 font-medium">
              {roadmap.length > 0 ? `${completedMilestones} of ${roadmap.length} completed` : '0 milestones'}
            </span>
            <Link
              to="/student/skill-gap-roadmap"
              className="text-xs text-blue-600 hover:text-blue-700 font-semibold flex items-center gap-1"
            >
              <span>Manage Pathway</span>
              <ArrowRight className="w-3 h-3" />
            </Link>
          </div>
        </div>
      </div>

      {/* Matched Opportunities Strip */}
      <div className="rounded-2xl border border-[#E2E8F0] bg-white p-6 sm:p-7 space-y-4 shadow-[0_4px_20px_rgba(15,23,42,0.03)]">
        <div className="flex items-center justify-between pb-3 border-b border-slate-100">
          <div>
            <h2 className="text-sm font-bold text-slate-900 flex items-center gap-2">
              <Briefcase className="w-4 h-4 text-blue-600" />
              <span>Recommended Job Opportunities ({jobs.length})</span>
            </h2>
            <p className="text-xs text-slate-500 mt-0.5">
              Matched against verified competencies and passport credentials
            </p>
          </div>
          <Link to="/student/jobs" className="text-xs text-blue-600 font-semibold hover:underline flex items-center gap-1">
            <span>All Postings</span>
            <ArrowRight className="w-3 h-3" />
          </Link>
        </div>

        {jobs.length > 0 ? (
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            {jobs.slice(0, 3).map((job) => (
              <div key={job.id} className="p-4 rounded-xl bg-slate-50 border border-slate-200 space-y-3">
                <div className="flex items-start justify-between gap-2">
                  <div className="min-w-0">
                    <h3 className="font-bold text-xs text-slate-900 truncate">{job.title}</h3>
                    <p className="text-[11px] text-slate-500 truncate font-medium">{job.company}</p>
                  </div>
                  <span className="text-xs font-mono font-bold px-2 py-0.5 rounded-full bg-blue-50 text-blue-700 border border-blue-200 shrink-0">
                    {job.matchScore}% Match
                  </span>
                </div>
                <div className="flex items-center gap-2 text-[11px] text-slate-500">
                  <span>{job.location}</span>
                  <span>•</span>
                  <span>{job.type}</span>
                </div>
                <div className="pt-2 border-t border-slate-200 flex items-center justify-between">
                  <span className="text-xs font-bold text-emerald-700">{job.salary}</span>
                  <Link
                    to={`/student/jobs?jobId=${job.id}`}
                    className="text-xs text-blue-600 hover:text-blue-700 font-semibold flex items-center gap-1"
                  >
                    <span>View</span>
                    <ArrowRight className="w-3 h-3" />
                  </Link>
                </div>
              </div>
            ))}
          </div>
        ) : (
          <EmptyState
            icon={Briefcase}
            title="No matching job postings found"
            description="Verify more competencies to see tailored opportunities from partner recruiters."
          />
        )}
      </div>
    </div>
  );
};

export default StudentDashboard;
