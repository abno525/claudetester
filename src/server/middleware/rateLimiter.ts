import rateLimit from 'express-rate-limit';

/**
 * Rate limiter for POST /api/challenge: 10 requests per minute per IP.
 */
export const challengeRateLimiter = rateLimit({
  windowMs: 60_000,
  max: 10,
  standardHeaders: true,
  legacyHeaders: false,
  keyGenerator: (req) => req.ip || 'unknown',
  handler: (_req, res) => {
    res.status(429).json({
      success: false,
      error: 'rate_limited',
    });
  },
});

/**
 * Rate limiter for POST /api/verify: 5 requests per minute per challenge.
 * Uses challengeId from the request body as the key.
 */
export const verifyRateLimiter = rateLimit({
  windowMs: 60_000,
  max: 5,
  standardHeaders: true,
  legacyHeaders: false,
  keyGenerator: (req) => req.body?.challengeId || req.ip || 'unknown',
  handler: (_req, res) => {
    res.status(429).json({
      success: false,
      error: 'rate_limited',
    });
  },
});

/**
 * Rate limiter for POST /api/validate-token: 30 requests per minute per secret.
 * Uses a hash of the secret as the key.
 */
export const validateTokenRateLimiter = rateLimit({
  windowMs: 60_000,
  max: 30,
  standardHeaders: true,
  legacyHeaders: false,
  keyGenerator: (req) => req.body?.secret || req.ip || 'unknown',
  handler: (_req, res) => {
    res.status(429).json({
      valid: false,
      reason: 'rate_limited',
    });
  },
});
