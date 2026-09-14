package com.skillproof.entity;

import jakarta.persistence.*;
import lombok.*;
import java.math.BigDecimal;

@Entity
@Table(name = "skill_scores")
@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class SkillScore {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "passport_id", nullable = false)
    private SkillPassport skillPassport;

    @Column(name = "skill_name", nullable = false, length = 100)
    private String skillName;

    @Column(nullable = false, length = 60)
    private String category;

    @Column(name = "final_score", nullable = false, precision = 5, scale = 2)
    private BigDecimal finalScore;

    @Column(name = "resume_claim_score", nullable = false, precision = 5, scale = 2)
    private BigDecimal resumeClaimScore;

    @Column(name = "github_evidence_score", nullable = false, precision = 5, scale = 2)
    private BigDecimal githubEvidenceScore;

    @Column(name = "assessment_score", nullable = false, precision = 5, scale = 2)
    private BigDecimal assessmentScore;

    @Column(name = "interview_score", nullable = false, precision = 5, scale = 2)
    private BigDecimal interviewScore;

    @Column(name = "competitive_coding_score", precision = 5, scale = 2)
    @Builder.Default
    private BigDecimal competitiveCodingScore = BigDecimal.ZERO;

    @Column(name = "is_verified")
    @Builder.Default
    private Boolean isVerified = true;

    @Column(name = "verified_badge", length = 50)
    @Builder.Default
    private String verifiedBadge = "GOLD"; // GOLD, SILVER, BRONZE
}
