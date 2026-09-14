import React from 'react';
import { Routes, Route, Navigate } from 'react-router-dom';

// Layouts
import { PublicLayout } from '../layouts/PublicLayout';
import { DashboardLayout } from '../layouts/DashboardLayout';

// Public Pages
import { HomePage } from '../pages/public/HomePage';
import { AboutPage } from '../pages/public/AboutPage';
import { HowItWorksPage } from '../pages/public/HowItWorksPage';
import { FeaturesPage } from '../pages/public/FeaturesPage';
import { OpportunitiesPage } from '../pages/public/OpportunitiesPage';
import { ContactPage } from '../pages/public/ContactPage';
import { PublicPassportView } from '../pages/public/PublicPassportView';

// Auth Pages (reorganized to pages/auth/)
import { LoginPage } from '../pages/auth/LoginPage';
import { RegisterPage } from '../pages/auth/RegisterPage';

// Student Portal Pages
import { StudentDashboard } from '../pages/student/StudentDashboard';
import { StudentProfile } from '../pages/student/StudentProfile';
import { ResumeUpload } from '../pages/student/ResumeUpload';
import { SkillMapPage } from '../pages/student/SkillMapPage';
import { SkillAssessmentPage } from '../pages/student/SkillAssessmentPage';
import { GithubVerificationPage } from '../pages/student/GithubVerificationPage';
import { CompetitiveCodingPage } from '../pages/student/CompetitiveCodingPage';
import { AIInterviewPage } from '../pages/student/AIInterviewPage';
import { SkillPassportPage } from '../pages/student/SkillPassportPage';
import { SkillGapRoadmapPage } from '../pages/student/SkillGapRoadmapPage';
import { JobsOpportunitiesPage } from '../pages/student/JobsOpportunitiesPage';

// Industry Portal Pages
import { IndustryDashboard } from '../pages/industry/IndustryDashboard';
import { PostJobPage } from '../pages/industry/PostJobPage';
import { CandidateSearchPage } from '../pages/industry/CandidateSearchPage';
import { CollaborationsPage } from '../pages/industry/CollaborationsPage';

// Academician Portal Pages (reorganized to pages/academician/)
import { AcademiaDashboard } from '../pages/academician/AcademiaDashboard';
import { FacultyOpportunitiesPage } from '../pages/academician/FacultyOpportunitiesPage';
import { StudentMentorshipPage } from '../pages/academician/StudentMentorshipPage';
import { OpportunityApprovalsPage } from '../pages/academician/OpportunityApprovalsPage';

// Institution Portal Pages
import { InstitutionDashboard } from '../pages/institution/InstitutionDashboard';
import { DemandVsAvailabilityPage } from '../pages/institution/DemandVsAvailabilityPage';

export const AppRoutes = () => {
  return (
    <Routes>
      {/* Public Pages Layout */}
      <Route element={<PublicLayout />}>
        <Route path="/" element={<HomePage />} />
        <Route path="/about" element={<AboutPage />} />
        <Route path="/how-it-works" element={<HowItWorksPage />} />
        <Route path="/features" element={<FeaturesPage />} />
        <Route path="/opportunities" element={<OpportunitiesPage />} />
        <Route path="/contact" element={<ContactPage />} />
        <Route path="/login" element={<LoginPage />} />
        <Route path="/register" element={<RegisterPage />} />
        <Route path="/auth/login" element={<LoginPage />} />
        <Route path="/auth/register" element={<RegisterPage />} />
        <Route path="/verify/:passportId" element={<PublicPassportView />} />
      </Route>

      {/* Student Portal Routes */}
      <Route path="/student" element={<DashboardLayout />}>
        <Route index element={<Navigate to="/student/dashboard" replace />} />
        <Route path="dashboard" element={<StudentDashboard />} />
        <Route path="profile" element={<StudentProfile />} />
        <Route path="resume-upload" element={<ResumeUpload />} />
        <Route path="skill-map" element={<SkillMapPage />} />
        <Route path="assessments" element={<SkillAssessmentPage />} />
        <Route path="skill-assessment" element={<Navigate to="/student/assessments" replace />} />
        <Route path="github-verify" element={<GithubVerificationPage />} />
        <Route path="competitive-coding" element={<CompetitiveCodingPage />} />
        <Route path="ai-interview" element={<AIInterviewPage />} />
        <Route path="passport" element={<SkillPassportPage />} />
        <Route path="skill-passport" element={<Navigate to="/student/passport" replace />} />
        <Route path="skill-gap-roadmap" element={<SkillGapRoadmapPage />} />
        <Route path="roadmap" element={<Navigate to="/student/skill-gap-roadmap" replace />} />
        <Route path="jobs" element={<JobsOpportunitiesPage />} />
      </Route>


      {/* Industry Portal Routes */}
      <Route path="/industry" element={<DashboardLayout />}>
        <Route index element={<Navigate to="/industry/dashboard" replace />} />
        <Route path="dashboard" element={<IndustryDashboard />} />
        <Route path="post-job" element={<PostJobPage />} />
        <Route path="candidates" element={<CandidateSearchPage />} />
        <Route path="collaborations" element={<CollaborationsPage />} />
      </Route>

      {/* Academician Portal Routes (supports both /academician and /academia) */}
      <Route path="/academician" element={<DashboardLayout />}>
        <Route index element={<Navigate to="/academician/dashboard" replace />} />
        <Route path="dashboard" element={<AcademiaDashboard />} />
        <Route path="opportunities" element={<FacultyOpportunitiesPage />} />
        <Route path="mentorship" element={<StudentMentorshipPage />} />
        <Route path="approvals" element={<OpportunityApprovalsPage />} />
      </Route>
      <Route path="/academia" element={<Navigate to="/academician" replace />} />
      <Route path="/academia/*" element={<Navigate to="/academician" replace />} />

      {/* Institution Portal Routes */}
      <Route path="/institution" element={<DashboardLayout />}>
        <Route index element={<Navigate to="/institution/dashboard" replace />} />
        <Route path="dashboard" element={<InstitutionDashboard />} />
        <Route path="demand-vs-availability" element={<DemandVsAvailabilityPage />} />
      </Route>

      {/* Fallback to Home */}
      <Route path="*" element={<Navigate to="/" replace />} />
    </Routes>
  );
};

export default AppRoutes;
