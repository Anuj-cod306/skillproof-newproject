package com.skillproof.repository;

import com.skillproof.entity.AssessmentResult;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;
import java.util.List;
import java.util.Optional;

@Repository
public interface AssessmentResultRepository extends JpaRepository<AssessmentResult, Long> {
    List<AssessmentResult> findByStudentId(Long studentId);
    List<AssessmentResult> findByStudentIdOrderByCompletedAtDesc(Long studentId);
    Optional<AssessmentResult> findFirstByStudentIdOrderByCompletedAtDesc(Long studentId);
    Optional<AssessmentResult> findFirstByStudentIdAndAssessmentIdOrderByCompletedAtDesc(Long studentId, Long assessmentId);
    Optional<AssessmentResult> findFirstByStudentIdAndSkillNameIgnoreCaseOrderByScorePercentageDesc(Long studentId, String skillName);
}
