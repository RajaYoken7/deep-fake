import jwt from 'jsonwebtoken';
import crypto from 'crypto';

/**
 * Parses time strings like '15m', '7d', '24h', '3600s' into milliseconds.
 */
export function parseDurationToMs(duration) {
  if (typeof duration === 'number') return duration;
  if (!duration || typeof duration !== 'string') return 15 * 60 * 1000;

  const match = duration.match(/^(\d+)([smhd])$/);
  if (!match) return 15 * 60 * 1000;

  const value = parseInt(match[1], 10);
  const unit = match[2];

  switch (unit) {
    case 's':
      return value * 1000;
    case 'm':
      return value * 60 * 1000;
    case 'h':
      return value * 60 * 60 * 1000;
    case 'd':
      return value * 24 * 60 * 60 * 1000;
    default:
      return 15 * 60 * 1000;
  }
}

/**
 * Get secret keys with production validation.
 * Fails safely with a descriptive fatal error in production if secrets are missing or placeholders.
 */
export function getAccessSecret() {
  const secret = process.env.JWT_ACCESS_SECRET || process.env.JWT_SECRET;
  const isProd = process.env.NODE_ENV === 'production';

  if (!secret || secret.includes('replace_with')) {
    if (isProd) {
      throw new Error(
        'FATAL: JWT_ACCESS_SECRET or JWT_SECRET is not configured for production in environment variables.',
      );
    }
    return 'fallback_deeptrust_access_secret_development_only';
  }

  return secret;
}

export function getRefreshSecret() {
  const secret = process.env.JWT_REFRESH_SECRET || process.env.JWT_SECRET;
  const isProd = process.env.NODE_ENV === 'production';

  if (!secret || secret.includes('replace_with')) {
    if (isProd) {
      throw new Error(
        'FATAL: JWT_REFRESH_SECRET or JWT_SECRET is not configured for production in environment variables.',
      );
    }
    return 'fallback_deeptrust_refresh_secret_development_only';
  }

  return secret;
}

/**
 * Generate a short-lived JWT Access Token
 */
export function generateAccessToken(user) {
  const payload = {
    id: user._id ? user._id.toString() : user.id,
    email: user.email,
    role: user.role || 'USER',
    name: user.name,
  };

  const secret = getAccessSecret();
  const expiresIn = process.env.JWT_ACCESS_EXPIRES_IN || '15m';

  return jwt.sign(payload, secret, { expiresIn });
}

/**
 * Generate a cryptographically secure Refresh Token string
 */
export function generateRefreshToken() {
  return crypto.randomBytes(48).toString('hex');
}

/**
 * Hashes a token using SHA-256 for secure DB persistence.
 */
export function hashToken(token) {
  if (!token) return '';
  return crypto.createHash('sha256').update(token).digest('hex');
}

/**
 * Verify JWT Access Token
 */
export function verifyAccessToken(token) {
  const secret = getAccessSecret();
  return jwt.verify(token, secret);
}

/**
 * Get cookie options for storing Refresh Token in an HTTP-only cookie.
 * In production or cross-site environments (Vercel -> Render), SameSite=None requires Secure=true.
 */
export function getRefreshTokenCookieOptions() {
  const isProd = process.env.NODE_ENV === 'production';
  const secureEnv = process.env.COOKIE_SECURE;
  const sameSiteEnv = process.env.COOKIE_SAME_SITE;

  // Determine SameSite setting: default to 'none' in production (cross-site), 'lax' in development
  const sameSite = sameSiteEnv ? sameSiteEnv.toLowerCase() : isProd ? 'none' : 'lax';

  // Browsers reject cookies if sameSite=none and secure=false; force secure=true if sameSite is 'none'
  const isSecure =
    sameSite === 'none'
      ? true
      : secureEnv !== undefined
      ? secureEnv === 'true'
      : isProd;

  const refreshExpiresIn = process.env.JWT_REFRESH_EXPIRES_IN || '7d';
  const maxAge = parseDurationToMs(refreshExpiresIn);

  return {
    httpOnly: true,
    secure: isSecure,
    sameSite: sameSite,
    maxAge: maxAge,
    path: '/',
  };
}

export function getClearCookieOptions() {
  const { maxAge, ...clearOptions } = getRefreshTokenCookieOptions();
  return clearOptions;
}

/**
 * Calculates Date when a refresh token expires
 */
export function getRefreshTokenExpiryDate() {
  const refreshExpiresIn = process.env.JWT_REFRESH_EXPIRES_IN || '7d';
  const ms = parseDurationToMs(refreshExpiresIn);
  return new Date(Date.now() + ms);
}
