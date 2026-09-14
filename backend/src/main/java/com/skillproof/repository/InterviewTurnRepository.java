package com.skillproof.repository;

import com.skillproof.entity.InterviewTurn;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;
import java.util.List;

@Repository
public interface InterviewTurnRepository extends JpaRepository<InterviewTurn, Long> {
    List<InterviewTurn> findByInterviewIdOrderByTurnNumberAsc(Long interviewId);
}
