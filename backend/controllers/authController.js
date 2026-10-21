import {
  registerUser,
  loginUser,
  refreshUserSession,
  logoutUser,
  logoutAllSessions,
  getUserSessions,
  revokeSessionById,
  revokeOtherSessions,
  AuthError,
} from '../services/authService.js';
import {
  getRefreshTokenCookieOptions,
  getClearCookieOptions,
} from '../utils/tokenUtils.js';

/**
 * Extracts client metadata for security logging and session attribution.
 */
function getClientMeta(req) {
  return {
    userAgent: req.headers['user-agent'] || '',
    ipAddress:
      req.headers['x-forwarded-for'] ||
      req.socket?.remoteAddress ||
      req.ip ||
      '',
  };
}

/**
 * POST /api/auth/register
 */
export async function register(req, res, next) {
  try {
    const { name, email, password } = req.body;
    const { userAgent, ipAddress } = getClientMeta(req);

    const result = await registerUser({
      name,
      email,
      password,
      userAgent,
      ipAddress,
    });

    // Set secure HTTP-only refresh token cookie
    res.cookie('refreshToken', result.refreshToken, getRefreshTokenCookieOptions());

    return res.status(201).json({
      success: true,
      message: 'Account successfully created.',
      data: {
        user: result.user,
        accessToken: result.accessToken,
      },
    });
  } catch (error) {
    if (error instanceof AuthError) {
      return res.status(error.statusCode).json({
        success: false,
        message: error.message,
        code: error.code,
      });
    }
    return next(error);
  }
}

/**
 * POST /api/auth/login
 */
export async function login(req, res, next) {
  try {
    const { email, password } = req.body;
    const { userAgent, ipAddress } = getClientMeta(req);

    const result = await loginUser({
      email,
      password,
      userAgent,
      ipAddress,
    });

    // Set secure HTTP-only refresh token cookie
    res.cookie('refreshToken', result.refreshToken, getRefreshTokenCookieOptions());

    return res.status(200).json({
      success: true,
      message: 'Login successful.',
      data: {
        user: result.user,
        accessToken: result.accessToken,
      },
    });
  } catch (error) {
    if (error instanceof AuthError) {
      return res.status(error.statusCode).json({
        success: false,
        message: error.message,
        code: error.code,
      });
    }
    return next(error);
  }
}

/**
 * GET /api/auth/me
 * Protected by authenticateToken
 */
export async function getCurrentUser(req, res) {
  return res.status(200).json({
    success: true,
    data: {
      user: req.user.toSafeObject(),
    },
  });
}

/**
 * POST /api/auth/refresh
 */
export async function refresh(req, res, next) {
  try {
    const rawRefreshToken = req.cookies?.refreshToken;
    const { userAgent, ipAddress } = getClientMeta(req);

    if (!rawRefreshToken) {
      return res.status(401).json({
        success: false,
        message: 'No refresh token provided. Please log in.',
        code: 'NO_REFRESH_TOKEN',
      });
    }

    const result = await refreshUserSession({
      rawRefreshToken,
      userAgent,
      ipAddress,
    });

    // Set rotated refresh token cookie
    res.cookie('refreshToken', result.refreshToken, getRefreshTokenCookieOptions());

    return res.status(200).json({
      success: true,
      message: 'Session refreshed successfully.',
      data: {
        user: result.user,
        accessToken: result.accessToken,
      },
    });
  } catch (error) {
    // If refresh token reuse or invalid, ensure cookie is cleared
    res.clearCookie('refreshToken', getClearCookieOptions());

    if (error instanceof AuthError) {
      return res.status(error.statusCode).json({
        success: false,
        message: error.message,
        code: error.code,
      });
    }
    return next(error);
  }
}

/**
 * POST /api/auth/logout
 */
export async function logout(req, res, next) {
  try {
    const rawRefreshToken = req.cookies?.refreshToken;

    if (rawRefreshToken) {
      await logoutUser({ rawRefreshToken });
    }

    res.clearCookie('refreshToken', getClearCookieOptions());

    return res.status(200).json({
      success: true,
      message: 'Logged out successfully.',
    });
  } catch (error) {
    res.clearCookie('refreshToken', getClearCookieOptions());
    return next(error);
  }
}

/**
 * POST /api/auth/logout-all
 * Protected by authenticateToken
 */
export async function logoutAll(req, res, next) {
  try {
    await logoutAllSessions(req.user._id);
    res.clearCookie('refreshToken', getClearCookieOptions());

    return res.status(200).json({
      success: true,
      message: 'All sessions successfully terminated.',
    });
  } catch (error) {
    return next(error);
  }
}

/**
 * GET /api/auth/sessions
 * Returns user's active sessions with client metadata
 */
export async function getActiveSessions(req, res, next) {
  try {
    const rawRefreshToken = req.cookies?.refreshToken;
    const sessions = await getUserSessions(req.user._id, rawRefreshToken);

    return res.status(200).json({
      success: true,
      data: {
        sessions,
      },
    });
  } catch (error) {
    return next(error);
  }
}

/**
 * DELETE /api/auth/sessions/:id
 * Revokes an individual session
 */
export async function revokeSession(req, res, next) {
  try {
    const { id } = req.params;
    const success = await revokeSessionById(req.user._id, id);

    if (!success) {
      return res.status(404).json({
        success: false,
        message: 'Session not found or already revoked.',
      });
    }

    return res.status(200).json({
      success: true,
      message: 'Session successfully revoked.',
    });
  } catch (error) {
    return next(error);
  }
}

/**
 * POST /api/auth/logout-other-sessions
 * Logs out all other devices while preserving the current active session
 */
export async function logoutOtherSessions(req, res, next) {
  try {
    const rawRefreshToken = req.cookies?.refreshToken;
    if (!rawRefreshToken) {
      return res.status(400).json({
        success: false,
        message: 'Current session refresh token not identified.',
      });
    }

    const revokedCount = await revokeOtherSessions(req.user._id, rawRefreshToken);

    return res.status(200).json({
      success: true,
      message: `Successfully terminated ${revokedCount} other session(s).`,
      data: {
        revokedCount,
      },
    });
  } catch (error) {
    return next(error);
  }
}

