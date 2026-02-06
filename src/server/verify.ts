import crypto from "node:crypto";
import type { CaptchaAnswer, CaptchaResult, CraftingGrid } from "../shared/types.js";
import { RECIPES } from "../shared/recipes.js";
import { consumeChallenge } from "./challenge.js";

/** Secret used to sign captcha cookies. Override via CAPTCHA_SECRET env var. */
const SECRET = process.env.CAPTCHA_SECRET ?? crypto.randomBytes(32).toString("hex");

/** Cookie name for the captcha token */
export const COOKIE_NAME = "mc_captcha";

/** Cookie max-age in seconds (1 hour) */
export const COOKIE_MAX_AGE = 60 * 60;

/** Verify a submitted answer against the expected recipe. */
export function verifyAnswer(answer: CaptchaAnswer): CaptchaResult {
  const recipeId = consumeChallenge(answer.challengeId);
  if (!recipeId) {
    return { success: false, message: "Challenge expired or invalid" };
  }

  const recipe = RECIPES.find((r) => r.id === recipeId);
  if (!recipe) {
    return { success: false, message: "Unknown recipe" };
  }

  if (!gridsMatch(answer.grid, recipe.pattern)) {
    return { success: false, message: "Incorrect crafting pattern" };
  }

  return { success: true, message: "Captcha solved!" };
}

/** Generate a signed cookie value proving the captcha was solved. */
export function generateCookieValue(): string {
  const timestamp = Date.now().toString(36);
  const signature = crypto
    .createHmac("sha256", SECRET)
    .update(timestamp)
    .digest("hex")
    .slice(0, 16);
  return `${timestamp}.${signature}`;
}

/** Validate a previously-issued captcha cookie. */
export function validateCookie(value: string): boolean {
  const [timestamp, signature] = value.split(".");
  if (!timestamp || !signature) return false;

  const expected = crypto
    .createHmac("sha256", SECRET)
    .update(timestamp)
    .digest("hex")
    .slice(0, 16);

  if (!crypto.timingSafeEqual(Buffer.from(signature), Buffer.from(expected))) {
    return false;
  }

  const issued = parseInt(timestamp, 36);
  return Date.now() - issued < COOKIE_MAX_AGE * 1000;
}

function gridsMatch(submitted: CraftingGrid, expected: CraftingGrid): boolean {
  for (let r = 0; r < 3; r++) {
    for (let c = 0; c < 3; c++) {
      const s = submitted[r]?.[c] ?? null;
      const e = expected[r]?.[c] ?? null;
      if (s !== e) return false;
    }
  }
  return true;
}
