import crypto from "node:crypto";
import type { CaptchaChallenge, ItemId } from "../shared/types.js";
import { RECIPES } from "../shared/recipes.js";

/** How long a challenge stays valid (5 minutes) */
const CHALLENGE_TTL_MS = 5 * 60 * 1000;

/** In-memory store of active challenges. Maps challengeId → recipe id. */
const activeChallenges = new Map<
  string,
  { recipeId: string; expiresAt: number }
>();

/** Generate a new captcha challenge by picking a random recipe. */
export function createChallenge(): CaptchaChallenge {
  const recipe = RECIPES[Math.floor(Math.random() * RECIPES.length)];
  const challengeId = crypto.randomUUID();
  const expiresAt = Date.now() + CHALLENGE_TTL_MS;

  activeChallenges.set(challengeId, { recipeId: recipe.id, expiresAt });

  // Collect unique items needed for the recipe and add a few distractors
  const neededItems = new Set<ItemId>();
  for (const row of recipe.pattern) {
    for (const cell of row) {
      if (cell) neededItems.add(cell);
    }
  }
  const distractors = getDistractorItems(neededItems);

  return {
    challengeId,
    prompt: `Craft: ${recipe.resultName}`,
    availableItems: shuffle([...neededItems, ...distractors]),
    expiresAt: new Date(expiresAt).toISOString(),
  };
}

/** Retrieve and consume a challenge. Returns the expected recipe id or null. */
export function consumeChallenge(challengeId: string): string | null {
  const entry = activeChallenges.get(challengeId);
  if (!entry) return null;
  activeChallenges.delete(challengeId);
  if (Date.now() > entry.expiresAt) return null;
  return entry.recipeId;
}

/** Pick 3-5 random item ids that are NOT in the required set. */
function getDistractorItems(needed: Set<ItemId>): ItemId[] {
  const all = new Set<ItemId>();
  for (const r of RECIPES) {
    for (const row of r.pattern) {
      for (const cell of row) {
        if (cell && !needed.has(cell)) all.add(cell);
      }
    }
  }
  const pool = [...all];
  const count = Math.min(pool.length, 3 + Math.floor(Math.random() * 3));
  return shuffle(pool).slice(0, count);
}

function shuffle<T>(arr: T[]): T[] {
  for (let i = arr.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [arr[i], arr[j]] = [arr[j], arr[i]];
  }
  return arr;
}
