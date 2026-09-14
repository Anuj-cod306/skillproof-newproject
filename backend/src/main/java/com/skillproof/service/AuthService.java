package com.skillproof.service;

import com.skillproof.entity.*;
import com.skillproof.repository.*;
import com.skillproof.security.JwtTokenProvider;
import lombok.RequiredArgsConstructor;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.math.BigDecimal;
import java.util.*;

@Service
@RequiredArgsConstructor
public class AuthService {

    private final UserRepository userRepository;
    private final StudentRepository studentRepository;
    private final CompanyRepository companyRepository;
    private final AcademicianRepository academicianRepository;
    private final InstitutionRepository institutionRepository;
    private final PasswordEncoder passwordEncoder;
    private final JwtTokenProvider tokenProvider;

    public static class RegisterRequest {
        public String username;
        public String email;
        public String password;
        public String fullName;
        public String role; // student, industry, academia, institution
        public String phone;
        // Role specific
        public String college;
        public String degree;
        public String branch;
        public Integer graduationYear;
        public String companyName;
        public String industryType;
        public String department;
        public String designation;
        public String institutionName;
        public String institutionCode;
        public String targetGoal;
        public String targetRole;
    }

    public static class AuthResult {
        public String token;
        public Long userId;
        public String username;
        public String fullName;
        public String role;
        public Long profileId;
        public String message;
    }

    @Transactional
    public AuthResult register(RegisterRequest req) {
        if (userRepository.existsByEmail(req.email)) {
            throw new RuntimeException("Email is already registered: " + req.email);
        }

        String uname = (req.username != null && !req.username.isBlank()) 
                ? req.username 
                : req.email.split("@")[0] + "_" + System.currentTimeMillis() % 1000;

        if (userRepository.existsByUsername(uname)) {
            uname = uname + "_" + ((int) (Math.random() * 900) + 100);
        }

        String roleStr = (req.role != null) ? req.role.toLowerCase() : "student";
        String springRole = switch (roleStr) {
            case "industry" -> "ROLE_INDUSTRY";
            case "academia", "academician" -> "ROLE_ACADEMIA";
            case "institution" -> "ROLE_INSTITUTION";
            default -> "ROLE_STUDENT";
        };

        User user = User.builder()
                .username(uname)
                .email(req.email)
                .password(passwordEncoder.encode(req.password))
                .fullName(req.fullName != null ? req.fullName : "SkillProof User")
                .phone(req.phone)
                .role(springRole)
                .isActive(true)
                .build();

        user = userRepository.save(user);

        Long profileId = null;

        // Create stakeholder profile
        if ("ROLE_STUDENT".equals(springRole)) {
            String roleTarget = (req.targetRole != null && !req.targetRole.isBlank())
                    ? req.targetRole
                    : (req.targetGoal != null && !req.targetGoal.isBlank() ? req.targetGoal : "Software Engineer");

            Student student = Student.builder()
                    .user(user)
                    .rollNumber("STU-" + user.getId())
                    .collegeName(req.college != null && !req.college.isBlank() ? req.college : "")
                    .degree(req.degree != null && !req.degree.isBlank() ? req.degree : "B.Tech Computer Science")
                    .branch(req.branch != null && !req.branch.isBlank() ? req.branch : "Computer Science & Engineering")
                    .graduationYear(req.graduationYear != null ? req.graduationYear : 2027)
                    .cgpa(new BigDecimal("0.00"))
                    .targetRole(roleTarget)
                    .targetIndustry("Software & Technology")
                    .placementReadinessScore(BigDecimal.ZERO)
                    .build();
            student = studentRepository.save(student);
            profileId = student.getId();
        } else if ("ROLE_INDUSTRY".equals(springRole)) {
            Company company = Company.builder()
                    .user(user)
                    .companyName(req.companyName != null ? req.companyName : "NovaTech Solutions")
                    .industryType(req.industryType != null ? req.industryType : "Enterprise Software")
                    .verified(true)
                    .build();
            company = companyRepository.save(company);
            profileId = company.getId();
        } else if ("ROLE_ACADEMIA".equals(springRole)) {
            Academician academician = Academician.builder()
                    .user(user)
                    .department(req.department != null ? req.department : "Computer Science & Engineering")
                    .designation(req.designation != null ? req.designation : "Associate Professor")
                    .build();
            academician = academicianRepository.save(academician);
            profileId = academician.getId();
        } else if ("ROLE_INSTITUTION".equals(springRole)) {
            Institution institution = Institution.builder()
                    .user(user)
                    .institutionName(req.institutionName != null ? req.institutionName : "ABES Engineering College")
                    .institutionCode(req.institutionCode != null ? req.institutionCode : "ABES-" + (System.currentTimeMillis() % 10000))
                    .accreditation("NAAC A++")
                    .build();
            institution = institutionRepository.save(institution);
            profileId = institution.getId();
        }

        String token = tokenProvider.generateToken(user.getEmail(), springRole);

        AuthResult result = new AuthResult();
        result.token = token;
        result.userId = user.getId();
        result.username = user.getUsername();
        result.fullName = user.getFullName();
        result.role = springRole;
        result.profileId = profileId;
        result.message = "Registration successful.";
        return result;
    }

    public AuthResult login(String email, String rawPassword, String requestedRole) {
        User user = userRepository.findByEmail(email)
                .orElseThrow(() -> new RuntimeException("Invalid credentials: user not found"));

        if (!passwordEncoder.matches(rawPassword, user.getPassword())) {
            throw new RuntimeException("Invalid credentials: password incorrect");
        }

        String token = tokenProvider.generateToken(user.getEmail(), user.getRole());

        Long profileId = null;
        if ("ROLE_STUDENT".equals(user.getRole())) {
            profileId = studentRepository.findByUserId(user.getId()).map(Student::getId).orElse(null);
        } else if ("ROLE_INDUSTRY".equals(user.getRole())) {
            profileId = companyRepository.findByUserId(user.getId()).map(Company::getId).orElse(null);
        } else if ("ROLE_ACADEMIA".equals(user.getRole())) {
            profileId = academicianRepository.findByUserId(user.getId()).map(Academician::getId).orElse(null);
        } else if ("ROLE_INSTITUTION".equals(user.getRole())) {
            profileId = institutionRepository.findByUserId(user.getId()).map(Institution::getId).orElse(null);
        }

        AuthResult result = new AuthResult();
        result.token = token;
        result.userId = user.getId();
        result.username = user.getUsername();
        result.fullName = user.getFullName();
        result.role = user.getRole();
        result.profileId = profileId;
        result.message = "Login successful.";
        return result;
    }

    public Map<String, Object> getCurrentUser(String email) {
        User user = userRepository.findByEmail(email)
                .orElseThrow(() -> new RuntimeException("User not found: " + email));

        Map<String, Object> map = new HashMap<>();
        map.put("id", user.getId());
        map.put("email", user.getEmail());
        map.put("fullName", user.getFullName());
        map.put("username", user.getUsername());
        map.put("role", user.getRole());
        map.put("phone", user.getPhone());
        map.put("avatarUrl", user.getAvatarUrl());

        if ("ROLE_STUDENT".equals(user.getRole())) {
            studentRepository.findByUserId(user.getId()).ifPresent(s -> {
                map.put("profileId", s.getId());
                map.put("college", s.getCollegeName());
                map.put("degree", s.getDegree());
                map.put("branch", s.getBranch());
                map.put("graduationYear", s.getGraduationYear());
                map.put("cgpa", s.getCgpa());
                map.put("targetRole", s.getTargetRole());
                map.put("targetIndustry", s.getTargetIndustry());
                map.put("githubUsername", s.getGithubUsername());
                map.put("placementReadiness", s.getPlacementReadinessScore());
                map.put("bio", s.getBio());
            });
        } else if ("ROLE_INDUSTRY".equals(user.getRole())) {
            companyRepository.findByUserId(user.getId()).ifPresent(c -> {
                map.put("profileId", c.getId());
                map.put("companyName", c.getCompanyName());
                map.put("industryType", c.getIndustryType());
                map.put("website", c.getWebsite());
                map.put("location", c.getLocation());
            });
        } else if ("ROLE_ACADEMIA".equals(user.getRole())) {
            academicianRepository.findByUserId(user.getId()).ifPresent(a -> {
                map.put("profileId", a.getId());
                map.put("department", a.getDepartment());
                map.put("designation", a.getDesignation());
                map.put("specialization", a.getSpecialization());
            });
        } else if ("ROLE_INSTITUTION".equals(user.getRole())) {
            institutionRepository.findByUserId(user.getId()).ifPresent(i -> {
                map.put("profileId", i.getId());
                map.put("institutionName", i.getInstitutionName());
                map.put("institutionCode", i.getInstitutionCode());
                map.put("accreditation", i.getAccreditation());
            });
        }

        return map;
    }
}
