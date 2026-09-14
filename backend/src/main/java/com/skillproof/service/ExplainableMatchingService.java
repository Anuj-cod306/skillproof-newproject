package com.skillproof.service;

import org.springframework.stereotype.Service;

import java.math.BigDecimal;
import java.math.RoundingMode;
import java.util.*;

@Service
public class ExplainableMatchingService {

    public static class MatchResult {
        public BigDecimal matchPercentage;
        public List<String> verifiedMatches = new ArrayList<>();
        public List<String> missingOrDeficitSkills = new ArrayList<>();
        public String humanExplanation;
    }

    /**
     * Calculates transparent match percentage between student verified skill scores and job requirements.
     */
    public MatchResult evaluateMatch(Map<String, BigDecimal> studentSkillScores,
                                      Map<String, Double> jobRequiredWeights,
                                      List<String> mandatorySkills) {
        MatchResult result = new MatchResult();
        double totalWeightedPossible = 0.0;
        double totalWeightedEarned = 0.0;

        for (Map.Entry<String, Double> requirement : jobRequiredWeights.entrySet()) {
            String skill = requirement.getKey();
            Double weight = requirement.getValue();
            totalWeightedPossible += (weight * 100.0);

            BigDecimal studentScore = studentSkillScores.get(skill);
            if (studentScore != null && studentScore.doubleValue() >= 60.0) {
                totalWeightedEarned += (weight * studentScore.doubleValue());
                result.verifiedMatches.add(String.format("%s (%.1f%% Verified)", skill, studentScore.doubleValue()));
            } else {
                double current = (studentScore != null) ? studentScore.doubleValue() : 0.0;
                result.missingOrDeficitSkills.add(String.format("%s (Threshold: 70%%, You: %.1f%%)", skill, current));
            }
        }

        double scorePct = (totalWeightedPossible > 0) ? (totalWeightedEarned / totalWeightedPossible) * 100.0 : 0.0;
        result.matchPercentage = BigDecimal.valueOf(scorePct).setScale(1, RoundingMode.HALF_UP);

        if (scorePct >= 85.0) {
            result.humanExplanation = "Exceptional fit. Your verified production code and assessments fulfill the core architecture stack.";
        } else if (scorePct >= 70.0) {
            result.humanExplanation = "Strong match for primary backend roles; minor cloud/containerization gaps can be bridged with your roadmap.";
        } else {
            result.humanExplanation = "Prerequisites incomplete. Additional verified milestones in containerization or distributed caching recommended.";
        }

        return result;
    }
}
