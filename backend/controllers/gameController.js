import { randomUUID } from 'node:crypto';
import { GameSession } from '../models/GameSession.js';
import { GameAttempt } from '../models/GameAttempt.js';
import { User } from '../models/User.js';
import {
  processGameSubmission,
  completeGameSession,
  getLeaderboardData,
  getUserGameStats,
  getCuratedChallenges,
  calculateLevel,
  calculateRank,
  checkAndAwardAchievements,
} from '../services/gameService.js';
import { cleanupFiles } from '../middleware/uploadMiddleware.js';

/**
 * POST /api/game/start
 * Starts a new game session and returns session info and curated challenges.
 */
export async function startGameSession(req, res, next) {
  try {
    const userId = req.user._id;
    const sessionId = randomUUID();

    const session = await GameSession.create({
      userId,
      sessionId,
      startedAt: new Date(),
      status: 'active',
    });

    const challenges = getCuratedChallenges();
    const stats = await getUserGameStats(userId);

    return res.status(201).json({
      success: true,
      message: 'Game session initialized.',
      data: {
        sessionId: session.sessionId,
        startedAt: session.startedAt,
        challenges,
        playerStats: stats,
      },
    });
  } catch (error) {
    return next(error);
  }
}

/**
 * POST /api/game/submit
 * Submits user prediction for a challenge or uploaded image.
 */
export async function submitPrediction(req, res, next) {
  try {
    const userId = req.user._id;
    const { sessionId, userPrediction, challengeId } = req.body;
    const uploadedFile = req.file;

    if (!sessionId) {
      if (uploadedFile) await cleanupFiles([uploadedFile]);
      return res.status(400).json({
        success: false,
        message: 'Session ID is required.',
      });
    }

    if (!userPrediction || !['REAL', 'FAKE'].includes(userPrediction)) {
      if (uploadedFile) await cleanupFiles([uploadedFile]);
      return res.status(400).json({
        success: false,
        message: 'Prediction must be either REAL or FAKE.',
      });
    }

    if (!challengeId && !uploadedFile) {
      return res.status(400).json({
        success: false,
        message: 'Either a challengeId or an uploaded image is required.',
      });
    }

    const result = await processGameSubmission({
      userId,
      sessionId,
      userPrediction,
      challengeId,
      uploadedFile,
    });

    return res.status(200).json({
      success: true,
      message: 'Prediction processed successfully.',
      data: result,
    });
  } catch (error) {
    if (req.file) {
      await cleanupFiles([req.file]).catch(() => {});
    }
    return next(error);
  }
}

/**
 * POST /api/game/complete
 * Completes current game session and awards completion bonuses.
 */
export async function completeSession(req, res, next) {
  try {
    const userId = req.user._id;
    const { sessionId } = req.body;

    if (!sessionId) {
      return res.status(400).json({
        success: false,
        message: 'Session ID is required to complete session.',
      });
    }

    const result = await completeGameSession({ userId, sessionId });

    return res.status(200).json({
      success: true,
      data: result,
    });
  } catch (error) {
    return next(error);
  }
}

/**
 * GET /api/game/stats
 * Returns current authenticated user's game statistics.
 */
export async function getGameStats(req, res, next) {
  try {
    const userId = req.user._id;
    const stats = await getUserGameStats(userId);

    return res.status(200).json({
      success: true,
      data: stats,
    });
  } catch (error) {
    return next(error);
  }
}

/**
 * GET /api/game/history
 * Returns user's previous game sessions and attempts.
 */
export async function getGameHistory(req, res, next) {
  try {
    const userId = req.user._id;

    const [sessions, recentAttempts] = await Promise.all([
      GameSession.find({ userId })
        .sort({ createdAt: -1 })
        .limit(20)
        .lean(),
      GameAttempt.find({ userId })
        .sort({ createdAt: -1 })
        .limit(50)
        .lean(),
    ]);

    return res.status(200).json({
      success: true,
      data: {
        sessions,
        recentAttempts,
      },
    });
  } catch (error) {
    return next(error);
  }
}

/**
 * GET /api/game/leaderboard
 * Returns global leaderboard with all_time, monthly, or weekly filtering.
 */
export async function getLeaderboard(req, res, next) {
  try {
    const { filter = 'all_time', limit = 100 } = req.query;
    const currentUserId = req.user?._id;

    const data = await getLeaderboardData({
      filter,
      limit,
      currentUserId,
    });

    return res.status(200).json({
      success: true,
      data,
    });
  } catch (error) {
    return next(error);
  }
}

/**
 * GET /api/game/leaderboard/me
 * Returns current user's ranking position on the leaderboard.
 */
export async function getMyRanking(req, res, next) {
  try {
    const { filter = 'all_time' } = req.query;
    const currentUserId = req.user._id;

    const data = await getLeaderboardData({
      filter,
      limit: 1000,
      currentUserId,
    });

    return res.status(200).json({
      success: true,
      data: data.currentUserRanking || {
        rank: '--',
        userId: currentUserId,
        message: 'No ranking data available for this period yet.',
      },
    });
  } catch (error) {
    return next(error);
  }
}

/**
 * GET /api/game/achievements
 * Returns all achievements catalog with user unlock status.
 */
export async function getAchievements(req, res, next) {
  try {
    const userId = req.user._id;
    const stats = await getUserGameStats(userId);

    return res.status(200).json({
      success: true,
      data: {
        totalUnlocked: stats.totalAchievementsUnlocked,
        achievements: stats.achievements,
      },
    });
  } catch (error) {
    return next(error);
  }
}

/**
 * GET /api/game/challenges
 * Returns curated challenges list.
 */
export async function getChallenges(_req, res, next) {
  try {
    const challenges = getCuratedChallenges();
    return res.status(200).json({
      success: true,
      data: challenges,
    });
  } catch (error) {
    return next(error);
  }
}

/**
 * POST /api/game/cyber-crime/reward
 * Authoritatively awards EXP from Cyber Crime Investigation into the shared Global Profile.
 * Supports round completion, full campaign playthrough, and daily mission completion with strict idempotency.
 * Persists GameAttempt documents so weekly and monthly leaderboard aggregations reflect all earned EXP.
 */
export async function recordCyberCrimeReward(req, res, next) {
  try {
    const userId = req.user._id;
    const { rewardType, attemptId, roundId, correctCount, missionId, dateKey } = req.body;

    const user = await User.findById(userId);
    if (!user) {
      return res.status(404).json({
        success: false,
        message: 'User not found.',
      });
    }

    if (!Array.isArray(user.cyberCrimeRewards)) {
      user.cyberCrimeRewards = [];
    }

    let idempotencyKey = '';
    let xpToAward = 0;
    let attemptDescription = '';
    let questionsInUnit = 0;
    let correctInUnit = 0;

    if (rewardType === 'round') {
      if (!attemptId || !roundId) {
        return res.status(400).json({
          success: false,
          message: 'attemptId and roundId are required for round reward.',
        });
      }
      idempotencyKey = `cyber_round_${attemptId}_${roundId}`;
      correctInUnit = Math.max(0, Math.min(3, Number(correctCount) || 0));
      questionsInUnit = 3;
      xpToAward = correctInUnit * 10;
      attemptDescription = `Cyber Crime Investigation Round Completed (${roundId}: ${correctInUnit}/3 correct)`;
    } else if (rewardType === 'campaign') {
      if (!attemptId) {
        return res.status(400).json({
          success: false,
          message: 'attemptId is required for campaign reward.',
        });
      }
      idempotencyKey = `cyber_campaign_${attemptId}`;
      const totalCorrect = Math.max(0, Math.min(9, Number(correctCount) || 0));

      // Calculate if round rewards were already claimed for this attempt
      const roundRewardsClaimed = user.cyberCrimeRewards.filter((k) =>
        k.startsWith(`cyber_round_${attemptId}_`)
      ).length;

      if (roundRewardsClaimed > 0) {
        xpToAward = 25; // Campaign Mastery Bonus
        correctInUnit = 0;
        questionsInUnit = 0;
      } else {
        xpToAward = totalCorrect * 10;
        correctInUnit = totalCorrect;
        questionsInUnit = 9;
      }

      user.gamesPlayed = (user.gamesPlayed || 0) + 1;
      attemptDescription = `Cyber Crime Campaign Case Closed (${totalCorrect}/9 correct)`;
    } else if (rewardType === 'mission') {
      if (!missionId || !dateKey) {
        return res.status(400).json({
          success: false,
          message: 'missionId and dateKey are required for mission reward.',
        });
      }
      idempotencyKey = `cyber_mission_${dateKey}_${missionId}`;
      const validMissionRewards = {
        'dm-phish-spotter': 25,
        'dm-identity-verifier': 30,
        'dm-tx-investigator': 35,
        'dm-safe-action': 25,
        'dm-phish-audit': 25,
        'dm-exec-verify': 30,
        'dm-bank-freeze': 35,
        'dm-url-triage': 25,
        'dm-qr-quishing': 30,
        'dm-invoice-tamper': 35,
      };
      xpToAward = validMissionRewards[missionId] || 25;
      correctInUnit = 1;
      questionsInUnit = 1;
      attemptDescription = `Cyber Crime Daily Mission Completed (${missionId})`;
    } else {
      return res.status(400).json({
        success: false,
        message: 'Invalid rewardType. Expected "round", "campaign", or "mission".',
      });
    }

    // Check idempotency: if already claimed, return safely without double-awarding
    if (user.cyberCrimeRewards.includes(idempotencyKey)) {
      const safeUser = user.toSafeObject();
      return res.status(200).json({
        success: true,
        alreadyClaimed: true,
        xpAwarded: 0,
        user: safeUser,
        data: {
          user: safeUser,
          alreadyClaimed: true,
          xpAwarded: 0,
        },
        message: 'Reward has already been recorded for this event.',
      });
    }

    // Award XP and record idempotency key
    user.cyberCrimeRewards.push(idempotencyKey);
    user.totalXP = (user.totalXP || 0) + xpToAward;

    if (questionsInUnit > 0) {
      user.totalAttempts = (user.totalAttempts || 0) + questionsInUnit;
      user.correctAnswers = (user.correctAnswers || 0) + correctInUnit;
      user.incorrectAnswers = (user.incorrectAnswers || 0) + (questionsInUnit - correctInUnit);
    }

    const levelInfo = calculateLevel(user.totalXP);
    user.currentLevel = levelInfo.level;
    user.currentRank = calculateRank(user.totalXP);

    const newlyUnlockedAchievements = checkAndAwardAchievements(user);

    // Save GameAttempt so Weekly and Monthly leaderboards aggregate this EXP
    if (xpToAward > 0) {
      await GameAttempt.create({
        userId: user._id,
        sessionId: attemptId || `cyber_${dateKey || Date.now()}`,
        imageReference: idempotencyKey,
        userPrediction: 'REAL',
        aiClassification: 'NOT_AI_GENERATED',
        isCorrect: true,
        xpAwarded: xpToAward,
        streakAtAttempt: user.currentStreak || 0,
        explanation: attemptDescription,
        status: 'success',
        createdAt: new Date(),
      });
    }

    await user.save();

    const safeUser = user.toSafeObject();
    return res.status(200).json({
      success: true,
      alreadyClaimed: false,
      xpAwarded: xpToAward,
      user: safeUser,
      data: {
        user: safeUser,
        xpAwarded: xpToAward,
        alreadyClaimed: false,
        newlyUnlockedAchievements,
      },
      newlyUnlockedAchievements,
      message: `Successfully awarded ${xpToAward} EXP to shared global profile.`,
    });
  } catch (error) {
    return next(error);
  }
}

