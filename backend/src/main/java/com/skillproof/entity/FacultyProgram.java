package com.skillproof.entity;

import jakarta.persistence.*;
import lombok.*;
import java.time.LocalDateTime;

@Entity
@Table(name = "faculty_programs")
@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class FacultyProgram {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(name = "company_id")
    private Long companyId;

    @Column(nullable = false, length = 200)
    private String title;

    @Column(nullable = false, length = 60)
    private String type; // FACULTY_INTERNSHIP, INDUSTRIAL_TRAINING, FDP, CONSULTANCY, JOINT_RESEARCH

    @Column(nullable = false, length = 100)
    private String domain;

    @Column(length = 50)
    private String duration;

    @Column(length = 30)
    @Builder.Default
    private String mode = "HYBRID";

    @Column(columnDefinition = "TEXT")
    private String description;

    @Column(name = "sponsor_company", length = 150)
    private String sponsorCompany;

    @Column(length = 100)
    private String location;

    @Column(length = 100)
    private String stipend;

    @Column(length = 60)
    private String deadline;

    @Column(length = 40)
    @Builder.Default
    private String status = "ACCEPTING_NOMINATIONS";

    @Builder.Default
    @Column(name = "created_at")
    private LocalDateTime createdAt = LocalDateTime.now();
}
