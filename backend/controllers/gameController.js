import { randomUUID } from 'node:crypto';
import mongoose from 'mongoose';
import { GameSession } from '../models/GameSession.js';
import { GameAttempt } from '../models/GameAttempt.js';
import { User } from '../models/User.js';
import { CyberCrimeRound } from '../models/CyberCrimeRound.js';
import { CyberCrimeQuestion } from '../models/CyberCrimeQuestion.js';
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

    const challengeResult = await getCuratedChallenges(userId);
    const challenges = Array.isArray(challengeResult) ? challengeResult : (challengeResult.challenges || []);
    const allCompleted = challengeResult?.allCompleted || false;
    const totalPublished = challengeResult?.totalPublished || 0;
    const stats = await getUserGameStats(userId);

    return res.status(201).json({
      success: true,
      message: 'Game session initialized.',
      data: {
        sessionId: session.sessionId,
        startedAt: session.startedAt,
        challenges,
        allCompleted,
        totalPublished,
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

    if (!userPrediction || !['REAL', 'FAKE', 'AI_GENERATED'].includes(userPrediction)) {
      if (uploadedFile) await cleanupFiles([uploadedFile]);
      return res.status(400).json({
        success: false,
        message: 'Prediction must be either REAL, FAKE, or AI_GENERATED.',
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
    const challenges = await getCuratedChallenges();
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
      const totalQ = Math.max(1, Number(req.body.totalQuestions) || Number(req.body.questionsCount) || 3);
      correctInUnit = Math.max(0, Math.min(totalQ, Number(correctCount) || 0));
      questionsInUnit = totalQ;
      xpToAward = correctInUnit * 10;
      attemptDescription = `Cyber Crime Investigation Round Completed (${roundId}: ${correctInUnit}/${totalQ} correct)`;
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

/**
 * GET /api/game/cyber-crime/rounds
 * Retrieves active and published investigation rounds and their active, published questions
 * with ground truth correct answers strictly hidden.
 */
export async function getCyberCrimeRounds(req, res, next) {
  try {
    const rounds = await CyberCrimeRound.find({
      $or: [{ publicationStatus: 'PUBLISHED' }, { status: 'PUBLISHED' }],
      isActive: true,
    })
      .sort({ roundNumber: 1, createdAt: 1 })
      .lean();

    const userId = req.user?._id;
    const completedRoundIds = new Set();
    if (userId) {
      const [attempts, u] = await Promise.all([
        GameAttempt.find({
          userId,
          imageReference: { $regex: '^cyber_round_' },
        }).select('imageReference').lean(),
        User.findById(userId).select('cyberCrimeRewards').lean(),
      ]);

      attempts.forEach((a) => {
        const ref = String(a.imageReference || '');
        const parts = ref.split('_');
        const rId = parts[parts.length - 1];
        if (rId) completedRoundIds.add(rId);
      });

      if (u && Array.isArray(u.cyberCrimeRewards)) {
        u.cyberCrimeRewards.forEach((k) => {
          if (String(k).startsWith('cyber_round_')) {
            const parts = String(k).split('_');
            const rId = parts[parts.length - 1];
            if (rId) completedRoundIds.add(rId);
          }
        });
      }
    }

    const roundsWithQuestions = await Promise.all(
      rounds.map(async (round) => {
        const questions = await CyberCrimeQuestion.find({
          $or: [
            { roundId: round.roundId },
            { roundId: round._id.toString() },
          ],
          isActive: { $ne: false },
        })
          .sort({ questionOrder: 1, createdAt: 1 })
          .lean();

        const isCompleted =
          completedRoundIds.has(round._id.toString()) ||
          completedRoundIds.has(round.roundId);

        return {
          id: round._id.toString(),
          roundId: round.roundId,
          roundNumber: round.roundNumber,
          roundTitle: round.roundTitle,
          caseDossierTitle: round.caseDossierTitle,
          evidenceCategory: round.evidenceCategory,
          incidentDescription: round.incidentDescription,
          interceptedCommunication: round.interceptedCommunication || '',
          forensicClues: round.forensicClues || '',
          difficulty: round.difficulty,
          isCompleted,
          questions: questions.map((q) => ({
            id: q._id.toString(),
            questionId: q.questionId,
            roundId: q.roundId,
            questionNumber: q.questionOrder,
            questionText: q.questionText,
            question: q.questionText,
            topic: round.evidenceCategory,
            scenario: round.incidentDescription,
            interceptedCommunication: round.interceptedCommunication || '',
            forensicClues: round.forensicClues || '',
            options: [
              { id: 'a', text: q.options?.a || '' },
              { id: 'b', text: q.options?.b || '' },
              { id: 'c', text: q.options?.c || '' },
              { id: 'd', text: q.options?.d || '' },
            ],
            difficulty: q.difficulty,
            xpReward: q.xpReward || 10,
          })),
        };
      })
    );

    const playableRounds = roundsWithQuestions.filter(
      (r) => Array.isArray(r.questions) && r.questions.length > 0
    );

    const allCompleted =
      playableRounds.length > 0 &&
      playableRounds.every((r) => r.isCompleted);

    return res.status(200).json({
      success: true,
      data: {
        rounds: playableRounds,
        totalRounds: playableRounds.length,
        allCompleted,
        totalPublished: playableRounds.length,
      },
    });
  } catch (error) {
    return next(error);
  }
}

/**
 * POST /api/game/cyber-crime/evaluate
 * Verifies submitted answer against stored ground truth in CyberCrimeQuestion
 */
export async function evaluateCyberCrimeAnswer(req, res, next) {
  try {
    const { questionId, selectedOptionId } = req.body;

    if (!questionId || !selectedOptionId) {
      return res.status(400).json({
        success: false,
        message: 'questionId and selectedOptionId are required.',
      });
    }

    let question = null;
    if (mongoose.Types.ObjectId.isValid(questionId)) {
      question = await CyberCrimeQuestion.findById(questionId);
    }
    if (!question) {
      question = await CyberCrimeQuestion.findOne({ questionId });
    }
    if (!question && mongoose.Types.ObjectId.isValid(questionId)) {
      question = await GameQuestion.findById(questionId);
    }
    if (!question) {
      question = await GameQuestion.findOne({ questionId });
    }

    if (!question) {
      return res.status(404).json({
        success: false,
        message: `Investigation question '${questionId}' was not found.`,
      });
    }

    const normSelected = String(selectedOptionId).trim().toUpperCase();
    const normCorrect = String(question.correctAnswer).trim().toUpperCase();
    const isCorrect = normSelected === normCorrect;

    const xpToAward = isCorrect ? (question.xpReward || 10) : 0;

    return res.status(200).json({
      success: true,
      data: {
        isCorrect,
        selectedOptionId: normSelected.toLowerCase(),
        correctOptionId: normCorrect.toLowerCase(),
        correctAnswer: normCorrect,
        explanation: question.explanation,
        xpAwarded: xpToAward,
      },
    });
  } catch (error) {
    return next(error);
  }
}

