package com.skillproof.entity;

import jakarta.persistence.*;
import lombok.*;
import java.math.BigDecimal;
import java.time.LocalDateTime;

@Entity
@Table(name = "student_skills", uniqueConstraints = {
        @UniqueConstraint(columnNames = {"student_id", "skill_id"})
})
@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class StudentSkill {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(name = "student_id", nullable = false)
    private Long studentId;

    @Column(name = "skill_id", nullable = false)
    private Long skillId;

    @Column(name = "self_claim_score", precision = 5, scale = 2)
    @Builder.Default
    private BigDecimal selfClaimScore = new BigDecimal("70.0");

    @Column(name = "verified_score", precision = 5, scale = 2)
    @Builder.Default
    private BigDecimal verifiedScore = new BigDecimal("0.0");

    @Column(name = "verification_tier")
    @Builder.Default
    private Integer verificationTier = 1;

    @Column(name = "is_verified")
    @Builder.Default
    private Boolean isVerified = false;

    @Column(name = "source_resume_id")
    private Long sourceResumeId;

    @Column(name = "last_verified_at")
    private LocalDateTime lastVerifiedAt;
}
