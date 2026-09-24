# Relay

Self-hosted, multi-tenant project management for teams.

Issues, projects, teams, cycles, and inbox — with organization-scoped data, invite-based membership, and Docker-based self-hosting. The backend is a first-party Express API on PostgreSQL.

## Interface

The web interface is **[Circle](https://github.com/ln-dev7/circle)** by [Léonard Nukoua (ln-dev7)](https://github.com/ln-dev7) / [lndev-ui](https://github.com/lndev-ui) — a Linear-inspired project management UI built with Next.js, Tailwind CSS, and [shadcn/ui](https://ui.shadcn.com/).

Relay does not replace that UI. Circle lives in `apps/web`; this project wires live API data into the existing screens.

Circle is MIT-licensed. Original repository: [github.com/ln-dev7/circle](https://github.com/ln-dev7/circle). License copy: [`apps/web/LICENSE.md`](apps/web/LICENSE.md).

## Features

- **Organizations** — multi-tenant workspaces (slug URLs, admin / employee roles)
- **Issues** — status, priority, assignee, labels, comments, activity, file attachments
- **Teams & projects** — team home, backlog / active, project issue lists
- **Cycles** — per-team timeboxes
- **Inbox** — in-app notifications; optional email for comments, assignees, and status changes
- **Saved views** — filtered issue lists
- **Auth** — register, login, session refresh, password reset, email invites
- **Files** — S3-compatible storage (AWS / Backblaze via `apps/api/.env`; optional MinIO Compose profile)
- **Self-host** — Docker Compose for web, API, and Postgres

Some Circle screens remain in the repository but are hidden from live navigation. Wired versus leftover surfaces: [docs/CIRCLE.md](docs/CIRCLE.md).

## Stack

| Layer | Choice |
|-------|--------|
| Web | Next.js 15, TypeScript, TanStack Query |
| UI | [Circle](https://github.com/ln-dev7/circle) + shadcn/ui + Tailwind CSS |
| API | Node.js, Express, TypeScript |
| Database | PostgreSQL + Prisma |
| Email | nodemailer (SMTP; links logged if unset) |
| Files | S3-compatible object store |
| Monorepo | pnpm workspaces + Turborepo |

## Structure

```text
relay/
  apps/
    web/          # Next.js UI (Circle + API wiring)
    api/          # Express API
  packages/
    shared/       # shared constants
  docs/           # product, architecture, step guides
```

## Prerequisites

- Node.js 22+
- pnpm 10+
- PostgreSQL 16 (or Docker Compose)

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

| Service | URL |
|---------|-----|
| Web | http://localhost:3000 |
| API | http://localhost:4000/api/v1/health |
| API docs | http://localhost:4000/docs |

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
cp apps/api/.env.example apps/api/.env
docker compose up --build
```

| Service | URL |
|---------|-----|
| Web | http://localhost:3000 |
| API | http://localhost:4000/api/v1/health |
| API docs | http://localhost:4000/docs |

Root `.env` only needs `NEXT_PUBLIC_API_URL`. API secrets (including `TOKEN_SECRET` and `S3_*`) live in `apps/api/.env`. Compose loads that file and overrides `DATABASE_URL` to use host `db`. Rebuild the web image after changing `NEXT_PUBLIC_API_URL`.

When SMTP is unset, invite and password-reset URLs print in `docker compose logs api`. Set `S3_*` in `apps/api/.env` for uploads; unset → `STORAGE_UNCONFIGURED`. Optional local MinIO: `docker compose --profile minio up` (then point `S3_*` at `http://localhost:9000` / `http://minio:9000`).

**Production (HTTPS):** set `NODE_ENV=production`, `WEB_ORIGIN` to the exact web origin, `TRUST_PROXY=1` if the API sits behind a reverse proxy, and SMTP (`SMTP_HOST`, `SMTP_PORT`, `SMTP_USER`, `SMTP_PASS`, `SMTP_FROM`) in `apps/api/.env` (or the host env). `NEXT_PUBLIC_API_URL` must be the browser-reachable API origin (rebuild web).

## Docs

- [Docs index](docs/README.md)
- [SCOPE](docs/SCOPE.md) — product scope
- [ARCHITECTURE](docs/ARCHITECTURE.md) — system design and tenancy
- [CIRCLE](docs/CIRCLE.md) — wired vs leftover Circle UI
- [STEPS](docs/STEPS.md) — implementation roadmap

## Credits

- **UI:** [Circle](https://github.com/ln-dev7/circle) by [ln-dev7](https://github.com/ln-dev7) / [lndev-ui](https://github.com/lndev-ui) (MIT)
- **API & product:** Relay — Express, PostgreSQL, and the wiring that turns Circle into a self-hosted application
