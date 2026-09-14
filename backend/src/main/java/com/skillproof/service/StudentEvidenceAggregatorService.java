package com.skillproof.service;

import com.fasterxml.jackson.databind.JsonNode;
import com.fasterxml.jackson.databind.ObjectMapper;
import com.skillproof.entity.*;
import com.skillproof.repository.*;
import lombok.Builder;
import lombok.Data;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Service;

import java.util.*;
import java.util.regex.Pattern;

@Service
@RequiredArgsConstructor
@Slf4j
public class StudentEvidenceAggregatorService {

    private final StudentRepository studentRepository;
    private final ResumeRepository resumeRepository;
    private final GithubRepositoryRepository githubRepositoryRepository;
    private final CompetitiveCodingProfileRepository competitiveCodingProfileRepository;
    private final AssessmentResultRepository assessmentResultRepository;
    private final MentorshipEndorsementRepository mentorshipEndorsementRepository;
    private final StudentSkillRepository studentSkillRepository;
    private final SkillRepository skillRepository;
    private final SkillPassportRepository skillPassportRepository;
    private final SkillScoreRepository skillScoreRepository;
    private final ObjectMapper objectMapper = new ObjectMapper();

    @Data
    @Builder
    public static class ProjectEvidence {
        private String title;
        private String source; // RESUME, GITHUB, MENTORSHIP
        private List<String> technologies;
        private String description;
        private String remarks;
    }

    @Data
    @Builder
    public static class AggregatedEvidence {
        private Long studentId;
        private String studentName;
        private String collegeName;
        private String degree;
        private String targetRole;
        private int currentReadinessScore;

        private List<String> verifiedSkills;
        private List<ProjectEvidence> projects;
        private List<String> githubRepos;
        private String githubSummary;
        private int totalCommits;

        private boolean hasCompetitiveCoding;
        private int leetCodeSolved;
        private double leetCodeRating;
        private String competitiveSummary;

        private List<String> passedAssessments;
        private String facultyEndorsementTitle;
        private String facultyEndorsementRemarks;
        private String facultyMentorName;

        private String primaryEvidenceSummary;
    }

    public AggregatedEvidence aggregateStudentEvidence(Long studentId) {
        Student student = studentRepository.findById(studentId)
                .orElseThrow(() -> new RuntimeException("Student not found: " + studentId));

        List<String> skillsList = new ArrayList<>();
        studentSkillRepository.findByStudentId(studentId).forEach(ss -> {
            skillRepository.findById(ss.getSkillId()).ifPresent(sk -> skillsList.add(sk.getName()));
        });

        // Also check SkillScore if student_skills empty
        if (skillsList.isEmpty()) {
            skillPassportRepository.findByStudentId(studentId).ifPresent(p -> {
                skillScoreRepository.findBySkillPassportId(p.getId()).forEach(score -> {
                    if (score.getSkillName() != null && !skillsList.contains(score.getSkillName())) {
                        skillsList.add(score.getSkillName());
                    }
                });
            });
        }

        List<ProjectEvidence> projectsList = new ArrayList<>();

        // 1. Mentorship Endorsement Projects
        List<MentorshipEndorsement> endorsements = mentorshipEndorsementRepository.findByStudentId(studentId);
        String mentorProject = null;
        String mentorRemarks = null;
        String mentorName = null;
        for (MentorshipEndorsement me : endorsements) {
            if (me.getProjectTitle() != null && !me.getProjectTitle().isBlank()) {
                mentorProject = me.getProjectTitle();
                mentorRemarks = me.getRemarks();
                if (me.getAcademician() != null && me.getAcademician().getUser() != null) {
                    mentorName = me.getAcademician().getUser().getFullName();
                }
                projectsList.add(ProjectEvidence.builder()
                        .title(me.getProjectTitle())
                        .source("FACULTY_MENTORSHIP")
                        .description(me.getRemarks())
                        .remarks(me.getRemarks())
                        .technologies(extractTechWords(me.getProjectTitle() + " " + me.getRemarks()))
                        .build());
            }
        }

        // 2. GitHub Repositories
        List<GithubRepository> repos = githubRepositoryRepository.findByStudentId(studentId);
        List<String> repoNames = new ArrayList<>();
        int totalCommits = 0;
        for (GithubRepository r : repos) {
            repoNames.add(r.getRepoName());
            if (r.getCommitCount() != null) totalCommits += r.getCommitCount();

            List<String> repoTech = new ArrayList<>();
            if (r.getPrimaryLanguage() != null) repoTech.add(r.getPrimaryLanguage());
            if (r.getTechnologies() != null) {
                for (String t : r.getTechnologies().split(",")) {
                    String clean = t.trim();
                    if (!clean.isBlank() && !repoTech.contains(clean)) repoTech.add(clean);
                }
            }

            projectsList.add(ProjectEvidence.builder()
                    .title(r.getRepoName())
                    .source("GITHUB_REPO")
                    .description(r.getDescription() != null ? r.getDescription() : r.getKeyFinding())
                    .remarks(r.getKeyFinding())
                    .technologies(repoTech)
                    .build());
        }

        // 3. Resume Parsed Projects
        Optional<Resume> resumeOpt = resumeRepository.findFirstByStudentIdAndIsActiveTrueOrderByUploadedAtDesc(studentId);
        if (resumeOpt.isEmpty()) {
            resumeOpt = resumeRepository.findFirstByStudentIdOrderByUploadedAtDesc(studentId);
        }
        if (resumeOpt.isPresent() && resumeOpt.get().getParsedContentJson() != null) {
            try {
                JsonNode parsed = objectMapper.readTree(resumeOpt.get().getParsedContentJson());
                if (parsed.has("projects") && parsed.get("projects").isArray()) {
                    parsed.get("projects").forEach(p -> {
                        String pTitle = p.path("title").asText("Project");
                        String pDesc = p.path("description").asText("");
                        List<String> pTech = new ArrayList<>();
                        if (p.has("tech") && p.get("tech").isArray()) {
                            p.get("tech").forEach(t -> pTech.add(t.asText()));
                        }
                        projectsList.add(ProjectEvidence.builder()
                                .title(pTitle)
                                .source("RESUME")
                                .description(pDesc)
                                .technologies(pTech)
                                .build());
                    });
                }
            } catch (Exception ignored) {}
        }

        // 4. Competitive Coding
        List<CompetitiveCodingProfile> ccProfiles = competitiveCodingProfileRepository.findByStudentId(studentId);
        int lcSolved = 0;
        double lcRating = 0.0;
        String ccSummary = "Not connected";
        boolean hasCC = false;
        for (CompetitiveCodingProfile cc : ccProfiles) {
            if ("VERIFIED".equalsIgnoreCase(cc.getVerificationStatus()) || (cc.getProblemsSolved() != null && cc.getProblemsSolved() > 0)) {
                hasCC = true;
                if ("LEETCODE".equalsIgnoreCase(cc.getPlatform())) {
                    lcSolved = cc.getProblemsSolved() != null ? cc.getProblemsSolved() : 0;
                    lcRating = cc.getContestRating() != null ? cc.getContestRating() : 0.0;
                    ccSummary = String.format("LeetCode: %d solved (Rating: %.0f, Rank: %s)",
                            lcSolved, lcRating, cc.getBadgeOrRank() != null ? cc.getBadgeOrRank() : "Active");
                }
            }
        }

        // 5. Diagnostic Assessments
        List<AssessmentResult> assessments = assessmentResultRepository.findByStudentId(studentId);
        List<String> passedAssessments = new ArrayList<>();
        for (AssessmentResult ar : assessments) {
            if (Boolean.TRUE.equals(ar.getPassed()) && ar.getSkillName() != null) {
                passedAssessments.add(ar.getSkillName() + " (" + ar.getScorePercentage().intValue() + "%)");
            }
        }

        String studentName = (student.getUser() != null && student.getUser().getFullName() != null)
                ? student.getUser().getFullName() : "leo";

        // Build composite summary
        StringBuilder summaryBuilder = new StringBuilder();
        summaryBuilder.append(studentName);
        summaryBuilder.append(" targeting ").append(student.getTargetRole() != null ? student.getTargetRole() : "Software Engineering");
        if (!skillsList.isEmpty()) {
            summaryBuilder.append(". Verified Skills: ").append(String.join(", ", skillsList));
        }
        if (mentorProject != null) {
            summaryBuilder.append(". Mentorship Project: '").append(mentorProject).append("'");
        }
        if (!repoNames.isEmpty()) {
            summaryBuilder.append(". GitHub: ").append(repoNames.size()).append(" repo(s) [").append(String.join(", ", repoNames)).append("]");
        }
        if (hasCC) {
            summaryBuilder.append(". ").append(ccSummary);
        }

        int readiness = student.getPlacementReadinessScore() != null
                ? student.getPlacementReadinessScore().intValue() : 0;

        return AggregatedEvidence.builder()
                .studentId(studentId)
                .studentName(studentName)
                .collegeName(student.getCollegeName() != null ? student.getCollegeName() : "JNU jaipur college")
                .degree(student.getDegree() != null ? student.getDegree() : "B.Tech Computer Science")
                .targetRole(student.getTargetRole() != null ? student.getTargetRole() : "Frontend Developer")
                .currentReadinessScore(readiness)
                .verifiedSkills(skillsList)
                .projects(projectsList)
                .githubRepos(repoNames)
                .githubSummary(repoNames.isEmpty() ? "No public repos connected" : repoNames.size() + " repositories, " + totalCommits + " commits")
                .totalCommits(totalCommits)
                .hasCompetitiveCoding(hasCC)
                .leetCodeSolved(lcSolved)
                .leetCodeRating(lcRating)
                .competitiveSummary(ccSummary)
                .passedAssessments(passedAssessments)
                .facultyEndorsementTitle(mentorProject)
                .facultyEndorsementRemarks(mentorRemarks)
                .facultyMentorName(mentorName)
                .primaryEvidenceSummary(summaryBuilder.toString())
                .build();
    }

    private List<String> extractTechWords(String text) {
        if (text == null) return Collections.emptyList();
        List<String> list = new ArrayList<>();
        String[] keywords = {"Java", "Spring Boot", "React", "JavaScript", "TypeScript", "HTML", "CSS", "SQL", "PostgreSQL", "Docker", "AWS", "REST", "Redis", "JWT"};
        for (String kw : keywords) {
            if (Pattern.compile("\\b" + Pattern.quote(kw) + "\\b", Pattern.CASE_INSENSITIVE).matcher(text).find()) {
                list.add(kw);
            }
        }
        return list;
    }
}
