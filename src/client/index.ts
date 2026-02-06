import type { CaptchaOptions } from "../shared/types";
import { CraftingTable } from "./CraftingTable.js";
import type {
  CaptchaChallenge,
  CaptchaAnswer,
  CaptchaResult,
} from "../shared/types.js";
import { injectStyles } from "./styles";
import { CaptchaWidget } from "./widget";
import "./styles.css";

// ── Standalone widget API (IIFE-style) ──────────────────────

/** Active widget instances keyed by container selector */
const instances = new Map<string, CaptchaWidget>();

/**
 * Initialize a Minecraft CAPTCHA widget.
 *
 * Usage:
 * ```js
 * MinecraftCaptcha.init({
 *   container: '#mc-captcha',
 *   siteKey: 'your-site-key',
 *   difficulty: 'medium',
 *   theme: 'classic',
 *   onSuccess: function(token) { console.log('Passed!', token); },
 *   onFailure: function() { console.log('Failed'); }
 * });
 * ```
 */
export function init(options: CaptchaOptions): CaptchaWidget {
  injectStyles();

  const containerEl = document.querySelector(options.container) as HTMLElement;
  if (!containerEl) {
    throw new Error(
      `MinecraftCaptcha: container "${options.container}" not found`
    );
  }

  // Destroy any existing instance for this container
  const existing = instances.get(options.container);
  if (existing) {
    existing.destroy();
  }

  const widget = new CaptchaWidget(containerEl, options);
  instances.set(options.container, widget);
  widget.start();

  return widget;
}

/**
 * Destroy a widget instance by container selector.
 */
export function destroy(container: string): void {
  const instance = instances.get(container);
  if (instance) {
    instance.destroy();
    instances.delete(container);
  }
}

/**
 * Destroy all widget instances.
 */
export function destroyAll(): void {
  for (const [key, instance] of instances) {
    instance.destroy();
    instances.delete(key);
  }
}

// ── Server-integrated API ───────────────────────────────────

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
