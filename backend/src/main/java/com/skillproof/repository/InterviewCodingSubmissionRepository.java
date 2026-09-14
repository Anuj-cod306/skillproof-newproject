package com.skillproof.repository;

import com.skillproof.entity.InterviewCodingSubmission;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;

@Repository
public interface InterviewCodingSubmissionRepository extends JpaRepository<InterviewCodingSubmission, Long> {
    List<InterviewCodingSubmission> findByInterviewIdOrderByCreatedAtAsc(Long interviewId);
    List<InterviewCodingSubmission> findByStudentIdOrderByCreatedAtDesc(Long studentId);
}
