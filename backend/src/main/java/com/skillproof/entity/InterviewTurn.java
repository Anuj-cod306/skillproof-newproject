package com.skillproof.entity;

import com.fasterxml.jackson.annotation.JsonIgnore;
import jakarta.persistence.*;
import lombok.*;
import java.math.BigDecimal;

@Entity
@Table(name = "interview_turns")
@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class InterviewTurn {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "interview_id", nullable = false)
    @JsonIgnore
    private Interview interview;

    @Column(name = "turn_number", nullable = false)
    private Integer turnNumber;

    @Column(name = "ai_question", nullable = false, columnDefinition = "TEXT")
    private String aiQuestion;

    @Column(name = "student_answer", columnDefinition = "TEXT")
    private String studentAnswer;

    @Column(name = "ai_feedback", columnDefinition = "TEXT")
    private String aiFeedback;

    @Column(name = "turn_score", precision = 5, scale = 2)
    private BigDecimal turnScore;

    @Column(name = "turn_type", length = 50)
    @Builder.Default
    private String turnType = "TECHNICAL_QUESTION"; // TECHNICAL_QUESTION, PROJECT_DEFENSE, CROSS_EXAMINATION, CODING_CHALLENGE, BEHAVIORAL

    @Column(name = "evidence_source", length = 255)
    private String evidenceSource;

    @Column(name = "evidence_snippet", columnDefinition = "TEXT")
    private String evidenceSnippet;

    @Column(length = 30)
    @Builder.Default
    private String difficulty = "INTERMEDIATE"; // BEGINNER, INTERMEDIATE, ADVANCED

    @Column(name = "code_snippet", columnDefinition = "TEXT")
    private String codeSnippet;

    @Column(name = "code_language", length = 50)
    private String codeLanguage;

    @Column(name = "evaluated_skill", length = 100)
    private String evaluatedSkill;

    @Column(name = "question_category", length = 100)
    private String questionCategory;
}
