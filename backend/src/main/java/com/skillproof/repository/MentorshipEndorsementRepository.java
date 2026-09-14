package com.skillproof.repository;

import com.skillproof.entity.MentorshipEndorsement;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;
import java.util.List;
import java.util.Optional;

@Repository
public interface MentorshipEndorsementRepository extends JpaRepository<MentorshipEndorsement, Long> {
    Optional<MentorshipEndorsement> findByStudentIdAndAcademicianId(Long studentId, Long academicianId);
    List<MentorshipEndorsement> findByAcademicianId(Long academicianId);
    List<MentorshipEndorsement> findByStudentId(Long studentId);
    boolean existsByStudentIdAndAcademicianId(Long studentId, Long academicianId);
}
