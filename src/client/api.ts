import type {
  CaptchaChallenge,
  CaptchaAnswer,
  CaptchaResult,
} from "../shared/types.js";

/** Handles communication with the Minecraft CAPTCHA backend API */
export class CaptchaApi {
  private baseUrl: string;

  constructor(apiUrl: string) {
    this.baseUrl = apiUrl.replace(/\/+$/, "");
  }

  /** Request a new CAPTCHA challenge */
  async getChallenge(): Promise<CaptchaChallenge> {
    const res = await fetch(`${this.baseUrl}/api/captcha/challenge`, {
      method: "POST",
      credentials: "include",
    });

    if (!res.ok) {
      throw new Error("Failed to fetch captcha challenge");
    }

    return res.json();
  }

  /** Submit a crafting grid for verification */
  async verify(answer: CaptchaAnswer): Promise<CaptchaResult> {
    const res = await fetch(`${this.baseUrl}/api/captcha/verify`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      credentials: "include",
      body: JSON.stringify(answer),
    });

    if (!res.ok) {
      throw new Error("Verification request failed");
    }

    return res.json();
  }
}
