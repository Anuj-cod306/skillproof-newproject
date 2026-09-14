package com.skillproof.repository;

import com.skillproof.entity.SkillPassport;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;
import java.util.Optional;

@Repository
public interface SkillPassportRepository extends JpaRepository<SkillPassport, Long> {
    Optional<SkillPassport> findByPassportHash(String passportHash);
    Optional<SkillPassport> findByStudentId(Long studentId);
}
