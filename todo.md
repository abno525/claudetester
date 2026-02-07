## Planned changes

### A. Replace HMAC cookie with JWT (asymmetric signing)

The current cookie scheme (`verify.ts:55-82`) uses a symmetric HMAC-SHA256 signature
over a timestamp. Every service that wants to verify the cookie must share the same
`CAPTCHA_SECRET`, meaning any verifier can also forge tokens. Switching to JWT with
asymmetric keys (RS256 or ES256) lets the captcha service sign with a private key while
other services verify with only the public key.

#### A1. Add `jsonwebtoken` (or a lightweight alternative like `jose`) as a dependency
- `jose` is zero-dependency and works in Node, Deno, and edge runtimes — preferred
  over `jsonwebtoken` which pulls in several transitive deps.

#### A2. Add key generation script or startup routine
- On first run (or via an npm script like `npm run generate-keys`), generate an
  RS256 or ES256 key pair and write them to configurable paths.
- Environment variables:
  - `CAPTCHA_PRIVATE_KEY_PATH` — path to PEM private key (used by this service only)
  - `CAPTCHA_PUBLIC_KEY_PATH` — path to PEM public key (distributed to verifiers)
- Fall back to in-memory generated key pair in development (with a warning, same
  pattern as the current `CAPTCHA_SECRET` fallback in `verify.ts:12-27`).

#### A3. Rewrite `generateCookieValue()` → `generateToken()` in `src/server/verify.ts`
- Sign a JWT with the private key using RS256/ES256.
- Claims:
  - `iss`: `"minecraft-captcha"` (identifies the issuing service)
  - `iat`: issued-at timestamp (replaces the manual base36 timestamp)
  - `exp`: current time + `COOKIE_MAX_AGE` (1 hour) — JWT handles expiry natively
  - `jti`: random UUID (allows revocation if needed later)
- The cookie value becomes the signed JWT string instead of `timestamp.signature`.

#### A4. Rewrite `validateCookie()` → `validateToken()` in `src/server/verify.ts`
- Verify the JWT signature using the **public** key.
- Let the JWT library handle expiration checking (`exp` claim).
- Remove the manual `timingSafeEqual` comparison and age check — the JWT library
  handles both.
- Keep exporting this function so it can be used as middleware by other services.

#### A5. Add a `GET /api/captcha/public-key` endpoint in `src/server/index.ts`
- Serves the public key in PEM or JWK format so other services can fetch it at
  startup or on demand (standard pattern for JWT verifiers).
- This is how other apps "know the cookie is valid" — they grab the public key from
  this endpoint (or from a shared file/secret store) and verify the JWT locally.

#### A6. Remove `CAPTCHA_SECRET` environment variable
- No longer needed. Replace all references in `verify.ts`, `INTEGRATION.md`, and
  `TECHSTACK.md` with the new key pair configuration.

#### A7. Update `COOKIE_NAME` from `mc_captcha` to keep or rename as desired
- The cookie itself stays — it just carries a JWT string now instead of the custom
  `timestamp.signature` format.

#### A8. Update tests in `src/server/verify.test.ts`
- Replace HMAC cookie generation/validation tests with JWT equivalents.
- Test: valid token verifies, expired token rejects, tampered token rejects,
  token signed with wrong key rejects.

#### A9. Update `INTEGRATION.md`
- Replace the `validateCookie()` middleware example with JWT verification using
  the public key.
- Document the `/api/captcha/public-key` endpoint.
- Show example of verifying the JWT in a separate service (e.g., using `jose`
  with the public key fetched from the captcha service or loaded from disk).

---

### B. Unified standalone deployment (server serves the frontend)

Currently the Express server (`src/server/index.ts`) is API-only — no static files.
Development requires two processes (Vite on 5173, Express on 3000). For a standalone
app, the server should serve the built widget so a single process handles everything.

#### B1. Add `express.static()` middleware to `src/server/index.ts`
- After building, serve `dist/widget/` at the root path.
- Place it **after** the API routes so `/api/*` still takes priority.
- Example: `app.use(express.static(path.join(__dirname, "../widget")))`.
- Add a catch-all `GET *` that serves `index.html` for SPA-style routing.

#### B2. Add a unified `dev` script to `package.json`
- Use `concurrently` (or `npm-run-all`) to start both `dev:widget` and
  `dev:server` with a single `npm run dev` command.
- Add `concurrently` as a dev dependency.

#### B3. Add a `start` script to `package.json`
- `npm run build && node dist/server/index.js` — single command to build and run
  the complete standalone app.

#### B4. Create a production `index.html` or adjust Vite build
- The current `index.html` at the repo root is a dev-only entry point that loads
  from `/src/client/index.ts` (unbundled). The Vite library build (`vite.config.ts`)
  outputs a JS/CSS bundle but no HTML.
- Either:
  - Switch Vite from library mode to app mode so it emits a ready-to-serve
    `index.html` in `dist/widget/`, or
  - Create a minimal `public/index.html` that loads the UMD bundle and CSS, which
    Vite will copy to `dist/widget/` at build time.

#### B5. Remove or adjust the Vite dev proxy
- `vite.config.ts:22-24` proxies `/api` to `localhost:3000`. This stays for dev
  mode but is irrelevant in production since Express serves everything. Add a
  comment clarifying this is dev-only.

#### B6. Update `INTEGRATION.md`
- Add a "Standalone deployment" section: `npm start` → single process on one port.
- Keep the existing library/mount sections for advanced users who want to embed
  the widget or server into their own app.

---

### C. More complex recipes

Current recipes (`src/shared/recipes.ts`) use only 4 raw materials (oak_planks,
stick, coal, cobblestone) and most patterns are simple (vertical lines, 2×2 squares,
or hollow frames). Recipes need to be harder so the captcha is more challenging.

#### C1. Add more raw/intermediate items to the item pool
Suggested additions (all recognizable Minecraft items):
- `iron_ingot`, `gold_ingot`, `diamond`, `redstone`, `string`, `leather`,
  `stone`, `glass`, `wool`, `paper`, `sugar_cane`, `blaze_rod`, `ender_pearl`,
  `slime_ball`, `feather`, `flint`, `gravel`, `obsidian`

#### C2. Add multi-material recipes that require distinct items in specific positions
Examples:
- **Iron Pickaxe**: 3 iron_ingot (top row) + 2 stick (center column) — same shape
  as wooden_pickaxe but different materials, forces attention to which item goes where
- **Bow**: string in left column, stick diagonal, string right column — asymmetric
- **Fishing Rod**: 3 stick diagonal + 2 string trailing — diagonal pattern
- **Piston**: 3 oak_planks (top) + cobblestone/iron_ingot/cobblestone (middle) +
  cobblestone/redstone/cobblestone (bottom) — 4 distinct materials
- **Dispenser**: like furnace frame but cobblestone, with a bow in the center and
  redstone at bottom-center — 3 distinct materials
- **Golden Apple**: 8 gold_ingot frame + apple center
- **Bookshelf**: oak_planks top and bottom rows, books middle row
- **Enchanting Table**: book top-center, diamond/obsidian/diamond middle,
  obsidian bottom row — 3 distinct materials
- **Cake**: 3 milk_bucket top, sugar/egg/sugar middle, 3 wheat bottom — 4 materials

#### C3. Add more distractor items
- `createChallenge()` in `src/server/challenge.ts:24-34` selects distractor items.
  With more items in the pool, increase the number of distractors shown to the user
  (currently it shows the required items plus some extras). More distractors = harder.

#### C4. Keep some easy recipes for variety
- Don't remove all simple recipes. A mix of easy and hard prevents frustration while
  still raising the difficulty floor. Tag recipes with a `difficulty` field if
  desired, so the server can weight selection.

#### C5. Update tests
- `verify.test.ts` has recipe-specific assertions (lines 142-166) that test grid
  matching for each recipe. Add test cases for all new recipes.

---

### D. Item images instead of text

Items are currently rendered as text labels (`itemId.replace(/_/g, " ")`) in
`src/client/CraftingTable.ts:87,107`. Replace with Minecraft-style item icons.

#### D1. Source or create item sprite images
- Options:
  - Use a single **sprite sheet** (one PNG with all items in a grid) — fewer HTTP
    requests, standard approach for pixel-art games.
  - Use individual PNGs per item (simpler to manage, fine with HTTP/2).
- Minecraft item textures are 16×16 pixels. Display at 32×32 or 48×48 with
  `image-rendering: pixelated` to keep the pixel-art look crisp.
- Place assets in `public/items/` so Vite copies them to the build output.
  Alternatively, inline small sprites as base64 data URIs in the bundle to avoid
  extra requests (each 16×16 PNG is ~200-400 bytes).

#### D2. Create an item-to-image mapping
- Add a module (e.g., `src/shared/items.ts` or `src/client/itemAssets.ts`) that
  maps each `ItemId` to its image path or sprite-sheet coordinates.
  ```
  oak_planks → items/oak_planks.png  (or sprite offset {x: 0, y: 0})
  iron_ingot → items/iron_ingot.png  (or sprite offset {x: 16, y: 0})
  ...
  ```

#### D3. Update `createDraggableItem()` in `src/client/CraftingTable.ts:82-92`
- Replace `el.textContent = itemId.replace(/_/g, " ")` with an `<img>` element
  (or a `<div>` with `background-image` pointing to the sprite sheet).
- Add `alt` text with the item name for accessibility.
- Keep `draggable="true"` and the drag event handlers unchanged.

#### D4. Update `setupDropTarget()` drop handler in `src/client/CraftingTable.ts:102-109`
- When an item is dropped into a slot, render the image instead of setting
  `textContent`.
- When a slot is cleared (click handler, lines 111-115), remove the image.

#### D5. Update CSS in `src/client/styles.css`
- `.mc-item` and `.mc-slot` need styling adjustments:
  - Remove `font-size: 9px` text sizing from `.mc-slot` (line 55).
  - Add `image-rendering: pixelated` for crisp pixel art.
  - Ensure images are centered and sized to fit the 48×48 slot.
  - Style the item tray items to show the image with the name below or as a tooltip.
- Add hover/tooltip showing the item name so users can still identify items
  they don't recognize visually.

#### D6. Update the CaptchaChallenge response or add an asset manifest
- Other services or the widget need to know where to find images. Options:
  - Serve images from the captcha server (ties into B1 — static file serving).
  - Include image URLs in the `CaptchaChallenge` response alongside `availableItems`.
  - Bundle images into the widget build so no extra requests are needed.
- Bundling into the widget (as inlined base64 or imported assets via Vite) is
  simplest for the standalone app use case.

#### D7. Update tests
- `CraftingTable` tests check DOM content. Update assertions to look for `<img>`
  elements (or background-image styles) instead of text content.

---

## Improvement tasks

### ~~1. Audit and reduce installed packages~~
~~The `package-lock.json` is ~3000 lines of resolved transitive dependencies. Review whether all direct dependencies are still needed (e.g. `tsx` is a runtime dev tool bundled as a production dependency). Move dev-only packages out of `dependencies`, run `npm prune`, and consider lighter alternatives where possible to shrink the dependency tree.~~
Done — moved `tsx` from `dependencies` to `devDependencies` (it is only used as a CLI tool in the `dev:server` script, not imported in source code). Remaining dependencies (`express`) are correctly classified. All checks pass (typecheck, tests, build).

### ~~2. Expand test coverage~~ Done
Test coverage expanded from 2 files / 46 LOC to 5 files / 46 passing tests covering:
- `challenge.ts` — createChallenge, consumeChallenge, TTL expiration, distractors
- `verify.ts` — verifyAnswer, cookie expiration, grid matching, replay protection
- `CraftingTable` — DOM rendering, drag-and-drop, grid state, slot clearing
- `MinecraftCaptcha` — lifecycle, API communication, success/failure callbacks

### 3. Rewrite the README

`main.md` is 7 lines and reads like a placeholder. A proper README should include:

- Project description and a screenshot/gif of the captcha in action
- Quick-start instructions (install, dev server, build)
- Configuration options (env vars, endpoints)
- Links to existing docs (INTEGRATION.md, TECHSTACK.md, wiki/)
- License and contribution guidelines

### 4. Add linting and formatting

No ESLint or Prettier configuration exists. Set up:

- ESLint with recommended TypeScript rules
- Prettier for consistent formatting
- A `lint` npm script and pre-commit hook (e.g. via `lint-staged` + `husky`)

### 5. Add CI/CD pipeline

No automated checks run on commits or pull requests. Set up GitHub Actions to:

- Run `npm run typecheck`
- Run `npm test`
- Run `npm run build`
- Optionally run `npm audit` for security scanning

### 6. Improve server-side input validation and error handling

Current gaps:

- No validation of grid dimensions (must be exactly 3x3) or item ID format
- No request body size limits (potential DoS vector)
- No rate limiting on `/api/captcha/verify` or `/api/captcha/challenge`
- `PORT` env var is not validated (non-numeric values silently become `NaN`)
- `CAPTCHA_SECRET` falls back to a random value, which invalidates all cookies on server restart — warn or require it in production
- No graceful shutdown handlers (SIGTERM/SIGINT)
