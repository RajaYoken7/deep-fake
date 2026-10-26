import {
  GAME_LEVELS,
  GAME_RANKS,
  ACHIEVEMENTS_CATALOG,
  XP_RULES,
  SIGHTENGINE_THRESHOLDS,
  CURATED_CHALLENGES,
} from '../constants/gameConstants.js';
import { User } from '../models/User.js';
import { GameSession } from '../models/GameSession.js';
import { GameAttempt } from '../models/GameAttempt.js';
import { analyzeWithSightengine } from './sightengineService.js';
import { buildDetectionResult } from './detectionService.js';
import { cleanupFiles } from '../middleware/uploadMiddleware.js';

/**
 * Calculates current level, title, badge, and progression details from total XP.
 */
export function calculateLevel(totalXP = 0) {
  const xp = Math.max(0, Number(totalXP) || 0);
  let currentLevelObj = GAME_LEVELS[0];

  for (let i = GAME_LEVELS.length - 1; i >= 0; i--) {
    if (xp >= GAME_LEVELS[i].xpRequired) {
      currentLevelObj = GAME_LEVELS[i];
      break;
    }
  }

  const currentLevelIndex = GAME_LEVELS.findIndex((l) => l.level === currentLevelObj.level);
  const nextLevelObj = GAME_LEVELS[currentLevelIndex + 1] || null;

  const currentMinXP = currentLevelObj.xpRequired;
  const nextXP = nextLevelObj ? nextLevelObj.xpRequired : currentMinXP;
  const xpInLevel = xp - currentMinXP;
  const xpForNext = nextLevelObj ? nextXP - currentMinXP : 1;
  const progressPercent = nextLevelObj
    ? Math.min(100, Math.max(0, Math.round((xpInLevel / xpForNext) * 100)))
    : 100;

  return {
    level: currentLevelObj.level,
    title: currentLevelObj.title,
    badge: currentLevelObj.badge,
    totalXP: xp,
    currentLevelMinXP: currentMinXP,
    nextLevelXP: nextXP,
    xpNeededForNext: nextLevelObj ? Math.max(0, nextXP - xp) : 0,
    progressPercent,
  };
}

/**
 * Calculates rank from total XP.
 */
export function calculateRank(totalXP = 0) {
  const xp = Math.max(0, Number(totalXP) || 0);
  let rankObj = GAME_RANKS[0];

  for (let i = GAME_RANKS.length - 1; i >= 0; i--) {
    if (xp >= GAME_RANKS[i].minXP) {
      rankObj = GAME_RANKS[i];
      break;
    }
  }

  return rankObj.name;
}

/**
 * Checks for any newly unlocked achievements based on updated user statistics.
 * Appends new achievements directly to user.achievements array.
 * @returns {Array<object>} list of newly unlocked achievements
 */
export function checkAndAwardAchievements(user) {
  const existingUnlockedIds = new Set(
    (user.achievements || []).map((a) => a.id)
  );
  const newlyUnlocked = [];

  for (const item of ACHIEVEMENTS_CATALOG) {
    if (!existingUnlockedIds.has(item.id)) {
      if (item.condition(user)) {
        const achievementRecord = {
          id: item.id,
          name: item.name,
          description: item.description,
          icon: item.icon,
          badge: item.badge,
          unlockedAt: new Date(),
        };
        user.achievements.push(achievementRecord);
        existingUnlockedIds.add(item.id);
        newlyUnlocked.push(achievementRecord);
      }
    }
  }

  return newlyUnlocked;
}

/**
 * Returns list of curated challenges without revealing ground truth answers.
 */
export function getCuratedChallenges() {
  return CURATED_CHALLENGES.map((challenge, index) => ({
    id: challenge.id,
    questionNumber: index + 1,
    title: challenge.title,
    category: challenge.category,
    difficulty: challenge.difficulty,
    imageUrl: challenge.imageUrl,
    clues: challenge.clues,
  }));
}

/**
 * Submits an answer (either for a curated challenge or an uploaded image).
 */
export async function processGameSubmission({
  userId,
  sessionId,
  userPrediction, // 'REAL' or 'FAKE'
  challengeId,    // optional if using curated challenge
  uploadedFile,   // optional if uploading custom image
}) {
  const user = await User.findById(userId);
  if (!user) {
    throw new Error('User not found.');
  }

  let session = await GameSession.findOne({ sessionId, userId });
  if (!session) {
    session = new GameSession({
      userId,
      sessionId,
      startedAt: new Date(),
      status: 'active',
    });
  }

  if (session.status === 'completed') {
    throw new Error('This game session has already been completed. Please start a new session.');
  }

  let aiScore = null;
  let aiClassification = 'INCONCLUSIVE';
  let imageReference = challengeId || uploadedFile?.originalname || 'custom_upload';
  let imageUrl = null;
  let educationalExplanation = '';

  try {
    if (uploadedFile) {
      // Analyze uploaded image using Sightengine GenAI
      const rawResult = await analyzeWithSightengine(uploadedFile);
      const detectionResult = buildDetectionResult(rawResult);
      aiScore = detectionResult.score;
      aiClassification = detectionResult.classification;
      educationalExplanation =
        aiClassification === 'AI_GENERATED'
          ? 'Sightengine detected strong synthetic diffusion patterns and latent generative frequency signatures in this upload.'
          : aiClassification === 'NOT_AI_GENERATED'
          ? 'Sightengine detected natural photographic grain and authentic sensor noise characteristic of non-AI photography.'
          : 'Sightengine could not make a confident classification due to ambiguous image characteristics or heavy compression.';
    } else if (challengeId) {
      const challenge = CURATED_CHALLENGES.find((c) => c.id === challengeId);
      if (!challenge) {
        throw new Error(`Curated challenge '${challengeId}' was not found.`);
      }
      aiScore = challenge.groundTruthScore;
      aiClassification = challenge.groundTruthClassification;
      imageUrl = challenge.imageUrl;
      imageReference = challenge.id;
      educationalExplanation = challenge.explanation;
    } else {
      throw new Error('Either a challengeId or an image file is required for submission.');
    }
  } finally {
    // Crucial: Clean up uploaded file immediately after processing
    if (uploadedFile) {
      await cleanupFiles([uploadedFile]);
    }
  }

  // Determine correctness
  let isCorrect = null;
  let status = 'success';

  if (aiClassification === 'INCONCLUSIVE') {
    isCorrect = null;
    status = 'inconclusive';
  } else if (
    (userPrediction === 'REAL' && aiClassification === 'NOT_AI_GENERATED') ||
    (userPrediction === 'FAKE' && aiClassification === 'AI_GENERATED')
  ) {
    isCorrect = true;
  } else {
    isCorrect = false;
  }

  // Calculate XP rewards and streak bonuses
  let earnedXP = 0;
  const xpBreakdown = [];

  if (isCorrect === true) {
    earnedXP += XP_RULES.CORRECT_PREDICTION;
    xpBreakdown.push({ reason: 'Correct Prediction', xp: XP_RULES.CORRECT_PREDICTION });

    session.currentStreak = (session.currentStreak || 0) + 1;
    user.currentStreak = (user.currentStreak || 0) + 1;
    user.highestStreak = Math.max(user.highestStreak || 0, user.currentStreak);

    // Streak bonuses
    if (user.currentStreak === 3) {
      earnedXP += XP_RULES.STREAK_3;
      xpBreakdown.push({ reason: '3-Streak Milestone Bonus', xp: XP_RULES.STREAK_3 });
    } else if (user.currentStreak === 5) {
      earnedXP += XP_RULES.STREAK_5;
      xpBreakdown.push({ reason: '5-Streak Milestone Bonus', xp: XP_RULES.STREAK_5 });
    } else if (user.currentStreak === 10) {
      earnedXP += XP_RULES.STREAK_10;
      xpBreakdown.push({ reason: '10-Streak Milestone Bonus', xp: XP_RULES.STREAK_10 });
    }

    session.correctAnswers = (session.correctAnswers || 0) + 1;
    user.correctAnswers = (user.correctAnswers || 0) + 1;
  } else if (isCorrect === false) {
    session.currentStreak = 0;
    user.currentStreak = 0;
    session.incorrectAnswers = (session.incorrectAnswers || 0) + 1;
    user.incorrectAnswers = (user.incorrectAnswers || 0) + 1;
  } else {
    // Inconclusive
    session.inconclusiveAnswers = (session.inconclusiveAnswers || 0) + 1;
    user.inconclusiveAnswers = (user.inconclusiveAnswers || 0) + 1;
  }

  session.questionsAttempted = (session.questionsAttempted || 0) + 1;
  user.totalAttempts = (user.totalAttempts || 0) + 1;

  // Session question milestone bonuses
  if (session.questionsAttempted === 5 && !session.fiveBonusAwarded) {
    earnedXP += XP_RULES.BONUS_5_QUESTIONS;
    session.fiveBonusAwarded = true;
    xpBreakdown.push({ reason: 'Completed 5 Questions Bonus', xp: XP_RULES.BONUS_5_QUESTIONS });
  } else if (session.questionsAttempted === 10 && !session.tenBonusAwarded) {
    earnedXP += XP_RULES.BONUS_10_QUESTIONS;
    session.tenBonusAwarded = true;
    xpBreakdown.push({ reason: 'Completed 10 Questions Bonus', xp: XP_RULES.BONUS_10_QUESTIONS });
  }

  // Update session & user totals
  session.xpEarned = (session.xpEarned || 0) + earnedXP;
  user.totalXP = (user.totalXP || 0) + earnedXP;

  // Recalculate level & rank
  const levelInfo = calculateLevel(user.totalXP);
  user.currentLevel = levelInfo.level;
  user.currentRank = calculateRank(user.totalXP);

  // Check achievements
  const newlyUnlockedAchievements = checkAndAwardAchievements(user);

  // Create attempt record
  const attempt = new GameAttempt({
    userId: user._id,
    sessionId: session.sessionId,
    imageReference,
    userPrediction,
    aiClassification,
    aiScore,
    isCorrect,
    xpAwarded: earnedXP,
    streakAtAttempt: user.currentStreak,
    explanation: educationalExplanation,
    status,
  });

  await Promise.all([user.save(), session.save(), attempt.save()]);

  // Decisive accuracy calculation
  const totalDecisive = (user.correctAnswers || 0) + (user.incorrectAnswers || 0);
  const accuracy = totalDecisive > 0
    ? Math.round(((user.correctAnswers || 0) / totalDecisive) * 1000) / 10
    : 0;

  return {
    attemptId: attempt._id,
    sessionId: session.sessionId,
    imageReference,
    imageUrl,
    userPrediction,
    aiClassification,
    aiScore,
    isCorrect,
    status,
    xpEarned: earnedXP,
    xpBreakdown,
    currentStreak: user.currentStreak,
    highestStreak: user.highestStreak,
    sessionStats: {
      questionsAttempted: session.questionsAttempted,
      correctAnswers: session.correctAnswers,
      incorrectAnswers: session.incorrectAnswers,
      inconclusiveAnswers: session.inconclusiveAnswers,
      xpEarned: session.xpEarned,
    },
    playerStats: {
      totalXP: user.totalXP,
      currentLevel: user.currentLevel,
      currentRank: user.currentRank,
      levelInfo,
      accuracy,
      totalAttempts: user.totalAttempts,
      correctAnswers: user.correctAnswers,
      incorrectAnswers: user.incorrectAnswers,
      inconclusiveAnswers: user.inconclusiveAnswers,
    },
    educationalExplanation,
    newlyUnlockedAchievements,
    disclaimer:
      'Sightengine GenAI results are automated mathematical estimates based on generative model artifacts, not absolute proof of authenticity.',
  };
}

/**
 * Completes a game session and awards session completion bonuses if eligible.
 */
export async function completeGameSession({ userId, sessionId }) {
  const [user, session] = await Promise.all([
    User.findById(userId),
    GameSession.findOne({ sessionId, userId }),
  ]);

  if (!user) throw new Error('User not found.');
  if (!session) throw new Error('Session not found.');

  if (session.status === 'completed') {
    return {
      message: 'Session was already completed.',
      completionBonus: 0,
      session,
      playerStats: {
        totalXP: user.totalXP,
        currentLevel: user.currentLevel,
        currentRank: user.currentRank,
        levelInfo: calculateLevel(user.totalXP),
      },
      newlyUnlockedAchievements: [],
    };
  }

  let completionBonus = 0;
  // Award completion bonus if at least 1 challenge was attempted and bonus not yet given
  if (session.questionsAttempted >= 1 && !session.sessionBonusAwarded) {
    completionBonus = XP_RULES.BONUS_SESSION_COMPLETED;
    session.sessionBonusAwarded = true;
    session.xpEarned = (session.xpEarned || 0) + completionBonus;
    user.totalXP = (user.totalXP || 0) + completionBonus;

    // Persist GameAttempt so weekly and monthly leaderboard aggregations include the completion bonus
    const bonusAttempt = new GameAttempt({
      userId: user._id,
      sessionId: session.sessionId,
      imageReference: 'session_completion_bonus',
      userPrediction: 'REAL',
      aiClassification: 'NOT_AI_GENERATED',
      isCorrect: true,
      xpAwarded: completionBonus,
      streakAtAttempt: user.currentStreak || 0,
      explanation: 'Deepfake Detective Session Completion Bonus',
      status: 'success',
      createdAt: new Date(),
    });
    await bonusAttempt.save();
  }

  session.status = 'completed';
  session.completedAt = new Date();
  user.gamesPlayed = (user.gamesPlayed || 0) + 1;

  const levelInfo = calculateLevel(user.totalXP);
  user.currentLevel = levelInfo.level;
  user.currentRank = calculateRank(user.totalXP);

  const newlyUnlockedAchievements = checkAndAwardAchievements(user);

  await Promise.all([user.save(), session.save()]);

  const totalDecisive = (user.correctAnswers || 0) + (user.incorrectAnswers || 0);
  const accuracy = totalDecisive > 0
    ? Math.round(((user.correctAnswers || 0) / totalDecisive) * 1000) / 10
    : 0;

  return {
    message: 'Game session completed successfully!',
    completionBonus,
    session: {
      sessionId: session.sessionId,
      questionsAttempted: session.questionsAttempted,
      correctAnswers: session.correctAnswers,
      incorrectAnswers: session.incorrectAnswers,
      inconclusiveAnswers: session.inconclusiveAnswers,
      xpEarned: session.xpEarned,
      completedAt: session.completedAt,
    },
    playerStats: {
      totalXP: user.totalXP,
      currentLevel: user.currentLevel,
      currentRank: user.currentRank,
      levelInfo,
      gamesPlayed: user.gamesPlayed,
      accuracy,
      currentStreak: user.currentStreak,
      highestStreak: user.highestStreak,
    },
    newlyUnlockedAchievements,
  };
}

/**
 * Gets leaderboard data for time filters: 'all_time' | 'monthly' | 'weekly'.
 */
export async function getLeaderboardData({ filter = 'all_time', limit = 100, currentUserId = null }) {
  const topLimit = Math.min(Math.max(1, Number(limit) || 100), 100);

  if (filter === 'monthly' || filter === 'weekly') {
    const daysAgo = filter === 'weekly' ? 7 : 30;
    const sinceDate = new Date(Date.now() - daysAgo * 24 * 60 * 60 * 1000);

    // Aggregate attempts within this time window
    const recentXpByUser = await GameAttempt.aggregate([
      { $match: { createdAt: { $gte: sinceDate } } },
      {
        $group: {
          _id: '$userId',
          periodXP: { $sum: '$xpAwarded' },
          periodAttempts: { $sum: 1 },
          periodCorrect: {
            $sum: { $cond: [{ $eq: ['$isCorrect', true] }, 1, 0] },
          },
          periodIncorrect: {
            $sum: { $cond: [{ $eq: ['$isCorrect', false] }, 1, 0] },
          },
        },
      },
      { $sort: { periodXP: -1 } },
    ]);

    const userIds = recentXpByUser.map((r) => r._id);
    const users = await User.find({ _id: { $in: userIds }, isActive: true }).lean();
    const userMap = new Map(users.map((u) => [u._id.toString(), u]));

    // Construct ranked leaderboard
    const allRanked = [];
    let currentRank = 1;

    recentXpByUser.forEach((record, index) => {
      const u = userMap.get(record._id.toString());
      if (!u) return;

      if (index > 0 && record.periodXP < recentXpByUser[index - 1].periodXP) {
        currentRank = index + 1;
      }

      const totalDecisive = (record.periodCorrect || 0) + (record.periodIncorrect || 0);
      const accuracy = totalDecisive > 0
        ? Math.round(((record.periodCorrect || 0) / totalDecisive) * 1000) / 10
        : 0;

      allRanked.push({
        rank: currentRank,
        userId: u._id.toString(),
        name: u.name,
        username: u.username || u.email.split('@')[0],
        profilePicture: u.profilePicture || '',
        currentRank: u.currentRank || calculateRank(record.periodXP),
        level: calculateLevel(record.periodXP).level,
        xp: record.periodXP,
        accuracy,
        gamesPlayed: u.gamesPlayed || 0,
        isCurrentUser: currentUserId && u._id.toString() === currentUserId.toString(),
      });
    });

    const topPlayers = allRanked.slice(0, topLimit);
    let currentUserRanking = currentUserId
      ? allRanked.find((p) => p.userId === currentUserId.toString()) || null
      : null;

    if (!currentUserRanking && currentUserId) {
      const u = await User.findById(currentUserId).lean();
      if (u) {
        currentUserRanking = {
          rank: allRanked.length + 1,
          userId: u._id.toString(),
          name: u.name,
          username: u.username || u.email.split('@')[0],
          profilePicture: u.profilePicture || '',
          currentRank: u.currentRank || calculateRank(u.totalXP || 0),
          level: u.currentLevel || calculateLevel(u.totalXP || 0).level,
          xp: 0,
          accuracy: 0,
          gamesPlayed: u.gamesPlayed || 0,
          isCurrentUser: true,
        };
      }
    }

    return {
      filter,
      totalPlayers: allRanked.length,
      leaderboard: topPlayers,
      currentUserRanking,
    };
  }

  // All Time: Query directly from User collection
  const allUsers = await User.find({ isActive: true })
    .select('name username email profilePicture totalXP currentLevel currentRank correctAnswers incorrectAnswers gamesPlayed')
    .sort({ totalXP: -1, createdAt: 1 })
    .lean();

  let rank = 1;
  const allRanked = allUsers.map((u, index) => {
    if (index > 0 && (u.totalXP || 0) < (allUsers[index - 1].totalXP || 0)) {
      rank = index + 1;
    }

    const totalDecisive = (u.correctAnswers || 0) + (u.incorrectAnswers || 0);
    const accuracy = totalDecisive > 0
      ? Math.round(((u.correctAnswers || 0) / totalDecisive) * 1000) / 10
      : 0;

    return {
      rank,
      userId: u._id.toString(),
      name: u.name,
      username: u.username || u.email.split('@')[0],
      profilePicture: u.profilePicture || '',
      currentRank: u.currentRank || calculateRank(u.totalXP || 0),
      level: u.currentLevel || calculateLevel(u.totalXP || 0).level,
      xp: u.totalXP || 0,
      accuracy,
      gamesPlayed: u.gamesPlayed || 0,
      isCurrentUser: currentUserId && u._id.toString() === currentUserId.toString(),
    };
  });

  const topPlayers = allRanked.slice(0, topLimit);
  let currentUserRanking = currentUserId
    ? allRanked.find((p) => p.userId === currentUserId.toString()) || null
    : null;

  if (!currentUserRanking && currentUserId) {
    const u = await User.findById(currentUserId).lean();
    if (u) {
      currentUserRanking = {
        rank: allRanked.length + 1,
        userId: u._id.toString(),
        name: u.name,
        username: u.username || u.email.split('@')[0],
        profilePicture: u.profilePicture || '',
        currentRank: u.currentRank || calculateRank(u.totalXP || 0),
        level: u.currentLevel || calculateLevel(u.totalXP || 0).level,
        xp: u.totalXP || 0,
        accuracy: 0,
        gamesPlayed: u.gamesPlayed || 0,
        isCurrentUser: true,
      };
    }
  }

  return {
    filter: 'all_time',
    totalPlayers: allRanked.length,
    leaderboard: topPlayers,
    currentUserRanking,
  };
}

/**
 * Gets the current user's complete game statistics and achievements status.
 */
export async function getUserGameStats(userId) {
  const user = await User.findById(userId).lean();
  if (!user) throw new Error('User not found.');

  const totalDecisive = (user.correctAnswers || 0) + (user.incorrectAnswers || 0);
  const accuracy = totalDecisive > 0
    ? Math.round(((user.correctAnswers || 0) / totalDecisive) * 1000) / 10
    : 0;

  const levelInfo = calculateLevel(user.totalXP || 0);

  // Determine leaderboard position
  const higherXPCount = await User.countDocuments({
    isActive: true,
    totalXP: { $gt: user.totalXP || 0 },
  });
  const leaderboardPosition = higherXPCount + 1;

  // Map achievements catalog to unlocked/locked state
  const unlockedMap = new Map((user.achievements || []).map((a) => [a.id, a]));
  const achievements = ACHIEVEMENTS_CATALOG.map((cat) => {
    const isUnlocked = unlockedMap.has(cat.id);
    const userAch = unlockedMap.get(cat.id);
    return {
      id: cat.id,
      name: cat.name,
      description: cat.description,
      icon: cat.icon,
      badge: cat.badge,
      isUnlocked,
      unlockedAt: userAch?.unlockedAt || null,
    };
  });

  return {
    totalXP: user.totalXP || 0,
    currentLevel: user.currentLevel || 1,
    currentRank: user.currentRank || 'Bronze Detective',
    levelInfo,
    gamesPlayed: user.gamesPlayed || 0,
    totalAttempts: user.totalAttempts || 0,
    correctAnswers: user.correctAnswers || 0,
    incorrectAnswers: user.incorrectAnswers || 0,
    inconclusiveAnswers: user.inconclusiveAnswers || 0,
    accuracy,
    currentStreak: user.currentStreak || 0,
    highestStreak: user.highestStreak || 0,
    leaderboardPosition,
    totalAchievementsUnlocked: (user.achievements || []).length,
    achievements,
  };
}
