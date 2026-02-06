export type Difficulty = 'easy' | 'medium' | 'hard';

export type RecipeType = 'shaped' | 'shapeless';

export type Grid = (string | null)[][];

export interface ShapedRecipe {
  id: string;
  type: 'shaped';
  label: string;
  pattern: Grid;
  output: string;
  materials: string[];
  difficulty: Difficulty;
}

export interface ShapelessRecipe {
  id: string;
  type: 'shapeless';
  label: string;
  ingredients: string[];
  output: string;
  difficulty: Difficulty;
}

export type Recipe = ShapedRecipe | ShapelessRecipe;

export interface MaterialInfo {
  id: string;
  label: string;
  count: number;
}

export interface Challenge {
  challengeId: string;
  recipeId: string;
  targetItem: string;
  targetItemLabel: string;
  materials: MaterialInfo[];
  gridSize: number;
  expiresAt: Date;
  retriesRemaining: number;
  solved: boolean;
  solvedAt?: Date;
}

export interface ChallengeResponse {
  challengeId: string;
  targetItem: string;
  targetItemLabel: string;
  materials: MaterialInfo[];
  gridSize: number;
  expiresAt: string;
}

export interface VerifySuccessResponse {
  success: true;
  token: string;
}

export interface VerifyFailureResponse {
  success: false;
  error: string;
  retriesRemaining?: number;
}

export interface ValidateTokenSuccessResponse {
  valid: true;
  challengeId: string;
  solvedAt: string;
}

export interface ValidateTokenFailureResponse {
  valid: false;
  reason: string;
}

export interface SiteKeyConfig {
  siteKey: string;
  secret: string;
}
