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

Sign in at http://localhost:3000/login with `owner@relay.local` / `password` (org slug `acme`). Full seed accounts: [apps/api/README.md](apps/api/README.md). Do not use seed accounts in production.

## Self-host (Docker)

```bash
cp .env.example .env
docker compose up --build
```

- Web: http://localhost:3000
- API: http://localhost:4000/api/v1/health
- API docs: http://localhost:4000/docs
- MinIO S3: http://localhost:9000 (console http://localhost:9001)

Set a long random `TOKEN_SECRET` in `.env` before any real use. Rebuild the web image after changing `NEXT_PUBLIC_API_URL`.

When SMTP is unset, invite and password-reset URLs print in `docker compose logs api`. Compose includes MinIO so avatar and issue uploads work; `pnpm dev` can omit S3 env (uploads return `STORAGE_UNCONFIGURED`).

**Production (HTTPS):** set `NODE_ENV=production`, `WEB_ORIGIN` to the exact web origin, `TRUST_PROXY=1` if the API sits behind a reverse proxy, and SMTP (`SMTP_HOST`, `SMTP_PORT`, `SMTP_USER`, `SMTP_PASS`, `SMTP_FROM`). `NEXT_PUBLIC_API_URL` must be the browser-reachable API origin (rebuild web).

## Docs

- [Docs index](docs/README.md)
- [SCOPE](docs/SCOPE.md) — index; [MVP](docs/SCOPE-MVP.md) / [v1](docs/SCOPE-V1.md)
- [ARCHITECTURE](docs/ARCHITECTURE.md) — system design
- [CIRCLE](docs/CIRCLE.md) — wired vs leftover Circle UI
- [STEPS](docs/STEPS.md) — index; [MVP](docs/STEPS-MVP.md) / [v1](docs/STEPS-V1.md)
- [Step details](docs/steps/) — [MVP](docs/steps/mvp/) / [v1](docs/steps/v1/)
- [Project rules](docs/project-rules/) — coding conventions
- [AGENTS](AGENTS.md) — agent entrypoint
