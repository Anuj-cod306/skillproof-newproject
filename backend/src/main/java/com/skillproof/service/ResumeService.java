package com.skillproof.service;

import com.fasterxml.jackson.databind.ObjectMapper;
import com.skillproof.entity.*;
import com.skillproof.repository.*;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.apache.pdfbox.Loader;
import org.apache.pdfbox.pdmodel.PDDocument;
import org.apache.pdfbox.text.PDFTextStripper;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.web.multipart.MultipartFile;

import java.io.File;
import java.io.IOException;
import java.math.BigDecimal;
import java.nio.file.Files;
import java.nio.file.Path;
import java.nio.file.Paths;
import java.nio.file.StandardCopyOption;
import java.time.LocalDateTime;
import java.util.*;

@Service
@RequiredArgsConstructor
@Slf4j
public class ResumeService {

    private final ResumeRepository resumeRepository;
    private final ExtractedSkillRepository extractedSkillRepository;
    private final StudentSkillRepository studentSkillRepository;
    private final SkillRepository skillRepository;
    private final StudentProfileService studentProfileService;
    private final LlmService llmService;
    private final GithubRepositoryRepository githubRepositoryRepository;
    private final AssessmentResultRepository assessmentResultRepository;
    private final InterviewRepository interviewRepository;
    private final InterviewTurnRepository interviewTurnRepository;
    private final InterviewEvaluationRepository interviewEvaluationRepository;
    private final PassportService passportService;
    private final VerificationEngineService verificationEngineService;
    private final ObjectMapper objectMapper = new ObjectMapper();

    private final Path uploadDir = Paths.get("uploads", "resumes");

    @Transactional
    public Map<String, Object> processResumeUpload(String userEmail, MultipartFile file) throws IOException {
        if (file.isEmpty()) {
            throw new IllegalArgumentException("Uploaded resume file is empty.");
        }

        String originalFilename = file.getOriginalFilename();
        if (originalFilename == null || !originalFilename.toLowerCase().endsWith(".pdf")) {
            throw new IllegalArgumentException("Only PDF resumes are supported (.pdf).");
        }

        if (file.getSize() > 15 * 1024 * 1024) {
            throw new IllegalArgumentException("Resume file size exceeds maximum limit of 15MB.");
        }

        // 1. Store file on local filesystem
        if (!Files.exists(uploadDir)) {
            Files.createDirectories(uploadDir);
        }

        Student student = studentProfileService.getStudentByUserEmail(userEmail);

        String storedFileName = "student_" + student.getId() + "_" + System.currentTimeMillis() + ".pdf";
        Path targetPath = uploadDir.resolve(storedFileName);
        Files.copy(file.getInputStream(), targetPath, StandardCopyOption.REPLACE_EXISTING);

        // 2. Extract text with Apache PDFBox
        String extractedRawText;
        try (PDDocument document = Loader.loadPDF(file.getBytes())) {
            PDFTextStripper stripper = new PDFTextStripper();
            extractedRawText = stripper.getText(document);
        } catch (Exception e) {
            log.error("[ResumeService] PDF extraction error: {}", e.getMessage());
            throw new IllegalArgumentException("Failed to read PDF file: " + e.getMessage());
        }

        if (extractedRawText == null || extractedRawText.trim().length() < 10) {
            throw new IllegalArgumentException("The uploaded PDF does not contain readable text. Please upload a standard text-based PDF resume.");
        }

        // 3. Real AI extraction with LlmService
        LlmService.ResumeAnalysisResult analysis = llmService.analyzeResume(extractedRawText);
        if (analysis.skills == null || analysis.skills.isEmpty()) {
            throw new IllegalArgumentException("No technical skills could be detected from the uploaded resume. Please ensure your resume lists your technical skills clearly.");
        }

        // 4. Mark all existing resumes of this student as INACTIVE
        List<Resume> existingResumes = resumeRepository.findByStudentIdOrderByUploadedAtDesc(student.getId());
        for (Resume r : existingResumes) {
            r.setIsActive(false);
            r.setStatus("INACTIVE");
            resumeRepository.save(r);
        }

        // 5. Save new Resume entity in database as ACTIVE
        String analysisJson = objectMapper.writeValueAsString(analysis);
        Resume resume = Resume.builder()
                .studentId(student.getId())
                .fileName(originalFilename)
                .fileUrl(targetPath.toAbsolutePath().toString())
                .rawText(extractedRawText)
                .parsedContentJson(analysisJson)
                .aiSummary(analysis.summary)
                .parsingStatus("COMPLETED")
                .isActive(true)
                .status("ACTIVE")
                .uploadedAt(LocalDateTime.now())
                .build();

        resume = resumeRepository.save(resume);

        // 6. Save extracted skill entities with resumeId
        for (String skillName : analysis.skills) {
            String category = resolveSkillCategory(skillName);
            double confidence = 0.75;
            if (analysis.skillConfidence != null && analysis.skillConfidence.containsKey(skillName)) {
                confidence = analysis.skillConfidence.get(skillName);
            }

            ExtractedSkill es = ExtractedSkill.builder()
                    .resumeId(resume.getId())
                    .skillName(skillName)
                    .category(category)
                    .confidenceScore(BigDecimal.valueOf(confidence))
                    .build();
            extractedSkillRepository.save(es);
        }

        // 7. Reconcile student skills for this active resume
        reconcileStudentSkillsForActiveResume(student, resume, analysis);

        // 8. Immediately synchronize Skill Passport and readiness
        try {
            passportService.generateOrUpdatePassport(userEmail);
        } catch (Exception e) {
            log.warn("[ResumeService] Passport update warning: {}", e.getMessage());
        }

        Map<String, Object> response = new HashMap<>();
        response.put("resumeId", resume.getId());
        response.put("fileName", originalFilename);
        response.put("fileSize", (file.getSize() / 1024) + " KB");
        response.put("uploadedAt", resume.getUploadedAt().toString());
        response.put("isActive", true);
        response.put("status", "ACTIVE");
        response.put("aiSummary", analysis.summary);
        response.put("extractedSkills", analysis.skills);
        response.put("extractedProjects", analysis.projects);
        response.put("education", analysis.education);
        response.put("experience", analysis.experience);
        response.put("desiredRole", analysis.desiredRole);

        return response;
    }

    public void reconcileStudentSkillsForActiveResume(Student student, Resume activeResume, LlmService.ResumeAnalysisResult analysis) {
        List<StudentSkill> currentStudentSkills = studentSkillRepository.findByStudentId(student.getId());
        List<GithubRepository> repos = githubRepositoryRepository.findByStudentId(student.getId());
        List<AssessmentResult> assessments = assessmentResultRepository.findByStudentId(student.getId());
        Optional<Interview> latestCompletedInterview = interviewRepository.findByStudentIdOrderByCreatedAtDesc(student.getId()).stream()
                .filter(i -> "COMPLETED".equalsIgnoreCase(i.getStatus()))
                .findFirst();
        double overallInterviewScore = latestCompletedInterview
                .map(i -> i.getOverallScore() != null ? i.getOverallScore().doubleValue() : 0.0)
                .orElse(0.0);
        String interviewDiscussionText = verificationEngineService.buildInterviewDiscussionText(latestCompletedInterview.orElse(null), interviewTurnRepository);
        String assessedSkills = latestCompletedInterview
                .flatMap(i -> interviewEvaluationRepository.findByInterviewId(i.getId()))
                .map(InterviewEvaluation::getAssessedSkills)
                .orElse("");
        String interviewTargetRole = latestCompletedInterview
                .map(Interview::getRoleTargeted)
                .orElse("");
        double avgGitScore = repos.isEmpty() ? 0.0 : repos.stream().mapToDouble(r -> r.getEvidenceScore().doubleValue()).average().orElse(0.0);

        Set<String> activeSkillsLower = new HashSet<>();
        Map<String, Double> skillConfidenceMap = new HashMap<>();

        if (activeResume != null) {
            if (analysis != null && analysis.skills != null) {
                for (String s : analysis.skills) {
                    activeSkillsLower.add(s.trim().toLowerCase());
                    double conf = 0.75;
                    if (analysis.skillConfidence != null && analysis.skillConfidence.containsKey(s)) {
                        conf = analysis.skillConfidence.get(s);
                    }
                    skillConfidenceMap.put(s.trim().toLowerCase(), conf);
                }
            } else {
                List<ExtractedSkill> extracted = extractedSkillRepository.findByResumeId(activeResume.getId());
                for (ExtractedSkill es : extracted) {
                    activeSkillsLower.add(es.getSkillName().trim().toLowerCase());
                    skillConfidenceMap.put(es.getSkillName().trim().toLowerCase(), es.getConfidenceScore() != null ? es.getConfidenceScore().doubleValue() : 0.75);
                }
            }
        }

        // 1. Reconcile existing student skills that are NOT in the active resume
        for (StudentSkill ss : currentStudentSkills) {
            Skill skill = skillRepository.findById(ss.getSkillId()).orElse(null);
            if (skill == null) {
                studentSkillRepository.delete(ss);
                continue;
            }

            String existingSkillName = skill.getName();
            boolean inActiveResume = activeSkillsLower.contains(existingSkillName.toLowerCase());

            if (!inActiveResume) {
                // Check if this skill has real higher-tier evidence
                double gitScore = verificationEngineService.calculateSkillSpecificGithubEvidence(existingSkillName, repos);
                boolean hasGit = gitScore > 0;

                double quizScore = assessments.stream()
                        .filter(ar -> ar.getSkillName() != null
                                && (ar.getSkillName().equalsIgnoreCase(existingSkillName)
                                        || ar.getSkillName().toLowerCase().contains(existingSkillName.toLowerCase()))
                                && ar.getScorePercentage() != null
                                && ar.getScorePercentage().doubleValue() >= 50.0)
                        .mapToDouble(ar -> ar.getScorePercentage().doubleValue())
                        .max().orElse(0.0);

                double skillInterviewScore = (overallInterviewScore > 0 && verificationEngineService.isSkillCoveredInInterview(existingSkillName, assessedSkills, interviewTargetRole, interviewDiscussionText))
                        ? overallInterviewScore : 0.0;
                boolean hasInterview = skillInterviewScore > 0;

                if (hasGit || quizScore > 0 || hasInterview) {
                    // Retain higher-tier evidence, but clear resume claim
                    ss.setSourceResumeId(null);
                    ss.setSelfClaimScore(BigDecimal.ZERO);
                    BigDecimal composite = verificationEngineService.calculateVerifiedScore(0.0, gitScore, quizScore, skillInterviewScore);
                    ss.setVerifiedScore(composite);
                    ss.setIsVerified(composite.doubleValue() >= 50.0);
                    ss.setVerificationTier(hasInterview ? 4 : (quizScore > 0 ? 3 : 2));
                    studentSkillRepository.save(ss);
                } else {
                    // Pure Tier-1 Resume claim or stale skill with no other evidence -> REMOVE
                    studentSkillRepository.delete(ss);
                }
            }
        }

        // 2. Add or update skills present in active resume
        if (activeResume != null) {
            List<String> skillsToAdd = new ArrayList<>();
            if (analysis != null && analysis.skills != null) {
                skillsToAdd.addAll(analysis.skills);
            } else {
                List<ExtractedSkill> extracted = extractedSkillRepository.findByResumeId(activeResume.getId());
                for (ExtractedSkill es : extracted) {
                    skillsToAdd.add(es.getSkillName());
                }
            }

            for (String skillName : skillsToAdd) {
                String category = resolveSkillCategory(skillName);
                double confidence = skillConfidenceMap.getOrDefault(skillName.trim().toLowerCase(), 0.75);

                Skill masterSkill = skillRepository.findByNameIgnoreCase(skillName)
                        .orElseGet(() -> skillRepository.save(Skill.builder()
                                .name(skillName)
                                .category(category)
                                .industryDemandIndex(new BigDecimal("0.85"))
                                .build()));

                final Long masterSkillId = masterSkill.getId();
                final Long currentStudentId = student.getId();
                StudentSkill studentSkill = studentSkillRepository
                        .findByStudentIdAndSkillId(currentStudentId, masterSkillId)
                        .orElseGet(() -> StudentSkill.builder()
                                .studentId(currentStudentId)
                                .skillId(masterSkillId)
                                .build());

                studentSkill.setSourceResumeId(activeResume.getId());
                double resumeClaimScore = Math.round(confidence * 100.0);
                studentSkill.setSelfClaimScore(BigDecimal.valueOf(resumeClaimScore));

                double gitScore = verificationEngineService.calculateSkillSpecificGithubEvidence(skillName, repos);
                boolean hasGit = gitScore > 0;

                double quizScore = assessments.stream()
                        .filter(ar -> ar.getSkillName() != null
                                && (ar.getSkillName().equalsIgnoreCase(skillName)
                                        || ar.getSkillName().toLowerCase().contains(skillName.toLowerCase()))
                                && ar.getScorePercentage() != null
                                && ar.getScorePercentage().doubleValue() >= 50.0)
                        .mapToDouble(ar -> ar.getScorePercentage().doubleValue())
                        .max().orElse(0.0);

                double skillInterviewScore = (overallInterviewScore > 0 && verificationEngineService.isSkillCoveredInInterview(skillName, interviewDiscussionText))
                        ? overallInterviewScore : 0.0;
                boolean hasInterview = skillInterviewScore > 0;

                if (hasGit || quizScore > 0 || hasInterview) {
                    BigDecimal composite = verificationEngineService.calculateVerifiedScore(resumeClaimScore, gitScore, quizScore, skillInterviewScore);
                    studentSkill.setVerifiedScore(composite);
                    studentSkill.setIsVerified(composite.doubleValue() >= 50.0);
                    studentSkill.setVerificationTier(hasInterview ? 4 : (quizScore > 0 ? 3 : 2));
                } else {
                    studentSkill.setVerifiedScore(BigDecimal.ZERO);
                    studentSkill.setVerificationTier(1);
                    studentSkill.setIsVerified(false);
                }

                studentSkill.setLastVerifiedAt(LocalDateTime.now());
                studentSkillRepository.save(studentSkill);
            }
        }

        // Recalculate Skill Passport immediately after reconciliation
        try {
            if (student.getUser() != null && student.getUser().getEmail() != null) {
                passportService.generateOrUpdatePassport(student.getUser().getEmail());
            }
        } catch (Exception e) {
            log.warn("[ResumeService] Could not auto-refresh passport: {}", e.getMessage());
        }
    }

    public List<Map<String, Object>> getStudentResumes(String userEmail) {
        Student student = studentProfileService.getStudentByUserEmail(userEmail);
        List<Resume> list = resumeRepository.findByStudentIdOrderByUploadedAtDesc(student.getId());
        List<Map<String, Object>> result = new ArrayList<>();

        for (Resume r : list) {
            Map<String, Object> map = new HashMap<>();
            map.put("id", r.getId());
            map.put("fileName", r.getFileName());
            map.put("fileUrl", r.getFileUrl());
            map.put("uploadedAt", r.getUploadedAt().toString());
            map.put("isActive", Boolean.TRUE.equals(r.getIsActive()));
            map.put("status", r.getStatus() != null ? r.getStatus() : (Boolean.TRUE.equals(r.getIsActive()) ? "ACTIVE" : "INACTIVE"));
            map.put("aiSummary", r.getAiSummary());

            List<ExtractedSkill> skills = extractedSkillRepository.findByResumeId(r.getId());
            List<String> skillNames = new ArrayList<>();
            for (ExtractedSkill es : skills) {
                skillNames.add(es.getSkillName());
            }
            map.put("extractedSkills", skillNames);
            map.put("skillCount", skillNames.size());
            result.add(map);
        }
        return result;
    }

    @Transactional
    public Map<String, Object> activateResume(String userEmail, Long resumeId) {
        Student student = studentProfileService.getStudentByUserEmail(userEmail);
        Resume targetResume = resumeRepository.findByIdAndStudentId(resumeId, student.getId())
                .orElseThrow(() -> new IllegalArgumentException("Resume not found with ID: " + resumeId));

        List<Resume> allResumes = resumeRepository.findByStudentIdOrderByUploadedAtDesc(student.getId());
        for (Resume r : allResumes) {
            if (r.getId().equals(resumeId)) {
                r.setIsActive(true);
                r.setStatus("ACTIVE");
            } else {
                r.setIsActive(false);
                r.setStatus("INACTIVE");
            }
            resumeRepository.save(r);
        }

        reconcileStudentSkillsForActiveResume(student, targetResume, null);
        passportService.generateOrUpdatePassport(userEmail);

        Map<String, Object> resp = new HashMap<>();
        resp.put("message", "Resume activated successfully");
        resp.put("activeResumeId", targetResume.getId());
        resp.put("fileName", targetResume.getFileName());
        return resp;
    }

    @Transactional
    public Map<String, Object> deactivateResume(String userEmail, Long resumeId) {
        Student student = studentProfileService.getStudentByUserEmail(userEmail);
        Resume targetResume = resumeRepository.findByIdAndStudentId(resumeId, student.getId())
                .orElseThrow(() -> new IllegalArgumentException("Resume not found with ID: " + resumeId));

        targetResume.setIsActive(false);
        targetResume.setStatus("INACTIVE");
        resumeRepository.save(targetResume);

        reconcileStudentSkillsForActiveResume(student, null, null);
        passportService.generateOrUpdatePassport(userEmail);

        Map<String, Object> resp = new HashMap<>();
        resp.put("message", "Resume deactivated successfully");
        resp.put("resumeId", targetResume.getId());
        return resp;
    }

    @Transactional
    public Map<String, Object> deleteResume(String userEmail, Long resumeId) {
        Student student = studentProfileService.getStudentByUserEmail(userEmail);
        Resume targetResume = resumeRepository.findByIdAndStudentId(resumeId, student.getId())
                .orElseThrow(() -> new IllegalArgumentException("Resume not found with ID: " + resumeId));

        boolean wasActive = Boolean.TRUE.equals(targetResume.getIsActive());

        extractedSkillRepository.deleteByResumeId(resumeId);
        resumeRepository.delete(targetResume);

        try {
            if (targetResume.getFileUrl() != null) {
                Path p = Paths.get(targetResume.getFileUrl());
                Files.deleteIfExists(p);
            }
        } catch (Exception ignored) {}

        if (wasActive) {
            reconcileStudentSkillsForActiveResume(student, null, null);
            passportService.generateOrUpdatePassport(userEmail);
        }

        Map<String, Object> resp = new HashMap<>();
        resp.put("message", "Resume deleted successfully");
        resp.put("deletedResumeId", resumeId);
        return resp;
    }

    public Map<String, Object> getLatestResume(String userEmail) {
        Student student = studentProfileService.getStudentByUserEmail(userEmail);
        return resumeRepository.findFirstByStudentIdAndIsActiveTrueOrderByUploadedAtDesc(student.getId())
                .or(() -> resumeRepository.findFirstByStudentIdOrderByUploadedAtDesc(student.getId()))
                .map(r -> {
                    Map<String, Object> map = new HashMap<>();
                    map.put("resumeId", r.getId());
                    map.put("fileName", r.getFileName());
                    map.put("fileUrl", r.getFileUrl());
                    map.put("aiSummary", r.getAiSummary());
                    map.put("uploadedAt", r.getUploadedAt().toString());
                    map.put("isActive", Boolean.TRUE.equals(r.getIsActive()));
                    map.put("status", r.getStatus() != null ? r.getStatus() : (Boolean.TRUE.equals(r.getIsActive()) ? "ACTIVE" : "INACTIVE"));
                    try {
                        map.put("analysis", objectMapper.readValue(r.getParsedContentJson(), Map.class));
                    } catch (Exception e) {
                        map.put("analysis", Collections.emptyMap());
                    }
                    return map;
                })
                .orElse(Collections.emptyMap());
    }

    private String resolveSkillCategory(String skillName) {
        if (skillName == null) return "Backend";
        String s = skillName.toLowerCase();
        if (s.contains("react") || s.contains("frontend") || s.contains("vue") || s.contains("angular")
                || s.contains("html") || s.contains("css") || s.contains("tailwind") || s.contains("next")
                || s.contains("redux") || s.contains("javascript") || s.contains("typescript")) {
            return "Frontend";
        }
        if (s.contains("sql") || s.contains("postgres") || s.contains("mysql") || s.contains("mongo")
                || s.contains("redis") || s.contains("database") || s.contains("sqlite") || s.contains("firebase")) {
            return "Database";
        }
        if (s.contains("docker") || s.contains("kubernetes") || s.contains("aws") || s.contains("cloud")
                || s.contains("devops") || s.contains("git") || s.contains("linux") || s.contains("azure")
                || s.contains("gcp") || s.contains("ci/cd")) {
            return "Cloud & DevOps";
        }
        if (s.contains("algorithm") || s.contains("data structure") || s.contains("system design")
                || s.contains("c++") || s.contains("machine learning") || s.contains("deep learning")) {
            return "Core CS";
        }
        return "Backend";
    }
}
