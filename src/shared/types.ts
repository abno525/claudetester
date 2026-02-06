/** Material provided in a challenge */
export interface Material {
  id: string;
  label: string;
  count: number;
}

/** Challenge returned by POST /challenge */
export interface Challenge {
  challengeId: string;
  targetItem: string;
  targetItemLabel: string;
  materials: Material[];
  gridSize: number;
  expiresAt: string;
}

/** Verification result from POST /verify */
export interface VerifyResult {
  success: boolean;
  token?: string;
  error?: string;
  retriesRemaining?: number;
}

/** 3x3 grid where each cell is an item ID or null */
export type CraftingGrid = (string | null)[][];

/** Configuration options for the widget */
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
