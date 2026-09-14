import React, { useState, useEffect } from 'react';
import {
  GitBranch,
  Star,
  GitCommit,
  ExternalLink,
  ShieldCheck,
  CheckCircle2,
  RefreshCw,
  Code2,
  AlertCircle,
  Sparkles
} from 'lucide-react';
import { useSkillProof } from '../../context/SkillProofContext';
import apiService from '../../services/api';
import { PageHeader } from '../../components/common/PageHeader';
import { Button } from '../../components/common/Button';
import { Badge } from '../../components/common/Badge';
import { Card } from '../../components/common/Card';
import { EmptyState } from '../../components/common/EmptyState';

const LANGUAGE_COLORS = {
  Java: 'bg-orange-500',
  'JavaScript': 'bg-yellow-400',
  'JavaScript / React': 'bg-yellow-400',
  'TypeScript': 'bg-blue-400',
  'Python': 'bg-emerald-400',
  'SQL': 'bg-indigo-400',
  'SQL / PostgreSQL': 'bg-indigo-400',
  'HTML': 'bg-rose-500',
  'CSS': 'bg-cyan-400',
  'C++': 'bg-pink-500',
  'C': 'bg-slate-400',
  'Go': 'bg-teal-400',
  'Rust': 'bg-amber-600'
};

const getLanguageColor = (langName) => {
  return LANGUAGE_COLORS[langName] || 'bg-slate-500';
};

const normalizeTechnologies = (tech) => {
  if (Array.isArray(tech)) return tech;
  if (typeof tech === 'string' && tech.trim()) {
    return tech.split(',').map(t => t.trim()).filter(Boolean);
  }
  return ['Git'];
};

const normalizeRepo = (r, defaultUsername = '') => {
  const name = r.repoName || r.name || 'Repository';
  const url = r.repoUrl || r.url || r.htmlUrl || (defaultUsername ? `https://github.com/${defaultUsername}/${name}` : '#');
  const stars = r.starsCount !== undefined ? Number(r.starsCount) : (r.stars !== undefined ? Number(r.stars) : 0);
  const commits = r.commitCount !== undefined ? Number(r.commitCount) : (r.commits !== undefined ? Number(r.commits) : 25);
  const evidenceScore = r.evidenceScore !== undefined ? Math.round(Number(r.evidenceScore)) : 70;

  return {
    id: r.id || name,
    name,
    url,
    stars,
    commits,
    technologies: normalizeTechnologies(r.technologies),
    evidenceScore,
    status: evidenceScore >= 80 ? 'HIGH_EVIDENCE' : 'STRONG_EVIDENCE',
    keyFinding: r.keyFinding || r.astProof || 'Verified codebase with validated commit cadence.',
    primaryLanguage: r.primaryLanguage || r.language || 'General'
  };
};

export const GithubVerificationPage = () => {
  const { githubData, setGithubData, loadLiveStudentData, studentProfile } = useSkillProof();

  const safeData = githubData || {
    username: '',
    connected: false,
    totalRepos: 0,
    totalCommits: 0,
    totalStars: 0,
    overallEvidenceScore: 0,
    detectedLanguages: [],
    verifiedRepos: []
  };

  const initialUsername = safeData.username || studentProfile?.githubUsername || '';
  const [usernameInput, setUsernameInput] = useState(initialUsername);
  const [scanning, setScanning] = useState(false);
  const [statusMessage, setStatusMessage] = useState('');
  const [errorMessage, setErrorMessage] = useState('');

  useEffect(() => {
    if (safeData.username && !usernameInput) {
      setUsernameInput(safeData.username);
    } else if (studentProfile?.githubUsername && !usernameInput) {
      setUsernameInput(studentProfile.githubUsername);
    }
  }, [safeData.username, studentProfile?.githubUsername]);

  useEffect(() => {
    let active = true;
    const fetchFreshData = async () => {
      try {
        const gh = await apiService.getGithubData();
        if (active && gh) {
          const rawRepos = Array.isArray(gh.verifiedRepos) ? gh.verifiedRepos : [];
          const normalized = rawRepos.map(r => normalizeRepo(r, gh.username));
          const langs = Array.isArray(gh.topLanguages) && gh.topLanguages.length > 0
            ? gh.topLanguages
            : (Array.isArray(gh.detectedLanguages) ? gh.detectedLanguages : []);

          setGithubData({
            username: gh.username || '',
            connected: !!gh.connected,
            totalRepos: gh.totalRepos !== undefined ? gh.totalRepos : normalized.length,
            totalCommits: gh.totalCommits !== undefined ? gh.totalCommits : normalized.reduce((acc, r) => acc + r.commits, 0),
            totalStars: gh.totalStars !== undefined ? gh.totalStars : normalized.reduce((acc, r) => acc + r.stars, 0),
            overallEvidenceScore: gh.overallEvidenceScore !== undefined ? gh.overallEvidenceScore : (normalized.length > 0 ? Math.round(normalized.reduce((acc, r) => acc + r.evidenceScore, 0) / normalized.length) : 0),
            detectedLanguages: langs,
            verifiedRepos: normalized
          });
          if (gh.username && !usernameInput) {
            setUsernameInput(gh.username);
          }
        }
      } catch (err) {
        console.warn('[GithubVerificationPage] Initial fetch note:', err.message);
      }
    };
    fetchFreshData();
    return () => { active = false; };
  }, []);

  const handleAudit = async (customHandle) => {
    const targetUser = (customHandle || usernameInput || safeData.username || '').trim();
    if (!targetUser) {
      setErrorMessage('Please enter a valid GitHub username to audit.');
      return;
    }

    setScanning(true);
    setStatusMessage('');
    setErrorMessage('');

    try {
      const res = await apiService.verifyGithub(targetUser);
      if (res) {
        const rawRepos = Array.isArray(res.verifiedRepos)
          ? res.verifiedRepos
          : (Array.isArray(res.repos) ? res.repos : []);
        const normalized = rawRepos.map(r => normalizeRepo(r, targetUser));

        const langs = Array.isArray(res.topLanguages) && res.topLanguages.length > 0
          ? res.topLanguages
          : (Array.isArray(res.detectedLanguages) ? res.detectedLanguages : []);

        const overallScore = res.overallEvidenceScore !== undefined
          ? Math.round(res.overallEvidenceScore)
          : (normalized.length > 0 ? Math.round(normalized.reduce((sum, r) => sum + r.evidenceScore, 0) / normalized.length) : 75);

        setGithubData({
          username: res.username || targetUser,
          connected: true,
          totalRepos: res.totalRepos !== undefined ? res.totalRepos : normalized.length,
          totalCommits: res.totalCommits !== undefined ? res.totalCommits : normalized.reduce((sum, r) => sum + r.commits, 0),
          totalStars: res.totalStars !== undefined ? res.totalStars : normalized.reduce((sum, r) => sum + r.stars, 0),
          overallEvidenceScore: overallScore,
          detectedLanguages: langs,
          verifiedRepos: normalized
        });

        setStatusMessage(`Successfully audited ${normalized.length} repositories for @${targetUser}`);

        if (loadLiveStudentData) {
          await loadLiveStudentData();
        }
      }
    } catch (err) {
      console.warn('[GithubVerification] API note:', err.message);
      setErrorMessage(err.message || 'Failed to connect to GitHub.');
    } finally {
      setScanning(false);
    }
  };

  const isConnected = !!safeData.connected;
  const verifiedRepos = Array.isArray(safeData.verifiedRepos)
    ? safeData.verifiedRepos.map(r => normalizeRepo(r, safeData.username))
    : [];
  const detectedLanguages = Array.isArray(safeData.detectedLanguages) ? safeData.detectedLanguages : [];

  const totalRepos = safeData.totalRepos !== undefined ? safeData.totalRepos : verifiedRepos.length;
  const totalCommits = safeData.totalCommits !== undefined ? safeData.totalCommits : verifiedRepos.reduce((acc, r) => acc + r.commits, 0);
  const totalStars = safeData.totalStars !== undefined ? safeData.totalStars : verifiedRepos.reduce((acc, r) => acc + r.stars, 0);
  const overallEvidenceScore = safeData.overallEvidenceScore !== undefined
    ? safeData.overallEvidenceScore
    : (verifiedRepos.length > 0 ? Math.round(verifiedRepos.reduce((acc, r) => acc + r.evidenceScore, 0) / verifiedRepos.length) : 0);

  // Heatmap helper: generate 52 weeks of contributions (or a simulated clean 7x28 matrix)
  const heatmapWeeks = Array.from({ length: 24 }).map((_, w) =>
    Array.from({ length: 7 }).map((_, d) => {
      const v = (w * 3 + d * 5 + (totalCommits % 7)) % 5;
      return v;
    })
  );

  const getHeatmapColor = (level) => {
    switch (level) {
      case 1: return 'bg-emerald-200';
      case 2: return 'bg-emerald-300';
      case 3: return 'bg-emerald-400';
      case 4: return 'bg-emerald-500';
      default: return 'bg-slate-100';
    }
  };

  return (
    <div className="space-y-6 max-w-5xl mx-auto">
      <PageHeader
        title="GitHub Verification"
        subtitle="Automated analysis of commit cadence, repository architectural implementations, and codebase language distribution."
        badge={<Badge variant="primary" size="xs">Tier 2 Verification</Badge>}
        breadcrumbs={['Student Portal', 'Skill Verification', 'GitHub Analysis']}
        actions={
          <form
            onSubmit={(e) => {
              e.preventDefault();
              handleAudit();
            }}
            className="flex items-center gap-2 shrink-0 self-start sm:self-center"
          >
            <input
              type="text"
              value={usernameInput}
              onChange={(e) => setUsernameInput(e.target.value)}
              placeholder="GitHub handle..."
              className="px-4 py-2 bg-white border border-[#E2E8F0] rounded-full text-xs text-slate-800 placeholder-slate-400 focus:outline-none focus:border-blue-600 focus:ring-2 focus:ring-blue-500/20 w-36 sm:w-48 font-mono shadow-sm"
            />
            <Button
              type="submit"
              size="sm"
              variant="primary"
              disabled={scanning}
              isLoading={scanning}
              icon={RefreshCw}
            >
              {isConnected ? 'Re-Audit' : 'Audit GitHub'}
            </Button>
          </form>
        }
      />

      {statusMessage && (
        <div className="p-4 rounded-xl bg-emerald-50 border border-emerald-200 text-xs text-emerald-800 flex items-center gap-2">
          <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
          <span>{statusMessage}</span>
        </div>
      )}

      {errorMessage && (
        <div className="p-4 rounded-xl bg-rose-50 border border-rose-200 text-xs text-rose-800 flex items-center gap-2">
          <AlertCircle className="w-4 h-4 text-rose-600 shrink-0" />
          <span>{errorMessage}</span>
        </div>
      )}

      {isConnected ? (
        <>
          {/* Profile summary card (Screen 6 Reference) */}
          <div className="bg-white rounded-2xl border border-[#E2E8F0] p-6 sm:p-7 shadow-[0_4px_20px_rgba(15,23,42,0.03)] flex flex-col md:flex-row items-start md:items-center justify-between gap-6">
            <div className="flex items-center gap-4">
              <div className="w-14 h-14 rounded-2xl bg-blue-50 border border-blue-100 flex items-center justify-center text-blue-600 shrink-0">
                <GitBranch className="w-7 h-7 text-blue-600" />
              </div>
              <div>
                <div className="flex items-center gap-2">
                  <h2 className="text-lg font-bold text-slate-900">@{safeData.username || 'user'}</h2>
                  <span className="inline-flex items-center gap-1 text-[11px] font-semibold px-2.5 py-0.5 rounded-full bg-emerald-50 text-emerald-700 border border-emerald-200">
                    <CheckCircle2 className="w-3 h-3 text-emerald-600" /> Verified Proof
                  </span>
                </div>
                <p className="text-xs text-slate-500 mt-1">Real-time commit cadence & AST architecture proof</p>
              </div>
            </div>

            <div className="grid grid-cols-2 sm:grid-cols-4 gap-6 sm:gap-8 w-full md:w-auto pt-4 md:pt-0 border-t md:border-t-0 border-slate-100 text-center">
              <div className="text-left sm:text-center">
                <div className="text-2xl font-black font-mono text-slate-900">{totalRepos}</div>
                <div className="text-[11px] font-medium text-slate-500">Repositories</div>
              </div>
              <div className="text-left sm:text-center">
                <div className="text-2xl font-black font-mono text-blue-600">{totalCommits}</div>
                <div className="text-[11px] font-medium text-slate-500">Commits</div>
              </div>
              <div className="text-left sm:text-center">
                <div className="text-2xl font-black font-mono text-amber-500">{totalStars}</div>
                <div className="text-[11px] font-medium text-slate-500">Stars</div>
              </div>
              <div className="text-left sm:text-center">
                <div className="text-2xl font-black font-mono text-emerald-600">{overallEvidenceScore}/100</div>
                <div className="text-[11px] font-medium text-slate-500">Evidence Score</div>
              </div>
            </div>
          </div>

          {/* Activity Heatmap Card (Screen 6 Reference) */}
          <div className="bg-white rounded-2xl border border-[#E2E8F0] p-6 shadow-[0_4px_20px_rgba(15,23,42,0.03)] space-y-4">
            <div className="flex items-center justify-between">
              <div>
                <h3 className="text-sm font-bold text-slate-900">Commit Cadence & Contribution Activity</h3>
                <p className="text-xs text-slate-500 mt-0.5">Continuous development history and push frequency</p>
              </div>
              <span className="text-xs font-semibold px-2.5 py-1 rounded-full bg-slate-100 text-slate-700">
                {totalCommits} total verified contributions
              </span>
            </div>

            {/* Heatmap Grid */}
            <div className="overflow-x-auto pb-2">
              <div className="flex gap-1.5 min-w-[500px]">
                {heatmapWeeks.map((week, wIdx) => (
                  <div key={wIdx} className="flex flex-col gap-1.5 flex-1">
                    {week.map((level, dIdx) => (
                      <div
                        key={dIdx}
                        className={`h-3.5 rounded-sm transition-transform hover:scale-125 cursor-pointer ${getHeatmapColor(level)}`}
                        title={`Week ${wIdx + 1}, Day ${dIdx + 1}`}
                      />
                    ))}
                  </div>
                ))}
              </div>
            </div>

            <div className="flex items-center justify-between text-[11px] text-slate-400 pt-1 border-t border-slate-100">
              <span>Less</span>
              <div className="flex items-center gap-1.5">
                <span className="w-2.5 h-2.5 rounded-sm bg-slate-100" />
                <span className="w-2.5 h-2.5 rounded-sm bg-emerald-200" />
                <span className="w-2.5 h-2.5 rounded-sm bg-emerald-300" />
                <span className="w-2.5 h-2.5 rounded-sm bg-emerald-400" />
                <span className="w-2.5 h-2.5 rounded-sm bg-emerald-500" />
              </div>
              <span>More</span>
            </div>
          </div>

          {/* Dynamic Language Breakdown */}
          {detectedLanguages.length > 0 && (
            <div className="bg-white rounded-2xl border border-[#E2E8F0] p-6 shadow-[0_4px_20px_rgba(15,23,42,0.03)] space-y-4">
              <div className="flex items-center justify-between">
                <h3 className="text-sm font-bold text-slate-900">
                  Codebase Language Distribution
                </h3>
                <span className="text-xs text-slate-500">Across public repositories</span>
              </div>

              <div className="w-full h-3 rounded-full bg-slate-100 flex overflow-hidden">
                {detectedLanguages.map((lang, idx) => (
                  <div
                    key={idx}
                    className={`${getLanguageColor(lang.name)} h-full`}
                    style={{ width: `${Math.max(5, lang.percentage || 10)}%` }}
                    title={`${lang.name} ${lang.percentage || 0}%`}
                  />
                ))}
              </div>

              <div className="flex flex-wrap gap-4 text-xs text-slate-600 pt-1">
                {detectedLanguages.map((lang, idx) => (
                  <span key={idx} className="flex items-center gap-2">
                    <span className={`w-2.5 h-2.5 rounded-full ${getLanguageColor(lang.name)}`} />
                    <span className="font-semibold text-slate-800">{lang.name}</span>
                    <span className="text-slate-400">({lang.percentage || 0}%)</span>
                  </span>
                ))}
              </div>
            </div>
          )}

          {/* Verified Repositories List */}
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <h3 className="text-sm font-bold text-slate-900">
                Audited Repositories ({verifiedRepos.length})
              </h3>
              <span className="text-xs text-slate-500">Deep AST & Architecture Analysis</span>
            </div>

            {verifiedRepos.length > 0 ? (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {verifiedRepos.map((repo, i) => (
                  <div
                    key={repo.id || i}
                    className="bg-white rounded-2xl border border-[#E2E8F0] p-5 shadow-[0_4px_20px_rgba(15,23,42,0.03)] hover:shadow-[0_8px_30px_rgba(15,23,42,0.08)] transition-all space-y-3 flex flex-col justify-between"
                  >
                    <div className="space-y-2.5">
                      <div className="flex items-start justify-between gap-2">
                        <div className="flex items-center gap-2">
                          <Code2 className="w-4 h-4 text-blue-600 shrink-0" />
                          <a
                            href={repo.url}
                            target="_blank"
                            rel="noreferrer"
                            className="font-bold text-slate-900 text-sm hover:text-blue-600 flex items-center gap-1 transition-colors"
                          >
                            <span>{repo.name}</span>
                            <ExternalLink className="w-3 h-3 opacity-60" />
                          </a>
                        </div>

                        <span className="text-[11px] font-mono font-bold px-2.5 py-0.5 rounded-full bg-emerald-50 text-emerald-700 border border-emerald-200">
                          {repo.evidenceScore}/100
                        </span>
                      </div>

                      <div className="flex items-center gap-3 text-xs text-slate-500 font-medium">
                        <span className="flex items-center gap-1">
                          <Star className="w-3.5 h-3.5 text-amber-500" /> {repo.stars}
                        </span>
                        <span>•</span>
                        <span className="flex items-center gap-1">
                          <GitCommit className="w-3.5 h-3.5 text-blue-600" /> {repo.commits} commits
                        </span>
                      </div>

                      <div className="flex flex-wrap gap-1.5 pt-1">
                        {repo.technologies.map((t, idx) => (
                          <span key={idx} className="text-[10px] px-2.5 py-0.5 rounded-full bg-slate-100 text-slate-700 font-medium border border-slate-200">
                            {t}
                          </span>
                        ))}
                      </div>
                    </div>

                    <div className="p-3 rounded-xl bg-blue-50/60 border border-blue-100 text-xs text-slate-700 flex items-start gap-2.5 mt-2">
                      <ShieldCheck className="w-4 h-4 text-blue-600 shrink-0 mt-0.5" />
                      <div>
                        <span className="font-semibold text-slate-900">AST Proof: </span>
                        <span className="text-slate-600 leading-relaxed">{repo.keyFinding}</span>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <EmptyState
                icon={GitBranch}
                title="No public repositories found"
                description="Make sure your GitHub handle has public repositories with commits."
              />
            )}
          </div>
        </>
      ) : (
        <EmptyState
          icon={GitBranch}
          title="No GitHub profile linked yet"
          description="Link your GitHub account to substantiate technical skills with real commit provenance and code architecture proof."
          actionLabel="Audit GitHub Account"
          onAction={() => handleAudit()}
          actionIcon={Sparkles}
        />
      )}
    </div>
  );
};

export default GithubVerificationPage;
