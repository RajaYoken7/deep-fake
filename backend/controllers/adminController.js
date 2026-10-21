import { User } from '../models/User.js';
import { DetectionHistory } from '../models/DetectionHistory.js';
import { IdentityReport } from '../models/IdentityReport.js';

/**
 * GET /api/admin/overview
 * Platform statistics for Admin Dashboard
 */
export async function getAdminOverview(req, res, next) {
  try {
    const [totalUsers, activeUsers, totalDetections, totalIdentityReports, recentUsers] =
      await Promise.all([
        User.countDocuments(),
        User.countDocuments({ isActive: true }),
        DetectionHistory.countDocuments(),
        IdentityReport.countDocuments(),
        User.find().sort({ createdAt: -1 }).limit(5).select('-password').lean(),
      ]);

    return res.status(200).json({
      success: true,
      data: {
        stats: {
          totalUsers,
          activeUsers,
          totalDetections,
          totalIdentityReports,
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
      },
    });
  } catch (error) {
    return next(error);
  }
}

/**
 * GET /api/admin/users
 * Returns list of registered users
 */
export async function getAdminUsers(req, res, next) {
  try {
    const users = await User.find()
      .sort({ createdAt: -1 })
      .select('-password')
      .lean();

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
          createdAt: u.createdAt,
          lastLogin: u.lastLogin,
        })),
      },
    });
  } catch (error) {
    return next(error);
  }
}

/**
 * PATCH /api/admin/users/:id/status
 * Toggle active/inactive status for a user
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

    // Prevent admin from deactivating themselves
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
 * GET /api/admin/reports
 * Returns recent platform reports
 */
export async function getAdminReports(req, res, next) {
  try {
    const [detections, identityReports] = await Promise.all([
      DetectionHistory.find()
        .populate('userId', 'name email')
        .sort({ createdAt: -1 })
        .limit(20)
        .lean(),
      IdentityReport.find()
        .populate('userId', 'name email')
        .sort({ createdAt: -1 })
        .limit(20)
        .lean(),
    ]);

    return res.status(200).json({
      success: true,
      data: {
        detections,
        identityReports,
      },
    });
  } catch (error) {
    return next(error);
  }
}
