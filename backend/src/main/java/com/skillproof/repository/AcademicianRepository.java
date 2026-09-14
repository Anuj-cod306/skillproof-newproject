package com.skillproof.repository;

import com.skillproof.entity.Academician;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;
import java.util.Optional;

@Repository
public interface AcademicianRepository extends JpaRepository<Academician, Long> {
    Optional<Academician> findByUserId(Long userId);
}
