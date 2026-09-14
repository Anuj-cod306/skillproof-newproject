package com.skillproof.entity;

import jakarta.persistence.*;
import lombok.*;
import java.math.BigDecimal;

@Entity
@Table(name = "extracted_skills")
@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class ExtractedSkill {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(name = "resume_id", nullable = false)
    private Long resumeId;

    @Column(name = "skill_name", nullable = false, length = 100)
    private String skillName;

    @Column(length = 60)
    private String category;

    @Column(name = "years_experience", precision = 3, scale = 1)
    @Builder.Default
    private BigDecimal yearsExperience = new BigDecimal("1.0");

    @Column(name = "confidence_score", precision = 3, scale = 2)
    @Builder.Default
    private BigDecimal confidenceScore = new BigDecimal("0.90");
}
