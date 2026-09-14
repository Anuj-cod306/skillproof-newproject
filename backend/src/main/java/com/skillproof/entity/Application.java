package com.skillproof.entity;

import jakarta.persistence.*;
import lombok.*;
import java.math.BigDecimal;
import java.time.LocalDateTime;

@Entity
@Table(name = "applications", uniqueConstraints = {
    @UniqueConstraint(columnNames = {"job_id", "student_id"})
})
@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class Application {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "job_id", nullable = false)
    private Job job;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "student_id", nullable = false)
    private Student student;

    @Column(name = "match_percentage", nullable = false, precision = 5, scale = 2)
    private BigDecimal matchPercentage;

    @Column(name = "matching_explanation", columnDefinition = "TEXT")
    private String matchingExplanation;

    @Column(length = 30)
    @Builder.Default
    private String status = "APPLIED"; // APPLIED, SHORTLISTED, INTERVIEWING, REJECTED, HIRED

    @Builder.Default
    @Column(name = "applied_at")
    private LocalDateTime appliedAt = LocalDateTime.now();

    // 3-Actor Acceptance Workflow Fields
    @Column(name = "joining_letter_role")
    private String joiningLetterRole;

    @Column(name = "joining_letter_salary")
    private String joiningLetterSalary;

    @Column(name = "joining_letter_joining_date")
    private String joiningLetterJoiningDate;

    @Column(name = "joining_letter_text", columnDefinition = "TEXT")
    private String joiningLetterText;

    @Column(name = "joining_letter_sent_at")
    private LocalDateTime joiningLetterSentAt;

    @Column(name = "student_accepted_at")
    private LocalDateTime studentAcceptedAt;

    @Column(name = "student_declined_at")
    private LocalDateTime studentDeclinedAt;

    @Column(name = "student_remarks", columnDefinition = "TEXT")
    private String studentRemarks;

    @Column(name = "academic_approved_at")
    private LocalDateTime academicApprovedAt;

    @Column(name = "academic_rejected_at")
    private LocalDateTime academicRejectedAt;

    @Column(name = "academic_comments", columnDefinition = "TEXT")
    private String academicComments;

    @Column(name = "academic_approver_name")
    private String academicApproverName;
}
