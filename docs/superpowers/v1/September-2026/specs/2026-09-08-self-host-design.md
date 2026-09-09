# Self-host pack — design

**Date:** 2026-09-08  
**Status:** Implemented  
**Step:** [17-self-host.md](../../../../steps/v1/17-self-host.md)  
**Parent:** [2026-08-27-v1-product-design.md](../../August-2026/specs/2026-08-27-v1-product-design.md)

## Goal

One-command bring-up of web + API + Postgres. Production env documented. Smoke the v1 path on a clean compose stack.

## Decisions locked

| Topic | Choice |
|-------|--------|
| Services | Existing `docker-compose.yml` grows `api` and `web`. No nginx/Caddy. No Mailhog |
| Images | Multi-stage Dockerfiles at `apps/api/Dockerfile` and `apps/web/Dockerfile`. Build context is the **repo root** |
| One-command | `cp .env.example .env` then `docker compose up --build` |
| Local compose `NODE_ENV` | **`development`**. HTTP on localhost; cookies stay `SameSite=Lax` / not Secure; invite URLs print in `docker compose logs api` when SMTP is unset |
| Production overlay | Documented in `.env.example` comments + README: `NODE_ENV=production`, `TRUST_PROXY=1`, HTTPS `WEB_ORIGIN`, SMTP. Rebuild web after changing `NEXT_PUBLIC_API_URL` |
| API start | `prisma migrate deploy` then `node dist/index.js`. Do not seed |
| API build | `prisma generate` + `tsc` + `tsc-alias` + copy `src/generated` → `dist/generated` (path aliases and Prisma client must work under `node`, not only `tsx`) |
| Web build | Next `output: 'standalone'` with `outputFileTracingRoot` at the monorepo root. `NEXT_PUBLIC_API_URL` is a **build-time** ARG (browser origin of the API, default `http://localhost:4000`) |
| Ports | Host `3000` (web), `4000` (api), `5432` (Postgres, same as today) |
| Secrets | Runtime env only. Never bake `TOKEN_SECRET` / SMTP passwords into images |
| Leftover Circle | Already hidden from live nav. Do not reintroduce. Do not delete files |
| Cookie code | Unchanged. Production HTTPS still uses Secure + SameSite=None via `NODE_ENV=production` |

## Compose

```text
Browser → http://localhost:3000 (web)
                ↓ NEXT_PUBLIC_API_URL
         http://localhost:4000 (api)
                ↓ DATABASE_URL host `db`
            postgres:16-alpine
```

- `db` healthcheck: `pg_isready`
- `api` depends on healthy `db`; healthcheck `GET /api/v1/health`
- `web` depends on healthy `api`
- Compose `env_file`: repo-root `.env` (from `.env.example`)
- `DATABASE_URL` inside the API container uses hostname `db`, not `localhost`

## Env

**Root `.env.example`** (compose): all vars compose interpolates, including `NEXT_PUBLIC_API_URL`.

**`apps/api/.env.example`** (pnpm dev): keep local `DATABASE_URL=...@localhost:5432/...`. Must **list** (commented is fine): `WEB_ORIGIN`, `NODE_ENV=production`, `TRUST_PROXY`, SMTP.

**`apps/web/.env.example`:** still `NEXT_PUBLIC_API_URL=http://localhost:4000`.

## Docs

Root README: one-command bring-up, ports, “invite link is in API logs when SMTP is unset”, production HTTPS notes, do not use seed accounts in production.

ARCHITECTURE: compose brings up web + api + db, not Postgres-only.

## Smoke (clean stack, no seed)

Register → create org → invite (copy URL from `docker compose logs api`) → comment → label → cycle → inbox → save view. Leftover Circle routes stay out of live nav.

## Tests

- `pnpm --filter @relay/api build` produces a runnable `dist/` (`tsc-alias` + generated Prisma client present)
- `docker compose config` is valid
- After `docker compose up --build`: `GET http://localhost:4000/api/v1/health` and `GET http://localhost:3000` succeed; `POST /api/v1/auth/register` returns 201

Do not add a Docker test to the Node test runner.

## Out of scope

- Hosted SaaS / cloud deploy target
- Reverse proxy, TLS termination, Mailhog
- Billing, SSO, AI
- Changing leftover Circle hide/show
- Auto-seed on compose up
