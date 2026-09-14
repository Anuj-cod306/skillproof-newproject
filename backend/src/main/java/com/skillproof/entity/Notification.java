package com.skillproof.entity;

import jakarta.persistence.*;
import lombok.*;
import java.time.LocalDateTime;

@Entity
@Table(name = "notifications")
@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class Notification {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(name = "recipient_email", nullable = false)
    private String recipientEmail;

    @Column(name = "recipient_role", length = 30)
    private String recipientRole; // "student", "industry", "academia"

    @Column(nullable = false)
    private String title;

    @Column(columnDefinition = "TEXT")
    private String message;

    @Column(length = 30)
    private String type; // "job", "offer", "shortlist", "approval"

    @Column(length = 50)
    private String status;

    private String link;

    @Column(name = "job_id")
    private Long jobId;

    @Column(name = "application_id")
    private Long applicationId;

    private String company;

    @Column(name = "job_title")
    private String jobTitle;

    @Column(name = "candidate_name")
    private String candidateName;

    @Column(name = "is_read")
    @Builder.Default
    private boolean read = false;

    @Column(name = "created_at")
    @Builder.Default
    private LocalDateTime createdAt = LocalDateTime.now();
}
