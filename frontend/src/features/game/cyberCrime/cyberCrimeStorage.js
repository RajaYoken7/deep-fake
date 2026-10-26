/**
 * Cyber Crime Investigation — Three-Layer Storage & Analytics Engine
 *
 * Layer 1: Global Profile Integration (totalXP, currentLevel, global achievements)
 * Layer 2: Cyber Crime Investigation Statistics, Badges, and History
 * Layer 3: Active Game Attempt Lifecycle (Round Progression, Resumption, Fresh Play Again)
 */

import { DAILY_MISSIONS_POOL, calculateAccuracy } from './cyberCrimeData.js';
import { generateAttemptQuestions } from './cyberCrimeQuestionSelector.js';
import { evaluateUnlockedBadges } from './cyberCrimeBadges.js';

const STORAGE_PREFIX = 'deeptrust_cyber_investigation';
const ACTIVE_ATTEMPT_PREFIX = 'deeptrust_cyber_active_attempt';

/**
 * Returns the current date formatted as 'YYYY-MM-DD' in UTC timezone.
 */
export function getUtcDateKey(date = new Date()) {
  const year = date.getUTCFullYear();
  const month = String(date.getUTCMonth() + 1).padStart(2, '0');
  const day = String(date.getUTCDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
}

/**
 * Computes remaining time until next midnight UTC (00:00:00 UTC).
 */
export function getNextDailyResetInfo() {
  const now = new Date();
  const nextReset = new Date(Date.UTC(
    now.getUTCFullYear(),
    now.getUTCMonth(),
    now.getUTCDate() + 1,
    0, 0, 0, 0
  ));
  const diffMs = Math.max(0, nextReset.getTime() - now.getTime());
  const hours = Math.floor(diffMs / (1000 * 60 * 60));
  const minutes = Math.floor((diffMs % (1000 * 60 * 60)) / (1000 * 60));
  const seconds = Math.floor((diffMs % (1000 * 60)) / 1000);

  return {
    hours,
    minutes,
    seconds,
    formatted: `${hours}h ${minutes}m`,
    timezone: 'UTC',
    nextResetTime: nextReset.toISOString(),
  };
}

/**
 * Deterministically selects active daily missions for a given dateKey.
 */
export function getDailyMissionsForDate(dateKey = getUtcDateKey(), count = 3) {
  let hash = 0;
  for (let i = 0; i < dateKey.length; i++) {
    hash = (hash << 5) - hash + dateKey.charCodeAt(i);
    hash |= 0;
  }
  hash = Math.abs(hash);

  const pool = [...DAILY_MISSIONS_POOL];
  const selected = [];
  const total = pool.length;

  for (let i = 0; i < Math.min(count, total); i++) {
    const index = (hash + i * 3) % pool.length;
    selected.push(pool[index]);
    pool.splice(index, 1);
  }

  return selected;
}

function getUserStorageKey(userId) {
  const safeId = userId || 'anonymous_agent';
  return `${STORAGE_PREFIX}_${safeId}`;
}

function getActiveAttemptKey(userId) {
  const safeId = userId || 'anonymous_agent';
  return `${ACTIVE_ATTEMPT_PREFIX}_${safeId}`;
}

/**
 * Default Layer 2 game-specific statistics structure.
 */
function getDefaultUserProgress() {
  return {
    totalAttempts: 0,
    completedCampaignCount: 0,
    totalRoundsCompleted: 0,
    totalCampaignQuestionsEvaluated: 0,
    totalCampaignQuestionsCorrect: 0,
    totalCampaignQuestionsIncorrect: 0,
    totalPoints: 0,
    totalGlobalExpContributed: 0,
    completedMissionsCount: 0,
    completedMissionsByDate: {},
    unlockedBadges: [],
    roundWiseStats: {
      'round-1': { correct: 0, evaluated: 0 },
      'round-2': { correct: 0, evaluated: 0 },
      'round-3': { correct: 0, evaluated: 0 },
    },
    historicalAttempts: [],
    recentlySeenQuestionIds: [],
    lastCampaignResult: null,
  };
}

/**
 * Loads Layer 2 user progress.
 */
export function loadUserProgress(userId) {
  try {
    const raw = localStorage.getItem(getUserStorageKey(userId));
    if (!raw) return getDefaultUserProgress();
    const parsed = JSON.parse(raw);
    return {
      ...getDefaultUserProgress(),
      ...parsed,
      roundWiseStats: {
        ...getDefaultUserProgress().roundWiseStats,
        ...(parsed.roundWiseStats || {}),
      },
      unlockedBadges: parsed.unlockedBadges || [],
      historicalAttempts: parsed.historicalAttempts || [],
      recentlySeenQuestionIds: parsed.recentlySeenQuestionIds || [],
    };
  } catch (err) {
    console.error('Failed to load cyber crime progress:', err);
    return getDefaultUserProgress();
  }
}

/**
 * Saves Layer 2 user progress.
 */
export function saveUserProgress(userId, progress) {
  try {
    localStorage.setItem(getUserStorageKey(userId), JSON.stringify(progress));
  } catch (err) {
    console.error('Failed to save cyber crime progress:', err);
  }
}

/**
 * LAYER 3: Active Attempt Management.
 */
export function loadActiveAttempt(userId) {
  try {
    const raw = localStorage.getItem(getActiveAttemptKey(userId));
    if (!raw) return null;
    return JSON.parse(raw);
  } catch (err) {
    console.error('Failed to load active attempt:', err);
    return null;
  }
}

export function saveActiveAttempt(userId, attempt) {
  try {
    if (!attempt) {
      localStorage.removeItem(getActiveAttemptKey(userId));
    } else {
      localStorage.setItem(getActiveAttemptKey(userId), JSON.stringify(attempt));
    }
  } catch (err) {
    console.error('Failed to save active attempt:', err);
  }
}

export function clearActiveAttempt(userId) {
  try {
    localStorage.removeItem(getActiveAttemptKey(userId));
  } catch (err) {
    console.error('Failed to clear active attempt:', err);
  }
}

/**
 * Creates a brand new individual playthrough attempt (Layer 3).
 * Randomizes questions, avoids recently seen questions, and shuffles options.
 */
export function createNewAttempt(userId, progress) {
  const attemptId = `cca_${Date.now()}_${Math.random().toString(36).substring(2, 8)}`;
  const recentlySeenIds = progress.recentlySeenQuestionIds || [];

  const questions = generateAttemptQuestions(recentlySeenIds);

  // Update recently seen IDs with a sliding window of the last 30 IDs
  const newQuestionIds = questions.map((q) => q.id);
  const updatedRecentlySeen = [...recentlySeenIds, ...newQuestionIds].slice(-30);
  progress.recentlySeenQuestionIds = updatedRecentlySeen;
  progress.totalAttempts = (progress.totalAttempts || 0) + 1;
  saveUserProgress(userId, progress);

  const newAttempt = {
    attemptId,
    startedAt: new Date().toISOString(),
    currentRoundNumber: 1, // 1, 2, or 3
    currentRoundId: 'round-1',
    questions,
    currentQuestionIndex: 0,
    evaluatedAnswers: [], // [{ questionId, roundId, selectedOptionId, correctOptionId, isCorrect, explanation }]
    completedRounds: [], // ['round-1', 'round-2', 'round-3']
    roundScores: {
      'round-1': 0,
      'round-2': 0,
      'round-3': 0,
    },
    isComplete: false,
    rewardClaimed: false,
  };

  saveActiveAttempt(userId, newAttempt);
  return newAttempt;
}

/**
 * Checks if a specific mission was completed on a given date.
 */
export function isMissionCompletedToday(userId, missionId, dateKey = getUtcDateKey()) {
  const progress = loadUserProgress(userId);
  return Boolean(progress.completedMissionsByDate?.[dateKey]?.[missionId]);
}

/**
 * Records completion of a daily mission.
 */
export function recordMissionCompletion(userId, missionId, rewardXP, dateKey = getUtcDateKey()) {
  const progress = loadUserProgress(userId);
  const dateBucket = progress.completedMissionsByDate[dateKey] || {};

  const alreadyCompleted = Boolean(dateBucket[missionId]);
  let rewardAwarded = 0;

  if (!alreadyCompleted) {
    rewardAwarded = rewardXP;
    dateBucket[missionId] = {
      completedAt: new Date().toISOString(),
      rewardAwarded: rewardXP,
    };
    progress.completedMissionsByDate[dateKey] = dateBucket;
    progress.totalPoints += rewardAwarded;
    progress.totalGlobalExpContributed = (progress.totalGlobalExpContributed || 0) + rewardAwarded;
    progress.completedMissionsCount = (progress.completedMissionsCount || 0) + 1;

    // Check Dedication Badges (e.g. Daily Defender)
    const { newlyUnlocked, allUnlocked } = evaluateUnlockedBadges({
      progress,
    });
    progress.unlockedBadges = allUnlocked;

    saveUserProgress(userId, progress);

    return {
      alreadyCompleted: false,
      rewardAwarded,
      updatedProgress: progress,
      newlyUnlockedBadges: newlyUnlocked,
    };
  }

  return {
    alreadyCompleted: true,
    rewardAwarded: 0,
    updatedProgress: progress,
    newlyUnlockedBadges: [],
  };
}

/**
 * Records intermediate completion of an individual round (Round 1, Round 2, or Round 3).
 */
export function recordRoundCompletion(userId, attempt, roundId) {
  const progress = loadUserProgress(userId);

  if (!attempt.completedRounds.includes(roundId)) {
    attempt.completedRounds.push(roundId);
    progress.totalRoundsCompleted = (progress.totalRoundsCompleted || 0) + 1;

    // Calculate round-specific score and update roundWiseStats
    const roundAnswers = attempt.evaluatedAnswers.filter((a) => a.roundId === roundId);
    const roundCorrect = roundAnswers.filter((a) => a.isCorrect).length;
    const roundEvaluated = roundAnswers.length;

    progress.roundWiseStats[roundId].correct += roundCorrect;
    progress.roundWiseStats[roundId].evaluated += roundEvaluated;
    attempt.roundScores[roundId] = roundCorrect * 10;

    // Evaluate progression badges (e.g. Phishing Defender, Identity Guardian, etc.)
    const { newlyUnlocked, allUnlocked } = evaluateUnlockedBadges({
      progress,
      currentAttempt: attempt,
      justCompletedRound: roundId,
      isFullGameComplete: false,
    });

    progress.unlockedBadges = allUnlocked;

    saveUserProgress(userId, progress);
    saveActiveAttempt(userId, attempt);

    return {
      newlyUnlockedBadges: newlyUnlocked,
      updatedProgress: progress,
      updatedAttempt: attempt,
    };
  }

  return {
    newlyUnlockedBadges: [],
    updatedProgress: progress,
    updatedAttempt: attempt,
  };
}

/**
 * Records completion of the entire 3-round campaign playthrough.
 */
export function recordCampaignCompletion(userId, attempt) {
  const progress = loadUserProgress(userId);

  const evaluatedCount = attempt.evaluatedAnswers.length;
  const correctCount = attempt.evaluatedAnswers.filter((a) => a.isCorrect).length;
  const incorrectCount = evaluatedCount - correctCount;
  const accuracy = calculateAccuracy(correctCount, evaluatedCount);
  const totalScore = correctCount * 10;

  const resultRecord = {
    attemptId: attempt.attemptId,
    completedAt: new Date().toISOString(),
    evaluatedCount,
    correctCount,
    incorrectCount,
    questionScore: totalScore,
    accuracy,
    roundScores: attempt.roundScores,
    evaluatedAnswers: attempt.evaluatedAnswers,
  };

  progress.totalPoints += totalScore;
  progress.totalGlobalExpContributed = (progress.totalGlobalExpContributed || 0) + totalScore;
  progress.totalCampaignQuestionsEvaluated += evaluatedCount;
  progress.totalCampaignQuestionsCorrect += correctCount;
  progress.totalCampaignQuestionsIncorrect += incorrectCount;
  progress.completedCampaignCount = (progress.completedCampaignCount || 0) + 1;
  progress.lastCampaignResult = resultRecord;

  // Append to historical attempts (keep last 20)
  progress.historicalAttempts = [resultRecord, ...(progress.historicalAttempts || [])].slice(0, 20);

  // Evaluate final badges (e.g. Cyber Rookie, Master Investigator, etc.)
  const { newlyUnlocked, allUnlocked } = evaluateUnlockedBadges({
    progress,
    currentAttempt: attempt,
    isFullGameComplete: true,
  });

  progress.unlockedBadges = allUnlocked;

  saveUserProgress(userId, progress);
  clearActiveAttempt(userId);

  return {
    resultRecord,
    updatedProgress: progress,
    newlyUnlockedBadges: newlyUnlocked,
  };
}

/**
 * Computes deep analytics for the dedicated statistics and analysis tab.
 */
export function calculateGameAnalytics(progress) {
  const totalEvaluated = progress.totalCampaignQuestionsEvaluated || 0;
  const totalCorrect = progress.totalCampaignQuestionsCorrect || 0;
  const overallAccuracy = calculateAccuracy(totalCorrect, totalEvaluated);

  const history = progress.historicalAttempts || [];
  const completedCount = history.length;

  let bestAccuracy = null;
  let averageAccuracy = null;

  if (completedCount > 0) {
    const validAccuracies = history
      .map((h) => h.accuracy)
      .filter((a) => typeof a === 'number');

    if (validAccuracies.length > 0) {
      bestAccuracy = Math.max(...validAccuracies);
      const sum = validAccuracies.reduce((acc, v) => acc + v, 0);
      averageAccuracy = Number((sum / validAccuracies.length).toFixed(2));
    }
  }

  // Round-wise analytics
  const rStats = progress.roundWiseStats || {};
  const r1Acc = calculateAccuracy(rStats['round-1']?.correct || 0, rStats['round-1']?.evaluated || 0);
  const r2Acc = calculateAccuracy(rStats['round-2']?.correct || 0, rStats['round-2']?.evaluated || 0);
  const r3Acc = calculateAccuracy(rStats['round-3']?.correct || 0, rStats['round-3']?.evaluated || 0);

  const roundAccuracies = [
    { id: 'round-1', name: 'Round 1: Phishing Trap', accuracy: r1Acc },
    { id: 'round-2', name: 'Round 2: Fake Identity', accuracy: r2Acc },
    { id: 'round-3', name: 'Round 3: Suspicious Transaction', accuracy: r3Acc },
  ].filter((r) => r.accuracy !== null);

  let bestPerformingRound = null;
  let mostChallengingRound = null;

  if (roundAccuracies.length > 0) {
    roundAccuracies.sort((a, b) => b.accuracy - a.accuracy);
    bestPerformingRound = roundAccuracies[0];
    mostChallengingRound = roundAccuracies[roundAccuracies.length - 1];
  }

  // Recent accuracy trends (last 5 attempts)
  const recentTrends = history.slice(0, 5).reverse();
  let performanceDelta = null;
  if (history.length >= 2) {
    const latest = history[0].accuracy;
    const previous = history[1].accuracy;
    if (typeof latest === 'number' && typeof previous === 'number') {
      performanceDelta = Number((latest - previous).toFixed(2));
    }
  }

  return {
    totalAttempts: progress.totalAttempts || 0,
    completedCampaignCount: progress.completedCampaignCount || 0,
    totalRoundsCompleted: progress.totalRoundsCompleted || 0,
    totalQuestionsEvaluated: totalEvaluated,
    totalCorrectAnswers: totalCorrect,
    totalIncorrectAnswers: progress.totalCampaignQuestionsIncorrect || 0,
    overallAccuracy,
    bestAccuracy,
    averageAccuracy,
    totalPoints: progress.totalPoints || 0,
    totalGlobalExpContributed: progress.totalGlobalExpContributed || 0,
    unlockedBadgesCount: (progress.unlockedBadges || []).length,
    completedMissionsCount: progress.completedMissionsCount || 0,
    roundWise: {
      'round-1': { ...rStats['round-1'], accuracy: r1Acc },
      'round-2': { ...rStats['round-2'], accuracy: r2Acc },
      'round-3': { ...rStats['round-3'], accuracy: r3Acc },
    },
    bestPerformingRound,
    mostChallengingRound,
    recentTrends,
    performanceDelta,
  };
}
