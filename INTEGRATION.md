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
      // captcha solved — the server has set an httpOnly cookie containing a JWT
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

## 3. Standalone Deployment

The Express server can serve the built frontend widget directly, so a single process handles both the API and the UI.

### Production

```bash
# Build everything and start the server
npm start

# Or equivalently:
npm run build
node dist/server/index.js
```

The server will serve the widget on the root URL and the API on `/api`. Visit `http://localhost:3000` to see the captcha.

### Development

```bash
# Start both Vite dev server and Express in watch mode
npm run dev
```

This uses `concurrently` to run the Vite dev server (port 5173) and the Express server (port 3000) side-by-side. The Vite dev server proxies `/api` requests to Express automatically.

---

## 4. Server-Side Setup

The verification server is a standalone Express app. Run it alongside your existing backend or embed the routes into your own Express app.

### Option A: Standalone server

```bash
# Provide ES256 key files for persistent JWT signing (recommended for production)
export CAPTCHA_PRIVATE_KEY_PATH="/path/to/ec-private.pem"
export CAPTCHA_PUBLIC_KEY_PATH="/path/to/ec-public.pem"
export PORT=3000

npx tsx src/server/index.ts
```

In development, if no key paths are set an ephemeral key pair is generated automatically (tokens will not survive restarts).

To generate an ES256 key pair:

```bash
openssl ecparam -name prime256v1 -genkey -noout -out ec-private.pem
openssl ec -in ec-private.pem -pubout -out ec-public.pem
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
  generateToken,
  validateToken,
  initKeys,
} from "minecraft-captcha/server";

// Initialize keys before handling requests
await initKeys();

// In your own route handler:
app.post("/my-captcha-check", async (req, res) => {
  const result = verifyAnswer(req.body);
  if (result.success) {
    const token = await generateToken();
    res.cookie("mc_captcha", token, { httpOnly: true });
  }
  res.json(result);
});

// In a middleware to protect a route:
app.use("/protected", async (req, res, next) => {
  const token = req.cookies?.mc_captcha;
  if (!token || !(await validateToken(token))) {
    return res.status(403).json({ error: "Captcha required" });
  }
  next();
});
```

---

## 5. Cookie Behavior

On successful verification, the server sets an `mc_captcha` httpOnly cookie containing a signed JWT:

| Property | Value                                 |
| -------- | ------------------------------------- |
| Name     | `mc_captcha`                          |
| HttpOnly | `true`                                |
| Secure   | `true` in production                  |
| SameSite | `strict`                              |
| Max-Age  | 1 hour                                |
| Content  | ES256-signed JWT (iss, iat, exp, jti) |

The JWT contains the following claims:

| Claim | Description                       |
| ----- | --------------------------------- |
| `iss` | `"minecraft-captcha"`             |
| `iat` | Issued-at timestamp (seconds)     |
| `exp` | Expiration timestamp (iat + 3600) |
| `jti` | Unique token identifier (UUID)    |

Your backend can validate this cookie using `validateToken()` or by verifying the JWT independently with the public key.

---

## 5. Public Key Endpoint

The server exposes a `GET /api/captcha/public-key` endpoint that returns the public key in JWK format. This allows external services to verify captcha JWTs without sharing a secret.

```bash
curl https://your-api.com/api/captcha/public-key
```

Response:

```json
{
  "kty": "EC",
  "crv": "P-256",
  "x": "...",
  "y": "...",
  "alg": "ES256"
}
```

### Verifying a JWT externally (Node.js example)

```ts
import { jwtVerify, importJWK } from "jose";

// Fetch the public key once and cache it
const res = await fetch("https://your-api.com/api/captcha/public-key");
const jwk = await res.json();
const publicKey = await importJWK(jwk, "ES256");

// Verify a token from the mc_captcha cookie
const { payload } = await jwtVerify(token, publicKey, {
  issuer: "minecraft-captcha",
  algorithms: ["ES256"],
});

console.log("Token is valid, issued at:", new Date(payload.iat! * 1000));
```

---

## 6. Configuration Summary

### Widget options

| Option      | Type               | Default            | Description                         |
| ----------- | ------------------ | ------------------ | ----------------------------------- |
| `element`   | `HTMLElement`      | _required_         | DOM node to mount the captcha into  |
| `apiUrl`    | `string`           | `""` (same origin) | Base URL of the verification server |
| `onSuccess` | `(result) => void` | —                  | Callback on successful verification |
| `onFailure` | `(result) => void` | —                  | Callback on failed verification     |

### Server environment variables

| Variable                   | Default | Description                                  |
| -------------------------- | ------- | -------------------------------------------- |
| `PORT`                     | `3000`  | HTTP port for the standalone server          |
| `CAPTCHA_PRIVATE_KEY_PATH` | —       | Path to ES256 private key PEM file           |
| `CAPTCHA_PUBLIC_KEY_PATH`  | —       | Path to ES256 public key PEM file            |
| `NODE_ENV`                 | —       | Set to `production` to enable secure cookies |
