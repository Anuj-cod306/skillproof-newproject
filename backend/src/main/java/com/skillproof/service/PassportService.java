package com.skillproof.service;

import com.skillproof.entity.*;
import com.skillproof.repository.*;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.math.BigDecimal;
import java.math.RoundingMode;
import java.time.LocalDateTime;
import java.util.*;

@Service
@RequiredArgsConstructor
@Slf4j
public class PassportService {

    private final SkillPassportRepository passportRepository;
    private final SkillScoreRepository skillScoreRepository;
    private final StudentRepository studentRepository;
    private final StudentProfileService studentProfileService;
    private final StudentSkillRepository studentSkillRepository;
    private final SkillRepository skillRepository;
    private final GithubRepositoryRepository githubRepositoryRepository;
    private final AssessmentResultRepository assessmentResultRepository;
    private final InterviewRepository interviewRepository;
    private final InterviewTurnRepository interviewTurnRepository;
    private final VerificationEngineService verificationEngineService;
    private final StudentSkillService studentSkillService;

    @Transactional
    public Map<String, Object> generateOrUpdatePassport(String userEmail) {
        Student student = studentProfileService.getStudentByUserEmail(userEmail);

        // Fetch or create SkillPassport entity
        SkillPassport passport = passportRepository.findByStudentId(student.getId())
                .orElseGet(() -> {
                    String hash = verificationEngineService.generatePassportHash(
                            student.getRollNumber() != null ? student.getRollNumber() : "2027",
                            student.getGraduationYear() != null ? student.getGraduationYear() : 2027
                    );
                    return SkillPassport.builder()
                            .student(student)
                            .passportHash(hash)
                            .overallReadiness(new BigDecimal("75.00"))
                            .status("ACTIVE")
                            .qrCodeUrl("https://api.qrserver.com/v1/create-qr-code/?size=180x180&data=http://localhost:3000/%23/verify/" + hash)
                            .shareableLink("http://localhost:3000/#/verify/" + hash)
                            .build();
                });

        passport.setUpdatedAt(LocalDateTime.now());
        passport = passportRepository.save(passport);

        // Remove old skill scores to recalculate fresh from database evidence
        final Long passportId = passport.getId();
        List<SkillScore> oldScores = skillScoreRepository.findBySkillPassportId(passportId);
        skillScoreRepository.deleteAll(oldScores);

        // Gather evidence from StudentSkillService (Single Source of Truth)
        List<Map<String, Object>> liveSkills = studentSkillService.getStudentSkillMap(userEmail);

        List<SkillScore> newScores = new ArrayList<>();
        double sumSkillScores = 0.0;

        for (Map<String, Object> s : liveSkills) {
            String skillName = (String) s.get("name");
            if (skillName == null) continue;

            String category = (String) s.getOrDefault("category", "Technical");
            BigDecimal composite = s.get("verifiedScore") instanceof BigDecimal
                    ? (BigDecimal) s.get("verifiedScore")
                    : BigDecimal.valueOf(s.get("score") != null ? ((Number) s.get("score")).doubleValue() : 0.0);

            @SuppressWarnings("unchecked")
            Map<String, Object> tiers = (Map<String, Object>) s.get("tiers");
            double resumeScore = tiers != null && tiers.get("resume") != null ? ((Number) tiers.get("resume")).doubleValue() : 0.0;
            double gitEvidence = tiers != null && tiers.get("github") != null ? ((Number) tiers.get("github")).doubleValue() : 0.0;
            double quizScore = tiers != null && tiers.get("assessment") != null ? ((Number) tiers.get("assessment")).doubleValue() : 0.0;
            double interviewScore = tiers != null && tiers.get("interview") != null ? ((Number) tiers.get("interview")).doubleValue() : 0.0;
            double competitiveScore = tiers != null && tiers.get("competitiveCoding") != null ? ((Number) tiers.get("competitiveCoding")).doubleValue() : 0.0;

            boolean isVerified = Boolean.TRUE.equals(s.get("isVerified"));
            String badge = (String) s.getOrDefault("badge", "NONE");

            SkillScore sc = SkillScore.builder()
                    .skillPassport(passport)
                    .skillName(skillName)
                    .category(category)
                    .finalScore(composite)
                    .resumeClaimScore(BigDecimal.valueOf(resumeScore))
                    .githubEvidenceScore(BigDecimal.valueOf(gitEvidence))
                    .assessmentScore(BigDecimal.valueOf(quizScore))
                    .interviewScore(BigDecimal.valueOf(interviewScore))
                    .competitiveCodingScore(BigDecimal.valueOf(competitiveScore))
                    .isVerified(isVerified)
                    .verifiedBadge(badge)
                    .build();

            newScores.add(skillScoreRepository.save(sc));
            sumSkillScores += composite.doubleValue();
        }

        double avgComposite = newScores.isEmpty() ? 0.0 : sumSkillScores / newScores.size();
        BigDecimal readiness = BigDecimal.valueOf(avgComposite).setScale(1, RoundingMode.HALF_UP);

        passport.setOverallReadiness(readiness);
        passport.setStatus(newScores.isEmpty() ? "NOT_GENERATED" : "ACTIVE");

        String tierSummary;
        if (newScores.isEmpty()) {
            tierSummary = "UNVERIFIED";
        } else if (newScores.stream().anyMatch(s -> s.getInterviewScore() != null && s.getInterviewScore().doubleValue() > 0)) {
            tierSummary = "ALL_4_TIERS_VERIFIED";
        } else if (newScores.stream().anyMatch(s -> s.getAssessmentScore() != null && s.getAssessmentScore().doubleValue() > 0)) {
            tierSummary = "TIER_3_ASSESSED";
        } else if (newScores.stream().anyMatch(s -> s.getGithubEvidenceScore() != null && s.getGithubEvidenceScore().doubleValue() > 0)) {
            tierSummary = "TIER_2_AUDITED";
        } else {
            tierSummary = "TIER_1_CLAIMED";
        }
        passport.setVerificationTierSummary(tierSummary);
        passport = passportRepository.save(passport);

        student.setPlacementReadinessScore(readiness);
        studentRepository.save(student);

        return formatPassportResponse(passport, student, newScores);
    }

    public Map<String, Object> getMyPassport(String userEmail) {
        Student student = studentProfileService.getStudentByUserEmail(userEmail);
        return passportRepository.findByStudentId(student.getId())
                .map(p -> formatPassportResponse(p, student, skillScoreRepository.findBySkillPassportId(p.getId())))
                .orElseGet(() -> formatEmptyPassportResponse(student));
    }

    private Map<String, Object> formatEmptyPassportResponse(Student s) {
        User u = s.getUser();
        Map<String, Object> map = new HashMap<>();
        map.put("id", null);
        map.put("passportId", null);
        map.put("studentName", u.getFullName());
        map.put("candidateName", u.getFullName());
        map.put("institution", s.getCollegeName() != null ? s.getCollegeName() : "");
        map.put("college", s.getCollegeName() != null ? s.getCollegeName() : "");
        map.put("degree", s.getDegree());
        map.put("batchYear", s.getGraduationYear());
        map.put("overallReadiness", 0);
        map.put("placementReadiness", 0);
        map.put("status", "NOT_GENERATED");
        map.put("verificationSummary", "UNVERIFIED");
        map.put("qrCodeUrl", null);
        map.put("shareableLink", null);
        map.put("verifiedSkills", Collections.emptyList());
        map.put("skills", Collections.emptyList());
        map.put("isGenerated", false);
        map.put("issuedAt", null);
        return map;
    }

    public Map<String, Object> getPublicPassport(String hash) {
        if (hash == null || hash.isBlank()) {
            throw new RuntimeException("Passport hash is required");
        }

        // 1. Direct hash lookup
        Optional<SkillPassport> pOpt = passportRepository.findByPassportHash(hash);

        // 2. Fallback lookups for student IDs or partial hash
        if (pOpt.isEmpty()) {
            try {
                Long id = Long.parseLong(hash);
                pOpt = passportRepository.findByStudentId(id).or(() -> passportRepository.findById(id));
            } catch (NumberFormatException ignored) {}
        }

        if (pOpt.isEmpty()) {
            pOpt = passportRepository.findAll().stream()
                    .filter(p -> p.getPassportHash().equalsIgnoreCase(hash)
                            || p.getPassportHash().contains(hash)
                            || hash.contains(p.getPassportHash())
                            || (p.getStudent() != null && p.getStudent().getRollNumber() != null && hash.contains(p.getStudent().getRollNumber()))
                            || (p.getStudent() != null && p.getStudent().getUser() != null && p.getStudent().getUser().getEmail() != null && hash.toLowerCase().contains(p.getStudent().getUser().getUsername().toLowerCase())))
                    .findFirst();
        }

        // Auto-generate if student exists but hasn't visited passport page yet
        if (pOpt.isEmpty()) {
            List<Student> allStudents = studentRepository.findAll();
            for (Student s : allStudents) {
                boolean matchesRoll = s.getRollNumber() != null && !s.getRollNumber().isBlank() && hash.contains(s.getRollNumber());
                boolean matchesEmail = s.getUser() != null && s.getUser().getEmail() != null && hash.toLowerCase().contains(s.getUser().getEmail().split("@")[0].toLowerCase());
                if (matchesRoll || matchesEmail) {
                    try {
                        generateOrUpdatePassport(s.getUser().getEmail());
                        pOpt = passportRepository.findByStudentId(s.getId());
                        if (pOpt.isPresent()) break;
                    } catch (Exception ignored) {}
                }
            }
        }

        if (pOpt.isPresent()) {
            SkillPassport passport = pOpt.get();
            Student student = passport.getStudent();
            List<SkillScore> scores = skillScoreRepository.findBySkillPassportId(passport.getId());
            return formatPassportResponse(passport, student, scores);
        }

        // 3. Fallback for demo candidates e.g. Rohan Deshmukh or Sneha Rao
        if (hash.contains("ROHAN") || hash.contains("9142")) {
            Map<String, Object> map = new HashMap<>();
            map.put("id", "SKP-2027-ROHAN-9142");
            map.put("passportId", "SKP-2027-ROHAN-9142");
            map.put("passportNumber", "SKP-2027-ROHAN-9142");
            map.put("studentName", "Rohan Deshmukh");
            map.put("candidateName", "Rohan Deshmukh");
            map.put("institution", "VIT Vellore");
            map.put("college", "VIT Vellore");
            map.put("degree", "B.Tech CSE (2027)");
            map.put("batchYear", 2027);
            map.put("overallReadiness", 81);
            map.put("placementReadiness", 81);
            map.put("status", "ACTIVE");
            map.put("verificationSummary", "ALL_4_TIERS_VERIFIED");
            map.put("isGenerated", true);
            map.put("verifiedSkills", List.of(
                    Map.of("name", "Go / Golang", "score", 86, "badge", "GOLD", "category", "Backend", "tiers", Map.of("resume", 85, "github", 90, "assessment", 84, "interview", 85)),
                    Map.of("name", "Docker", "score", 80, "badge", "GOLD", "category", "Cloud & DevOps", "tiers", Map.of("resume", 80, "github", 82, "assessment", 78, "interview", 80)),
                    Map.of("name", "Postgres", "score", 82, "badge", "GOLD", "category", "Database", "tiers", Map.of("resume", 80, "github", 85, "assessment", 80, "interview", 83))
            ));
            return map;
        }

        if (hash.contains("SNEHA") || hash.contains("4109")) {
            Map<String, Object> map = new HashMap<>();
            map.put("id", "SKP-2027-SNEHA-4109");
            map.put("passportId", "SKP-2027-SNEHA-4109");
            map.put("studentName", "Sneha Rao");
            map.put("candidateName", "Sneha Rao");
            map.put("institution", "IIIT Hyderabad");
            map.put("college", "IIIT Hyderabad");
            map.put("degree", "B.Tech IT (2027)");
            map.put("batchYear", 2027);
            map.put("overallReadiness", 76);
            map.put("placementReadiness", 76);
            map.put("status", "ACTIVE");
            map.put("verificationSummary", "ALL_3_TIERS_VERIFIED");
            map.put("isGenerated", true);
            map.put("verifiedSkills", List.of(
                    Map.of("name", "React", "score", 88, "badge", "GOLD", "category", "Frontend", "tiers", Map.of("resume", 90, "github", 88, "assessment", 85, "interview", 0)),
                    Map.of("name", "TypeScript", "score", 84, "badge", "GOLD", "category", "Frontend", "tiers", Map.of("resume", 85, "github", 84, "assessment", 82, "interview", 0)),
                    Map.of("name", "Java", "score", 72, "badge", "SILVER", "category", "Backend", "tiers", Map.of("resume", 70, "github", 75, "assessment", 70, "interview", 0))
            ));
            return map;
        }

        throw new RuntimeException("Public passport not found for verification hash: " + hash);
    }

    private Map<String, Object> formatPassportResponse(SkillPassport p, Student s, List<SkillScore> scores) {
        User u = s.getUser();

        List<Map<String, Object>> skillItems = new ArrayList<>();
        for (SkillScore sc : scores) {
            Map<String, Object> item = new HashMap<>();
            double r = sc.getResumeClaimScore() != null ? sc.getResumeClaimScore().doubleValue() : 0.0;
            double g = sc.getGithubEvidenceScore() != null ? sc.getGithubEvidenceScore().doubleValue() : 0.0;
            double q = sc.getAssessmentScore() != null ? sc.getAssessmentScore().doubleValue() : 0.0;
            double i = sc.getInterviewScore() != null ? sc.getInterviewScore().doubleValue() : 0.0;
            double c = sc.getCompetitiveCodingScore() != null ? sc.getCompetitiveCodingScore().doubleValue() : 0.0;
            int finalScore = sc.getFinalScore() != null ? sc.getFinalScore().intValue() : 0;

            item.put("name", sc.getSkillName());
            item.put("category", sc.getCategory());
            item.put("score", sc.getFinalScore());
            item.put("badge", sc.getVerifiedBadge());
            item.put("verified", sc.getIsVerified());
            item.put("resume", sc.getResumeClaimScore());
            item.put("github", sc.getGithubEvidenceScore());
            item.put("quiz", sc.getAssessmentScore());
            item.put("aiInterview", sc.getInterviewScore());
            item.put("competitiveCoding", sc.getCompetitiveCodingScore());

            String evidenceText;
            if (c > 0) {
                evidenceText = String.format("Resume (15%%): %.0f%% | Git (20%%): %.0f%% | Quiz (25%%): %.0f%% | Interview (25%%): %.0f%% | Comp Code (15%%): %.0f%% => Verified Score: %d%%",
                        r, g, q, i, c, finalScore);
            } else {
                evidenceText = String.format("Resume (15%%): %.0f%% [+%.1f] | Git (25%%): %.0f%% [+%.1f] | Quiz (30%%): %.0f%% [+%.1f] | Interview (30%%): %.0f%% [+%.1f] => Verified Score: %d%%",
                        r, r * 0.15, g, g * 0.25, q, q * 0.30, i, i * 0.30, finalScore);
            }
            item.put("evidence", evidenceText);

            Map<String, Object> breakdown = new HashMap<>();
            if (c > 0) {
                breakdown.put("resumeWeight", 0.15);
                breakdown.put("resumePoints", Math.round(r * 0.15 * 10.0) / 10.0);
                breakdown.put("githubWeight", 0.20);
                breakdown.put("githubPoints", Math.round(g * 0.20 * 10.0) / 10.0);
                breakdown.put("quizWeight", 0.25);
                breakdown.put("quizPoints", Math.round(q * 0.25 * 10.0) / 10.0);
                breakdown.put("interviewWeight", 0.25);
                breakdown.put("interviewPoints", Math.round(i * 0.25 * 10.0) / 10.0);
                breakdown.put("competitiveCodingWeight", 0.15);
                breakdown.put("competitiveCodingPoints", Math.round(c * 0.15 * 10.0) / 10.0);
            } else {
                breakdown.put("resumeWeight", 0.15);
                breakdown.put("resumePoints", Math.round(r * 0.15 * 10.0) / 10.0);
                breakdown.put("githubWeight", 0.25);
                breakdown.put("githubPoints", Math.round(g * 0.25 * 10.0) / 10.0);
                breakdown.put("quizWeight", 0.30);
                breakdown.put("quizPoints", Math.round(q * 0.30 * 10.0) / 10.0);
                breakdown.put("interviewWeight", 0.30);
                breakdown.put("interviewPoints", Math.round(i * 0.30 * 10.0) / 10.0);
            }
            item.put("breakdown", breakdown);

            Map<String, Object> tiers = new HashMap<>();
            tiers.put("resume", (int) Math.round(r));
            tiers.put("github", (int) Math.round(g));
            tiers.put("assessment", (int) Math.round(q));
            tiers.put("interview", (int) Math.round(i));
            tiers.put("competitiveCoding", (int) Math.round(c));
            item.put("tiers", tiers);

            skillItems.add(item);
        }

        Map<String, Object> map = new HashMap<>();
        map.put("id", p.getPassportHash());
        map.put("passportId", p.getPassportHash());
        map.put("passportNumber", p.getPassportHash());
        map.put("studentName", u.getFullName());
        map.put("candidateName", u.getFullName());
        map.put("institution", s.getCollegeName());
        map.put("college", s.getCollegeName());
        map.put("degree", s.getDegree());
        map.put("batchYear", s.getGraduationYear());
        map.put("overallReadiness", p.getOverallReadiness());
        map.put("placementReadiness", p.getOverallReadiness().intValue());
        map.put("status", p.getStatus());
        map.put("verificationSummary", p.getVerificationTierSummary());
        map.put("qrCodeUrl", p.getQrCodeUrl());
        map.put("shareableLink", p.getShareableLink());
        map.put("verifiedSkills", skillItems);
        map.put("skills", skillItems);
        map.put("isGenerated", !skillItems.isEmpty());
        map.put("issuedAt", p.getIssuedAt() != null ? p.getIssuedAt().toString() : null);

        return map;
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
}
