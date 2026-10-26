import { randomUUID } from 'node:crypto';
import { GameSession } from '../models/GameSession.js';
import { GameAttempt } from '../models/GameAttempt.js';
import {
  processGameSubmission,
  completeGameSession,
  getLeaderboardData,
  getUserGameStats,
  getCuratedChallenges,
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
