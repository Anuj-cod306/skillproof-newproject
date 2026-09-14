package com.skillproof.service;

import com.fasterxml.jackson.databind.JsonNode;
import com.fasterxml.jackson.databind.ObjectMapper;
import com.skillproof.entity.*;
import com.skillproof.repository.*;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Service;

import java.math.BigDecimal;
import java.util.*;

@Service
@RequiredArgsConstructor
@Slf4j
public class StudentSkillService {

    private final StudentProfileService studentProfileService;
    private final StudentSkillRepository studentSkillRepository;
    private final SkillRepository skillRepository;
    private final GithubRepositoryRepository githubRepositoryRepository;
    private final AssessmentResultRepository assessmentResultRepository;
    private final InterviewRepository interviewRepository;
    private final InterviewTurnRepository interviewTurnRepository;
    private final InterviewEvaluationRepository interviewEvaluationRepository;
    private final VerificationEngineService verificationEngineService;
    private final ResumeRepository resumeRepository;
    private final CompetitiveCodingService competitiveCodingService;
    private final ObjectMapper objectMapper = new ObjectMapper();

    public List<Map<String, Object>> getStudentSkillMap(String userEmail) {
        Student student = studentProfileService.getStudentByUserEmail(userEmail);

        // Fetch repositories and assessments first
        List<GithubRepository> repos = githubRepositoryRepository.findByStudentId(student.getId());
        double avgGitEvidence = repos.isEmpty() ? 0.0
                : repos.stream().mapToDouble(r -> r.getEvidenceScore() != null ? r.getEvidenceScore().doubleValue() : 0.0).average().orElse(0.0);

        List<AssessmentResult> allAssessments = assessmentResultRepository.findByStudentId(student.getId());

        // Ensure skills with verified GitHub or Assessment evidence are mapped in student_skills
        for (AssessmentResult ar : allAssessments) {
            if (ar.getSkillName() != null && ar.getScorePercentage() != null && ar.getScorePercentage().doubleValue() >= 50.0) {
                ensureSkillPresent(student.getId(), ar.getSkillName());
            }
        }
        for (GithubRepository r : repos) {
            if (r.getPrimaryLanguage() != null && !r.getPrimaryLanguage().isBlank() && !"General".equalsIgnoreCase(r.getPrimaryLanguage())) {
                ensureSkillPresent(student.getId(), r.getPrimaryLanguage().trim());
            }
            if (r.getTechnologies() != null) {
                for (String t : r.getTechnologies().split(",")) {
                    String clean = t.trim();
                    if (!clean.isBlank() && !"General".equalsIgnoreCase(clean)) {
                        ensureSkillPresent(student.getId(), clean);
                    }
                }
            }
        }

        List<StudentSkill> studentSkills = studentSkillRepository.findByStudentId(student.getId());
        if (studentSkills.isEmpty()) {
            ensureSkillPresent(student.getId(), "Java");
            ensureSkillPresent(student.getId(), "Spring Boot");
            ensureSkillPresent(student.getId(), "SQL / PostgreSQL");
            studentSkills = studentSkillRepository.findByStudentId(student.getId());
        }
        if (studentSkills.isEmpty()) {
            return Collections.emptyList();
        }

        // Fetch latest resume to get detailed parsed evidence statements
        Optional<Resume> latestResume = resumeRepository.findFirstByStudentIdOrderByUploadedAtDesc(student.getId());
        Map<String, String> resumeEvidenceMap = new HashMap<>();
        if (latestResume.isPresent() && latestResume.get().getParsedContentJson() != null) {
            try {
                JsonNode parsed = objectMapper.readTree(latestResume.get().getParsedContentJson());
                if (parsed.has("skillEvidence") && parsed.get("skillEvidence").isObject()) {
                    parsed.get("skillEvidence").fields().forEachRemaining(entry -> {
                        resumeEvidenceMap.put(entry.getKey(), entry.getValue().asText());
                    });
                }
            } catch (Exception ignored) {}
        }

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

        List<Map<String, Object>> result = new ArrayList<>();

        for (StudentSkill ss : studentSkills) {
            Skill skill = skillRepository.findById(ss.getSkillId()).orElse(null);
            if (skill == null) continue;

            String skillName = skill.getName();
            String category = skill.getCategory() != null ? skill.getCategory() : resolveSkillCategory(skillName);

            // Tier 1: Resume presence
            double resumeClaimScore = ss.getSelfClaimScore() != null ? ss.getSelfClaimScore().doubleValue() : 0.0;

            // Tier 2: Skill-specific GitHub evidence (Strictly mapped per repository, 0% if unrelated)
            List<GithubRepository> matchingRepos = verificationEngineService.getMatchingRepositories(skillName, repos);
            double gitScore = verificationEngineService.calculateSkillSpecificGithubEvidence(skillName, repos);
            List<String> matchingRepoNames = matchingRepos.stream().map(GithubRepository::getRepoName).toList();

            // Tier 3: Practical assessment score
            double quizScore = findBestQuizScore(allAssessments, skillName);

            // Tier 4: Interview score (only if this skill was discussed/evaluated)
            double skillInterviewScore = (overallInterviewScore > 0 && verificationEngineService.isSkillCoveredInInterview(skillName, assessedSkills, interviewTargetRole, interviewDiscussionText))
                    ? overallInterviewScore : 0.0;

            // Tier 5: Competitive Coding evidence (DSA, Problem Solving, verified languages)
            double compScore = competitiveCodingService.getSkillCompetitiveCodingEvidence(student.getId(), skillName);

            // Check if skill has any evidence at all across 5 tiers
            boolean hasAnyEvidence = resumeClaimScore > 0 || gitScore > 0 || quizScore > 0 || skillInterviewScore > 0 || compScore > 0;
            if (!hasAnyEvidence) {
                // Stale skill with no evidence across any tier -> prune
                studentSkillRepository.delete(ss);
                continue;
            }

            // Determine multi-tier composite aligned with Passport
            boolean hasHigherEvidence = gitScore > 0 || quizScore > 0 || skillInterviewScore > 0 || compScore > 0;
            BigDecimal composite = hasHigherEvidence
                    ? verificationEngineService.calculateVerifiedScore(resumeClaimScore, gitScore, quizScore, skillInterviewScore, compScore)
                    : BigDecimal.ZERO;

            int displayScore = composite.intValue();
            String badge = hasHigherEvidence ? verificationEngineService.resolveBadge(composite) : "NONE";
            boolean isVerified = hasHigherEvidence && composite.doubleValue() >= 50.0;

            // Persist verified score so database and Roadmap stay strictly aligned
            ss.setVerifiedScore(composite);
            ss.setIsVerified(isVerified);
            int computedTier = skillInterviewScore > 0 ? 4 : (quizScore > 0 ? 3 : (gitScore > 0 ? 2 : (compScore > 0 ? 2 : 1)));
            ss.setVerificationTier(computedTier);
            studentSkillRepository.save(ss);

            String status;
            String evidenceText;
            String sourceFileName = null;
            if (ss.getSourceResumeId() != null) {
                Optional<Resume> resOpt = resumeRepository.findById(ss.getSourceResumeId());
                if (resOpt.isPresent()) {
                    sourceFileName = resOpt.get().getFileName();
                }
            }

            if (skillInterviewScore > 0) {
                status = "VERIFIED";
                evidenceText = resumeClaimScore > 0
                        ? String.format("Tier 4 Verified: Resume [%s] (%.0f%%) + GitHub (%.0f%%) + Assessment (%.0f%%) + AI Interview (%.0f%%) => %d%%",
                                sourceFileName != null ? sourceFileName : "Active", resumeClaimScore, gitScore, quizScore, skillInterviewScore, displayScore)
                        : String.format("Tier 4 Verified: GitHub (%.0f%%) + Assessment (%.0f%%) + AI Interview (%.0f%%) => %d%%. Resume claim inactive.",
                                gitScore, quizScore, skillInterviewScore, displayScore);
            } else if (quizScore > 0) {
                status = "ASSESSED";
                evidenceText = resumeClaimScore > 0
                        ? String.format("Tier 3 Assessed: Quiz passed (%.0f%%) with Resume [%s] (%.0f%%) + GitHub (%.0f%%) => %d%%. AI Interview pending.",
                                quizScore, sourceFileName != null ? sourceFileName : "Active", resumeClaimScore, gitScore, displayScore)
                        : String.format("Tier 3 Assessed: Quiz passed (%.0f%%) + GitHub (%.0f%%) => %d%%. Resume claim inactive. AI Interview pending.",
                                quizScore, gitScore, displayScore);
            } else if (gitScore > 0) {
                status = "EVIDENCE_FOUND";
                String repoListStr = String.join(", ", matchingRepoNames);
                evidenceText = resumeClaimScore > 0
                        ? String.format("Tier 2 Audited: Verified across %d GitHub repo(s) [%s] (%.0f%%) with Resume [%s] (%.0f%%) => %d%%. Assessment pending.",
                                matchingRepos.size(), repoListStr, gitScore, sourceFileName != null ? sourceFileName : "Active", resumeClaimScore, displayScore)
                        : String.format("Tier 2 Audited: Verified across %d GitHub repo(s) [%s] (%.0f%%) => %d%%. Assessment pending.",
                                matchingRepos.size(), repoListStr, gitScore, displayScore);
            } else if (compScore > 0) {
                status = "EVIDENCE_FOUND";
                evidenceText = resumeClaimScore > 0
                        ? String.format("Competitive Coding Audited: Verified %.0f%% evidence with Resume [%s] (%.0f%%) => %d%%. Assessment pending.",
                                compScore, sourceFileName != null ? sourceFileName : "Active", resumeClaimScore, displayScore)
                        : String.format("Competitive Coding Audited: Verified %.0f%% evidence => %d%%. Assessment pending.",
                                compScore, displayScore);
            } else {
                status = "CLAIMED";
                displayScore = 0;
                badge = "NONE";
                isVerified = false;
                String srcPrefix = sourceFileName != null ? "Resume (" + sourceFileName + "): " : "Resume Evidence: ";
                evidenceText = resumeEvidenceMap.containsKey(skillName)
                        ? resumeEvidenceMap.get(skillName) + (sourceFileName != null ? " [Source: " + sourceFileName + "]" : "")
                        : String.format("%sDetected with %.0f%% claim confidence. Practical assessment or code audit required for verified score.", srcPrefix, resumeClaimScore);
            }

            String explanation = verificationEngineService.generateSkillExplanation(
                    skillName, resumeClaimScore, gitScore, quizScore, skillInterviewScore, compScore, displayScore, sourceFileName, matchingRepoNames
            );

            Map<String, Object> map = new HashMap<>();
            map.put("id", ss.getId());
            map.put("skillId", skill.getId());
            map.put("name", skillName);
            map.put("category", category);
            map.put("status", status); // CLAIMED, EVIDENCE_FOUND, ASSESSED, VERIFIED
            map.put("score", displayScore);
            map.put("confidence", (int) Math.round(resumeClaimScore));
            map.put("verified", isVerified);
            map.put("badge", badge);
            map.put("evidence", evidenceText);
            map.put("explanation", explanation);
            map.put("matchingRepos", matchingRepoNames);
            map.put("sourceResumeId", ss.getSourceResumeId());
            map.put("sourceResumeFileName", sourceFileName);

            Map<String, Object> tiers = new HashMap<>();
            tiers.put("resume", (int) Math.round(resumeClaimScore));
            tiers.put("github", (int) Math.round(gitScore));
            tiers.put("assessment", (int) Math.round(quizScore));
            tiers.put("interview", (int) Math.round(skillInterviewScore));
            tiers.put("competitiveCoding", (int) Math.round(compScore));
            map.put("tiers", tiers);

            result.add(map);
        }

        return result;
    }

    private double findBestQuizScore(List<AssessmentResult> results, String skillName) {
        if (results == null || results.isEmpty() || skillName == null) return 0.0;
        String target = skillName.trim().toLowerCase();
        double best = 0.0;
        for (AssessmentResult ar : results) {
            if (ar.getSkillName() == null || ar.getScorePercentage() == null) continue;
            String arName = ar.getSkillName().trim().toLowerCase();
            if (arName.equalsIgnoreCase(target)
                    || arName.startsWith(target + " ")
                    || target.startsWith(arName + " ")
                    || (target.length() >= 4 && arName.contains(target))
                    || (arName.length() >= 4 && target.contains(arName))) {
                double score = ar.getScorePercentage().doubleValue();
                if (score > best) {
                    best = score;
                }
            }
        }
        return best;
    }

    private void ensureSkillPresent(Long studentId, String skillName) {
        if (skillName == null || skillName.isBlank()) return;
        String cleanName = skillName.trim();
        Skill skill = skillRepository.findByNameIgnoreCase(cleanName)
                .orElseGet(() -> skillRepository.save(Skill.builder()
                        .name(cleanName)
                        .category(resolveSkillCategory(cleanName))
                        .industryDemandIndex(new BigDecimal("0.85"))
                        .build()));

        Optional<StudentSkill> existing = studentSkillRepository.findByStudentIdAndSkillId(studentId, skill.getId());
        if (existing.isEmpty()) {
            studentSkillRepository.save(StudentSkill.builder()
                    .studentId(studentId)
                    .skillId(skill.getId())
                    .selfClaimScore(BigDecimal.ZERO)
                    .verifiedScore(BigDecimal.ZERO)
                    .verificationTier(1)
                    .isVerified(false)
                    .build());
        }
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
