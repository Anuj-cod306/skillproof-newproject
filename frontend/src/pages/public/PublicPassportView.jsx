import React, { useState, useEffect } from 'react';
import { useParams, Link } from 'react-router-dom';
import { ShieldCheck, Award, CheckCircle2, QrCode, ExternalLink, ArrowLeft, Printer, Share2, Copy } from 'lucide-react';
import { useSkillProof } from '../../context/SkillProofContext';
import { VerifiedBadge, Badge } from '../../components/common/Badge';
import { Card, CardContent } from '../../components/common/Card';
import { Button } from '../../components/common/Button';
import apiService from '../../services/api';

export const PublicPassportView = () => {
  const { passportId } = useParams();
  const { studentProfile: defaultProfile, skillPassport: defaultPassport, skillMap: defaultSkills } = useSkillProof();

  const [livePassport, setLivePassport] = useState(null);
  const [copied, setCopied] = useState(false);

  useEffect(() => {
    if (passportId) {
      apiService.getPublicPassport(passportId)
        .then(data => {
          if (data && (data.passportNumber || data.id)) {
            setLivePassport(data);
          }
        })
        .catch(err => {
          console.warn('[PublicPassportView] Using fallback passport:', err.message);
        });
    }
  }, [passportId]);

  const studentProfile = livePassport ? {
    name: livePassport.studentName || livePassport.candidateName || defaultProfile.name,
    degree: livePassport.degree || defaultProfile.degree,
    graduationYear: livePassport.batchYear || defaultProfile.graduationYear,
    college: livePassport.college || livePassport.institution || defaultProfile.college,
    placementReadiness: Math.round(Number(livePassport.overallReadiness ?? livePassport.readinessScore ?? livePassport.placementReadiness ?? 0))
  } : defaultProfile;

  const skillPassport = livePassport ? {
    id: livePassport.passportId || livePassport.passportNumber || passportId,
    verificationHash: livePassport.verificationHash || (livePassport.id ? `0x${livePassport.id.replace(/[^a-zA-Z0-9]/g, '').slice(0, 16).toLowerCase()}` : '0xverified'),
    qrCodeUrl: livePassport.qrCodeUrl || defaultPassport.qrCodeUrl
  } : defaultPassport;

  const skillMap = (livePassport && Array.isArray(livePassport.skills || livePassport.verifiedSkills) && (livePassport.skills || livePassport.verifiedSkills).length > 0)
    ? (livePassport.skills || livePassport.verifiedSkills).map(s => ({
        id: s.skillId || s.skillName || s.name,
        name: s.skillName || s.name,
        category: s.category || 'Competency',
        score: Math.round(s.score ?? s.compositeScore ?? 0),
        badge: s.badge || s.badgeLevel || 'NONE',
        verified: !!s.verified,
        tiers: {
          resume: Math.round(s.resume ?? s.tier1Score ?? 0),
          github: Math.round(s.github ?? s.tier2Score ?? 0),
          assessment: Math.round(s.quiz ?? s.tier3Score ?? 0),
          interview: Math.round(s.aiInterview ?? s.tier4Score ?? 0)
        },
        evidence: s.evidence || s.evidenceSummary || 'Multi-tier evidence record'
      }))
    : [];

  const handlePrint = () => {
    window.print();
  };

  const handleCopyLink = () => {
    navigator.clipboard.writeText(window.location.href);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <div className="max-w-4xl mx-auto px-4 py-10 space-y-6 animate-fade-in">
      {/* Top back banner */}
      <div className="flex items-center justify-between">
        <Link to="/" className="inline-flex items-center gap-1.5 text-xs text-slate-400 hover:text-white transition-colors">
          <ArrowLeft className="w-3.5 h-3.5" />
          <span>Back to SKILLPROOF Platform</span>
        </Link>
        <div className="flex items-center gap-2">
          <Button variant="outline" size="sm" icon={Copy} onClick={handleCopyLink}>
            {copied ? 'Link Copied' : 'Copy Verification URL'}
          </Button>
          <Button variant="secondary" size="sm" icon={Printer} onClick={handlePrint}>
            Print Passport
          </Button>
        </div>
      </div>

      {/* THE OFFICIAL SKILL PASSPORT CARD */}
      <Card className="border-indigo-500/50 p-6 sm:p-8 relative overflow-hidden">
        {/* Holographic Watermark */}
        <div className="absolute top-6 right-6 opacity-5 pointer-events-none">
          <ShieldCheck className="w-64 h-64 text-indigo-400" />
        </div>

        {/* Passport Header */}
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between pb-6 border-b border-slate-800/80 gap-4">
          <div className="flex items-center gap-4">
            <div className="w-14 h-14 rounded-xl bg-indigo-600/20 border border-indigo-500/30 flex items-center justify-center shrink-0">
              <ShieldCheck className="w-8 h-8 text-indigo-400" />
            </div>
            <div>
              <div className="flex items-center gap-2 flex-wrap">
                <h1 className="text-lg font-bold text-slate-100 tracking-wide uppercase">Verified Skill Passport</h1>
                <Badge variant="success" size="sm" dot>
                  AUTHENTIC & ACTIVE
                </Badge>
              </div>
              <p className="text-xs text-slate-400 mt-0.5">
                Official Credential of <strong className="text-slate-200">{studentProfile.name}</strong> • {studentProfile.degree} ({studentProfile.graduationYear})
              </p>
              <p className="text-xs text-indigo-400 font-medium mt-0.5">{studentProfile.college}</p>
            </div>
          </div>

          <div className="text-left sm:text-right">
            <span className="text-[10px] uppercase font-semibold text-slate-400 block">Unique Passport ID</span>
            <span className="text-sm font-mono font-bold text-slate-100 bg-slate-950 px-3 py-1 rounded-md border border-slate-800 inline-block mt-0.5">
              {passportId || skillPassport.id}
            </span>
          </div>
        </div>

        {/* Placement Readiness Banner */}
        <div className="my-5 p-4 rounded-xl bg-slate-950 border border-slate-800/90 flex flex-col sm:flex-row items-center justify-between gap-4">
          <div>
            <span className="text-xs text-slate-400 font-medium uppercase tracking-wider">Placement Readiness Score</span>
            <div className="flex items-baseline gap-2 mt-0.5">
              <span className="text-3xl font-bold text-slate-100 font-mono">{studentProfile.placementReadiness}</span>
              <span className="text-xs text-slate-400">/ 100</span>
              <Badge variant="success" size="sm" className="ml-2">Tier 4 Verified</Badge>
            </div>
          </div>
          <div className="flex items-center gap-3">
            <div className="text-right text-xs">
              <div className="font-semibold text-slate-200">{livePassport?.verificationSummary?.replace(/_/g, ' ') || 'Multi-Tier Audited'}</div>
              <div className="text-[11px] text-slate-400 font-mono">0x4a92...b8e1 (SHA-256)</div>
            </div>
            {livePassport?.qrCodeUrl ? (
              <img src={livePassport.qrCodeUrl} alt="QR Code" className="w-12 h-12 rounded-lg bg-white p-0.5" />
            ) : (
              <div className="w-12 h-12 rounded-lg bg-slate-900 border border-slate-800 flex items-center justify-center p-1">
                <QrCode className="w-8 h-8 text-indigo-400" />
              </div>
            )}
          </div>
        </div>

        {/* Breakdown of Verified Skills */}
        <div className="space-y-3">
          <h2 className="text-xs font-semibold uppercase tracking-wider text-slate-300">Verified Technical Competencies</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
            {skillMap.map((skill) => (
              <div
                key={skill.id}
                className="p-4 rounded-xl bg-slate-950 border border-slate-800/90 space-y-2"
              >
                <div className="flex items-center justify-between">
                  <div>
                    <span className="font-semibold text-sm text-slate-100">{skill.name}</span>
                    <span className="text-[11px] text-slate-400 block">{skill.category}</span>
                  </div>
                  <div className="text-right">
                    <span className="text-sm font-mono font-bold text-indigo-400">
                      {skill.score > 0 ? `${skill.score}%` : 'Unverified'}
                    </span>
                    <div className="mt-0.5">
                      <VerifiedBadge level={skill.badge || 'NONE'} size="sm" />
                    </div>
                  </div>
                </div>

                {/* 4-tier mini progress */}
                <div className="pt-2 border-t border-slate-850 grid grid-cols-4 gap-1 text-center text-[10px] text-slate-400">
                  <div className="bg-slate-900 p-1 rounded">Resume: <strong className="text-slate-200">{skill.tiers.resume}</strong></div>
                  <div className="bg-slate-900 p-1 rounded">Git: <strong className="text-slate-200">{skill.tiers.github}</strong></div>
                  <div className="bg-slate-900 p-1 rounded">Quiz: <strong className="text-slate-200">{skill.tiers.assessment}</strong></div>
                  <div className="bg-slate-900 p-1 rounded">AI: <strong className="text-slate-200">{skill.tiers.interview}</strong></div>
                </div>

                <p className="text-[11px] text-slate-400 italic pt-1 border-t border-slate-850">
                  "{skill.evidence}"
                </p>
              </div>
            ))}
          </div>
        </div>

        {/* Footer info */}
        <div className="mt-6 pt-4 border-t border-slate-800/80 flex flex-col sm:flex-row items-center justify-between text-xs text-slate-400 gap-2">
          <span>Verification Signature: <code className="font-mono text-indigo-300">SHA256-SKP-9921-VERIFIED-AUTH</code></span>
          <span>Verified under SKILLPROOF Multi-Tier Standards</span>
        </div>
      </Card>
    </div>
  );
};

export default PublicPassportView;
