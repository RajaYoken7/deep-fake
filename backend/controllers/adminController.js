import { User } from '../models/User.js';
import { DetectionHistory } from '../models/DetectionHistory.js';
import { IdentityReport } from '../models/IdentityReport.js';
import { GameSession } from '../models/GameSession.js';
import { GameAttempt } from '../models/GameAttempt.js';
import { GameQuestion } from '../models/GameQuestion.js';
import { GameImage } from '../models/GameImage.js';
import { CyberCrimeRound } from '../models/CyberCrimeRound.js';
import { CyberCrimeQuestion } from '../models/CyberCrimeQuestion.js';
import { AdminActivityLog } from '../models/AdminActivityLog.js';
import { AuditLog } from '../models/AuditLog.js';
import { RefreshToken } from '../models/RefreshToken.js';
import { calculateLevel, calculateRank } from '../services/gameService.js';
import {
  generateAccessToken,
  generateRefreshToken,
  hashToken,
  getRefreshTokenCookieOptions,
  getClearCookieOptions,
  getRefreshTokenExpiryDate,
} from '../utils/tokenUtils.js';

/**
 * Helper to record administrative activities to both AdminActivityLog and AuditLog
 */
async function recordAdminActivity({
  adminId,
  adminName,
  adminEmail,
  action,
  description,
  targetId = null,
  targetType = null,
  details = {},
  req = null,
}) {
  try {
    const ipAddress = req?.ip || req?.headers['x-forwarded-for'] || '';
    const userAgent = req?.headers['user-agent'] || '';

    await AdminActivityLog.create({
      adminId,
      adminName: adminName || '',
      adminEmail: adminEmail || '',
      action,
      description,
      targetId: targetId ? String(targetId) : null,
      targetType: targetType || null,
      details,
      ipAddress,
      userAgent,
    });

    // Also persist to legacy AuditLog for backward compatibility if applicable
    if (['USER_ACTIVATED', 'USER_DEACTIVATED', 'ROLE_CHANGED', 'ADMIN_LOGIN'].includes(action)) {
      await AuditLog.create({
        adminId,
        action,
        targetUserId: targetType === 'USER' ? targetId : null,
        targetUserEmail: details?.targetEmail || '',
        details,
        ipAddress,
        userAgent,
      }).catch(() => {});
    }
  } catch (err) {
    console.warn(`[AdminActivityLog Warning] Failed to persist activity log: ${err.message}`);
  }
}

/**
 * POST /api/admin/auth/login
 * Dedicated rate-limited administrator login
 */
export async function adminLogin(req, res, next) {
  try {
    const { email, password } = req.body;

    if (!email || !password) {
      return res.status(400).json({
        success: false,
        message: 'Admin email and password are required.',
      });
    }

    const normalizedEmail = email.toLowerCase().trim();
    const user = await User.findOne({ email: normalizedEmail }).select('+password');

    if (!user) {
      return res.status(401).json({
        success: false,
        message: 'Invalid administrator credentials.',
      });
    }

    const isMatch = await user.comparePassword(password);
    if (!isMatch) {
      return res.status(401).json({
        success: false,
        message: 'Invalid administrator credentials.',
      });
    }

    if (user.role !== 'ADMIN') {
      return res.status(403).json({
        success: false,
        message: 'Access denied: Administrator privileges required.',
      });
    }

    if (!user.isActive) {
      return res.status(403).json({
        success: false,
        message: 'Administrator account has been deactivated. Please contact lead administrator.',
      });
    }

    user.lastLogin = new Date();
    await user.save();

    const accessToken = generateAccessToken(user);
    const refreshToken = generateRefreshToken();

    // Persist refresh token session
    await RefreshToken.create({
      tokenHash: hashToken(refreshToken),
      userId: user._id,
      expiresAt: getRefreshTokenExpiryDate(),
      userAgent: req.headers['user-agent'] || '',
      ipAddress: req.ip || '',
    });

    res.cookie('refreshToken', refreshToken, getRefreshTokenCookieOptions());

    // Record login in activity logs
    await recordAdminActivity({
      adminId: user._id,
      adminName: user.name,
      adminEmail: user.email,
      action: 'ADMIN_LOGIN',
      description: `Administrator ${user.name} logged into the Admin Portal.`,
      targetId: user._id,
      targetType: 'ADMIN',
      req,
    });

    return res.status(200).json({
      success: true,
      message: 'Admin authentication successful.',
      data: {
        user: user.toSafeObject(),
        accessToken,
      },
    });
  } catch (error) {
    return next(error);
  }
}

/**
 * POST /api/admin/auth/logout
 * Secure admin logout
 */
export async function adminLogout(req, res, next) {
  try {
    const admin = req.user;
    const rawRefreshToken = req.cookies?.refreshToken;

    if (rawRefreshToken) {
      await RefreshToken.updateOne(
        { tokenHash: hashToken(rawRefreshToken) },
        { revoked: true, revokedAt: new Date() }
      ).catch(() => {});
    }

    res.clearCookie('refreshToken', getClearCookieOptions());

    if (admin) {
      await recordAdminActivity({
        adminId: admin._id,
        adminName: admin.name,
        adminEmail: admin.email,
        action: 'ADMIN_LOGOUT',
        description: `Administrator ${admin.name} logged out.`,
        targetId: admin._id,
        targetType: 'ADMIN',
        req,
      });
    }

    return res.status(200).json({
      success: true,
      message: 'Admin session terminated successfully.',
    });
  } catch (error) {
    return next(error);
  }
}

/**
 * GET /api/admin/auth/me
 */
export async function getAdminMe(req, res) {
  return res.status(200).json({
    success: true,
    data: {
      user: req.user.toSafeObject(),
    },
  });
}

/**
 * GET /api/admin/dashboard/stats & GET /api/admin/overview
 * Real MongoDB statistics, trends, and overview data
 */
export async function getAdminOverview(req, res, next) {
  try {
    const [
      totalUsers,
      activeUsers,
      totalDetections,
      totalIdentityReports,
      totalGameSessions,
      completedGameSessions,
      xpSumResult,
      totalQuestions,
      recentUsers,
      recentActivity,
      classificationCounts,
    ] = await Promise.all([
      User.countDocuments(),
      User.countDocuments({ isActive: true }),
      DetectionHistory.countDocuments(),
      IdentityReport.countDocuments(),
      GameSession.countDocuments(),
      GameSession.countDocuments({ status: 'completed' }),
      User.aggregate([{ $group: { _id: null, totalXP: { $sum: '$totalXP' } } }]),
      GameQuestion.countDocuments(),
      User.find().sort({ createdAt: -1 }).limit(5).select('-password').lean(),
      AdminActivityLog.find().sort({ createdAt: -1 }).limit(6).lean(),
      DetectionHistory.aggregate([
        { $group: { _id: '$classification', count: { $sum: 1 } } },
      ]),
    ]);

    const totalXpEarned = xpSumResult[0]?.totalXP || 0;

    // Calculate 7-day trend activity
    const sevenDaysAgo = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000);

    const [recentDetectionsByDay, recentSessionsByDay, recentUsersByDay] = await Promise.all([
      DetectionHistory.aggregate([
        { $match: { createdAt: { $gte: sevenDaysAgo } } },
        {
          $group: {
            _id: { $dateToString: { format: '%Y-%m-%d', date: '$createdAt' } },
            count: { $sum: 1 },
          },
        },
        { $sort: { _id: 1 } },
      ]),
      GameSession.aggregate([
        { $match: { createdAt: { $gte: sevenDaysAgo } } },
        {
          $group: {
            _id: { $dateToString: { format: '%Y-%m-%d', date: '$createdAt' } },
            count: { $sum: 1 },
          },
        },
        { $sort: { _id: 1 } },
      ]),
      User.aggregate([
        { $match: { createdAt: { $gte: sevenDaysAgo } } },
        {
          $group: {
            _id: { $dateToString: { format: '%Y-%m-%d', date: '$createdAt' } },
            count: { $sum: 1 },
          },
        },
        { $sort: { _id: 1 } },
      ]),
    ]);

    // Build unified 7-day chronological chart dataset
    const trendMap = {};
    for (let i = 6; i >= 0; i--) {
      const d = new Date(Date.now() - i * 24 * 60 * 60 * 1000);
      const key = d.toISOString().split('T')[0];
      const dayLabel = d.toLocaleDateString('en-US', { weekday: 'short', month: 'numeric', day: 'numeric' });
      trendMap[key] = { date: key, label: dayLabel, users: 0, detections: 0, games: 0 };
    }

    recentUsersByDay.forEach((item) => {
      if (trendMap[item._id]) trendMap[item._id].users = item.count;
    });
    recentDetectionsByDay.forEach((item) => {
      if (trendMap[item._id]) trendMap[item._id].detections = item.count;
    });
    recentSessionsByDay.forEach((item) => {
      if (trendMap[item._id]) trendMap[item._id].games = item.count;
    });

    const classificationMap = {
      AI_GENERATED: 0,
      NOT_AI_GENERATED: 0,
      INCONCLUSIVE: 0,
    };
    classificationCounts.forEach((c) => {
      if (classificationMap[c._id] !== undefined) {
        classificationMap[c._id] = c.count;
      }
    });

    return res.status(200).json({
      success: true,
      data: {
        stats: {
          totalUsers,
          activeUsers,
          totalDetections,
          totalIdentityReports,
          totalGameSessions,
          completedGameSessions,
          totalXpEarned,
          totalQuestions,
        },
        charts: {
          activityTrends: Object.values(trendMap),
          detectionDistribution: classificationMap,
          gameCompletionRate: totalGameSessions > 0
            ? Math.round((completedGameSessions / totalGameSessions) * 100)
            : 0,
        },
        recentUsers: recentUsers.map((u) => ({
          id: u._id,
          name: u.name,
          email: u.email,
          role: u.role,
          isActive: u.isActive,
          createdAt: u.createdAt,
          lastLogin: u.lastLogin,
        })),
        recentActivity: recentActivity.map((a) => ({
          id: a._id,
          action: a.action,
          description: a.description,
          adminName: a.adminName,
          timestamp: a.createdAt,
        })),
      },
    });
  } catch (error) {
    return next(error);
  }
}

/**
 * GET /api/admin/users
 * Returns list of registered users with search, filtering, and pagination
 */
export async function getAdminUsers(req, res, next) {
  try {
    const {
      search = '',
      status = 'all',
      role = 'all',
      minXP,
      maxXP,
      sortBy = 'newest',
      page = 1,
      limit = 50,
    } = req.query;

    const query = {};

    if (search.trim()) {
      const reg = new RegExp(search.trim(), 'i');
      query.$or = [{ name: reg }, { email: reg }, { username: reg }];
    }

    if (status === 'active') {
      query.isActive = true;
    } else if (status === 'inactive') {
      query.isActive = false;
    }

    if (role && role !== 'all') {
      query.role = role.toUpperCase();
    }

    if (minXP !== undefined && minXP !== '') {
      query.totalXP = { ...query.totalXP, $gte: Number(minXP) };
    }
    if (maxXP !== undefined && maxXP !== '') {
      query.totalXP = { ...query.totalXP, $lte: Number(maxXP) };
    }

    let sort = { createdAt: -1 };
    if (sortBy === 'oldest') sort = { createdAt: 1 };
    else if (sortBy === 'highest_xp') sort = { totalXP: -1, createdAt: -1 };
    else if (sortBy === 'lowest_xp') sort = { totalXP: 1, createdAt: -1 };

    const pageNum = Math.max(1, parseInt(page, 10) || 1);
    const limitNum = Math.min(100, Math.max(1, parseInt(limit, 10) || 50));
    const skip = (pageNum - 1) * limitNum;

    const [total, users] = await Promise.all([
      User.countDocuments(query),
      User.find(query)
        .sort(sort)
        .skip(skip)
        .limit(limitNum)
        .select('-password')
        .lean(),
    ]);

    return res.status(200).json({
      success: true,
      data: {
        users: users.map((u) => ({
          id: u._id,
          name: u.name,
          email: u.email,
          role: u.role,
          isActive: u.isActive,
          isEmailVerified: u.isEmailVerified,
          totalXP: u.totalXP || 0,
          currentLevel: u.currentLevel || 1,
          currentRank: u.currentRank || 'Cadet',
          gamesPlayed: u.gamesPlayed || 0,
          correctAnswers: u.correctAnswers || 0,
          totalAttempts: u.totalAttempts || 0,
          createdAt: u.createdAt,
          lastLogin: u.lastLogin,
        })),
        pagination: {
          total,
          page: pageNum,
          limit: limitNum,
          totalPages: Math.ceil(total / limitNum) || 1,
        },
      },
    });
  } catch (error) {
    return next(error);
  }
}

/**
 * GET /api/admin/users/:id/details
 * Complete unified user dossier from actual MongoDB records
 */
export async function getAdminUserDetails(req, res, next) {
  try {
    const { id } = req.params;
    const user = await User.findById(id).select('-password').lean();

    if (!user) {
      return res.status(404).json({
        success: false,
        message: 'User account not found.',
      });
    }

    const [gameSessions, gameAttempts, detections, identityReports] = await Promise.all([
      GameSession.find({ userId: id }).sort({ createdAt: -1 }).limit(50).lean(),
      GameAttempt.find({ userId: id }).sort({ createdAt: -1 }).limit(100).lean(),
      DetectionHistory.find({ userId: id }).sort({ createdAt: -1 }).limit(50).lean(),
      IdentityReport.find({ userId: id }).sort({ createdAt: -1 }).limit(50).lean(),
    ]);

    const levelInfo = calculateLevel(user.totalXP || 0);

    return res.status(200).json({
      success: true,
      data: {
        user: {
          id: user._id,
          name: user.name,
          email: user.email,
          role: user.role,
          isActive: user.isActive,
          isEmailVerified: user.isEmailVerified,
          createdAt: user.createdAt,
          lastLogin: user.lastLogin,
        },
        progression: {
          totalXP: user.totalXP || 0,
          currentLevel: user.currentLevel || levelInfo.level,
          currentRank: user.currentRank || 'Cadet',
          levelInfo,
          currentStreak: user.currentStreak || 0,
          highestStreak: user.highestStreak || 0,
          gamesPlayed: user.gamesPlayed || 0,
          correctAnswers: user.correctAnswers || 0,
          incorrectAnswers: user.incorrectAnswers || 0,
          totalAttempts: user.totalAttempts || 0,
          achievements: user.achievements || [],
        },
        gameHistory: gameSessions.map((s) => ({
          id: s._id,
          sessionId: s.sessionId,
          questionsAttempted: s.questionsAttempted || 0,
          correctAnswers: s.correctAnswers || 0,
          incorrectAnswers: s.incorrectAnswers || 0,
          xpEarned: s.xpEarned || 0,
          status: s.status,
          startedAt: s.startedAt,
          completedAt: s.completedAt,
          createdAt: s.createdAt,
        })),
        recentAttempts: gameAttempts.slice(0, 15).map((a) => ({
          id: a._id,
          sessionId: a.sessionId,
          imageReference: a.imageReference,
          userPrediction: a.userPrediction,
          aiClassification: a.aiClassification,
          isCorrect: a.isCorrect,
          xpAwarded: a.xpAwarded,
          createdAt: a.createdAt,
        })),
        detectionHistory: detections.map((d) => ({
          id: d._id,
          fileName: d.fileName,
          fileSize: d.fileSize,
          classification: d.classification,
          score: d.score,
          createdAt: d.createdAt,
        })),
        identityHistory: identityReports.map((r) => ({
          id: r._id,
          reportId: r.reportId,
          verificationType: r.verificationType,
          status: r.status,
          decision: r.faceComparison?.decision || 'INCONCLUSIVE',
          similarityScore: r.faceComparison?.similarityScore ?? null,
          createdAt: r.createdAt,
        })),
      },
    });
  } catch (error) {
    return next(error);
  }
}

/**
 * PATCH /api/admin/users/:id/status
 * Activate or deactivate user accounts
 */
export async function toggleUserStatus(req, res, next) {
  try {
    const { id } = req.params;
    const { isActive } = req.body;

    if (typeof isActive !== 'boolean') {
      return res.status(400).json({
        success: false,
        message: 'isActive must be a boolean value.',
      });
    }

    if (id === req.user._id.toString()) {
      return res.status(400).json({
        success: false,
        message: 'Administrators cannot deactivate their own account.',
      });
    }

    const user = await User.findById(id);
    if (!user) {
      return res.status(404).json({
        success: false,
        message: 'User not found.',
      });
    }

    user.isActive = isActive;
    await user.save();

    await recordAdminActivity({
      adminId: req.user._id,
      adminName: req.user.name,
      adminEmail: req.user.email,
      action: isActive ? 'USER_ACTIVATED' : 'USER_DEACTIVATED',
      description: `User account "${user.email}" was ${isActive ? 'activated' : 'deactivated'} by ${req.user.name}.`,
      targetId: user._id,
      targetType: 'USER',
      details: { targetEmail: user.email, previousState: !isActive, newState: isActive },
      req,
    });

    return res.status(200).json({
      success: true,
      message: `User account has been ${isActive ? 'activated' : 'deactivated'}.`,
      data: {
        user: user.toSafeObject(),
      },
    });
  } catch (error) {
    return next(error);
  }
}

/**
 * GET /api/admin/detection-history
 * Read-only view of past deepfake detection records with search, filter, and sorting
 */
export async function getAdminDetectionHistory(req, res, next) {
  try {
    const {
      search = '',
      classification = 'ALL',
      startDate,
      endDate,
      sortBy = 'newest',
      page = 1,
      limit = 50,
    } = req.query;

    const query = {};

    if (classification && classification !== 'ALL') {
      query.classification = classification;
    }

    if (startDate || endDate) {
      query.createdAt = {};
      if (startDate) query.createdAt.$gte = new Date(startDate);
      if (endDate) {
        const endD = new Date(endDate);
        endD.setHours(23, 59, 59, 999);
        query.createdAt.$lte = endD;
      }
    }

    if (search.trim()) {
      const reg = new RegExp(search.trim(), 'i');
      const matchingUsers = await User.find({
        $or: [{ name: reg }, { email: reg }],
      }).select('_id');
      const userIds = matchingUsers.map((u) => u._id);

      const orClauses = [
        { fileName: reg },
        { userId: { $in: userIds } },
      ];
      if (search.trim().match(/^[0-9a-fA-F]{24}$/)) {
        orClauses.push({ _id: search.trim() });
      }
      query.$or = orClauses;
    }

    let sort = { createdAt: -1 };
    if (sortBy === 'oldest') sort = { createdAt: 1 };
    else if (sortBy === 'score_desc') sort = { score: -1, createdAt: -1 };
    else if (sortBy === 'score_asc') sort = { score: 1, createdAt: -1 };

    const pageNum = Math.max(1, parseInt(page, 10) || 1);
    const limitNum = Math.min(100, Math.max(1, parseInt(limit, 10) || 50));
    const skip = (pageNum - 1) * limitNum;

    const [total, records] = await Promise.all([
      DetectionHistory.countDocuments(query),
      DetectionHistory.find(query)
        .populate('userId', 'name email')
        .sort(sort)
        .skip(skip)
        .limit(limitNum)
        .lean(),
    ]);

    return res.status(200).json({
      success: true,
      data: {
        detections: records.map((r) => ({
          id: r._id,
          fileName: r.fileName,
          fileSize: r.fileSize,
          mimeType: r.mimeType,
          classification: r.classification,
          score: r.score,
          threshold: r.threshold,
          disclaimer: r.disclaimer,
          user: r.userId ? { id: r.userId._id, name: r.userId.name, email: r.userId.email } : null,
          details: r.details,
          createdAt: r.createdAt,
        })),
        pagination: {
          total,
          page: pageNum,
          limit: limitNum,
          totalPages: Math.ceil(total / limitNum) || 1,
        },
      },
    });
  } catch (error) {
    return next(error);
  }
}

/**
 * GET /api/admin/identity-history
 * Read-only view of identity verification records with search, filter, and sorting
 */
export async function getAdminIdentityHistory(req, res, next) {
  try {
    const {
      search = '',
      status = 'ALL',
      decision = 'ALL',
      startDate,
      endDate,
      sortBy = 'newest',
      page = 1,
      limit = 50,
    } = req.query;

    const query = {};

    if (status && status !== 'ALL') {
      query.status = status.toLowerCase();
    }

    if (decision && decision !== 'ALL') {
      query['faceComparison.decision'] = decision;
    }

    if (startDate || endDate) {
      query.createdAt = {};
      if (startDate) query.createdAt.$gte = new Date(startDate);
      if (endDate) {
        const endD = new Date(endDate);
        endD.setHours(23, 59, 59, 999);
        query.createdAt.$lte = endD;
      }
    }

    if (search.trim()) {
      const reg = new RegExp(search.trim(), 'i');
      const matchingUsers = await User.find({
        $or: [{ name: reg }, { email: reg }],
      }).select('_id');
      const userIds = matchingUsers.map((u) => u._id);

      query.$or = [
        { reportId: reg },
        { verificationType: reg },
        { userId: { $in: userIds } },
      ];
    }

    let sort = { createdAt: -1 };
    if (sortBy === 'oldest') sort = { createdAt: 1 };
    else if (sortBy === 'similarity_desc') sort = { 'faceComparison.similarityScore': -1, createdAt: -1 };

    const pageNum = Math.max(1, parseInt(page, 10) || 1);
    const limitNum = Math.min(100, Math.max(1, parseInt(limit, 10) || 50));
    const skip = (pageNum - 1) * limitNum;

    const [total, records] = await Promise.all([
      IdentityReport.countDocuments(query),
      IdentityReport.find(query)
        .populate('userId', 'name email')
        .sort(sort)
        .skip(skip)
        .limit(limitNum)
        .lean(),
    ]);

    return res.status(200).json({
      success: true,
      data: {
        identityReports: records.map((r) => ({
          id: r._id,
          reportId: r.reportId,
          verificationType: r.verificationType,
          status: r.status,
          decision: r.faceComparison?.decision || 'INCONCLUSIVE',
          similarityScore: r.faceComparison?.similarityScore ?? null,
          confidence: r.faceComparison?.confidence || 'None',
          explanation: r.faceComparison?.explanation || '',
          aiDecision: r.aiImageAnalysis?.decision || null,
          aiProbability: r.aiImageAnalysis?.aiProbability ?? null,
          user: r.userId ? { id: r.userId._id, name: r.userId.name, email: r.userId.email } : null,
          createdAt: r.createdAt,
        })),
        pagination: {
          total,
          page: pageNum,
          limit: limitNum,
          totalPages: Math.ceil(total / limitNum) || 1,
        },
      },
    });
  } catch (error) {
    return next(error);
  }
}

/**
 * GET /api/admin/games/questions
 * Question bank for Game Management with search, filter, and pagination
 */
export async function getAdminQuestions(req, res, next) {
  try {
    const {
      search = '',
      difficulty = 'ALL',
      category = 'ALL',
      label = 'ALL',
      status = 'ALL',
      isActive = 'ALL',
      sortBy = 'newest',
      page = 1,
      limit = 50,
    } = req.query;

    const query = {};

    if (difficulty && difficulty !== 'ALL') query.difficulty = difficulty;
    if (category && category !== 'ALL') query.category = category;
    if (label && label !== 'ALL') {
      query.$or = [{ label }, { correctAnswer: label }];
    }
    if (status && status !== 'ALL') query.status = status;
    if (isActive === 'true') query.isActive = true;
    else if (isActive === 'false') query.isActive = false;

    if (search.trim()) {
      const reg = new RegExp(search.trim(), 'i');
      query.$or = [
        { questionId: reg },
        { title: reg },
        { category: reg },
        { clues: reg },
        { explanation: reg },
      ];
    }

    let sort = { createdAt: -1 };
    if (sortBy === 'oldest') sort = { createdAt: 1 };

    const pageNum = Math.max(1, parseInt(page, 10) || 1);
    const limitNum = Math.min(100, Math.max(1, parseInt(limit, 10) || 50));
    const skip = (pageNum - 1) * limitNum;

    const [total, questions] = await Promise.all([
      GameQuestion.countDocuments(query),
      GameQuestion.find(query).sort(sort).skip(skip).limit(limitNum).lean(),
    ]);

    return res.status(200).json({
      success: true,
      data: {
        questions: questions.map((q) => ({
          id: q._id,
          questionId: q.questionId || `Q-${q._id.toString().slice(-4).toUpperCase()}`,
          imageId: q.imageId || '',
          title: q.title,
          category: q.category,
          difficulty: q.difficulty,
          imageUrl: q.imageUrl,
          genuineImageUrl: q.genuineImageUrl,
          aiImageUrl: q.aiImageUrl,
          correctAnswer: q.correctAnswer || q.label || 'REAL',
          label: q.label || q.correctAnswer || 'REAL',
          groundTruthClassification: q.groundTruthClassification,
          clues: q.clues,
          explanation: q.explanation,
          status: q.status || 'PUBLISHED',
          isActive: q.isActive !== false,
          createdAt: q.createdAt,
          updatedAt: q.updatedAt,
        })),
        pagination: {
          total,
          page: pageNum,
          limit: limitNum,
          totalPages: Math.ceil(total / limitNum) || 1,
        },
        total,
      },
    });
  } catch (error) {
    return next(error);
  }
}

/**
 * POST /api/admin/games/questions
 * Add question with photo upload or external URL
 */
export async function createAdminQuestion(req, res, next) {
  try {
    const {
      questionId: customQuestionId,
      imageId = '',
      title,
      category = 'Facial Synthesis',
      difficulty = 'Medium',
      correctAnswer,
      label,
      imageUrl: rawImageUrl,
      clues = '',
      explanation = '',
      status = 'PUBLISHED',
      isActive = true,
    } = req.body;

    const effectiveLabel = (correctAnswer || label || '').toUpperCase();
    if (!title || !effectiveLabel) {
      return res.status(400).json({
        success: false,
        message: 'Title and label / correct answer (REAL or AI_GENERATED) are required.',
      });
    }

    // Determine imageUrl from uploaded files if present
    let imageUrl = rawImageUrl || '';
    let genuineImageUrl = '';
    let aiImageUrl = '';

    if (req.files) {
      if (req.files.image?.[0]) {
        imageUrl = `/uploads/tmp/${req.files.image[0].filename}`;
      }
      if (req.files.genuineImage?.[0]) {
        genuineImageUrl = `/uploads/tmp/${req.files.genuineImage[0].filename}`;
        if (!imageUrl) imageUrl = genuineImageUrl;
      }
      if (req.files.aiImage?.[0]) {
        aiImageUrl = `/uploads/tmp/${req.files.aiImage[0].filename}`;
        if (!imageUrl) imageUrl = aiImageUrl;
      }
    } else if (req.file) {
      imageUrl = `/uploads/tmp/${req.file.filename}`;
    }

    if (!imageUrl) {
      return res.status(400).json({
        success: false,
        message: 'An image URL or uploaded photograph is required for game questions.',
      });
    }

    const normalizedLabel = effectiveLabel === 'REAL' ? 'REAL' : 'AI_GENERATED';
    const groundTruthClassification = normalizedLabel === 'REAL' ? 'NOT_AI_GENERATED' : 'AI_GENERATED';

    const count = await GameQuestion.countDocuments();
    const questionId = customQuestionId ? customQuestionId.trim() : `Q-${String(count + 1).padStart(3, '0')}`;

    const question = await GameQuestion.create({
      questionId,
      imageId: imageId.trim(),
      title: title.trim(),
      category: category.trim(),
      difficulty,
      imageUrl,
      genuineImageUrl: normalizedLabel === 'REAL' ? (genuineImageUrl || imageUrl) : (genuineImageUrl || ''),
      aiImageUrl: normalizedLabel === 'AI_GENERATED' ? (aiImageUrl || imageUrl) : (aiImageUrl || ''),
      correctAnswer: normalizedLabel,
      label: normalizedLabel,
      groundTruthClassification,
      clues: clues.trim(),
      explanation: explanation.trim(),
      status: status || 'PUBLISHED',
      isActive: isActive === true || isActive === 'true',
      createdBy: req.user._id,
    });

    await recordAdminActivity({
      adminId: req.user._id,
      adminName: req.user.name,
      adminEmail: req.user.email,
      action: 'GAME_QUESTION_CREATED',
      description: `Game question "${question.questionId}: ${question.title}" (${question.difficulty}, ${question.correctAnswer}) created.`,
      targetId: question._id,
      targetType: 'GAME_QUESTION',
      details: { questionId: question.questionId, title: question.title, status: question.status },
      req,
    });

    return res.status(201).json({
      success: true,
      message: 'Game question successfully added to question bank.',
      data: {
        question,
      },
    });
  } catch (error) {
    return next(error);
  }
}

/**
 * PUT /api/admin/games/questions/:id
 * Edit existing question
 */
export async function updateAdminQuestion(req, res, next) {
  try {
    const { id } = req.params;
    const {
      title,
      category,
      difficulty,
      correctAnswer,
      label,
      imageId,
      imageUrl: newImageUrl,
      clues,
      explanation,
      status,
      isActive,
    } = req.body;

    const question = await GameQuestion.findById(id);
    if (!question) {
      return res.status(404).json({
        success: false,
        message: 'Game question not found.',
      });
    }

    if (title !== undefined) question.title = title.trim();
    if (category !== undefined) question.category = category.trim();
    if (difficulty !== undefined) question.difficulty = difficulty;
    if (imageId !== undefined) question.imageId = imageId.trim();
    if (status !== undefined) question.status = status;

    const rawLabel = correctAnswer || label;
    if (rawLabel !== undefined) {
      const normalizedLabel = rawLabel.toUpperCase() === 'REAL' ? 'REAL' : 'AI_GENERATED';
      question.correctAnswer = normalizedLabel;
      question.label = normalizedLabel;
      question.groundTruthClassification = normalizedLabel === 'REAL' ? 'NOT_AI_GENERATED' : 'AI_GENERATED';
    }
    if (clues !== undefined) question.clues = clues.trim();
    if (explanation !== undefined) question.explanation = explanation.trim();
    if (isActive !== undefined) question.isActive = Boolean(isActive === true || isActive === 'true');

    if (newImageUrl) {
      question.imageUrl = newImageUrl.trim();
    }
    if (req.files) {
      if (req.files.image?.[0]) question.imageUrl = `/uploads/tmp/${req.files.image[0].filename}`;
      if (req.files.genuineImage?.[0]) question.genuineImageUrl = `/uploads/tmp/${req.files.genuineImage[0].filename}`;
      if (req.files.aiImage?.[0]) question.aiImageUrl = `/uploads/tmp/${req.files.aiImage[0].filename}`;
    }

    await question.save();

    await recordAdminActivity({
      adminId: req.user._id,
      adminName: req.user.name,
      adminEmail: req.user.email,
      action: 'GAME_QUESTION_UPDATED',
      description: `Game question "${question.questionId}: ${question.title}" updated.`,
      targetId: question._id,
      targetType: 'GAME_QUESTION',
      req,
    });

    return res.status(200).json({
      success: true,
      message: 'Game question updated successfully.',
      data: {
        question,
      },
    });
  } catch (error) {
    return next(error);
  }
}

/**
 * DELETE /api/admin/games/questions/:id
 * Delete game question
 */
export async function deleteAdminQuestion(req, res, next) {
  try {
    const { id } = req.params;
    const question = await GameQuestion.findByIdAndDelete(id);

    if (!question) {
      return res.status(404).json({
        success: false,
        message: 'Game question not found.',
      });
    }

    await recordAdminActivity({
      adminId: req.user._id,
      adminName: req.user.name,
      adminEmail: req.user.email,
      action: 'GAME_QUESTION_DELETED',
      description: `Game question "${question.questionId || id}: ${question.title}" was deleted.`,
      targetId: id,
      targetType: 'GAME_QUESTION',
      req,
    });

    return res.status(200).json({
      success: true,
      message: 'Game question deleted successfully.',
    });
  } catch (error) {
    return next(error);
  }
}

/**
 * PATCH /api/admin/games/questions/:id/toggle
 * Enable or disable a question
 */
export async function toggleAdminQuestion(req, res, next) {
  try {
    const { id } = req.params;
    const question = await GameQuestion.findById(id);

    if (!question) {
      return res.status(404).json({
        success: false,
        message: 'Game question not found.',
      });
    }

    question.isActive = !question.isActive;
    await question.save();

    await recordAdminActivity({
      adminId: req.user._id,
      adminName: req.user.name,
      adminEmail: req.user.email,
      action: 'GAME_QUESTION_TOGGLED',
      description: `Game question "${question.questionId}: ${question.title}" is now ${question.isActive ? 'enabled' : 'disabled'}.`,
      targetId: question._id,
      targetType: 'GAME_QUESTION',
      details: { isActive: question.isActive },
      req,
    });

    return res.status(200).json({
      success: true,
      message: `Question is now ${question.isActive ? 'enabled' : 'disabled'}.`,
      data: {
        question,
      },
    });
  } catch (error) {
    return next(error);
  }
}

/**
 * PATCH /api/admin/games/questions/:id/publish
 * Toggle between DRAFT and PUBLISHED status
 */
export async function publishAdminQuestion(req, res, next) {
  try {
    const { id } = req.params;
    const question = await GameQuestion.findById(id);

    if (!question) {
      return res.status(404).json({
        success: false,
        message: 'Game question not found.',
      });
    }

    question.status = question.status === 'PUBLISHED' ? 'DRAFT' : 'PUBLISHED';
    await question.save();

    await recordAdminActivity({
      adminId: req.user._id,
      adminName: req.user.name,
      adminEmail: req.user.email,
      action: question.status === 'PUBLISHED' ? 'GAME_QUESTION_PUBLISHED' : 'GAME_QUESTION_UNPUBLISHED',
      description: `Game question "${question.questionId}: ${question.title}" is now ${question.status}.`,
      targetId: question._id,
      targetType: 'GAME_QUESTION',
      details: { status: question.status },
      req,
    });

    return res.status(200).json({
      success: true,
      message: `Question status changed to ${question.status}.`,
      data: {
        question,
      },
    });
  } catch (error) {
    return next(error);
  }
}

// =========================================================================
// Image Management Controllers (Exclusively for Deepfake Detection Game)
// =========================================================================

/**
 * GET /api/admin/games/images
 * Image bank for Deepfake Detection Game
 */
export async function getAdminImages(req, res, next) {
  try {
    const {
      search = '',
      imageType = 'ALL',
      correctAnswer = 'ALL',
      imageCategory = 'ALL',
      difficulty = 'ALL',
      status = 'ALL',
      publicationStatus = 'ALL',
      isActive = 'ALL',
      sortBy = 'newest',
      page = 1,
      limit = 50,
    } = req.query;

    const query = {};

    const targetType = correctAnswer !== 'ALL' ? correctAnswer : imageType;
    if (targetType && targetType !== 'ALL') {
      query.$or = [{ imageType: targetType }, { correctAnswer: targetType }];
    }
    if (imageCategory && imageCategory !== 'ALL') query.imageCategory = imageCategory;
    if (difficulty && difficulty !== 'ALL') query.difficulty = difficulty;
    
    const targetStatus = publicationStatus !== 'ALL' ? publicationStatus : status;
    if (targetStatus && targetStatus !== 'ALL') {
      query.$or = [{ status: targetStatus }, { publicationStatus: targetStatus }];
    }
    if (isActive === 'true') query.isActive = true;
    else if (isActive === 'false') query.isActive = false;

    if (search.trim()) {
      const reg = new RegExp(search.trim(), 'i');
      query.$or = [
        { imageId: reg },
        { imageCategory: reg },
        { notes: reg },
        { explanation: reg },
      ];
    }

    let sort = { createdAt: -1 };
    if (sortBy === 'oldest') sort = { createdAt: 1 };

    const pageNum = Math.max(1, parseInt(page, 10) || 1);
    const limitNum = Math.min(100, Math.max(1, parseInt(limit, 10) || 50));
    const skip = (pageNum - 1) * limitNum;

    const [total, images] = await Promise.all([
      GameImage.countDocuments(query),
      GameImage.find(query).sort(sort).skip(skip).limit(limitNum).lean(),
    ]);

    return res.status(200).json({
      success: true,
      data: {
        images: images.map((img) => ({
          id: img._id,
          imageId: img.imageId,
          imageUrl: img.imageUrl,
          imageCategory: img.imageCategory,
          imageType: img.correctAnswer || img.imageType,
          correctAnswer: img.correctAnswer || img.imageType,
          difficulty: img.difficulty || 'Medium',
          status: img.publicationStatus || img.status || 'PUBLISHED',
          publicationStatus: img.publicationStatus || img.status || 'PUBLISHED',
          isActive: img.isActive !== false,
          notes: img.explanation || img.notes || '',
          explanation: img.explanation || img.notes || '',
          fileSize: img.fileSize,
          mimeType: img.mimeType,
          createdAt: img.createdAt,
          updatedAt: img.updatedAt,
        })),
        pagination: {
          total,
          page: pageNum,
          limit: limitNum,
          totalPages: Math.ceil(total / limitNum) || 1,
        },
        total,
      },
    });
  } catch (error) {
    return next(error);
  }
}

/**
 * POST /api/admin/games/images
 * Upload or register a genuine or AI photograph with duplicate prevention
 */
export async function createAdminImage(req, res, next) {
  try {
    const {
      imageUrl: rawImageUrl,
      imageType: rawImageType,
      correctAnswer: rawCorrectAnswer,
      imageCategory = 'Facial Synthesis',
      difficulty = 'Medium',
      status: rawStatus = 'DRAFT',
      publicationStatus: rawPubStatus,
      isActive = true,
      notes = '',
      explanation = '',
    } = req.body;

    let imageUrl = rawImageUrl ? rawImageUrl.trim() : '';
    let fileSize = 0;
    let mimeType = '';

    if (req.file) {
      imageUrl = `/uploads/tmp/${req.file.filename}`;
      fileSize = req.file.size || 0;
      mimeType = req.file.mimetype || '';
    }

    if (!imageUrl) {
      return res.status(400).json({
        success: false,
        message: 'An image URL or uploaded photograph is required.',
      });
    }

    const chosenAnswer = (rawCorrectAnswer || rawImageType || '').trim().toUpperCase();
    if (!chosenAnswer || !['REAL', 'AI_GENERATED'].includes(chosenAnswer)) {
      return res.status(400).json({
        success: false,
        message: 'Correct answer must be explicitly defined as REAL or AI_GENERATED.',
      });
    }

    const chosenStatus = (rawPubStatus || rawStatus || 'DRAFT').trim().toUpperCase();
    const chosenExplanation = (explanation || notes || '').trim();

    // Duplicate prevention check
    const existing = await GameImage.findOne({ imageUrl });
    if (existing) {
      return res.status(409).json({
        success: false,
        message: `This photograph already exists in Image Bank with ID: ${existing.imageId}.`,
      });
    }

    const count = await GameImage.countDocuments();
    const imageId = `IMG-${String(count + 1).padStart(3, '0')}`;

    const newImage = await GameImage.create({
      imageId,
      imageUrl,
      imageType: chosenAnswer,
      correctAnswer: chosenAnswer,
      imageCategory: imageCategory.trim(),
      difficulty,
      status: chosenStatus,
      publicationStatus: chosenStatus,
      isActive: isActive === true || isActive === 'true',
      notes: chosenExplanation,
      explanation: chosenExplanation,
      fileSize,
      mimeType,
      uploadedBy: req.user._id,
    });

    await recordAdminActivity({
      adminId: req.user._id,
      adminName: req.user.name,
      adminEmail: req.user.email,
      action: 'GAME_IMAGE_CREATED',
      description: `Photograph "${imageId}" (${newImage.imageType}, ${newImage.imageCategory}) registered in Image Bank.`,
      targetId: newImage._id,
      targetType: 'GAME_IMAGE',
      details: { imageId, imageType: newImage.imageType, category: newImage.imageCategory },
      req,
    });

    const imagePayload = {
      id: newImage._id,
      _id: newImage._id,
      imageId: newImage.imageId,
      imageUrl: newImage.imageUrl,
      imageCategory: newImage.imageCategory,
      imageType: newImage.correctAnswer || newImage.imageType,
      correctAnswer: newImage.correctAnswer || newImage.imageType,
      difficulty: newImage.difficulty || 'Medium',
      status: newImage.publicationStatus || newImage.status || 'PUBLISHED',
      publicationStatus: newImage.publicationStatus || newImage.status || 'PUBLISHED',
      isActive: newImage.isActive !== false,
      notes: newImage.explanation || newImage.notes || '',
      explanation: newImage.explanation || newImage.notes || '',
      fileSize: newImage.fileSize,
      mimeType: newImage.mimeType,
      createdAt: newImage.createdAt,
      updatedAt: newImage.updatedAt,
    };

    return res.status(201).json({
      success: true,
      message: 'Photograph successfully registered in Image Bank.',
      data: {
        image: imagePayload,
      },
    });
  } catch (error) {
    return next(error);
  }
}

/**
 * PUT /api/admin/games/images/:id
 * Edit photograph details in Image Bank
 */
export async function updateAdminImage(req, res, next) {
  try {
    const { id } = req.params;
    const {
      imageUrl: newImageUrl,
      imageType,
      correctAnswer,
      imageCategory,
      difficulty,
      status,
      publicationStatus,
      isActive,
      notes,
      explanation,
    } = req.body;

    const image = await GameImage.findById(id);
    if (!image) {
      return res.status(404).json({
        success: false,
        message: 'Photograph not found in Image Bank.',
      });
    }

    const targetAnswer = (correctAnswer || imageType || '').trim().toUpperCase();
    if (targetAnswer && ['REAL', 'AI_GENERATED'].includes(targetAnswer)) {
      image.imageType = targetAnswer;
      image.correctAnswer = targetAnswer;
    }
    if (imageCategory) image.imageCategory = imageCategory.trim();
    if (difficulty) image.difficulty = difficulty;
    
    const targetStatus = (publicationStatus || status || '').trim().toUpperCase();
    if (targetStatus && ['DRAFT', 'PUBLISHED'].includes(targetStatus)) {
      image.status = targetStatus;
      image.publicationStatus = targetStatus;
    }
    
    if (isActive !== undefined) image.isActive = Boolean(isActive === true || isActive === 'true');
    
    const targetExplanation = explanation !== undefined ? explanation : notes;
    if (targetExplanation !== undefined) {
      image.notes = targetExplanation.trim();
      image.explanation = targetExplanation.trim();
    }

    if (newImageUrl) image.imageUrl = newImageUrl.trim();
    if (req.file) {
      image.imageUrl = `/uploads/tmp/${req.file.filename}`;
      image.fileSize = req.file.size || 0;
      image.mimeType = req.file.mimetype || '';
    }

    await image.save();

    await recordAdminActivity({
      adminId: req.user._id,
      adminName: req.user.name,
      adminEmail: req.user.email,
      action: 'GAME_IMAGE_UPDATED',
      description: `Photograph "${image.imageId}" details updated.`,
      targetId: image._id,
      targetType: 'GAME_IMAGE',
      req,
    });

    const imagePayload = {
      id: image._id,
      _id: image._id,
      imageId: image.imageId,
      imageUrl: image.imageUrl,
      imageCategory: image.imageCategory,
      imageType: image.correctAnswer || image.imageType,
      correctAnswer: image.correctAnswer || image.imageType,
      difficulty: image.difficulty || 'Medium',
      status: image.publicationStatus || image.status || 'PUBLISHED',
      publicationStatus: image.publicationStatus || image.status || 'PUBLISHED',
      isActive: image.isActive !== false,
      notes: image.explanation || image.notes || '',
      explanation: image.explanation || image.notes || '',
      fileSize: image.fileSize,
      mimeType: image.mimeType,
      createdAt: image.createdAt,
      updatedAt: image.updatedAt,
    };

    return res.status(200).json({
      success: true,
      message: 'Photograph details updated successfully.',
      data: {
        image: imagePayload,
      },
    });
  } catch (error) {
    return next(error);
  }
}

/**
 * DELETE /api/admin/games/images/:id
 * Delete photograph from Image Bank
 */
export async function deleteAdminImage(req, res, next) {
  try {
    const { id } = req.params;
    const image = await GameImage.findByIdAndDelete(id);

    if (!image) {
      return res.status(404).json({
        success: false,
        message: 'Photograph not found in Image Bank.',
      });
    }

    await recordAdminActivity({
      adminId: req.user._id,
      adminName: req.user.name,
      adminEmail: req.user.email,
      action: 'GAME_IMAGE_DELETED',
      description: `Photograph "${image.imageId}" was deleted from Image Bank.`,
      targetId: id,
      targetType: 'GAME_IMAGE',
      req,
    });

    return res.status(200).json({
      success: true,
      message: 'Photograph deleted from Image Bank.',
    });
  } catch (error) {
    return next(error);
  }
}

/**
 * PATCH /api/admin/games/images/:id/toggle
 * Toggle active state of photograph in Image Bank
 */
export async function toggleAdminImage(req, res, next) {
  try {
    const { id } = req.params;
    const image = await GameImage.findById(id);

    if (!image) {
      return res.status(404).json({
        success: false,
        message: 'Photograph not found in Image Bank.',
      });
    }

    image.isActive = !image.isActive;
    await image.save();

    await recordAdminActivity({
      adminId: req.user._id,
      adminName: req.user.name,
      adminEmail: req.user.email,
      action: 'GAME_IMAGE_TOGGLED',
      description: `Photograph "${image.imageId}" is now ${image.isActive ? 'active' : 'disabled'}.`,
      targetId: image._id,
      targetType: 'GAME_IMAGE',
      details: { isActive: image.isActive },
      req,
    });

    return res.status(200).json({
      success: true,
      message: `Photograph is now ${image.isActive ? 'active' : 'disabled'}.`,
      data: {
        image,
      },
    });
  } catch (error) {
    return next(error);
  }
}

/**
 * PATCH /api/admin/games/images/:id/publish
 * Toggle between DRAFT and PUBLISHED status for photograph in Image Bank
 */
export async function publishAdminImage(req, res, next) {
  try {
    const { id } = req.params;
    const image = await GameImage.findById(id);

    if (!image) {
      return res.status(404).json({
        success: false,
        message: 'Photograph not found in Image Bank.',
      });
    }

    const nextStatus = (image.publicationStatus || image.status) === 'PUBLISHED' ? 'DRAFT' : 'PUBLISHED';
    image.status = nextStatus;
    image.publicationStatus = nextStatus;
    await image.save();

    await recordAdminActivity({
      adminId: req.user._id,
      adminName: req.user.name,
      adminEmail: req.user.email,
      action: nextStatus === 'PUBLISHED' ? 'GAME_IMAGE_PUBLISHED' : 'GAME_IMAGE_UNPUBLISHED',
      description: `Photograph "${image.imageId}" is now ${nextStatus}.`,
      targetId: image._id,
      targetType: 'GAME_IMAGE',
      details: { status: nextStatus, publicationStatus: nextStatus },
      req,
    });

    return res.status(200).json({
      success: true,
      message: `Photograph status updated to ${nextStatus}.`,
      data: {
        image,
      },
    });
  } catch (error) {
    return next(error);
  }
}

/**
 * GET /api/admin/games/history
 * View completed and active game sessions with player information and multi-filtering
 */
export async function getAdminGameHistory(req, res, next) {
  try {
    const {
      search = '',
      status = 'ALL',
      minScore,
      maxScore,
      startDate,
      endDate,
      sortBy = 'newest',
      page = 1,
      limit = 50,
    } = req.query;

    const query = {};

    if (status && status !== 'ALL') {
      query.status = status.toLowerCase();
    }

    if (minScore !== undefined && minScore !== '') {
      query.xpEarned = { ...query.xpEarned, $gte: Number(minScore) };
    }
    if (maxScore !== undefined && maxScore !== '') {
      query.xpEarned = { ...query.xpEarned, $lte: Number(maxScore) };
    }

    if (startDate || endDate) {
      query.createdAt = {};
      if (startDate) query.createdAt.$gte = new Date(startDate);
      if (endDate) {
        const endD = new Date(endDate);
        endD.setHours(23, 59, 59, 999);
        query.createdAt.$lte = endD;
      }
    }

    if (search.trim()) {
      const reg = new RegExp(search.trim(), 'i');
      const matchingUsers = await User.find({
        $or: [{ name: reg }, { email: reg }],
      }).select('_id');
      const userIds = matchingUsers.map((u) => u._id);

      query.$or = [{ sessionId: reg }, { userId: { $in: userIds } }];
    }

    let sort = { createdAt: -1 };
    if (sortBy === 'oldest') sort = { createdAt: 1 };
    else if (sortBy === 'highest_score') sort = { xpEarned: -1, createdAt: -1 };

    const pageNum = Math.max(1, parseInt(page, 10) || 1);
    const limitNum = Math.min(100, Math.max(1, parseInt(limit, 10) || 50));
    const skip = (pageNum - 1) * limitNum;

    const [total, sessions] = await Promise.all([
      GameSession.countDocuments(query),
      GameSession.find(query)
        .populate('userId', 'name email totalXP currentRank')
        .sort(sort)
        .skip(skip)
        .limit(limitNum)
        .lean(),
    ]);

    const formattedSessions = sessions.map((s) => {
      const decisive = (s.correctAnswers || 0) + (s.incorrectAnswers || 0);
      const accuracy = decisive > 0 ? Math.round(((s.correctAnswers || 0) / decisive) * 100) : 0;

      return {
        id: s._id,
        sessionId: s.sessionId,
        gameName: 'Deepfake Detective',
        player: s.userId
          ? { id: s.userId._id, name: s.userId.name, email: s.userId.email, rank: s.userId.currentRank }
          : { name: 'Anonymous Detective', email: '--' },
        finalScore: s.xpEarned || 0,
        xpEarned: s.xpEarned || 0,
        questionsAttempted: s.questionsAttempted || 0,
        correctAnswers: s.correctAnswers || 0,
        incorrectAnswers: s.incorrectAnswers || 0,
        accuracyPercentage: accuracy,
        status: s.status,
        startedAt: s.startedAt,
        completedAt: s.completedAt,
        createdAt: s.createdAt,
      };
    });

    return res.status(200).json({
      success: true,
      data: {
        gameSessions: formattedSessions,
        pagination: {
          total,
          page: pageNum,
          limit: limitNum,
          totalPages: Math.ceil(total / limitNum) || 1,
        },
      },
    });
  } catch (error) {
    return next(error);
  }
}

/**
 * GET /api/admin/leaderboard
 * Read-only rankings, total XP, completed games, highest streaks
 */
export async function getAdminLeaderboard(req, res, next) {
  try {
    const { limit = 100 } = req.query;
    const limitNum = Math.min(100, Math.max(1, parseInt(limit, 10) || 100));

    const topPlayers = await User.find({ isActive: true })
      .sort({ totalXP: -1, correctAnswers: -1 })
      .limit(limitNum)
      .select('name email totalXP currentLevel currentRank gamesPlayed highestStreak correctAnswers incorrectAnswers')
      .lean();

    const leaderboard = topPlayers.map((player, index) => {
      const decisive = (player.correctAnswers || 0) + (player.incorrectAnswers || 0);
      const accuracy = decisive > 0 ? Math.round(((player.correctAnswers || 0) / decisive) * 100) : 0;

      return {
        rank: index + 1,
        id: player._id,
        name: player.name,
        email: player.email,
        totalXP: player.totalXP || 0,
        level: player.currentLevel || 1,
        rankTitle: player.currentRank || 'Cadet',
        gamesPlayed: player.gamesPlayed || 0,
        highestStreak: player.highestStreak || 0,
        accuracyPercentage: accuracy,
      };
    });

    return res.status(200).json({
      success: true,
      data: {
        leaderboard,
        total: leaderboard.length,
      },
    });
  } catch (error) {
    return next(error);
  }
}

/**
 * Helper to generate CSV string from array of objects
 */
function jsonToCsv(items, headers) {
  if (!items || !items.length) {
    return headers.map((h) => `"${h.label}"`).join(',') + '\n';
  }

  const headerLine = headers.map((h) => `"${h.label}"`).join(',');
  const rowLines = items.map((row) =>
    headers
      .map((h) => {
        const val = row[h.key];
        if (val === null || val === undefined) return '""';
        return `"${String(val).replace(/"/g, '""')}"`;
      })
      .join(',')
  );

  return [headerLine, ...rowLines].join('\n');
}

/**
 * GET /api/admin/reports
 * Platform reports with date filters and optional CSV export
 */
export async function getAdminReports(req, res, next) {
  try {
    const { type = 'users', startDate, endDate, format = 'json' } = req.query;

    const dateQuery = {};
    if (startDate) dateQuery.$gte = new Date(startDate);
    if (endDate) {
      const endD = new Date(endDate);
      endD.setHours(23, 59, 59, 999);
      dateQuery.$lte = endD;
    }
    const hasDateFilter = Boolean(startDate || endDate);

    let reportData = [];
    let csvHeaders = [];
    let reportFilename = `deeptrust_${type}_report_${Date.now()}.csv`;

    switch (type) {
      case 'detections': {
        const dQuery = hasDateFilter ? { createdAt: dateQuery } : {};
        const detections = await DetectionHistory.find(dQuery)
          .populate('userId', 'name email')
          .sort({ createdAt: -1 })
          .limit(500)
          .lean();

        reportData = detections.map((d) => ({
          id: d._id,
          fileName: d.fileName,
          userName: d.userId?.name || 'Anonymous',
          userEmail: d.userId?.email || 'N/A',
          classification: d.classification,
          aiScore: d.score !== null ? (d.score * 100).toFixed(1) + '%' : 'N/A',
          createdAt: new Date(d.createdAt).toISOString(),
        }));

        csvHeaders = [
          { key: 'id', label: 'Report ID' },
          { key: 'fileName', label: 'File Name' },
          { key: 'userName', label: 'User Name' },
          { key: 'userEmail', label: 'User Email' },
          { key: 'classification', label: 'Detection Result' },
          { key: 'aiScore', label: 'Confidence Score' },
          { key: 'createdAt', label: 'Analyzed Date' },
        ];
        break;
      }

      case 'identity': {
        const iQuery = hasDateFilter ? { createdAt: dateQuery } : {};
        const reports = await IdentityReport.find(iQuery)
          .populate('userId', 'name email')
          .sort({ createdAt: -1 })
          .limit(500)
          .lean();

        reportData = reports.map((r) => ({
          reportId: r.reportId,
          userName: r.userId?.name || 'Anonymous',
          userEmail: r.userId?.email || 'N/A',
          verificationType: r.verificationType,
          status: r.status,
          decision: r.faceComparison?.decision || 'INCONCLUSIVE',
          similarityScore: r.faceComparison?.similarityScore ? `${r.faceComparison.similarityScore.toFixed(1)}%` : 'N/A',
          createdAt: new Date(r.createdAt).toISOString(),
        }));

        csvHeaders = [
          { key: 'reportId', label: 'Report ID' },
          { key: 'userName', label: 'User Name' },
          { key: 'userEmail', label: 'User Email' },
          { key: 'verificationType', label: 'Verification Type' },
          { key: 'status', label: 'Status' },
          { key: 'decision', label: 'Decision' },
          { key: 'similarityScore', label: 'Similarity Score' },
          { key: 'createdAt', label: 'Timestamp' },
        ];
        break;
      }

      case 'games': {
        const gQuery = hasDateFilter ? { createdAt: dateQuery } : {};
        const sessions = await GameSession.find(gQuery)
          .populate('userId', 'name email')
          .sort({ createdAt: -1 })
          .limit(500)
          .lean();

        reportData = sessions.map((s) => {
          const decisive = (s.correctAnswers || 0) + (s.incorrectAnswers || 0);
          const accuracy = decisive > 0 ? Math.round(((s.correctAnswers || 0) / decisive) * 100) : 0;

          return {
            sessionId: s.sessionId,
            playerName: s.userId?.name || 'Anonymous',
            playerEmail: s.userId?.email || 'N/A',
            questionsAttempted: s.questionsAttempted || 0,
            correctAnswers: s.correctAnswers || 0,
            incorrectAnswers: s.incorrectAnswers || 0,
            accuracyPercentage: `${accuracy}%`,
            xpEarned: s.xpEarned || 0,
            status: s.status,
            completedAt: s.completedAt ? new Date(s.completedAt).toISOString() : 'Incomplete',
            createdAt: new Date(s.createdAt).toISOString(),
          };
        });

        csvHeaders = [
          { key: 'sessionId', label: 'Session ID' },
          { key: 'playerName', label: 'Player Name' },
          { key: 'playerEmail', label: 'Player Email' },
          { key: 'questionsAttempted', label: 'Attempted' },
          { key: 'correctAnswers', label: 'Correct' },
          { key: 'incorrectAnswers', label: 'Incorrect' },
          { key: 'accuracyPercentage', label: 'Accuracy' },
          { key: 'xpEarned', label: 'XP Earned' },
          { key: 'status', label: 'Session Status' },
          { key: 'createdAt', label: 'Started Date' },
          { key: 'completedAt', label: 'Completed Date' },
        ];
        break;
      }

      case 'xp': {
        const uQuery = hasDateFilter ? { createdAt: dateQuery } : {};
        const players = await User.find(uQuery)
          .sort({ totalXP: -1 })
          .limit(500)
          .select('name email totalXP currentLevel currentRank gamesPlayed createdAt')
          .lean();

        reportData = players.map((p, idx) => ({
          rank: idx + 1,
          name: p.name,
          email: p.email,
          totalXP: p.totalXP || 0,
          currentLevel: p.currentLevel || 1,
          currentRank: p.currentRank || 'Cadet',
          gamesPlayed: p.gamesPlayed || 0,
          joinedAt: new Date(p.createdAt).toISOString(),
        }));

        csvHeaders = [
          { key: 'rank', label: 'Rank' },
          { key: 'name', label: 'Player Name' },
          { key: 'email', label: 'Email' },
          { key: 'totalXP', label: 'Total XP' },
          { key: 'currentLevel', label: 'Current Level' },
          { key: 'currentRank', label: 'Rank Title' },
          { key: 'gamesPlayed', label: 'Games Played' },
          { key: 'joinedAt', label: 'Registered Date' },
        ];
        break;
      }

      case 'users':
      default: {
        const uQuery = hasDateFilter ? { createdAt: dateQuery } : {};
        const users = await User.find(uQuery)
          .sort({ createdAt: -1 })
          .limit(500)
          .select('-password')
          .lean();

        reportData = users.map((u) => ({
          id: u._id,
          name: u.name,
          email: u.email,
          role: u.role,
          isActive: u.isActive ? 'Active' : 'Inactive',
          totalXP: u.totalXP || 0,
          gamesPlayed: u.gamesPlayed || 0,
          createdAt: new Date(u.createdAt).toISOString(),
          lastLogin: u.lastLogin ? new Date(u.lastLogin).toISOString() : 'Never',
        }));

        csvHeaders = [
          { key: 'id', label: 'User ID' },
          { key: 'name', label: 'Full Name' },
          { key: 'email', label: 'Email' },
          { key: 'role', label: 'Role' },
          { key: 'isActive', label: 'Account Status' },
          { key: 'totalXP', label: 'XP Points' },
          { key: 'gamesPlayed', label: 'Games Played' },
          { key: 'createdAt', label: 'Registration Date' },
          { key: 'lastLogin', label: 'Last Login' },
        ];
        break;
      }
    }

    if (format === 'csv') {
      const csv = jsonToCsv(reportData, csvHeaders);
      res.setHeader('Content-Type', 'text/csv');
      res.setHeader('Content-Disposition', `attachment; filename="${reportFilename}"`);
      return res.status(200).send(csv);
    }

    return res.status(200).json({
      success: true,
      data: {
        type,
        count: reportData.length,
        records: reportData,
        generatedAt: new Date().toISOString(),
      },
    });
  } catch (error) {
    return next(error);
  }
}

/**
 * GET /api/admin/audit-logs & GET /api/admin/activity-logs
 * Administrative security audit log trail
 */
export async function getAdminAuditLogs(req, res, next) {
  try {
    const { action = 'ALL', search = '', limit = 100 } = req.query;

    const query = {};
    if (action && action !== 'ALL') {
      query.action = action;
    }
    if (search.trim()) {
      const reg = new RegExp(search.trim(), 'i');
      query.$or = [{ description: reg }, { adminName: reg }, { adminEmail: reg }];
    }

    const limitNum = Math.min(200, Math.max(1, parseInt(limit, 10) || 100));

    const logs = await AdminActivityLog.find(query)
      .populate('adminId', 'name email')
      .sort({ createdAt: -1 })
      .limit(limitNum)
      .lean();

    return res.status(200).json({
      success: true,
      data: {
        logs: logs.map((l) => ({
          id: l._id,
          action: l.action,
          description: l.description,
          targetId: l.targetId,
          targetType: l.targetType,
          adminName: l.adminName || l.adminId?.name || 'Administrator',
          adminEmail: l.adminEmail || l.adminId?.email || '',
          details: l.details,
          ipAddress: l.ipAddress,
          createdAt: l.createdAt,
        })),
        total: logs.length,
      },
    });
  } catch (error) {
    return next(error);
  }
}

// =========================================================================
// CYBER CRIME INVESTIGATION: ROUND & QUESTION BANK MANAGEMENT
// =========================================================================

/**
 * GET /api/admin/cybercrime/rounds
 * List all investigation rounds with their question statistics
 */
export async function getAdminCyberCrimeRounds(req, res, next) {
  try {
    const {
      search = '',
      difficulty = 'ALL',
      status = 'ALL',
      publicationStatus = 'ALL',
      isActive = 'ALL',
    } = req.query;

    const query = {};
    if (difficulty && difficulty !== 'ALL') query.difficulty = difficulty;
    
    const targetStatus = publicationStatus !== 'ALL' ? publicationStatus : status;
    if (targetStatus && targetStatus !== 'ALL') {
      query.publicationStatus = targetStatus;
    }
    if (isActive === 'true') query.isActive = true;
    else if (isActive === 'false') query.isActive = false;

    if (search.trim()) {
      const reg = new RegExp(search.trim(), 'i');
      query.$or = [
        { roundTitle: reg },
        { caseDossierTitle: reg },
        { evidenceCategory: reg },
        { incidentDescription: reg },
        { roundId: reg },
      ];
    }

    const rounds = await CyberCrimeRound.find(query)
      .sort({ roundNumber: 1, createdAt: 1 })
      .lean();

    // Fetch question counts per round
    const roundsWithStats = await Promise.all(
      rounds.map(async (round) => {
        const [totalQuestions, publishedQuestions] = await Promise.all([
          CyberCrimeQuestion.countDocuments({ roundId: round.roundId }),
          CyberCrimeQuestion.countDocuments({
            roundId: round.roundId,
            $or: [{ publicationStatus: 'PUBLISHED' }, { status: 'PUBLISHED' }],
          }),
        ]);

        return {
          id: round._id,
          roundId: round.roundId,
          roundNumber: round.roundNumber,
          roundTitle: round.roundTitle,
          caseDossierTitle: round.caseDossierTitle,
          evidenceCategory: round.evidenceCategory,
          incidentDescription: round.incidentDescription,
          interceptedCommunication: round.interceptedCommunication || '',
          forensicClues: round.forensicClues || '',
          difficulty: round.difficulty || 'Medium',
          publicationStatus: round.publicationStatus || round.status || 'DRAFT',
          status: round.publicationStatus || round.status || 'DRAFT',
          isActive: round.isActive !== false,
          totalQuestions,
          publishedQuestions,
          createdAt: round.createdAt,
          updatedAt: round.updatedAt,
        };
      })
    );

    return res.status(200).json({
      success: true,
      data: {
        rounds: roundsWithStats,
        total: roundsWithStats.length,
      },
    });
  } catch (error) {
    return next(error);
  }
}

/**
 * POST /api/admin/cybercrime/rounds
 * Create a new custom investigation round
 */
export async function createAdminCyberCrimeRound(req, res, next) {
  try {
    const {
      roundNumber,
      roundTitle,
      caseDossierTitle,
      evidenceCategory,
      incidentDescription,
      interceptedCommunication = '',
      forensicClues = '',
      difficulty = 'Medium',
      publicationStatus = 'DRAFT',
      status = 'DRAFT',
      isActive = true,
    } = req.body;

    if (!roundTitle || !roundTitle.trim()) {
      return res.status(400).json({
        success: false,
        message: 'Round title is required.',
      });
    }

    if (!caseDossierTitle || !caseDossierTitle.trim()) {
      return res.status(400).json({
        success: false,
        message: 'Case dossier title is required.',
      });
    }

    if (!evidenceCategory || !evidenceCategory.trim()) {
      return res.status(400).json({
        success: false,
        message: 'Evidence category is required.',
      });
    }

    if (!incidentDescription || !incidentDescription.trim()) {
      return res.status(400).json({
        success: false,
        message: 'Incident description is required.',
      });
    }

    let assignedNumber = roundNumber ? Number(roundNumber) : null;
    if (!assignedNumber) {
      const highestRound = await CyberCrimeRound.findOne().sort({ roundNumber: -1 }).select('roundNumber').lean();
      assignedNumber = (highestRound?.roundNumber || 0) + 1;
    }
    let roundId = `ROUND-${String(assignedNumber).padStart(2, '0')}`;
    let existingRound = await CyberCrimeRound.findOne({ roundId });
    while (existingRound) {
      assignedNumber += 1;
      roundId = `ROUND-${String(assignedNumber).padStart(2, '0')}`;
      existingRound = await CyberCrimeRound.findOne({ roundId });
    }

    const chosenStatus = (publicationStatus || status || 'DRAFT').trim().toUpperCase();

    const newRound = await CyberCrimeRound.create({
      roundId,
      roundNumber: assignedNumber,
      roundTitle: roundTitle.trim(),
      caseDossierTitle: caseDossierTitle.trim(),
      evidenceCategory: evidenceCategory.trim(),
      incidentDescription: incidentDescription.trim(),
      interceptedCommunication: interceptedCommunication.trim(),
      forensicClues: forensicClues.trim(),
      difficulty,
      publicationStatus: chosenStatus,
      status: chosenStatus,
      isActive: isActive === true || isActive === 'true',
      createdBy: req.user._id,
    });

    await recordAdminActivity({
      adminId: req.user._id,
      adminName: req.user.name,
      adminEmail: req.user.email,
      action: 'CYBER_ROUND_CREATED',
      description: `Investigation Round "${newRound.roundTitle}" (${roundId}) created.`,
      targetId: newRound._id,
      targetType: 'CYBER_ROUND',
      details: { roundId, roundTitle: newRound.roundTitle },
      req,
    });

    return res.status(201).json({
      success: true,
      message: 'Investigation round created successfully.',
      data: {
        round: newRound,
      },
    });
  } catch (error) {
    return next(error);
  }
}

/**
 * PUT /api/admin/cybercrime/rounds/:id
 * Edit investigation round details
 */
export async function updateAdminCyberCrimeRound(req, res, next) {
  try {
    const { id } = req.params;
    const {
      roundNumber,
      roundTitle,
      caseDossierTitle,
      evidenceCategory,
      incidentDescription,
      interceptedCommunication,
      forensicClues,
      difficulty,
      publicationStatus,
      status,
      isActive,
    } = req.body;

    const round = await CyberCrimeRound.findById(id);
    if (!round) {
      return res.status(404).json({
        success: false,
        message: 'Investigation round not found.',
      });
    }

    if (roundNumber !== undefined) round.roundNumber = Number(roundNumber);
    if (roundTitle) round.roundTitle = roundTitle.trim();
    if (caseDossierTitle) round.caseDossierTitle = caseDossierTitle.trim();
    if (evidenceCategory) round.evidenceCategory = evidenceCategory.trim();
    if (incidentDescription) round.incidentDescription = incidentDescription.trim();
    if (interceptedCommunication !== undefined) round.interceptedCommunication = interceptedCommunication.trim();
    if (forensicClues !== undefined) round.forensicClues = forensicClues.trim();
    if (difficulty) round.difficulty = difficulty;
    
    const chosenStatus = (publicationStatus || status || '').trim().toUpperCase();
    if (chosenStatus && ['DRAFT', 'PUBLISHED'].includes(chosenStatus)) {
      round.publicationStatus = chosenStatus;
      round.status = chosenStatus;
    }

    if (isActive !== undefined) {
      round.isActive = Boolean(isActive === true || isActive === 'true');
    }

    await round.save();

    await recordAdminActivity({
      adminId: req.user._id,
      adminName: req.user.name,
      adminEmail: req.user.email,
      action: 'CYBER_ROUND_UPDATED',
      description: `Investigation Round "${round.roundTitle}" (${round.roundId}) updated.`,
      targetId: round._id,
      targetType: 'CYBER_ROUND',
      req,
    });

    return res.status(200).json({
      success: true,
      message: 'Investigation round updated successfully.',
      data: {
        round,
      },
    });
  } catch (error) {
    return next(error);
  }
}

/**
 * DELETE /api/admin/cybercrime/rounds/:id
 * Delete round and all its associated questions
 */
export async function deleteAdminCyberCrimeRound(req, res, next) {
  try {
    const { id } = req.params;
    const round = await CyberCrimeRound.findByIdAndDelete(id);

    if (!round) {
      return res.status(404).json({
        success: false,
        message: 'Investigation round not found.',
      });
    }

    // Cascade delete associated questions
    const deletedQuestions = await CyberCrimeQuestion.deleteMany({
      $or: [
        { roundId: round.roundId },
        { roundId: round._id.toString() },
      ],
    });

    // Cascade delete all game attempts associated with this round
    await GameAttempt.deleteMany({
      $or: [
        { imageReference: new RegExp(`_${round.roundId}$`) },
        { imageReference: new RegExp(`_${round._id.toString()}$`) },
        { imageReference: new RegExp(`cyber_round_.*_${round.roundId}`) },
        { imageReference: new RegExp(`cyber_round_.*_${round._id.toString()}`) },
      ],
    });

    // Cascade remove from all users' cyberCrimeRewards
    await User.updateMany(
      {},
      {
        $pull: {
          cyberCrimeRewards: {
            $regex: `cyber_round_.*_(${round.roundId}|${round._id.toString()})`,
          },
        },
      }
    );

    await recordAdminActivity({
      adminId: req.user._id,
      adminName: req.user.name,
      adminEmail: req.user.email,
      action: 'CYBER_ROUND_DELETED',
      description: `Investigation Round "${round.roundTitle}" (${round.roundId}) and ${deletedQuestions.deletedCount} question(s) deleted.`,
      targetId: id,
      targetType: 'CYBER_ROUND',
      req,
    });

    return res.status(200).json({
      success: true,
      message: `Investigation round and ${deletedQuestions.deletedCount} question(s) deleted successfully.`,
    });
  } catch (error) {
    return next(error);
  }
}

/**
 * PATCH /api/admin/cybercrime/rounds/:id/publish
 * Toggle between DRAFT and PUBLISHED status for a round with completeness check
 */
export async function publishAdminCyberCrimeRound(req, res, next) {
  try {
    const { id } = req.params;
    const round = await CyberCrimeRound.findById(id);

    if (!round) {
      return res.status(404).json({
        success: false,
        message: 'Investigation round not found.',
      });
    }

    const currentStatus = round.publicationStatus || round.status || 'DRAFT';
    const nextStatus = currentStatus === 'PUBLISHED' ? 'DRAFT' : 'PUBLISHED';

    // Completeness validation: cannot publish if required fields or questions are missing
    if (nextStatus === 'PUBLISHED') {
      if (!round.roundTitle || !round.caseDossierTitle || !round.evidenceCategory || !round.incidentDescription) {
        return res.status(400).json({
          success: false,
          message: 'Cannot publish round: Required case dossier information is incomplete.',
        });
      }

      const questionCount = await CyberCrimeQuestion.countDocuments({ roundId: round.roundId });
      if (questionCount === 0) {
        return res.status(400).json({
          success: false,
          message: 'Cannot publish round: At least one question must be added to this round before publishing.',
        });
      }
    }

    round.publicationStatus = nextStatus;
    round.status = nextStatus;
    await round.save();

    // When round is published, ensure all its active questions are also PUBLISHED
    if (nextStatus === 'PUBLISHED') {
      await CyberCrimeQuestion.updateMany(
        {
          $or: [
            { roundId: round.roundId },
            { roundId: round._id.toString() },
          ],
        },
        { $set: { publicationStatus: 'PUBLISHED', status: 'PUBLISHED', isActive: true } }
      );
    }

    await recordAdminActivity({
      adminId: req.user._id,
      adminName: req.user.name,
      adminEmail: req.user.email,
      action: nextStatus === 'PUBLISHED' ? 'CYBER_ROUND_PUBLISHED' : 'CYBER_ROUND_UNPUBLISHED',
      description: `Investigation Round "${round.roundTitle}" (${round.roundId}) is now ${nextStatus}.`,
      targetId: round._id,
      targetType: 'CYBER_ROUND',
      details: { publicationStatus: nextStatus },
      req,
    });

    return res.status(200).json({
      success: true,
      message: `Investigation round status changed to ${nextStatus}.`,
      data: {
        round,
      },
    });
  } catch (error) {
    return next(error);
  }
}

/**
 * PATCH /api/admin/cybercrime/rounds/:id/toggle
 * Toggle active state of investigation round
 */
export async function toggleAdminCyberCrimeRound(req, res, next) {
  try {
    const { id } = req.params;
    const round = await CyberCrimeRound.findById(id);

    if (!round) {
      return res.status(404).json({
        success: false,
        message: 'Investigation round not found.',
      });
    }

    round.isActive = !round.isActive;
    await round.save();

    await recordAdminActivity({
      adminId: req.user._id,
      adminName: req.user.name,
      adminEmail: req.user.email,
      action: 'CYBER_ROUND_TOGGLED',
      description: `Investigation Round "${round.roundTitle}" (${round.roundId}) is now ${round.isActive ? 'active' : 'disabled'}.`,
      targetId: round._id,
      targetType: 'CYBER_ROUND',
      details: { isActive: round.isActive },
      req,
    });

    return res.status(200).json({
      success: true,
      message: `Investigation round is now ${round.isActive ? 'active' : 'disabled'}.`,
      data: {
        round,
      },
    });
  } catch (error) {
    return next(error);
  }
}

/**
 * GET /api/admin/cybercrime/rounds/:roundId/questions
 * List all questions belonging to a specific investigation round
 */
export async function getAdminCyberCrimeQuestions(req, res, next) {
  try {
    const { roundId } = req.params;
    const {
      search = '',
      difficulty = 'ALL',
      status = 'ALL',
      publicationStatus = 'ALL',
      isActive = 'ALL',
    } = req.query;

    const query = { roundId };
    if (difficulty && difficulty !== 'ALL') query.difficulty = difficulty;

    const targetStatus = publicationStatus !== 'ALL' ? publicationStatus : status;
    if (targetStatus && targetStatus !== 'ALL') {
      query.publicationStatus = targetStatus;
    }
    if (isActive === 'true') query.isActive = true;
    else if (isActive === 'false') query.isActive = false;

    if (search.trim()) {
      const reg = new RegExp(search.trim(), 'i');
      query.$or = [
        { questionText: reg },
        { explanation: reg },
        { questionId: reg },
      ];
    }

    const questions = await CyberCrimeQuestion.find(query)
      .sort({ questionOrder: 1, createdAt: 1 })
      .lean();

    return res.status(200).json({
      success: true,
      data: {
        questions: questions.map((q) => ({
          id: q._id,
          questionId: q.questionId,
          roundId: q.roundId,
          questionOrder: q.questionOrder,
          questionText: q.questionText,
          options: q.options,
          correctAnswer: q.correctAnswer,
          explanation: q.explanation,
          difficulty: q.difficulty || 'Medium',
          xpReward: q.xpReward || 10,
          publicationStatus: q.publicationStatus || q.status || 'DRAFT',
          status: q.publicationStatus || q.status || 'DRAFT',
          isActive: q.isActive !== false,
          createdAt: q.createdAt,
          updatedAt: q.updatedAt,
        })),
        total: questions.length,
      },
    });
  } catch (error) {
    return next(error);
  }
}

/**
 * POST /api/admin/cybercrime/rounds/:roundId/questions
 * Add a new question to an investigation round
 */
export async function createAdminCyberCrimeQuestion(req, res, next) {
  try {
    const { roundId } = req.params;
    const {
      questionText,
      options,
      optionA,
      optionB,
      optionC,
      optionD,
      correctAnswer,
      explanation,
      difficulty = 'Medium',
      xpReward = 10,
      publicationStatus = 'DRAFT',
      status = 'DRAFT',
      isActive = true,
      questionOrder,
    } = req.body;

    // Verify round exists
    const round = await CyberCrimeRound.findOne({ roundId });
    if (!round) {
      return res.status(404).json({
        success: false,
        message: `Investigation round '${roundId}' does not exist.`,
      });
    }

    if (!questionText || !questionText.trim()) {
      return res.status(400).json({
        success: false,
        message: 'Question text is required.',
      });
    }

    const finalOptions = {
      a: (options?.a || optionA || '').trim(),
      b: (options?.b || optionB || '').trim(),
      c: (options?.c || optionC || '').trim(),
      d: (options?.d || optionD || '').trim(),
    };

    if (!finalOptions.a || !finalOptions.b || !finalOptions.c || !finalOptions.d) {
      return res.status(400).json({
        success: false,
        message: 'All four answer options (A, B, C, D) are required.',
      });
    }

    const normCorrect = String(correctAnswer || '').trim().toUpperCase();
    if (!['A', 'B', 'C', 'D'].includes(normCorrect)) {
      return res.status(400).json({
        success: false,
        message: 'Exactly one correct answer (A, B, C, or D) must be selected.',
      });
    }

    if (!explanation || !explanation.trim()) {
      return res.status(400).json({
        success: false,
        message: 'Educational explanation is required.',
      });
    }

    let nextNum = 1;
    const allQuestions = await CyberCrimeQuestion.find().select('questionId').lean();
    if (allQuestions.length > 0) {
      const maxExisting = allQuestions.reduce((max, q) => {
        const match = q.questionId && q.questionId.match(/\d+$/);
        const n = match ? parseInt(match[0], 10) : 0;
        return n > max ? n : max;
      }, 0);
      nextNum = maxExisting + 1;
    }
    let questionId = `CCQ-${String(nextNum).padStart(3, '0')}`;
    while (await CyberCrimeQuestion.findOne({ questionId })) {
      nextNum += 1;
      questionId = `CCQ-${String(nextNum).padStart(3, '0')}`;
    }

    const roundQCount = await CyberCrimeQuestion.countDocuments({ roundId });
    const assignedOrder = questionOrder ? Number(questionOrder) : roundQCount + 1;
    const defaultStatus = (round.publicationStatus === 'PUBLISHED' || round.status === 'PUBLISHED') ? 'PUBLISHED' : 'DRAFT';
    const chosenStatus = (publicationStatus || status || defaultStatus).trim().toUpperCase();

    const newQuestion = await CyberCrimeQuestion.create({
      questionId,
      roundId,
      questionOrder: assignedOrder,
      questionText: questionText.trim(),
      options: finalOptions,
      correctAnswer: normCorrect,
      explanation: explanation.trim(),
      difficulty,
      xpReward: Number(xpReward) || 10,
      publicationStatus: chosenStatus,
      status: chosenStatus,
      isActive: isActive === true || isActive === 'true',
      createdBy: req.user._id,
    });

    await recordAdminActivity({
      adminId: req.user._id,
      adminName: req.user.name,
      adminEmail: req.user.email,
      action: 'CYBER_QUESTION_CREATED',
      description: `Question "${questionId}" added to Round "${round.roundTitle}".`,
      targetId: newQuestion._id,
      targetType: 'CYBER_QUESTION',
      details: { questionId, roundId, correctAnswer: normCorrect },
      req,
    });

    return res.status(201).json({
      success: true,
      message: 'Investigation question added successfully.',
      data: {
        question: newQuestion,
      },
    });
  } catch (error) {
    return next(error);
  }
}

/**
 * PUT /api/admin/cybercrime/questions/:id
 * Edit question details
 */
export async function updateAdminCyberCrimeQuestion(req, res, next) {
  try {
    const { id } = req.params;
    const {
      questionText,
      options,
      optionA,
      optionB,
      optionC,
      optionD,
      correctAnswer,
      explanation,
      difficulty,
      xpReward,
      publicationStatus,
      status,
      isActive,
      questionOrder,
    } = req.body;

    const question = await CyberCrimeQuestion.findById(id);
    if (!question) {
      return res.status(404).json({
        success: false,
        message: 'Investigation question not found.',
      });
    }

    if (questionText) question.questionText = questionText.trim();
    if (explanation) question.explanation = explanation.trim();
    if (difficulty) question.difficulty = difficulty;
    if (xpReward !== undefined) question.xpReward = Number(xpReward) || 10;
    if (questionOrder !== undefined) question.questionOrder = Number(questionOrder);

    if (correctAnswer) {
      const normCorrect = String(correctAnswer).trim().toUpperCase();
      if (['A', 'B', 'C', 'D'].includes(normCorrect)) {
        question.correctAnswer = normCorrect;
      }
    }

    const updatedOptions = { ...(question.options?.toObject?.() || question.options || {}) };
    if (optionA !== undefined) updatedOptions.a = optionA.trim();
    if (optionB !== undefined) updatedOptions.b = optionB.trim();
    if (optionC !== undefined) updatedOptions.c = optionC.trim();
    if (optionD !== undefined) updatedOptions.d = optionD.trim();
    if (options?.a !== undefined) updatedOptions.a = options.a.trim();
    if (options?.b !== undefined) updatedOptions.b = options.b.trim();
    if (options?.c !== undefined) updatedOptions.c = options.c.trim();
    if (options?.d !== undefined) updatedOptions.d = options.d.trim();
    question.options = updatedOptions;

    const chosenStatus = (publicationStatus || status || '').trim().toUpperCase();
    if (chosenStatus && ['DRAFT', 'PUBLISHED'].includes(chosenStatus)) {
      question.publicationStatus = chosenStatus;
      question.status = chosenStatus;
    }

    if (isActive !== undefined) {
      question.isActive = Boolean(isActive === true || isActive === 'true');
    }

    await question.save();

    await recordAdminActivity({
      adminId: req.user._id,
      adminName: req.user.name,
      adminEmail: req.user.email,
      action: 'CYBER_QUESTION_UPDATED',
      description: `Investigation question "${question.questionId}" updated.`,
      targetId: question._id,
      targetType: 'CYBER_QUESTION',
      req,
    });

    return res.status(200).json({
      success: true,
      message: 'Question updated successfully.',
      data: {
        question,
      },
    });
  } catch (error) {
    return next(error);
  }
}

/**
 * DELETE /api/admin/cybercrime/questions/:id
 * Delete question from round
 */
export async function deleteAdminCyberCrimeQuestion(req, res, next) {
  try {
    const { id } = req.params;
    const question = await CyberCrimeQuestion.findByIdAndDelete(id);

    if (!question) {
      return res.status(404).json({
        success: false,
        message: 'Investigation question not found.',
      });
    }

    await recordAdminActivity({
      adminId: req.user._id,
      adminName: req.user.name,
      adminEmail: req.user.email,
      action: 'CYBER_QUESTION_DELETED',
      description: `Investigation question "${question.questionId}" deleted from Round "${question.roundId}".`,
      targetId: id,
      targetType: 'CYBER_QUESTION',
      req,
    });

    return res.status(200).json({
      success: true,
      message: 'Question deleted successfully.',
    });
  } catch (error) {
    return next(error);
  }
}

/**
 * PATCH /api/admin/cybercrime/questions/:id/publish
 * Toggle between DRAFT and PUBLISHED status for question
 */
export async function publishAdminCyberCrimeQuestion(req, res, next) {
  try {
    const { id } = req.params;
    const question = await CyberCrimeQuestion.findById(id);

    if (!question) {
      return res.status(404).json({
        success: false,
        message: 'Investigation question not found.',
      });
    }

    const currentStatus = question.publicationStatus || question.status || 'DRAFT';
    const nextStatus = currentStatus === 'PUBLISHED' ? 'DRAFT' : 'PUBLISHED';

    question.publicationStatus = nextStatus;
    question.status = nextStatus;
    await question.save();

    await recordAdminActivity({
      adminId: req.user._id,
      adminName: req.user.name,
      adminEmail: req.user.email,
      action: nextStatus === 'PUBLISHED' ? 'CYBER_QUESTION_PUBLISHED' : 'CYBER_QUESTION_UNPUBLISHED',
      description: `Question "${question.questionId}" is now ${nextStatus}.`,
      targetId: question._id,
      targetType: 'CYBER_QUESTION',
      details: { publicationStatus: nextStatus },
      req,
    });

    return res.status(200).json({
      success: true,
      message: `Question status changed to ${nextStatus}.`,
      data: {
        question,
      },
    });
  } catch (error) {
    return next(error);
  }
}

/**
 * PATCH /api/admin/cybercrime/questions/:id/toggle
 * Toggle active state of question
 */
export async function toggleAdminCyberCrimeQuestion(req, res, next) {
  try {
    const { id } = req.params;
    const question = await CyberCrimeQuestion.findById(id);

    if (!question) {
      return res.status(404).json({
        success: false,
        message: 'Investigation question not found.',
      });
    }

    question.isActive = !question.isActive;
    await question.save();

    await recordAdminActivity({
      adminId: req.user._id,
      adminName: req.user.name,
      adminEmail: req.user.email,
      action: 'CYBER_QUESTION_TOGGLED',
      description: `Question "${question.questionId}" is now ${question.isActive ? 'active' : 'disabled'}.`,
      targetId: question._id,
      targetType: 'CYBER_QUESTION',
      details: { isActive: question.isActive },
      req,
    });

    return res.status(200).json({
      success: true,
      message: `Question is now ${question.isActive ? 'active' : 'disabled'}.`,
      data: {
        question,
      },
    });
  } catch (error) {
    return next(error);
  }
}

/**
 * PUT /api/admin/cybercrime/rounds/:roundId/reorder
 * Reorder questions within a round
 */
export async function reorderAdminCyberCrimeQuestions(req, res, next) {
  try {
    const { roundId } = req.params;
    const { questionIds = [] } = req.body;

    if (!Array.isArray(questionIds) || questionIds.length === 0) {
      return res.status(400).json({
        success: false,
        message: 'Array of question IDs is required.',
      });
    }

    await Promise.all(
      questionIds.map((qId, index) =>
        CyberCrimeQuestion.updateOne(
          { _id: qId, roundId },
          { $set: { questionOrder: index + 1 } }
        )
      )
    );

    return res.status(200).json({
      success: true,
      message: 'Questions reordered successfully.',
    });
  } catch (error) {
    return next(error);
  }
}
