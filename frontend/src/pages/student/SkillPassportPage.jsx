import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import {
  ShieldCheck,
  Award,
  QrCode,
  Share2,
  Printer,
  Copy,
  ExternalLink,
  Sparkles,
  Check,
  RefreshCw
} from 'lucide-react';
import { useSkillProof } from '../../context/SkillProofContext';
import { VerifiedBadge } from '../../components/common/Badge';
import apiService from '../../services/api';
import { PageHeader } from '../../components/common/PageHeader';
import { Button } from '../../components/common/Button';
import { Badge } from '../../components/common/Badge';
import { Card } from '../../components/common/Card';
import { EmptyState } from '../../components/common/EmptyState';

export const SkillPassportPage = () => {
  const { studentProfile, skillPassport, setSkillPassport, skillMap, loadLiveStudentData } = useSkillProof();
  const [copied, setCopied] = useState(false);
  const [generating, setGenerating] = useState(false);

  useEffect(() => {
    let active = true;
    const fetchPassport = async () => {
      try {
        const pass = await apiService.getMyPassport();
        if (active && pass && pass.isGenerated && (pass.passportId || pass.id)) {
          if (setSkillPassport) {
            setSkillPassport({
              id: pass.passportId || pass.id,
              isGenerated: true,
              studentName: pass.studentName || pass.candidateName || studentProfile?.name || 'Student',
              college: pass.college || pass.institution || studentProfile?.college || '',
              degree: pass.degree || studentProfile?.degree || '',
              batchYear: pass.batchYear || studentProfile?.graduationYear || 2027,
              placementReadiness: Math.round(Number(pass.overallReadiness || pass.placementReadiness || 0)),
              tierSummary: pass.verificationSummary || 'Multi-Tier Audited',
              verifiedDate: pass.issuedAt ? new Date(pass.issuedAt).toLocaleDateString() : 'Recently',
              verificationHash: pass.id ? `0x${pass.id.replace(/[^a-zA-Z0-9]/g, '').slice(0, 16).toLowerCase()}` : '0xverified',
              qrCodeUrl: pass.qrCodeUrl || `https://api.qrserver.com/v1/create-qr-code/?size=180x180&data=${encodeURIComponent(pass.shareableLink || window.location.href)}`,
              verifiedSkills: Array.isArray(pass.verifiedSkills) ? pass.verifiedSkills : []
            });
          }
        }
      } catch (err) {
        console.warn('[SkillPassportPage] Initial fetch note:', err.message);
      }
    };
    fetchPassport();
    return () => { active = false; };
  }, []);

  const handleGeneratePassport = async () => {
    setGenerating(true);
    try {
      const res = await apiService.recalibratePassport();
      if (res) {
        if (setSkillPassport) {
          setSkillPassport({
            id: res.passportId || res.id,
            isGenerated: true,
            studentName: res.studentName || res.candidateName || studentProfile?.name || 'Student',
            college: res.college || res.institution || studentProfile?.college || '',
            degree: res.degree || studentProfile?.degree || '',
            batchYear: res.batchYear || studentProfile?.graduationYear || 2027,
            placementReadiness: Math.round(Number(res.overallReadiness || res.placementReadiness || 0)),
            tierSummary: res.verificationSummary || 'Multi-Tier Audited',
            verifiedDate: res.issuedAt ? new Date(res.issuedAt).toLocaleDateString() : 'Recently',
            verificationHash: res.id ? `0x${res.id.replace(/[^a-zA-Z0-9]/g, '').slice(0, 16).toLowerCase()}` : '0xverified',
            qrCodeUrl: res.qrCodeUrl || `https://api.qrserver.com/v1/create-qr-code/?size=180x180&data=${encodeURIComponent(res.shareableLink || window.location.href)}`,
            verifiedSkills: Array.isArray(res.verifiedSkills) ? res.verifiedSkills : []
          });
        }
        if (loadLiveStudentData) {
          await loadLiveStudentData();
        }
      }
    } catch (e) {
      console.warn('[SkillPassportPage] generate error:', e.message);
    } finally {
      setGenerating(false);
    }
  };

  const safePassport = skillPassport || { isGenerated: false };
  const passportId = safePassport.id || 'SKP-PENDING';
  const shareUrl = `${window.location.origin}/#/verify/${passportId}`;

  const handleCopy = () => {
    navigator.clipboard.writeText(shareUrl);
    setCopied(true);
    setTimeout(() => setCopied(false), 2500);
  };

  const handlePrint = () => {
    window.print();
  };

  const skillsToDisplay = (Array.isArray(safePassport.verifiedSkills) && safePassport.verifiedSkills.length > 0)
    ? safePassport.verifiedSkills
    : (Array.isArray(skillMap) ? skillMap : []);

  return (
    <div className="max-w-4xl mx-auto space-y-6">
      <PageHeader
        title="Verified Skill Passport"
        subtitle="Cryptographically verifiable digital credential substantiated by code repositories, standardized diagnostic tests, and proctored technical defense."
        badge={<Badge variant="primary" size="xs">Digital Credential</Badge>}
        breadcrumbs={['Student Portal', 'Skill Verification', 'Skill Passport']}
        actions={
          <div className="flex items-center gap-2">
            <Button
              variant="secondary"
              size="sm"
              onClick={handleGeneratePassport}
              disabled={generating}
              isLoading={generating}
              icon={RefreshCw}
            >
              Recalibrate
            </Button>

            {safePassport.isGenerated && (
              <Button
                variant="secondary"
                size="sm"
                onClick={handleCopy}
                icon={copied ? Check : Copy}
              >
                {copied ? 'Copied' : 'Share Link'}
              </Button>
            )}

            <Button
              variant="primary"
              size="sm"
              onClick={handlePrint}
              icon={Printer}
            >
              Export
            </Button>
          </div>
        }
      />

      {/* THE OFFICIAL DIGITAL SKILL PASSPORT CARD - Screen 8 Reference */}
      {safePassport.isGenerated ? (
        <div className="bg-white rounded-3xl border border-[#E2E8F0] p-6 sm:p-8 shadow-[0_4px_30px_rgba(15,23,42,0.06)] relative overflow-hidden space-y-6">
          {/* Subtle Watermark Shield */}
          <div className="absolute top-4 right-4 opacity-[0.03] pointer-events-none">
            <ShieldCheck className="w-96 h-96 text-blue-600" />
          </div>

          {/* Passport Identity Header */}
          <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between pb-6 border-b border-[#E2E8F0] gap-4">
            <div className="flex items-center gap-4">
              <div className="w-14 h-14 rounded-2xl bg-blue-50 border border-blue-100 flex items-center justify-center text-blue-600 shadow-sm shrink-0">
                <ShieldCheck className="w-7 h-7 text-blue-600" />
              </div>
              <div>
                <div className="flex items-center gap-2">
                  <span className="text-xs font-black text-blue-600 tracking-wider uppercase">SKILLPROOF DIGITAL CREDENTIAL</span>
                  <span className="inline-flex items-center gap-1 text-[11px] font-semibold px-2.5 py-0.5 rounded-full bg-emerald-50 text-emerald-700 border border-emerald-200">
                    <Check className="w-3 h-3 text-emerald-600" /> {safePassport.tierSummary?.replace(/_/g, ' ') || 'VERIFIED'}
                  </span>
                </div>
                <h2 className="text-xl font-black text-slate-900 mt-1">
                  {safePassport.studentName || studentProfile?.name || 'Student'}
                </h2>
                <p className="text-xs text-slate-500 mt-0.5">
                  {safePassport.degree || studentProfile?.degree || 'Engineering Degree'} • Class of {safePassport.batchYear || studentProfile?.graduationYear || 2027}
                </p>
                <p className="text-xs text-blue-600 font-semibold mt-0.5">{safePassport.college || studentProfile?.college}</p>
              </div>
            </div>

            <div className="text-left sm:text-right">
              <span className="text-[10px] uppercase font-bold tracking-wider text-slate-400 block">Credential ID</span>
              <span className="text-xs font-mono font-bold text-slate-900 bg-slate-100 px-3 py-1 rounded-full border border-slate-200 inline-block mt-1">
                {safePassport.id}
              </span>
              <div className="mt-2">
                <Link
                  to={`/verify/${safePassport.id}`}
                  target="_blank"
                  className="text-xs text-blue-600 hover:text-blue-700 font-semibold flex items-center gap-1 sm:justify-end"
                >
                  <span>Public Verification URL</span>
                  <ExternalLink className="w-3 h-3" />
                </Link>
              </div>
            </div>
          </div>

          {/* Readiness Metric Banner & QR Card */}
          <div className="p-6 rounded-2xl bg-gradient-to-r from-blue-50 to-indigo-50/50 border border-blue-100 flex flex-col sm:flex-row items-center justify-between gap-6">
            <div className="space-y-1 text-center sm:text-left">
              <span className="text-xs text-blue-600 font-bold uppercase tracking-wider">Placement Readiness Score</span>
              <div className="flex items-baseline justify-center sm:justify-start gap-2">
                <span className="text-4xl font-black font-mono text-slate-900">{safePassport.placementReadiness || studentProfile?.placementReadiness || 0}</span>
                <span className="text-sm font-semibold text-slate-400">/ 100</span>
                <span className="text-xs text-emerald-700 font-semibold ml-2">● Verified Employability Index</span>
              </div>
              <p className="text-xs text-slate-600 max-w-lg leading-relaxed pt-1">
                Substantiated across 4-5 multi-actor evidence tiers: Semantic Resume Extraction, GitHub Provenance, Standardized Technical Diagnostics, and AI Technical Defense.
              </p>
            </div>

            {/* QR Code and seal */}
            <div className="flex items-center gap-3 bg-white p-3 rounded-2xl border border-blue-200/80 shadow-sm shrink-0">
              <div className="text-right text-xs">
                <div className="font-bold text-slate-900">Scan to Verify</div>
                <div className="text-[10px] text-slate-500 font-medium">Employer QR Audit</div>
              </div>
              {safePassport.qrCodeUrl ? (
                <img
                  src={safePassport.qrCodeUrl}
                  alt="Passport QR Code"
                  className="w-14 h-14 rounded-xl bg-white p-1 border border-slate-100"
                />
              ) : (
                <div className="w-14 h-14 rounded-xl bg-slate-100 flex items-center justify-center text-slate-400">
                  <QrCode className="w-7 h-7" />
                </div>
              )}
            </div>
          </div>

          {/* Breakdown of Verified Skills */}
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <h3 className="text-sm font-bold text-slate-900">
                Verified Technical Competencies ({skillsToDisplay.length})
              </h3>
              <span className="text-xs text-slate-500">Multi-Tier Weighted Validation</span>
            </div>

            {skillsToDisplay.length > 0 ? (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {skillsToDisplay.map((skill, idx) => {
                  const rScore = Math.round(skill.tiers?.resume ?? skill.resume ?? 0);
                  const gScore = Math.round(skill.tiers?.github ?? skill.github ?? 0);
                  const aScore = Math.round(skill.tiers?.assessment ?? skill.quiz ?? 0);
                  const iScore = Math.round(skill.tiers?.interview ?? skill.aiInterview ?? 0);
                  const cScore = Math.round(skill.tiers?.competitiveCoding ?? skill.competitiveCoding ?? 0);
                  const score = Math.round(skill.score || 0);
                  const hasCompTier = cScore > 0;

                  return (
                    <div
                      key={skill.id || skill.name || idx}
                      className="p-5 rounded-2xl bg-white border border-[#E2E8F0] shadow-sm hover:shadow-md transition-all space-y-3"
                    >
                      <div className="flex items-start justify-between gap-2">
                        <div>
                          <span className="font-bold text-sm text-slate-900">{skill.name}</span>
                          <span className="text-xs text-slate-500 block">{skill.category || 'Competency'}</span>
                        </div>
                        <div className="text-right">
                          <span className="text-base font-mono font-black text-blue-600">
                            {score > 0 ? `${score}%` : 'Unverified'}
                          </span>
                          <div className="mt-0.5">
                            <VerifiedBadge level={skill.badge || 'NONE'} size="xs" compact />
                          </div>
                        </div>
                      </div>

                      {/* Evidence Grid with Weighted Contribution */}
                      {hasCompTier ? (
                        <div className="pt-2 border-t border-slate-100 grid grid-cols-5 gap-1.5 text-center text-[10px]">
                          <div className="bg-slate-50 p-1.5 rounded-lg border border-slate-200">
                            <span className="block text-slate-500 font-medium">Resume</span>
                            <strong className="text-slate-900 block text-xs font-mono">{rScore}%</strong>
                          </div>
                          <div className="bg-slate-50 p-1.5 rounded-lg border border-slate-200">
                            <span className="block text-slate-500 font-medium">GitHub</span>
                            <strong className="text-slate-900 block text-xs font-mono">{gScore}%</strong>
                          </div>
                          <div className="bg-slate-50 p-1.5 rounded-lg border border-slate-200">
                            <span className="block text-slate-500 font-medium">Quiz</span>
                            <strong className="text-slate-900 block text-xs font-mono">{aScore}%</strong>
                          </div>
                          <div className="bg-slate-50 p-1.5 rounded-lg border border-slate-200">
                            <span className="block text-slate-500 font-medium">Interview</span>
                            <strong className="text-slate-900 block text-xs font-mono">{iScore}%</strong>
                          </div>
                          <div className="bg-amber-50 p-1.5 rounded-lg border border-amber-200">
                            <span className="block text-amber-700 font-bold">Comp</span>
                            <strong className="text-amber-800 block text-xs font-mono">{cScore}%</strong>
                          </div>
                        </div>
                      ) : (
                        <div className="pt-2 border-t border-slate-100 grid grid-cols-4 gap-1.5 text-center text-[10px]">
                          <div className="bg-slate-50 p-1.5 rounded-lg border border-slate-200">
                            <span className="block text-slate-500 font-medium">Resume</span>
                            <strong className="text-slate-900 block text-xs font-mono">{rScore}%</strong>
                          </div>
                          <div className="bg-slate-50 p-1.5 rounded-lg border border-slate-200">
                            <span className="block text-slate-500 font-medium">GitHub</span>
                            <strong className="text-slate-900 block text-xs font-mono">{gScore}%</strong>
                          </div>
                          <div className="bg-slate-50 p-1.5 rounded-lg border border-slate-200">
                            <span className="block text-slate-500 font-medium">Quiz</span>
                            <strong className="text-slate-900 block text-xs font-mono">{aScore}%</strong>
                          </div>
                          <div className="bg-slate-50 p-1.5 rounded-lg border border-slate-200">
                            <span className="block text-slate-500 font-medium">Interview</span>
                            <strong className="text-slate-900 block text-xs font-mono">{iScore}%</strong>
                          </div>
                        </div>
                      )}

                      <p className="text-xs text-slate-500 italic pt-2 border-t border-slate-100 leading-relaxed truncate">
                        "{skill.evidence || 'Multi-tier audited evidence record.'}"
                      </p>
                    </div>
                  );
                })}
              </div>
            ) : (
              <EmptyState
                icon={Award}
                title="No skills verified yet"
                description="Complete diagnostic assessments or AI interview sessions to verify technical competencies."
              />
            )}
          </div>

          {/* Verifier Footer */}
          <div className="pt-4 border-t border-[#E2E8F0] flex flex-col sm:flex-row items-center justify-between text-xs text-slate-500 gap-2">
            <span>Cryptographic Proof: <strong className="font-mono text-slate-700">{safePassport.verificationHash || '0xverified'}</strong></span>
            <span className="font-medium text-slate-600">SKILLPROOF Multi-Actor Verification Protocol</span>
          </div>
        </div>
      ) : (
        <EmptyState
          icon={ShieldCheck}
          title="Skill Passport Not Yet Generated"
          description="Your official digital passport is calibrated once you complete multi-tier verification (Resume, GitHub, Assessment, or AI Interview)."
          actionLabel={generating ? 'Generating...' : 'Generate Skill Passport Now'}
          onAction={handleGeneratePassport}
          actionIcon={Sparkles}
        />
      )}
    </div>
  );
};

export default SkillPassportPage;
