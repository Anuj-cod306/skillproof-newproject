package com.skillproof.entity;

import jakarta.persistence.*;
import lombok.*;
import java.math.BigDecimal;
import java.time.LocalDateTime;
import java.util.ArrayList;
import java.util.List;

@Entity
@Table(name = "interviews")
@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class Interview {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(name = "student_id", nullable = false)
    private Long studentId;

    @Column(name = "role_targeted", nullable = false, length = 100)
    private String roleTargeted;

    @Column(length = 30)
    @Builder.Default
    private String status = "ACTIVE"; // ACTIVE, PAUSED, COMPLETED (legacy: IN_PROGRESS)

    @Column(name = "overall_score", precision = 5, scale = 2)
    @Builder.Default
    private BigDecimal overallScore = BigDecimal.ZERO;

    @Column(length = 50)
    @Builder.Default
    private String mode = "TECHNICAL"; // TECHNICAL, PROJECT_DEFENSE, COMPETITIVE_CODING, FULL_SIMULATION

    @Column(name = "code_language", length = 50)
    private String codeLanguage;

    @Column(name = "code_snippet", columnDefinition = "TEXT")
    private String codeSnippet;

    @Column(name = "coding_verdict", length = 50)
    private String codingVerdict; // PASSED, FAILED, PARTIAL, COMPILATION_ERROR

    @Column(name = "coding_execution_time_ms")
    private Long codingExecutionTimeMs;

    @Column(name = "time_complexity", length = 50)
    private String timeComplexity;

    @Column(name = "space_complexity", length = 50)
    private String spaceComplexity;

    @Column(name = "hints_used")
    @Builder.Default
    private Integer hintsUsed = 0;

    @Column(name = "recording_path", length = 500)
    private String recordingPath;

    @Column(name = "recording_duration_seconds")
    private Integer recordingDurationSeconds;

    @Column(name = "recording_status", length = 50)
    @Builder.Default
    private String recordingStatus = "NOT_RECORDED"; // NOT_RECORDED, RECORDED

    @Column(name = "recording_url", length = 500)
    private String recordingUrl;

    @Column(name = "tab_switch_count")
    @Builder.Default
    private Integer tabSwitchCount = 0;

    @Column(name = "violation_timestamp")
    private LocalDateTime violationTimestamp;

    @Column(name = "auto_submission_reason", length = 500)
    private String autoSubmissionReason;

    @Column(name = "recording_metadata", columnDefinition = "TEXT")
    private String recordingMetadata;

    @Column(name = "start_time")
    private LocalDateTime startTime;

    @Column(name = "end_time")
    private LocalDateTime endTime;

    @OneToMany(mappedBy = "interview", cascade = CascadeType.ALL, orphanRemoval = true)
    @OrderBy("turnNumber ASC")
    @Builder.Default
    private List<InterviewTurn> turns = new ArrayList<>();

    @Builder.Default
    @Column(name = "created_at")
    private LocalDateTime createdAt = LocalDateTime.now();
}
