package com.skillproof.entity;

import jakarta.persistence.*;
import lombok.*;
import java.math.BigDecimal;

@Entity
@Table(name = "interview_evaluations")
@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class InterviewEvaluation {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(name = "interview_id", unique = true, nullable = false)
    private Long interviewId;

    @Column(name = "technical_score", precision = 5, scale = 2)
    private BigDecimal technicalScore;

    @Column(name = "project_score", precision = 5, scale = 2)
    private BigDecimal projectScore;

    @Column(name = "problem_solving_score", precision = 5, scale = 2)
    private BigDecimal problemSolvingScore;

    @Column(name = "communication_score", precision = 5, scale = 2)
    private BigDecimal communicationScore;

    @Column(name = "code_quality_score", precision = 5, scale = 2)
    private BigDecimal codeQualityScore;

    @Column(columnDefinition = "TEXT")
    private String strengths;

    @Column(columnDefinition = "TEXT")
    private String improvements;

    @Column(name = "red_flags", columnDefinition = "TEXT")
    private String redFlags;

    @Column(name = "summary_verdict", columnDefinition = "TEXT")
    private String summaryVerdict;

    @Column(name = "assessed_skills", length = 500)
    private String assessedSkills;

    @Column(name = "code_evaluation_json", columnDefinition = "TEXT")
    private String codeEvaluationJson;

    @Column(name = "recommended_actions", columnDefinition = "TEXT")
    private String recommendedActions;
}
