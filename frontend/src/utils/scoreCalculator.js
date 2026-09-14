/**
 * 4-Tier Multi-Modal Score Calculator for SKILLPROOF
 *
 * Formula:
 * Verified Score = (0.15 * Resume) + (0.25 * GitHub) + (0.30 * Assessment) + (0.30 * AI Interview)
 */

export const WEIGHTS = {
  RESUME: 0.15,
  GITHUB: 0.25,
  ASSESSMENT: 0.30,
  AI_INTERVIEW: 0.30
};

export const calculateCompositeScore = (resume = 70, github = 50, assessment = 60, interview = 60) => {
  const composite = (
    WEIGHTS.RESUME * resume +
    WEIGHTS.GITHUB * github +
    WEIGHTS.ASSESSMENT * assessment +
    WEIGHTS.AI_INTERVIEW * interview
  );
  return Math.round(composite);
};

export const resolveBadgeLevel = (score) => {
  if (score >= 80) return 'GOLD';
  if (score >= 65) return 'SILVER';
  if (score >= 50) return 'BRONZE';
  return 'NONE';
};

export const calculatePlacementReadiness = (skills = []) => {
  if (!skills || skills.length === 0) return 0;
  const sum = skills.reduce((acc, curr) => acc + (curr.score || 0), 0);
  return Math.round(sum / skills.length);
};
