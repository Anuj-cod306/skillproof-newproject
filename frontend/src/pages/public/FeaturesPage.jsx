import React from 'react';
import { ShieldCheck, BrainCircuit, GitBranch, BotMessageSquare, Sparkles, TrendingUp, Briefcase, Award, CheckCircle2 } from 'lucide-react';
import { Badge } from '../../components/common/Badge';
import { Card, CardContent } from '../../components/common/Card';

export const FeaturesPage = () => {
  const featureList = [
    {
      title: 'AI Resume Knowledge Ingestion',
      desc: 'Transforms unstructured PDFs into structured competency entities with confidence scoring using Spring AI LLMs.',
      icon: BrainCircuit,
      color: 'text-indigo-400'
    },
    {
      title: 'GitHub AST & Evidence Scanner',
      desc: 'Evaluates public GitHub repositories, verifying commit velocity, genuine framework dependencies, and code syntax.',
      icon: GitBranch,
      color: 'text-emerald-400'
    },
    {
      title: 'Standardized Diagnostic Assessments',
      desc: 'Interactive, proctored assessments covering concurrency, database indexing, and backend architectures.',
      icon: Award,
      color: 'text-blue-400'
    },
    {
      title: 'Adaptive AI Technical Interview',
      desc: 'Real-time conversational evaluation probing candidate project design decisions with structured rubrics.',
      icon: BotMessageSquare,
      color: 'text-amber-400'
    },
    {
      title: 'Cryptographic Skill Passport',
      desc: 'Tamper-proof digital badge with QR code and audit trail shareable across LinkedIn and recruiter portals.',
      icon: ShieldCheck,
      color: 'text-indigo-400'
    },
    {
      title: 'Explainable AI Job Matcher',
      desc: 'Displays to recruiters and candidates exactly WHY they match, highlighting verified skills vs missing prerequisites.',
      icon: Briefcase,
      color: 'text-cyan-400'
    },
    {
      title: 'Personalized AI Learning Roadmap',
      desc: 'Week-by-week targeted learning steps generated automatically to bridge verified skill deficits.',
      icon: Sparkles,
      color: 'text-purple-400'
    },
    {
      title: 'Demand vs Availability Analytics',
      desc: 'Institutional BI dashboard mapping employer market demand against campus student skill availability in real-time.',
      icon: TrendingUp,
      color: 'text-teal-400'
    }
  ];

  return (
    <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-10 space-y-12 animate-fade-in">
      <div className="text-center max-w-2xl mx-auto space-y-3">
        <Badge variant="primary" size="sm">Comprehensive Verification Suite</Badge>
        <h1 className="text-3xl sm:text-4xl font-bold tracking-tight text-white">
          Platform Architecture & Capabilities
        </h1>
        <p className="text-slate-400 text-sm leading-relaxed">
          Engineered to deliver enterprise-grade multi-tier skill verification with zero compromise on proof integrity.
        </p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        {featureList.map((f, i) => {
          const Icon = f.icon;
          return (
            <Card key={i} className="hover:border-slate-700/80 transition-all flex flex-col">
              <CardContent className="p-5 flex flex-col flex-1">
                <div className="w-10 h-10 rounded-lg bg-slate-900 border border-slate-800 flex items-center justify-center mb-3">
                  <Icon className={`w-5 h-5 ${f.color}`} />
                </div>
                <h3 className="font-semibold text-slate-100 text-sm mb-1.5">{f.title}</h3>
                <p className="text-xs text-slate-400 leading-relaxed flex-1">{f.desc}</p>
              </CardContent>
            </Card>
          );
        })}
      </div>
    </div>
  );
};

export default FeaturesPage;
