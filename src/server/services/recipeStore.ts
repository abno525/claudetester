import recipes from '../../shared/recipes';
import { ITEM_LABELS, ALL_ITEM_IDS } from '../../shared/items';
import { Recipe, Difficulty, Grid, MaterialInfo, ShapedRecipe } from '../../shared/types';

/**
 * Get all recipes, optionally filtered by difficulty.
 */
export function getRecipes(difficulty?: Difficulty): Recipe[] {
  if (difficulty) {
    return recipes.filter((r) => r.difficulty === difficulty);
  }
  return recipes;
}

/**
 * Get a single recipe by ID.
 */
export function getRecipeById(id: string): Recipe | undefined {
  return recipes.find((r) => r.id === id);
}

/**
 * Select a random recipe, optionally filtered by difficulty.
 */
export function getRandomRecipe(difficulty?: Difficulty): Recipe {
  const pool = getRecipes(difficulty);
  return pool[Math.floor(Math.random() * pool.length)];
}

/**
 * Get the human-readable label for an item ID.
 */
export function getItemLabel(itemId: string): string {
  return ITEM_LABELS[itemId] || itemId;
}

/**
 * Build the materials list for a challenge, including decoy items based on difficulty.
 */
export function buildMaterialsList(recipe: Recipe, difficulty: Difficulty): MaterialInfo[] {
  const materialCounts = new Map<string, number>();

  if (recipe.type === 'shaped') {
    for (const row of recipe.pattern) {
      for (const cell of row) {
        if (cell !== null) {
          materialCounts.set(cell, (materialCounts.get(cell) || 0) + 1);
        }
      }
    }
  } else {
    for (const ingredient of recipe.ingredients) {
      materialCounts.set(ingredient, (materialCounts.get(ingredient) || 0) + 1);
    }
  }

  const materials: MaterialInfo[] = [];
  for (const [id, count] of materialCounts) {
    materials.push({ id, label: getItemLabel(id), count });
  }

  // Add decoy materials based on difficulty
  const decoyCount = difficulty === 'easy' ? 0 : difficulty === 'medium' ? 2 : 4;
  const usedIds = new Set(materialCounts.keys());
  const availableDecoys = ALL_ITEM_IDS.filter((id) => !usedIds.has(id));

  for (let i = 0; i < decoyCount && availableDecoys.length > 0; i++) {
    const idx = Math.floor(Math.random() * availableDecoys.length);
    const decoyId = availableDecoys.splice(idx, 1)[0];
    materials.push({ id: decoyId, label: getItemLabel(decoyId), count: Math.floor(Math.random() * 3) + 1 });
  }

  // Shuffle materials so decoys aren't always at the end
  for (let i = materials.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [materials[i], materials[j]] = [materials[j], materials[i]];
  }

  return materials;
}

/**
 * Find the bounding box of non-null cells in a grid.
 */
function getBounds(grid: Grid): { minRow: number; maxRow: number; minCol: number; maxCol: number } {
  let minRow = grid.length, maxRow = -1, minCol = grid[0]?.length ?? 0, maxCol = -1;
  for (let r = 0; r < grid.length; r++) {
    for (let c = 0; c < grid[r].length; c++) {
      if (grid[r][c] !== null) {
        minRow = Math.min(minRow, r);
        maxRow = Math.max(maxRow, r);
        minCol = Math.min(minCol, c);
        maxCol = Math.max(maxCol, c);
      }
    }
  }
  return { minRow, maxRow, minCol, maxCol };
}

/**
 * Normalize a grid by removing empty rows/columns around the pattern.
 */
function normalizeGrid(grid: Grid): Grid {
  const bounds = getBounds(grid);
  if (bounds.maxRow === -1) return []; // empty grid

  const normalized: Grid = [];
  for (let r = bounds.minRow; r <= bounds.maxRow; r++) {
    const row: (string | null)[] = [];
    for (let c = bounds.minCol; c <= bounds.maxCol; c++) {
      row.push(grid[r][c]);
    }
    normalized.push(row);
  }
  return normalized;
}

/**
 * Check if two normalized grids are equal.
 */
function gridsEqual(a: Grid, b: Grid): boolean {
  if (a.length !== b.length) return false;
  for (let r = 0; r < a.length; r++) {
    if (a[r].length !== b[r].length) return false;
    for (let c = 0; c < a[r].length; c++) {
      if (a[r][c] !== b[r][c]) return false;
    }
  }
  return true;
}

/**
 * Validate a submitted grid against a recipe.
 * Supports offset handling for shaped recipes (pattern can be placed anywhere on the grid).
 * Supports shapeless recipes (order doesn't matter).
 */
export function validateGrid(recipe: Recipe, submittedGrid: Grid): boolean {
  if (recipe.type === 'shaped') {
    const normalizedSubmitted = normalizeGrid(submittedGrid);
    const normalizedPattern = normalizeGrid(recipe.pattern);
    return gridsEqual(normalizedSubmitted, normalizedPattern);
  }

  // Shapeless: collect all non-null items from the grid and compare to ingredients
  const submittedItems: string[] = [];
  for (const row of submittedGrid) {
    for (const cell of row) {
      if (cell !== null) {
        submittedItems.push(cell);
      }
    }
  }

  if (submittedItems.length !== recipe.ingredients.length) return false;

  const sortedSubmitted = [...submittedItems].sort();
  const sortedIngredients = [...recipe.ingredients].sort();
  return sortedSubmitted.every((item, i) => item === sortedIngredients[i]);
}
