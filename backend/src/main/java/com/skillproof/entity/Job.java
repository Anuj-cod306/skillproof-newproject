package com.skillproof.entity;

import jakarta.persistence.*;
import lombok.*;
import java.math.BigDecimal;
import java.time.LocalDateTime;

@Entity
@Table(name = "jobs")
@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class Job {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "company_id", nullable = false)
    private Company company;

    @Column(nullable = false, length = 150)
    private String title;

    @Column(name = "job_type", length = 40)
    private String jobType; // FULL_TIME, INTERNSHIP, REMOTE, CONTRACT

    @Column(nullable = false, length = 120)
    private String location;

    @Column(name = "stipend_or_salary", length = 100)
    private String stipendOrSalary;

    @Column(name = "experience_required", length = 50)
    @Builder.Default
    private String experienceRequired = "Fresher / 0-1 Years";

    @Column(nullable = false, columnDefinition = "TEXT")
    private String description;

    @Column(length = 30)
    @Builder.Default
    private String status = "ACTIVE";

    @Column(name = "min_readiness_score", precision = 5, scale = 2)
    @Builder.Default
    private BigDecimal minReadinessScore = new BigDecimal("70.00");

    @Builder.Default
    @Column(name = "created_at")
    private LocalDateTime createdAt = LocalDateTime.now();
}
