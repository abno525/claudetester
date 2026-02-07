import express from "express";
import type { Server } from "node:http";
import { createChallenge } from "./challenge.js";
import {
  verifyAnswer,
  generateCookieValue,
  COOKIE_NAME,
  COOKIE_MAX_AGE,
} from "./verify.js";
import type { CaptchaAnswer, CraftingGrid } from "../shared/types.js";

// ---------------------------------------------------------------------------
// Environment validation
// ---------------------------------------------------------------------------

const rawPort = process.env.PORT ?? "3000";
const PORT = parseInt(rawPort, 10);
if (!Number.isFinite(PORT) || PORT < 0 || PORT > 65535) {
  console.error(
    `Invalid PORT "${rawPort}": must be an integer between 0 and 65535.`,
  );
  process.exit(1);
}

// ---------------------------------------------------------------------------
// App setup
// ---------------------------------------------------------------------------

const app = express();
app.use(express.json({ limit: "16kb" }));

// ---------------------------------------------------------------------------
// Rate limiting
// ---------------------------------------------------------------------------

interface RateBucket {
  count: number;
  resetAt: number;
}

const rateLimits = new Map<string, RateBucket>();
const RATE_WINDOW_MS = 60_000; // 1 minute
const RATE_MAX_REQUESTS = 30; // per window per IP

/** Clean up expired buckets periodically to avoid memory leaks. */
const RATE_CLEANUP_INTERVAL = setInterval(() => {
  const now = Date.now();
  for (const [key, bucket] of rateLimits) {
    if (now >= bucket.resetAt) rateLimits.delete(key);
  }
}, RATE_WINDOW_MS);
RATE_CLEANUP_INTERVAL.unref();

function rateLimit(
  req: express.Request,
  res: express.Response,
  next: express.NextFunction,
): void {
  const ip = req.ip ?? req.socket.remoteAddress ?? "unknown";
  const now = Date.now();
  let bucket = rateLimits.get(ip);

  if (!bucket || now >= bucket.resetAt) {
    bucket = { count: 0, resetAt: now + RATE_WINDOW_MS };
    rateLimits.set(ip, bucket);
  }

  bucket.count++;

  // Attach standard rate-limit headers to every response
  res.setHeader("X-RateLimit-Limit", String(RATE_MAX_REQUESTS));
  res.setHeader(
    "X-RateLimit-Remaining",
    String(Math.max(0, RATE_MAX_REQUESTS - bucket.count)),
  );
  res.setHeader("X-RateLimit-Reset", String(Math.ceil(bucket.resetAt / 1000)));

  if (bucket.count > RATE_MAX_REQUESTS) {
    const retryAfterSec = Math.ceil((bucket.resetAt - now) / 1000);
    res.setHeader("Retry-After", String(retryAfterSec));
    res.status(429).json({ success: false, message: "Too many requests" });
    return;
  }

  next();
}

// ---------------------------------------------------------------------------
// Validation helpers
// ---------------------------------------------------------------------------

const UUID_RE =
  /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/;
const ITEM_ID_RE = /^[a-z][a-z0-9_]{0,63}$/;

function isValidGrid(grid: unknown): grid is CraftingGrid {
  if (!Array.isArray(grid) || grid.length !== 3) return false;
  for (const row of grid) {
    if (!Array.isArray(row) || row.length !== 3) return false;
    for (const cell of row) {
      if (cell === null) continue;
      if (typeof cell !== "string" || !ITEM_ID_RE.test(cell)) return false;
    }
  }
  return true;
}

// ---------------------------------------------------------------------------
// Routes
// ---------------------------------------------------------------------------

/** Issue a new captcha challenge */
app.post("/api/captcha/challenge", rateLimit, (_req, res) => {
  const challenge = createChallenge();
  res.json(challenge);
});

/** Verify the user's crafting answer */
app.post("/api/captcha/verify", rateLimit, (req, res) => {
  const answer = req.body as CaptchaAnswer;
  if (!answer?.challengeId || !answer?.grid) {
    res.status(400).json({ success: false, message: "Invalid request body" });
    return;
  }

  if (
    typeof answer.challengeId !== "string" ||
    !UUID_RE.test(answer.challengeId)
  ) {
    res.status(400).json({ success: false, message: "Invalid challengeId" });
    return;
  }

  if (!isValidGrid(answer.grid)) {
    res.status(400).json({
      success: false,
      message: "Grid must be a 3x3 array of valid item IDs or null",
    });
    return;
  }

  const result = verifyAnswer(answer);

  if (result.success) {
    res.cookie(COOKIE_NAME, generateCookieValue(), {
      httpOnly: true,
      secure: process.env.NODE_ENV === "production",
      sameSite: "strict",
      maxAge: COOKIE_MAX_AGE * 1000,
      path: "/",
    });
  }

  res.json(result);
});

// ---------------------------------------------------------------------------
// Global error handler (must be registered after all routes)
// ---------------------------------------------------------------------------

// Express error handlers must declare 4 parameters to be recognized as such.
app.use(
  (
    err: Error,
    _req: express.Request,
    res: express.Response,
    // eslint-disable-next-line @typescript-eslint/no-unused-vars
    _next: express.NextFunction,
  ) => {
    console.error("Unhandled error:", err);
    res.status(500).json({ success: false, message: "Internal server error" });
  },
);

// ---------------------------------------------------------------------------
// Start & graceful shutdown
// ---------------------------------------------------------------------------

const server: Server = app.listen(PORT, () => {
  console.log(`Minecraft Captcha server running on http://localhost:${PORT}`);
});

function shutdown(signal: string) {
  console.log(`\nReceived ${signal}. Shutting down gracefully…`);
  server.close(() => {
    console.log("Server closed.");
    process.exit(0);
  });
}

process.on("SIGTERM", () => shutdown("SIGTERM"));
process.on("SIGINT", () => shutdown("SIGINT"));

export { app };
