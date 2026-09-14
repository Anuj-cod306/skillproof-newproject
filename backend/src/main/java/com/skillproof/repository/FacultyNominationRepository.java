package com.skillproof.repository;

import com.skillproof.entity.FacultyNomination;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;
import java.util.List;
import java.util.Optional;

@Repository
public interface FacultyNominationRepository extends JpaRepository<FacultyNomination, Long> {
    Optional<FacultyNomination> findByFacultyProgramIdAndAcademicianId(Long programId, Long academicianId);
    List<FacultyNomination> findByAcademicianId(Long academicianId);
    List<FacultyNomination> findByFacultyProgramId(Long programId);
    boolean existsByFacultyProgramIdAndAcademicianId(Long programId, Long academicianId);
}
