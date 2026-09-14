package com.skillproof.entity;

import jakarta.persistence.*;
import lombok.*;
import java.math.BigDecimal;

@Entity
@Table(name = "skills")
@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class Skill {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(nullable = false, unique = true, length = 100)
    private String name;

    @Column(nullable = false, length = 60)
    private String category; // Backend, Frontend, Database, Cloud & DevOps, AI & ML, Core CS

    @Column(columnDefinition = "TEXT")
    private String description;

    @Column(name = "industry_demand_index", precision = 3, scale = 2)
    @Builder.Default
    private BigDecimal industryDemandIndex = new BigDecimal("0.85");
}
