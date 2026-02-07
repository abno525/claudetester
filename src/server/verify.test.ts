import { describe, it, expect, vi, afterEach } from "vitest";
import {
  generateCookieValue,
  validateCookie,
  verifyAnswer,
  COOKIE_NAME,
  COOKIE_MAX_AGE,
} from "./verify.js";
import { createChallenge } from "./challenge.js";
import { RECIPES } from "../shared/recipes.js";

describe("captcha cookie", () => {
  afterEach(() => {
    vi.useRealTimers();
  });

  it("generates a cookie that can be validated", () => {
    const cookie = generateCookieValue();
    expect(validateCookie(cookie)).toBe(true);
  });

  it("rejects a tampered cookie", () => {
    const cookie = generateCookieValue();
    const tampered = cookie.slice(0, -1) + "x";
    expect(validateCookie(tampered)).toBe(false);
  });

  it("rejects garbage input", () => {
    expect(validateCookie("")).toBe(false);
    expect(validateCookie("not-a-cookie")).toBe(false);
  });

  it("rejects a cookie older than COOKIE_MAX_AGE", () => {
    const cookie = generateCookieValue();
    vi.useFakeTimers();
    vi.setSystemTime(Date.now() + (COOKIE_MAX_AGE + 1) * 1000);
    expect(validateCookie(cookie)).toBe(false);
  });

  it("accepts a cookie just within COOKIE_MAX_AGE", () => {
    const cookie = generateCookieValue();
    vi.useFakeTimers();
    vi.setSystemTime(Date.now() + (COOKIE_MAX_AGE - 10) * 1000);
    expect(validateCookie(cookie)).toBe(true);
  });

  it("exports expected constants", () => {
    expect(COOKIE_NAME).toBe("mc_captcha");
    expect(COOKIE_MAX_AGE).toBe(3600);
  });
});

describe("verifyAnswer", () => {
  it("returns success for a correct crafting pattern", () => {
    const challenge = createChallenge();
    const recipeName = challenge.prompt.replace("Craft: ", "");
    const recipe = RECIPES.find((r) => r.resultName === recipeName)!;

    const result = verifyAnswer({
      challengeId: challenge.challengeId,
      grid: recipe.pattern,
    });
    expect(result.success).toBe(true);
    expect(result.message).toBe("Captcha solved!");
  });

  it("returns failure for an incorrect crafting pattern", () => {
    const challenge = createChallenge();

    const result = verifyAnswer({
      challengeId: challenge.challengeId,
      grid: [
        [null, null, null],
        [null, null, null],
        [null, null, null],
      ],
    });
    expect(result.success).toBe(false);
    expect(result.message).toBe("Incorrect crafting pattern");
  });

  it("returns failure for an expired or unknown challenge ID", () => {
    const result = verifyAnswer({
      challengeId: "does-not-exist",
      grid: [
        [null, null, null],
        [null, null, null],
        [null, null, null],
      ],
    });
    expect(result.success).toBe(false);
    expect(result.message).toBe("Challenge expired or invalid");
  });

  it("returns failure when the same challenge is submitted twice", () => {
    const challenge = createChallenge();
    const recipeName = challenge.prompt.replace("Craft: ", "");
    const recipe = RECIPES.find((r) => r.resultName === recipeName)!;

    // First submission succeeds
    const first = verifyAnswer({
      challengeId: challenge.challengeId,
      grid: recipe.pattern,
    });
    expect(first.success).toBe(true);

    // Second submission fails (challenge consumed)
    const second = verifyAnswer({
      challengeId: challenge.challengeId,
      grid: recipe.pattern,
    });
    expect(second.success).toBe(false);
    expect(second.message).toBe("Challenge expired or invalid");
  });

  it("returns failure for partially correct grid", () => {
    const challenge = createChallenge();
    const recipeName = challenge.prompt.replace("Craft: ", "");
    const recipe = RECIPES.find((r) => r.resultName === recipeName)!;

    // Copy the pattern and corrupt one cell
    const grid = recipe.pattern.map((row) => [...row]);
    // Find a non-null cell and change it
    for (let r = 0; r < 3; r++) {
      for (let c = 0; c < 3; c++) {
        if (grid[r][c] !== null) {
          grid[r][c] = "wrong_item";
          break;
        }
      }
      if (grid.flat().includes("wrong_item")) break;
    }

    const result = verifyAnswer({
      challengeId: challenge.challengeId,
      grid,
    });
    expect(result.success).toBe(false);
    expect(result.message).toBe("Incorrect crafting pattern");
  });

  it("succeeds for each recipe when the correct pattern is provided", () => {
    // Test every recipe specifically
    for (const recipe of RECIPES) {
      // We can't control which recipe is selected, so we create many challenges
      // and find one matching this recipe
      let found = false;
      for (let attempt = 0; attempt < 500; attempt++) {
        const challenge = createChallenge();
        const recipeName = challenge.prompt.replace("Craft: ", "");
        if (recipeName === recipe.resultName) {
          const result = verifyAnswer({
            challengeId: challenge.challengeId,
            grid: recipe.pattern,
          });
          expect(result.success).toBe(true);
          found = true;
          break;
        }
        // Consume unused challenges to not leak memory
        // (they expire naturally, but clean up)
      }
      // With 18 recipes and 500 attempts, probability of missing one is negligible
      expect(found).toBe(true);
    }
  });
});
