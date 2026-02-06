import express from "express";
import { createChallenge } from "./challenge.js";
import {
  verifyAnswer,
  generateCookieValue,
  COOKIE_NAME,
  COOKIE_MAX_AGE,
} from "./verify.js";
import type { CaptchaAnswer } from "../shared/types.js";

const app = express();
app.use(express.json());

const PORT = parseInt(process.env.PORT ?? "3000", 10);

/** Issue a new captcha challenge */
app.post("/api/captcha/challenge", (_req, res) => {
  const challenge = createChallenge();
  res.json(challenge);
});

/** Verify the user's crafting answer */
app.post("/api/captcha/verify", (req, res) => {
  const answer = req.body as CaptchaAnswer;
  if (!answer?.challengeId || !answer?.grid) {
    res.status(400).json({ success: false, message: "Invalid request body" });
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

app.listen(PORT, () => {
  console.log(`Minecraft Captcha server running on http://localhost:${PORT}`);
});

export { app };
