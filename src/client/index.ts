import type { CaptchaOptions } from "../shared/types";
import { injectStyles } from "./styles";
import { CaptchaWidget } from "./widget";

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
