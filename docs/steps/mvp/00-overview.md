# Step 0 — Overview

## What we are building

Relay is a **multi-tenant project management** product:

- **UI**: Linear-inspired interface based on [Circle](https://github.com/ln-dev7/circle)
- **API**: Node.js + Express + TypeScript
- **DB**: PostgreSQL

The monorepo root owns product docs and tooling. Apps live under `apps/`.

## Repo map

```text
relay/
  apps/
    web/          # Next.js UI
    api/          # Express API
  packages/       # shared packages (later)
  docs/           # SCOPE index + SCOPE-MVP / SCOPE-V1 / SCOPE-V2, STEPS, architecture
  AGENTS.md
  turbo.json
  pnpm-workspace.yaml
```

## Ports

| App | URL |
|-----|-----|
| Web | http://localhost:3000 |
| API | http://localhost:4000/api/v1 |

## Environment files

| App | File | Purpose |
|-----|------|---------|
| API | `apps/api/.env` | App, Database, Auth, Storage (`S3_*`), Email (`SMTP_*`). Compose loads this file and overrides `DATABASE_URL` host to `db`. |
| Web | `apps/web/.env.local` | `NEXT_PUBLIC_API_URL` |
| Compose | `.env` (from `.env.example`) | `NEXT_PUBLIC_API_URL` only (web image build arg). |

Never commit real secrets. Keep `.env.example` files updated when new vars are added.

## Definition of done

**MVP (steps 1–9)** is done: see [SCOPE-MVP.md](../../SCOPE-MVP.md) — create org → invite member → create/edit issues; org A cannot see org B.

**v1 (steps 10–17)** is done: see [SCOPE-V1.md](../../SCOPE-V1.md) — self-host, invite via email, comments → labels → cycles → inbox → saved views, leftover Circle hidden.

**v2 (steps 18–20):** see [SCOPE-V2.md](../../SCOPE-V2.md) — subscribe, inbox email, avatars + issue files.

## Next

Current release: [SCOPE-V2.md](../../SCOPE-V2.md) / [STEPS-V2.md](../../STEPS-V2.md). Billing, SSO, realtime, and AI stay out.
