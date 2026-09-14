import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import {
  BrainCircuit,
  Award,
  ArrowRight,
  ShieldCheck,
  Sparkles,
  Loader2,
  AlertCircle,
  RefreshCw,
  FileText,
  CheckCircle2,
  TrendingUp,
  Compass,
  Layers,
  ChevronRight
} from 'lucide-react';
import { ResponsiveContainer, AreaChart, Area, XAxis, YAxis, Tooltip } from 'recharts';
import { useSkillProof } from '../../context/SkillProofContext';
import apiService from '../../services/api';
import { PageHeader } from '../../components/common/PageHeader';
import { Button } from '../../components/common/Button';
import { Badge, VerifiedBadge } from '../../components/common/Badge';
import { Card, CardHeader, CardTitle, CardContent } from '../../components/common/Card';
import { ProgressBar } from '../../components/common/ProgressBar';
import { EmptyState } from '../../components/common/EmptyState';

export const SkillMapPage = () => {
  const { skillMap, setSkillMap, loadLiveStudentData, studentProfile } = useSkillProof();
  const [activeCategory, setActiveCategory] = useState('ALL');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  const fetchLiveSkills = async () => {
    setLoading(true);
    setError(null);
    try {
      const data = await apiService.getStudentSkills();
      if (Array.isArray(data) && setSkillMap) {
        setSkillMap(data.map(s => ({
          id: s.id ? String(s.id) : (s.name || '').toLowerCase().replace(/[^a-z0-9]/g, ''),
          skillId: s.skillId,
          name: s.name,
          category: s.category || 'Backend',
          status: s.status || 'CLAIMED',
          score: Math.round(s.score || 0),
          verified: !!s.verified,
          badge: s.badge || 'NONE',
          confidence: s.confidence !== undefined ? s.confidence : Math.round(s.tiers?.resume || 0),
          sourceResumeId: s.sourceResumeId,
          sourceResumeFileName: s.sourceResumeFileName,
          tiers: {
            resume: Math.round(s.tiers?.resume || 0),
            github: Math.round(s.tiers?.github || 0),
            assessment: Math.round(s.tiers?.assessment || 0),
            interview: Math.round(s.tiers?.interview || 0),
            competitiveCoding: Math.round(s.tiers?.competitiveCoding || 0)
          },
          evidence: s.evidence || 'Multi-tier evidence record'
        })));
      }
      if (loadLiveStudentData) {
        loadLiveStudentData();
      }
    } catch (err) {
      console.error('[SkillMapPage] Failed to fetch live skills:', err);
      setError(err.message || 'Failed to load skill map data.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchLiveSkills();
  }, []);

  const categories = ['ALL', 'Backend', 'Frontend', 'Database', 'Cloud & DevOps', 'Core CS'];

  const filteredSkills = (skillMap || []).filter(s => {
    return activeCategory === 'ALL' || s.category === activeCategory;
  });

  const verifiedSkillsCount = (skillMap || []).filter(s => s.verified).length;
  const overallAvg = skillMap && skillMap.length > 0
    ? Math.round(skillMap.reduce((acc, s) => acc + (s.score || 0), 0) / skillMap.length)
    : 72;

  // Growth chart mock progression
  const growthData = [
    { month: 'Jan', score: 35 },
    { month: 'Feb', score: 42 },
    { month: 'Mar', score: 50 },
    { month: 'Apr', score: 58 },
    { month: 'May', score: 65 },
    { month: 'Jun', score: overallAvg > 0 ? overallAvg : 72 },
  ];

  return (
    <div className="space-y-6 max-w-7xl mx-auto animate-fade-in pb-12">
      {/* Header Bar (Screen 4 Reference) */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 pb-2">
        <div>
          <h1 className="text-2xl sm:text-3xl font-bold tracking-tight text-slate-900">
            Skill Map
          </h1>
          <p className="text-xs sm:text-sm text-slate-500 mt-1">
            Visualize your skills, track progress, and identify gaps across all 5 verification channels.
          </p>
        </div>

        <div className="flex items-center gap-2.5">
          <Button
            variant="secondary"
            size="sm"
            onClick={fetchLiveSkills}
            disabled={loading}
            icon={RefreshCw}
          >
            {loading ? 'Refreshing...' : 'Refresh'}
          </Button>
          <Link to="/student/assessments">
            <Button variant="primary" size="sm" icon={Award}>
              Verify a Skill
            </Button>
          </Link>
        </div>
      </div>

      {/* Error state */}
      {error && (
        <div className="p-3.5 rounded-xl bg-rose-50 border border-rose-200 flex items-center justify-between gap-4 text-xs text-rose-700">
          <div className="flex items-center gap-2">
            <AlertCircle className="w-4 h-4 text-rose-500 shrink-0" />
            <span>{error}</span>
          </div>
          <Button size="xs" variant="secondary" onClick={fetchLiveSkills}>
            Retry
          </Button>
        </div>
      )}

      {/* Top Analytics Grid (Screen 4 Reference) */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        
        {/* Left: Overall Proficiency Gauge (5 cols) */}
        <div className="lg:col-span-5">
          <Card className="p-6 h-full flex flex-col justify-between">
            <div>
              <div className="flex items-center justify-between">
                <h3 className="text-sm font-bold text-slate-900">Overall Proficiency</h3>
                <Badge variant="blue" size="xs">Audit Baseline</Badge>
              </div>
              <p className="text-xs text-slate-500 mt-0.5">Aggregated multi-channel competency index</p>
            </div>

            <div className="my-6 flex items-center justify-center">
              <div className="relative w-36 h-36 flex items-center justify-center">
                <svg className="w-full h-full transform -rotate-90" viewBox="0 0 100 100">
                  <circle
                    cx="50"
                    cy="50"
                    r="40"
                    className="text-slate-100 stroke-current"
                    strokeWidth="8"
                    fill="transparent"
                  />
                  <circle
                    cx="50"
                    cy="50"
                    r="40"
                    className="text-blue-600 stroke-current transition-all duration-1000 ease-out"
                    strokeWidth="8"
                    strokeDasharray={`${2 * Math.PI * 40}`}
                    strokeDashoffset={`${2 * Math.PI * 40 * (1 - overallAvg / 100)}`}
                    strokeLinecap="round"
                    fill="transparent"
                  />
                </svg>
                <div className="absolute flex flex-col items-center">
                  <span className="text-3xl font-bold font-mono text-slate-900">{overallAvg}%</span>
                  <span className="text-[10px] font-semibold text-emerald-600">Good Progress</span>
                </div>
              </div>
            </div>

            {/* Proficiency Breakdown Legend */}
            <div className="grid grid-cols-2 gap-2.5 pt-3 border-t border-slate-100 text-xs">
              <div className="flex items-center gap-2">
                <span className="w-2.5 h-2.5 rounded-full bg-emerald-500 shrink-0" />
                <span className="text-slate-600 font-medium">Strong ({verifiedSkillsCount || 8})</span>
              </div>
              <div className="flex items-center gap-2">
                <span className="w-2.5 h-2.5 rounded-full bg-amber-500 shrink-0" />
                <span className="text-slate-600 font-medium">Intermediate (6)</span>
              </div>
              <div className="flex items-center gap-2">
                <span className="w-2.5 h-2.5 rounded-full bg-blue-500 shrink-0" />
                <span className="text-slate-600 font-medium">Beginner (4)</span>
              </div>
              <div className="flex items-center gap-2">
                <span className="w-2.5 h-2.5 rounded-full bg-slate-300 shrink-0" />
                <span className="text-slate-600 font-medium">Not Started (2)</span>
              </div>
            </div>
          </Card>
        </div>

        {/* Right: Skill Growth Trend Chart (7 cols) */}
        <div className="lg:col-span-7">
          <Card className="p-6 h-full flex flex-col justify-between">
            <div className="flex items-center justify-between">
              <div>
                <h3 className="text-sm font-bold text-slate-900">Skill Growth</h3>
                <p className="text-xs text-slate-500 mt-0.5">Month-over-month verified capability increase</p>
              </div>
              <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full bg-emerald-50 border border-emerald-200 text-emerald-700 text-xs font-semibold">
                <TrendingUp className="w-3 h-3" />
                <span>+25% this month</span>
              </span>
            </div>

            <div className="h-44 w-full pt-4">
              <ResponsiveContainer width="100%" height="100%">
                <AreaChart data={growthData}>
                  <defs>
                    <linearGradient id="growthGradient" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="#2563EB" stopOpacity={0.15}/>
                      <stop offset="95%" stopColor="#2563EB" stopOpacity={0}/>
                    </linearGradient>
                  </defs>
                  <XAxis dataKey="month" stroke="#94A3B8" fontSize={11} tickLine={false} />
                  <YAxis stroke="#94A3B8" fontSize={11} tickLine={false} domain={[0, 100]} />
                  <Tooltip
                    contentStyle={{
                      backgroundColor: '#FFFFFF',
                      borderColor: '#E2E8F0',
                      borderRadius: '12px',
                      boxShadow: '0 4px 20px rgba(0,0,0,0.08)',
                      fontSize: '12px',
                      color: '#0F172A'
                    }}
                  />
                  <Area type="monotone" dataKey="score" stroke="#2563EB" strokeWidth={2.5} fillOpacity={1} fill="url(#growthGradient)" />
                </AreaChart>
              </ResponsiveContainer>
            </div>

            <div className="flex items-center justify-between text-xs text-slate-500 pt-3 border-t border-slate-100">
              <span>Verified tests and AI defenses continuously increment growth velocity.</span>
              <Link to="/student/skill-gap-roadmap" className="text-blue-600 font-semibold hover:underline">
                View Roadmap
              </Link>
            </div>
          </Card>
        </div>
      </div>

      {/* Motivational Roadmap Banner (Screen 4 Reference) */}
      <div className="p-5 rounded-2xl bg-gradient-to-r from-blue-50/80 via-white to-indigo-50/60 border border-blue-100/80 flex flex-col sm:flex-row sm:items-center justify-between gap-4 shadow-xs">
        <div className="flex items-center gap-3.5">
          <div className="w-10 h-10 rounded-xl bg-blue-600 text-white flex items-center justify-center shrink-0 shadow-xs">
            <Sparkles className="w-5 h-5" />
          </div>
          <div>
            <h4 className="text-sm font-bold text-slate-900">Keep learning. Keep growing.</h4>
            <p className="text-xs text-slate-500 mt-0.5">Explore personalized learning paths and target role milestones to strengthen your skills.</p>
          </div>
        </div>
        <Link to="/student/skill-gap-roadmap" className="shrink-0">
          <Button variant="primary" size="sm" icon={ArrowRight} iconPosition="right">
            Explore Roadmap
          </Button>
        </Link>
      </div>

      {/* Category Tabs */}
      <div className="flex items-center justify-between gap-4 flex-wrap pt-2">
        <div className="flex items-center gap-1.5 overflow-x-auto pb-1">
          {categories.map((cat) => (
            <button
              key={cat}
              onClick={() => setActiveCategory(cat)}
              className={`px-3.5 py-1.5 rounded-full text-xs font-medium transition-colors shrink-0 ${
                activeCategory === cat
                  ? 'bg-blue-600 text-white font-semibold shadow-xs'
                  : 'text-slate-600 hover:text-slate-900 bg-white border border-slate-200'
              }`}
            >
              {cat}
            </button>
          ))}
        </div>

        <span className="text-xs text-slate-500 font-medium">
          Showing {filteredSkills.length} competencies
        </span>
      </div>

      {/* Loading state */}
      {loading && filteredSkills.length === 0 ? (
        <div className="p-12 text-center rounded-2xl border border-slate-200 bg-white space-y-3">
          <Loader2 className="w-6 h-6 animate-spin text-blue-600 mx-auto" />
          <p className="text-xs text-slate-500">Loading verified competencies...</p>
        </div>
      ) : filteredSkills.length === 0 ? (
        <EmptyState
          icon={BrainCircuit}
          title="No skills mapped in this category"
          description="Upload your resume or complete skill assessments to map and verify technical competencies."
          actionLabel="Upload Resume to Map Skills"
          onAction={() => window.location.hash = '#/student/resume-upload'}
          actionIcon={Sparkles}
        />
      ) : (
        /* Skill Cards Grid (Screen 4 Reference) */
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
          {filteredSkills.map((skill) => {
            const isClaimedOnly = skill.status === 'CLAIMED' || (!skill.verified && (!skill.score || skill.score === 0));

            return (
              <Card
                key={skill.id}
                className="p-5 flex flex-col justify-between space-y-4"
              >
                <div>
                  <div className="flex items-start justify-between gap-3">
                    <div className="min-w-0">
                      <h3 className="font-bold text-sm text-slate-900 truncate">{skill.name}</h3>
                      <div className="flex items-center gap-1.5 mt-1 flex-wrap">
                        <span className="text-[11px] text-slate-500 font-medium">{skill.category}</span>
                        {isClaimedOnly && (
                          <Badge variant="warning" size="xs">
                            Claimed ({skill.confidence || skill.tiers?.resume || 0}%)
                          </Badge>
                        )}
                        {skill.sourceResumeFileName && (
                          <span className="text-[10px] px-2 py-0.5 rounded-full bg-slate-100 text-slate-600 font-mono flex items-center gap-1" title={`Source: ${skill.sourceResumeFileName}`}>
                            <FileText className="w-2.5 h-2.5 text-blue-600" />
                            <span className="max-w-[100px] truncate">{skill.sourceResumeFileName}</span>
                          </span>
                        )}
                      </div>
                    </div>
                    <div className="text-right shrink-0">
                      <div className="text-lg font-bold font-mono text-slate-900">
                        {isClaimedOnly ? (
                          <span className="text-xs font-normal text-slate-500">Claim</span>
                        ) : (
                          `${skill.score}%`
                        )}
                      </div>
                      <VerifiedBadge level={skill.badge || 'NONE'} size="sm" compact />
                    </div>
                  </div>

                  {/* Progress Bar */}
                  <div className="mt-3">
                    <ProgressBar
                      value={isClaimedOnly ? (skill.confidence || skill.tiers?.resume || 20) : skill.score}
                      max={100}
                      size="xs"
                      color={isClaimedOnly ? 'amber' : skill.score >= 80 ? 'emerald' : skill.score >= 60 ? 'blue' : 'slate'}
                    />
                  </div>

                  {/* 5-Tier Evidence Breakdown Matrix */}
                  <div className="mt-4 pt-3 border-t border-slate-100 grid grid-cols-5 gap-1 text-center text-[10px]">
                    <div className="bg-slate-50 p-1.5 rounded-lg border border-slate-100">
                      <div className="text-slate-500 font-medium">Resume</div>
                      <div className="font-bold text-slate-800 mt-0.5">{skill.tiers?.resume || 0}%</div>
                    </div>
                    <div className="bg-slate-50 p-1.5 rounded-lg border border-slate-100">
                      <div className="text-slate-500 font-medium">GitHub</div>
                      <div className="font-bold text-slate-800 mt-0.5">{skill.tiers?.github || 0}%</div>
                    </div>
                    <div className="bg-slate-50 p-1.5 rounded-lg border border-slate-100">
                      <div className="text-slate-500 font-medium">Quiz</div>
                      <div className="font-bold text-slate-800 mt-0.5">{skill.tiers?.assessment || 0}%</div>
                    </div>
                    <div className="bg-slate-50 p-1.5 rounded-lg border border-slate-100">
                      <div className="text-slate-500 font-medium">AI Interv</div>
                      <div className="font-bold text-slate-800 mt-0.5">{skill.tiers?.interview || 0}%</div>
                    </div>
                    <div className={`p-1.5 rounded-lg border ${skill.tiers?.competitiveCoding > 0 ? 'bg-blue-50 border-blue-200 text-blue-700' : 'bg-slate-50 border-slate-100 text-slate-700'}`}>
                      <div className="text-slate-500 font-medium">Comp</div>
                      <div className="font-bold mt-0.5">
                        {skill.tiers?.competitiveCoding || 0}%
                      </div>
                    </div>
                  </div>

                  {/* Evidence Statement */}
                  <p className="text-[11px] text-slate-600 italic mt-3 bg-slate-50 p-2.5 rounded-xl border border-slate-100 leading-relaxed">
                    "{skill.evidence || 'Multi-tier evidence record'}"
                  </p>
                </div>

                {/* Bottom Actions */}
                <div className="pt-3 border-t border-slate-100 flex items-center justify-between text-xs">
                  {skill.verified ? (
                    <span className="text-emerald-700 flex items-center gap-1 font-semibold text-[11px]">
                      <ShieldCheck className="w-3.5 h-3.5 text-emerald-600" />
                      Passport Active
                    </span>
                  ) : (
                    <span className="text-amber-700 text-[11px] font-semibold flex items-center gap-1">
                      <AlertCircle className="w-3 h-3 text-amber-600" />
                      Needs Verification
                    </span>
                  )}

                  <Link
                    to={(!skill.tiers?.assessment || skill.tiers.assessment < 70) ? '/student/assessments' : '/student/ai-interview'}
                    className="text-xs text-blue-600 hover:text-blue-700 font-semibold flex items-center gap-1"
                  >
                    <span>{skill.score >= 80 ? 'Retake Audit' : 'Boost Score'}</span>
                    <ArrowRight className="w-3 h-3" />
                  </Link>
                </div>
              </Card>
            );
          })}
        </div>
      )}
    </div>
  );
};

export default SkillMapPage;
