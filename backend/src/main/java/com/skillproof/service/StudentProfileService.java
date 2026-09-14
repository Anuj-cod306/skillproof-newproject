package com.skillproof.service;

import com.skillproof.entity.Student;
import com.skillproof.entity.User;
import com.skillproof.repository.StudentRepository;
import com.skillproof.repository.UserRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.math.BigDecimal;
import java.util.HashMap;
import java.util.Map;

@Service
@RequiredArgsConstructor
public class StudentProfileService {

    private final StudentRepository studentRepository;
    private final UserRepository userRepository;

    public static class ProfileUpdateRequest {
        public String fullName;
        public String college;
        public String degree;
        public String branch;
        public Integer graduationYear;
        public BigDecimal cgpa;
        public String location;
        public String targetRole;
        public String targetIndustry;
        public String bio;
        public String githubUsername;
        public String phone;
    }

    public Student getStudentByUserEmail(String email) {
        User user = userRepository.findByEmail(email)
                .orElseThrow(() -> new RuntimeException("User not found: " + email));

        if (!"ROLE_STUDENT".equalsIgnoreCase(user.getRole())) {
            throw new RuntimeException("User does not have ROLE_STUDENT: " + email);
        }

        return studentRepository.findByUserId(user.getId())
                .orElseGet(() -> {
                    Student s = Student.builder()
                            .user(user)
                            .rollNumber("STU-" + user.getId())
                            .collegeName("")
                            .degree("B.Tech Computer Science")
                            .branch("Computer Science & Engineering")
                            .graduationYear(2027)
                            .targetRole("Software Engineer")
                            .targetIndustry("Software & Technology")
                            .placementReadinessScore(BigDecimal.ZERO)
                            .build();
                    return studentRepository.save(s);
                });
    }

    public Map<String, Object> getStudentProfile(String email) {
        Student s = getStudentByUserEmail(email);
        User u = s.getUser();

        Map<String, Object> profile = new HashMap<>();
        profile.put("id", s.getId());
        profile.put("userId", u.getId());
        profile.put("name", u.getFullName());
        profile.put("fullName", u.getFullName());
        profile.put("email", u.getEmail());
        profile.put("phone", u.getPhone() != null ? u.getPhone() : "");
        profile.put("avatar", u.getAvatarUrl() != null ? u.getAvatarUrl() : "");
        profile.put("college", s.getCollegeName() != null ? s.getCollegeName() : "");
        profile.put("degree", s.getDegree() != null ? s.getDegree() : "");
        profile.put("branch", s.getBranch() != null ? s.getBranch() : "");
        profile.put("graduationYear", s.getGraduationYear() != null ? s.getGraduationYear() : 2027);
        profile.put("cgpa", s.getCgpa() != null ? s.getCgpa().toString() : "0.00");
        profile.put("location", s.getLocation() != null ? s.getLocation() : "");
        profile.put("targetRole", s.getTargetRole() != null ? s.getTargetRole() : "Software Engineer");
        profile.put("targetIndustry", s.getTargetIndustry() != null ? s.getTargetIndustry() : "Software & Technology");
        profile.put("bio", s.getBio() != null ? s.getBio() : "");
        profile.put("githubUsername", s.getGithubUsername() != null ? s.getGithubUsername() : "");
        profile.put("placementReadiness", s.getPlacementReadinessScore() != null ? s.getPlacementReadinessScore().intValue() : 0);

        return profile;
    }

    @Transactional
    public Map<String, Object> updateStudentProfile(String email, ProfileUpdateRequest req) {
        Student s = getStudentByUserEmail(email);
        User u = s.getUser();

        if (req.fullName != null && !req.fullName.isBlank()) {
            u.setFullName(req.fullName);
        }
        if (req.phone != null) {
            u.setPhone(req.phone);
        }
        userRepository.save(u);

        if (req.college != null) s.setCollegeName(req.college);
        if (req.degree != null) s.setDegree(req.degree);
        if (req.branch != null) s.setBranch(req.branch);
        if (req.graduationYear != null) s.setGraduationYear(req.graduationYear);
        if (req.cgpa != null) s.setCgpa(req.cgpa);
        if (req.location != null) s.setLocation(req.location);
        if (req.targetRole != null) s.setTargetRole(req.targetRole);
        if (req.targetIndustry != null) s.setTargetIndustry(req.targetIndustry);
        if (req.bio != null) s.setBio(req.bio);
        if (req.githubUsername != null) s.setGithubUsername(req.githubUsername);

        studentRepository.save(s);
        return getStudentProfile(email);
    }
}
