/** A Minecraft item identifier (e.g. "oak_planks", "stick", "wooden_pickaxe") */
export type ItemId = string;

/** A single slot in a 3x3 crafting grid. null means empty. */
export type CraftingGrid = (ItemId | null)[][];

/** Defines a crafting recipe */
export interface Recipe {
  /** Unique recipe identifier */
  id: string;
  /** The item produced by this recipe */
  result: ItemId;
  /** Display name of the result item */
  resultName: string;
  /** 3x3 grid pattern — rows × columns. null = empty slot. */
  pattern: CraftingGrid;
  /** How many of the result item are produced */
  count: number;
}

/** A captcha challenge sent from server to client */
export interface CaptchaChallenge {
  /** Unique challenge token */
  challengeId: string;
  /** The items available for the user to place */
  availableItems: ItemId[];
  /** Human-readable prompt, e.g. "Craft a Wooden Pickaxe" */
  prompt: string;
  /** Timestamp when the challenge expires (ISO 8601) */
  expiresAt: string;
}

/** Client's answer submitted back to the server */
export interface CaptchaAnswer {
  challengeId: string;
  /** The 3x3 grid the user arranged */
  grid: CraftingGrid;
}

/** Server's verification response */
export interface CaptchaResult {
  success: boolean;
  /** Set-Cookie header value when success is true */
  message?: string;
}

/** Material provided in a challenge (used by the standalone widget) */
export interface Material {
  id: string;
  label: string;
  count: number;
}

/** Challenge returned by POST /challenge (standalone widget format) */
export interface Challenge {
  challengeId: string;
  targetItem: string;
  targetItemLabel: string;
  materials: Material[];
  gridSize: number;
  expiresAt: string;
}

/** Verification result from POST /verify (standalone widget format) */
export interface VerifyResult {
  success: boolean;
  token?: string;
  error?: string;
  retriesRemaining?: number;
}

/** Configuration options for the standalone widget */
export interface CaptchaOptions {
  container: string;
  siteKey: string;
  apiUrl?: string;
  difficulty?: "easy" | "medium" | "hard";
  theme?: "classic" | "dark";
  locale?: string;
  timeout?: number;
  onSuccess?: (token: string) => void;
  onFailure?: () => void;
  onExpire?: () => void;
}
