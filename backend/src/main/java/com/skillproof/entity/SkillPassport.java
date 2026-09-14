package com.skillproof.entity;

import jakarta.persistence.*;
import lombok.*;
import java.math.BigDecimal;
import java.time.LocalDateTime;
import java.util.ArrayList;
import java.util.List;

@Entity
@Table(name = "skill_passports")
@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class SkillPassport {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @OneToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "student_id", unique = true, nullable = false)
    private Student student;

    @Column(name = "passport_hash", nullable = false, unique = true, length = 120)
    private String passportHash; // Public verifiable ID e.g. SKP-2027-ANUJ-8294

    @Column(name = "overall_readiness", nullable = false, precision = 5, scale = 2)
    private BigDecimal overallReadiness;

    @Column(length = 30)
    @Builder.Default
    private String status = "ACTIVE";

    @Column(name = "verification_tier_summary", length = 50)
    @Builder.Default
    private String verificationTierSummary = "ALL_4_TIERS_VERIFIED";

    @Column(name = "qr_code_url", length = 500)
    private String qrCodeUrl;

    @Column(name = "shareable_link", length = 500)
    private String shareableLink;

    @OneToMany(mappedBy = "skillPassport", cascade = CascadeType.ALL, orphanRemoval = true)
    @Builder.Default
    private List<SkillScore> skillScores = new ArrayList<>();

    @Builder.Default
    @Column(name = "issued_at")
    private LocalDateTime issuedAt = LocalDateTime.now();

    @Builder.Default
    @Column(name = "updated_at")
    private LocalDateTime updatedAt = LocalDateTime.now();
}
