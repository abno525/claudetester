# Minecraft CAPTCHA

A human-verification widget that replaces traditional CAPTCHAs with an interactive Minecraft crafting table. Users prove they're human by dragging items into a 3×3 grid to craft a target item.

![MIT License](https://img.shields.io/badge/license-MIT-blue.svg)

<!-- TODO: Add a screenshot or gif of the captcha in action -->
<!-- ![Minecraft CAPTCHA demo](docs/demo.gif) -->

## How It Works

1. The server issues a **time-limited challenge** — a target item plus a set of materials (with a few distractors mixed in).
2. The user **drags and drops** materials onto a 3×3 crafting grid to match the recipe.
3. The server **verifies** the grid layout and, on success, sets an HMAC-signed `mc_captcha` cookie.

## Quick Start

### Prerequisites

- Node.js ≥ 18
- npm ≥ 9

### Install and run

```bash
git clone https://github.com/<your-org>/minecraft-captcha.git
cd minecraft-captcha
npm install

# Start the API server (port 3000)
npm run dev:server

# In another terminal — start the widget dev server (port 5173)
npm run dev:widget
```

Open `http://localhost:5173` to see the captcha in action.

### Build for production

```bash
npm run build          # builds both widget and server
npm run preview        # preview the built widget
```

## NPM Scripts

| Script | Description |
|---|---|
| `npm run dev:widget` | Vite dev server with HMR |
| `npm run dev:server` | Express server with hot-reload via tsx |
| `npm run build` | Build widget (ES + UMD) and server |
| `npm run preview` | Preview built widget |
| `npm run typecheck` | Run TypeScript type checking |
| `npm test` | Run tests (Vitest) |
| `npm run test:watch` | Run tests in watch mode |

## Configuration

### Server environment variables

| Variable | Default | Description |
|---|---|---|
| `PORT` | `3000` | Port the Express server listens on |
| `CAPTCHA_SECRET` | Random (per restart) | HMAC key for signing cookies. **Set this in production** to persist cookies across restarts. |
| `NODE_ENV` | `development` | Set to `production` to enable secure cookies |

### Widget options

```ts
new MinecraftCaptcha({
  element: document.getElementById('captcha'),  // container element
  apiUrl: 'https://your-api.com',               // server base URL
  onSuccess: (result) => { /* passed */ },       // success callback
  onFailure: (result) => { /* failed */ },       // failure callback
});
```

## Project Structure

```
src/
├── client/          # Embeddable widget (vanilla TypeScript)
│   ├── index.ts     # MinecraftCaptcha class
│   ├── CraftingTable.ts   # 3×3 grid UI with drag-and-drop
│   └── styles.css   # Minecraft-themed styling
├── server/          # Express API
│   ├── index.ts     # Routes and app setup
│   ├── challenge.ts # Challenge generation (5-min TTL)
│   ├── verify.ts    # Grid verification and cookie signing
│   └── verify.test.ts
└── shared/          # Code shared between client and server
    ├── types.ts     # TypeScript interfaces
    ├── recipes.ts   # Crafting recipe database
    └── recipes.test.ts
```

## Documentation

- **[Integration Guide](INTEGRATION.md)** — embed the widget via script tag, ES module, or React; mount the server standalone or into an existing Express app
- **[Tech Stack](TECHSTACK.md)** — technology choices and rationale (TypeScript, Vite, Express, Vitest)
- **[Wiki](wiki/)** — architecture, crafting system details, API reference, FAQ, and more

## License

[MIT](https://opensource.org/licenses/MIT)

## Contributing

Contributions are welcome! To get started:

1. Fork the repository
2. Create a feature branch (`git checkout -b feature/my-change`)
3. Make your changes and add tests
4. Run `npm test` and `npm run typecheck` to verify
5. Open a pull request
