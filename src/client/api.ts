import type { Challenge, CraftingGrid, VerifyResult } from "../shared/types";

/** Handles communication with the Minecraft CAPTCHA backend API */
export class CaptchaApi {
  private baseUrl: string;

  constructor(apiUrl: string) {
    // Strip trailing slash
    this.baseUrl = apiUrl.replace(/\/+$/, "");
  }

  /** Request a new CAPTCHA challenge */
  async getChallenge(
    siteKey: string,
    difficulty: string
  ): Promise<Challenge> {
    const res = await fetch(`${this.baseUrl}/challenge`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ siteKey, difficulty }),
    });

    if (!res.ok) {
      const body = await res.json().catch(() => ({}));
      throw new CaptchaApiError(
        body.error ?? "challenge_request_failed",
        res.status
      );
    }

    return res.json();
  }

  /** Submit a crafting grid for verification */
  async verify(
    challengeId: string,
    grid: CraftingGrid
  ): Promise<VerifyResult> {
    const res = await fetch(`${this.baseUrl}/verify`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ challengeId, grid }),
    });

    if (res.status === 410) {
      return { success: false, error: "challenge_expired" };
    }

    if (res.status === 429) {
      return { success: false, error: "rate_limited" };
    }

    if (!res.ok) {
      const body = await res.json().catch(() => ({}));
      throw new CaptchaApiError(
        body.error ?? "verify_request_failed",
        res.status
      );
    }

    return res.json();
  }
}

export class CaptchaApiError extends Error {
  constructor(
    public code: string,
    public status: number
  ) {
    super(`CAPTCHA API error: ${code} (HTTP ${status})`);
    this.name = "CaptchaApiError";
  }
}
