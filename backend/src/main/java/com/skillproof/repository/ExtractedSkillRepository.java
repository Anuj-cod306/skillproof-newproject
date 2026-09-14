package com.skillproof.repository;

import com.skillproof.entity.ExtractedSkill;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;
import org.springframework.data.jpa.repository.Modifying;
import org.springframework.transaction.annotation.Transactional;
import java.util.List;

@Repository
public interface ExtractedSkillRepository extends JpaRepository<ExtractedSkill, Long> {
    List<ExtractedSkill> findByResumeId(Long resumeId);

    @Modifying
    @Transactional
    void deleteByResumeId(Long resumeId);
}
