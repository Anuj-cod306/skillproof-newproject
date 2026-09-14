package com.skillproof.entity;

import jakarta.persistence.*;
import lombok.*;
import java.math.BigDecimal;
import java.util.ArrayList;
import java.util.List;

@Entity
@Table(name = "assessments")
@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class Assessment {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(name = "skill_name", nullable = false, length = 100)
    private String skillName;

    @Column(nullable = false, length = 150)
    private String title;

    @Column(columnDefinition = "TEXT")
    private String description;

    @Column(name = "total_questions")
    @Builder.Default
    private Integer totalQuestions = 5;

    @Column(name = "duration_minutes")
    @Builder.Default
    private Integer durationMinutes = 15;

    @Column(name = "passing_score", precision = 5, scale = 2)
    @Builder.Default
    private BigDecimal passingScore = new BigDecimal("60.0");

    @OneToMany(mappedBy = "assessment")
    @Builder.Default
    private List<Question> questions = new ArrayList<>();
}
