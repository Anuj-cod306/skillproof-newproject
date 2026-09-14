package com.skillproof.entity;

import jakarta.persistence.*;
import lombok.*;
import java.time.LocalDateTime;

@Entity
@Table(name = "interview_coding_submissions")
@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class InterviewCodingSubmission {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(name = "interview_id", nullable = false)
    private Long interviewId;

    @Column(name = "student_id", nullable = false)
    private Long studentId;

    @Column(name = "problem_id", length = 100)
    private String problemId;

    @Column(name = "problem_title", length = 200)
    private String problemTitle;

    @Column(length = 50, nullable = false)
    private String language; // javascript, python, java

    @Column(name = "source_code", columnDefinition = "TEXT", nullable = false)
    private String sourceCode;

    @Column(name = "test_cases_json", columnDefinition = "TEXT")
    private String testCasesJson;

    @Column(name = "test_results_json", columnDefinition = "TEXT")
    private String testResultsJson;

    @Column(name = "execution_result", length = 50)
    private String executionResult; // ALL_PASSED, PARTIAL_PASS, COMPILATION_ERROR, TIMEOUT

    @Column(name = "passed_tests")
    private Integer passedTests;

    @Column(name = "total_tests")
    private Integer totalTests;

    @Column(name = "execution_time_ms")
    private Long executionTimeMs;

    @Column(name = "time_complexity", length = 50)
    private String timeComplexity;

    @Column(name = "space_complexity", length = 50)
    private String spaceComplexity;

    @Builder.Default
    @Column(name = "created_at")
    private LocalDateTime createdAt = LocalDateTime.now();
}
