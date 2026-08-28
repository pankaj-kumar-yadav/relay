# Relay

Multi-tenant project management. UI inspired by Linear ([Circle](https://github.com/ln-dev7/circle) starter); API is Express + PostgreSQL.

## Structure

```text
relay/
  apps/
    web/     # Next.js UI (placeholder → Circle)
    api/     # Express API
  packages/  # shared packages (later)
  docs/      # product + architecture
```

## Prerequisites

- Node.js 22+
- pnpm 10+

## Setup

```bash
pnpm install
cp apps/api/.env.example apps/api/.env
cp apps/web/.env.example apps/web/.env.local
```

## Develop

```bash
pnpm dev
```

- Web: http://localhost:3000
- API: http://localhost:4000/api/v1/health
- API docs: http://localhost:4000/docs

Run one app:

```bash
pnpm --filter @relay/web dev
pnpm --filter @relay/api dev
```

## Seed + local login

```bash
pnpm --filter @relay/api db:seed
```

Sign in at http://localhost:3000/login with `owner@relay.local` / `password` (org slug `acme`). Full seed accounts: [apps/api/README.md](apps/api/README.md).

## Docs

- [Docs index](docs/README.md)
- [SCOPE](docs/SCOPE.md) — index; [MVP](docs/SCOPE-MVP.md) / [v1](docs/SCOPE-V1.md)
- [ARCHITECTURE](docs/ARCHITECTURE.md) — system design
- [STEPS](docs/STEPS.md) — index; [MVP](docs/STEPS-MVP.md) / [v1](docs/STEPS-V1.md)
- [Step details](docs/steps/) — how to execute each step
- [Project rules](docs/project-rules/) — coding conventions
- [AGENTS](AGENTS.md) — agent entrypoint
