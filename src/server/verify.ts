import crypto from "node:crypto";
import fs from "node:fs/promises";
import {
  SignJWT,
  jwtVerify,
  generateKeyPair,
  exportJWK,
  importPKCS8,
  importSPKI,
} from "jose";
import type { JWK } from "jose";
import type {
  CaptchaAnswer,
  CaptchaResult,
  CraftingGrid,
} from "../shared/types.js";
import { RECIPES } from "../shared/recipes.js";
import { consumeChallenge } from "./challenge.js";

/** Cookie name for the captcha token */
export const COOKIE_NAME = "mc_captcha";

/** Cookie max-age in seconds (1 hour) */
export const COOKIE_MAX_AGE = 60 * 60;

const ALG = "ES256";

let privateKey: CryptoKey;
let publicKey: CryptoKey;
let publicJwk: JWK;

/**
 * Initialize the signing key pair.
 *
 * Loads from PEM files if CAPTCHA_PRIVATE_KEY_PATH and CAPTCHA_PUBLIC_KEY_PATH
 * are set. Otherwise generates an ephemeral in-memory key pair (suitable for
 * development only).
 */
export async function initKeys(): Promise<void> {
  const privPath = process.env.CAPTCHA_PRIVATE_KEY_PATH;
  const pubPath = process.env.CAPTCHA_PUBLIC_KEY_PATH;

  if (privPath && pubPath) {
    const [privPem, pubPem] = await Promise.all([
      fs.readFile(privPath, "utf-8"),
      fs.readFile(pubPath, "utf-8"),
    ]);
    privateKey = await importPKCS8(privPem.trim(), ALG);
    publicKey = await importSPKI(pubPem.trim(), ALG);
  } else {
    if (process.env.NODE_ENV === "production") {
      console.error(
        "CAPTCHA_PRIVATE_KEY_PATH and CAPTCHA_PUBLIC_KEY_PATH are not set. " +
          "In production you must provide persistent key files.",
      );
      process.exit(1);
    }
    console.warn(
      "No key paths configured — generating ephemeral ES256 key pair. " +
        "Tokens will not survive server restarts.",
    );
    const pair = await generateKeyPair(ALG);
    privateKey = pair.privateKey;
    publicKey = pair.publicKey;
  }

  publicJwk = await exportJWK(publicKey);
  publicJwk.alg = ALG;
}

/** Return the public key as a JWK (for the /api/captcha/public-key endpoint). */
export function getPublicKeyJwk(): JWK {
  return publicJwk;
}

/** Verify a submitted answer against the expected recipe. */
export function verifyAnswer(answer: CaptchaAnswer): CaptchaResult {
  const recipeId = consumeChallenge(answer.challengeId);
  if (!recipeId) {
    return { success: false, message: "Challenge expired or invalid" };
  }

  const recipe = RECIPES.find((r) => r.id === recipeId);
  if (!recipe) {
    return { success: false, message: "Unknown recipe" };
  }

  if (!gridsMatch(answer.grid, recipe.pattern)) {
    return { success: false, message: "Incorrect crafting pattern" };
  }

  return { success: true, message: "Captcha solved!" };
}

/** Generate a signed JWT proving the captcha was solved. */
export async function generateToken(): Promise<string> {
  return new SignJWT({})
    .setProtectedHeader({ alg: ALG })
    .setIssuedAt()
    .setExpirationTime(`${COOKIE_MAX_AGE}s`)
    .setJti(crypto.randomUUID())
    .setIssuer("minecraft-captcha")
    .sign(privateKey);
}

/**
 * RFC 7515 §3.1 — A JWS Compact Serialization consists of exactly three
 * base64url-encoded segments separated by two period ('.') characters:
 *   BASE64URL(header) '.' BASE64URL(payload) '.' BASE64URL(signature)
 */
const BASE64URL_RE = /^[A-Za-z0-9_-]+$/;

function isJWSCompact(token: string): boolean {
  const parts = token.split(".");
  if (parts.length !== 3) return false;
  return parts.every((p) => p.length > 0 && BASE64URL_RE.test(p));
}

/** Validate a previously-issued captcha JWT. Returns true if valid. */
export async function validateToken(token: string): Promise<boolean> {
  try {
    if (!isJWSCompact(token)) return false;
    await jwtVerify(token, publicKey, {
      issuer: "minecraft-captcha",
      algorithms: [ALG],
    });
    return true;
  } catch {
    return false;
  }
}

function gridsMatch(submitted: CraftingGrid, expected: CraftingGrid): boolean {
  for (let r = 0; r < 3; r++) {
    for (let c = 0; c < 3; c++) {
      const s = submitted[r]?.[c] ?? null;
      const e = expected[r]?.[c] ?? null;
      if (s !== e) return false;
    }
  }
  return true;
}
