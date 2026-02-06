import { describe, it, expect } from "vitest";
import { RECIPES } from "./recipes.js";

describe("recipes", () => {
  it("should have at least one recipe", () => {
    expect(RECIPES.length).toBeGreaterThan(0);
  });

  it("every recipe has a 3x3 pattern", () => {
    for (const recipe of RECIPES) {
      expect(recipe.pattern).toHaveLength(3);
      for (const row of recipe.pattern) {
        expect(row).toHaveLength(3);
      }
    }
  });

  it("every recipe has required fields", () => {
    for (const recipe of RECIPES) {
      expect(recipe.id).toBeTruthy();
      expect(recipe.result).toBeTruthy();
      expect(recipe.resultName).toBeTruthy();
      expect(recipe.count).toBeGreaterThan(0);
    }
  });
});
