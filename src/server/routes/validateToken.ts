import { Router, Request, Response } from 'express';
import { isValidSecret } from '../services/siteKeyStore';
import { validateToken } from '../services/tokenService';
import { validateTokenRateLimiter } from '../middleware/rateLimiter';

const router = Router();

router.post('/', validateTokenRateLimiter, (req: Request, res: Response) => {
  const { token, secret } = req.body;

  // Validate required fields
  if (!token || !secret) {
    return res.status(400).json({
      valid: false,
      reason: 'missing_fields',
    });
  }

  // Validate secret
  if (!isValidSecret(secret)) {
    return res.status(403).json({
      valid: false,
      reason: 'invalid_secret',
    });
  }

  // Validate the token
  const result = validateToken(token, secret);

  if (result.valid) {
    return res.json({
      valid: true,
      challengeId: result.payload.challengeId,
      solvedAt: result.payload.solvedAt,
    });
  }

  return res.json({
    valid: false,
    reason: result.reason,
  });
});

export default router;
