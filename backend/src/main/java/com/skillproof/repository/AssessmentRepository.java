package com.skillproof.repository;

import com.skillproof.entity.Assessment;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;
import java.util.Optional;
import java.util.List;

@Repository
public interface AssessmentRepository extends JpaRepository<Assessment, Long> {
    Optional<Assessment> findBySkillNameIgnoreCase(String skillName);
    List<Assessment> findAll();
}
