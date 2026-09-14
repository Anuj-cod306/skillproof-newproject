import React from 'react';
import { Link } from 'react-router-dom';
import { FileText, GitBranch, Award, BotMessageSquare, ShieldCheck, ArrowRight, CheckCircle2 } from 'lucide-react';
import { PageHeader } from '../../components/common/PageHeader';
import { Card, CardContent } from '../../components/common/Card';
import { Button } from '../../components/common/Button';
import { Badge } from '../../components/common/Badge';

export const HowItWorksPage = () => {
  const tiers = [
    {
      tier: 'Tier 1',
      title: 'AI Resume Ingestion & Parsing',
      subtitle: 'From Unstructured PDF to Standardized Knowledge Graph',
      icon: FileText,
      description: 'The candidate uploads their standard PDF/Docx resume. Using Spring AI LLM prompts and layout parsing, we extract stated technical claims, project descriptions, frameworks, and claimed tenure into a structured schema.',
      points: [
        'Extracts technical stack into standardized skill ontology (Java, Spring Boot, React, SQL)',
        'Classifies claimed experience levels and project roles',
        'Flags unverified self-assertions for validation'
      ]
    },
    {
      tier: 'Tier 2',
      title: 'GitHub & Project Evidence Analysis',
      subtitle: 'Code Speaks Louder Than Words',
      icon: GitBranch,
      description: 'We connect to candidate public repositories, inspecting commit graphs, AST language distributions, real usage of frameworks, dependency manifests (pom.xml, package.json), and testing coverage.',
      points: [
        'Evaluates architectural complexity and commit frequency',
        'Validates if claimed libraries (e.g. Spring Security, Redux) exist in real repositories',
        'Calculates automated Project Evidence Score (0-100)'
      ]
    },
    {
      tier: 'Tier 3',
      title: 'Standardized Diagnostic Assessment',
      subtitle: 'Objective Knowledge & Edge Case Verification',
      icon: Award,
      description: 'Candidates take timed, proctored diagnostic assessments specifically calibrated to their claimed stack (e.g., Concurrency, Spring Transactions, SQL indexing strategies).',
      points: [
        'Dynamic question banks preventing memorization',
        'Algorithmic scoring of core programming principles',
        'Detects conceptual gaps before interview stages'
      ]
    },
    {
      tier: 'Tier 4',
      title: 'Adaptive AI Technical Interview',
      subtitle: 'Contextual Socratic Defense of Projects',
      icon: BotMessageSquare,
      description: 'Our conversational AI agent reads the student’s profile, GitHub code, and test results, initiating an adaptive technical defense. If a candidate claims a banking ledger, the AI probes race condition handling, ACID guarantees, and token expiration.',
      points: [
        'Adaptive difficulty based on previous responses',
        'Rubric scoring: Technical Knowledge, Project Understanding, Problem Solving, and Communication',
        'Generates explainable audio/text transcripts for recruiters'
      ]
    }
  ];

  return (
    <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 py-10 space-y-12 animate-fade-in">
      <div className="text-center max-w-2xl mx-auto space-y-3">
        <Badge variant="primary" size="sm">The SKILLPROOF Methodology</Badge>
        <h1 className="text-3xl sm:text-4xl font-bold tracking-tight text-white">
          How Verification Works
        </h1>
        <p className="text-slate-400 text-sm leading-relaxed">
          Traditional recruitment relies on unverifiable PDFs. SKILLPROOF enforces a 
          <strong> 4-Tier Progressive Proof Protocol</strong> where every percentage on your Skill Passport 
          is mathematically backed by code, tests, and contextual defense.
        </p>
      </div>

      {/* The 4 Tiers */}
      <div className="space-y-6">
        {tiers.map((t, idx) => {
          const Icon = t.icon;
          return (
            <Card key={t.tier} className="hover:border-slate-700/80 transition-all">
              <CardContent className="p-6 sm:p-7">
                <div className="flex flex-col lg:flex-row items-start gap-5">
                  <div className="w-12 h-12 rounded-lg bg-indigo-600/20 border border-indigo-500/30 flex items-center justify-center shrink-0">
                    <Icon className="w-6 h-6 text-indigo-400" />
                  </div>

                  <div className="flex-1 space-y-3">
                    <div className="flex flex-wrap items-center gap-2.5">
                      <Badge variant="primary" size="sm" className="font-mono">
                        {t.tier}
                      </Badge>
                      <h2 className="text-base font-bold text-slate-100">{t.title}</h2>
                    </div>
                    <h3 className="text-xs text-indigo-300 font-medium">{t.subtitle}</h3>
                    <p className="text-xs text-slate-400 leading-relaxed">
                      {t.description}
                    </p>

                    <div className="pt-2 grid grid-cols-1 sm:grid-cols-3 gap-3">
                      {t.points.map((pt, i) => (
                        <div key={i} className="p-3 rounded-lg bg-slate-950 border border-slate-800/90 text-xs text-slate-300 flex items-start gap-2">
                          <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0 mt-0.5" />
                          <span>{pt}</span>
                        </div>
                      ))}
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>
          );
        })}
      </div>

      {/* Output card */}
      <Card className="border-indigo-500/30 text-center p-8">
        <CardContent className="space-y-4">
          <div className="w-12 h-12 rounded-full bg-indigo-600/20 border border-indigo-500/30 mx-auto flex items-center justify-center">
            <ShieldCheck className="w-6 h-6 text-indigo-400" />
          </div>
          <h2 className="text-xl font-bold text-slate-100">The Verified Output: Digital Skill Passport</h2>
          <p className="text-xs sm:text-sm text-slate-400 max-w-lg mx-auto leading-relaxed">
            Upon multi-tier audit completion, candidates receive a cryptographically sealed, QR-enabled Digital Skill Passport that recruiters can inspect with zero ambiguity.
          </p>
          <div className="pt-2 flex justify-center">
            <Link to="/student/dashboard">
              <Button variant="primary" icon={ArrowRight}>
                Try Verification Engine
              </Button>
            </Link>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

export default HowItWorksPage;
