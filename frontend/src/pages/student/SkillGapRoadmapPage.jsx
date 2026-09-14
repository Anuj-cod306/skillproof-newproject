import React, { useEffect, useState } from 'react';
import {
  Compass,
  AlertTriangle,
  CheckCircle2,
  Clock,
  Sparkles,
  ArrowRight,
  Target,
  RefreshCw,
  Loader2
} from 'lucide-react';
import { useSkillProof } from '../../context/SkillProofContext';
import { PageHeader } from '../../components/common/PageHeader';
import { Button } from '../../components/common/Button';
import { Badge } from '../../components/common/Badge';
import { Card } from '../../components/common/Card';
import { ProgressBar } from '../../components/common/ProgressBar';
import { EmptyState } from '../../components/common/EmptyState';

const SUPPORTED_ROLES = [
  'Backend Developer',
  'Frontend Developer',
  'Full Stack Developer',
  'Data Scientist',
  'ML Engineer',
  'DevOps Engineer',
  'Cloud Engineer',
  'Software Engineer'
];

export const SkillGapRoadmapPage = () => {
  const { skillGap, roadmap, toggleRoadmapMilestone, changeTargetRole, loadLiveStudentData } = useSkillProof();
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [changingRole, setChangingRole] = useState(false);

  useEffect(() => {
    let active = true;
    const init = async () => {
      setLoading(true);
      try {
        if (loadLiveStudentData) {
          await loadLiveStudentData();
        }
      } catch (err) {
        console.warn('[SkillGapRoadmapPage] Load error:', err);
      } finally {
        if (active) setLoading(false);
      }
    };
    init();
    return () => { active = false; };
  }, []);

  const handleRefresh = async () => {
    setRefreshing(true);
    try {
      if (loadLiveStudentData) {
        await loadLiveStudentData();
      }
    } finally {
      setRefreshing(false);
    }
  };

  const handleRoleChange = async (e) => {
    const newRole = e.target.value;
    setChangingRole(true);
    try {
      if (changeTargetRole) {
        await changeTargetRole(newRole);
      }
    } catch (err) {
      console.error('[SkillGapRoadmapPage] Role change failed:', err);
    } finally {
      setChangingRole(false);
    }
  };

  const matchedCount = Array.isArray(skillGap?.matchedSkills) ? skillGap.matchedSkills.length : 0;
  const missingCount = Array.isArray(skillGap?.missingSkills) ? skillGap.missingSkills.length : 0;
  const hasGaps = missingCount > 0;
  const isPlacementReady = !hasGaps && matchedCount > 0 && (skillGap?.isPlacementReady !== false);

  const displayMatched = (Array.isArray(skillGap?.matchedSkillDetails) && skillGap.matchedSkillDetails.length > 0)
    ? skillGap.matchedSkillDetails
    : (Array.isArray(skillGap?.matchedSkills) ? skillGap.matchedSkills : []);

  const displayMissing = (Array.isArray(skillGap?.missingSkillDetails) && skillGap.missingSkillDetails.length > 0)
    ? skillGap.missingSkillDetails
    : (Array.isArray(skillGap?.missingSkills) ? skillGap.missingSkills : []);

  const totalMilestones = Array.isArray(roadmap) ? roadmap.length : 0;
  const completedCount = (roadmap || []).filter(m => m.completed).length;

  const progressPercent = totalMilestones > 0
    ? Math.round((completedCount / totalMilestones) * 100)
    : (isPlacementReady ? 100 : 0);

  if (loading) {
    return (
      <div className="max-w-4xl mx-auto py-20 flex flex-col items-center justify-center space-y-3">
        <Loader2 className="w-6 h-6 text-blue-600 animate-spin" />
        <p className="text-xs font-medium text-slate-500">Evaluating skill evidence & calculating competency gaps...</p>
      </div>
    );
  }

  return (
    <div className="max-w-4xl mx-auto space-y-6">
      <PageHeader
        title="Skill Gap & Career Roadmap"
        subtitle="Benchmark your verified competencies against industry market expectations to prioritize actionable upskilling steps."
        badge={<Badge variant="primary" size="xs">Role Intelligence</Badge>}
        breadcrumbs={['Student Portal', 'Career & Jobs', 'Skill Gap & Roadmap']}
        actions={
          <div className="flex items-center gap-2">
            <div className="flex items-center gap-2 bg-white border border-slate-300 rounded-full px-3.5 py-1.5 shadow-2xs">
              <Target className="w-3.5 h-3.5 text-blue-600" />
              <span className="text-[11px] font-semibold text-slate-500">Target:</span>
              <select
                value={skillGap?.targetRole || 'Backend Developer'}
                onChange={handleRoleChange}
                disabled={changingRole || refreshing}
                className="bg-transparent text-xs font-bold text-slate-900 outline-none cursor-pointer"
              >
                {SUPPORTED_ROLES.map((r) => (
                  <option key={r} value={r} className="bg-white text-slate-900">
                    {r}
                  </option>
                ))}
              </select>
            </div>

            <Button
              variant="secondary"
              size="sm"
              onClick={handleRefresh}
              disabled={refreshing || changingRole}
              isLoading={refreshing}
              icon={RefreshCw}
            >
              Refresh
            </Button>
          </div>
        }
      />

      {/* 2-Column Comparative Analysis */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {/* Verified Strengths */}
        <Card className="p-5 sm:p-6 space-y-4 border border-[#E2E8F0] bg-white shadow-[0_4px_20px_rgba(15,23,42,0.04)]">
          <div className="flex items-center justify-between pb-3 border-b border-slate-100">
            <div className="flex items-center gap-2 text-emerald-800 font-bold text-xs">
              <CheckCircle2 className="w-4 h-4 text-emerald-600" />
              <span>Target Role Strengths ({matchedCount})</span>
            </div>
            <Badge variant="success" size="xs">Benchmark Met</Badge>
          </div>

          <div className="space-y-2">
            {displayMatched.length === 0 ? (
              <p className="text-xs text-slate-400 italic py-3 text-center">
                No competencies satisfy market thresholds yet. Complete assessments or connect GitHub to raise scores.
              </p>
            ) : (
              displayMatched.map((s, idx) => {
                const isObj = typeof s === 'object' && s !== null;
                const name = isObj ? s.name : s;
                const current = isObj ? s.currentScore : null;
                const target = isObj ? s.targetScore : null;

                return (
                  <div key={idx} className="p-3 rounded-xl bg-slate-50/80 border border-slate-200/80 text-xs hover:bg-slate-100/60 transition-colors">
                    <div className="flex items-center justify-between font-medium">
                      <span className="text-slate-900 font-semibold">{name}</span>
                      {current !== null && (
                        <span className="text-[11px] text-slate-500">
                          <strong className="text-emerald-700 font-mono font-bold">{current}%</strong> / {target}%
                        </span>
                      )}
                    </div>
                  </div>
                );
              })
            )}
          </div>
        </Card>

        {/* Identified Deficits */}
        <Card className="p-5 sm:p-6 space-y-4 border border-[#E2E8F0] bg-white shadow-[0_4px_20px_rgba(15,23,42,0.04)]">
          <div className="flex items-center justify-between pb-3 border-b border-slate-100">
            <div className="flex items-center gap-2 text-rose-800 font-bold text-xs">
              <AlertTriangle className="w-4 h-4 text-rose-600" />
              <span>Identified Skill Gaps ({missingCount})</span>
            </div>
            <Badge variant="danger" size="xs">Deficit</Badge>
          </div>

          <div className="space-y-2">
            {displayMissing.length === 0 ? (
              <p className="text-xs text-emerald-700 italic py-3 text-center font-medium">
                Zero skill deficits detected! All competencies meet target benchmarks.
              </p>
            ) : (
              displayMissing.map((s, idx) => {
                const isObj = typeof s === 'object' && s !== null;
                const name = isObj ? s.name : s;
                const current = isObj ? s.currentScore : null;
                const target = isObj ? s.targetScore : null;
                const deficit = isObj ? s.deficit : null;

                return (
                  <div key={idx} className="p-3 rounded-xl bg-white border border-rose-200/80 shadow-2xs text-xs space-y-1">
                    <div className="flex items-center justify-between font-medium">
                      <span className="text-slate-900 font-semibold">{name}</span>
                      <span className="text-[11px] font-mono px-2 py-0.5 rounded-full bg-rose-50 text-rose-700 border border-rose-200 font-bold">
                        {deficit !== null ? `-${deficit}% Gap` : 'Deficit'}
                      </span>
                    </div>
                    {current !== null && (
                      <div className="text-[11px] text-slate-500 mt-1">
                        Current: <strong className="text-slate-800 font-semibold">{current}%</strong> • Required: <strong className="text-slate-800 font-semibold">{target}%</strong>
                      </div>
                    )}
                  </div>
                );
              })
            )}
          </div>
        </Card>
      </div>

      {/* Targeted AI Action Roadmap */}
      <Card className="p-6 sm:p-7 space-y-5 border border-[#E2E8F0] bg-white shadow-[0_4px_20px_rgba(15,23,42,0.04)]">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-4 border-b border-slate-100">
          <div>
            <div className="flex items-center gap-2">
              <Sparkles className="w-4 h-4 text-blue-600" />
              <h2 className="text-sm font-bold text-slate-900">
                Action Roadmap ({totalMilestones} Weeks)
              </h2>
            </div>
            <p className="text-xs text-slate-500 mt-0.5">
              Phased milestones tailored to close identified competency gaps.
            </p>
          </div>

          <div className="w-48">
            <ProgressBar value={progressPercent} max={100} size="sm" showLabel label="Roadmap Progress" color="blue" />
          </div>
        </div>

        {/* Milestone List */}
        <div className="space-y-3">
          {isPlacementReady ? (
            <div className="p-6 rounded-2xl bg-emerald-50 border border-emerald-200 text-center space-y-2">
              <CheckCircle2 className="w-7 h-7 text-emerald-600 mx-auto" />
              <h4 className="text-sm font-bold text-emerald-900">Placement-Ready Status</h4>
              <p className="text-xs text-emerald-700 max-w-sm mx-auto">
                All technical benchmarks for <strong className="text-emerald-900">{skillGap?.targetRole}</strong> are satisfied.
              </p>
            </div>
          ) : totalMilestones === 0 ? (
            <EmptyState
              icon={Clock}
              title="No action milestones active"
              description="Click Refresh to recalculate and generate a personalized roadmap."
            />
          ) : (
            roadmap.map((item) => (
              <div
                key={item.id || item.week}
                className={`p-4 sm:p-5 rounded-2xl border transition-all ${
                  item.completed
                    ? 'bg-slate-50/60 border-slate-200 text-slate-400'
                    : 'bg-white border-slate-200/90 text-slate-900 shadow-[0_2px_12px_rgba(15,23,42,0.03)]'
                }`}
              >
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                  <div className="flex items-start gap-3">
                    <button
                      onClick={() => toggleRoadmapMilestone(item.id || item.week)}
                      className={`p-1.5 rounded-lg border mt-0.5 transition-colors ${
                        item.completed
                          ? 'bg-emerald-600 border-emerald-500 text-white'
                          : 'bg-white border-slate-300 text-slate-400 hover:border-blue-600 hover:text-blue-600'
                      }`}
                      title="Toggle milestone status"
                    >
                      <CheckCircle2 className="w-4 h-4" />
                    </button>

                    <div className="space-y-1 min-w-0">
                      <div className="flex items-center gap-2">
                        <span className="text-xs font-mono font-bold text-blue-600">Week {item.week}</span>
                        <h3 className={`text-xs font-bold ${item.completed ? 'text-slate-400 line-through' : 'text-slate-900'}`}>
                          {item.title}
                        </h3>
                      </div>
                      <p className={`text-xs leading-relaxed ${item.completed ? 'text-slate-400' : 'text-slate-600'}`}>{item.action}</p>

                      {item.skills && item.skills.length > 0 && (
                        <div className="flex flex-wrap gap-1.5 pt-1">
                          {item.skills.map((skill, sIdx) => (
                            <span key={sIdx} className="text-[10px] px-2 py-0.5 rounded-full bg-blue-50 text-blue-700 border border-blue-200 font-semibold font-mono">
                              {skill}
                            </span>
                          ))}
                        </div>
                      )}
                    </div>
                  </div>

                  <Button
                    size="xs"
                    variant={item.completed ? 'secondary' : 'primary'}
                    onClick={() => toggleRoadmapMilestone(item.id || item.week)}
                  >
                    {item.completed ? 'Mark Incomplete' : 'Mark Completed'}
                  </Button>
                </div>
              </div>
            ))
          )}
        </div>
      </Card>
    </div>
  );
};

export default SkillGapRoadmapPage;
