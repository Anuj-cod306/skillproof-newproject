package com.skillproof.entity;

import jakarta.persistence.*;
import lombok.*;
import java.math.BigDecimal;
import java.time.LocalDateTime;

@Entity
@Table(name = "github_repositories")
@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class GithubRepository {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(name = "student_id", nullable = false)
    private Long studentId;

    @Column(name = "repo_name", nullable = false, length = 150)
    private String repoName;

    @Column(name = "repo_url", nullable = false, length = 500)
    private String repoUrl;

    @Column(columnDefinition = "TEXT")
    private String description;

    @Column(name = "primary_language", length = 50)
    private String primaryLanguage;

    @Column(name = "stars_count")
    @Builder.Default
    private Integer starsCount = 0;

    @Column(name = "forks_count")
    @Builder.Default
    private Integer forksCount = 0;

    @Column(name = "commit_count")
    @Builder.Default
    private Integer commitCount = 0;

    @Column(name = "evidence_score", precision = 5, scale = 2)
    @Builder.Default
    private BigDecimal evidenceScore = new BigDecimal("75.0");

    @Column(name = "technologies", columnDefinition = "TEXT")
    private String technologies; // JSON or comma-delimited tech list

    @Column(name = "key_finding", columnDefinition = "TEXT")
    private String keyFinding;

    @Builder.Default
    @Column(name = "analyzed_at")
    private LocalDateTime analyzedAt = LocalDateTime.now();
}
