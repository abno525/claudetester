#!/usr/bin/env bash
# Run this locally with gh CLI authenticated: bash create-issues.sh

set -euo pipefail

echo "Creating issue 1/6: JWT auth..."
gh issue create \
  --repo abno525/claudetester \
  --title "Replace HMAC cookie with JWT (asymmetric signing)" \
  --body "$(cat <<'BODY'
## Summary

The current cookie scheme (`verify.ts:55-82`) uses a symmetric HMAC-SHA256 signature over a timestamp. Every service that wants to verify the cookie must share the same `CAPTCHA_SECRET`, meaning any verifier can also forge tokens. Switching to JWT with asymmetric keys (RS256 or ES256) lets the captcha service sign with a private key while other services verify with only the public key.

## Subtasks

- [ ] **A1.** Add `jose` as a dependency (zero-dependency, works in Node/Deno/edge runtimes)
- [ ] **A2.** Add key generation script or startup routine (`CAPTCHA_PRIVATE_KEY_PATH`, `CAPTCHA_PUBLIC_KEY_PATH` env vars; fallback to in-memory keys in dev)
- [ ] **A3.** Rewrite `generateCookieValue()` → `generateToken()` in `verify.ts` — sign JWT with private key (claims: `iss`, `iat`, `exp`, `jti`)
- [ ] **A4.** Rewrite `validateCookie()` → `validateToken()` in `verify.ts` — verify with public key, let JWT library handle expiration
- [ ] **A5.** Add `GET /api/captcha/public-key` endpoint in `index.ts` (serve public key in PEM or JWK format)
- [ ] **A6.** Remove `CAPTCHA_SECRET` environment variable and all references
- [ ] **A7.** Update `COOKIE_NAME` if desired (cookie stays, just carries JWT now)
- [ ] **A8.** Update tests in `verify.test.ts` — valid/expired/tampered/wrong-key scenarios
- [ ] **A9.** Update `INTEGRATION.md` — JWT verification examples, document public-key endpoint
BODY
)"

echo "Creating issue 2/6: Standalone deployment..."
gh issue create \
  --repo abno525/claudetester \
  --title "Unified standalone deployment (server serves frontend)" \
  --body "$(cat <<'BODY'
## Summary

Currently the Express server (`src/server/index.ts`) is API-only — no static files. Development requires two processes (Vite on 5173, Express on 3000). For a standalone app, the server should serve the built widget so a single process handles everything.

## Subtasks

- [ ] **B1.** Add `express.static()` middleware to `index.ts` — serve `dist/widget/` after API routes, add catch-all `GET *` for SPA routing
- [ ] **B2.** Add unified `dev` script to `package.json` using `concurrently` to start both `dev:widget` and `dev:server`
- [ ] **B3.** Add `start` script — `npm run build && node dist/server/index.js`
- [ ] **B4.** Create production `index.html` or adjust Vite build (switch from library mode to app mode, or create `public/index.html` for UMD bundle)
- [ ] **B5.** Adjust Vite dev proxy — add comment clarifying `/api` proxy is dev-only
- [ ] **B6.** Update `INTEGRATION.md` — add "Standalone deployment" section
BODY
)"

echo "Creating issue 3/6: Complex recipes..."
gh issue create \
  --repo abno525/claudetester \
  --title "Add more complex crafting recipes" \
  --body "$(cat <<'BODY'
## Summary

Current recipes (`src/shared/recipes.ts`) use only 4 raw materials (oak_planks, stick, coal, cobblestone) and most patterns are simple (vertical lines, 2x2 squares, or hollow frames). Recipes need to be harder so the captcha is more challenging.

## Subtasks

- [ ] **C1.** Add more raw/intermediate items to the item pool (iron_ingot, gold_ingot, diamond, redstone, string, leather, stone, glass, wool, paper, etc.)
- [ ] **C2.** Add multi-material recipes requiring distinct items in specific positions (e.g., Iron Pickaxe, Bow, Fishing Rod, Piston, Dispenser, Golden Apple, Bookshelf, Enchanting Table, Cake)
- [ ] **C3.** Increase distractor item count in `createChallenge()` — more items in the pool means more distractors shown
- [ ] **C4.** Keep some easy recipes for variety — mix of easy/hard prevents frustration; optionally add a `difficulty` field for weighted selection
- [ ] **C5.** Update tests — add test cases for all new recipes in `verify.test.ts`
BODY
)"

echo "Creating issue 4/6: Item images..."
gh issue create \
  --repo abno525/claudetester \
  --title "Replace text item labels with Minecraft-style sprite images" \
  --body "$(cat <<'BODY'
## Summary

Items are currently rendered as text labels (`itemId.replace(/_/g, " ")`) in `src/client/CraftingTable.ts:87,107`. Replace with Minecraft-style item icons for a better visual experience.

## Subtasks

- [ ] **D1.** Source or create item sprite images — sprite sheet (single PNG) or individual PNGs; display 16x16 textures at 32x32 or 48x48 with `image-rendering: pixelated`
- [ ] **D2.** Create item-to-image mapping module (e.g., `src/shared/items.ts` or `src/client/itemAssets.ts`)
- [ ] **D3.** Update `createDraggableItem()` in `CraftingTable.ts` — replace `textContent` with `<img>` or `background-image`; add `alt` text for accessibility
- [ ] **D4.** Update `setupDropTarget()` drop handler — render image on drop, remove on clear
- [ ] **D5.** Update CSS in `styles.css` — `image-rendering: pixelated`, center/size images in slots, add hover/tooltip for item names
- [ ] **D6.** Update CaptchaChallenge response or add asset manifest — bundle images via Vite or serve from captcha server
- [ ] **D7.** Update tests — assert `<img>` elements instead of text content
BODY
)"

echo "Creating issue 5/6: README..."
gh issue create \
  --repo abno525/claudetester \
  --title "Rewrite the README" \
  --body "$(cat <<'BODY'
## Summary

`main.md` is 7 lines and reads like a placeholder. A proper README should include:

- [ ] Project description and a screenshot/gif of the captcha in action
- [ ] Quick-start instructions (install, dev server, build)
- [ ] Configuration options (env vars, endpoints)
- [ ] Links to existing docs (INTEGRATION.md, TECHSTACK.md, wiki/)
- [ ] License and contribution guidelines
BODY
)"

echo "Creating issue 6/6: Input validation..."
gh issue create \
  --repo abno525/claudetester \
  --title "Improve server-side input validation and error handling" \
  --body "$(cat <<'BODY'
## Summary

Current gaps in input validation and error handling:

- [ ] No validation of grid dimensions (must be exactly 3x3) or item ID format
- [ ] No request body size limits (potential DoS vector)
- [ ] No rate limiting on `/api/captcha/verify` or `/api/captcha/challenge`
- [ ] `PORT` env var is not validated (non-numeric values silently become `NaN`)
- [ ] `CAPTCHA_SECRET` falls back to a random value, which invalidates all cookies on server restart — warn or require it in production
- [ ] No graceful shutdown handlers (SIGTERM/SIGINT)
BODY
)"

echo "All 6 issues created successfully!"
