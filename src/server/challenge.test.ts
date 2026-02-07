import { describe, it, expect, vi } from "vitest";
import { createChallenge, consumeChallenge } from "./challenge.js";
import { RECIPES } from "../shared/recipes.js";

describe("createChallenge", () => {
  it("returns a challenge with all required fields", () => {
    const challenge = createChallenge();
    expect(challenge.challengeId).toBeTruthy();
    expect(challenge.prompt).toBeTruthy();
    expect(challenge.availableItems).toBeInstanceOf(Array);
    expect(challenge.availableItems.length).toBeGreaterThan(0);
    expect(challenge.expiresAt).toBeTruthy();
  });

  it("has a prompt matching 'Craft: <recipeName>'", () => {
    const challenge = createChallenge();
    const recipeNames = RECIPES.map((r) => r.resultName);
    const promptName = challenge.prompt.replace("Craft: ", "");
    expect(recipeNames).toContain(promptName);
  });

  it("expiresAt is an ISO 8601 date ~5 minutes in the future", () => {
    const before = Date.now();
    const challenge = createChallenge();
    const after = Date.now();

    const expiresAt = new Date(challenge.expiresAt).getTime();
    const fiveMin = 5 * 60 * 1000;

    expect(expiresAt).toBeGreaterThanOrEqual(before + fiveMin);
    expect(expiresAt).toBeLessThanOrEqual(after + fiveMin);
  });

  it("available items include all items required by the chosen recipe", () => {
    // Run multiple times since recipe selection is random
    for (let i = 0; i < 20; i++) {
      const challenge = createChallenge();
      const recipeName = challenge.prompt.replace("Craft: ", "");
      const recipe = RECIPES.find((r) => r.resultName === recipeName)!;

      const neededItems = new Set<string>();
      for (const row of recipe.pattern) {
        for (const cell of row) {
          if (cell) neededItems.add(cell);
        }
      }

      for (const item of neededItems) {
        expect(challenge.availableItems).toContain(item);
      }
    }
  });

  it("available items include distractor items not in the recipe", () => {
    // Run multiple times to account for randomness
    let hasDistractors = false;
    for (let i = 0; i < 30; i++) {
      const challenge = createChallenge();
      const recipeName = challenge.prompt.replace("Craft: ", "");
      const recipe = RECIPES.find((r) => r.resultName === recipeName)!;

      const neededItems = new Set<string>();
      for (const row of recipe.pattern) {
        for (const cell of row) {
          if (cell) neededItems.add(cell);
        }
      }

      const extras = challenge.availableItems.filter(
        (i) => !neededItems.has(i),
      );
      if (extras.length > 0) {
        hasDistractors = true;
        // Verify distractors are valid item IDs from other recipes
        const allItems = new Set<string>();
        for (const r of RECIPES) {
          for (const row of r.pattern) {
            for (const cell of row) {
              if (cell) allItems.add(cell);
            }
          }
        }
        for (const extra of extras) {
          expect(allItems).toContain(extra);
        }
        break;
      }
    }
    expect(hasDistractors).toBe(true);
  });

  it("generates unique challenge IDs", () => {
    const ids = new Set<string>();
    for (let i = 0; i < 50; i++) {
      ids.add(createChallenge().challengeId);
    }
    expect(ids.size).toBe(50);
  });
});

describe("consumeChallenge", () => {
  it("returns a valid recipe ID for an active challenge", () => {
    const challenge = createChallenge();
    const recipeId = consumeChallenge(challenge.challengeId);
    expect(recipeId).toBeTruthy();
    const recipe = RECIPES.find((r) => r.id === recipeId);
    expect(recipe).toBeDefined();
  });

  it("returns null for an unknown challenge ID", () => {
    expect(consumeChallenge("nonexistent-id")).toBeNull();
  });

  it("consumes the challenge (second call returns null)", () => {
    const challenge = createChallenge();
    const first = consumeChallenge(challenge.challengeId);
    expect(first).toBeTruthy();
    const second = consumeChallenge(challenge.challengeId);
    expect(second).toBeNull();
  });

  it("returns null for an expired challenge", () => {
    const challenge = createChallenge();

    // Advance time past the 5-minute TTL
    vi.useFakeTimers();
    vi.setSystemTime(Date.now() + 6 * 60 * 1000);

    const result = consumeChallenge(challenge.challengeId);
    expect(result).toBeNull();

    vi.useRealTimers();
  });

  it("returns the recipe ID matching the prompt", () => {
    const challenge = createChallenge();
    const recipeName = challenge.prompt.replace("Craft: ", "");
    const expectedRecipe = RECIPES.find((r) => r.resultName === recipeName)!;

    const recipeId = consumeChallenge(challenge.challengeId);
    expect(recipeId).toBe(expectedRecipe.id);
  });
});
