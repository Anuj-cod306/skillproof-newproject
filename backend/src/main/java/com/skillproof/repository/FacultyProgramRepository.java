package com.skillproof.repository;

import com.skillproof.entity.FacultyProgram;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;
import java.util.List;

@Repository
public interface FacultyProgramRepository extends JpaRepository<FacultyProgram, Long> {
    List<FacultyProgram> findByCompanyId(Long companyId);
    List<FacultyProgram> findByType(String type);
}
