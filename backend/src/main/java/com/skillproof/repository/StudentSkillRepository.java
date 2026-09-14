package com.skillproof.repository;

import com.skillproof.entity.StudentSkill;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;
import org.springframework.data.jpa.repository.Modifying;
import org.springframework.transaction.annotation.Transactional;
import java.util.List;
import java.util.Optional;

@Repository
public interface StudentSkillRepository extends JpaRepository<StudentSkill, Long> {
    List<StudentSkill> findByStudentId(Long studentId);
    List<StudentSkill> findByStudentIdAndSourceResumeId(Long studentId, Long sourceResumeId);
    Optional<StudentSkill> findByStudentIdAndSkillId(Long studentId, Long skillId);

    @Modifying
    @Transactional
    void deleteByStudentIdAndIsVerifiedFalse(Long studentId);

    @Modifying
    @Transactional
    void deleteByStudentId(Long studentId);
}
