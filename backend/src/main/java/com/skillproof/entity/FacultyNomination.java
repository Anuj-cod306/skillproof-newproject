package com.skillproof.entity;

import jakarta.persistence.*;
import lombok.*;
import java.time.LocalDateTime;

@Entity
@Table(name = "faculty_nominations", uniqueConstraints = {
    @UniqueConstraint(columnNames = {"program_id", "academician_id"})
})
@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class FacultyNomination {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @ManyToOne(fetch = FetchType.EAGER)
    @JoinColumn(name = "program_id", nullable = false)
    private FacultyProgram facultyProgram;

    @ManyToOne(fetch = FetchType.EAGER)
    @JoinColumn(name = "academician_id", nullable = false)
    private Academician academician;

    @Column(length = 40, nullable = false)
    @Builder.Default
    private String status = "NOMINATED"; // NOMINATED, APPROVED, COMPLETED, WITHDRAWN

    @Column(columnDefinition = "TEXT")
    private String remarks;

    @Builder.Default
    @Column(name = "nominated_at")
    private LocalDateTime nominatedAt = LocalDateTime.now();
}
