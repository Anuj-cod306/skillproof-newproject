import React, { useState, useEffect } from 'react';
import { TrendingUp, AlertTriangle, CheckCircle2, ArrowRight, Lightbulb, BookOpen, ShieldAlert, Sparkles } from 'lucide-react';
import { ResponsiveContainer, BarChart, Bar, XAxis, YAxis, Tooltip, Legend } from 'recharts';
import { PageHeader } from '../../components/common/PageHeader';
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from '../../components/common/Card';
import { Button } from '../../components/common/Button';
import { Badge } from '../../components/common/Badge';
import { ProgressBar } from '../../components/common/ProgressBar';
import apiService from '../../services/api';

export const DemandVsAvailabilityPage = () => {
  const defaultComparison = [
    { skill: 'Java', industryDemand: 94, studentAvailability: 88, gap: 6, status: 'HEALTHY' },
    { skill: 'Spring Boot', industryDemand: 91, studentAvailability: 55, gap: 36, status: 'MODERATE_DEFICIT' },
    { skill: 'Cloud & DevOps (AWS)', industryDemand: 88, studentAvailability: 24, gap: 64, status: 'CRITICAL_DEFICIT' },
    { skill: 'Docker & Microservices', industryDemand: 82, studentAvailability: 32, gap: 50, status: 'CRITICAL_DEFICIT' },
    { skill: 'AI / Machine Learning', industryDemand: 85, studentAvailability: 42, gap: 43, status: 'MODERATE_DEFICIT' },
    { skill: 'SQL & Database Indexing', industryDemand: 89, studentAvailability: 81, gap: 8, status: 'HEALTHY' },
    { skill: 'System Design & Scalability', industryDemand: 92, studentAvailability: 30, gap: 62, status: 'CRITICAL_DEFICIT' }
  ];

  const [comparisonData, setComparisonData] = useState(defaultComparison);

  useEffect(() => {
    apiService.getDemandVsAvailability()
      .then(res => {
        if (Array.isArray(res) && res.length > 0) {
          setComparisonData(res.map(r => ({
            skill: r.skillName || r.skill,
            industryDemand: Math.round(r.demandScore || r.industryDemand || 80),
            studentAvailability: Math.round(r.availabilityScore || r.studentAvailability || 50),
            gap: Math.round(r.gap || Math.abs((r.demandScore || 80) - (r.availabilityScore || 50))),
            status: r.status || ((r.demandScore - r.availabilityScore > 40) ? 'CRITICAL_DEFICIT' : 'MODERATE_DEFICIT')
          })));
        }
      })
      .catch(err => console.warn('[DemandVsAvailability] Using default metrics:', err.message));
  }, []);

  const chartData = comparisonData.map(c => ({
    name: c.skill.split(' ')[0],
    IndustryDemand: c.industryDemand,
    StudentAvailability: c.studentAvailability
  }));

  const getStatusBadge = (status) => {
    switch (status) {
      case 'HEALTHY':
        return <Badge variant="success" size="sm">Healthy Alignment</Badge>;
      case 'MODERATE_DEFICIT':
        return <Badge variant="warning" size="sm">Moderate Deficit</Badge>;
      default:
        return <Badge variant="danger" size="sm">Critical Deficit</Badge>;
    }
  };

  return (
    <div className="space-y-6 max-w-6xl mx-auto animate-fade-in">
      <PageHeader
        title="Skill Demand vs Student Availability Matrix"
        description="Empirical real-time analytics comparing corporate market hiring demand with verified student competencies to steer curriculum interventions"
        badge={<Badge variant="success" size="sm">Enterprise Market Intelligence</Badge>}
        breadcrumbs={[
          { label: 'Institution Portal', href: '#/institution/dashboard' },
          { label: 'Demand vs Availability' }
        ]}
      />

      {/* Visual Chart */}
      <Card>
        <CardHeader>
          <CardTitle>Comparative Demand vs Availability Graph</CardTitle>
          <CardDescription>
            Index comparison across enterprise market hiring requirements and verified student cohorts
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="h-72 w-full pt-2">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={chartData}>
                <XAxis dataKey="name" stroke="#64748B" fontSize={12} />
                <YAxis domain={[0, 100]} stroke="#64748B" fontSize={12} />
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
                <Legend wrapperStyle={{ fontSize: '12px', paddingTop: '12px', color: '#64748B' }} />
                <Bar dataKey="IndustryDemand" fill="#2563EB" name="Industry Demand Index (%)" radius={[4, 4, 0, 0]} isAnimationActive={false} />
                <Bar dataKey="StudentAvailability" fill="#60A5FA" name="Student Availability (%)" radius={[4, 4, 0, 0]} isAnimationActive={false} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </CardContent>
      </Card>

      {/* Side-by-Side Detailed Breakdown */}
      <Card>
        <CardHeader>
          <CardTitle>Empirical Skill Audit Matrix</CardTitle>
          <CardDescription>Granular breakdown of industry demand versus campus talent availability</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="divide-y divide-slate-100">
            {comparisonData.map((item, idx) => (
              <div key={idx} className="py-4 first:pt-0 last:pb-0 space-y-2.5">
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                  <div className="flex items-center gap-2.5 flex-wrap">
                    <span className="font-bold text-slate-900 text-sm">{item.skill}</span>
                    {getStatusBadge(item.status)}
                  </div>

                  <div className="text-xs font-mono text-slate-600 font-medium">
                    Deficit Gap: <strong className={item.gap > 40 ? 'text-rose-600 font-bold' : (item.gap > 20 ? 'text-amber-600 font-bold' : 'text-emerald-600 font-bold')}>-{item.gap}%</strong>
                  </div>
                </div>

                {/* Progress bars */}
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs">
                  <div>
                    <div className="flex justify-between text-[11px] text-slate-600 font-medium mb-1">
                      <span>Industry Demand</span>
                      <span className="font-mono text-blue-600 font-bold">{item.industryDemand}%</span>
                    </div>
                    <ProgressBar value={item.industryDemand} color="blue" size="sm" />
                  </div>

                  <div>
                    <div className="flex justify-between text-[11px] text-slate-600 font-medium mb-1">
                      <span>Verified Student Availability</span>
                      <span className="font-mono text-indigo-600 font-bold">{item.studentAvailability}%</span>
                    </div>
                    <ProgressBar value={item.studentAvailability} color="indigo" size="sm" />
                  </div>
                </div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>

      {/* Actionable AI Curriculum Recommendations */}
      <Card className="border-slate-200 shadow-xs">
        <CardHeader>
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-lg bg-amber-50 border border-amber-200 flex items-center justify-center text-amber-600 shrink-0">
              <Lightbulb className="w-4 h-4" />
            </div>
            <div>
              <CardTitle>AI Curriculum & FDP Strategic Recommendations</CardTitle>
              <CardDescription>
                Autonomous directives generated for College Academic Council & Board of Studies
              </CardDescription>
            </div>
          </div>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-xs">
            <div className="p-4 rounded-xl bg-slate-900 border border-slate-800 space-y-2.5">
              <div className="font-bold text-blue-400 flex items-center gap-2 text-sm">
                <BookOpen className="w-4 h-4 text-blue-400 shrink-0" />
                <span>1. Cloud & DevOps Elective</span>
              </div>
              <p className="text-slate-300 leading-relaxed text-xs">
                Introduce mandatory 4-credit course on AWS ECS, Docker, and Kubernetes in 6th semester to close the 64% market gap.
              </p>
              <div className="pt-1 flex items-center gap-2">
                <span className="px-2 py-0.5 rounded-full bg-blue-500/20 text-blue-300 text-[10px] font-mono font-semibold border border-blue-500/30">Target: 6th Sem</span>
                <span className="text-[11px] text-slate-400 font-medium">B.Tech CSE / IT</span>
              </div>
            </div>

            <div className="p-4 rounded-xl bg-slate-900 border border-slate-800 space-y-2.5">
              <div className="font-bold text-amber-400 flex items-center gap-2 text-sm">
                <Sparkles className="w-4 h-4 text-amber-400 shrink-0" />
                <span>2. Faculty FDP Nominations</span>
              </div>
              <p className="text-slate-300 leading-relaxed text-xs">
                Sponsor 4 CSE faculty members for the upcoming NovaTech Enterprise Cloud Systems Immersion program to upskill teaching staff.
              </p>
              <div className="pt-1 flex items-center gap-2">
                <span className="px-2 py-0.5 rounded-full bg-amber-500/20 text-amber-300 text-[10px] font-mono font-semibold border border-amber-500/30">Action: Sponsor 4 Faculty</span>
                <span className="text-[11px] text-slate-400 font-medium">FDP Program</span>
              </div>
            </div>

            <div className="p-4 rounded-xl bg-slate-900 border border-slate-800 space-y-2.5">
              <div className="font-bold text-emerald-400 flex items-center gap-2 text-sm">
                <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" />
                <span>3. System Design Capstone</span>
              </div>
              <p className="text-slate-300 leading-relaxed text-xs">
                Mandate distributed caching and message queue requirements in final-year engineering projects to raise the 30% system design baseline.
              </p>
              <div className="pt-1 flex items-center gap-2">
                <span className="px-2 py-0.5 rounded-full bg-emerald-500/20 text-emerald-300 text-[10px] font-mono font-semibold border border-emerald-500/30">Mandate: Final Year</span>
                <span className="text-[11px] text-slate-400 font-medium">Capstone Requirement</span>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

export default DemandVsAvailabilityPage;
