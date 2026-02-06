# Integration Guide

How to add the Minecraft Captcha to an existing website or application.

---

## 1. Quick Start (script tag)

The simplest way — no build tools required.

```html
<!-- Load the widget (UMD build) -->
<script src="https://your-cdn.com/minecraft-captcha.umd.cjs"></script>
<link rel="stylesheet" href="https://your-cdn.com/minecraft-captcha.css" />

<div id="captcha"></div>

<script>
  var captcha = new MinecraftCaptcha.MinecraftCaptcha({
    element: document.getElementById("captcha"),
    apiUrl: "https://your-api.com", // where the verification server runs
    onSuccess: function (result) {
      // captcha solved — the server has set an httpOnly cookie
      document.getElementById("my-form").submit();
    },
    onFailure: function (result) {
      alert("Wrong pattern, try again!");
      captcha.start(); // reload a new challenge
    },
  });

  captcha.start();
</script>
```

---

## 2. ES Module Import (React, Vue, Svelte, etc.)

Install the package:

```bash
npm install minecraft-captcha
```

Import and use:

```ts
import { MinecraftCaptcha } from "minecraft-captcha/widget";

const captcha = new MinecraftCaptcha({
  element: document.getElementById("captcha")!,
  apiUrl: "/api",
  onSuccess: (result) => console.log("Solved!", result),
  onFailure: (result) => console.log("Failed", result),
});

captcha.start();
```

### React example

```tsx
import { useEffect, useRef } from "react";
import { MinecraftCaptcha } from "minecraft-captcha/widget";

export function CaptchaWidget({ onVerified }: { onVerified: () => void }) {
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!ref.current) return;

    const captcha = new MinecraftCaptcha({
      element: ref.current,
      onSuccess: () => onVerified(),
      onFailure: () => captcha.start(),
    });

    captcha.start();
    return () => captcha.destroy();
  }, [onVerified]);

  return <div ref={ref} />;
}
```

---

## 3. Server-Side Setup

The verification server is a standalone Express app. Run it alongside your existing backend or embed the routes into your own Express app.

### Option A: Standalone server

```bash
# Set a secret for cookie signing (random default is used otherwise)
export CAPTCHA_SECRET="your-secret-here"
export PORT=3000

npx tsx src/server/index.ts
```

### Option B: Mount into an existing Express app

```ts
import express from "express";
import { app as captchaApp } from "minecraft-captcha/server";

const app = express();

// Mount captcha routes under /captcha
app.use("/captcha", captchaApp);

app.listen(8080);
```

### Option C: Use the verification functions directly

```ts
import { createChallenge } from "minecraft-captcha/server";
import {
  verifyAnswer,
  generateCookieValue,
  validateCookie,
} from "minecraft-captcha/server";

// In your own route handler:
app.post("/my-captcha-check", (req, res) => {
  const result = verifyAnswer(req.body);
  if (result.success) {
    res.cookie("mc_captcha", generateCookieValue(), { httpOnly: true });
  }
  res.json(result);
});

// In a middleware to protect a route:
app.use("/protected", (req, res, next) => {
  const token = req.cookies?.mc_captcha;
  if (!token || !validateCookie(token)) {
    return res.status(403).json({ error: "Captcha required" });
  }
  next();
});
```

---

## 4. Cookie Behavior

On successful verification, the server sets an `mc_captcha` httpOnly cookie:

| Property | Value                 |
| -------- | --------------------- |
| Name     | `mc_captcha`          |
| HttpOnly | `true`                |
| Secure   | `true` in production  |
| SameSite | `strict`              |
| Max-Age  | 1 hour                |
| Content  | HMAC-signed timestamp |

Your backend middleware can validate this cookie using `validateCookie()` to decide whether the user has passed the captcha.

---

## 5. Configuration Summary

### Widget options

| Option      | Type               | Default            | Description                         |
| ----------- | ------------------ | ------------------ | ----------------------------------- |
| `element`   | `HTMLElement`      | _required_         | DOM node to mount the captcha into  |
| `apiUrl`    | `string`           | `""` (same origin) | Base URL of the verification server |
| `onSuccess` | `(result) => void` | —                  | Callback on successful verification |
| `onFailure` | `(result) => void` | —                  | Callback on failed verification     |

### Server environment variables

| Variable         | Default | Description                                  |
| ---------------- | ------- | -------------------------------------------- |
| `PORT`           | `3000`  | HTTP port for the standalone server          |
| `CAPTCHA_SECRET` | random  | HMAC secret for cookie signing               |
| `NODE_ENV`       | —       | Set to `production` to enable secure cookies |
