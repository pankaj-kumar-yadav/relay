# Relay — architecture

## Shape

```text
Browser → apps/web (Next.js :3000)
                ↓ HTTP (credentials: include)
         apps/api (Express :4000)
                ↓ Prisma
            PostgreSQL
```

- **Monorepo**: pnpm workspaces + Turborepo at repo root
- **Web**: UI only; `NEXT_PUBLIC_API_URL` points at the API
- **Web HTTP**: `apps/web/services/*.service.ts` is the only place that calls `api()`; HTTP fns are named `*Api`; UI reads/writes server state with TanStack Query
- **Constants**: named consts/enums live only in `constants/*.constant.ts` (`apps/api/src/constants/`, `apps/web/constants/`); web imports those files instead of hardcoding domain codes
- **API**: auth, tenancy, business logic, DB access
- **ORM**: Prisma (PostgreSQL)
- **Shared packages**: optional later (`packages/shared` for Zod/types)

## Multi-tenant rules

- Every domain row that belongs to an org includes `organization_id`
- Resolve the current user from the session/token, then verify membership for the requested org
- Never authorize solely from URL `orgId` / client-supplied tenant IDs
- Membership via `memberships` join (not `organization_id` on `users`); public route id is org **slug**
- Org-scoped handlers: `requireAuth` → `requireOrgMember` → query with `req.org.id` (never raw route/body org ids alone)
- Invites: admin `POST /api/v1/orgs/:slug/invites`; accept `POST /api/v1/invites/:token/accept` (email must match)
- Detail: [steps/05-multi-tenant.md](./steps/05-multi-tenant.md); design: [superpowers/specs/2026-08-21-organizations-memberships-design.md](./superpowers/specs/2026-08-21-organizations-memberships-design.md)

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
- Detail: [steps/04-auth.md](./steps/04-auth.md); design: [superpowers/specs/2026-08-21-access-refresh-keystore-design.md](./superpowers/specs/2026-08-21-access-refresh-keystore-design.md)

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
| Postgres| 5432 (`docker compose up -d`) |

## CORS and cookies

- **Local:** web `http://localhost:3000`, API `http://localhost:4000`. CORS allows `WEB_ORIGIN` with `credentials: true`. Cookies are `HttpOnly`, `Secure=false`, `SameSite=Lax`.
- **Production:** set `WEB_ORIGIN` to the exact web origin (no wildcards). Serve both apps over HTTPS. Cookies become `Secure=true` and `SameSite=None` when `NODE_ENV=production`. Set `TRUST_PROXY=1` if the API sits behind a reverse proxy so rate limits see the real client IP.

`NODE_ENV` is only `development` or `production` (never `test`). Tests run as development; skip rate limits in the Node test runner via `NODE_TEST_CONTEXT`.

JSON request bodies are capped at `256kb` (`JSON_BODY_LIMIT`).

## Circle UI

`apps/web` starts as a placeholder. Replace/merge with [Circle](https://github.com/ln-dev7/circle) under `apps/web`, then swap `mock-data` / Zustand mutations for API calls.

## Email (v1, step 16)

Transactional mail is SMTP via nodemailer (`SMTP_HOST`, `SMTP_PORT`, `SMTP_USER`, `SMTP_PASS`, `SMTP_FROM`). If SMTP is unset in development, the API logs the link (same pattern as invite URLs today). Inbox notifications stay in-app only (polling).

## Implementation steps

Follow [STEPS.md](./STEPS.md) ([MVP](./STEPS-MVP.md) done, [v1](./STEPS-V1.md) current). Detail in [steps/](./steps/). Current step: [13-cycles.md](./steps/13-cycles.md). Do not skip auth/tenancy before wiring real issue data into the UI.
