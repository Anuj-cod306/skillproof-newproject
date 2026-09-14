import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import {
  ShieldCheck, Award, ArrowRight, GitBranch, BotMessageSquare,
  Sparkles, CheckCircle2, Building2, GraduationCap, Briefcase,
  Users, FileCheck, Check, Search, ChevronRight, Terminal, Cpu, Database, Network
} from 'lucide-react';
import { VerifiedBadge, Badge } from '../../components/common/Badge';
import { Card, CardContent } from '../../components/common/Card';
import { Button } from '../../components/common/Button';
import { ProgressBar } from '../../components/common/ProgressBar';

export const HomePage = () => {
  const [activeTier, setActiveTier] = useState(4);

  const verificationModules = [
    {
      title: 'Core CS & Algorithms',
      category: 'Data Structures & Concurrency',
      desc: 'Runtime complexity verification, memory modeling, tree traversal, and thread safety validation.',
      icon: Cpu,
      level: 'Advanced'
    },
    {
      title: 'Full-Stack Engineering',
      category: 'REST APIs & React Architecture',
      desc: 'Production API design, relational PostgreSQL schema modeling, JWT auth, and responsive UI components.',
      icon: Terminal,
      level: 'Industry Standard'
    },
    {
      title: 'Cloud & Systems',
      category: 'Microservices & Infrastructure',
      desc: 'Containerized deployment pipelines, infrastructure observability, and distributed caching.',
      icon: Network,
      level: 'Production Ready'
    },
    {
      title: 'AI & Data Engineering',
      category: 'Machine Learning & ETL',
      desc: 'Pipeline orchestration, vector embeddings, model inference benchmarking, and database integrity.',
      icon: Database,
      level: 'Specialized'
    }
  ];

  const verificationSteps = [
    {
      step: 1,
      tag: 'Step 1',
      title: 'Resume Evidence Parsing',
      desc: 'Candidate declares competencies such as Java, Spring Boot, and PostgreSQL in their resume.',
      icon: FileCheck,
      statusLabel: 'Self Declaration',
      checklist: [
        'Automated syntactic token extraction',
        'Declaration normalization against taxonomy',
        'Initial baseline claim register'
      ]
    },
    {
      step: 2,
      tag: 'Step 2',
      title: 'Repository Code Analysis',
      desc: 'Audits real commit history, AST syntactic depth, production dependencies, and test coverage.',
      icon: GitBranch,
      statusLabel: 'Code Evidence',
      checklist: [
        'Commit timeline and author verification',
        'Abstract Syntax Tree (AST) framework scan',
        'Architectural structural scoring'
      ]
    },
    {
      step: 3,
      tag: 'Step 3',
      title: 'Proctored Technical Assessment',
      desc: 'Rigorous adaptive problem-solving evaluated with real-time camera and tab-switch proctoring.',
      icon: Award,
      statusLabel: 'Exam Verified',
      checklist: [
        'Continuous video & screen recording enforcement',
        'Automated window blur and tab departure detection',
        'Real-time runtime algorithmic evaluation'
      ]
    },
    {
      step: 4,
      tag: 'Step 4',
      title: 'Adaptive AI Technical Defense',
      desc: 'Interactive AI voice and code defense cross-examining architectural decisions, ACID trade-offs, and scalability.',
      icon: BotMessageSquare,
      statusLabel: 'Verified Gold',
      checklist: [
        'Dynamic conversational architecture defense',
        'Real-time edge-case probing on submitted code',
        'Verified multi-modal scoring passport issuance'
      ]
    }
  ];

  return (
    <div className="space-y-16 lg:space-y-24 py-4 sm:py-8 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 animate-fade-in">
      
      {/* 1. FLOATING HERO CANVAS (REVCORE STYLE) */}
      <section className="rounded-[28px] sm:rounded-[36px] bg-white border border-[#DCE3EC] shadow-[0_4px_32px_rgba(15,23,42,0.05)] p-6 sm:p-10 lg:p-12">
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-10 items-center">
          
          {/* Left Hero Column */}
          <div className="lg:col-span-7 space-y-6">
            <div className="inline-flex items-center gap-2 px-3.5 py-1 rounded-full bg-slate-100 border border-slate-200/90 text-slate-700 text-xs font-medium">
              <span className="w-2 h-2 rounded-full bg-slate-900" />
              <span>Verified Skill Ecosystem</span>
            </div>

            <h1 className="text-3xl sm:text-5xl lg:text-6xl font-serif text-slate-950 font-normal tracking-tight leading-[1.12]">
              Precision verified for high-performance engineering.
            </h1>

            <p className="text-sm sm:text-base text-slate-600 max-w-xl leading-relaxed">
              Moving beyond unverified resume claims. Our 4-tier verification pipeline substantiates technical competency through code analysis, proctored benchmarks, and interactive AI defense.
            </p>

            <div className="flex flex-wrap items-center gap-3 pt-2">
              <Link to="/student/dashboard">
                <Button variant="primary" size="lg" className="shadow-sm">
                  <span>Start Skill Verification</span>
                  <ArrowRight className="w-4 h-4 ml-1" />
                </Button>
              </Link>

              <Link to="/how-it-works">
                <Button variant="secondary" size="lg">
                  Explore Verification Pipeline
                </Button>
              </Link>
            </div>

            {/* Real Neutral Metrics Row */}
            <div className="pt-8 border-t border-slate-100 grid grid-cols-2 sm:grid-cols-4 gap-6">
              <div>
                <div className="text-2xl font-serif font-medium text-slate-950 tracking-tight">4 Tiers</div>
                <div className="text-[11px] font-semibold uppercase tracking-wider text-slate-500 mt-1">Audit Pipeline</div>
              </div>
              <div>
                <div className="text-2xl font-serif font-medium text-slate-950 tracking-tight">Multi-Modal</div>
                <div className="text-[11px] font-semibold uppercase tracking-wider text-slate-500 mt-1">Evidence Scoring</div>
              </div>
              <div>
                <div className="text-2xl font-serif font-medium text-slate-950 tracking-tight">Proctored</div>
                <div className="text-[11px] font-semibold uppercase tracking-wider text-slate-500 mt-1">Anti-Cheat Engine</div>
              </div>
              <div>
                <div className="text-2xl font-serif font-medium text-slate-950 tracking-tight">4 Pillars</div>
                <div className="text-[11px] font-semibold uppercase tracking-wider text-slate-500 mt-1">Trust Ecosystem</div>
              </div>
            </div>
          </div>

          {/* Right Hero Column: Framed Verification Preview */}
          <div className="lg:col-span-5">
            <div className="rounded-2xl sm:rounded-3xl border border-[#DCE3EC] bg-[#E8EDF3] p-5 sm:p-6 shadow-xs relative overflow-hidden flex flex-col justify-between">
              
              {/* Header preview */}
              <div className="flex items-center justify-between pb-4 border-b border-[#D8DFE7]">
                <div className="flex items-center gap-2.5">
                  <div className="w-8 h-8 rounded-full bg-slate-950 flex items-center justify-center text-white">
                    <ShieldCheck className="w-4 h-4" />
                  </div>
                  <div>
                    <h3 className="text-xs font-semibold text-slate-900">Skill Passport Preview</h3>
                    <p className="text-[10px] text-slate-500 font-mono">Standardized Audit Matrix</p>
                  </div>
                </div>
                <span className="px-2.5 py-0.5 text-[10px] font-medium bg-white rounded-full border border-slate-200 text-slate-800 shadow-2xs">
                  Active
                </span>
              </div>

              {/* Mock candidate card details */}
              <div className="my-5 space-y-4">
                <div className="bg-white rounded-2xl p-4 border border-[#DCE3EC] shadow-2xs space-y-3">
                  <div className="flex items-center justify-between text-xs">
                    <span className="text-slate-500 font-medium">Domain Focus</span>
                    <span className="font-semibold text-slate-900">Full Stack & Systems</span>
                  </div>
                  <div className="space-y-1.5">
                    <div className="flex justify-between text-xs">
                      <span className="text-slate-600 font-medium">Pipeline Verification</span>
                      <span className="font-semibold text-slate-950">Tier 4 Verified</span>
                    </div>
                    <div className="w-full bg-slate-100 rounded-full h-2 overflow-hidden border border-slate-200">
                      <div className="bg-slate-950 h-full rounded-full" style={{ width: '85%' }} />
                    </div>
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-2.5 text-xs">
                  <div className="bg-white/80 rounded-xl p-3 border border-[#DCE3EC]">
                    <div className="text-[10px] text-slate-500 uppercase font-medium">Code Audit</div>
                    <div className="font-semibold text-slate-900 mt-0.5 flex items-center gap-1">
                      <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600" />
                      <span>AST Validated</span>
                    </div>
                  </div>
                  <div className="bg-white/80 rounded-xl p-3 border border-[#DCE3EC]">
                    <div className="text-[10px] text-slate-500 uppercase font-medium">Proctoring</div>
                    <div className="font-semibold text-slate-900 mt-0.5 flex items-center gap-1">
                      <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600" />
                      <span>Strict Lock</span>
                    </div>
                  </div>
                </div>
              </div>

              {/* Floating Frosted Pill Badge */}
              <div className="mt-2 pt-3 border-t border-[#D8DFE7] flex justify-center">
                <div className="px-4 py-1.5 rounded-full bg-white/90 backdrop-blur-md border border-white/90 shadow-2xs text-[11px] font-medium text-slate-800 flex items-center gap-2">
                  <span className="w-2 h-2 rounded-full bg-emerald-500" />
                  <span>Standardized Engineering Evaluation</span>
                </div>
              </div>

            </div>
          </div>

        </div>
      </section>

      {/* 2. VERIFICATION MODULES (REVCORE CATEGORY STYLE) */}
      <section className="space-y-6">
        <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-4">
          <div>
            <span className="inline-block text-xs font-semibold uppercase tracking-wider text-slate-500 mb-1">
              Verification Modules
            </span>
            <h2 className="text-2xl sm:text-3xl font-serif text-slate-950 tracking-tight">
              Standardized evaluation streams
            </h2>
          </div>
          <Link to="/features" className="text-xs font-semibold text-slate-900 hover:underline flex items-center gap-1">
            <span>View all modules</span>
            <ArrowRight className="w-3.5 h-3.5" />
          </Link>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5">
          {verificationModules.map((mod, idx) => {
            const Icon = mod.icon;
            return (
              <div
                key={idx}
                className="rounded-2xl sm:rounded-3xl bg-[#E8EDF3] border border-[#D8DFE7] p-6 flex flex-col justify-between transition-all duration-200 hover:border-slate-300 hover:shadow-xs group"
              >
                <div>
                  <div className="w-10 h-10 rounded-full bg-white border border-[#DCE3EC] flex items-center justify-center text-slate-900 mb-4 shadow-2xs group-hover:bg-slate-950 group-hover:text-white transition-colors">
                    <Icon className="w-5 h-5" />
                  </div>
                  <h3 className="text-base font-semibold text-slate-950 tracking-tight">{mod.title}</h3>
                  <div className="text-[11px] font-medium text-slate-500 uppercase tracking-wider mt-0.5">{mod.category}</div>
                  <p className="text-xs text-slate-600 mt-2.5 leading-relaxed">
                    {mod.desc}
                  </p>
                </div>
                <div className="mt-6 pt-4 border-t border-[#D8DFE7] flex items-center justify-between">
                  <span className="text-[11px] font-medium px-2 py-0.5 rounded-full bg-white/80 border border-slate-200 text-slate-700">
                    {mod.level}
                  </span>
                  <ChevronRight className="w-4 h-4 text-slate-400 group-hover:text-slate-900 group-hover:translate-x-1 transition-all" />
                </div>
              </div>
            );
          })}
        </div>
      </section>

      {/* 3. THE 4-TIER PIPELINE ("THE ART OF PRECISION") */}
      <section className="rounded-[28px] sm:rounded-[36px] bg-white border border-[#DCE3EC] p-6 sm:p-10 lg:p-12 shadow-sm space-y-10">
        <div className="max-w-2xl">
          <span className="inline-block text-xs font-semibold uppercase tracking-wider text-slate-500 mb-1">
            The Art of Precision
          </span>
          <h2 className="text-2xl sm:text-3xl font-serif text-slate-950 tracking-tight">
            How verification produces objective proof
          </h2>
          <p className="text-xs sm:text-sm text-slate-600 mt-2 leading-relaxed">
            Every candidate evaluation progresses through multiple objective validation filters before the credential is materialized.
          </p>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-center">
          
          {/* Left step triggers */}
          <div className="lg:col-span-6 space-y-3">
            {verificationSteps.map((s) => {
              const Icon = s.icon;
              const isActive = activeTier === s.step;
              return (
                <div
                  key={s.step}
                  onClick={() => setActiveTier(s.step)}
                  className={`p-4 sm:p-5 rounded-2xl cursor-pointer transition-all duration-200 border ${
                    isActive
                      ? 'bg-[#E8EDF3] border-slate-400 shadow-xs'
                      : 'bg-white border-slate-200 hover:border-slate-300 hover:bg-slate-50/60'
                  }`}
                >
                  <div className="flex items-start gap-4">
                    <div className={`p-2.5 rounded-full shrink-0 transition-colors ${
                      isActive ? 'bg-slate-950 text-white' : 'bg-slate-100 text-slate-600'
                    }`}>
                      <Icon className="w-4 h-4" />
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center justify-between gap-2">
                        <span className="text-[10px] font-bold uppercase tracking-wider text-slate-500">{s.tag}</span>
                        <span className={`text-[10px] font-semibold px-2 py-0.5 rounded-full border ${
                          isActive ? 'bg-white text-slate-900 border-slate-300' : 'bg-slate-100 text-slate-600 border-slate-200'
                        }`}>
                          {s.statusLabel}
                        </span>
                      </div>
                      <h4 className="text-sm font-semibold text-slate-950 mt-1">{s.title}</h4>
                      <p className="text-xs text-slate-600 mt-1 leading-relaxed">{s.desc}</p>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>

          {/* Right step details & checklist */}
          <div className="lg:col-span-6">
            <div className="rounded-2xl sm:rounded-3xl bg-[#E8EDF3] border border-[#D8DFE7] p-6 sm:p-8 space-y-6">
              <div>
                <span className="text-[10px] font-bold uppercase tracking-wider text-slate-500">
                  {verificationSteps[activeTier - 1].tag} Details
                </span>
                <h3 className="text-xl font-serif text-slate-950 font-medium mt-1">
                  {verificationSteps[activeTier - 1].title}
                </h3>
                <p className="text-xs text-slate-600 mt-2 leading-relaxed">
                  {verificationSteps[activeTier - 1].desc}
                </p>
              </div>

              {/* Checklist */}
              <div className="space-y-3 pt-2">
                <div className="text-xs font-semibold text-slate-900 uppercase tracking-wider">Evaluation Protocol</div>
                {verificationSteps[activeTier - 1].checklist.map((item, cIdx) => (
                  <div key={cIdx} className="flex items-center gap-3 text-xs text-slate-700 bg-white/90 border border-[#DCE3EC] rounded-xl px-4 py-3 shadow-2xs">
                    <div className="w-4 h-4 rounded-full bg-slate-100 border border-slate-300 flex items-center justify-center text-slate-900 shrink-0">
                      <Check className="w-3 h-3" />
                    </div>
                    <span>{item}</span>
                  </div>
                ))}
              </div>

              {/* Action pill */}
              <div className="pt-2 flex justify-between items-center">
                <span className="text-xs text-slate-500">Tier {activeTier} of 4</span>
                <Link to="/student/dashboard">
                  <Button variant="primary" size="sm">
                    <span>Try This Step</span>
                    <ArrowRight className="w-3.5 h-3.5 ml-1" />
                  </Button>
                </Link>
              </div>
            </div>
          </div>

        </div>
      </section>

      {/* 4. UNIFIED 4-PILLAR TRUST NETWORK */}
      <section className="space-y-6">
        <div className="text-center max-w-2xl mx-auto">
          <span className="inline-block text-xs font-semibold uppercase tracking-wider text-slate-500 mb-1">
            Ecosystem Architecture
          </span>
          <h2 className="text-2xl sm:text-3xl font-serif text-slate-950 tracking-tight">
            Connecting four critical stakeholders
          </h2>
          <p className="text-xs sm:text-sm text-slate-600 mt-2 leading-relaxed">
            Eliminating information asymmetry between candidates, recruiters, academic faculty, and university leadership.
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-5">
          {/* Student */}
          <div className="rounded-2xl sm:rounded-3xl bg-white border border-[#DCE3EC] p-6 shadow-xs flex flex-col justify-between hover:border-slate-300 transition-all">
            <div>
              <div className="w-10 h-10 rounded-full bg-[#E8EDF3] border border-[#D8DFE7] flex items-center justify-center text-slate-900 mb-4">
                <Users className="w-5 h-5" />
              </div>
              <h3 className="font-semibold text-base text-slate-950 mb-1.5">Students</h3>
              <p className="text-xs text-slate-600 leading-relaxed">
                Transform unverified resumes into authenticated skill credentials. Diagnose skill gaps and unlock targeted opportunities.
              </p>
            </div>
            <div className="mt-6 pt-4 border-t border-slate-100">
              <Link to="/student/dashboard" className="text-xs font-semibold text-slate-950 hover:underline flex items-center gap-1">
                <span>Student Portal</span>
                <ArrowRight className="w-3.5 h-3.5" />
              </Link>
            </div>
          </div>

          {/* Industry */}
          <div className="rounded-2xl sm:rounded-3xl bg-white border border-[#DCE3EC] p-6 shadow-xs flex flex-col justify-between hover:border-slate-300 transition-all">
            <div>
              <div className="w-10 h-10 rounded-full bg-[#E8EDF3] border border-[#D8DFE7] flex items-center justify-center text-slate-900 mb-4">
                <Briefcase className="w-5 h-5" />
              </div>
              <h3 className="font-semibold text-base text-slate-950 mb-1.5">Industry Recruiters</h3>
              <p className="text-xs text-slate-600 leading-relaxed">
                Filter applicants by authenticated code proof, review explainable compatibility scores, and hire with verified confidence.
              </p>
            </div>
            <div className="mt-6 pt-4 border-t border-slate-100">
              <Link to="/industry/dashboard" className="text-xs font-semibold text-slate-950 hover:underline flex items-center gap-1">
                <span>Recruiter Portal</span>
                <ArrowRight className="w-3.5 h-3.5" />
              </Link>
            </div>
          </div>

          {/* Academia */}
          <div className="rounded-2xl sm:rounded-3xl bg-white border border-[#DCE3EC] p-6 shadow-xs flex flex-col justify-between hover:border-slate-300 transition-all">
            <div>
              <div className="w-10 h-10 rounded-full bg-[#E8EDF3] border border-[#D8DFE7] flex items-center justify-center text-slate-900 mb-4">
                <GraduationCap className="w-5 h-5" />
              </div>
              <h3 className="font-semibold text-base text-slate-950 mb-1.5">Academia & Faculty</h3>
              <p className="text-xs text-slate-600 leading-relaxed">
                Access faculty development programs, corporate R&D research opportunities, and mentor students with real-world industry benchmarks.
              </p>
            </div>
            <div className="mt-6 pt-4 border-t border-slate-100">
              <Link to="/academician/dashboard" className="text-xs font-semibold text-slate-950 hover:underline flex items-center gap-1">
                <span>Faculty Hub</span>
                <ArrowRight className="w-3.5 h-3.5" />
              </Link>
            </div>
          </div>

          {/* Institution */}
          <div className="rounded-2xl sm:rounded-3xl bg-white border border-[#DCE3EC] p-6 shadow-xs flex flex-col justify-between hover:border-slate-300 transition-all">
            <div>
              <div className="w-10 h-10 rounded-full bg-[#E8EDF3] border border-[#D8DFE7] flex items-center justify-center text-slate-900 mb-4">
                <Building2 className="w-5 h-5" />
              </div>
              <h3 className="font-semibold text-base text-slate-950 mb-1.5">Institutions & BI</h3>
              <p className="text-xs text-slate-600 leading-relaxed">
                Compare market skill demand against student availability to continuously calibrate degree curricula with real employer requirements.
              </p>
            </div>
            <div className="mt-6 pt-4 border-t border-slate-100">
              <Link to="/institution/dashboard" className="text-xs font-semibold text-slate-950 hover:underline flex items-center gap-1">
                <span>Executive BI</span>
                <ArrowRight className="w-3.5 h-3.5" />
              </Link>
            </div>
          </div>
        </div>
      </section>

      {/* 5. CALL TO ACTION BANNER (REVCORE BOTTOM BANNER STYLE) */}
      <section className="rounded-[28px] sm:rounded-[36px] bg-[#E5EBF2] border border-[#DCE3EC] p-8 sm:p-12 text-center space-y-6">
        <div className="max-w-xl mx-auto space-y-3">
          <span className="text-[11px] font-bold uppercase tracking-wider text-slate-500">Get Started</span>
          <h2 className="text-2xl sm:text-4xl font-serif text-slate-950 tracking-tight">
            Ready to substantiate your technical skills?
          </h2>
          <p className="text-xs sm:text-sm text-slate-600 leading-relaxed">
            Upload your resume, connect your repository, complete verified assessments, and generate your authenticated skill passport.
          </p>
        </div>

        <div className="flex flex-wrap items-center justify-center gap-3 pt-2">
          <Link to="/student/resume-upload">
            <Button variant="primary" size="md">
              <span>Upload Resume & Begin</span>
              <ArrowRight className="w-4 h-4 ml-1" />
            </Button>
          </Link>
          <Link to="/login">
            <Button variant="secondary" size="md">
              Sign In to Portal
            </Button>
          </Link>
        </div>
      </section>

    </div>
  );
};

export default HomePage;
