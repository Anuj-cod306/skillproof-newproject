package com.skillproof.controller;

import com.skillproof.service.*;
import lombok.RequiredArgsConstructor;
import org.springframework.core.io.Resource;
import org.springframework.http.HttpStatus;
import org.springframework.http.MediaType;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.Authentication;
import org.springframework.web.bind.annotation.*;
import org.springframework.web.multipart.MultipartFile;
import org.springframework.web.server.ResponseStatusException;

import java.util.*;

@RestController
@RequestMapping("/api/student")
@RequiredArgsConstructor
@CrossOrigin(origins = "*")
public class StudentController {

    private final StudentProfileService studentProfileService;
    private final ResumeService resumeService;
    private final GithubService githubService;
    private final AssessmentService assessmentService;
    private final InterviewService interviewService;
    private final RoadmapService roadmapService;
    private final StudentSkillService studentSkillService;

    private String getEmail(Authentication auth) {
        if (auth != null && auth.isAuthenticated() && !"anonymousUser".equals(auth.getName())) {
            return auth.getName();
        }
        throw new ResponseStatusException(HttpStatus.UNAUTHORIZED, "User is not authenticated");
    }

    // 1. Profile
    @GetMapping("/profile")
    public ResponseEntity<?> getProfile(Authentication auth) {
        return ResponseEntity.ok(studentProfileService.getStudentProfile(getEmail(auth)));
    }

    @PutMapping("/profile")
    public ResponseEntity<?> updateProfile(Authentication auth, @RequestBody StudentProfileService.ProfileUpdateRequest req) {
        return ResponseEntity.ok(studentProfileService.updateStudentProfile(getEmail(auth), req));
    }

    // 1.5 Skill Map (Competencies across 4 evidence tiers)
    @GetMapping("/skills")
    public ResponseEntity<?> getStudentSkills(Authentication auth) {
        return ResponseEntity.ok(studentSkillService.getStudentSkillMap(getEmail(auth)));
    }

    // 2. Resume Upload & AI Extraction (Tier 1)
    @PostMapping("/resume/upload")
    public ResponseEntity<?> uploadResume(Authentication auth, @RequestParam("file") MultipartFile file) {
        String email = getEmail(auth);
        try {
            return ResponseEntity.ok(resumeService.processResumeUpload(email, file));
        } catch (Exception e) {
            return ResponseEntity.badRequest().body(Map.of("error", e.getMessage()));
        }
    }

    @GetMapping("/resume/latest")
    public ResponseEntity<?> getLatestResume(Authentication auth) {
        return ResponseEntity.ok(resumeService.getLatestResume(getEmail(auth)));
    }

    @GetMapping("/resumes")
    public ResponseEntity<?> getStudentResumes(Authentication auth) {
        return ResponseEntity.ok(resumeService.getStudentResumes(getEmail(auth)));
    }

    @PostMapping("/resumes/{resumeId}/activate")
    public ResponseEntity<?> activateResume(Authentication auth, @PathVariable Long resumeId) {
        String email = getEmail(auth);
        try {
            return ResponseEntity.ok(resumeService.activateResume(email, resumeId));
        } catch (Exception e) {
            return ResponseEntity.badRequest().body(Map.of("error", e.getMessage()));
        }
    }

    @PostMapping("/resumes/{resumeId}/deactivate")
    public ResponseEntity<?> deactivateResume(Authentication auth, @PathVariable Long resumeId) {
        String email = getEmail(auth);
        try {
            return ResponseEntity.ok(resumeService.deactivateResume(email, resumeId));
        } catch (Exception e) {
            return ResponseEntity.badRequest().body(Map.of("error", e.getMessage()));
        }
    }

    @DeleteMapping("/resumes/{resumeId}")
    public ResponseEntity<?> deleteResume(Authentication auth, @PathVariable Long resumeId) {
        String email = getEmail(auth);
        try {
            return ResponseEntity.ok(resumeService.deleteResume(email, resumeId));
        } catch (Exception e) {
            return ResponseEntity.badRequest().body(Map.of("error", e.getMessage()));
        }
    }

    // 3. GitHub Verification (Tier 2)
    @PostMapping("/github/verify")
    public ResponseEntity<?> verifyGithub(Authentication auth, @RequestBody Map<String, String> body) {
        String username = body.get("username");
        if (username == null || username.isBlank()) {
            return ResponseEntity.badRequest().body(Map.of("error", "GitHub username is required."));
        }
        String email = getEmail(auth);
        try {
            return ResponseEntity.ok(githubService.verifyGithubProfile(email, username.trim()));
        } catch (Exception e) {
            return ResponseEntity.badRequest().body(Map.of("error", e.getMessage()));
        }
    }

    @GetMapping("/github/data")
    public ResponseEntity<?> getGithubData(Authentication auth) {
        return ResponseEntity.ok(githubService.getStudentGithubData(getEmail(auth)));
    }

    // 4. Skill Assessments (Tier 3)
    @GetMapping("/assessments/available")
    public ResponseEntity<?> getAvailableAssessments(Authentication auth) {
        return ResponseEntity.ok(assessmentService.getAvailableAssessments(getEmail(auth)));
    }

    @GetMapping("/assessments/{skillName}")
    public ResponseEntity<?> getAssessmentQuestions(@PathVariable String skillName) {
        return ResponseEntity.ok(assessmentService.getAssessmentQuestions(skillName));
    }

    public static class AssessmentSubmission {
        public Map<Long, String> answers;
    }

    @PostMapping("/assessments/{assessmentId}/submit")
    public ResponseEntity<?> submitAssessment(Authentication auth, @PathVariable Long assessmentId, @RequestBody AssessmentSubmission req) {
        String email = getEmail(auth);
        try {
            return ResponseEntity.ok(assessmentService.submitAssessmentAnswers(email, assessmentId, req.answers));
        } catch (Exception e) {
            return ResponseEntity.badRequest().body(Map.of("error", e.getMessage()));
        }
    }

    public static class AssessmentViolationRequest {
        public Map<Long, String> answers;
        public String reason;
        public Integer durationSeconds;
        public String recordingUrl;
    }

    @PostMapping("/assessments/{assessmentId}/violation")
    public ResponseEntity<?> reportAssessmentViolation(
            Authentication auth,
            @PathVariable Long assessmentId,
            @RequestBody(required = false) AssessmentViolationRequest req) {
        String email = getEmail(auth);
        try {
            Map<Long, String> answers = req != null ? req.answers : Collections.emptyMap();
            String reason = req != null ? req.reason : "Candidate left the assessment window or switched tabs.";
            Integer duration = req != null ? req.durationSeconds : 0;
            String recUrl = req != null ? req.recordingUrl : null;
            return ResponseEntity.ok(assessmentService.handleViolation(email, assessmentId, answers, reason, duration, recUrl));
        } catch (Exception e) {
            return ResponseEntity.badRequest().body(Map.of("error", e.getMessage()));
        }
    }

    @GetMapping({"/assessments/{assessmentId}/latest", "/assessments/latest"})
    public ResponseEntity<?> getLatestAssessmentResult(Authentication auth, @PathVariable(required = false) Long assessmentId) {
        return ResponseEntity.ok(assessmentService.getLatestAssessmentResult(getEmail(auth), assessmentId));
    }

    @GetMapping("/assessments/history")
    public ResponseEntity<?> getAssessmentHistory(Authentication auth) {
        return ResponseEntity.ok(assessmentService.getAssessmentHistory(getEmail(auth)));
    }

    @PostMapping("/assessments/{assessmentId}/recording")
    public ResponseEntity<?> uploadAssessmentRecording(
            Authentication auth,
            @PathVariable Long assessmentId,
            @RequestParam("file") MultipartFile file,
            @RequestParam(value = "durationSeconds", required = false) Integer durationSeconds) {
        try {
            java.nio.file.Path uploadDir = java.nio.file.Paths.get(System.getProperty("user.dir"), "uploads", "assessment_recordings").normalize();
            if (!java.nio.file.Files.exists(uploadDir)) {
                java.nio.file.Files.createDirectories(uploadDir);
            }
            String filename = "recording_assessment_" + assessmentId + "_" + System.currentTimeMillis() + ".webm";
            java.nio.file.Path targetPath = uploadDir.resolve(filename);
            java.nio.file.Files.copy(file.getInputStream(), targetPath, java.nio.file.StandardCopyOption.REPLACE_EXISTING);

            return ResponseEntity.ok(Map.of(
                    "success", true,
                    "recordingUrl", "/api/student/assessments/" + assessmentId + "/recording",
                    "recordingStatus", "RECORDED"
            ));
        } catch (Exception e) {
            return ResponseEntity.badRequest().body(Map.of("error", e.getMessage()));
        }
    }

    // 5. AI Interview (Tier 4) - Arena
    public static class StartInterviewRequest {
        public String targetRole;
        public String mode; // TECHNICAL, PROJECT_DEFENSE, COMPETITIVE_CODING, FULL_SIMULATION
    }

    @PostMapping("/interview/start")
    public ResponseEntity<?> startInterview(Authentication auth, @RequestBody(required = false) StartInterviewRequest req) {
        String role = (req != null) ? req.targetRole : null;
        String mode = (req != null) ? req.mode : "TECHNICAL";
        return ResponseEntity.ok(interviewService.startInterviewWithMode(getEmail(auth), role, mode));
    }

    public static class InterviewAnswerRequest {
        public Long interviewId;
        public String answer;
        public String code;
        public String language;
    }

    @PostMapping("/interview/answer")
    public ResponseEntity<?> answerInterviewQuestion(Authentication auth, @RequestBody InterviewAnswerRequest req) {
        if (req.interviewId == null) {
            return ResponseEntity.badRequest().body(Map.of("error", "interviewId is required."));
        }
        if (req.answer == null || req.answer.trim().isEmpty()) {
            return ResponseEntity.badRequest().body(Map.of("error", "Answer required. Please answer this question before continuing."));
        }
        String email = getEmail(auth);
        try {
            return ResponseEntity.ok(interviewService.submitAnswer(email, req.interviewId, req.answer, req.code, req.language));
        } catch (Exception e) {
            return ResponseEntity.badRequest().body(Map.of("error", e.getMessage()));
        }
    }

    public static class RunCodeRequest {
        public Long interviewId;
        public String code;
        public String language;
        public String problemId;
    }

    @PostMapping("/interview/run-code")
    public ResponseEntity<?> runInterviewCode(Authentication auth, @RequestBody RunCodeRequest req) {
        if (req.interviewId == null || req.code == null) {
            return ResponseEntity.badRequest().body(Map.of("error", "interviewId and code are required."));
        }
        String email = getEmail(auth);
        try {
            return ResponseEntity.ok(interviewService.runCode(email, req.interviewId, req.code, req.language, req.problemId != null ? req.problemId : "two-sum"));
        } catch (Exception e) {
            return ResponseEntity.badRequest().body(Map.of("error", e.getMessage()));
        }
    }

    public static class HintRequest {
        public Long interviewId;
        public String problemId;
    }

    @PostMapping("/interview/hint")
    public ResponseEntity<?> requestInterviewHint(Authentication auth, @RequestBody HintRequest req) {
        if (req.interviewId == null) {
            return ResponseEntity.badRequest().body(Map.of("error", "interviewId is required."));
        }
        String email = getEmail(auth);
        try {
            return ResponseEntity.ok(interviewService.requestHint(email, req.interviewId, req.problemId != null ? req.problemId : "two-sum"));
        } catch (Exception e) {
            return ResponseEntity.badRequest().body(Map.of("error", e.getMessage()));
        }
    }

    public static class EndInterviewRequest {
        public Long interviewId;
    }

    @PostMapping("/interview/end")
    public ResponseEntity<?> endInterviewEarly(Authentication auth, @RequestBody EndInterviewRequest req) {
        if (req.interviewId == null) {
            return ResponseEntity.badRequest().body(Map.of("error", "interviewId is required."));
        }
        String email = getEmail(auth);
        try {
            return ResponseEntity.ok(interviewService.endInterviewEarly(email, req.interviewId));
        } catch (Exception e) {
            return ResponseEntity.badRequest().body(Map.of("error", e.getMessage()));
        }
    }

    public static class InterviewViolationRequest {
        public String reason;
        public String draftAnswer;
        public String draftCode;
        public String language;
        public Integer durationSeconds;
        public String recordingUrl;
    }

    @PostMapping("/interview/{interviewId}/violation")
    public ResponseEntity<?> reportInterviewViolation(
            Authentication auth,
            @PathVariable Long interviewId,
            @RequestBody(required = false) InterviewViolationRequest req) {
        String email = getEmail(auth);
        try {
            String reason = req != null ? req.reason : "Candidate left the assessment window or switched tabs.";
            String draftAnswer = req != null ? req.draftAnswer : null;
            String draftCode = req != null ? req.draftCode : null;
            String lang = req != null ? req.language : "javascript";
            Integer duration = req != null ? req.durationSeconds : 0;
            String recUrl = req != null ? req.recordingUrl : null;
            return ResponseEntity.ok(interviewService.handleViolation(email, interviewId, reason, draftAnswer, draftCode, lang, duration, recUrl));
        } catch (Exception e) {
            return ResponseEntity.badRequest().body(Map.of("error", e.getMessage()));
        }
    }

    @PostMapping("/interview/{interviewId}/pause")
    public ResponseEntity<?> pauseInterview(Authentication auth, @PathVariable Long interviewId) {
        String email = getEmail(auth);
        try {
            return ResponseEntity.ok(interviewService.pauseInterview(email, interviewId));
        } catch (SecurityException se) {
            return ResponseEntity.status(HttpStatus.FORBIDDEN).body(Map.of("error", se.getMessage()));
        } catch (Exception e) {
            return ResponseEntity.badRequest().body(Map.of("error", e.getMessage()));
        }
    }

    @PostMapping("/interview/{interviewId}/resume")
    public ResponseEntity<?> resumeInterview(Authentication auth, @PathVariable Long interviewId) {
        String email = getEmail(auth);
        try {
            return ResponseEntity.ok(interviewService.resumeInterview(email, interviewId));
        } catch (SecurityException se) {
            return ResponseEntity.status(HttpStatus.FORBIDDEN).body(Map.of("error", se.getMessage()));
        } catch (Exception e) {
            return ResponseEntity.badRequest().body(Map.of("error", e.getMessage()));
        }
    }

    @GetMapping("/interview/latest")
    public ResponseEntity<?> getLatestInterview(Authentication auth) {
        return ResponseEntity.ok(interviewService.getLatestInterview(getEmail(auth)));
    }

    @PostMapping("/interview/{interviewId}/recording")
    public ResponseEntity<?> uploadInterviewRecording(
            Authentication auth,
            @PathVariable Long interviewId,
            @RequestParam("file") MultipartFile file,
            @RequestParam(value = "durationSeconds", required = false) Integer durationSeconds) {
        String email = getEmail(auth);
        try {
            return ResponseEntity.ok(interviewService.saveRecording(email, interviewId, file, durationSeconds));
        } catch (SecurityException e) {
            return ResponseEntity.status(HttpStatus.FORBIDDEN).body(Map.of("error", e.getMessage()));
        } catch (Exception e) {
            return ResponseEntity.badRequest().body(Map.of("error", e.getMessage()));
        }
    }

    @GetMapping("/interview/{interviewId}/recording")
    public ResponseEntity<?> getInterviewRecording(Authentication auth, @PathVariable Long interviewId) {
        String email = getEmail(auth);
        try {
            Resource resource = interviewService.getRecordingResource(email, interviewId);
            return ResponseEntity.ok()
                    .contentType(MediaType.parseMediaType("video/webm"))
                    .body(resource);
        } catch (SecurityException e) {
            return ResponseEntity.status(HttpStatus.FORBIDDEN).body(Map.of("error", e.getMessage()));
        } catch (Exception e) {
            return ResponseEntity.status(HttpStatus.NOT_FOUND).body(Map.of("error", e.getMessage()));
        }
    }

    @GetMapping("/interview/{interviewId}/coding-submissions")
    public ResponseEntity<?> getInterviewCodingSubmissions(Authentication auth, @PathVariable Long interviewId) {
        String email = getEmail(auth);
        try {
            return ResponseEntity.ok(interviewService.getCodingSubmissions(email, interviewId));
        } catch (Exception e) {
            return ResponseEntity.badRequest().body(Map.of("error", e.getMessage()));
        }
    }

    // 6. Skill Gap & Roadmap
    @GetMapping("/roadmap")
    public ResponseEntity<?> getRoadmap(Authentication auth) {
        return ResponseEntity.ok(roadmapService.getOrGenerateRoadmap(getEmail(auth)));
    }

    @PutMapping("/target-role")
    public ResponseEntity<?> updateTargetRole(Authentication auth, @RequestBody Map<String, String> body) {
        String newRole = body != null ? body.get("targetRole") : null;
        if (newRole == null || newRole.isBlank()) {
            return ResponseEntity.badRequest().body(Map.of("error", "targetRole is required."));
        }
        String email = getEmail(auth);
        try {
            return ResponseEntity.ok(roadmapService.updateStudentTargetRole(email, newRole));
        } catch (Exception e) {
            return ResponseEntity.badRequest().body(Map.of("error", e.getMessage()));
        }
    }

    @PostMapping("/roadmap/role")
    public ResponseEntity<?> switchRole(Authentication auth, @RequestBody Map<String, String> body) {
        return updateTargetRole(auth, body);
    }

    @PostMapping("/roadmap/milestones/{milestoneId}/toggle")
    public ResponseEntity<?> toggleMilestone(@PathVariable Long milestoneId) {
        try {
            return ResponseEntity.ok(roadmapService.toggleMilestone(milestoneId));
        } catch (Exception e) {
            return ResponseEntity.badRequest().body(Map.of("error", e.getMessage()));
        }
    }
}
