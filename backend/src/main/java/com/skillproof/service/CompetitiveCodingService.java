package com.skillproof.service;

import com.fasterxml.jackson.databind.JsonNode;
import com.fasterxml.jackson.databind.ObjectMapper;
import com.skillproof.entity.*;
import com.skillproof.repository.*;
import lombok.extern.slf4j.Slf4j;
import org.springframework.context.annotation.Lazy;
import org.springframework.http.*;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.web.client.HttpClientErrorException;
import org.springframework.web.client.RestTemplate;

import java.math.BigDecimal;
import java.math.RoundingMode;
import java.time.LocalDateTime;
import java.util.*;

@Service
@Slf4j
public class CompetitiveCodingService {

    private final CompetitiveCodingProfileRepository profileRepo;
    private final StudentProfileService studentProfileService;
    private final StudentSkillRepository studentSkillRepository;
    private final SkillRepository skillRepository;
    private final PassportService passportService;
    private final RoadmapService roadmapService;
    private final ObjectMapper objectMapper;
    private final RestTemplate restTemplate;

    public CompetitiveCodingService(
            CompetitiveCodingProfileRepository profileRepo,
            StudentProfileService studentProfileService,
            StudentSkillRepository studentSkillRepository,
            SkillRepository skillRepository,
            @Lazy PassportService passportService,
            @Lazy RoadmapService roadmapService,
            ObjectMapper objectMapper
    ) {
        this.profileRepo = profileRepo;
        this.studentProfileService = studentProfileService;
        this.studentSkillRepository = studentSkillRepository;
        this.skillRepository = skillRepository;
        this.passportService = passportService;
        this.roadmapService = roadmapService;
        this.objectMapper = objectMapper;
        this.restTemplate = new RestTemplate();
    }

    /**
     * Retrieves competitive coding profiles and evidence summary for the student.
     */
    public Map<String, Object> getStudentCompetitiveData(String userEmail) {
        Student student = studentProfileService.getStudentByUserEmail(userEmail);
        List<CompetitiveCodingProfile> profiles = profileRepo.findByStudentId(student.getId());

        Map<String, Object> leetcode = formatProfileMap("LEETCODE", findProfile(profiles, "LEETCODE"));
        Map<String, Object> codeforces = formatProfileMap("CODEFORCES", findProfile(profiles, "CODEFORCES"));

        double highestScore = profiles.stream()
                .filter(p -> "VERIFIED".equalsIgnoreCase(p.getVerificationStatus()))
                .mapToDouble(p -> p.getEvidenceScore() != null ? p.getEvidenceScore().doubleValue() : 0.0)
                .max()
                .orElse(0.0);

        int totalAc = profiles.stream()
                .filter(p -> p.getProblemsSolved() != null)
                .mapToInt(CompetitiveCodingProfile::getProblemsSolved)
                .sum();

        double peakRating = profiles.stream()
                .filter(p -> p.getContestRating() != null)
                .mapToDouble(CompetitiveCodingProfile::getContestRating)
                .max()
                .orElse(0.0);

        Set<String> allLangs = new LinkedHashSet<>();
        for (CompetitiveCodingProfile p : profiles) {
            if (p.getVerifiedLanguages() != null && !p.getVerifiedLanguages().isBlank()) {
                for (String l : p.getVerifiedLanguages().split(",")) {
                    if (!l.trim().isBlank()) allLangs.add(l.trim());
                }
            }
        }

        boolean hasAnyConnected = profiles.stream().anyMatch(p -> p.getUsername() != null && !p.getUsername().isBlank());

        Map<String, Object> result = new HashMap<>();
        result.put("studentId", student.getId());
        result.put("connected", hasAnyConnected);
        result.put("profiles", List.of(leetcode, codeforces));
        result.put("leetcode", leetcode);
        result.put("codeforces", codeforces);
        result.put("overallScore", Math.round(highestScore));
        result.put("overallEvidenceScore", Math.round(highestScore));
        result.put("totalProblemsSolved", totalAc);
        result.put("peakRating", Math.round(peakRating));
        result.put("verifiedLanguages", new ArrayList<>(allLangs));
        result.put("hasVerifiedProfile", highestScore > 0);
        return result;
    }

    /**
     * Connects a username or profile URL for LeetCode or Codeforces.
     */
    @Transactional
    public Map<String, Object> connectProfile(String userEmail, String platform, String usernameOrUrl) {
        Student student = studentProfileService.getStudentByUserEmail(userEmail);
        String plat = normalizePlatform(platform);
        String cleanUsername = extractUsername(usernameOrUrl);

        if (cleanUsername.isBlank()) {
            throw new IllegalArgumentException("Username or profile URL cannot be empty.");
        }

        CompetitiveCodingProfile profile = profileRepo.findByStudentIdAndPlatform(student.getId(), plat)
                .orElseGet(() -> CompetitiveCodingProfile.builder()
                        .studentId(student.getId())
                        .platform(plat)
                        .build());

        profile.setUsername(cleanUsername);
        profile.setProfileUrl(buildProfileUrl(plat, cleanUsername));
        profile.setVerificationStatus("CONNECTED");
        profile.setLastError(null);
        profileRepo.save(profile);

        // Immediately verify upon connection
        return verifyProfile(userEmail, plat);
    }

    /**
     * Verifies the profile with live public data from LeetCode or Codeforces.
     */
    @Transactional
    public Map<String, Object> verifyProfile(String userEmail, String platform) {
        Student student = studentProfileService.getStudentByUserEmail(userEmail);
        String plat = normalizePlatform(platform);

        CompetitiveCodingProfile profile = profileRepo.findByStudentIdAndPlatform(student.getId(), plat)
                .orElseThrow(() -> new IllegalArgumentException("No " + plat + " profile connected. Please connect a username first."));

        if (profile.getUsername() == null || profile.getUsername().isBlank()) {
            throw new IllegalArgumentException("Username is missing for " + plat);
        }

        try {
            if ("LEETCODE".equals(plat)) {
                fetchAndVerifyLeetCode(profile);
            } else if ("CODEFORCES".equals(plat)) {
                fetchAndVerifyCodeforces(profile);
            }
            profile.setVerificationStatus("VERIFIED");
            profile.setLastError(null);
            profile.setLastVerifiedAt(LocalDateTime.now());
            profile.setLastSuccessfulVerificationAt(LocalDateTime.now());
            profileRepo.save(profile);

            // Sync verified evidence to relevant student skills (DSA, Problem Solving, Languages)
            syncEvidenceToSkills(student.getId(), profile);

            // Trigger downstream recalculations
            triggerDownstreamSync(userEmail);

        } catch (Exception e) {
            log.error("[CompetitiveCoding] Verification error for student {} on {}: {}", student.getId(), plat, e.getMessage());
            profile.setVerificationStatus("FAILED");
            profile.setLastError(e.getMessage());
            profile.setLastVerifiedAt(LocalDateTime.now());
            profileRepo.save(profile);
            throw new RuntimeException("Verification failed: " + e.getMessage());
        }

        Map<String, Object> fullData = getStudentCompetitiveData(userEmail);
        @SuppressWarnings("unchecked")
        Map<String, Object> platMap = "LEETCODE".equals(plat)
                ? (Map<String, Object>) fullData.get("leetcode")
                : (Map<String, Object>) fullData.get("codeforces");
        Map<String, Object> response = new HashMap<>(fullData);
        if (platMap != null) {
            response.putAll(platMap);
        }
        return response;
    }

    /**
     * Re-verifies the profile by fetching fresh public metrics.
     */
    @Transactional
    public Map<String, Object> reverifyProfile(String userEmail, String platform) {
        return verifyProfile(userEmail, platform);
    }

    /**
     * Safely disconnects a platform.
     * Preserves Resume, GitHub, Quiz, and AI Interview evidence untouched.
     */
    @Transactional
    public Map<String, Object> disconnectProfile(String userEmail, String platform) {
        Student student = studentProfileService.getStudentByUserEmail(userEmail);
        String plat = normalizePlatform(platform);

        Optional<CompetitiveCodingProfile> opt = profileRepo.findByStudentIdAndPlatform(student.getId(), plat);
        if (opt.isPresent()) {
            CompetitiveCodingProfile p = opt.get();
            profileRepo.delete(p);

            // Downstream recalculation will naturally see this profile gone
            triggerDownstreamSync(userEmail);
        }

        return getStudentCompetitiveData(userEmail);
    }

    /**
     * Returns competitive coding evidence score (0-100) for a given skill.
     * Strictly verifies relevant competencies (DSA, Problem Solving, Competitive Programming, and supported languages).
     */
    public double getSkillCompetitiveCodingEvidence(Long studentId, String skillName) {
        if (studentId == null || skillName == null) return 0.0;
        List<CompetitiveCodingProfile> profiles = profileRepo.findByStudentId(studentId);
        List<CompetitiveCodingProfile> verifiedProfiles = profiles.stream()
                .filter(p -> "VERIFIED".equalsIgnoreCase(p.getVerificationStatus()))
                .toList();

        if (verifiedProfiles.isEmpty()) return 0.0;

        String s = skillName.trim().toLowerCase();

        // Core supported skills
        boolean isDsa = s.contains("data structures") || s.contains("dsa") || s.contains("algorithm");
        boolean isProblemSolving = s.contains("problem solving");
        boolean isCompetitive = s.contains("competitive") || s.contains("codeforces") || s.contains("leetcode");

        if (isDsa || isProblemSolving || isCompetitive) {
            return verifiedProfiles.stream()
                    .mapToDouble(p -> p.getEvidenceScore() != null ? p.getEvidenceScore().doubleValue() : 0.0)
                    .max()
                    .orElse(0.0);
        }

        // Programming languages: strictly check verified languages from solved problems
        boolean isJava = s.equals("java");
        boolean isCpp = s.equals("c++") || s.equals("cpp");
        boolean isPython = s.equals("python") || s.equals("python3");

        if (isJava || isCpp || isPython) {
            double highestLangScore = 0.0;
            for (CompetitiveCodingProfile p : verifiedProfiles) {
                String langs = p.getVerifiedLanguages() != null ? p.getVerifiedLanguages().toLowerCase() : "";
                if (isJava && langs.contains("java")) {
                    highestLangScore = Math.max(highestLangScore, p.getEvidenceScore().doubleValue());
                } else if (isCpp && (langs.contains("c++") || langs.contains("cpp"))) {
                    highestLangScore = Math.max(highestLangScore, p.getEvidenceScore().doubleValue());
                } else if (isPython && langs.contains("python")) {
                    highestLangScore = Math.max(highestLangScore, p.getEvidenceScore().doubleValue());
                }
            }
            return highestLangScore;
        }

        // Unrelated skills (AWS, Docker, Spring Boot, React, SQL, etc.) strictly 0%
        return 0.0;
    }

    // -------------------------------------------------------------
    // Real Public API Fetching & Scoring
    // -------------------------------------------------------------

    private void fetchAndVerifyLeetCode(CompetitiveCodingProfile profile) {
        String username = profile.getUsername().trim();
        String graphqlUrl = "https://leetcode.com/graphql";

        String query = "query getUserProfile($username: String!) {\n" +
                "  matchedUser(username: $username) {\n" +
                "    username\n" +
                "    submitStatsGlobal {\n" +
                "      acSubmissionNum {\n" +
                "        difficulty\n" +
                "        count\n" +
                "        submissions\n" +
                "      }\n" +
                "    }\n" +
                "    profile {\n" +
                "      ranking\n" +
                "      reputation\n" +
                "    }\n" +
                "    languageProblemCount {\n" +
                "      languageName\n" +
                "      problemsSolved\n" +
                "    }\n" +
                "  }\n" +
                "  userContestRanking(username: $username) {\n" +
                "    attendedContestsCount\n" +
                "    rating\n" +
                "    globalRanking\n" +
                "    topPercentage\n" +
                "  }\n" +
                "}";

        Map<String, Object> reqBody = new HashMap<>();
        reqBody.put("query", query);
        reqBody.put("variables", Map.of("username", username));

        HttpHeaders headers = new HttpHeaders();
        headers.setContentType(MediaType.APPLICATION_JSON);
        headers.set("User-Agent", "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36");
        headers.set("Referer", "https://leetcode.com");

        HttpEntity<Map<String, Object>> entity = new HttpEntity<>(reqBody, headers);

        try {
            ResponseEntity<String> response = restTemplate.exchange(graphqlUrl, HttpMethod.POST, entity, String.class);
            if (!response.getStatusCode().is2xxSuccessful() || response.getBody() == null) {
                throw new RuntimeException("LeetCode API returned HTTP status " + response.getStatusCode());
            }

            JsonNode root = objectMapper.readTree(response.getBody());
            JsonNode matchedUser = root.path("data").path("matchedUser");
            if (matchedUser.isMissingNode() || matchedUser.isNull()) {
                throw new RuntimeException("LeetCode username '" + username + "' not found.");
            }

            // Extract problem counts
            int total = 0, easy = 0, medium = 0, hard = 0;
            JsonNode acNums = matchedUser.path("submitStatsGlobal").path("acSubmissionNum");
            if (acNums.isArray()) {
                for (JsonNode item : acNums) {
                    String diff = item.path("difficulty").asText("");
                    int cnt = item.path("count").asInt(0);
                    if ("All".equalsIgnoreCase(diff)) total = cnt;
                    else if ("Easy".equalsIgnoreCase(diff)) easy = cnt;
                    else if ("Medium".equalsIgnoreCase(diff)) medium = cnt;
                    else if ("Hard".equalsIgnoreCase(diff)) hard = cnt;
                }
            }

            // Extract contest metrics
            JsonNode contest = root.path("data").path("userContestRanking");
            double contestRating = 0.0;
            int attendedContests = 0;
            String globalRank = null;
            if (!contest.isMissingNode() && !contest.isNull()) {
                contestRating = contest.path("rating").asDouble(0.0);
                attendedContests = contest.path("attendedContestsCount").asInt(0);
                globalRank = contest.path("globalRanking").asText(null);
            }

            // Extract verified languages
            Set<String> verifiedLangs = new LinkedHashSet<>();
            JsonNode langCounts = matchedUser.path("languageProblemCount");
            if (langCounts.isArray()) {
                for (JsonNode l : langCounts) {
                    String lName = l.path("languageName").asText("");
                    int pSolved = l.path("problemsSolved").asInt(0);
                    if (pSolved > 0) {
                        if (lName.equalsIgnoreCase("Java")) verifiedLangs.add("Java");
                        if (lName.equalsIgnoreCase("C++") || lName.equalsIgnoreCase("C")) verifiedLangs.add("C++");
                        if (lName.toLowerCase().startsWith("python")) verifiedLangs.add("Python");
                    }
                }
            }

            // Transparent scoring formula
            // 1. Problem volume & difficulty: Easy * 0.1, Medium * 0.25, Hard * 0.5 (max 45 pts)
            double probScore = Math.min(45.0, (easy * 0.1) + (medium * 0.25) + (hard * 0.5));

            // 2. Contest Rating / Caliber (max 45 pts)
            double ratingScore;
            if (contestRating > 0) {
                ratingScore = Math.min(45.0, Math.max(15.0, ((contestRating - 1200.0) / (2400.0 - 1200.0)) * 45.0));
            } else {
                // For users without contest rating, allocate based on medium/hard depth
                ratingScore = Math.min(45.0, (medium * 0.20) + (hard * 0.40));
            }

            // 3. Activity / Consistency (max 10 pts)
            double activityScore = Math.min(10.0, (attendedContests * 1.5) + (total / 50.0));

            double finalScore = Math.min(100.0, Math.max(45.0, probScore + ratingScore + activityScore));
            BigDecimal scoreBd = BigDecimal.valueOf(finalScore).setScale(1, RoundingMode.HALF_UP);

            String badge = contestRating >= 2100 ? "Guardian" : (contestRating >= 1800 ? "Knight" : (total >= 200 ? "Problem Solver" : "Active Coder"));
            String langsStr = verifiedLangs.isEmpty() ? "None" : String.join(", ", verifiedLangs);

            String finding = String.format(
                    "LeetCode Verified Score: %.0f/100 (Problems Solved: %d [Easy: %d, Medium: %d, Hard: %d] => %.1f pts | Contest Rating: %.0f => %.1f pts | Activity => %.1f pts | Languages: %s)",
                    finalScore, total, easy, medium, hard, probScore, contestRating, ratingScore, activityScore, langsStr
            );

            profile.setProblemsSolved(total);
            profile.setEasySolved(easy);
            profile.setMediumSolved(medium);
            profile.setHardSolved(hard);
            profile.setContestRating(contestRating);
            profile.setGlobalRank(globalRank);
            profile.setBadgeOrRank(badge);
            profile.setEvidenceScore(scoreBd);
            profile.setKeyFinding(finding);
            profile.setVerifiedLanguages(langsStr);

        } catch (HttpClientErrorException.NotFound e) {
            throw new RuntimeException("LeetCode username '" + username + "' not found.");
        } catch (Exception e) {
            if (e.getMessage().contains("not found")) throw (RuntimeException) e;
            log.error("[CompetitiveCoding] LeetCode fetch failed: {}", e.getMessage());
            throw new RuntimeException("Could not connect to LeetCode: " + e.getMessage());
        }
    }

    private void fetchAndVerifyCodeforces(CompetitiveCodingProfile profile) {
        String handle = profile.getUsername().trim();
        String infoUrl = "https://codeforces.com/api/user.info?handles=" + handle;

        try {
            ResponseEntity<String> infoRes = restTemplate.getForEntity(infoUrl, String.class);
            JsonNode root = objectMapper.readTree(infoRes.getBody());
            if (!"OK".equalsIgnoreCase(root.path("status").asText())) {
                throw new RuntimeException("Codeforces user '" + handle + "' not found.");
            }

            JsonNode userNode = root.path("result").get(0);
            int rating = userNode.path("rating").asInt(0);
            int maxRating = userNode.path("maxRating").asInt(0);
            String rank = userNode.path("rank").asText("unranked");
            String maxRank = userNode.path("maxRank").asText("unranked");
            int contribution = userNode.path("contribution").asInt(0);

            // Fetch recent submissions for languages & problem count
            String statusUrl = "https://codeforces.com/api/user.status?handle=" + handle + "&from=1&count=50";
            Set<String> verifiedLangs = new LinkedHashSet<>();
            int solvedCount = 0;

            try {
                ResponseEntity<String> statusRes = restTemplate.getForEntity(statusUrl, String.class);
                JsonNode statusRoot = objectMapper.readTree(statusRes.getBody());
                if ("OK".equalsIgnoreCase(statusRoot.path("status").asText())) {
                    JsonNode subs = statusRoot.path("result");
                    if (subs.isArray()) {
                        Set<String> solvedProblems = new HashSet<>();
                        for (JsonNode s : subs) {
                            String verdict = s.path("verdict").asText("");
                            String lang = s.path("programmingLanguage").asText("");
                            if ("OK".equalsIgnoreCase(verdict)) {
                                String pId = s.path("problem").path("contestId").asText() + s.path("problem").path("index").asText();
                                solvedProblems.add(pId);
                            }
                            if (lang.toLowerCase().contains("c++") || lang.toLowerCase().contains("gnu c++")) {
                                verifiedLangs.add("C++");
                            } else if (lang.toLowerCase().contains("java")) {
                                verifiedLangs.add("Java");
                            } else if (lang.toLowerCase().contains("python") || lang.toLowerCase().contains("pypy")) {
                                verifiedLangs.add("Python");
                            }
                        }
                        solvedCount = solvedProblems.size();
                    }
                }
            } catch (Exception e) {
                log.warn("[CompetitiveCoding] Could not fetch CF status: {}", e.getMessage());
            }

            // Transparent scoring formula for Codeforces:
            // Ratings map to verified competence:
            // Newbie (<1200): 45-55
            // Pupil (1200-1399): 56-68
            // Specialist (1400-1599): 69-80
            // Expert (1600-1899): 81-90
            // Candidate Master / Master / Grandmaster (1900+): 91-100
            double baseScore;
            if (rating > 0) {
                baseScore = Math.min(85.0, Math.max(35.0, 35.0 + ((rating - 800.0) / (2200.0 - 800.0)) * 55.0));
            } else {
                baseScore = 45.0;
            }
            double activityBonus = Math.min(15.0, Math.max(5.0, (solvedCount * 1.5) + (Math.max(0, contribution) * 0.5)));
            double finalScore = Math.min(100.0, Math.max(45.0, baseScore + activityBonus));
            BigDecimal scoreBd = BigDecimal.valueOf(finalScore).setScale(1, RoundingMode.HALF_UP);

            String langsStr = verifiedLangs.isEmpty() ? "C++" : String.join(", ", verifiedLangs);
            String finding = String.format(
                    "Codeforces Verified Score: %.0f/100 (Rating: %d [%s] | Max Rating: %d [%s] | Solved in recent contests: %d | Verified Languages: %s)",
                    finalScore, rating, rank, maxRating, maxRank, solvedCount, langsStr
            );

            profile.setContestRating((double) rating);
            profile.setProblemsSolved(solvedCount);
            profile.setGlobalRank(rank);
            profile.setBadgeOrRank(rank);
            profile.setEvidenceScore(scoreBd);
            profile.setKeyFinding(finding);
            profile.setVerifiedLanguages(langsStr);

        } catch (HttpClientErrorException.NotFound e) {
            throw new RuntimeException("Codeforces user '" + handle + "' not found.");
        } catch (Exception e) {
            if (e.getMessage().contains("not found")) throw (RuntimeException) e;
            log.error("[CompetitiveCoding] Codeforces fetch failed: {}", e.getMessage());
            throw new RuntimeException("Could not connect to Codeforces: " + e.getMessage());
        }
    }

    private void syncEvidenceToSkills(Long studentId, CompetitiveCodingProfile profile) {
        double score = profile.getEvidenceScore().doubleValue();
        if (score <= 0) return;

        // 1. Map to Data Structures & Algorithms
        ensureAndSyncSkill(studentId, "Data Structures & Algorithms", "Core CS", score);

        // 2. Map to Problem Solving
        ensureAndSyncSkill(studentId, "Problem Solving", "Core CS", score);

        // 3. Map to programming languages strictly if verified
        String langs = profile.getVerifiedLanguages() != null ? profile.getVerifiedLanguages().toLowerCase() : "";
        if (langs.contains("java")) {
            ensureAndSyncSkill(studentId, "Java", "Backend", score);
        }
        if (langs.contains("c++") || langs.contains("cpp")) {
            ensureAndSyncSkill(studentId, "C++", "Core CS", score);
        }
        if (langs.contains("python")) {
            ensureAndSyncSkill(studentId, "Python", "Core CS", score);
        }
    }

    private void ensureAndSyncSkill(Long studentId, String skillName, String category, double evidenceScore) {
        Skill skill = skillRepository.findByNameIgnoreCase(skillName)
                .orElseGet(() -> skillRepository.save(Skill.builder()
                        .name(skillName)
                        .category(category)
                        .industryDemandIndex(new BigDecimal("0.90"))
                        .build()));

        StudentSkill studentSkill = studentSkillRepository
                .findByStudentIdAndSkillId(studentId, skill.getId())
                .orElseGet(() -> StudentSkill.builder()
                        .studentId(studentId)
                        .skillId(skill.getId())
                        .selfClaimScore(new BigDecimal("70.00"))
                        .build());

        studentSkill.setLastVerifiedAt(LocalDateTime.now());
        studentSkillRepository.save(studentSkill);
    }

    private void triggerDownstreamSync(String userEmail) {
        try {
            passportService.generateOrUpdatePassport(userEmail);
        } catch (Exception e) {
            log.warn("[CompetitiveCoding] Downstream passport update warning: {}", e.getMessage());
        }
    }

    private CompetitiveCodingProfile findProfile(List<CompetitiveCodingProfile> list, String platform) {
        return list.stream()
                .filter(p -> platform.equalsIgnoreCase(p.getPlatform()))
                .findFirst()
                .orElse(null);
    }

    private Map<String, Object> formatProfileMap(String platform, CompetitiveCodingProfile p) {
        Map<String, Object> map = new HashMap<>();
        map.put("platform", platform);
        if (p == null) {
            map.put("status", "NOT_CONNECTED");
            map.put("verificationStatus", "NOT_CONNECTED");
            map.put("connected", false);
            map.put("username", "");
            map.put("profileUrl", "");
            map.put("problemsSolved", 0);
            map.put("easySolved", 0);
            map.put("mediumSolved", 0);
            map.put("hardSolved", 0);
            map.put("contestRating", 0.0);
            map.put("badgeOrRank", "None");
            map.put("evidenceScore", 0);
            map.put("keyFinding", "Not connected yet.");
            map.put("verifiedLanguages", List.of());
            map.put("lastVerifiedAt", null);
        } else {
            map.put("id", p.getId());
            map.put("status", p.getVerificationStatus());
            map.put("verificationStatus", p.getVerificationStatus());
            map.put("connected", true);
            map.put("username", p.getUsername());
            map.put("profileUrl", p.getProfileUrl());
            map.put("problemsSolved", p.getProblemsSolved());
            map.put("easySolved", p.getEasySolved());
            map.put("mediumSolved", p.getMediumSolved());
            map.put("hardSolved", p.getHardSolved());
            map.put("contestRating", p.getContestRating());
            map.put("globalRank", p.getGlobalRank());
            map.put("badgeOrRank", p.getBadgeOrRank() != null ? p.getBadgeOrRank() : "Member");
            map.put("evidenceScore", p.getEvidenceScore() != null ? p.getEvidenceScore().intValue() : 0);
            map.put("keyFinding", p.getKeyFinding());
            List<String> langList = new ArrayList<>();
            if (p.getVerifiedLanguages() != null && !p.getVerifiedLanguages().isBlank()) {
                for (String l : p.getVerifiedLanguages().split(",")) {
                    if (!l.trim().isBlank()) langList.add(l.trim());
                }
            }
            map.put("verifiedLanguages", langList);
            map.put("lastError", p.getLastError());
            map.put("lastVerifiedAt", p.getLastVerifiedAt() != null ? p.getLastVerifiedAt().toString() : null);
        }
        return map;
    }

    private String normalizePlatform(String platform) {
        if (platform == null) return "LEETCODE";
        String p = platform.trim().toUpperCase();
        if (p.contains("CODEFORCE") || p.contains("CF")) return "CODEFORCES";
        return "LEETCODE";
    }

    private String extractUsername(String input) {
        if (input == null) return "";
        String s = input.trim();
        // Handle full URLs like https://leetcode.com/u/username/ or https://codeforces.com/profile/username
        if (s.contains("/")) {
            String[] parts = s.split("/");
            for (int i = parts.length - 1; i >= 0; i--) {
                String token = parts[i].trim();
                if (!token.isBlank() && !token.equalsIgnoreCase("profile") && !token.equalsIgnoreCase("u")) {
                    return token;
                }
            }
        }
        return s;
    }

    private String buildProfileUrl(String platform, String username) {
        if ("CODEFORCES".equals(platform)) {
            return "https://codeforces.com/profile/" + username;
        }
        return "https://leetcode.com/u/" + username;
    }
}
