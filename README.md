# Minecraft CAPTCHA

A human-verification widget that replaces traditional CAPTCHAs with an interactive Minecraft crafting table. Users prove they're human by dragging items into a 3x3 grid to craft a target item.

[![MIT License](https://img.shields.io/badge/license-MIT-blue.svg)](https://opensource.org/licenses/MIT)
[![Node.js](https://img.shields.io/badge/node-%E2%89%A518-brightgreen.svg)](https://nodejs.org/)
[![TypeScript](https://img.shields.io/badge/TypeScript-5.7-blue.svg)](https://www.typescriptlang.org/)
[![Express](https://img.shields.io/badge/Express-5-lightgrey.svg)](https://expressjs.com/)

<!-- TODO: Add a screenshot or gif of the captcha in action -->
<!-- ![Minecraft CAPTCHA demo](docs/demo.gif) -->

## How It Works

1. The server issues a **time-limited challenge** -- a target item plus a set of materials (with a few distractors mixed in).
2. The user **drags and drops** materials onto a 3x3 crafting grid to match the recipe.
3. The server **verifies** the grid layout and, on success, sets a signed JWT (ES256) `mc_captcha` cookie.

## Quick Start

### Prerequisites

- Node.js >= 18
- npm >= 9

### Install and run (development)

```bash
git clone https://github.com/abno525/claudetester.git
cd claudetester
npm install

# Start both widget dev server and API server together
npm run dev
```

Open `http://localhost:5173` to see the captcha in action. The Vite dev server proxies API requests to Express on port 3000.

### Manual Deployment (without Docker)

**Requirements:** Node.js >= 18, npm >= 9

1. **Generate an ES256 key pair** (if you don't have one):

```bash
openssl ecparam -name prime256v1 -genkey -noout -out ec-private.pem
openssl ec -in ec-private.pem -pubout -out ec-public.pem
```

2. **Install, build, and start:**

```bash
git clone https://github.com/abno525/claudetester.git
cd claudetester
npm install
npm run build
```

3. **Set environment variables and launch:**

```bash
export NODE_ENV=production
export PORT=3000
export CAPTCHA_PRIVATE_KEY_PATH="./ec-private.pem"
export CAPTCHA_PUBLIC_KEY_PATH="./ec-public.pem"

node dist/server/index.js
```

The server will serve both the API (`/api/captcha/*`) and the built widget UI on `http://localhost:3000`.

> In development (without key files), omit the key paths and the server will generate an ephemeral key pair automatically. Tokens will not survive restarts.

### Docker Deployment

```bash
docker compose up --build
```

See the [Docker Deployment](https://github.com/abno525/claudetester/wiki/Docker-Deployment) wiki page for production configuration with persistent keys.

## NPM Scripts

| Script               | Description                            |
| -------------------- | -------------------------------------- |
| `npm run dev:widget` | Vite dev server with HMR               |
| `npm run dev:server` | Express server with hot-reload via tsx |
| `npm run build`      | Build widget (ES + UMD) and server     |
| `npm run preview`    | Preview built widget                   |
| `npm run typecheck`  | Run TypeScript type checking           |
| `npm test`           | Run tests (Vitest)                     |
| `npm run test:watch` | Run tests in watch mode                |
| `npm run lint`       | Lint with ESLint                       |
| `npm run format`     | Format with Prettier                   |

## Configuration

### Server environment variables

| Variable                   | Default | Description                                                   |
| -------------------------- | ------- | ------------------------------------------------------------- |
| `PORT`                     | `3000`  | Port the Express server listens on (validated: 0-65535)       |
| `CAPTCHA_PRIVATE_KEY_PATH` | --      | Path to ES256 private key PEM file (required in production)   |
| `CAPTCHA_PUBLIC_KEY_PATH`  | --      | Path to ES256 public key PEM file (required in production)    |
| `NODE_ENV`                 | --      | Set to `production` to enable secure cookies and require keys |

### Widget options

```ts
new MinecraftCaptcha({
  element: document.getElementById("captcha"), // container element
  apiUrl: "https://your-api.com", // server base URL
  onSuccess: (result) => {
    /* passed */
  }, // success callback
  onFailure: (result) => {
    /* failed */
  }, // failure callback
});
```

## Project Structure

```
src/
├── client/                      # Embeddable widget (vanilla TypeScript)
│   ├── index.ts                 # MinecraftCaptcha class entry point
│   ├── CraftingTable.ts         # 3x3 grid UI with drag-and-drop
│   ├── CraftingTable.test.ts    # CraftingTable tests
│   ├── MinecraftCaptcha.test.ts # Widget integration tests
│   └── styles.css               # Minecraft-themed styling
├── server/                      # Express API
│   ├── index.ts                 # Routes and app setup
│   ├── challenge.ts             # Challenge generation (5-min TTL)
│   ├── challenge.test.ts        # Challenge tests
│   ├── verify.ts                # Grid verification and cookie signing
│   └── verify.test.ts           # Verification tests
└── shared/                      # Code shared between client and server
    ├── types.ts                 # TypeScript interfaces
    ├── recipes.ts               # Crafting recipe database
    └── recipes.test.ts          # Recipe tests
```

## Documentation

- **[Wiki](https://github.com/abno525/claudetester/wiki)** -- integration guide, architecture, tech stack, crafting system, API reference, deployment, FAQ, and more

## License

[MIT](https://opensource.org/licenses/MIT)

## Contributing

Contributions are welcome! To get started:

1. Fork the repository
2. Create a feature branch (`git checkout -b feature/my-change`)
3. Make your changes and add tests
4. Run `npm test` and `npm run typecheck` to verify
5. Open a pull request
