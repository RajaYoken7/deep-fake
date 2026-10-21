import jwt from 'jsonwebtoken';
import { User } from '../models/User.js';
import { verifyAccessToken } from '../utils/tokenUtils.js';

/**
 * Middleware to require and authenticate a valid JWT access token.
 */
export async function authenticateToken(req, res, next) {
  const authHeader = req.headers.authorization;
  const token = authHeader && authHeader.startsWith('Bearer ')
    ? authHeader.slice(7).trim()
    : null;

  if (!token) {
    return res.status(401).json({
      success: false,
      message: 'Access token is required. Please log in.',
      code: 'TOKEN_REQUIRED',
    });
  }

  try {
    const decoded = verifyAccessToken(token);

    // Verify user exists and is active in database
    const user = await User.findById(decoded.id);
    if (!user) {
      return res.status(401).json({
        success: false,
        message: 'Account associated with token was not found.',
        code: 'USER_NOT_FOUND',
      });
    }

    if (!user.isActive) {
      return res.status(403).json({
        success: false,
        message: 'Your account has been deactivated. Please contact support.',
        code: 'ACCOUNT_DEACTIVATED',
      });
    }

    req.user = user;
    return next();
  } catch (error) {
    if (error instanceof jwt.TokenExpiredError) {
      return res.status(401).json({
        success: false,
        message: 'Access token has expired. Please refresh your session.',
        code: 'TOKEN_EXPIRED',
      });
    }

    return res.status(401).json({
      success: false,
      message: 'Invalid access token provided.',
      code: 'TOKEN_INVALID',
    });
  }
}

/**
 * Optional authentication: attaches user if valid token present, but does not block if absent.
 */
export async function optionalAuthenticateToken(req, res, next) {
  const authHeader = req.headers.authorization;
  const token = authHeader && authHeader.startsWith('Bearer ')
    ? authHeader.slice(7).trim()
    : null;

  if (!token) {
    req.user = null;
    return next();
  }

  try {
    const decoded = verifyAccessToken(token);
    const user = await User.findById(decoded.id);
    req.user = user && user.isActive ? user : null;
  } catch {
    req.user = null;
  }

  return next();
}

export default authenticateToken;
