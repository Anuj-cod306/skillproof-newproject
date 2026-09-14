package com.skillproof.repository;

import com.skillproof.entity.Roadmap;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;
import java.util.Optional;

@Repository
public interface RoadmapRepository extends JpaRepository<Roadmap, Long> {
    Optional<Roadmap> findFirstByStudentIdOrderByCreatedAtDesc(Long studentId);
}
