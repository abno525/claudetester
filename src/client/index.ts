import { CraftingTable } from "./CraftingTable.js";
import type {
  CaptchaChallenge,
  CaptchaAnswer,
  CaptchaResult,
} from "../shared/types.js";
import "./styles.css";

export interface MinecraftCaptchaOptions {
  /** DOM element to mount the captcha into */
  element: HTMLElement;
  /** Backend API base URL (default: same origin) */
  apiUrl?: string;
  /** Called when captcha is solved successfully */
  onSuccess?: (result: CaptchaResult) => void;
  /** Called when captcha verification fails */
  onFailure?: (result: CaptchaResult) => void;
}

export class MinecraftCaptcha {
  private container: HTMLElement;
  private apiUrl: string;
  private craftingTable: CraftingTable | null = null;
  private challenge: CaptchaChallenge | null = null;
  private onSuccess?: (result: CaptchaResult) => void;
  private onFailure?: (result: CaptchaResult) => void;

  constructor(options: MinecraftCaptchaOptions) {
    this.container = options.element;
    this.apiUrl = options.apiUrl ?? "";
    this.onSuccess = options.onSuccess;
    this.onFailure = options.onFailure;
  }

  /** Fetch a new challenge and render the crafting table */
  async start(): Promise<void> {
    this.container.innerHTML = "";
    this.container.classList.add("mc-captcha");

    this.challenge = await this.fetchChallenge();
    this.craftingTable = new CraftingTable(
      this.container,
      this.challenge,
      (answer) => this.handleSubmit(answer)
    );
    this.craftingTable.render();
  }

  /** Destroy the captcha and clean up */
  destroy(): void {
    this.craftingTable?.destroy();
    this.container.innerHTML = "";
  }

  private async fetchChallenge(): Promise<CaptchaChallenge> {
    const res = await fetch(`${this.apiUrl}/api/captcha/challenge`, {
      method: "POST",
      credentials: "include",
    });
    if (!res.ok) throw new Error("Failed to fetch captcha challenge");
    return res.json();
  }

  private async handleSubmit(answer: CaptchaAnswer): Promise<void> {
    const res = await fetch(`${this.apiUrl}/api/captcha/verify`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      credentials: "include",
      body: JSON.stringify(answer),
    });
    const result: CaptchaResult = await res.json();
    if (result.success) {
      this.onSuccess?.(result);
    } else {
      this.onFailure?.(result);
    }
  }
}

export type { CaptchaChallenge, CaptchaAnswer, CaptchaResult };
