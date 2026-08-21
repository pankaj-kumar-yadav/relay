# Step 1 — Monorepo setup

**Status:** Done

## Goal

Create a Turborepo + pnpm workspace with separate `web` and `api` apps, plus root docs for agents.

## Why

- One git repo for product + docs
- Frontend and backend evolve together without coupling code
- `pnpm dev` can run both apps
- Agents read scope/architecture from the root

## What was created

| Path | Role |
|------|------|
| `package.json` | Root scripts (`dev`, `build`, `lint`) + turbo/prettier |
| `pnpm-workspace.yaml` | `apps/*`, `packages/*` |
| `turbo.json` | `dev` / `build` / `lint` task graph |
| `apps/web` | Next.js placeholder on port 3000 |
| `apps/api` | Express `/health` on port 4000 |
| `docs/` | SCOPE, ARCHITECTURE, STEPS |
| `AGENTS.md` | Agent entrypoint |

## Commands (verify anytime)

```bash
pnpm install
cp apps/api/.env.example apps/api/.env
cp apps/web/.env.example apps/web/.env.local
pnpm dev
```

Smoke checks:

- Open http://localhost:3000 — Relay placeholder page
- Open http://localhost:4000/health — `{ "ok": true, "service": "relay-api" }`

Single app:

```bash
pnpm --filter @relay/web dev
pnpm --filter @relay/api dev
```

## Done when

- [x] Workspace installs with pnpm
- [x] `turbo` can build `@relay/web` and `@relay/api`
- [x] Health endpoint responds
- [x] Docs exist at repo root / `docs/`

## Next

[02-circle-ui.md](./02-circle-ui.md)
