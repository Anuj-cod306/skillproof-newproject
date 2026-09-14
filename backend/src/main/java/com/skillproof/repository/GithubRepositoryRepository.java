package com.skillproof.repository;

import com.skillproof.entity.GithubRepository;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;
import java.util.List;

@Repository
public interface GithubRepositoryRepository extends JpaRepository<GithubRepository, Long> {
    List<GithubRepository> findByStudentId(Long studentId);
    void deleteByStudentId(Long studentId);
}
