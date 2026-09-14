import React from 'react';
import { Link } from 'react-router-dom';
import { Building2, Users, Award, TrendingUp, CheckCircle2, ArrowRight, ShieldCheck, PieChart, BarChart2, CheckSquare } from 'lucide-react';
import { ResponsiveContainer, BarChart, Bar, XAxis, YAxis, Tooltip, Legend } from 'recharts';
import { PageHeader } from '../../components/common/PageHeader';
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from '../../components/common/Card';
import { Button } from '../../components/common/Button';
import { Badge, QuizStatusBadge } from '../../components/common/Badge';
import { Table, TableHeader, TableBody, TableRow, TableHead, TableCell } from '../../components/common/Table';
import { StatCard } from '../../components/dashboard/StatCard';

export const InstitutionDashboard = () => {
  const departmentStats = [
    { dept: 'CSE', total: 620, assessed: 540, ready: 410, rate: '76%', status: 'FULFILLED' },
    { dept: 'IT', total: 480, assessed: 420, ready: 310, rate: '74%', status: 'ACTIVE' },
    { dept: 'ECE', total: 540, assessed: 410, ready: 240, rate: '58%', status: 'LAUNCHED' },
    { dept: 'AIML', total: 380, assessed: 320, ready: 210, rate: '66%', status: 'ACTIVE' },
  ];

  const chartData = [
    { name: 'CSE', Enrolled: 620, Assessed: 540, PlacementReady: 410 },
    { name: 'IT', Enrolled: 480, Assessed: 420, PlacementReady: 310 },
    { name: 'ECE', Enrolled: 540, Assessed: 410, PlacementReady: 240 },
    { name: 'AIML', Enrolled: 380, Assessed: 320, PlacementReady: 210 },
  ];

  return (
    <div className="space-y-6 max-w-7xl mx-auto animate-fade-in">
      {/* Header Bar */}
      <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-4 pb-2">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <span className="text-[11px] font-semibold uppercase tracking-wider text-slate-500">Institution Executive BI</span>
            <Badge variant="neutral" size="xs">NAAC A++ Accredited</Badge>
          </div>
          <h1 className="text-2xl sm:text-3xl font-bold tracking-tight text-slate-900">
            ABES Engineering College
          </h1>
          <p className="text-xs sm:text-sm text-slate-500 mt-1">
            Institutional BI, accreditation metrics, and multi-departmental placement readiness analytics
          </p>
        </div>

        <div className="flex items-center gap-3 shrink-0">
          <Link to="/institution/demand-vs-availability">
            <Button variant="primary" size="sm" icon={TrendingUp}>
              Demand Matrix
            </Button>
          </Link>
        </div>
      </div>

      {/* Top 4 KPI Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 sm:gap-5">
        <StatCard
          icon={Users}
          value="2,450"
          title="Engineering Cohort"
          subtitle="Across 4 Departments"
        />
        <StatCard
          icon={ShieldCheck}
          value="1,980 (80.8%)"
          title="Verified Students"
          subtitle="Assessment Participated"
        />
        <StatCard
          icon={Award}
          value="1,240 Ready"
          title="Placement Benchmark"
          subtitle="Tier 4 Verified (70%+ Score)"
        />
        <StatCard
          icon={Building2}
          value="48 Active"
          title="Corporate Partners"
          subtitle="Campus Placement Tie-ups"
        />
      </div>

      {/* Department Chart Card */}
      <div className="rounded-xl bg-white border border-slate-200 shadow-xs p-5 sm:p-6 space-y-4">
        <div className="flex items-center justify-between pb-3 border-b border-slate-100">
          <div>
            <h2 className="text-base font-bold text-slate-900">Departmental Assessment & Placement Readiness Funnel</h2>
            <p className="text-xs text-slate-500 mt-0.5">Comparative metrics across engineering disciplines</p>
          </div>
        </div>
        <div className="h-72 w-full pt-2">
          <ResponsiveContainer width="100%" height="100%">
            <BarChart data={chartData}>
              <XAxis dataKey="name" stroke="#64748B" fontSize={12} />
              <YAxis stroke="#64748B" fontSize={12} />
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
              <Legend wrapperStyle={{ fontSize: '12px', paddingTop: '12px' }} />
              <Bar dataKey="Enrolled" fill="#CBD5E1" radius={[4, 4, 0, 0]} isAnimationActive={false} />
              <Bar dataKey="Assessed" fill="#60A5FA" radius={[4, 4, 0, 0]} isAnimationActive={false} />
              <Bar dataKey="PlacementReady" fill="#2563EB" radius={[4, 4, 0, 0]} isAnimationActive={false} />
            </BarChart>
          </ResponsiveContainer>
        </div>
      </div>

      {/* Department Breakdown Table Card */}
      <div className="rounded-xl bg-white border border-slate-200 shadow-xs p-5 sm:p-6 space-y-4">
        <div className="flex items-center justify-between pb-3 border-b border-slate-100">
          <div>
            <h2 className="text-base font-bold text-slate-900">Departmental Cohort Breakdown</h2>
            <p className="text-xs text-slate-500 mt-0.5">Audited evaluation status per academic branch</p>
          </div>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="border-b border-slate-100 text-[11px] font-semibold uppercase tracking-wider text-slate-500">
                <th className="py-3 px-4">Department</th>
                <th className="py-3 px-4">Total Students</th>
                <th className="py-3 px-4">Assessed</th>
                <th className="py-3 px-4">Placement Ready</th>
                <th className="py-3 px-4">Status</th>
                <th className="py-3 px-4 text-right">Readiness Ratio</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 text-xs text-slate-700">
              {departmentStats.map((d, i) => (
                <tr key={i} className="hover:bg-slate-50/70 transition-colors">
                  <td className="py-4 px-4 font-bold text-slate-900">{d.dept}</td>
                  <td className="py-4 px-4 font-mono text-slate-600">{d.total}</td>
                  <td className="py-4 px-4 font-mono font-semibold text-blue-600">{d.assessed}</td>
                  <td className="py-4 px-4 font-mono font-semibold text-slate-900">{d.ready}</td>
                  <td className="py-4 px-4">
                    <QuizStatusBadge status={d.status} />
                  </td>
                  <td className="py-4 px-4 text-right font-mono font-bold text-blue-600">
                    {d.rate}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};

export default InstitutionDashboard;
