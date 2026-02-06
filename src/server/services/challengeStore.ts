import { Challenge, MaterialInfo } from '../../shared/types';
import { v4 as uuidv4 } from 'uuid';

const challenges = new Map<string, Challenge>();

// Clean up expired challenges every 60 seconds
setInterval(() => {
  const now = new Date();
  for (const [id, challenge] of challenges) {
    if (challenge.expiresAt < now) {
      challenges.delete(id);
    }
  }
}, 60_000);

/**
 * Create a new challenge and store it.
 */
export function createChallenge(
  recipeId: string,
  targetItem: string,
  targetItemLabel: string,
  materials: MaterialInfo[],
  ttlSeconds: number,
  maxRetries: number
): Challenge {
  const challengeId = `ch_${uuidv4().replace(/-/g, '').slice(0, 12)}`;
  const expiresAt = new Date(Date.now() + ttlSeconds * 1000);

  const challenge: Challenge = {
    challengeId,
    recipeId,
    targetItem,
    targetItemLabel,
    materials,
    gridSize: 3,
    expiresAt,
    retriesRemaining: maxRetries,
    solved: false,
  };

  challenges.set(challengeId, challenge);
  return challenge;
}

/**
 * Retrieve a challenge by ID.
 */
export function getChallenge(challengeId: string): Challenge | undefined {
  return challenges.get(challengeId);
}

/**
 * Decrement retries remaining. Returns updated count.
 */
export function decrementRetries(challengeId: string): number {
  const challenge = challenges.get(challengeId);
  if (!challenge) return 0;
  challenge.retriesRemaining = Math.max(0, challenge.retriesRemaining - 1);
  if (challenge.retriesRemaining === 0) {
    challenges.delete(challengeId);
  }
  return challenge.retriesRemaining;
}

/**
 * Mark a challenge as solved.
 */
export function markSolved(challengeId: string): void {
  const challenge = challenges.get(challengeId);
  if (challenge) {
    challenge.solved = true;
    challenge.solvedAt = new Date();
  }
}

/**
 * Delete a challenge (after it's been consumed).
 */
export function deleteChallenge(challengeId: string): void {
  challenges.delete(challengeId);
}
