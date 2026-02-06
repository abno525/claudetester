import { Router, Request, Response } from 'express';
import { getRandomRecipe, buildMaterialsList, getItemLabel } from '../services/recipeStore';
import { createChallenge } from '../services/challengeStore';
import { isValidSiteKey } from '../services/siteKeyStore';
import { challengeRateLimiter } from '../middleware/rateLimiter';
import { Difficulty, ChallengeResponse } from '../../shared/types';

const router = Router();

const VALID_DIFFICULTIES: Difficulty[] = ['easy', 'medium', 'hard'];

router.post('/', challengeRateLimiter, (req: Request, res: Response) => {
  const { siteKey, difficulty } = req.body;

  // Validate site key
  if (!siteKey || !isValidSiteKey(siteKey)) {
    return res.status(400).json({
      success: false,
      error: 'invalid_site_key',
    });
  }

  // Validate difficulty
  const diff: Difficulty = VALID_DIFFICULTIES.includes(difficulty) ? difficulty : 'medium';

  // Select a random recipe
  const recipe = getRandomRecipe(diff);

  // Build materials list with decoys
  const materials = buildMaterialsList(recipe, diff);

  // Get TTL from env or default 300s
  const ttlSeconds = parseInt(process.env.CHALLENGE_TTL_SECONDS || '300', 10);
  const maxRetries = parseInt(process.env.MAX_RETRIES || '3', 10);

  // Create and store the challenge
  const challenge = createChallenge(
    recipe.id,
    recipe.output,
    recipe.label,
    materials,
    ttlSeconds,
    maxRetries
  );

  const response: ChallengeResponse = {
    challengeId: challenge.challengeId,
    targetItem: challenge.targetItem,
    targetItemLabel: challenge.targetItemLabel,
    materials: challenge.materials,
    gridSize: challenge.gridSize,
    expiresAt: challenge.expiresAt.toISOString(),
  };

  return res.json(response);
});

export default router;
