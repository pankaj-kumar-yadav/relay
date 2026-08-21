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
  docs/           # SCOPE, ARCHITECTURE, STEPS, step details
  AGENTS.md
  turbo.json
  pnpm-workspace.yaml
```

## Ports

| App | URL |
|-----|-----|
| Web | http://localhost:3000 |
| API | http://localhost:4000 |

## Environment files

| App | File | Purpose |
|-----|------|---------|
| API | `apps/api/.env` | `PORT`, `WEB_ORIGIN`, `DATABASE_URL`, `TOKEN_SECRET`, `TOKEN_ISSUER`, `TOKEN_AUDIENCE` |
| Web | `apps/web/.env.local` | `NEXT_PUBLIC_API_URL` |

Never commit real secrets. Keep `.env.example` files updated when new vars are added.

## Definition of done for the whole MVP

See [SCOPE.md](../SCOPE.md) success criteria:

- Create org → invite member → create/edit issues in that org
- Org A cannot see Org B data
- Production path does not depend on Circle mock-data

## Next

Proceed to [01-monorepo.md](./01-monorepo.md) (already completed) or jump to [02-circle-ui.md](./02-circle-ui.md).
