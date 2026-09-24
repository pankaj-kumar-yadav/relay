# Relay — architecture

## Shape

```text
Browser → Next.js :3000 → Express :4000 → Prisma → PostgreSQL
Email: API → nodemailer SMTP
Files: Browser ─presigned PUT/GET─► S3 / Backblaze (optional MinIO)
Inbox: TanStack Query polling
```

- **Monorepo**: pnpm workspaces + Turborepo at repo root
- **Web**: UI only; `NEXT_PUBLIC_API_URL` points at the API
- **Web HTTP**: `apps/web/services/*.service.ts` is the only place that calls `api()`; HTTP fns are named `*Api`; UI reads/writes server state with TanStack Query
- **Constants**: shared values live in `@relay/shared/constants`; app `constants/` files are only for extras (paths, copy, API-only knobs)
- **API**: auth, tenancy, business logic, DB access
- **ORM**: Prisma (PostgreSQL)
- **Shared packages**: `@relay/shared` groups by kind (`src/constants/` now; `types/`, `components/` later). Apps import shared constants directly; app `constants/` files are only for extras

## Multi-tenant rules

- Every domain row that belongs to an org includes `organization_id`
- Resolve the current user from the session/token, then verify membership for the requested org
- Never authorize solely from URL `orgId` / client-supplied tenant IDs
- Membership via `memberships` join (not `organization_id` on `users`); public route id is org **slug**
- Org-scoped handlers: `requireAuth` → `requireOrgMember` → query with `req.org.id` (never raw route/body org ids alone)
- Invites: admin `POST /api/v1/orgs/:slug/invites`; accept `POST /api/v1/invites/:token/accept` (email must match)
- Detail: [steps/mvp/05-multi-tenant.md](./steps/mvp/05-multi-tenant.md); design: [superpowers/mvp/August-2026/specs/2026-08-21-organizations-memberships-design.md](./superpowers/mvp/August-2026/specs/2026-08-21-organizations-memberships-design.md)

## Roles

- **Super-admin**: platform SaaS owner (`users.is_super_admin`)
- **Org membership roles**: `admin` | `employee` — an org may have many admins and many employees (step 5)

## Auth

- Dual JWT HttpOnly cookies (brand-prefixed via `BRAND_SLUG`): `relay_accessToken` (15m) + `relay_refreshToken` (1d)
- Payload: `{ iss, aud, sub, prm, iat, exp }` (HS256); `prm` binds to Prisma `KeyStore` (`primaryKey` on access, `secondaryKey` on refresh)
- Login/register: create `KeyStore` row → set both cookies; logout: delete current keystore → clear cookies
- `POST /api/v1/auth/refresh`: decode (possibly expired) access + validate refresh → match keystore → delete → re-issue pair
- `requireAuth`: validate access JWT → load user → require active keystore for `prm`
- Endpoints (all under `/api/v1`): `POST /auth/register`, `POST /auth/login`, `POST /auth/logout`, `GET /auth/session`, `POST /auth/refresh`
- Web (`apps/web/lib/api.ts`): `credentials: 'include'`; prepends `API_PREFIX` (`/api/v1`); one-shot `/auth/refresh` then retry on `401` / `TOKEN_EXPIRED`
- Cookie flags: local `secure: false`, `sameSite: 'lax'`; prod `secure: true`, `sameSite: 'none'`
- CORS allows `WEB_ORIGIN` with credentials
- Passwords hashed with `bcryptjs`
- Env: `TOKEN_SECRET`, `TOKEN_ISSUER`, `TOKEN_AUDIENCE` (optional `ACCESS_TOKEN_VALIDITY_SEC` / `REFRESH_TOKEN_VALIDITY_SEC`)
- Detail: [steps/mvp/04-auth.md](./steps/mvp/04-auth.md); design: [superpowers/mvp/August-2026/specs/2026-08-21-access-refresh-keystore-design.md](./superpowers/mvp/August-2026/specs/2026-08-21-access-refresh-keystore-design.md)

## API response shape

Every JSON body from `apps/api`:

```json
{
  "success": true,
  "message": "OK",
  "data": {},
  "error": null
}
```

On failure, `success` is `false`, `data` is `null`, and `error` is `{ "code", "message" }`. Helpers: `sendSuccess` / `sendError`. Web client unwraps `data`.

## API docs

Development and production: Scalar at `GET /docs` and the generated spec at `GET /api/v1/openapi.json` (not the business envelope). OpenAPI `servers` is `/api/v1`; path items stay `/health`, `/auth/login`, …. Cookie session for `apps/web`. See [project-rules/api-rules.md](./project-rules/api-rules.md).

## Local ports

| Service | Default |
|---------|---------|
| Web     | 3000    |
| API     | 4000 (`/api/v1`; docs at `/docs`) |
| Postgres| 5432 |
| MinIO (optional profile) | 9000 (S3 API; console 9001) |

`docker compose up --build` runs **web + API + Postgres**. API env comes from `apps/api/.env` (root `.env` is `NEXT_PUBLIC_API_URL` only). Local `pnpm dev` expects Postgres on `localhost:5432`. S3 env is optional; unset storage returns `STORAGE_UNCONFIGURED` on upload. Optional MinIO: `docker compose --profile minio up`.

## CORS and cookies

- **Local:** web `http://localhost:3000`, API `http://localhost:4000`. CORS allows `WEB_ORIGIN` with `credentials: true`. Cookies are `HttpOnly`, `Secure=false`, `SameSite=Lax`.
- **Production:** set `WEB_ORIGIN` to the exact web origin (no wildcards). Serve both apps over HTTPS. Cookies become `Secure=true` and `SameSite=None` when `NODE_ENV=production`. Set `TRUST_PROXY=1` if the API sits behind a reverse proxy so rate limits see the real client IP.

`NODE_ENV` is only `development` or `production` (never `test`). Tests run as development; skip rate limits in the Node test runner via `NODE_TEST_CONTEXT`. API tests use `node:test`; HTTP harness is `apps/api/src/test/http.ts` (`@/test/http.js`).

JSON request bodies are capped at `256kb` (`JSON_BODY_LIMIT`).

## Circle UI

`apps/web` starts as a placeholder. Replace/merge with [Circle](https://github.com/ln-dev7/circle) under `apps/web`, then swap `mock-data` / Zustand mutations for API calls.

## Email (v1, step 16)

Transactional mail is SMTP via nodemailer (`SMTP_HOST`, `SMTP_PORT`, `SMTP_USER`, `SMTP_PASS`, `SMTP_FROM`). If SMTP is unset in development, the API logs the link. Inbox events also email after the notify transaction commits (step 19).

## Files (v2, step 20)

S3-compatible object store (`S3_ENDPOINT`, `S3_PUBLIC_ENDPOINT`, `S3_REGION`, `S3_BUCKET`, `S3_ACCESS_KEY`, `S3_SECRET_KEY`, `S3_FORCE_PATH_STYLE`) in `apps/api/.env`. Browser uses presigned PUT/GET; Express stores metadata only. Unset credentials → `STORAGE_UNCONFIGURED`. Optional MinIO via Compose profile `minio`.

## Implementation steps

Follow [STEPS.md](./STEPS.md) ([MVP](./STEPS-MVP.md) done, [v1](./STEPS-V1.md) done, [v2](./STEPS-V2.md) current). Detail in [steps/mvp/](./steps/mvp/), [steps/v1/](./steps/v1/), and [steps/v2/](./steps/v2/). Do not skip auth/tenancy before wiring real issue data into the UI.
