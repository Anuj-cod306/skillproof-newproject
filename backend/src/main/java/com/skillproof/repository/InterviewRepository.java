package com.skillproof.repository;

import com.skillproof.entity.Interview;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;
import java.util.Optional;
import java.util.List;

@Repository
public interface InterviewRepository extends JpaRepository<Interview, Long> {
    Optional<Interview> findFirstByStudentIdOrderByCreatedAtDesc(Long studentId);
    List<Interview> findByStudentIdOrderByCreatedAtDesc(Long studentId);
}
