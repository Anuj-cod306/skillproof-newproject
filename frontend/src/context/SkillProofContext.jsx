import React, { createContext, useContext, useState, useEffect, useCallback } from 'react';
import { useAuth } from './AuthContext';
import apiService from '../services/api';

const SkillProofContext = createContext();

const createEmptyProfile = (user) => ({
  name: user?.name || user?.fullName || 'Student',
  college: user?.college || '',
  degree: user?.degree || '',
  graduationYear: 2027,
  cgpa: '',
  location: '',
  targetRole: 'Backend Developer',
  targetIndustry: '',
  githubUsername: '',
  placementReadiness: 0,
  bio: ''
});

const createEmptyResume = () => ({
  fileName: null,
  uploadedAt: null,
  fileSize: null,
  parsed: false,
  extractedSkills: [],
  extractedProjects: [],
  experience: []
});

const createEmptyGithub = () => ({
  username: '',
  connected: false,
  totalRepos: 0,
  totalCommits: 0,
  totalStars: 0,
  overallEvidenceScore: 0,
  detectedLanguages: [],
  verifiedRepos: []
});

const createEmptyInterview = (targetRole) => ({
  id: null,
  targetRole: targetRole || 'Backend Developer',
  status: 'NOT_STARTED',
  overallScore: 0,
  rubric: {
    technicalKnowledge: 0,
    projectUnderstanding: 0,
    problemSolving: 0,
    communication: 0
  },
  summaryVerdict: '',
  strengths: '',
  improvements: '',
  transcript: []
});

const createEmptyPassport = (user) => ({
  id: null,
  isGenerated: false,
  studentName: user?.name || user?.fullName || 'Student',
  college: user?.college || '',
  degree: user?.degree || '',
  batchYear: 2027,
  placementReadiness: 0,
  tierSummary: 'Not Generated',
  verifiedDate: null,
  qrCodeUrl: null,
  verificationHash: null
});

const createEmptySkillGap = (targetRole) => ({
  targetRole: targetRole || 'Backend Developer',
  matchedSkills: [],
  missingSkills: [],
  gapScore: 0
});

export const SkillProofProvider = ({ children }) => {
  const { currentUser } = useAuth();

  // 1. Student Profile State
  const [studentProfile, setStudentProfile] = useState(() => createEmptyProfile(currentUser));

  // 2. Resume State
  const [resumeData, setResumeData] = useState(() => createEmptyResume());

  // 3. Skill Map
  const [skillMap, setSkillMap] = useState([]);

  // 4. GitHub Data
  const [githubData, setGithubData] = useState(() => createEmptyGithub());

  // 5. AI Interview State
  const [interviewSession, setInterviewSession] = useState(() =>
    createEmptyInterview(currentUser?.targetRole)
  );

  // 6. Skill Passport
  const [skillPassport, setSkillPassport] = useState(() => createEmptyPassport(currentUser));

  // 7. Skill Gap & Roadmap
  const [skillGap, setSkillGap] = useState(() =>
    createEmptySkillGap(currentUser?.targetRole)
  );
  const [roadmap, setRoadmap] = useState([]);

  // 8. Jobs
  const [jobs, setJobs] = useState([]);

  // Live Sync Function
  const loadLiveStudentData = useCallback(async (userOverride = currentUser) => {
    const token = localStorage.getItem('skillproof_token');
    if (!token) return;
    const targetUser = userOverride || currentUser;
    if (targetUser && targetUser.role && targetUser.role !== 'student') {
      return;
    }

    try {
      // 1. Fetch Profile
      const prof = await apiService.getStudentProfile().catch(() => null);
      if (prof && (prof.id || prof.userId)) {
        setStudentProfile(prev => ({
          ...prev,
          name: prof.fullName || prof.name || prev.name,
          college: prof.college || '',
          degree: prof.degree || '',
          graduationYear: prof.graduationYear || 2027,
          cgpa: prof.cgpa ? String(prof.cgpa) : '',
          location: prof.location || '',
          targetRole: prof.targetRole || 'Software Engineer',
          targetIndustry: prof.targetIndustry || '',
          githubUsername: prof.githubUsername || '',
          placementReadiness: prof.placementReadiness !== undefined ? Number(prof.placementReadiness) : 0,
          bio: prof.bio || ''
        }));
      }

      // 2. Fetch Live Skill Map from /api/student/skills
      const liveSkills = await apiService.getStudentSkills().catch((err) => {
        console.warn('[SkillProofContext] Failed to fetch live skills:', err);
        return null;
      });
      if (Array.isArray(liveSkills)) {
        setSkillMap(liveSkills.map(s => ({
          id: s.id ? String(s.id) : (s.name || '').toLowerCase().replace(/[^a-z0-9]/g, ''),
          skillId: s.skillId,
          name: s.name,
          category: s.category || 'Backend',
          status: s.status || 'CLAIMED',
          score: Math.round(s.score || 0),
          verified: !!s.verified,
          badge: s.badge || 'NONE',
          confidence: s.confidence !== undefined ? s.confidence : Math.round(s.tiers?.resume || 0),
          sourceResumeId: s.sourceResumeId,
          sourceResumeFileName: s.sourceResumeFileName,
          tiers: {
            resume: Math.round(s.tiers?.resume || 0),
            github: Math.round(s.tiers?.github || 0),
            assessment: Math.round(s.tiers?.assessment || 0),
            interview: Math.round(s.tiers?.interview || 0),
            competitiveCoding: Math.round(s.tiers?.competitiveCoding || 0)
          },
          evidence: s.evidence || 'Multi-tier evidence record'
        })));
      }

      // 2.5 Fetch Skill Passport
      const pass = await apiService.getMyPassport().catch(() => null);
      if (pass && pass.isGenerated && (pass.passportId || pass.id)) {
        const skillsList = Array.isArray(pass.verifiedSkills) ? pass.verifiedSkills.map(s => ({
          name: s.name,
          category: s.category || 'Competency',
          score: Math.round(s.score || 0),
          badge: s.badge || 'NONE',
          verified: !!s.verified,
          resume: Math.round(s.resume || 0),
          github: Math.round(s.github || 0),
          quiz: Math.round(s.quiz || 0),
          aiInterview: Math.round(s.aiInterview || 0),
          competitiveCoding: Math.round(s.competitiveCoding || s.tiers?.competitiveCoding || 0),
          evidence: s.evidence || 'Multi-tier evidence record'
        })) : [];

        setSkillPassport({
          id: pass.passportId || pass.id,
          isGenerated: true,
          studentName: pass.studentName || pass.candidateName || prof?.fullName || targetUser?.name || 'Student',
          college: pass.college || pass.institution || prof?.college || '',
          degree: pass.degree || prof?.degree || '',
          batchYear: pass.batchYear || 2027,
          placementReadiness: Number(pass.overallReadiness || pass.placementReadiness || 0),
          tierSummary: pass.verificationSummary || pass.tierSummary || 'Multi-Tier Audited',
          verifiedDate: pass.issuedAt ? new Date(pass.issuedAt).toLocaleDateString() : 'Recently',
          verificationHash: pass.id ? `0x${pass.id.replace(/[^a-zA-Z0-9]/g, '').slice(0, 16).toLowerCase()}` : '0xverified',
          qrCodeUrl: pass.qrCodeUrl || `https://api.qrserver.com/v1/create-qr-code/?size=180x180&data=${encodeURIComponent(pass.shareableLink || window.location.href)}`,
          verifiedSkills: skillsList
        });
      } else {
        setSkillPassport(createEmptyPassport(targetUser));
      }

      // 3. Fetch Latest Resume
      const resume = await apiService.getLatestResume().catch(() => null);
      if (resume && resume.fileName) {
        const analysis = resume.analysis || {};
        setResumeData({
          fileName: resume.fileName,
          uploadedAt: resume.uploadedAt ? new Date(resume.uploadedAt).toLocaleDateString() : 'Recently',
          fileSize: resume.fileSize || 'PDF Document',
          parsed: true,
          extractedSkills: Array.isArray(analysis.skills) ? analysis.skills : (analysis.skills ? [analysis.skills] : []),
          extractedProjects: Array.isArray(analysis.projects) ? analysis.projects : [],
          experience: Array.isArray(analysis.experience) ? analysis.experience : []
        });
      } else {
        setResumeData(createEmptyResume());
      }

      // 4. Fetch GitHub Data
      const gh = await apiService.getGithubData().catch(() => null);
      if (gh && gh.connected) {
        const rawRepos = Array.isArray(gh.verifiedRepos) ? gh.verifiedRepos : [];
        const normalizedRepos = rawRepos.map(r => ({
          id: r.id,
          name: r.repoName || r.name || 'Repository',
          url: r.repoUrl || r.url || r.htmlUrl || (gh.username ? `https://github.com/${gh.username}/${r.repoName || r.name || ''}` : '#'),
          stars: r.starsCount !== undefined ? r.starsCount : (r.stars || 0),
          commits: r.commitCount !== undefined ? r.commitCount : (r.commits || 25),
          technologies: r.technologies ? (Array.isArray(r.technologies) ? r.technologies : String(r.technologies).split(',').map(s => s.trim()).filter(Boolean)) : ['Git'],
          evidenceScore: r.evidenceScore !== undefined ? Math.round(Number(r.evidenceScore)) : 70,
          status: (r.evidenceScore || 70) >= 80 ? 'HIGH_EVIDENCE' : 'STRONG_EVIDENCE',
          keyFinding: r.keyFinding || r.astProof || 'Verified codebase implementation.',
          primaryLanguage: r.primaryLanguage || r.language || 'General'
        }));

        const langs = Array.isArray(gh.topLanguages) && gh.topLanguages.length > 0
          ? gh.topLanguages
          : (Array.isArray(gh.detectedLanguages) ? gh.detectedLanguages : []);

        setGithubData({
          username: gh.username || '',
          connected: true,
          totalRepos: gh.totalRepos !== undefined ? gh.totalRepos : normalizedRepos.length,
          totalCommits: gh.totalCommits !== undefined ? gh.totalCommits : normalizedRepos.reduce((acc, r) => acc + (r.commits || 0), 0),
          totalStars: gh.totalStars !== undefined ? gh.totalStars : normalizedRepos.reduce((acc, r) => acc + (r.stars || 0), 0),
          overallEvidenceScore: gh.overallEvidenceScore !== undefined ? gh.overallEvidenceScore : (normalizedRepos.length > 0 ? Math.round(normalizedRepos.reduce((acc, r) => acc + r.evidenceScore, 0) / normalizedRepos.length) : 70),
          detectedLanguages: langs,
          verifiedRepos: normalizedRepos
        });
      } else {
        setGithubData({
          ...createEmptyGithub(),
          username: (prof && prof.githubUsername) || (gh && gh.username) || ''
        });
      }

      // 5. Fetch AI Interview
      const interview = await apiService.getLatestInterview().catch(() => null);
      if (interview && interview.interviewId) {
        setInterviewSession({
          id: `INT-2027-${interview.interviewId}`,
          targetRole: interview.targetRole || (prof && prof.targetRole) || 'Backend Developer',
          status: interview.status || 'IN_PROGRESS',
          overallScore: Number(interview.overallScore || 0),
          rubric: interview.rubric || { technicalKnowledge: 0, projectUnderstanding: 0, problemSolving: 0, communication: 0 },
          summaryVerdict: interview.summaryVerdict || '',
          strengths: interview.strengths || '',
          improvements: interview.improvements || '',
          transcript: Array.isArray(interview.transcript) ? interview.transcript : []
        });
      } else {
        setInterviewSession(createEmptyInterview((prof && prof.targetRole) || targetUser?.targetRole));
      }

      // 6. Fetch Roadmap
      const road = await apiService.getRoadmap().catch(() => null);
      if (road) {
        const milestones = Array.isArray(road.milestones) ? road.milestones.map((m, idx) => ({
          id: m.id,
          week: m.week || m.weekNumber || idx + 1,
          title: m.title,
          skills: Array.isArray(m.skills) ? m.skills : (m.skillsCovered ? m.skillsCovered.split(',').map(s => s.trim()) : (m.actionItems ? m.actionItems.split(',').map(x => x.trim()) : [m.focusSkill || 'Competency'])),
          completed: !!(m.completed || m.isCompleted),
          action: m.action || m.actionItem || m.resources || m.description || 'Focus on target competency upskilling'
        })) : [];
        setRoadmap(milestones);
        setSkillGap({
          targetRole: road.targetRole || (prof && prof.targetRole) || 'Backend Developer',
          matchedSkills: Array.isArray(road.matchedSkills) ? road.matchedSkills : [],
          missingSkills: Array.isArray(road.missingSkills) ? road.missingSkills : (road.missingSkills ? road.missingSkills.split(',').map(s => s.trim()) : []),
          gapScore: road.gapScore || 0,
          isPlacementReady: !!road.isPlacementReady,
          durationWeeks: road.durationWeeks !== undefined ? road.durationWeeks : milestones.length,
          matchedSkillDetails: Array.isArray(road.matchedSkillDetails) ? road.matchedSkillDetails : [],
          missingSkillDetails: Array.isArray(road.missingSkillDetails) ? road.missingSkillDetails : []
        });
      } else {
        setRoadmap([]);
        setSkillGap(createEmptySkillGap((prof && prof.targetRole) || targetUser?.targetRole));
      }

      // 7. Fetch Matched Jobs & Real Applications
      const [matched, myApps] = await Promise.all([
        apiService.getMatchedJobs().catch(() => null),
        apiService.getMyApplications().catch(() => null)
      ]);
      const appStatusMap = new Map();
      if (Array.isArray(myApps)) {
        myApps.forEach(a => {
          if (a.jobId) appStatusMap.set(a.jobId, a.status);
        });
      }
      if (Array.isArray(matched) && matched.length > 0) {
        setJobs(matched.map(j => {
          const rawSt = j.rawStatus || appStatusMap.get(j.id) || j.status;
          let displayStatus = null;
          if (rawSt === 'SHORTLISTED') {
            displayStatus = 'Shortlisted';
          } else if (rawSt === 'APPLIED') {
            displayStatus = 'Application Submitted with Verified Passport';
          } else if (rawSt) {
            displayStatus = rawSt;
          } else if (j.applied) {
            displayStatus = 'Application Submitted with Verified Passport';
          }

          return {
            id: j.id,
            title: j.title,
            company: j.company || 'Enterprise Partner',
            location: j.location || 'Hybrid',
            type: j.type || 'Full-time',
            salary: j.salary || 'Competitive',
            matchScore: Math.round(Number(j.matchScore) || 0),
            verifiedMatches: Array.isArray(j.verifiedMatches) ? j.verifiedMatches : [],
            missingOrLow: Array.isArray(j.missingOrDeficit) ? j.missingOrDeficit : [],
            explanation: j.explanation || 'Verification required for custom alignment.',
            applied: !!j.applied || appStatusMap.has(j.id),
            status: displayStatus,
            rawStatus: rawSt,
            applicationId: j.applicationId,
            joiningLetterRole: j.joiningLetterRole,
            joiningLetterSalary: j.joiningLetterSalary,
            joiningLetterJoiningDate: j.joiningLetterJoiningDate,
            joiningLetterText: j.joiningLetterText,
            joiningLetterSentAt: j.joiningLetterSentAt,
            studentAcceptedAt: j.studentAcceptedAt,
            studentDeclinedAt: j.studentDeclinedAt,
            studentRemarks: j.studentRemarks,
            academicApprovedAt: j.academicApprovedAt,
            academicRejectedAt: j.academicRejectedAt,
            academicComments: j.academicComments,
            academicApproverName: j.academicApproverName
          };
        }));
      }
    } catch (err) {
      console.warn('[SkillProofContext] Live sync error:', err.message);
    }
  }, [currentUser]);

  // Synchronize on login, logout, or account switch
  useEffect(() => {
    if (!currentUser) {
      setStudentProfile(createEmptyProfile(null));
      setResumeData(createEmptyResume());
      setSkillMap([]);
      setGithubData(createEmptyGithub());
      setInterviewSession(createEmptyInterview(''));
      setSkillPassport(createEmptyPassport(null));
      setSkillGap(createEmptySkillGap(''));
      setRoadmap([]);
      setJobs([]);
      return;
    }

    setStudentProfile(createEmptyProfile(currentUser));
    setResumeData(createEmptyResume());
    setSkillMap([]);
    setGithubData(createEmptyGithub());
    setInterviewSession(createEmptyInterview(currentUser.targetRole));
    setSkillPassport(createEmptyPassport(currentUser));
    setSkillGap(createEmptySkillGap(currentUser.targetRole));
    setRoadmap([]);
    setJobs([]);
    loadLiveStudentData(currentUser);
  }, [currentUser?.email, currentUser?.id]);

  // Actions
  const applyForJob = async (jobId) => {
    try {
      await apiService.applyForJob(jobId);
    } catch (err) {
      console.warn('[SkillProofContext] applyForJob API note:', err.message);
    }
    setJobs(prev => prev.map(job => {
      if (job.id === jobId) {
        return { ...job, applied: true, status: 'Application Submitted with Verified Passport' };
      }
      return job;
    }));
  };

  const toggleRoadmapMilestone = async (weekNumOrId) => {
    const milestone = roadmap.find(r => r.week === weekNumOrId || r.id === weekNumOrId);
    if (milestone && milestone.id) {
      try {
        await apiService.toggleRoadmapMilestone(milestone.id);
      } catch (err) {
        console.warn('[SkillProofContext] toggleMilestone API note:', err.message);
      }
    }
    setRoadmap(prev => prev.map(item => {
      if (item.week === weekNumOrId || item.id === weekNumOrId) {
        return { ...item, completed: !item.completed };
      }
      return item;
    }));
  };

  const updateSkillScore = async (skillId, newScore, tierLevel) => {
    setSkillMap(prev => prev.map(s => {
      if (s.id === skillId) {
        const updatedScore = Math.round((s.score + newScore) / 2);
        return {
          ...s,
          score: updatedScore,
          verified: true,
          badge: updatedScore >= 80 ? 'GOLD' : (updatedScore >= 65 ? 'SILVER' : 'BRONZE')
        };
      }
      return s;
    }));

    try {
      await apiService.generatePassport();
      await loadLiveStudentData(currentUser);
    } catch (err) {
      console.warn('[SkillProofContext] generatePassport API note:', err.message);
    }
  };

  const changeTargetRole = async (newRole) => {
    try {
      const res = await apiService.updateTargetRole(newRole);
      if (res) {
        setSkillGap(prev => ({
          ...prev,
          targetRole: res.targetRole || newRole,
          gapScore: res.gapScore || 0,
          isPlacementReady: !!res.isPlacementReady,
          durationWeeks: res.durationWeeks !== undefined ? res.durationWeeks : (res.milestones ? res.milestones.length : 0),
          matchedSkills: Array.isArray(res.matchedSkills) ? res.matchedSkills : [],
          missingSkills: Array.isArray(res.missingSkills) ? res.missingSkills : [],
          matchedSkillDetails: Array.isArray(res.matchedSkillDetails) ? res.matchedSkillDetails : [],
          missingSkillDetails: Array.isArray(res.missingSkillDetails) ? res.missingSkillDetails : []
        }));

        if (Array.isArray(res.milestones)) {
          setRoadmap(res.milestones.map((m, idx) => ({
            id: m.id,
            week: m.week || m.weekNumber || idx + 1,
            title: m.title,
            skills: Array.isArray(m.skills) ? m.skills : (m.skillsCovered ? m.skillsCovered.split(',').map(s => s.trim()) : [m.focusSkill || 'Competency']),
            completed: !!(m.completed || m.isCompleted),
            action: m.action || m.actionItem || m.description || 'Focus on target competency upskilling'
          })));
        }
      }
      await loadLiveStudentData();
      return res;
    } catch (err) {
      console.warn('[SkillProofContext] changeTargetRole note:', err.message);
      throw err;
    }
  };

  const respondToOffer = async (applicationId, action, remarks = '') => {
    try {
      const res = await apiService.respondToOffer(applicationId, { action, remarks });
      await loadLiveStudentData(currentUser);
      window.dispatchEvent(new CustomEvent('skillproof_application_updated', {
        detail: { applicationId, status: res.status }
      }));
      return res;
    } catch (err) {
      console.warn('[SkillProofContext] respondToOffer error:', err.message);
      throw err;
    }
  };

  return (
    <SkillProofContext.Provider value={{
      studentProfile,
      setStudentProfile,
      resumeData,
      setResumeData,
      skillMap,
      setSkillMap,
      updateSkillScore,
      githubData,
      setGithubData,
      interviewSession,
      setInterviewSession,
      skillPassport,
      setSkillPassport,
      skillGap,
      setSkillGap,
      roadmap,
      setRoadmap,
      toggleRoadmapMilestone,
      changeTargetRole,
      jobs,
      setJobs,
      applyForJob,
      respondToOffer,
      loadLiveStudentData
    }}>
      {children}
    </SkillProofContext.Provider>
  );
};

export const useSkillProof = () => useContext(SkillProofContext);
