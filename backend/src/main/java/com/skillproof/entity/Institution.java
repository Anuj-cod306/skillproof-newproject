package com.skillproof.entity;

import jakarta.persistence.*;
import lombok.*;
import java.time.LocalDateTime;

@Entity
@Table(name = "institutions")
@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class Institution {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @OneToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "user_id", unique = true, nullable = false)
    private User user;

    @Column(name = "institution_name", nullable = false, length = 250)
    private String institutionName;

    @Column(name = "institution_code", nullable = false, unique = true, length = 50)
    private String institutionCode;

    @Column(length = 50)
    @Builder.Default
    private String accreditation = "NAAC A++";

    @Column(length = 100)
    private String state;

    @Column(length = 100)
    private String city;

    @Column(length = 255)
    private String website;

    @Column(name = "contact_email", length = 120)
    private String contactEmail;

    @Builder.Default
    @Column(name = "created_at")
    private LocalDateTime createdAt = LocalDateTime.now();
}
