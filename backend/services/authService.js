import { User } from '../models/User.js';
import { RefreshToken } from '../models/RefreshToken.js';
import {
  generateAccessToken,
  generateRefreshToken,
  hashToken,
  getRefreshTokenExpiryDate,
} from '../utils/tokenUtils.js';

export class AuthError extends Error {
  constructor(message, statusCode = 400, code = 'AUTH_ERROR') {
    super(message);
    this.name = 'AuthError';
    this.statusCode = statusCode;
    this.code = code;
  }
}

/**
 * Register a new user account.
 * Role is strictly locked to USER to prevent privilege escalation.
 */
export async function registerUser({ name, email, password, userAgent = '', ipAddress = '' }) {
  if (!name || typeof name !== 'string' || name.trim().length < 2) {
    throw new AuthError('Full name must be at least 2 characters long.', 400, 'INVALID_NAME');
  }

  if (!email || typeof email !== 'string' || !/^\S+@\S+\.\S+$/.test(email.trim())) {
    throw new AuthError('Please provide a valid email address.', 400, 'INVALID_EMAIL');
  }

  if (!password || typeof password !== 'string' || password.length < 8) {
    throw new AuthError('Password must be at least 8 characters long.', 400, 'WEAK_PASSWORD');
  }

  const normalizedEmail = email.trim().toLowerCase();

  // Check existing user
  const existingUser = await User.findOne({ email: normalizedEmail });
  if (existingUser) {
    throw new AuthError('An account with this email address already exists.', 409, 'EMAIL_EXISTS');
  }

  // Create user
  const user = new User({
    name: name.trim(),
    email: normalizedEmail,
    password,
    role: 'USER', // Enforce default USER role
  });

  await user.save();

  // Issue access and refresh tokens
  const accessToken = generateAccessToken(user);
  const rawRefreshToken = generateRefreshToken();
  const tokenHash = hashToken(rawRefreshToken);
  const expiresAt = getRefreshTokenExpiryDate();

  await RefreshToken.create({
    tokenHash,
    userId: user._id,
    expiresAt,
    userAgent,
    ipAddress,
  });

  return {
    user: user.toSafeObject(),
    accessToken,
    refreshToken: rawRefreshToken,
  };
}

/**
 * Authenticate existing user with email and password.
 */
export async function loginUser({ email, password, userAgent = '', ipAddress = '' }) {
  if (!email || !password) {
    throw new AuthError('Email and password are required.', 400, 'MISSING_CREDENTIALS');
  }

  const normalizedEmail = email.trim().toLowerCase();

  // Query user with password included
  const user = await User.findOne({ email: normalizedEmail }).select('+password');
  if (!user) {
    throw new AuthError('Invalid email or password.', 401, 'INVALID_CREDENTIALS');
  }

  if (!user.isActive) {
    throw new AuthError('This account has been deactivated. Contact an administrator.', 403, 'ACCOUNT_DISABLED');
  }

  const isMatch = await user.comparePassword(password);
  if (!isMatch) {
    throw new AuthError('Invalid email or password.', 401, 'INVALID_CREDENTIALS');
  }

  // Update last login timestamp
  user.lastLogin = new Date();
  await user.save();

  // Issue tokens
  const accessToken = generateAccessToken(user);
  const rawRefreshToken = generateRefreshToken();
  const tokenHash = hashToken(rawRefreshToken);
  const expiresAt = getRefreshTokenExpiryDate();

  await RefreshToken.create({
    tokenHash,
    userId: user._id,
    expiresAt,
    userAgent,
    ipAddress,
  });

  return {
    user: user.toSafeObject(),
    accessToken,
    refreshToken: rawRefreshToken,
  };
}

/**
 * Rotate Refresh Token and return a fresh access token.
 * Includes automatic token reuse detection for security.
 */
export async function refreshUserSession({ rawRefreshToken, userAgent = '', ipAddress = '' }) {
  if (!rawRefreshToken) {
    throw new AuthError('Refresh token is required.', 401, 'MISSING_REFRESH_TOKEN');
  }

  const tokenHash = hashToken(rawRefreshToken);
  const tokenDoc = await RefreshToken.findOne({ tokenHash });

  if (!tokenDoc) {
    throw new AuthError('Session invalid or expired. Please sign in again.', 401, 'INVALID_SESSION');
  }

  // Token reuse detection: if the token was already revoked, someone is replaying it!
  if (tokenDoc.revoked) {
    // Invalidate ALL sessions for this user to mitigate compromise
    await RefreshToken.updateMany(
      { userId: tokenDoc.userId },
      { revoked: true, revokedAt: new Date() }
    );
    throw new AuthError(
      'Security alert: Session replay detected. All sessions for this account have been terminated.',
      403,
      'TOKEN_REUSE_DETECTED'
    );
  }

  // Check expiration
  if (tokenDoc.expiresAt < new Date()) {
    tokenDoc.revoked = true;
    tokenDoc.revokedAt = new Date();
    await tokenDoc.save();
    throw new AuthError('Session has expired. Please sign in again.', 401, 'SESSION_EXPIRED');
  }

  // Find user
  const user = await User.findById(tokenDoc.userId);
  if (!user || !user.isActive) {
    throw new AuthError('Account not found or inactive.', 401, 'ACCOUNT_UNAVAILABLE');
  }

  // Rotate token: invalidate the old token and generate a new one
  const newRawRefreshToken = generateRefreshToken();
  const newHashedToken = hashToken(newRawRefreshToken);
  const newExpiresAt = getRefreshTokenExpiryDate();

  tokenDoc.revoked = true;
  tokenDoc.revokedAt = new Date();
  tokenDoc.replacedByTokenHash = newHashedToken;
  await tokenDoc.save();

  await RefreshToken.create({
    tokenHash: newHashedToken,
    userId: user._id,
    expiresAt: newExpiresAt,
    userAgent,
    ipAddress,
  });

  const accessToken = generateAccessToken(user);

  return {
    user: user.toSafeObject(),
    accessToken,
    refreshToken: newRawRefreshToken,
  };
}

/**
 * Invalidate a single refresh token session.
 */
export async function logoutUser({ rawRefreshToken }) {
  if (!rawRefreshToken) return;

  const tokenHash = hashToken(rawRefreshToken);
  await RefreshToken.findOneAndUpdate(
    { tokenHash },
    { revoked: true, revokedAt: new Date() }
  );
}

/**
 * Invalidate all active sessions for a given user.
 */
export async function logoutAllSessions(userId) {
  if (!userId) return;

  await RefreshToken.updateMany(
    { userId, revoked: false },
    { revoked: true, revokedAt: new Date() }
  );
}

export default {
  registerUser,
  loginUser,
  refreshUserSession,
  logoutUser,
  logoutAllSessions,
};
