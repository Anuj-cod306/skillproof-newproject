package com.skillproof.entity;

import jakarta.persistence.*;
import lombok.*;
import java.math.BigDecimal;
import java.time.LocalDateTime;

@Entity
@Table(name = "students")
@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class Student {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @OneToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "user_id", unique = true, nullable = false)
    private User user;

    @Column(name = "institution_id")
    private Long institutionId;

    @Column(name = "roll_number", length = 50)
    private String rollNumber;

    @Column(name = "college_name", nullable = false, length = 200)
    private String collegeName;

    @Column(nullable = false, length = 100)
    private String degree;

    @Column(nullable = false, length = 100)
    private String branch;

    @Column(name = "graduation_year", nullable = false)
    private Integer graduationYear;

    @Column(precision = 3, scale = 2)
    private BigDecimal cgpa;

    @Column(length = 120)
    private String location;

    @Column(name = "target_role", length = 100)
    private String targetRole;

    @Column(name = "target_industry", length = 100)
    private String targetIndustry;

    @Column(columnDefinition = "TEXT")
    private String bio;

    @Column(name = "github_username", length = 100)
    private String githubUsername;

    @Column(name = "placement_readiness_score", precision = 5, scale = 2)
    private BigDecimal placementReadinessScore;

    @Builder.Default
    @Column(name = "created_at")
    private LocalDateTime createdAt = LocalDateTime.now();
}
