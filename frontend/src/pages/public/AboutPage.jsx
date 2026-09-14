import React from 'react';
import { ShieldCheck, Target, Award, Users, BookOpen, Building2, Lightbulb } from 'lucide-react';
import { Badge } from '../../components/common/Badge';
import { Card, CardContent } from '../../components/common/Card';

export const AboutPage = () => {
  return (
    <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 py-10 space-y-12 animate-fade-in">
      <div className="text-center max-w-2xl mx-auto space-y-2">
        <Badge variant="primary" size="sm">Verified Skill Ecosystem</Badge>
        <h1 className="text-3xl sm:text-4xl font-bold tracking-tight text-slate-900">
          About SKILLPROOF
        </h1>
        <p className="text-slate-600 text-sm leading-relaxed">
          Bridging the gap between engineering college classrooms and top-tier industrial demands through objective, multi-modal verification and ecosystem collaboration.
        </p>
      </div>

      {/* The Core Problem & Solution */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6 items-stretch">
        <Card className="p-6 sm:p-7 flex flex-col justify-between">
          <CardContent className="p-0 space-y-4">
            <Badge variant="danger" size="sm">The Industry Problem</Badge>
            <h2 className="text-xl font-bold text-slate-900">
              Resume Inflation & Counterfeit Self-Claims
            </h2>
            <p className="text-xs sm:text-sm text-slate-600 leading-relaxed">
              Over 80% of resumes contain exaggerated skills. Recruiters spend weeks filtering thousands of resumes only to find candidates who memorized buzzwords cannot write a basic JPA query or handle thread concurrency.
            </p>
            <p className="text-xs sm:text-sm text-slate-500 leading-relaxed">
              Simultaneously, educational institutions lack empirical data on what skills top employers actually demand vs. what their students currently possess.
            </p>
          </CardContent>
        </Card>

        <Card className="border-slate-200 p-6 sm:p-7 flex flex-col justify-between">
          <CardContent className="p-0 space-y-4">
            <Badge variant="primary" size="sm">The Ecosystem Solution</Badge>
            <h3 className="font-bold text-slate-900 text-xl">4-Actor Mutual Trust Network</h3>
            <ul className="space-y-3 text-xs text-slate-700">
              <li className="flex items-start gap-2.5">
                <ShieldCheck className="w-4 h-4 text-blue-600 shrink-0 mt-0.5" />
                <span><strong className="text-slate-900 font-semibold">Students:</strong> 4-tier proof-backed Skill Passport + personalized AI Roadmap.</span>
              </li>
              <li className="flex items-start gap-2.5">
                <Users className="w-4 h-4 text-blue-600 shrink-0 mt-0.5" />
                <span><strong className="text-slate-900 font-semibold">Industry:</strong> Explainable matching, verified talent search, and live industry projects.</span>
              </li>
              <li className="flex items-start gap-2.5">
                <BookOpen className="w-4 h-4 text-amber-600 shrink-0 mt-0.5" />
                <span><strong className="text-slate-900 font-semibold">Academia:</strong> Faculty internships, FDP programs, and corporate research grants.</span>
              </li>
              <li className="flex items-start gap-2.5">
                <Building2 className="w-4 h-4 text-emerald-600 shrink-0 mt-0.5" />
                <span><strong className="text-slate-900 font-semibold">Institutions:</strong> Real-time Industry Demand vs Student Availability Analytics for curriculum reform.</span>
              </li>
            </ul>
          </CardContent>
        </Card>
      </div>
    </div>
  );
};

export default AboutPage;
