import { Router, Request, Response } from 'express';
import { getChallenge, decrementRetries, markSolved, deleteChallenge } from '../services/challengeStore';
import { getRecipeById, validateGrid } from '../services/recipeStore';
import { isValidSecret } from '../services/siteKeyStore';
import { generateToken } from '../services/tokenService';
import { verifyRateLimiter } from '../middleware/rateLimiter';
import { Grid } from '../../shared/types';

const router = Router();

router.post('/', verifyRateLimiter, (req: Request, res: Response) => {
  const { challengeId, grid, secret } = req.body;

  // Validate required fields
  if (!challengeId || !grid || !secret) {
    return res.status(400).json({
      success: false,
      error: 'missing_fields',
    });
  }

  // Validate secret
  if (!isValidSecret(secret)) {
    return res.status(403).json({
      success: false,
      error: 'invalid_secret',
    });
  }

  // Validate grid format (must be a 3x3 array)
  if (!isValidGrid(grid)) {
    return res.status(400).json({
      success: false,
      error: 'invalid_grid_format',
    });
  }

  // Look up the challenge
  const challenge = getChallenge(challengeId);
  if (!challenge) {
    return res.status(404).json({
      success: false,
      error: 'challenge_not_found',
    });
  }

  // Check if already solved
  if (challenge.solved) {
    return res.status(410).json({
      success: false,
      error: 'challenge_not_found',
    });
  }

  // Check expiration
  if (new Date() > challenge.expiresAt) {
    deleteChallenge(challengeId);
    return res.status(410).json({
      success: false,
      error: 'challenge_expired',
    });
  }

  // Look up the recipe
  const recipe = getRecipeById(challenge.recipeId);
  if (!recipe) {
    return res.status(500).json({
      success: false,
      error: 'internal_error',
    });
  }

  // Validate the grid against the recipe
  const isCorrect = validateGrid(recipe, grid as Grid);

  if (isCorrect) {
    markSolved(challengeId);
    const solvedAt = new Date();
    const token = generateToken(challengeId, solvedAt, secret);

    // Set verification cookie
    res.cookie('mc_captcha_verified', token, {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'strict',
      maxAge: 300_000, // 5 minutes
    });

    return res.json({
      success: true,
      token,
    });
  }

  // Incorrect — decrement retries
  const retriesRemaining = decrementRetries(challengeId);

  return res.json({
    success: false,
    error: 'incorrect_recipe',
    retriesRemaining,
  });
});

/**
 * Validate that grid is a 3x3 array with string or null entries.
 */
function isValidGrid(grid: unknown): grid is Grid {
  if (!Array.isArray(grid) || grid.length !== 3) return false;
  for (const row of grid) {
    if (!Array.isArray(row) || row.length !== 3) return false;
    for (const cell of row) {
      if (cell !== null && typeof cell !== 'string') return false;
    }
  }
  return true;
}

export default router;
