package com.skillproof.entity;

import com.fasterxml.jackson.annotation.JsonIgnore;
import jakarta.persistence.*;
import lombok.*;

@Entity
@Table(name = "questions")
@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class Question {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "assessment_id", nullable = false)
    @JsonIgnore
    private Assessment assessment;

    @Column(name = "question_text", nullable = false, columnDefinition = "TEXT")
    private String questionText;

    @Column(name = "code_snippet", columnDefinition = "TEXT")
    private String codeSnippet;

    @Column(name = "option_a", nullable = false, length = 400)
    private String optionA;

    @Column(name = "option_b", nullable = false, length = 400)
    private String optionB;

    @Column(name = "option_c", nullable = false, length = 400)
    private String optionC;

    @Column(name = "option_d", nullable = false, length = 400)
    private String optionD;

    @Column(name = "correct_option", nullable = false, length = 5)
    private String correctOption; // A, B, C, D

    @Column(columnDefinition = "TEXT")
    private String explanation;

    @Column(length = 30)
    @Builder.Default
    private String difficulty = "INTERMEDIATE";
}
