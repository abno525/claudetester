# Technology Stack

## Overview

Minecraft Captcha is split into two packages shipped from a single repository:

| Layer                       | What ships                                                           | Key tech                        |
| --------------------------- | -------------------------------------------------------------------- | ------------------------------- |
| **Widget** (`dist/widget/`) | A framework-agnostic JS bundle + CSS that any page can embed         | TypeScript, Vite (library mode) |
| **Server** (`dist/server/`) | A Node.js module that generates challenges and verifies answers      | TypeScript, Express             |
| **Shared** (`src/shared/`)  | Types and recipe data used by both sides (compiled into each bundle) | TypeScript                      |

---

## Technologies & Reasoning

### TypeScript 5 (entire codebase)

**Why:** The crafting-grid model (3×3 nullable arrays, item IDs, recipe patterns) benefits from static types — mistakes like putting a number where an `ItemId` belongs are caught at compile time. Shared types between client and server eliminate a whole class of serialization bugs.

### Vite 6 (widget build)

**Why:** Vite's library mode produces a single ES module **and** a UMD bundle from the same entry point. This means the widget can be consumed as:

- `<script src="minecraft-captcha.umd.cjs">` (classic)
- `import { MinecraftCaptcha } from "minecraft-captcha/widget"` (modern)

Vite also gives us instant HMR during development and handles CSS injection automatically (the stylesheet is bundled into the JS output or emitted as a separate `.css` file).

### Vanilla TypeScript — no UI framework (widget)

**Why:** The captcha widget must be embeddable in React, Vue, Svelte, plain HTML, or anything else. Shipping a framework dependency (React DOM alone is ~40 kB gzipped) would bloat the widget and create version conflicts with the host app. The crafting-table UI is a small, self-contained DOM tree — vanilla TS with drag-and-drop events is sufficient.

### Express 5 (server)

**Why:** Express is the most widely understood Node.js HTTP framework. The server surface is tiny (two routes: `POST /challenge`, `POST /verify`), so a minimal framework keeps things simple. Express 5 is used over v4 for its native async error handling and modern routing.

### Node.js `crypto` (server — challenge tokens & cookie signing)

**Why:** Built-in, zero-dependency, audited. Used for:

- `crypto.randomUUID()` — generating challenge IDs
- `crypto.createHmac("sha256", ...)` — signing captcha cookies so they can't be forged
- `crypto.timingSafeEqual()` — constant-time comparison to prevent timing attacks on cookie verification

### Vitest 3 (testing)

**Why:** Vitest shares Vite's config and transform pipeline, so TypeScript + ESM works out of the box with zero extra setup. It is API-compatible with Jest (describe/it/expect) and runs tests in parallel.

---

## Project Structure

```
├── src/
│   ├── client/           # Frontend captcha widget
│   │   ├── index.ts      # Public API — MinecraftCaptcha class
│   │   ├── CraftingTable.ts  # 3×3 grid UI with drag-and-drop
│   │   └── styles.css    # Minecraft-themed pixel-art styles
│   ├── server/           # Backend verification server
│   │   ├── index.ts      # Express app, routes
│   │   ├── challenge.ts  # Challenge generation & storage
│   │   └── verify.ts     # Answer verification & cookie signing
│   └── shared/           # Used by both client and server
│       ├── types.ts      # CraftingGrid, Recipe, CaptchaChallenge, etc.
│       └── recipes.ts    # Built-in Minecraft crafting recipes
├── index.html            # Dev page (served by Vite dev server)
├── package.json
├── tsconfig.json         # Base TS config
├── tsconfig.server.json  # Server-specific TS config
└── vite.config.ts        # Widget build + dev server config
```

---

## NPM Scripts

| Script               | Purpose                                                        |
| -------------------- | -------------------------------------------------------------- |
| `npm run dev:widget` | Start Vite dev server with HMR (proxies `/api` to the backend) |
| `npm run dev:server` | Start the Express server with hot-reload via `tsx watch`       |
| `npm run build`      | Build both the widget bundle and the server                    |
| `npm test`           | Run all tests with Vitest                                      |
| `npm run typecheck`  | Type-check the entire project without emitting                 |
