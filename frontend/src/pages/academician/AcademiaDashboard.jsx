import React from 'react';
import { Link } from 'react-router-dom';
import { GraduationCap, BookOpen, Briefcase, Award, Users, ArrowRight, ShieldCheck, Sparkles, Building2, CheckSquare } from 'lucide-react';
import { useAuth } from '../../context/AuthContext';
import { PageHeader } from '../../components/common/PageHeader';
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from '../../components/common/Card';
import { Button } from '../../components/common/Button';
import { Badge, QuizStatusBadge } from '../../components/common/Badge';
import { StatCard } from '../../components/dashboard/StatCard';

export const AcademiaDashboard = () => {
  const { currentUser } = useAuth();

  return (
    <div className="space-y-6 max-w-7xl mx-auto animate-fade-in">
      {/* Header Bar */}
      <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-4 pb-2">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <span className="text-[11px] font-semibold uppercase tracking-wider text-slate-500">Academician Portal</span>
            <Badge variant="neutral" size="xs">Academic Oversight Pillar</Badge>
          </div>
          <h1 className="text-2xl sm:text-3xl font-bold tracking-tight text-slate-900">
            Welcome, {currentUser?.name || 'Dr. S. K. Verma'}
          </h1>
          <p className="text-xs sm:text-sm text-slate-500 mt-1">
            Professor & Head of Department • Department of Computer Science & Engineering, ABES Engineering College
          </p>
        </div>

        <div className="flex items-center gap-3 shrink-0">
          <Link to="/academician/mentorship">
            <Button variant="secondary" size="sm" icon={Users}>
              Mentorship Hub
            </Button>
          </Link>
          <Link to="/academician/approvals">
            <Button variant="primary" size="sm" icon={ShieldCheck}>
              Review Approvals
            </Button>
          </Link>
        </div>
      </div>

      {/* Top 3 Stat Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 sm:gap-6">
        <StatCard
          icon={Users}
          value="18 Students"
          title="Mentorships"
          subtitle="4 Active Industry Capstones"
        />
        <StatCard
          icon={ShieldCheck}
          value="100% Verified"
          title="Placement Proofs"
          subtitle="Cryptographically Backed Passports"
        />
        <StatCard
          icon={Award}
          value="AICTE Nominated"
          title="Faculty Training"
          subtitle="Continuing Education Credits"
        />
      </div>

      {/* 5 Core Academic Pillars */}
      <div>
        <h2 className="text-base font-bold text-slate-900 tracking-tight mb-4">Academic Pillars & Programs</h2>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 sm:gap-5">
          <Link
            to="/academician/opportunities"
            className="p-5 rounded-xl bg-white border border-slate-200 shadow-xs hover:border-blue-200 hover:shadow-sm transition-all group flex flex-col justify-between"
          >
            <div>
              <div className="w-10 h-10 rounded-lg bg-blue-50 border border-blue-100 text-blue-600 flex items-center justify-center mb-3">
                <Briefcase className="w-5 h-5" />
              </div>
              <h3 className="font-bold text-sm text-slate-900 group-hover:text-blue-600 transition-colors">
                Faculty Internships
              </h3>
              <p className="text-xs text-slate-500 mt-1 leading-relaxed">
                4-8 week immersive technical stints inside enterprise engineering & R&D units.
              </p>
            </div>
            <div className="mt-4 pt-3 border-t border-slate-100 flex items-center justify-between text-xs font-semibold text-blue-600">
              <span>Explore Programs</span>
              <ArrowRight className="w-3.5 h-3.5 group-hover:translate-x-1 transition-transform" />
            </div>
          </Link>

          <Link
            to="/academician/opportunities"
            className="p-5 rounded-xl bg-white border border-slate-200 shadow-xs hover:border-blue-200 hover:shadow-sm transition-all group flex flex-col justify-between"
          >
            <div>
              <div className="w-10 h-10 rounded-lg bg-blue-50 border border-blue-100 text-blue-600 flex items-center justify-center mb-3">
                <BookOpen className="w-5 h-5" />
              </div>
              <h3 className="font-bold text-sm text-slate-900 group-hover:text-blue-600 transition-colors">
                FDP & Training Programs
              </h3>
              <p className="text-xs text-slate-500 mt-1 leading-relaxed">
                Faculty Development Programs sponsored by corporate enterprise partners.
              </p>
            </div>
            <div className="mt-4 pt-3 border-t border-slate-100 flex items-center justify-between text-xs font-semibold text-blue-600">
              <span>View Curriculum</span>
              <ArrowRight className="w-3.5 h-3.5 group-hover:translate-x-1 transition-transform" />
            </div>
          </Link>

          <Link
            to="/academician/opportunities"
            className="p-5 rounded-xl bg-white border border-slate-200 shadow-xs hover:border-blue-200 hover:shadow-sm transition-all group flex flex-col justify-between"
          >
            <div>
              <div className="w-10 h-10 rounded-lg bg-blue-50 border border-blue-100 text-blue-600 flex items-center justify-center mb-3">
                <Sparkles className="w-5 h-5" />
              </div>
              <h3 className="font-bold text-sm text-slate-900 group-hover:text-blue-600 transition-colors">
                Industrial Consultancy
              </h3>
              <p className="text-xs text-slate-500 mt-1 leading-relaxed">
                Joint corporate applied research, architecture consulting, and technology grants.
              </p>
            </div>
            <div className="mt-4 pt-3 border-t border-slate-100 flex items-center justify-between text-xs font-semibold text-blue-600">
              <span>Research Grants</span>
              <ArrowRight className="w-3.5 h-3.5 group-hover:translate-x-1 transition-transform" />
            </div>
          </Link>

          <Link
            to="/academician/mentorship"
            className="p-5 rounded-xl bg-white border border-slate-200 shadow-xs hover:border-blue-200 hover:shadow-sm transition-all group flex flex-col justify-between"
          >
            <div>
              <div className="w-10 h-10 rounded-lg bg-blue-50 border border-blue-100 text-blue-600 flex items-center justify-center mb-3">
                <Users className="w-5 h-5" />
              </div>
              <h3 className="font-bold text-sm text-slate-900 group-hover:text-blue-600 transition-colors">
                Student Mentorship
              </h3>
              <p className="text-xs text-slate-500 mt-1 leading-relaxed">
                Review student 4-tier Verified Skill Passports and guide capstone engineering projects.
              </p>
            </div>
            <div className="mt-4 pt-3 border-t border-slate-100 flex items-center justify-between text-xs font-semibold text-blue-600">
              <span>Guide Students</span>
              <ArrowRight className="w-3.5 h-3.5 group-hover:translate-x-1 transition-transform" />
            </div>
          </Link>

          <Link
            to="/academician/approvals"
            className="p-5 rounded-xl bg-white border border-slate-200 shadow-xs hover:border-blue-200 hover:shadow-sm transition-all group flex flex-col justify-between sm:col-span-2 lg:col-span-2"
          >
            <div>
              <div className="flex items-center justify-between mb-2">
                <div className="w-10 h-10 rounded-lg bg-blue-50 border border-blue-100 text-blue-600 flex items-center justify-center">
                  <ShieldCheck className="w-5 h-5" />
                </div>
                <QuizStatusBadge status="ACTIVE" />
              </div>
              <h3 className="font-bold text-sm text-slate-900 group-hover:text-blue-600 transition-colors">
                Opportunity Approvals & Endorsements
              </h3>
              <p className="text-xs text-slate-500 mt-1 leading-relaxed">
                Review student offer acceptances, verify alignment with academic degree criteria, and grant official institutional endorsements.
              </p>
            </div>
            <div className="mt-4 pt-3 border-t border-slate-100 flex items-center justify-between text-xs font-semibold text-blue-600">
              <span>Review Pending Offers</span>
              <ArrowRight className="w-3.5 h-3.5 group-hover:translate-x-1 transition-transform" />
            </div>
          </Link>
        </div>
      </div>

      {/* Upcoming FDP Programs */}
      <div className="rounded-xl bg-white border border-slate-200 shadow-xs p-5 sm:p-6 space-y-4">
        <div className="flex items-center justify-between pb-3 border-b border-slate-100">
          <div>
            <h2 className="text-base font-bold text-slate-900">Upcoming Faculty Training & FDP Programs</h2>
            <p className="text-xs text-slate-500 mt-0.5">Sponsored industry opportunities for university educators</p>
          </div>
          <Link to="/academician/opportunities" className="text-xs text-blue-600 font-semibold hover:underline flex items-center gap-1">
            <span>All Programs</span>
            <ArrowRight className="w-3 h-3" />
          </Link>
        </div>

        <div className="space-y-3">
          <div className="p-4 rounded-lg bg-slate-50/70 border border-slate-100 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
            <div className="space-y-1">
              <div className="flex items-center gap-2 flex-wrap">
                <span className="text-xs sm:text-sm font-bold text-slate-900">Advanced Cloud Native Architecture & Microservices FDP</span>
                <span className="text-[10px] font-semibold px-2 py-0.5 rounded-full bg-slate-100 text-slate-700">NovaTech</span>
              </div>
              <p className="text-xs text-slate-500">Duration: 2 Weeks (Hybrid) • Eligible for AICTE Continuing Ed credits</p>
            </div>
            <QuizStatusBadge status="VERIFIED" className="self-start sm:self-center" />
          </div>

          <div className="p-4 rounded-lg bg-slate-50/70 border border-slate-100 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
            <div className="space-y-1">
              <div className="flex items-center gap-2 flex-wrap">
                <span className="text-xs sm:text-sm font-bold text-slate-900">Summer Industrial Fellowship in Distributed Graph Engines</span>
                <span className="text-[10px] font-semibold px-2 py-0.5 rounded-full bg-slate-100 text-slate-700">CloudSphere Labs</span>
              </div>
              <p className="text-xs text-slate-500">Duration: 4 Weeks (On-site Bangalore R&D Center) • ₹75,000 Stipend</p>
            </div>
            <Link
              to="/academician/opportunities"
              className="inline-flex items-center justify-center px-3.5 py-1.5 rounded-lg text-xs font-semibold bg-white border border-slate-200 text-slate-700 hover:text-blue-600 hover:border-blue-300 hover:bg-blue-50/50 transition-colors shadow-2xs self-start sm:self-center"
            >
              Apply
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
};

export default AcademiaDashboard;
