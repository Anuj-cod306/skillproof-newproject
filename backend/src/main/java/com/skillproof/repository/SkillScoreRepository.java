package com.skillproof.repository;

import com.skillproof.entity.SkillScore;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;
import java.util.List;

@Repository
public interface SkillScoreRepository extends JpaRepository<SkillScore, Long> {
    List<SkillScore> findBySkillPassportId(Long passportId);
}
