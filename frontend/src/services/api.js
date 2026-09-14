/**
 * Centralized API Service for SKILLPROOF
 * Interfaces with Spring Boot Backend at http://localhost:8080/api
 */

const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || 'http://localhost:8080/api';

class ApiService {
  constructor() {
    this.baseUrl = API_BASE_URL;
  }

  getHeaders(isFormData = false) {
    const token = localStorage.getItem('skillproof_token');
    const headers = {};
    if (!isFormData) {
      headers['Content-Type'] = 'application/json';
    }
    if (token) {
      headers['Authorization'] = `Bearer ${token}`;
    }
    return headers;
  }

  async request(endpoint, options = {}, isFormData = false) {
    const url = `${this.baseUrl}${endpoint}`;
    const config = {
      ...options,
      headers: {
        ...this.getHeaders(isFormData),
        ...options.headers
      }
    };

    try {
      const response = await fetch(url, config);
      if (!response.ok) {
        const errBody = await response.json().catch(() => ({}));
        throw new Error(errBody.error || errBody.message || `HTTP error! status: ${response.status}`);
      }
      return await response.json();
    } catch (error) {
      console.warn(`[ApiService] Request to ${endpoint} failed:`, error.message);
      throw error;
    }
  }

  // 1. Authentication
  async register(data) {
    return this.request('/auth/register', {
      method: 'POST',
      body: JSON.stringify(data)
    });
  }

  async login(email, password, role) {
    return this.request('/auth/login', {
      method: 'POST',
      body: JSON.stringify({ email, password, role })
    });
  }

  async getMe() {
    return this.request('/auth/me');
  }

  async getDemoPersonas() {
    return this.request('/auth/demo-users');
  }

  // 2. Student Profile
  async getStudentProfile() {
    return this.request('/student/profile');
  }

  async updateStudentProfile(profileData) {
    return this.request('/student/profile', {
      method: 'PUT',
      body: JSON.stringify(profileData)
    });
  }

  // 3. Resume Upload & AI Extraction (Tier 1)
  async uploadResume(file) {
    const formData = new FormData();
    formData.append('file', file);
    return this.request('/student/resume/upload', {
      method: 'POST',
      body: formData
    }, true);
  }

  async getLatestResume() {
    return this.request('/student/resume/latest');
  }

  async getStudentResumes() {
    return this.request('/student/resumes');
  }

  async activateResume(resumeId) {
    return this.request(`/student/resumes/${resumeId}/activate`, {
      method: 'POST'
    });
  }

  async deactivateResume(resumeId) {
    return this.request(`/student/resumes/${resumeId}/deactivate`, {
      method: 'POST'
    });
  }

  async deleteResume(resumeId) {
    return this.request(`/student/resumes/${resumeId}`, {
      method: 'DELETE'
    });
  }

  // 3.5 Student Skill Map (Competencies across 4 evidence tiers)
  async getStudentSkills() {
    return this.request('/student/skills');
  }

  // 4. GitHub Verification (Tier 2)
  async verifyGithub(username) {
    return this.request('/student/github/verify', {
      method: 'POST',
      body: JSON.stringify({ username })
    });
  }

  async getGithubData() {
    return this.request('/student/github/data');
  }

  // 4.5 Competitive Coding Verification
  async getCompetitiveCodingData() {
    return this.request('/student/competitive-coding');
  }

  async connectLeetCode(username) {
    return this.request('/student/competitive-coding/leetcode/connect', {
      method: 'POST',
      body: JSON.stringify({ username })
    });
  }

  async verifyLeetCode(username) {
    return this.request('/student/competitive-coding/leetcode/verify', {
      method: 'POST',
      body: username ? JSON.stringify({ username }) : undefined
    });
  }

  async reverifyLeetCode() {
    return this.request('/student/competitive-coding/leetcode/reverify', {
      method: 'POST'
    });
  }

  async connectCodeforces(username) {
    return this.request('/student/competitive-coding/codeforces/connect', {
      method: 'POST',
      body: JSON.stringify({ username })
    });
  }

  async verifyCodeforces(handle) {
    return this.request('/student/competitive-coding/codeforces/verify', {
      method: 'POST',
      body: handle ? JSON.stringify({ handle, username: handle }) : undefined
    });
  }

  async reverifyCodeforces() {
    return this.request('/student/competitive-coding/codeforces/reverify', {
      method: 'POST'
    });
  }

  async disconnectCompetitiveCoding(platform) {
    return this.request(`/student/competitive-coding/${platform}`, {
      method: 'DELETE'
    });
  }

  // 5. Skill Assessment (Tier 3)
  async getAvailableAssessments() {
    return this.request('/student/assessments/available');
  }

  async getAssessmentQuestions(skillName) {
    return this.request(`/student/assessments/${encodeURIComponent(skillName)}`);
  }

  async submitAssessment(assessmentId, answers) {
    return this.request(`/student/assessments/${assessmentId}/submit`, {
      method: 'POST',
      body: JSON.stringify({ answers })
    });
  }

  async getAssessmentHistory() {
    return this.request('/student/assessments/history');
  }

  async startInterview(roleOrMode, modeOrRole = 'TECHNICAL') {
    const validModes = ['TECHNICAL', 'PROJECT_DEFENSE', 'COMPETITIVE_CODING', 'FULL_SIMULATION'];
    let mode = 'TECHNICAL';
    let targetRole = 'Frontend Developer';

    if (validModes.includes(roleOrMode)) {
      mode = roleOrMode;
      targetRole = modeOrRole && !validModes.includes(modeOrRole) ? modeOrRole : 'Frontend Developer';
    } else {
      targetRole = roleOrMode || 'Frontend Developer';
      mode = validModes.includes(modeOrRole) ? modeOrRole : 'TECHNICAL';
    }

    return this.request('/student/interview/start', {
      method: 'POST',
      body: JSON.stringify({ targetRole, mode })
    });
  }

  async submitInterviewAnswer(interviewId, answer, code = null, language = null) {
    return this.request('/student/interview/answer', {
      method: 'POST',
      body: JSON.stringify({ interviewId, answer, code, language })
    });
  }

  async runInterviewCode(interviewId, code, language = 'javascript', problemId = 'two-sum') {
    return this.request('/student/interview/run-code', {
      method: 'POST',
      body: JSON.stringify({ interviewId, code, language, problemId })
    });
  }

  async requestInterviewHint(interviewId, problemId = 'two-sum') {
    return this.request('/student/interview/hint', {
      method: 'POST',
      body: JSON.stringify({ interviewId, problemId })
    });
  }

  async endInterviewEarly(interviewId) {
    return this.request('/student/interview/end', {
      method: 'POST',
      body: JSON.stringify({ interviewId })
    });
  }

  async pauseInterview(interviewId) {
    return this.request(`/student/interview/${interviewId}/pause`, {
      method: 'POST'
    });
  }

  async resumeInterview(interviewId) {
    return this.request(`/student/interview/${interviewId}/resume`, {
      method: 'POST'
    });
  }

  async getLatestInterview() {
    return this.request('/student/interview/latest');
  }

  // 7. Verified Skill Passport (Hero Feature)
  async getMyPassport() {
    return this.request('/passports/my-passport');
  }

  async generatePassport() {
    return this.request('/passports/generate', {
      method: 'POST'
    });
  }

  async recalibratePassport() {
    return this.request('/passports/recalibrate', {
      method: 'POST'
    });
  }

  async getPublicPassport(passportHash) {
    return this.request(`/passports/public/${passportHash}`);
  }

  // 8. Skill Gap & Roadmap
  async getRoadmap() {
    return this.request('/student/roadmap');
  }

  async updateTargetRole(targetRole) {
    return this.request('/student/target-role', {
      method: 'PUT',
      body: JSON.stringify({ targetRole })
    });
  }

  async toggleRoadmapMilestone(milestoneId) {
    return this.request(`/student/roadmap/milestones/${milestoneId}/toggle`, {
      method: 'POST'
    });
  }

  // 9. Jobs & Opportunities
  async getJobs() {
    return this.request('/jobs');
  }

  async getMatchedJobs() {
    return this.request('/jobs/matched');
  }

  async createJob(jobData) {
    return this.request('/jobs', {
      method: 'POST',
      body: JSON.stringify(jobData)
    });
  }

  async applyForJob(jobId) {
    return this.request(`/jobs/${jobId}/apply`, {
      method: 'POST'
    });
  }

  async getMyApplications() {
    return this.request('/jobs/my-applications');
  }

  // 10. Industry Portal
  async getCandidates(search, skill, minReadiness) {
    let q = '';
    if (search) q += `search=${encodeURIComponent(search)}&`;
    if (skill && skill !== 'ALL') q += `skill=${encodeURIComponent(skill)}&`;
    if (minReadiness !== undefined && minReadiness !== null) q += `minReadiness=${minReadiness}&`;
    return this.request(`/industry/candidates?${q}`);
  }

  async getPublicPassport(passportHash) {
    return this.request(`/passports/public/${encodeURIComponent(passportHash)}`);
  }

  async getCompanyApplications() {
    return this.request('/industry/applications');
  }

  async updateApplicationStatus(applicationId, status) {
    return this.request(`/industry/applications/${applicationId}/status`, {
      method: 'PUT',
      body: JSON.stringify({ status })
    });
  }

  async sendJoiningLetter(applicationId, letterData) {
    return this.request(`/industry/applications/${applicationId}/send-joining-letter`, {
      method: 'POST',
      body: JSON.stringify(letterData)
    });
  }

  async respondToOffer(applicationId, data) {
    return this.request(`/jobs/applications/${applicationId}/respond`, {
      method: 'POST',
      body: JSON.stringify(data)
    });
  }

  // 11. Academician Portal
  async getFacultyPrograms(type) {
    const q = type ? `?type=${encodeURIComponent(type)}` : '';
    return this.request(`/academia/programs${q}`);
  }

  async createFacultyProgram(prog) {
    return this.request('/academia/programs', {
      method: 'POST',
      body: JSON.stringify(prog)
    });
  }

  async nominateFacultyProgram(programId) {
    return this.request(`/academia/programs/${programId}/nominate`, {
      method: 'POST'
    });
  }

  async getMyNominations() {
    return this.request('/academia/my-nominations');
  }

  async getCollaborativeProjects() {
    return this.request('/academia/projects');
  }

  async createCollaborativeProject(proj) {
    return this.request('/academia/projects', {
      method: 'POST',
      body: JSON.stringify(proj)
    });
  }

  async getMentorshipStudents() {
    return this.request('/academia/mentorship/students');
  }

  async getMentorshipStudentDetail(studentId) {
    return this.request(`/academia/mentorship/students/${studentId}`);
  }

  async updateStudentEndorsement(studentId, data = {}) {
    return this.request(`/academia/mentorship/students/${studentId}/endorsement`, {
      method: 'PUT',
      body: JSON.stringify(data)
    });
  }

  async getOpportunityApprovals() {
    return this.request('/academia/opportunity-approvals');
  }

  async respondToOpportunityApproval(applicationId, data = {}) {
    return this.request(`/academia/opportunity-approvals/${applicationId}/respond`, {
      method: 'POST',
      body: JSON.stringify(data)
    });
  }

  // 12. Persistent Notifications
  async getNotifications() {
    return this.request('/notifications');
  }

  async markNotificationAsRead(id) {
    return this.request(`/notifications/${id}/read`, {
      method: 'PUT'
    });
  }

  async markAllNotificationsAsRead() {
    return this.request('/notifications/read-all', {
      method: 'PUT'
    });
  }

  // 13. Institutional Analytics
  async getInstitutionOverview() {
    return this.request('/analytics/institution');
  }

  async getDemandVsAvailability() {
    return this.request('/analytics/demand-vs-availability');
  }

  // 14. AI Interview Arena (Tier 4)
  async getLatestInterview() {
    return this.request('/student/interview/latest');
  }

  async startInterview(roleOrMode, modeOrRole = 'TECHNICAL') {
    const validModes = ['TECHNICAL', 'PROJECT_DEFENSE', 'COMPETITIVE_CODING', 'FULL_SIMULATION'];
    let mode = 'TECHNICAL';
    let targetRole = 'Frontend Developer';

    if (validModes.includes(roleOrMode)) {
      mode = roleOrMode;
      targetRole = modeOrRole && !validModes.includes(modeOrRole) ? modeOrRole : 'Frontend Developer';
    } else {
      targetRole = roleOrMode || 'Frontend Developer';
      mode = validModes.includes(modeOrRole) ? modeOrRole : 'TECHNICAL';
    }

    return this.request('/student/interview/start', {
      method: 'POST',
      body: JSON.stringify({ targetRole, mode })
    });
  }

  async submitInterviewAnswer(interviewId, answer, code = null, language = 'javascript') {
    return this.request('/student/interview/answer', {
      method: 'POST',
      body: JSON.stringify({ interviewId, answer, code, language })
    });
  }

  async runInterviewCode(interviewId, code, language = 'javascript', problemId = 'two-sum') {
    return this.request('/student/interview/run-code', {
      method: 'POST',
      body: JSON.stringify({ interviewId, code, language, problemId })
    });
  }

  async requestInterviewHint(interviewId, problemId = 'two-sum') {
    return this.request('/student/interview/hint', {
      method: 'POST',
      body: JSON.stringify({ interviewId, problemId })
    });
  }

  async endInterviewEarly(interviewId) {
    return this.request('/student/interview/end', {
      method: 'POST',
      body: JSON.stringify({ interviewId })
    });
  }

  async uploadInterviewRecording(interviewId, formData) {
    return this.request(`/student/interview/${interviewId}/recording`, {
      method: 'POST',
      body: formData
    }, true);
  }

  async reportInterviewViolation(interviewId, payload) {
    return this.request(`/student/interview/${interviewId}/violation`, {
      method: 'POST',
      body: JSON.stringify(payload)
    });
  }

  async reportAssessmentViolation(assessmentId, payload) {
    return this.request(`/student/assessments/${assessmentId}/violation`, {
      method: 'POST',
      body: JSON.stringify(payload)
    });
  }

  async getLatestAssessmentResult(assessmentId = null) {
    const url = assessmentId ? `/student/assessments/${assessmentId}/latest` : '/student/assessments/latest';
    return this.request(url);
  }

  async uploadAssessmentRecording(assessmentId, formData) {
    return this.request(`/student/assessments/${assessmentId}/recording`, {
      method: 'POST',
      body: formData
    }, true);
  }

  getInterviewRecordingUrl(interviewId) {
    return `${this.baseUrl}/student/interview/${interviewId}/recording`;
  }

  async getInterviewCodingSubmissions(interviewId) {
    return this.request(`/student/interview/${interviewId}/coding-submissions`);
  }
}

export const apiService = new ApiService();
export const api = apiService;
export default apiService;
