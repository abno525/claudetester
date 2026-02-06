To do:
~~Create a stack that can be reused.~~ Done — see TECHSTACK.md
~~Create a description of technologies used and reasoning behind them.~~ Done — see TECHSTACK.md
~~Create implementation guide into already existing solutions.~~ Done — see INTEGRATION.md
Implement frontend gui.
Implement logic for captcha cookie.

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
