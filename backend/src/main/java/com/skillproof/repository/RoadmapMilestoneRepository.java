package com.skillproof.repository;

import com.skillproof.entity.RoadmapMilestone;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;
import java.util.List;

@Repository
public interface RoadmapMilestoneRepository extends JpaRepository<RoadmapMilestone, Long> {
    List<RoadmapMilestone> findByRoadmapIdOrderByWeekNumberAsc(Long roadmapId);
}
