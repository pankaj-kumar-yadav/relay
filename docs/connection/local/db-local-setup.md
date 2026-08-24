# Local DB Runbook

Use this to spin up PostgreSQL for Relay in local development.

## Prerequisites

- Docker Desktop running
- `pnpm install` already done

## 1) Create env file

From repo root:

```bash
cp apps/api/.env.example apps/api/.env
```

Required DB value in `apps/api/.env`:

```env
DATABASE_URL=postgresql://relay:relay@localhost:5432/relay
```

## 2) Start Postgres

From repo root:

```bash
docker compose up -d
```

This uses `docker-compose.yml` and starts:

- host: `localhost`
- port: `5432`
- db: `relay`
- user/password: `relay` / `relay`

## 3) Run migrations + Prisma client generation

```bash
pnpm --filter @relay/api db:migrate
pnpm --filter @relay/api db:generate
```

## 4) Seed data (optional, recommended)

```bash
pnpm --filter @relay/api db:seed
```

Seed user:

- email: `owner@relay.local`
- password: `password`

## 5) Run API

```bash
pnpm --filter @relay/api dev
```

## Useful commands

Check DB container status:

```bash
docker compose ps
```

Stop DB:

```bash
docker compose down
```

Stop DB + delete data volume (full reset):

```bash
docker compose down -v
```

If you reset volume, run migrations and seed again.
