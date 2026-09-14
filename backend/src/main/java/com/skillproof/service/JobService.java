package com.skillproof.service;

import com.skillproof.entity.*;
import com.skillproof.repository.*;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.math.BigDecimal;
import java.time.LocalDateTime;
import java.util.*;

@Service
@RequiredArgsConstructor
@Slf4j
public class JobService {

    private final JobRepository jobRepository;
    private final ApplicationRepository applicationRepository;
    private final CompanyRepository companyRepository;
    private final StudentRepository studentRepository;
    private final UserRepository userRepository;
    private final StudentProfileService studentProfileService;
    private final SkillPassportRepository passportRepository;
    private final SkillScoreRepository skillScoreRepository;
    private final ExplainableMatchingService explainableMatchingService;
    private final StudentSkillService studentSkillService;
    private final NotificationService notificationService;

    public static class SendJoiningLetterRequest {
        public String role;
        public String salary;
        public String joiningDate;
        public String letterText;
    }

    public static class RespondToOfferRequest {
        public String action; // "ACCEPT" or "DECLINE"
        public String remarks;
    }

    public static class CreateJobRequest {
        public String title;
        public String jobType; // FULL_TIME, INTERNSHIP, REMOTE, CONTRACT
        public String location;
        public String stipendOrSalary;
        public String experienceRequired;
        public String description;
        public BigDecimal minReadinessScore;
        public List<String> requiredSkills = new ArrayList<>();
    }

    @Transactional
    public Job createJob(String userEmail, CreateJobRequest req) {
        User user = userRepository.findByEmail(userEmail)
                .orElseThrow(() -> new RuntimeException("User not found: " + userEmail));

        Company company = companyRepository.findByUserId(user.getId())
                .orElseGet(() -> companyRepository.save(Company.builder()
                        .user(user)
                        .companyName("NovaTech Solutions")
                        .industryType("Enterprise Software")
                        .build()));

        Job job = Job.builder()
                .company(company)
                .title(req.title)
                .jobType(req.jobType != null ? req.jobType : "FULL_TIME")
                .location(req.location != null ? req.location : "Bengaluru / Hybrid")
                .stipendOrSalary(req.stipendOrSalary != null ? req.stipendOrSalary : "₹8,50,000 - ₹12,00,000 / annum")
                .experienceRequired(req.experienceRequired != null ? req.experienceRequired : "Fresher / 0-1 Years")
                .description(req.description != null ? req.description : "Building high-throughput microservices and distributed APIs.")
                .minReadinessScore(req.minReadinessScore != null ? req.minReadinessScore : new BigDecimal("70.00"))
                .status("ACTIVE")
                .createdAt(LocalDateTime.now())
                .build();

        return jobRepository.save(job);
    }

    public List<Map<String, Object>> getJobsForStudent(String userEmail) {
        Student student = studentProfileService.getStudentByUserEmail(userEmail);
        List<Job> allJobs = jobRepository.findAll();

        // Fetch student verified skills from passport (or live Skill Map if not yet generated)
        Map<String, BigDecimal> studentSkillScores = new HashMap<>();
        passportRepository.findByStudentId(student.getId()).ifPresent(p -> {
            skillScoreRepository.findBySkillPassportId(p.getId()).forEach(sc -> {
                studentSkillScores.put(sc.getSkillName(), sc.getFinalScore());
            });
        });
        if (studentSkillScores.isEmpty()) {
            List<Map<String, Object>> liveSkills = studentSkillService.getStudentSkillMap(userEmail);
            for (Map<String, Object> ls : liveSkills) {
                String sName = (String) ls.get("name");
                Number sScore = (Number) ls.get("score");
                if (sName != null && sScore != null) {
                    studentSkillScores.put(sName, BigDecimal.valueOf(sScore.doubleValue()));
                }
            }
        }
        boolean hasVerifiedSkills = !studentSkillScores.isEmpty();

        List<Application> studentApps = applicationRepository.findByStudentId(student.getId());
        Set<Long> appliedJobIds = new HashSet<>();
        Map<Long, String> appStatusByJobId = new HashMap<>();
        Map<Long, Application> appByJobId = new HashMap<>();
        studentApps.forEach(a -> {
            appliedJobIds.add(a.getJob().getId());
            appStatusByJobId.put(a.getJob().getId(), a.getStatus());
            appByJobId.put(a.getJob().getId(), a);
        });

        List<Map<String, Object>> result = new ArrayList<>();
        for (Job j : allJobs) {
            Map<String, Double> jobReqs = Map.of(
                    "Java", 1.0,
                    "Spring Boot", 1.0,
                    "SQL / PostgreSQL", 0.9,
                    "Docker", 0.7,
                    "AWS Cloud", 0.6
            );

            ExplainableMatchingService.MatchResult match = explainableMatchingService.evaluateMatch(
                    studentSkillScores,
                    jobReqs,
                    List.of("Java", "Spring Boot", "SQL / PostgreSQL")
            );

            Application a = appByJobId.get(j.getId());
            Map<String, Object> map = new HashMap<>();
            map.put("id", j.getId());
            map.put("title", j.getTitle());
            map.put("company", j.getCompany().getCompanyName());
            map.put("type", j.getJobType());
            map.put("location", j.getLocation());
            map.put("salary", j.getStipendOrSalary());
            map.put("experience", j.getExperienceRequired());
            map.put("description", j.getDescription());
            map.put("matchScore", match.matchPercentage);
            map.put("verifiedMatches", match.verifiedMatches);
            map.put("missingOrDeficit", match.missingOrDeficitSkills);
            map.put("explanation", hasVerifiedSkills ? match.humanExplanation : "Complete your Skill Verification to unlock personalized job matching.");
            map.put("applied", appliedJobIds.contains(j.getId()));
            map.put("status", appStatusByJobId.get(j.getId()));
            map.put("rawStatus", a != null ? a.getStatus() : null);
            map.put("applicationId", a != null ? a.getId() : null);
            map.put("joiningLetterRole", a != null ? a.getJoiningLetterRole() : null);
            map.put("joiningLetterSalary", a != null ? a.getJoiningLetterSalary() : null);
            map.put("joiningLetterJoiningDate", a != null ? a.getJoiningLetterJoiningDate() : null);
            map.put("joiningLetterText", a != null ? a.getJoiningLetterText() : null);
            map.put("joiningLetterSentAt", a != null && a.getJoiningLetterSentAt() != null ? a.getJoiningLetterSentAt().toString() : null);
            map.put("studentAcceptedAt", a != null && a.getStudentAcceptedAt() != null ? a.getStudentAcceptedAt().toString() : null);
            map.put("studentDeclinedAt", a != null && a.getStudentDeclinedAt() != null ? a.getStudentDeclinedAt().toString() : null);
            map.put("studentRemarks", a != null ? a.getStudentRemarks() : null);
            map.put("academicApprovedAt", a != null && a.getAcademicApprovedAt() != null ? a.getAcademicApprovedAt().toString() : null);
            map.put("academicRejectedAt", a != null && a.getAcademicRejectedAt() != null ? a.getAcademicRejectedAt().toString() : null);
            map.put("academicComments", a != null ? a.getAcademicComments() : null);
            map.put("academicApproverName", a != null ? a.getAcademicApproverName() : null);
            result.add(map);
        }

        result.sort((a, b) -> ((BigDecimal) b.get("matchScore")).compareTo((BigDecimal) a.get("matchScore")));
        return result;
    }

    public List<Map<String, Object>> getAllJobsPublic() {
        List<Job> allJobs = jobRepository.findAll();
        List<Map<String, Object>> result = new ArrayList<>();
        for (Job j : allJobs) {
            Map<String, Object> map = new HashMap<>();
            map.put("id", j.getId());
            map.put("title", j.getTitle());
            map.put("company", j.getCompany().getCompanyName());
            map.put("type", j.getJobType());
            map.put("location", j.getLocation());
            map.put("salary", j.getStipendOrSalary());
            map.put("experience", j.getExperienceRequired());
            map.put("description", j.getDescription());
            map.put("matchScore", 0);
            map.put("verifiedMatches", Collections.emptyList());
            map.put("missingOrDeficit", Collections.emptyList());
            map.put("explanation", "Sign in to view explainable AI skill matching for this opportunity.");
            map.put("applied", false);
            result.add(map);
        }
        return result;
    }

    @Transactional
    public Map<String, Object> applyForJob(String userEmail, Long jobId) {
        Student student = studentProfileService.getStudentByUserEmail(userEmail);
        Job job = jobRepository.findById(jobId)
                .orElseThrow(() -> new RuntimeException("Job not found: " + jobId));

        Optional<Application> existing = applicationRepository.findByJobIdAndStudentId(jobId, student.getId());
        if (existing.isPresent()) {
            return Map.of("message", "Already applied", "applicationId", existing.get().getId(), "status", existing.get().getStatus());
        }

        // Compute match percentage
        Map<String, BigDecimal> studentSkillScores = new HashMap<>();
        passportRepository.findByStudentId(student.getId()).ifPresent(p -> {
            skillScoreRepository.findBySkillPassportId(p.getId()).forEach(sc -> {
                studentSkillScores.put(sc.getSkillName(), sc.getFinalScore());
            });
        });

        ExplainableMatchingService.MatchResult match = explainableMatchingService.evaluateMatch(
                studentSkillScores,
                Map.of("Java", 1.0, "Spring Boot", 1.0, "SQL / PostgreSQL", 0.9),
                List.of("Java", "Spring Boot")
        );

        Application app = Application.builder()
                .job(job)
                .student(student)
                .matchPercentage(match.matchPercentage)
                .status("APPLIED")
                .appliedAt(LocalDateTime.now())
                .build();

        app = applicationRepository.save(app);
        return Map.of(
                "applicationId", app.getId(),
                "jobTitle", job.getTitle(),
                "company", job.getCompany().getCompanyName(),
                "status", "APPLIED",
                "matchPercentage", match.matchPercentage,
                "message", "Application submitted successfully."
        );
    }

    public List<Map<String, Object>> getStudentApplications(String userEmail) {
        Student student = studentProfileService.getStudentByUserEmail(userEmail);
        List<Application> apps = applicationRepository.findByStudentId(student.getId());

        List<Map<String, Object>> list = new ArrayList<>();
        for (Application a : apps) {
            Map<String, Object> map = new HashMap<>();
            map.put("applicationId", a.getId());
            map.put("jobId", a.getJob().getId());
            map.put("jobTitle", a.getJob().getTitle());
            map.put("company", a.getJob().getCompany().getCompanyName());
            map.put("location", a.getJob().getLocation());
            map.put("matchScore", a.getMatchPercentage());
            map.put("status", a.getStatus());
            map.put("appliedAt", a.getAppliedAt().toString());
            map.put("joiningLetterRole", a.getJoiningLetterRole());
            map.put("joiningLetterSalary", a.getJoiningLetterSalary());
            map.put("joiningLetterJoiningDate", a.getJoiningLetterJoiningDate());
            map.put("joiningLetterText", a.getJoiningLetterText());
            map.put("joiningLetterSentAt", a.getJoiningLetterSentAt() != null ? a.getJoiningLetterSentAt().toString() : null);
            map.put("studentAcceptedAt", a.getStudentAcceptedAt() != null ? a.getStudentAcceptedAt().toString() : null);
            map.put("studentDeclinedAt", a.getStudentDeclinedAt() != null ? a.getStudentDeclinedAt().toString() : null);
            map.put("studentRemarks", a.getStudentRemarks());
            map.put("academicApprovedAt", a.getAcademicApprovedAt() != null ? a.getAcademicApprovedAt().toString() : null);
            map.put("academicRejectedAt", a.getAcademicRejectedAt() != null ? a.getAcademicRejectedAt().toString() : null);
            map.put("academicComments", a.getAcademicComments());
            map.put("academicApproverName", a.getAcademicApproverName());
            list.add(map);
        }
        return list;
    }

    public List<Map<String, Object>> getCompanyApplications(String userEmail) {
        User user = userRepository.findByEmail(userEmail)
                .orElseThrow(() -> new RuntimeException("User not found: " + userEmail));
        Company company = companyRepository.findByUserId(user.getId())
                .orElseThrow(() -> new RuntimeException("Company profile not found"));

        List<Job> companyJobs = jobRepository.findByCompanyId(company.getId());
        List<Map<String, Object>> list = new ArrayList<>();

        for (Job job : companyJobs) {
            List<Application> apps = applicationRepository.findByJobId(job.getId());
            for (Application a : apps) {
                Student s = a.getStudent();
                User su = s.getUser();

                // Exclude demo/test candidate Alice Smith
                if (su != null && "Alice Smith".equalsIgnoreCase(su.getFullName())) {
                    continue;
                }

                Map<String, Object> map = new HashMap<>();
                map.put("applicationId", a.getId());
                map.put("jobId", job.getId());
                map.put("jobTitle", job.getTitle());
                map.put("candidateName", su != null ? su.getFullName() : "Candidate");
                map.put("candidateEmail", su != null ? su.getEmail() : "");
                map.put("college", s.getCollegeName());
                map.put("degree", s.getDegree());
                map.put("matchScore", a.getMatchPercentage());
                map.put("status", a.getStatus());
                map.put("appliedAt", a.getAppliedAt().toString());
                map.put("joiningLetterRole", a.getJoiningLetterRole());
                map.put("joiningLetterSalary", a.getJoiningLetterSalary());
                map.put("joiningLetterJoiningDate", a.getJoiningLetterJoiningDate());
                map.put("joiningLetterText", a.getJoiningLetterText());
                map.put("joiningLetterSentAt", a.getJoiningLetterSentAt() != null ? a.getJoiningLetterSentAt().toString() : null);
                map.put("studentAcceptedAt", a.getStudentAcceptedAt() != null ? a.getStudentAcceptedAt().toString() : null);
                map.put("studentDeclinedAt", a.getStudentDeclinedAt() != null ? a.getStudentDeclinedAt().toString() : null);
                map.put("studentRemarks", a.getStudentRemarks());
                map.put("academicApprovedAt", a.getAcademicApprovedAt() != null ? a.getAcademicApprovedAt().toString() : null);
                map.put("academicRejectedAt", a.getAcademicRejectedAt() != null ? a.getAcademicRejectedAt().toString() : null);
                map.put("academicComments", a.getAcademicComments());
                map.put("academicApproverName", a.getAcademicApproverName());
                list.add(map);
            }
        }
        return list;
    }

    @Transactional
    public Map<String, Object> updateApplicationStatus(Long applicationId, String newStatus) {
        Application a = applicationRepository.findById(applicationId)
                .orElseThrow(() -> new RuntimeException("Application not found: " + applicationId));
        String oldStatus = a.getStatus();
        a.setStatus(newStatus.toUpperCase());
        if ("SHORTLISTED".equalsIgnoreCase(newStatus) || "APPLIED".equalsIgnoreCase(newStatus)) {
            a.setJoiningLetterRole(null);
            a.setJoiningLetterSalary(null);
            a.setJoiningLetterJoiningDate(null);
            a.setJoiningLetterText(null);
            a.setJoiningLetterSentAt(null);
            a.setStudentAcceptedAt(null);
            a.setStudentDeclinedAt(null);
            a.setStudentRemarks(null);
            a.setAcademicApprovedAt(null);
            a.setAcademicRejectedAt(null);
            a.setAcademicComments(null);
            a.setAcademicApproverName(null);
        }
        applicationRepository.save(a);

        if ("SHORTLISTED".equalsIgnoreCase(newStatus) && !"SHORTLISTED".equalsIgnoreCase(oldStatus)) {
            Student s = a.getStudent();
            User su = s != null ? s.getUser() : null;
            Job j = a.getJob();
            Company comp = j != null ? j.getCompany() : null;
            String companyName = comp != null ? comp.getCompanyName() : "NovaTech Solutions";
            String jobTitle = j != null ? j.getTitle() : "Opportunity";

            if (su != null) {
                notificationService.createNotification(
                        su.getEmail(),
                        "student",
                        "Shortlisted by " + companyName + "!",
                        "Congratulations! You have been shortlisted for " + jobTitle + " at " + companyName + ". Click to view details.",
                        "job",
                        "Shortlisted",
                        "/student/jobs?jobId=" + (j != null ? j.getId() : ""),
                        j != null ? j.getId() : null,
                        a.getId(),
                        companyName,
                        jobTitle,
                        su.getFullName()
                );
            }
        }

        return Map.of("applicationId", a.getId(), "status", a.getStatus());
    }

    @Transactional
    public Map<String, Object> sendJoiningLetter(Long applicationId, SendJoiningLetterRequest req) {
        Application a = applicationRepository.findById(applicationId)
                .orElseThrow(() -> new RuntimeException("Application not found: " + applicationId));

        Job j = a.getJob();
        Company comp = j != null ? j.getCompany() : null;
        String companyName = comp != null ? comp.getCompanyName() : "NovaTech Solutions";
        String jobTitle = j != null ? j.getTitle() : "Opportunity";
        Student s = a.getStudent();
        User su = s != null ? s.getUser() : null;

        String role = req != null && req.role != null && !req.role.isBlank() ? req.role : jobTitle;
        String salary = req != null && req.salary != null && !req.salary.isBlank() ? req.salary :
                (j != null && j.getStipendOrSalary() != null ? j.getStipendOrSalary() : "₹8,50,000 / annum");
        String joiningDate = req != null && req.joiningDate != null && !req.joiningDate.isBlank() ? req.joiningDate : "01 November 2026";
        if (joiningDate.contains("August 2026")) {
            joiningDate = "01 November 2026";
        }
        String letterText = req != null && req.letterText != null && !req.letterText.isBlank() ? req.letterText :
                "Official Offer & Joining Letter: We are pleased to offer you the position of " + role + " at " + companyName + ". Please review and accept this offer.";
        if (letterText.contains("01 August 2026")) {
            letterText = letterText.replace("01 August 2026", "01 November 2026");
        }

        a.setJoiningLetterRole(role);
        a.setJoiningLetterSalary(salary);
        a.setJoiningLetterJoiningDate(joiningDate);
        a.setJoiningLetterText(letterText);
        a.setJoiningLetterSentAt(LocalDateTime.now());
        a.setStatus("AWAITING_STUDENT_ACCEPTANCE");
        applicationRepository.save(a);

        if (su != null) {
            notificationService.createNotification(
                    su.getEmail(),
                    "student",
                    "Joining Letter Received from " + companyName + "!",
                    companyName + " has extended an official joining letter for " + role + ". Click to review and respond to the offer.",
                    "offer",
                    "Joining Letter Sent",
                    "/student/jobs?jobId=" + (j != null ? j.getId() : ""),
                    j != null ? j.getId() : null,
                    a.getId(),
                    companyName,
                    role,
                    su.getFullName()
            );
        }

        Map<String, Object> res = new HashMap<>();
        res.put("applicationId", a.getId());
        res.put("status", a.getStatus());
        res.put("joiningLetterRole", a.getJoiningLetterRole());
        res.put("joiningLetterSalary", a.getJoiningLetterSalary());
        res.put("joiningLetterJoiningDate", a.getJoiningLetterJoiningDate());
        res.put("joiningLetterText", a.getJoiningLetterText());
        res.put("joiningLetterSentAt", a.getJoiningLetterSentAt() != null ? a.getJoiningLetterSentAt().toString() : null);
        return res;
    }

    @Transactional
    public Map<String, Object> respondToOffer(String userEmail, Long applicationId, String action, String remarks) {
        Application a = applicationRepository.findById(applicationId)
                .orElseThrow(() -> new RuntimeException("Application not found: " + applicationId));

        Student s = a.getStudent();
        User su = s != null ? s.getUser() : null;

        Job j = a.getJob();
        Company comp = j != null ? j.getCompany() : null;
        String companyName = comp != null ? comp.getCompanyName() : "NovaTech Solutions";
        String role = a.getJoiningLetterRole() != null ? a.getJoiningLetterRole() : (j != null ? j.getTitle() : "Opportunity");
        String studentName = su != null ? su.getFullName() : "Student";

        boolean isAccept = "ACCEPT".equalsIgnoreCase(action);
        if (isAccept) {
            a.setStatus("STUDENT_ACCEPTED");
            a.setStudentAcceptedAt(LocalDateTime.now());
            a.setStudentRemarks(remarks != null ? remarks : "Offer accepted by student.");
            applicationRepository.save(a);

            // 1. Notify Academia
            notificationService.createNotification(
                    "",
                    "academia",
                    "Opportunity Accepted by " + studentName + "!",
                    studentName + " has accepted an offer from " + companyName + " for " + role + ". Academic verification & approval required.",
                    "approval",
                    "Student Accepted",
                    "/academician/approvals?applicationId=" + a.getId(),
                    j != null ? j.getId() : null,
                    a.getId(),
                    companyName,
                    role,
                    studentName
            );

            // 2. Notify Industry
            String recruiterEmail = (comp != null && comp.getUser() != null) ? comp.getUser().getEmail() : "priya.mehta@novatech.io";
            notificationService.createNotification(
                    recruiterEmail,
                    "industry",
                    "Offer Accepted by " + studentName + "!",
                    "Candidate " + studentName + " has accepted the joining letter for " + role + ". Awaiting Academic approval.",
                    "offer",
                    "Student Accepted",
                    "/industry/candidates?applicationId=" + a.getId(),
                    j != null ? j.getId() : null,
                    a.getId(),
                    companyName,
                    role,
                    studentName
            );
        } else {
            a.setStatus("STUDENT_DECLINED");
            a.setStudentDeclinedAt(LocalDateTime.now());
            a.setStudentRemarks(remarks != null ? remarks : "Offer declined by student.");
            applicationRepository.save(a);

            // Notify Industry
            String recruiterEmail = (comp != null && comp.getUser() != null) ? comp.getUser().getEmail() : "priya.mehta@novatech.io";
            notificationService.createNotification(
                    recruiterEmail,
                    "industry",
                    "Offer Declined by " + studentName,
                    "Candidate " + studentName + " has declined the joining letter for " + role + ".",
                    "offer",
                    "Student Declined",
                    "/industry/candidates?applicationId=" + a.getId(),
                    j != null ? j.getId() : null,
                    a.getId(),
                    companyName,
                    role,
                    studentName
            );
        }

        Map<String, Object> res = new HashMap<>();
        res.put("applicationId", a.getId());
        res.put("status", a.getStatus());
        res.put("studentAcceptedAt", a.getStudentAcceptedAt() != null ? a.getStudentAcceptedAt().toString() : null);
        res.put("studentDeclinedAt", a.getStudentDeclinedAt() != null ? a.getStudentDeclinedAt().toString() : null);
        res.put("studentRemarks", a.getStudentRemarks());
        return res;
    }

    public List<Map<String, Object>> searchCandidates(String skillFilter, Double minReadiness) {
        return getCandidatesForCompany("priya.mehta@novatech.io", null, skillFilter, minReadiness);
    }

    public List<Map<String, Object>> getCandidatesForCompany(String recruiterEmail, String search, String skillFilter, Double minReadiness) {
        User recruiterUser = userRepository.findByEmail(recruiterEmail).orElse(null);
        Company company = recruiterUser != null ? companyRepository.findByUserId(recruiterUser.getId()).orElse(null) : null;
        if (company == null) {
            company = companyRepository.findAll().stream().findFirst().orElse(null);
        }

        List<Job> companyJobs = company != null ? jobRepository.findByCompanyId(company.getId()) : jobRepository.findAll();
        List<Map<String, Object>> candidateList = new ArrayList<>();
        Set<Long> processedStudentIds = new HashSet<>();

        // 1. Gather all real applications for this company's jobs
        for (Job job : companyJobs) {
            List<Application> apps = applicationRepository.findByJobId(job.getId());
            for (Application a : apps) {
                Student s = a.getStudent();
                User u = s.getUser();

                // Exclude demo/test candidate Alice Smith
                if (u != null && "Alice Smith".equalsIgnoreCase(u.getFullName())) {
                    continue;
                }

                Optional<SkillPassport> pOpt = passportRepository.findByStudentId(s.getId());
                List<SkillScore> scores = pOpt.map(p -> skillScoreRepository.findBySkillPassportId(p.getId()))
                        .orElse(Collections.emptyList());

                double readiness = (s.getPlacementReadinessScore() != null && s.getPlacementReadinessScore().doubleValue() > 0)
                        ? s.getPlacementReadinessScore().doubleValue()
                        : pOpt.map(p -> p.getOverallReadiness().doubleValue()).filter(r -> r > 0).orElse(0.0);

                List<Map<String, Object>> skills = new ArrayList<>();
                for (SkillScore sc : scores) {
                    Map<String, Object> sm = new HashMap<>();
                    sm.put("name", sc.getSkillName());
                    sm.put("score", sc.getFinalScore() != null ? sc.getFinalScore().intValue() : 0);
                    sm.put("badge", sc.getVerifiedBadge() != null ? sc.getVerifiedBadge() : "GOLD");
                    skills.add(sm);
                }

                if (skills.isEmpty()) {
                    try {
                        if (u != null && u.getEmail() != null) {
                            List<Map<String, Object>> skillMaps = studentSkillService.getStudentSkillMap(u.getEmail());
                            for (Map<String, Object> smap : skillMaps) {
                                Map<String, Object> sm = new HashMap<>();
                                sm.put("name", smap.get("name"));
                                int scVal = smap.get("score") instanceof Number ? ((Number) smap.get("score")).intValue() : 0;
                                sm.put("score", scVal);
                                sm.put("badge", smap.get("badge") != null ? smap.get("badge") : "NONE");
                                skills.add(sm);
                            }
                        }
                    } catch (Exception ignored) {}
                }

                String passportId = pOpt.map(SkillPassport::getPassportHash)
                        .orElse("SKP-2027-" + (s.getRollNumber() != null ? s.getRollNumber() : String.valueOf(s.getId())) + "-9878");

                String degreeStr = (s.getDegree() != null ? s.getDegree() : "B.Tech CSE") +
                        (s.getGraduationYear() != null ? " (" + s.getGraduationYear() + ")" : "");

                Map<String, Object> cand = new HashMap<>();
                cand.put("applicationId", a.getId());
                cand.put("id", passportId);
                cand.put("passportId", passportId);
                cand.put("studentId", s.getId());
                cand.put("name", u.getFullName());
                cand.put("email", u.getEmail());
                cand.put("college", s.getCollegeName() != null ? s.getCollegeName() : "");
                cand.put("degree", degreeStr);
                cand.put("targetRole", s.getTargetRole() != null ? s.getTargetRole() : "Software Engineer");
                cand.put("jobId", job.getId());
                cand.put("jobTitle", job.getTitle());
                cand.put("company", job.getCompany() != null ? job.getCompany().getCompanyName() : "NovaTech Solutions");
                cand.put("readiness", (int) Math.round(readiness));
                cand.put("tier", pOpt.map(SkillPassport::getVerificationTierSummary)
                        .filter(t -> t != null && !"UNVERIFIED".equalsIgnoreCase(t))
                        .orElse("Unverified"));
                cand.put("applicationStatus", a.getStatus() != null ? a.getStatus() : "APPLIED");
                cand.put("status", a.getStatus() != null ? a.getStatus() : "APPLIED");
                cand.put("appliedAt", a.getAppliedAt() != null ? a.getAppliedAt().toString() : "");
                cand.put("matchScore", a.getMatchPercentage() != null ? a.getMatchPercentage().intValue() : 0);
                cand.put("skills", skills);
                cand.put("isRealApplication", true);
                cand.put("isDemo", false);
                cand.put("joiningLetterRole", a.getJoiningLetterRole());
                cand.put("joiningLetterSalary", a.getJoiningLetterSalary());
                cand.put("joiningLetterJoiningDate", a.getJoiningLetterJoiningDate());
                cand.put("joiningLetterText", a.getJoiningLetterText());
                cand.put("joiningLetterSentAt", a.getJoiningLetterSentAt() != null ? a.getJoiningLetterSentAt().toString() : null);
                cand.put("studentAcceptedAt", a.getStudentAcceptedAt() != null ? a.getStudentAcceptedAt().toString() : null);
                cand.put("studentDeclinedAt", a.getStudentDeclinedAt() != null ? a.getStudentDeclinedAt().toString() : null);
                cand.put("studentRemarks", a.getStudentRemarks());
                cand.put("academicApprovedAt", a.getAcademicApprovedAt() != null ? a.getAcademicApprovedAt().toString() : null);
                cand.put("academicRejectedAt", a.getAcademicRejectedAt() != null ? a.getAcademicRejectedAt().toString() : null);
                cand.put("academicComments", a.getAcademicComments());
                cand.put("academicApproverName", a.getAcademicApproverName());

                candidateList.add(cand);
                processedStudentIds.add(s.getId());
            }
        }

        // 2. Filter by minReadiness, skill, and search query
        List<Map<String, Object>> filtered = new ArrayList<>();
        for (Map<String, Object> c : candidateList) {
            int r = (Integer) c.get("readiness");
            if (minReadiness != null && r < minReadiness) continue;

            if (skillFilter != null && !skillFilter.isBlank() && !"ALL".equalsIgnoreCase(skillFilter)) {
                @SuppressWarnings("unchecked")
                List<Map<String, Object>> skList = (List<Map<String, Object>>) c.get("skills");
                boolean matchesSkill = skList != null && skList.stream().anyMatch(sk ->
                        sk.get("name").toString().toLowerCase().contains(skillFilter.toLowerCase()));
                if (!matchesSkill) continue;
            }

            if (search != null && !search.isBlank()) {
                String q = search.toLowerCase().trim();
                boolean matchesSearch = c.get("name").toString().toLowerCase().contains(q)
                        || c.get("college").toString().toLowerCase().contains(q)
                        || c.get("targetRole").toString().toLowerCase().contains(q)
                        || c.get("passportId").toString().toLowerCase().contains(q)
                        || (c.get("jobTitle") != null && c.get("jobTitle").toString().toLowerCase().contains(q));
                if (!matchesSearch) {
                    @SuppressWarnings("unchecked")
                    List<Map<String, Object>> skList = (List<Map<String, Object>>) c.get("skills");
                    matchesSearch = skList != null && skList.stream().anyMatch(sk ->
                            sk.get("name").toString().toLowerCase().contains(q));
                }
                if (!matchesSearch) continue;
            }

            filtered.add(c);
        }

        // Sort: Real applications first, then by readiness descending
        filtered.sort((a, b) -> {
            boolean aReal = Boolean.TRUE.equals(a.get("isRealApplication"));
            boolean bReal = Boolean.TRUE.equals(b.get("isRealApplication"));
            if (aReal && !bReal) return -1;
            if (!aReal && bReal) return 1;
            return Integer.compare((Integer) b.get("readiness"), (Integer) a.get("readiness"));
        });

        return filtered;
    }

    private Map<String, Object> createDemoCandidate(long appId, String passportId, String name, String email,
                                                    String college, String degree, String targetRole,
                                                    int readiness, String tier, List<Map<String, Object>> skills) {
        Map<String, Object> cand = new HashMap<>();
        cand.put("applicationId", appId);
        cand.put("id", passportId);
        cand.put("passportId", passportId);
        cand.put("studentId", appId);
        cand.put("name", name);
        cand.put("email", email);
        cand.put("college", college);
        cand.put("degree", degree);
        cand.put("targetRole", targetRole);
        cand.put("jobTitle", "Junior Backend Developer");
        cand.put("readiness", readiness);
        cand.put("tier", tier);
        cand.put("applicationStatus", "APPLIED");
        cand.put("status", "APPLIED");
        cand.put("matchScore", readiness + 7);
        cand.put("isRealApplication", false);
        cand.put("isDemo", true);
        cand.put("skills", skills);
        return cand;
    }
}
