/**
 * Cyber Crime Investigation — Game-Specific Badges & Achievements
 * Defines badge requirements, catalog, and unlocks evaluation engine.
 */

export const CYBER_CRIME_BADGES_CATALOG = [
  // Beginner Badges
  {
    id: 'first-investigation',
    name: 'First Investigation',
    description: 'Complete your first investigation round.',
    category: 'Beginner',
    tierColor: 'purple',
    condition: ({ progress, justCompletedRound }) => {
      return (progress.totalRoundsCompleted || 0) >= 1 || Boolean(justCompletedRound);
    },
  },
  {
    id: 'cyber-rookie',
    name: 'Cyber Rookie',
    description: 'Complete your first full 3-round investigation.',
    category: 'Beginner',
    tierColor: 'blue',
    condition: ({ progress, isFullGameComplete }) => {
      return (progress.completedCampaignCount || 0) >= 1 || Boolean(isFullGameComplete);
    },
  },
  {
    id: 'sharp-observer',
    name: 'Sharp Observer',
    description: 'Correctly identify 5 suspicious clues.',
    category: 'Beginner',
    tierColor: 'cyan',
    condition: ({ progress, currentAttempt }) => {
      const historicalCorrect = progress.totalCampaignQuestionsCorrect || 0;
      const attemptCorrect = currentAttempt?.evaluatedAnswers?.filter((a) => a.isCorrect).length || 0;
      return historicalCorrect + attemptCorrect >= 5;
    },
  },

  // Accuracy Badges
  {
    id: 'careful-investigator',
    name: 'Careful Investigator',
    description: 'Achieve at least 70% accuracy in a completed game.',
    category: 'Accuracy',
    tierColor: 'purple',
    condition: ({ currentAttempt, isFullGameComplete }) => {
      if (!isFullGameComplete || !currentAttempt) return false;
      const evaluated = currentAttempt.evaluatedAnswers?.length || 0;
      const correct = currentAttempt.evaluatedAnswers?.filter((a) => a.isCorrect).length || 0;
      return evaluated >= 9 && (correct / evaluated) * 100 >= 70;
    },
  },
  {
    id: 'cyber-sleuth',
    name: 'Cyber Sleuth',
    description: 'Achieve at least 85% accuracy in a completed game.',
    category: 'Accuracy',
    tierColor: 'cyan',
    condition: ({ currentAttempt, isFullGameComplete }) => {
      if (!isFullGameComplete || !currentAttempt) return false;
      const evaluated = currentAttempt.evaluatedAnswers?.length || 0;
      const correct = currentAttempt.evaluatedAnswers?.filter((a) => a.isCorrect).length || 0;
      return evaluated >= 9 && (correct / evaluated) * 100 >= 85;
    },
  },
  {
    id: 'master-investigator',
    name: 'Master Investigator',
    description: 'Achieve at least 95% accuracy in a completed game.',
    category: 'Accuracy',
    tierColor: 'amber',
    condition: ({ currentAttempt, isFullGameComplete }) => {
      if (!isFullGameComplete || !currentAttempt) return false;
      const evaluated = currentAttempt.evaluatedAnswers?.length || 0;
      const correct = currentAttempt.evaluatedAnswers?.filter((a) => a.isCorrect).length || 0;
      return evaluated >= 9 && (correct / evaluated) * 100 >= 95;
    },
  },

  // Progression Badges
  {
    id: 'phishing-defender',
    name: 'Phishing Defender',
    description: 'Successfully complete Round 1: The Phishing Trap.',
    category: 'Progression',
    tierColor: 'purple',
    condition: ({ justCompletedRound, currentAttempt }) => {
      return (
        justCompletedRound === 'round-1' ||
        Boolean(currentAttempt?.completedRounds?.includes('round-1'))
      );
    },
  },
  {
    id: 'identity-guardian',
    name: 'Identity Guardian',
    description: 'Successfully complete Round 2: The Fake Identity.',
    category: 'Progression',
    tierColor: 'blue',
    condition: ({ justCompletedRound, currentAttempt }) => {
      return (
        justCompletedRound === 'round-2' ||
        Boolean(currentAttempt?.completedRounds?.includes('round-2'))
      );
    },
  },
  {
    id: 'transaction-tracker',
    name: 'Transaction Tracker',
    description: 'Successfully complete Round 3: The Suspicious Transaction.',
    category: 'Progression',
    tierColor: 'cyan',
    condition: ({ justCompletedRound, currentAttempt }) => {
      return (
        justCompletedRound === 'round-3' ||
        Boolean(currentAttempt?.completedRounds?.includes('round-3'))
      );
    },
  },
  {
    id: 'crime-scene-expert',
    name: 'Crime Scene Expert',
    description: 'Complete all three rounds in a single investigation attempt.',
    category: 'Progression',
    tierColor: 'green',
    condition: ({ isFullGameComplete }) => {
      return Boolean(isFullGameComplete);
    },
  },

  // Dedication Badges
  {
    id: 'persistent-detective',
    name: 'Persistent Detective',
    description: 'Complete 5 full game investigation attempts.',
    category: 'Dedication',
    tierColor: 'purple',
    condition: ({ progress, isFullGameComplete }) => {
      const total = (progress.completedCampaignCount || 0) + (isFullGameComplete ? 1 : 0);
      return total >= 5;
    },
  },
  {
    id: 'investigation-veteran',
    name: 'Investigation Veteran',
    description: 'Complete 10 full game investigation attempts.',
    category: 'Dedication',
    tierColor: 'amber',
    condition: ({ progress, isFullGameComplete }) => {
      const total = (progress.completedCampaignCount || 0) + (isFullGameComplete ? 1 : 0);
      return total >= 10;
    },
  },
  {
    id: 'daily-defender',
    name: 'Daily Defender',
    description: 'Complete daily missions on 5 different calendar days.',
    category: 'Dedication',
    tierColor: 'cyan',
    condition: ({ progress }) => {
      const daysCount = Object.keys(progress.completedMissionsByDate || {}).length;
      return daysCount >= 5;
    },
  },
];

/**
 * Checks for any newly unlocked badges given current progress and attempt state.
 */
export function evaluateUnlockedBadges({
  progress = {},
  currentAttempt = null,
  justCompletedRound = null,
  isFullGameComplete = false,
}) {
  const existingUnlocked = progress.unlockedBadges || [];
  const existingIds = new Set(existingUnlocked.map((b) => b.id));
  const newlyUnlocked = [];

  for (const badge of CYBER_CRIME_BADGES_CATALOG) {
    if (!existingIds.has(badge.id)) {
      if (
        badge.condition({
          progress,
          currentAttempt,
          justCompletedRound,
          isFullGameComplete,
        })
      ) {
        const record = {
          id: badge.id,
          name: badge.name,
          description: badge.description,
          category: badge.category,
          tierColor: badge.tierColor,
          unlockedAt: new Date().toISOString(),
        };
        newlyUnlocked.push(record);
        existingIds.add(badge.id);
      }
    }
  }

  const allUnlocked = [...existingUnlocked, ...newlyUnlocked];

  return {
    newlyUnlocked,
    allUnlocked,
  };
}
