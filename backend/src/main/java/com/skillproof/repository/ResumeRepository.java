package com.skillproof.repository;

import com.skillproof.entity.Resume;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;
import java.util.Optional;
import java.util.List;

@Repository
public interface ResumeRepository extends JpaRepository<Resume, Long> {
    Optional<Resume> findFirstByStudentIdOrderByUploadedAtDesc(Long studentId);
    Optional<Resume> findFirstByStudentIdAndIsActiveTrueOrderByUploadedAtDesc(Long studentId);
    List<Resume> findByStudentIdOrderByUploadedAtDesc(Long studentId);
    List<Resume> findByStudentIdAndIsActiveTrue(Long studentId);
    Optional<Resume> findByIdAndStudentId(Long id, Long studentId);
}
