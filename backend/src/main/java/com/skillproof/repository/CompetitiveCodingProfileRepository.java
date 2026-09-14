package com.skillproof.repository;

import com.skillproof.entity.CompetitiveCodingProfile;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.Optional;

@Repository
public interface CompetitiveCodingProfileRepository extends JpaRepository<CompetitiveCodingProfile, Long> {
    List<CompetitiveCodingProfile> findByStudentId(Long studentId);
    Optional<CompetitiveCodingProfile> findByStudentIdAndPlatform(Long studentId, String platform);
}
