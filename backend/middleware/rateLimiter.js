/**
 * Lightweight in-memory sliding-window rate limiter
 * Protects verification endpoints from abusive batch submissions.
 */

const ipRequestMap = new Map();

export function rateLimiter({ windowMs = 15 * 60 * 1000, maxRequests = 60 } = {}) {
  // Periodically purge stale IP entries every 10 minutes
  setInterval(() => {
    const now = Date.now();
    for (const [ip, record] of ipRequestMap.entries()) {
      if (now - record.startTime > windowMs) {
        ipRequestMap.delete(ip);
      }
    }
  }, 10 * 60 * 1000).unref();

  return (req, res, next) => {
    const ip = req.ip || req.socket?.remoteAddress || 'unknown-ip';
    const now = Date.now();

    if (!ipRequestMap.has(ip)) {
      ipRequestMap.set(ip, { count: 1, startTime: now });
      return next();
    }

    const record = ipRequestMap.get(ip);

    if (now - record.startTime < windowMs) {
      if (record.count >= maxRequests) {
        return res.status(429).json({
          success: false,
          error: 'Too many verification requests from this IP. Please wait a few minutes before trying again.',
          errorCode: 'RATE_LIMIT_EXCEEDED'
        });
      }
      record.count += 1;
      return next();
    }

    // Reset window
    record.count = 1;
    record.startTime = now;
    return next();
  };
}

export default rateLimiter;
