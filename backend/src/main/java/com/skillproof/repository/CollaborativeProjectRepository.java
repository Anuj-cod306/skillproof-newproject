package com.skillproof.repository;

import com.skillproof.entity.CollaborativeProject;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;
import java.util.List;

@Repository
public interface CollaborativeProjectRepository extends JpaRepository<CollaborativeProject, Long> {
    List<CollaborativeProject> findByCompanyId(Long companyId);
    List<CollaborativeProject> findByInstitutionId(Long institutionId);
}
