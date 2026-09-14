package com.skillproof.entity;

import jakarta.persistence.*;
import lombok.*;
import java.math.BigDecimal;
import java.time.LocalDateTime;

@Entity
@Table(name = "assessment_results")
@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class AssessmentResult {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(name = "student_id", nullable = false)
    private Long studentId;

    @Column(name = "assessment_id", nullable = false)
    private Long assessmentId;

    @Column(name = "skill_name", nullable = false, length = 100)
    private String skillName;

    @Column(name = "score_percentage", nullable = false, precision = 5, scale = 2)
    private BigDecimal scorePercentage;

    @Column(name = "correct_count", nullable = false)
    private Integer correctCount;

    @Column(name = "total_count", nullable = false)
    private Integer totalCount;

    @Column(nullable = false)
    private Boolean passed;

    @Column(length = 50)
    @Builder.Default
    private String status = "COMPLETED"; // COMPLETED, AUTO_SUBMITTED, VIOLATION

    @Column(name = "tab_switch_count")
    @Builder.Default
    private Integer tabSwitchCount = 0;

    @Column(name = "violation_timestamp")
    private LocalDateTime violationTimestamp;

    @Column(name = "auto_submission_reason", length = 500)
    private String autoSubmissionReason;

    @Column(name = "start_time")
    private LocalDateTime startTime;

    @Column(name = "end_time")
    private LocalDateTime endTime;

    @Column(name = "recording_status", length = 50)
    @Builder.Default
    private String recordingStatus = "RECORDED"; // RECORDED, NOT_RECORDED, REVOKED

    @Column(name = "recording_url", length = 500)
    private String recordingUrl;

    @Column(name = "recording_metadata", columnDefinition = "TEXT")
    private String recordingMetadata;

    @Builder.Default
    @Column(name = "completed_at")
    private LocalDateTime completedAt = LocalDateTime.now();
}
