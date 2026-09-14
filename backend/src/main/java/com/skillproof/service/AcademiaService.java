package com.skillproof.service;

import com.skillproof.entity.*;
import com.skillproof.repository.*;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.math.BigDecimal;
import java.time.LocalDateTime;
import java.util.*;

@Service
@RequiredArgsConstructor
public class AcademiaService {

    private final FacultyProgramRepository facultyProgramRepository;
    private final CollaborativeProjectRepository collaborativeProjectRepository;
    private final AcademicianRepository academicianRepository;
    private final UserRepository userRepository;
    private final StudentRepository studentRepository;
    private final FacultyNominationRepository facultyNominationRepository;
    private final MentorshipEndorsementRepository mentorshipEndorsementRepository;
    private final SkillPassportRepository passportRepository;
    private final SkillScoreRepository skillScoreRepository;
    private final ApplicationRepository applicationRepository;
    private final NotificationService notificationService;

    public List<FacultyProgram> getFacultyPrograms(String type) {
        if (type != null && !type.isBlank()) {
            return facultyProgramRepository.findByType(type.toUpperCase());
        }
        return facultyProgramRepository.findAll();
    }

    @Transactional
    public FacultyProgram createFacultyProgram(FacultyProgram program) {
        program.setCreatedAt(LocalDateTime.now());
        if (program.getStatus() == null) program.setStatus("ACCEPTING_NOMINATIONS");
        return facultyProgramRepository.save(program);
    }

    public List<CollaborativeProject> getCollaborativeProjects() {
        return collaborativeProjectRepository.findAll();
    }

    @Transactional
    public CollaborativeProject createCollaborativeProject(CollaborativeProject project) {
        project.setCreatedAt(LocalDateTime.now());
        if (project.getStatus() == null) project.setStatus("OPEN_FOR_STUDENTS");
        return collaborativeProjectRepository.save(project);
    }

    public List<Map<String, Object>> getMentorshipStudents(String userEmail) {
        User user = userRepository.findByEmail(userEmail).orElse(null);
        Academician academician = user != null ? academicianRepository.findByUserId(user.getId()).orElse(null) : null;

        List<Student> students = studentRepository.findAll();
        List<Map<String, Object>> list = new ArrayList<>();

        for (Student s : students) {
            User u = s.getUser();
            if (u == null) continue;
            // Only real registered students
            if (!"ROLE_STUDENT".equalsIgnoreCase(u.getRole())) continue;

            // Exclude mock demo accounts
            if ("anuj@skillproof.edu".equalsIgnoreCase(u.getEmail()) || "alice@test.edu".equalsIgnoreCase(u.getEmail()) ||
                "Anuj Sharma".equalsIgnoreCase(u.getFullName()) || "Alice Smith".equalsIgnoreCase(u.getFullName())) {
                continue;
            }

            Optional<SkillPassport> passportOpt = passportRepository.findByStudentId(s.getId());
            String passportId = passportOpt.map(SkillPassport::getPassportHash).orElse(null);

            boolean isEndorsed = false;
            String projectTitle = "Enterprise Cloud Frontend & Modern Web Architecture";
            String remarks = "Candidate guided over 10 weeks on UI performance optimization, secure web tokens, and component architecture. Verified git commit audits.";

            if (academician != null) {
                Optional<MentorshipEndorsement> endOpt = mentorshipEndorsementRepository
                        .findByStudentIdAndAcademicianId(s.getId(), academician.getId());
                if (endOpt.isPresent()) {
                    isEndorsed = endOpt.get().isEndorsed();
                    if (endOpt.get().getProjectTitle() != null) projectTitle = endOpt.get().getProjectTitle();
                    if (endOpt.get().getRemarks() != null) remarks = endOpt.get().getRemarks();
                }
            }

            BigDecimal readiness = s.getPlacementReadinessScore() != null
                    ? s.getPlacementReadinessScore()
                    : passportOpt.map(SkillPassport::getOverallReadiness).orElse(BigDecimal.ZERO);

            Map<String, Object> map = new HashMap<>();
            map.put("studentId", s.getId());
            map.put("id", s.getId());
            map.put("name", u.getFullName());
            map.put("email", u.getEmail());
            map.put("college", s.getCollegeName() != null ? s.getCollegeName() : "");
            map.put("degree", s.getDegree() != null ? s.getDegree() : "B.Tech Computer Science");
            map.put("branch", s.getBranch() != null ? s.getBranch() : "Computer Science");
            map.put("rollNumber", s.getRollNumber() != null ? s.getRollNumber() : "");
            map.put("targetRole", s.getTargetRole() != null ? s.getTargetRole() : "Frontend Developer");
            map.put("readiness", readiness);
            map.put("passportId", passportId);
            map.put("status", "Active Guidance");
            map.put("endorsed", isEndorsed);
            map.put("projectTitle", projectTitle);
            map.put("remarks", remarks);
            list.add(map);
        }
        return list;
    }

    public Map<String, Object> getStudentMentorshipDetail(String userEmail, Long studentId) {
        User user = userRepository.findByEmail(userEmail)
                .orElseThrow(() -> new RuntimeException("User not found: " + userEmail));
        Academician academician = academicianRepository.findByUserId(user.getId())
                .orElseGet(() -> academicianRepository.save(Academician.builder()
                        .user(user)
                        .department("Computer Science & Engineering")
                        .designation("Professor")
                        .build()));

        Student s = null;
        if (studentId != null && studentId > 0) {
            s = studentRepository.findById(studentId).orElse(null);
        }
        if (s == null) {
            s = studentRepository.findAll().stream()
                    .filter(st -> st.getUser() != null && "ROLE_STUDENT".equalsIgnoreCase(st.getUser().getRole()))
                    .filter(st -> !"anuj@skillproof.edu".equalsIgnoreCase(st.getUser().getEmail()) && !"alice@test.edu".equalsIgnoreCase(st.getUser().getEmail()))
                    .findFirst()
                    .orElseThrow(() -> new RuntimeException("No eligible mentorship student found"));
        }

        User u = s.getUser();
        Optional<SkillPassport> passportOpt = passportRepository.findByStudentId(s.getId());
        String passportId = passportOpt.map(SkillPassport::getPassportHash).orElse(null);

        boolean isEndorsed = false;
        String projectTitle = "Enterprise Cloud Frontend & Modern Web Architecture";
        String remarks = "Candidate guided over 10 weeks on UI performance optimization, secure web tokens, and component architecture. Verified git commit audits.";

        Optional<MentorshipEndorsement> endOpt = mentorshipEndorsementRepository
                .findByStudentIdAndAcademicianId(s.getId(), academician.getId());
        if (endOpt.isPresent()) {
            isEndorsed = endOpt.get().isEndorsed();
            if (endOpt.get().getProjectTitle() != null) projectTitle = endOpt.get().getProjectTitle();
            if (endOpt.get().getRemarks() != null) remarks = endOpt.get().getRemarks();
        }

        List<Map<String, Object>> skills = new ArrayList<>();
        if (passportOpt.isPresent()) {
            List<SkillScore> scores = skillScoreRepository.findBySkillPassportId(passportOpt.get().getId());
            for (SkillScore sc : scores) {
                skills.add(Map.of(
                        "name", sc.getSkillName(),
                        "score", sc.getFinalScore() != null ? sc.getFinalScore().intValue() : 0,
                        "badge", sc.getVerifiedBadge() != null ? sc.getVerifiedBadge() : "NONE"
                ));
            }
        }

        BigDecimal readiness = s.getPlacementReadinessScore() != null
                ? s.getPlacementReadinessScore()
                : passportOpt.map(SkillPassport::getOverallReadiness).orElse(BigDecimal.ZERO);

        Map<String, Object> res = new HashMap<>();
        res.put("studentId", s.getId());
        res.put("id", s.getId());
        res.put("name", u != null ? u.getFullName() : "Student");
        res.put("email", u != null ? u.getEmail() : "");
        res.put("college", s.getCollegeName() != null ? s.getCollegeName() : "");
        res.put("degree", s.getDegree() != null ? s.getDegree() : "B.Tech Computer Science");
        res.put("rollNumber", s.getRollNumber() != null ? s.getRollNumber() : "");
        res.put("targetRole", s.getTargetRole() != null ? s.getTargetRole() : "Frontend Developer");
        res.put("readiness", readiness);
        res.put("passportId", passportId);
        res.put("endorsed", isEndorsed);
        res.put("projectTitle", projectTitle);
        res.put("remarks", remarks);
        res.put("skills", skills);
        return res;
    }

    @Transactional
    public Map<String, Object> updateStudentEndorsement(String userEmail, Long studentId, Boolean endorsed, String projectTitle, String remarks) {
        User user = userRepository.findByEmail(userEmail)
                .orElseThrow(() -> new RuntimeException("User not found: " + userEmail));
        Academician academician = academicianRepository.findByUserId(user.getId())
                .orElseGet(() -> academicianRepository.save(Academician.builder()
                        .user(user)
                        .department("Computer Science & Engineering")
                        .designation("Professor")
                        .build()));

        Student student = studentRepository.findById(studentId)
                .orElseThrow(() -> new RuntimeException("Student not found: " + studentId));

        MentorshipEndorsement endorsement = mentorshipEndorsementRepository
                .findByStudentIdAndAcademicianId(student.getId(), academician.getId())
                .orElseGet(() -> MentorshipEndorsement.builder()
                        .student(student)
                        .academician(academician)
                        .projectTitle("Enterprise Banking & Transaction Ledger (Sponsor: NovaTech Solutions)")
                        .remarks("Candidate implemented double-entry ledger handling 1,200 req/sec with ACID compliance and pessimistic locking. Mentored over 12 weeks with verified git commit audits.")
                        .build());

        boolean newEndorsed = (endorsed != null) ? endorsed : !endorsement.isEndorsed();
        endorsement.setEndorsed(newEndorsed);
        if (projectTitle != null && !projectTitle.isBlank()) endorsement.setProjectTitle(projectTitle);
        if (remarks != null && !remarks.isBlank()) endorsement.setRemarks(remarks);
        endorsement.setUpdatedAt(LocalDateTime.now());

        MentorshipEndorsement saved = mentorshipEndorsementRepository.save(endorsement);

        Map<String, Object> res = new HashMap<>();
        res.put("studentId", student.getId());
        res.put("studentName", student.getUser() != null ? student.getUser().getFullName() : "Student");
        res.put("endorsed", saved.isEndorsed());
        res.put("projectTitle", saved.getProjectTitle());
        res.put("remarks", saved.getRemarks());
        res.put("updatedAt", saved.getUpdatedAt().toString());
        res.put("message", saved.isEndorsed() ? "Faculty verification endorsement active on student passport." : "Faculty endorsement withdrawn.");
        return res;
    }

    @Transactional
    public Map<String, Object> nominateFacultyProgram(String userEmail, Long programId) {
        User user = userRepository.findByEmail(userEmail)
                .orElseThrow(() -> new RuntimeException("User not found: " + userEmail));

        Academician academician = academicianRepository.findByUserId(user.getId())
                .orElseGet(() -> academicianRepository.save(Academician.builder()
                        .user(user)
                        .department("Computer Science & Engineering")
                        .designation("Professor")
                        .build()));

        FacultyProgram program = facultyProgramRepository.findById(programId)
                .orElseGet(() -> {
                    return facultyProgramRepository.save(FacultyProgram.builder()
                            .title("Faculty Program #" + programId)
                            .type("FDP")
                            .domain("Engineering & AI")
                            .duration("4 Weeks")
                            .status("ACCEPTING_NOMINATIONS")
                            .build());
                });

        Optional<FacultyNomination> existing = facultyNominationRepository
                .findByFacultyProgramIdAndAcademicianId(program.getId(), academician.getId());

        if (existing.isPresent()) {
            FacultyNomination fn = existing.get();
            Map<String, Object> res = new HashMap<>();
            res.put("id", fn.getId());
            res.put("programId", program.getId());
            res.put("programTitle", program.getTitle());
            res.put("status", fn.getStatus());
            res.put("nominatedAt", fn.getNominatedAt() != null ? fn.getNominatedAt().toString() : "");
            res.put("message", "Already nominated for this program.");
            res.put("alreadyNominated", true);
            return res;
        }

        FacultyNomination nomination = facultyNominationRepository.save(FacultyNomination.builder()
                .facultyProgram(program)
                .academician(academician)
                .status("NOMINATED")
                .nominatedAt(LocalDateTime.now())
                .build());

        Map<String, Object> res = new HashMap<>();
        res.put("id", nomination.getId());
        res.put("programId", program.getId());
        res.put("programTitle", program.getTitle());
        res.put("status", nomination.getStatus());
        res.put("nominatedAt", nomination.getNominatedAt().toString());
        res.put("message", "Faculty nomination submitted successfully.");
        res.put("alreadyNominated", false);
        return res;
    }

    public List<Map<String, Object>> getMyNominations(String userEmail) {
        User user = userRepository.findByEmail(userEmail).orElse(null);
        if (user == null) return Collections.emptyList();

        Academician academician = academicianRepository.findByUserId(user.getId()).orElse(null);
        if (academician == null) return Collections.emptyList();

        List<FacultyNomination> nominations = facultyNominationRepository.findByAcademicianId(academician.getId());
        List<Map<String, Object>> result = new ArrayList<>();
        for (FacultyNomination n : nominations) {
            Map<String, Object> map = new HashMap<>();
            map.put("id", n.getId());
            map.put("programId", n.getFacultyProgram().getId());
            map.put("programTitle", n.getFacultyProgram().getTitle());
            map.put("programType", n.getFacultyProgram().getType());
            map.put("status", n.getStatus());
            map.put("nominatedAt", n.getNominatedAt() != null ? n.getNominatedAt().toString() : "");
            result.add(map);
        }
        return result;
    }

    public List<Map<String, Object>> getOpportunityApprovals(String userEmail) {
        List<Application> apps = applicationRepository.findAll();
        List<Map<String, Object>> list = new ArrayList<>();

        for (Application a : apps) {
            Student s = a.getStudent();
            if (s == null) continue;
            User u = s.getUser();
            if (u == null) continue;

            // Exclude mock demo accounts
            if ("anuj@skillproof.edu".equalsIgnoreCase(u.getEmail()) || "alice@test.edu".equalsIgnoreCase(u.getEmail()) ||
                "Anuj Sharma".equalsIgnoreCase(u.getFullName()) || "Alice Smith".equalsIgnoreCase(u.getFullName())) {
                continue;
            }

            // Only applications that have joining letter or student response or relevant status
            String status = a.getStatus();
            boolean isRelevant = a.getJoiningLetterSentAt() != null ||
                    a.getStudentAcceptedAt() != null ||
                    "AWAITING_STUDENT_ACCEPTANCE".equalsIgnoreCase(status) ||
                    "STUDENT_ACCEPTED".equalsIgnoreCase(status) ||
                    "CONFIRMED".equalsIgnoreCase(status) ||
                    "JOINING".equalsIgnoreCase(status) ||
                    "ACADEMICALLY_APPROVED".equalsIgnoreCase(status) ||
                    "ACADEMICALLY_REJECTED".equalsIgnoreCase(status) ||
                    "STUDENT_DECLINED".equalsIgnoreCase(status) ||
                    "SHORTLISTED".equalsIgnoreCase(status);

            if (!isRelevant) continue;

            Job job = a.getJob();
            Company comp = job != null ? job.getCompany() : null;
            Optional<SkillPassport> passportOpt = passportRepository.findByStudentId(s.getId());
            String passportId = passportOpt.map(SkillPassport::getPassportHash).orElse(null);

            BigDecimal readiness = s.getPlacementReadinessScore() != null
                    ? s.getPlacementReadinessScore()
                    : passportOpt.map(SkillPassport::getOverallReadiness).orElse(BigDecimal.ZERO);

            Map<String, Object> map = new HashMap<>();
            map.put("applicationId", a.getId());
            map.put("studentId", s.getId());
            map.put("studentName", u.getFullName());
            map.put("studentEmail", u.getEmail());
            map.put("college", s.getCollegeName() != null ? s.getCollegeName() : "IIT Delhi");
            map.put("degree", s.getDegree() != null ? s.getDegree() : "B.Tech Computer Science");
            map.put("branch", s.getBranch() != null ? s.getBranch() : "Computer Science");
            map.put("rollNumber", s.getRollNumber() != null ? s.getRollNumber() : "");
            map.put("passportId", passportId != null ? passportId : ("SKP-2027-STU" + s.getId() + "-4233"));
            map.put("readiness", readiness.intValue());
            map.put("jobId", job != null ? job.getId() : null);
            map.put("jobTitle", job != null ? job.getTitle() : "Position");
            map.put("company", comp != null ? comp.getCompanyName() : "Partner Company");
            map.put("location", job != null ? job.getLocation() : "Remote");
            map.put("status", a.getStatus());
            map.put("appliedAt", a.getAppliedAt() != null ? a.getAppliedAt().toString() : "");
            map.put("joiningLetterRole", a.getJoiningLetterRole() != null ? a.getJoiningLetterRole() : (job != null ? job.getTitle() : ""));
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

    @Transactional
    public Map<String, Object> respondToOpportunityApproval(String userEmail, Long applicationId, String action, String comments) {
        Application a = applicationRepository.findById(applicationId)
                .orElseThrow(() -> new RuntimeException("Application not found: " + applicationId));

        User approverUser = userRepository.findByEmail(userEmail).orElse(null);
        String approverName = approverUser != null ? approverUser.getFullName() : "Dr. S. K. Verma";

        Student s = a.getStudent();
        User su = s != null ? s.getUser() : null;
        String studentName = su != null ? su.getFullName() : "Student";
        String studentEmail = su != null ? su.getEmail() : "";

        Job j = a.getJob();
        Company comp = j != null ? j.getCompany() : null;
        String companyName = comp != null ? comp.getCompanyName() : "Company";
        String role = a.getJoiningLetterRole() != null ? a.getJoiningLetterRole() : (j != null ? j.getTitle() : "Role");

        boolean isApprove = "APPROVE".equalsIgnoreCase(action) || "ACADEMICALLY_APPROVED".equalsIgnoreCase(action);

        if (isApprove) {
            a.setAcademicApprovedAt(LocalDateTime.now());
            a.setAcademicApproverName(approverName);
            a.setAcademicComments(comments != null && !comments.isBlank() ? comments : "Verified academic eligibility, credit transfer clearance, and department endorsement granted.");
            a.setStatus("CONFIRMED");
            applicationRepository.save(a);

            // Notify Student
            if (!studentEmail.isBlank()) {
                notificationService.createNotification(
                        studentEmail,
                        "student",
                        "Placement Confirmed - Academic Approval Granted!",
                        approverName + " has approved your placement at " + companyName + " for " + role + ". Your position is officially CONFIRMED!",
                        "approval",
                        "CONFIRMED",
                        "/student/jobs?jobId=" + (j != null ? j.getId() : ""),
                        j != null ? j.getId() : null,
                        a.getId(),
                        companyName,
                        role,
                        studentName
                );
            }

            // Notify Industry
            String recruiterEmail = (comp != null && comp.getUser() != null) ? comp.getUser().getEmail() : "priya.mehta@novatech.io";
            notificationService.createNotification(
                    recruiterEmail,
                    "industry",
                    "Offer Confirmed for " + studentName + " (Academic Approval Received)",
                    approverName + " has approved " + studentName + "'s joining for " + role + ". Status is now CONFIRMED.",
                    "approval",
                    "CONFIRMED",
                    "/industry/candidates?applicationId=" + a.getId(),
                    j != null ? j.getId() : null,
                    a.getId(),
                    companyName,
                    role,
                    studentName
            );
        } else {
            a.setAcademicRejectedAt(LocalDateTime.now());
            a.setAcademicApproverName(approverName);
            a.setAcademicComments(comments != null && !comments.isBlank() ? comments : "Academic eligibility not satisfied.");
            a.setStatus("ACADEMICALLY_REJECTED");
            applicationRepository.save(a);

            // Notify Student
            if (!studentEmail.isBlank()) {
                notificationService.createNotification(
                        studentEmail,
                        "student",
                        "Academic Verification Update",
                        "Faculty " + approverName + " did not grant approval for " + role + ": " + a.getAcademicComments(),
                        "approval",
                        "REJECTED",
                        "/student/jobs?jobId=" + (j != null ? j.getId() : ""),
                        j != null ? j.getId() : null,
                        a.getId(),
                        companyName,
                        role,
                        studentName
                );
            }

            // Notify Industry
            String recruiterEmail = (comp != null && comp.getUser() != null) ? comp.getUser().getEmail() : "priya.mehta@novatech.io";
            notificationService.createNotification(
                    recruiterEmail,
                    "industry",
                    "Academic Approval Declined for " + studentName,
                    "Faculty " + approverName + " rejected approval for " + studentName + " (" + role + "): " + a.getAcademicComments(),
                    "approval",
                    "REJECTED",
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
        res.put("academicApprovedAt", a.getAcademicApprovedAt() != null ? a.getAcademicApprovedAt().toString() : null);
        res.put("academicRejectedAt", a.getAcademicRejectedAt() != null ? a.getAcademicRejectedAt().toString() : null);
        res.put("academicApproverName", a.getAcademicApproverName());
        res.put("academicComments", a.getAcademicComments());
        return res;
    }
}
