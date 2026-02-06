import { SiteKeyConfig } from '../../shared/types';

/**
 * In-memory site key store.
 * In production this would be backed by a database.
 * A default demo key pair is created for development.
 */
const siteKeys = new Map<string, SiteKeyConfig>();

// Register a default demo key pair for development
const DEMO_SITE_KEY = 'demo-site-key';
const DEMO_SECRET = 'demo-secret-key';

siteKeys.set(DEMO_SITE_KEY, {
  siteKey: DEMO_SITE_KEY,
  secret: DEMO_SECRET,
});

/**
 * Validate a site key exists.
 */
export function isValidSiteKey(siteKey: string): boolean {
  return siteKeys.has(siteKey);
}

/**
 * Validate a secret matches a site key.
 */
export function isValidSecret(secret: string): boolean {
  for (const config of siteKeys.values()) {
    if (config.secret === secret) return true;
  }
  return false;
}

/**
 * Get site key config by site key.
 */
export function getSiteKeyConfig(siteKey: string): SiteKeyConfig | undefined {
  return siteKeys.get(siteKey);
}

/**
 * Register a new site key / secret pair.
 */
export function registerSiteKey(siteKey: string, secret: string): void {
  siteKeys.set(siteKey, { siteKey, secret });
}
