import { User } from '../models/User.js';
import { DetectionHistory } from '../models/DetectionHistory.js';
import { IdentityReport } from '../models/IdentityReport.js';
import { logoutAllSessions } from '../services/authService.js';
import { getClearCookieOptions } from '../utils/tokenUtils.js';

/**
 * PUT /api/users/profile
 * Updates user profile information
 */
export async function updateProfile(req, res, next) {
  try {
    const { name, bio, profilePicture, email } = req.body;
    const user = req.user;

    if (name !== undefined) {
      if (typeof name !== 'string' || name.trim().length < 2) {
        return res.status(400).json({
          success: false,
          message: 'Name must be at least 2 characters long.',
        });
      }
      user.name = name.trim();
    }

    if (bio !== undefined) {
      if (typeof bio !== 'string') {
        return res.status(400).json({
          success: false,
          message: 'Bio must be text.',
        });
      }
      user.bio = bio.trim().slice(0, 300);
    }

    if (profilePicture !== undefined) {
      user.profilePicture = typeof profilePicture === 'string' ? profilePicture : '';
    }

    if (email !== undefined && email.trim().toLowerCase() !== user.email) {
      const normalizedEmail = email.trim().toLowerCase();
      if (!/^\S+@\S+\.\S+$/.test(normalizedEmail)) {
        return res.status(400).json({
          success: false,
          message: 'Please provide a valid email address.',
        });
      }

      const existing = await User.findOne({
        email: normalizedEmail,
        _id: { $ne: user._id },
      });

      if (existing) {
        return res.status(409).json({
          success: false,
          message: 'An account with this email address already exists.',
        });
      }

      user.email = normalizedEmail;
    }

    await user.save();

    return res.status(200).json({
      success: true,
      message: 'Profile updated successfully.',
      data: {
        user: user.toSafeObject(),
      },
    });
  } catch (error) {
    return next(error);
  }
}

/**
 * PUT /api/users/change-password
 * Verifies current password, sets new password, and invalidates active sessions
 */
export async function changePassword(req, res, next) {
  try {
    const { currentPassword, newPassword } = req.body;

    if (!currentPassword || !newPassword) {
      return res.status(400).json({
        success: false,
        message: 'Both current password and new password are required.',
      });
    }

    if (typeof newPassword !== 'string' || newPassword.length < 8) {
      return res.status(400).json({
        success: false,
        message: 'New password must be at least 8 characters long.',
      });
    }

    // Query user with password included
    const user = await User.findById(req.user._id).select('+password');
    if (!user) {
      return res.status(404).json({
        success: false,
        message: 'User not found.',
      });
    }

    const isMatch = await user.comparePassword(currentPassword);
    if (!isMatch) {
      return res.status(400).json({
        success: false,
        message: 'Current password does not match our records.',
      });
    }

    // Assign new password (pre-save hook will hash it)
    user.password = newPassword;
    await user.save();

    // Invalidate all active sessions across devices
    await logoutAllSessions(user._id);
    res.clearCookie('refreshToken', getClearCookieOptions());

    return res.status(200).json({
      success: true,
      message: 'Password successfully changed. Please log in again with your new password.',
    });
  } catch (error) {
    return next(error);
  }
}

/**
 * GET /api/users/history
 * Returns user's own detection history and identity reports
 */
export async function getUserHistory(req, res, next) {
  try {
    const userId = req.user._id;

    const [detections, identityReports] = await Promise.all([
      DetectionHistory.find({ userId }).sort({ createdAt: -1 }).limit(50).lean(),
      IdentityReport.find({ userId }).sort({ createdAt: -1 }).limit(50).lean(),
    ]);

    return res.status(200).json({
      success: true,
      data: {
        detections: detections.map((d) => ({
          id: d._id,
          fileName: d.fileName,
          classification: d.classification,
          score: d.score,
          threshold: d.threshold,
          createdAt: d.createdAt,
        })),
        identityReports: identityReports.map((r) => ({
          reportId: r.reportId,
          verificationType: r.verificationType,
          status: r.status,
          decision: r.faceComparison?.decision,
          similarityScore: r.faceComparison?.similarityScore,
          createdAt: r.createdAt,
        })),
      },
    });
  } catch (error) {
    return next(error);
  }
}

/**
 * GET /api/users/stats
 * Returns summary counts for the user profile
 */
export async function getUserStats(req, res, next) {
  try {
    const userId = req.user._id;

    const [detectionCount, identityCount, userDoc] = await Promise.all([
      DetectionHistory.countDocuments({ userId }),
      IdentityReport.countDocuments({ userId }),
      User.findById(userId).select('gamesPlayed totalXP currentLevel currentRank').lean(),
    ]);

    return res.status(200).json({
      success: true,
      data: {
        detections: detectionCount,
        identityChecks: identityCount,
        missions: 0,
        games: userDoc?.gamesPlayed || 0,
        totalXP: userDoc?.totalXP || 0,
        currentLevel: userDoc?.currentLevel || 1,
        currentRank: userDoc?.currentRank || 'Bronze Detective',
      },
    });
  } catch (error) {
    return next(error);
  }
}
