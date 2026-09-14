package com.skillproof.entity;

import jakarta.persistence.*;
import lombok.*;
import java.math.BigDecimal;
import java.time.LocalDateTime;

@Entity
@Table(name = "competitive_coding_profiles", uniqueConstraints = {
        @UniqueConstraint(columnNames = {"student_id", "platform"})
})
@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class CompetitiveCodingProfile {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(name = "student_id", nullable = false)
    private Long studentId;

    @Column(nullable = false, length = 50)
    private String platform; // "LEETCODE" or "CODEFORCES"

    @Column(nullable = false, length = 100)
    private String username;

    @Column(name = "profile_url", length = 255)
    private String profileUrl;

    @Column(name = "verification_status", nullable = false, length = 50)
    @Builder.Default
    private String verificationStatus = "CONNECTED"; // "NOT_CONNECTED", "CONNECTED", "VERIFIED", "FAILED"

    @Column(name = "problems_solved")
    @Builder.Default
    private Integer problemsSolved = 0;

    @Column(name = "easy_solved")
    @Builder.Default
    private Integer easySolved = 0;

    @Column(name = "medium_solved")
    @Builder.Default
    private Integer mediumSolved = 0;

    @Column(name = "hard_solved")
    @Builder.Default
    private Integer hardSolved = 0;

    @Column(name = "contest_rating")
    @Builder.Default
    private Double contestRating = 0.0;

    @Column(name = "global_rank", length = 50)
    private String globalRank;

    @Column(name = "badge_or_rank", length = 100)
    private String badgeOrRank; // e.g. "Knight", "Guardian", "expert", "master"

    @Column(name = "evidence_score", precision = 5, scale = 2)
    @Builder.Default
    private BigDecimal evidenceScore = BigDecimal.ZERO;

    @Column(name = "key_finding", columnDefinition = "TEXT")
    private String keyFinding;

    @Column(name = "verified_languages", length = 255)
    private String verifiedLanguages; // e.g. "Java, C++, Python"

    @Column(name = "last_error", length = 500)
    private String lastError;

    @Column(name = "last_verified_at")
    private LocalDateTime lastVerifiedAt;

    @Column(name = "last_successful_verification_at")
    private LocalDateTime lastSuccessfulVerificationAt;
}
