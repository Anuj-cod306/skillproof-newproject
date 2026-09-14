package com.skillproof.config;

import com.skillproof.entity.*;
import com.skillproof.repository.*;
import com.skillproof.service.PassportService;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.boot.CommandLineRunner;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Component;

import java.math.BigDecimal;
import java.time.LocalDateTime;
import java.util.List;

@Component
@RequiredArgsConstructor
@Slf4j
public class DataInitializer implements CommandLineRunner {

    private final UserRepository userRepository;
    private final StudentRepository studentRepository;
    private final CompanyRepository companyRepository;
    private final AcademicianRepository academicianRepository;
    private final InstitutionRepository institutionRepository;
    private final SkillRepository skillRepository;
    private final JobRepository jobRepository;
    private final ApplicationRepository applicationRepository;
    private final SkillPassportRepository skillPassportRepository;
    private final SkillScoreRepository skillScoreRepository;
    private final FacultyProgramRepository facultyProgramRepository;
    private final CollaborativeProjectRepository collaborativeProjectRepository;
    private final PasswordEncoder passwordEncoder;
    private final PassportService passportService;
    private final StudentSkillRepository studentSkillRepository;
    private final MentorshipEndorsementRepository mentorshipEndorsementRepository;

    @Override
    public void run(String... args) throws Exception {
        String encodedPw = passwordEncoder.encode("password123");

        // 0. Clean up any demo students and accidental non-student profiles
        userRepository.findByEmail("anuj@skillproof.edu").ifPresent(u -> {
            studentRepository.findByUserId(u.getId()).ifPresent(s -> {
                skillPassportRepository.findByStudentId(s.getId()).ifPresent(p -> {
                    skillScoreRepository.deleteAll(skillScoreRepository.findBySkillPassportId(p.getId()));
                    skillPassportRepository.delete(p);
                });
                mentorshipEndorsementRepository.deleteAll(mentorshipEndorsementRepository.findByStudentId(s.getId()));
                studentRepository.delete(s);
            });
            userRepository.delete(u);
        });

        userRepository.findByEmail("alice@test.edu").ifPresent(u -> {
            studentRepository.findByUserId(u.getId()).ifPresent(s -> {
                applicationRepository.deleteAll(applicationRepository.findByStudentId(s.getId()));
                mentorshipEndorsementRepository.deleteAll(mentorshipEndorsementRepository.findByStudentId(s.getId()));
                studentRepository.delete(s);
            });
            userRepository.delete(u);
        });

        // Ensure Dr. S. K. Verma never has a Student record
        userRepository.findByEmail("sverma@iitdelhi.ac.in").ifPresent(u -> {
            studentRepository.findByUserId(u.getId()).ifPresent(s -> {
                mentorshipEndorsementRepository.deleteAll(mentorshipEndorsementRepository.findByStudentId(s.getId()));
                studentRepository.delete(s);
            });
        });

        // Ensure real student leo has fullName "leo" and mentorship endorsement exists
        userRepository.findByEmail("leooo@gmail.com").ifPresent(u -> {
            u.setFullName("leo");
            userRepository.save(u);
            studentRepository.findByUserId(u.getId()).ifPresent(s -> {
                userRepository.findByEmail("sverma@iitdelhi.ac.in").ifPresent(au -> {
                    academicianRepository.findByUserId(au.getId()).ifPresent(acad -> {
                        if (!mentorshipEndorsementRepository.existsByStudentIdAndAcademicianId(s.getId(), acad.getId())) {
                            mentorshipEndorsementRepository.save(MentorshipEndorsement.builder()
                                    .student(s)
                                    .academician(acad)
                                    .projectTitle("Enterprise Cloud Frontend & Modern Web Architecture")
                                    .remarks("Candidate guided over 10 weeks on UI performance optimization, secure web tokens, and component architecture. Verified git commit audits and component accessibility.")
                                    .endorsed(true)
                                    .updatedAt(LocalDateTime.now())
                                    .build());
                        }
                    });
                });
            });
        });

        if (userRepository.count() > 0) {
            log.info("[DataInitializer] Database already seeded. Cleanup and synchronization verified.");
            return;
        }

        log.info("[DataInitializer] Bootstrapping initial database entities for SIH 26044...");

        // 1. Seed Stakeholders (Industry, Academia, Institution)
        User industryUser = userRepository.save(User.builder()
                .username("techcorp_hr")
                .email("priya.mehta@novatech.io")
                .password(encodedPw)
                .fullName("Priya Mehta")
                .phone("+91 9876543211")
                .role("ROLE_INDUSTRY")
                .avatarUrl("https://images.unsplash.com/photo-1573496359142-b8d87734a5a2?w=150&auto=format&fit=crop&q=80")
                .isActive(true)
                .build());

        Company company = companyRepository.save(Company.builder()
                .user(industryUser)
                .companyName("NovaTech Solutions")
                .industryType("Enterprise Cloud & AI")
                .website("https://novatech.io")
                .location("Bengaluru / Hybrid")
                .companySize("500-1000")
                .description("Pioneering cloud-native enterprise platforms and scalable microservices.")
                .verified(true)
                .build());

        User academiaUser = userRepository.save(User.builder()
                .username("dr_verma")
                .email("sverma@iitdelhi.ac.in")
                .password(encodedPw)
                .fullName("Dr. S. K. Verma")
                .phone("+91 9876543212")
                .role("ROLE_ACADEMIA")
                .avatarUrl("https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=150&auto=format&fit=crop&q=80")
                .isActive(true)
                .build());

        academicianRepository.save(Academician.builder()
                .user(academiaUser)
                .department("Computer Science & Engineering")
                .designation("Professor & Head of Dept")
                .specialization("Distributed Systems & Cloud Computing")
                .experienceYears(16)
                .build());

        User institutionUser = userRepository.save(User.builder()
                .username("institution_dean")
                .email("dean@abes.ac.in")
                .password(encodedPw)
                .fullName("Prof. Rajesh K. Bansal")
                .phone("+91 9876543213")
                .role("ROLE_INSTITUTION")
                .avatarUrl("https://images.unsplash.com/photo-1500648767791-00dcc994a43e?w=150&auto=format&fit=crop&q=80")
                .isActive(true)
                .build());

        institutionRepository.save(Institution.builder()
                .user(institutionUser)
                .institutionName("ABES Engineering College")
                .institutionCode("ABES-032")
                .accreditation("NAAC A++ | NBA Accredited")
                .state("Uttar Pradesh")
                .city("Ghaziabad")
                .website("https://abes.ac.in")
                .contactEmail("dean@abes.ac.in")
                .build());

        // 2. Seed Skills Master
        List<Skill> skills = List.of(
                Skill.builder().name("Java").category("Backend").industryDemandIndex(new BigDecimal("0.94")).build(),
                Skill.builder().name("Spring Boot").category("Backend").industryDemandIndex(new BigDecimal("0.91")).build(),
                Skill.builder().name("SQL / PostgreSQL").category("Database").industryDemandIndex(new BigDecimal("0.89")).build(),
                Skill.builder().name("React").category("Frontend").industryDemandIndex(new BigDecimal("0.93")).build(),
                Skill.builder().name("Docker").category("Cloud & DevOps").industryDemandIndex(new BigDecimal("0.88")).build(),
                Skill.builder().name("AWS Cloud").category("Cloud & DevOps").industryDemandIndex(new BigDecimal("0.92")).build(),
                Skill.builder().name("System Design").category("Core CS").industryDemandIndex(new BigDecimal("0.95")).build(),
                Skill.builder().name("Python").category("AI & ML").industryDemandIndex(new BigDecimal("0.96")).build()
        );
        skillRepository.saveAll(skills);

        // 3. Seed Initial Jobs
        Job job1 = jobRepository.save(Job.builder()
                .company(company)
                .title("Junior Backend Developer")
                .jobType("FULL_TIME")
                .location("Bengaluru / Hybrid")
                .stipendOrSalary("₹8,50,000 - ₹12,00,000 / annum")
                .experienceRequired("Fresher / 0-1 Years")
                .description("Build microservices, maintain REST APIs, and optimize PostgreSQL databases for high-scale enterprise cloud solutions.")
                .minReadinessScore(new BigDecimal("70.00"))
                .status("ACTIVE")
                .createdAt(LocalDateTime.now())
                .build());

        Job job2 = jobRepository.save(Job.builder()
                .company(company)
                .title("Cloud Infrastructure & DevOps Intern")
                .jobType("INTERNSHIP")
                .location("Hyderabad / Remote")
                .stipendOrSalary("₹35,000 / month")
                .experienceRequired("Fresher / 2027 Batch")
                .description("Automate CI/CD pipelines, containerize microservices with Docker, and manage AWS infrastructure.")
                .minReadinessScore(new BigDecimal("65.00"))
                .status("ACTIVE")
                .createdAt(LocalDateTime.now())
                .build());

        // 3a. Seed Registered Student leooo & Verified Passport
        User leoooUser = userRepository.save(User.builder()
                .username("leooo")
                .email("leooo@gmail.com")
                .password(encodedPw)
                .fullName("leo")
                .role("ROLE_STUDENT")
                .isActive(true)
                .build());

        Student leoooStudent = studentRepository.save(Student.builder()
                .user(leoooUser)
                .rollNumber("9")
                .collegeName("JNU jaipur college")
                .degree("B.Tech Computer Science")
                .branch("Computer Science")
                .graduationYear(2027)
                .targetRole("Frontend Developer")
                .placementReadinessScore(new BigDecimal("23.00"))
                .build());

        SkillPassport leoooPassport = skillPassportRepository.save(SkillPassport.builder()
                .student(leoooStudent)
                .passportHash("SKP-2027-STU9-4233")
                .overallReadiness(new BigDecimal("23.00"))
                .verificationTierSummary("ALL_4_TIERS_VERIFIED")
                .status("ACTIVE")
                .issuedAt(LocalDateTime.now())
                .updatedAt(LocalDateTime.now())
                .build());

        List<SkillScore> leoScores = List.of(
                SkillScore.builder().skillPassport(leoooPassport).skillName("Java").category("Backend").finalScore(new BigDecimal("29.00")).resumeClaimScore(BigDecimal.ZERO).githubEvidenceScore(BigDecimal.ZERO).assessmentScore(BigDecimal.ZERO).interviewScore(new BigDecimal("29.00")).verifiedBadge("NONE").build(),
                SkillScore.builder().skillPassport(leoooPassport).skillName("JavaScript").category("Frontend").finalScore(new BigDecimal("20.00")).resumeClaimScore(BigDecimal.ZERO).githubEvidenceScore(BigDecimal.ZERO).assessmentScore(BigDecimal.ZERO).interviewScore(new BigDecimal("20.00")).verifiedBadge("NONE").build(),
                SkillScore.builder().skillPassport(leoooPassport).skillName("HTML").category("Frontend").finalScore(new BigDecimal("26.00")).resumeClaimScore(BigDecimal.ZERO).githubEvidenceScore(BigDecimal.ZERO).assessmentScore(BigDecimal.ZERO).interviewScore(new BigDecimal("26.00")).verifiedBadge("NONE").build(),
                SkillScore.builder().skillPassport(leoooPassport).skillName("Data Structures & Algorithms").category("Core CS").finalScore(new BigDecimal("20.00")).resumeClaimScore(BigDecimal.ZERO).githubEvidenceScore(BigDecimal.ZERO).assessmentScore(BigDecimal.ZERO).interviewScore(new BigDecimal("20.00")).verifiedBadge("NONE").build(),
                SkillScore.builder().skillPassport(leoooPassport).skillName("Problem Solving").category("Core CS").finalScore(new BigDecimal("20.00")).resumeClaimScore(BigDecimal.ZERO).githubEvidenceScore(BigDecimal.ZERO).assessmentScore(BigDecimal.ZERO).interviewScore(new BigDecimal("20.00")).verifiedBadge("NONE").build()
        );
        skillScoreRepository.saveAll(leoScores);

        if (applicationRepository.findByJobIdAndStudentId(job1.getId(), leoooStudent.getId()).isEmpty()) {
            applicationRepository.save(Application.builder()
                    .job(job1)
                    .student(leoooStudent)
                    .status("SHORTLISTED")
                    .matchPercentage(BigDecimal.ZERO)
                    .appliedAt(LocalDateTime.now())
                    .build());
        }

        if (applicationRepository.findByJobIdAndStudentId(job2.getId(), leoooStudent.getId()).isEmpty()) {
            applicationRepository.save(Application.builder()
                    .job(job2)
                    .student(leoooStudent)
                    .status("SHORTLISTED")
                    .matchPercentage(BigDecimal.ZERO)
                    .appliedAt(LocalDateTime.now())
                    .build());
        }

        // 3b. Seed Mentorship Endorsement for Real Student leo
        mentorshipEndorsementRepository.save(MentorshipEndorsement.builder()
                .student(leoooStudent)
                .academician(academicianRepository.findByUserId(academiaUser.getId()).orElse(null))
                .projectTitle("Enterprise Cloud Frontend & Modern Web Architecture")
                .remarks("Candidate guided over 10 weeks on UI performance optimization, secure web tokens, and component architecture. Verified git commit audits and component accessibility.")
                .endorsed(true)
                .updatedAt(LocalDateTime.now())
                .build());

        // 4. Seed Faculty Programs & Collaborative Projects
        facultyProgramRepository.save(FacultyProgram.builder()
                .companyId(company.getId())
                .title("Enterprise Cloud Systems Faculty Immersion Program")
                .sponsorCompany("NovaTech Solutions")
                .type("FACULTY_INTERNSHIP")
                .domain("Cloud Architecture & Kubernetes")
                .duration("4 Weeks (July 2026)")
                .location("Bengaluru R&D Lab")
                .stipend("₹60,000 / month + Travel Allowance")
                .deadline("15 April 2026")
                .mode("HYBRID")
                .description("Hands-on architectural rotation across production microservices, resilience testing, and DevOps deployment pipelines.")
                .status("ACCEPTING_NOMINATIONS")
                .build());

        facultyProgramRepository.save(FacultyProgram.builder()
                .companyId(company.getId())
                .title("National FDP on AI-Assisted Software Engineering & Spring AI")
                .sponsorCompany("Ministry of Education & CloudSphere")
                .type("FDP")
                .domain("AI & Full Stack Java")
                .duration("2 Weeks (Hybrid)")
                .location("Online + Regional IIT Nodes")
                .stipend("Full AICTE Sponsorship + Teaching Toolkit")
                .deadline("30 May 2026")
                .mode("HYBRID")
                .description("Training engineering faculty on modern Spring AI integrations, LLM prompt engineering, and automated testing tools.")
                .status("ACCEPTING_NOMINATIONS")
                .build());

        facultyProgramRepository.save(FacultyProgram.builder()
                .companyId(company.getId())
                .title("Industrial Architecture Consultancy: Real-Time Payment Ledgers")
                .sponsorCompany("FinTech Alliance Corp")
                .type("CONSULTANCY")
                .domain("FinTech & Concurrency")
                .duration("6 Months (Part-Time / Advisory)")
                .location("Hybrid / Remote")
                .stipend("₹2,50,000 Advisory Grant")
                .deadline("Rolling Nominations")
                .mode("HYBRID")
                .description("Seeking senior faculty in distributed systems to review fault-tolerant database replication and ACID guarantees.")
                .status("ACCEPTING_NOMINATIONS")
                .build());

        collaborativeProjectRepository.save(CollaborativeProject.builder()
                .companyId(company.getId())
                .title("High-Throughput Financial Transaction Reconciliation Engine")
                .domain("FinTech & Distributed Databases")
                .stipend("₹25,000 / student / month")
                .studentCapacity(4)
                .description("Joint academic-industry capstone project building a double-entry audit engine.")
                .status("OPEN_FOR_STUDENTS")
                .build());

        log.info("[DataInitializer] Initial database bootstrapping completed successfully.");
    }
}
