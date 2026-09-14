package com.skillproof.service;

import com.skillproof.entity.GithubRepository;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.stereotype.Service;

import java.math.BigDecimal;
import java.math.RoundingMode;
import java.util.*;

@Service
public class VerificationEngineService {

    @Value("${skillproof.verification.weights.resume-claim:0.15}")
    private double wResume = 0.15;

    @Value("${skillproof.verification.weights.github-code:0.25}")
    private double wGithub = 0.25;

    @Value("${skillproof.verification.weights.assessment:0.30}")
    private double wAssessment = 0.30;

    @Value("${skillproof.verification.weights.ai-interview:0.30}")
    private double wInterview = 0.30;

    public double getResumeWeight() { return wResume; }
    public double getGithubWeight() { return wGithub; }
    public double getAssessmentWeight() { return wAssessment; }
    public double getInterviewWeight() { return wInterview; }

    /**
     * Calculates the composite 4-tier verified score for a skill.
     * Formula: Final = (w1 * Resume) + (w2 * GitHub) + (w3 * Assessment) + (w4 * Interview)
     */
    public BigDecimal calculateVerifiedScore(double resumeClaim, double githubEvidence, double assessmentScore, double interviewScore) {
        double composite = (wResume * resumeClaim)
                + (wGithub * githubEvidence)
                + (wAssessment * assessmentScore)
                + (wInterview * interviewScore);

        return BigDecimal.valueOf(composite).setScale(2, RoundingMode.HALF_UP);
    }

    /**
     * Calculates the composite 5-tier verified score for a skill when competitive coding evidence is present.
     * When competitive coding is 0.0, delegates to standard 4-tier formula.
     */
    public BigDecimal calculateVerifiedScore(double resumeClaim, double githubEvidence, double assessmentScore, double interviewScore, double competitiveCodingScore) {
        if (competitiveCodingScore <= 0.0) {
            return calculateVerifiedScore(resumeClaim, githubEvidence, assessmentScore, interviewScore);
        }

        // Weighted 5-tier composite: Resume 15%, GitHub 20%, Assessment 25%, Interview 25%, Competitive Coding 15%
        double composite = (0.15 * resumeClaim)
                + (0.20 * githubEvidence)
                + (0.25 * assessmentScore)
                + (0.25 * interviewScore)
                + (0.15 * competitiveCodingScore);

        return BigDecimal.valueOf(composite).setScale(2, RoundingMode.HALF_UP);
    }

    /**
     * Resolves the badge tier based on verified score threshold.
     */
    public String resolveBadge(BigDecimal verifiedScore) {
        double score = verifiedScore.doubleValue();
        if (score >= 80.0) {
            return "GOLD";
        } else if (score >= 65.0) {
            return "SILVER";
        } else if (score >= 50.0) {
            return "BRONZE";
        } else {
            return "NONE";
        }
    }

    /**
     * Generates a unique, tamper-proof passport hash for a student.
     */
    public String generatePassportHash(String rollNumber, int graduationYear) {
        int randomSalt = (int) (Math.random() * 9000) + 1000;
        return String.format("SKP-%d-%s-%d", graduationYear, rollNumber.replaceAll("[^a-zA-Z0-9]", "").toUpperCase(), randomSalt);
    }

    /**
     * Aggregates interview role and turn dialogues to determine technical relevance.
     */
    public String buildInterviewDiscussionText(com.skillproof.entity.Interview inv, com.skillproof.repository.InterviewTurnRepository turnRepo) {
        if (inv == null) return "";
        StringBuilder sb = new StringBuilder();
        if (inv.getRoleTargeted() != null) sb.append(inv.getRoleTargeted()).append(" ");
        if (turnRepo != null && inv.getId() != null) {
            java.util.List<com.skillproof.entity.InterviewTurn> turns = turnRepo.findByInterviewIdOrderByTurnNumberAsc(inv.getId());
            for (com.skillproof.entity.InterviewTurn t : turns) {
                if (t.getAiQuestion() != null) sb.append(t.getAiQuestion()).append(" ");
                if (t.getStudentAnswer() != null) sb.append(t.getStudentAnswer()).append(" ");
            }
        }
        return sb.toString().toLowerCase();
    }

    /**
     * Checks whether a specific skill was actually covered and evaluated in the interview.
     */
    public boolean isSkillCoveredInInterview(String skillName, String assessedSkills, String roleTargeted, String discussionText) {
        if (skillName == null) return false;
        String lower = skillName.trim().toLowerCase();

        boolean isBackendRole = roleTargeted != null && (roleTargeted.toLowerCase().contains("backend") || roleTargeted.toLowerCase().contains("systems"));

        // STRICT ISOLATION: JavaScript is NEVER covered in a Java/Backend interview
        if (lower.equals("javascript") || lower.equals("js")) {
            if (isBackendRole) return false;
            if (discussionText != null) {
                String withoutJava = discussionText.replaceAll("(?i)\\bjava\\b", " ");
                return withoutJava.matches("(?s).*\\b(javascript|es6)\\b.*");
            }
            return false;
        }

        // 1. Check explicit assessedSkills list if available
        if (assessedSkills != null && !assessedSkills.isBlank()) {
            String[] list = assessedSkills.split(",");
            for (String item : list) {
                String itemLower = item.trim().toLowerCase();
                if (itemLower.equals(lower) || itemLower.contains(lower) || lower.contains(itemLower)) {
                    if (lower.equals("java") && (itemLower.contains("javascript") || itemLower.equals("js"))) {
                        continue;
                    }
                    if ((lower.equals("javascript") || lower.equals("js")) && itemLower.equals("java")) {
                        continue;
                    }
                    return true;
                }
            }
        }

        // 2. Check Java specifically
        if (lower.equals("java")) {
            if (discussionText == null || discussionText.isBlank()) return false;
            String withoutJs = discussionText.replaceAll("(?i)\\bjavascript\\b|\\bjs\\b", " ");
            return withoutJs.matches("(?s).*\\bjava\\b.*");
        }

        // 3. Fallback to discussion text
        if (discussionText == null || discussionText.isBlank()) return false;
        return discussionText.matches("(?s).*\\b" + java.util.regex.Pattern.quote(lower) + "\\b.*");
    }

    public boolean isSkillCoveredInInterview(String skillName, String discussionText) {
        return isSkillCoveredInInterview(skillName, null, null, discussionText);
    }

    /**
     * Identifies repositories that directly provide verified evidence for the specific skill.
     */
    public List<GithubRepository> getMatchingRepositories(String skillName, List<GithubRepository> repos) {
        if (repos == null || repos.isEmpty() || skillName == null || skillName.isBlank()) {
            return Collections.emptyList();
        }
        List<GithubRepository> matching = new ArrayList<>();
        for (GithubRepository r : repos) {
            if (isRepoRelevantForSkill(skillName, r)) {
                matching.add(r);
            }
        }
        return matching;
    }

    /**
     * Calculates the evidence score for a skill strictly from repositories containing that skill.
     * If no matching code exists, returns 0.0%.
     */
    public double calculateSkillSpecificGithubEvidence(String skillName, List<GithubRepository> repos) {
        List<GithubRepository> matching = getMatchingRepositories(skillName, repos);
        if (matching.isEmpty()) {
            return 0.0;
        }
        double sum = 0.0;
        for (GithubRepository r : matching) {
            sum += (r.getEvidenceScore() != null ? r.getEvidenceScore().doubleValue() : 70.0);
        }
        return Math.round((sum / matching.size()) * 10.0) / 10.0;
    }

    /**
     * Determines whether a repository contains verifiable evidence for a skill.
     * Strictly avoids false positives (e.g. Java vs JavaScript, CSS vs SCSS).
     */
    public boolean isRepoRelevantForSkill(String skillName, GithubRepository repo) {
        if (skillName == null || repo == null) return false;
        String s = skillName.trim().toLowerCase();
        String lang = repo.getPrimaryLanguage() != null ? repo.getPrimaryLanguage().trim().toLowerCase() : "";
        String techs = repo.getTechnologies() != null ? repo.getTechnologies().toLowerCase() : "";
        String name = repo.getRepoName() != null ? repo.getRepoName().toLowerCase() : "";
        String desc = repo.getDescription() != null ? repo.getDescription().toLowerCase() : "";
        String text = name + " " + desc;

        // 1. Primary Language check (strict matching)
        if (!lang.isBlank()) {
            if (s.equals("java") && lang.equals("java")) return true;
            if ((s.equals("javascript") || s.equals("js")) && lang.equals("javascript")) return true;
            if ((s.equals("typescript") || s.equals("ts")) && lang.equals("typescript")) return true;
            if (s.equals("python") && lang.equals("python")) return true;
            if (s.equals("html") && (lang.equals("html") || lang.equals("html5"))) return true;
            if (s.equals("css") && (lang.equals("css") || lang.equals("css3"))) return true;
            if (s.equals("scss") && (lang.equals("scss") || lang.equals("sass"))) return true;
            if (s.equals("c++") && (lang.equals("c++") || lang.equals("cpp"))) return true;
            if (s.equals("c#") && (lang.equals("c#") || lang.equals("csharp"))) return true;
            if (s.equals("go") && (lang.equals("go") || lang.equals("golang"))) return true;
            if (s.equals("rust") && lang.equals("rust")) return true;
            if (s.equals("php") && lang.equals("php")) return true;
            if (s.equals("ruby") && lang.equals("ruby")) return true;
            if (s.equals("kotlin") && lang.equals("kotlin")) return true;
            if (s.equals("swift") && lang.equals("swift")) return true;
            if (s.equals(lang)) return true;
        }

        // 2. Exact token in technologies list
        if (!techs.isBlank()) {
            for (String token : techs.split(",")) {
                String t = token.trim().toLowerCase();
                if (t.equals(s)) return true;
                if (s.equals("java") && t.equals("java")) return true;
                if (s.equals("spring boot") && (t.contains("spring boot") || t.equals("spring") || t.contains("spring security"))) return true;
                if ((s.contains("sql") || s.contains("postgres")) && (t.contains("sql") || t.contains("postgres") || t.contains("mysql"))) return true;
                if (s.equals("docker") && (t.contains("docker") || t.contains("containeriz"))) return true;
                if (s.contains("aws") && (t.contains("aws") || t.contains("amazon"))) return true;
                if (s.equals("react") && (t.contains("react") || t.equals("next.js") || t.equals("nextjs"))) return true;
                if (s.equals("node.js") && (t.contains("node.js") || t.contains("nodejs") || t.contains("express"))) return true;
                if (s.equals("kubernetes") && (t.contains("kubernetes") || t.contains("k8s"))) return true;
                if (s.equals("redis") && t.contains("redis")) return true;
                if (s.equals("html") && (t.equals("html") || t.equals("html5"))) return true;
                if (s.equals("css") && (t.equals("css") || t.equals("css3") || t.contains("tailwind"))) return true;
                if (s.equals("scss") && (t.equals("scss") || t.equals("sass"))) return true;
                if (s.equals("git") && t.contains("git")) return true;
                if (s.equals("ci/cd") && (t.contains("ci/cd") || t.contains("pipeline") || t.contains("actions"))) return true;
                if (s.equals("machine learning") && (t.contains("machine learning") || t.equals("ml"))) return true;
            }
        }

        // 3. Regex word boundaries on repo name + description
        if (s.equals("java")) {
            return text.matches("(?s).*\\bjava\\b(?!script).*");
        }
        if (s.equals("javascript") || s.equals("js")) {
            return text.matches("(?s).*\\b(javascript|es6)\\b.*");
        }
        if (s.equals("typescript") || s.equals("ts")) {
            return text.matches("(?s).*\\btypescript\\b.*");
        }
        if (s.equals("spring boot") || s.equals("spring")) {
            return text.matches("(?s).*\\b(spring(\\s*boot)?)\\b.*");
        }
        if (s.contains("postgres") || s.equals("sql") || s.contains("sql / postgresql")) {
            return text.matches("(?s).*\\b(postgres(ql)?|mysql|sqlite)\\b.*") || text.matches("(?s).*\\bsql\\b(?!ite).*");
        }
        if (s.equals("react")) {
            return text.matches("(?s).*\\b(react|reactjs|next\\.js|nextjs)\\b.*");
        }
        if (s.equals("node.js") || s.equals("nodejs")) {
            return text.matches("(?s).*\\b(node\\.js|nodejs|express(\\.js)?)\\b.*");
        }
        if (s.equals("docker")) {
            return text.matches("(?s).*\\b(docker|dockerfile|containeriz(ed|ation)?)\\b.*");
        }
        if (s.contains("aws")) {
            return text.matches("(?s).*\\b(aws|amazon\\s+web\\s+services)\\b.*");
        }
        if (s.equals("kubernetes")) {
            return text.matches("(?s).*\\b(kubernetes|k8s)\\b.*");
        }
        if (s.equals("redis")) {
            return text.matches("(?s).*\\bredis\\b.*");
        }
        if (s.equals("html")) {
            return text.matches("(?s).*\\bhtml5?\\b.*");
        }
        if (s.equals("css")) {
            return text.matches("(?s).*\\b(css3?|tailwind)\\b.*");
        }
        if (s.equals("scss")) {
            return text.matches("(?s).*\\b(scss|sass)\\b.*");
        }
        if (s.equals("python")) {
            return text.matches("(?s).*\\bpython3?\\b.*");
        }
        if (s.equals("ci/cd")) {
            return text.matches("(?s).*\\b(ci/cd|github-actions)\\b.*");
        }

        return false;
    }

    /**
     * Generates a clear, explainable audit breakdown for a skill.
     */
    public String generateSkillExplanation(
            String skillName,
            double resumeScore,
            double gitScore,
            double quizScore,
            double interviewScore,
            int displayScore,
            String sourceFileName,
            List<String> matchingRepoNames
    ) {
        StringBuilder sb = new StringBuilder();
        sb.append(String.format("Verified Score: %d%%. Evidence Breakdown: ", displayScore));

        List<String> auditParts = new ArrayList<>();
        if (resumeScore > 0) {
            auditParts.add(String.format("Resume claim %d%% (%s)", (int) Math.round(resumeScore), sourceFileName != null ? sourceFileName : "Active Resume"));
        } else {
            auditParts.add("No active resume claim");
        }

        if (gitScore > 0 && matchingRepoNames != null && !matchingRepoNames.isEmpty()) {
            auditParts.add(String.format("GitHub code %d%% in [%s]", (int) Math.round(gitScore), String.join(", ", matchingRepoNames)));
        } else if (gitScore > 0) {
            auditParts.add(String.format("GitHub code %d%%", (int) Math.round(gitScore)));
        } else {
            auditParts.add("GitHub code 0% (no matching repository found)");
        }

        if (quizScore > 0) {
            auditParts.add(String.format("Practical quiz passed %d%%", (int) Math.round(quizScore)));
        } else {
            auditParts.add("Assessment pending (0%)");
        }

        if (interviewScore > 0) {
            auditParts.add(String.format("AI interview defense %d%%", (int) Math.round(interviewScore)));
        } else {
            auditParts.add("AI interview pending (0%)");
        }

        sb.append(String.join(" | ", auditParts));
        return sb.toString();
    }

    /**
     * Generates a clear, explainable audit breakdown for a skill across 5 tiers including Competitive Coding.
     */
    public String generateSkillExplanation(
            String skillName,
            double resumeScore,
            double gitScore,
            double quizScore,
            double interviewScore,
            double competitiveScore,
            int displayScore,
            String sourceFileName,
            List<String> matchingRepoNames
    ) {
        if (competitiveScore <= 0) {
            return generateSkillExplanation(skillName, resumeScore, gitScore, quizScore, interviewScore, displayScore, sourceFileName, matchingRepoNames);
        }

        StringBuilder sb = new StringBuilder();
        sb.append(String.format("Verified Score: %d%%. Evidence Breakdown: ", displayScore));

        List<String> auditParts = new ArrayList<>();
        if (resumeScore > 0) {
            auditParts.add(String.format("Resume claim %d%% (%s)", (int) Math.round(resumeScore), sourceFileName != null ? sourceFileName : "Active Resume"));
        } else {
            auditParts.add("No active resume claim");
        }

        if (gitScore > 0 && matchingRepoNames != null && !matchingRepoNames.isEmpty()) {
            auditParts.add(String.format("GitHub code %d%% in [%s]", (int) Math.round(gitScore), String.join(", ", matchingRepoNames)));
        } else if (gitScore > 0) {
            auditParts.add(String.format("GitHub code %d%%", (int) Math.round(gitScore)));
        } else {
            auditParts.add("GitHub code 0%");
        }

        auditParts.add(String.format("Competitive Coding %d%%", (int) Math.round(competitiveScore)));

        if (quizScore > 0) {
            auditParts.add(String.format("Practical quiz passed %d%%", (int) Math.round(quizScore)));
        } else {
            auditParts.add("Assessment pending (0%)");
        }

        if (interviewScore > 0) {
            auditParts.add(String.format("AI interview defense %d%%", (int) Math.round(interviewScore)));
        } else {
            auditParts.add("AI interview pending (0%)");
        }

        sb.append(String.join(" | ", auditParts));
        return sb.toString();
    }
}
