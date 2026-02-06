import type {
  CaptchaWidgetOptions,
  CaptchaChallenge,
  CaptchaAnswer,
  CaptchaResult,
} from "../shared/types.js";
import { CaptchaWidget } from "./widget.js";
import "./styles.css";

/**
 * Minecraft CAPTCHA widget — the main public API.
 *
 * Usage:
 * ```js
 * import { MinecraftCaptcha } from "minecraft-captcha/widget";
 *
 * const captcha = new MinecraftCaptcha({
 *   element: document.getElementById("captcha"),
 *   theme: "classic",
 *   onSuccess: (result) => console.log("Passed!", result),
 *   onFailure: (result) => console.log("Failed", result),
 * });
 * captcha.start();
 * ```
 */
export class MinecraftCaptcha {
  private widget: CaptchaWidget;

  constructor(options: CaptchaWidgetOptions) {
    const container =
      typeof options.element === "string"
        ? (document.querySelector(options.element) as HTMLElement)
        : options.element;

    if (!container) {
      throw new Error(
        `MinecraftCaptcha: container "${options.element}" not found`
      );
    }

    this.widget = new CaptchaWidget(container, options);
  }

  /** Fetch a new challenge and render the crafting table */
  async start(): Promise<void> {
    return this.widget.start();
  }

  /** Destroy the captcha and clean up */
  destroy(): void {
    this.widget.destroy();
  }
}

export type { CaptchaWidgetOptions, CaptchaChallenge, CaptchaAnswer, CaptchaResult };
