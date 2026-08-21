# JWT auth + Postgres (Prisma) — design

**Date:** 2026-08-21  
**Status:** Approved for planning  
**Scope:** Steps 3 (users only) + 4 — API JWT auth and web login/register wired to API  
**Reference:** `ekalakaar-personal-expense-tracker` backend (Express + JWT HttpOnly cookie + bcrypt), adapted to PostgreSQL

## Goal

Users can register and log in against a real Postgres `users` table. Auth uses a JWT stored in an HttpOnly cookie (ekalakar pattern). The web app stops using dummy localStorage auth.

## Decisions

| Topic | Choice |
|-------|--------|
| Scope | DB (`users`) + JWT auth + wire web (options A + Prisma + B) |
| ORM | Prisma |
| Token delivery | JWT in HttpOnly cookie named `jwt` |
| Password hashing | `bcryptjs` |
| Cookie local | `httpOnly: true`, `secure: false`, `sameSite: 'lax'`, 30d |
| Cookie prod | `secure: true`, `sameSite: 'none'` |
| Platform role | `users.is_super_admin` boolean (default `false`) |
| Orgs / memberships | Out of this pass (step 5) |
| Domain tables | Out of this pass |

## Architecture

```text
Browser (apps/web :3000)
    ↓ credentials: include (cookie)
Express API (apps/api :4000)
    ↓ Prisma
PostgreSQL (Docker :5432)
```

## Data model

### `users`

| Column | Type | Notes |
|--------|------|--------|
| `id` | UUID PK | `gen_random_uuid()` / Prisma `@default(uuid())` |
| `email` | text | unique, stored lowercased |
| `password_hash` | text | bcrypt hash; never returned in JSON |
| `name` | text | display name |
| `is_super_admin` | boolean | SaaS owner flag; default `false` |
| `created_at` / `updated_at` | timestamptz | |

No `organizations` / `memberships` in this migration.

## API

### Endpoints

| Method | Path | Auth | Behavior |
|--------|------|------|----------|
| `POST` | `/auth/register` | public | `{ name, email, password }` → create user, set `jwt` cookie, return user |
| `POST` | `/auth/login` | public | `{ email, password }` → verify, set cookie, return user |
| `POST` | `/auth/logout` | public (clear cookie) | clear `jwt` cookie |
| `GET` | `/auth/me` | required | current user from cookie |

### Response shape

Success user payload (never includes `password_hash`):

```json
{
  "user": {
    "id": "...",
    "email": "...",
    "name": "...",
    "isSuperAdmin": false
  }
}
```

Errors:

```json
{
  "error": {
    "code": "INVALID_CREDENTIALS",
    "message": "Invalid email or password"
  }
}
```

| Code | When |
|------|------|
| `EMAIL_TAKEN` | register, email exists |
| `INVALID_CREDENTIALS` | login failure (generic; do not leak email existence) |
| `VALIDATION_ERROR` | Zod failure |
| `UNAUTHORIZED` | missing/invalid/expired token on `/auth/me` |
| `TOKEN_EXPIRED` | JWT expired (optional distinct from `UNAUTHORIZED`) |

### Middleware `requireAuth`

1. Read `req.cookies.jwt`
2. `jwt.verify` with `JWT_SECRET`
3. Load user by `userId` via Prisma (select without `passwordHash`)
4. Attach `req.user = { id, email, name, isSuperAdmin }`
5. Else `401`

### Token helpers (ekalakar port)

- `generateToken(res, userId)` — `jwt.sign({ userId }, JWT_SECRET, { expiresIn: '30d' })` + set cookie
- `clearToken(res)` — expire cookie

## Env

`apps/api/.env` / `.env.example`:

```env
PORT=4000
WEB_ORIGIN=http://localhost:3000
DATABASE_URL=postgresql://relay:relay@localhost:5432/relay
JWT_SECRET=change-me-to-long-random
```

CORS remains `origin: WEB_ORIGIN`, `credentials: true`. Add `cookie-parser`.

## Local Postgres

Repo-root `docker-compose.yml`: Postgres 16 Alpine, user/password/db `relay`, port `5432`, named volume.

Scripts on `@relay/api`: `db:generate`, `db:migrate`, `db:seed`.

## File layout

### API

| Path | Role |
|------|------|
| `docker-compose.yml` | Postgres |
| `apps/api/prisma/schema.prisma` | User model |
| `apps/api/src/db.ts` | PrismaClient singleton |
| `apps/api/src/config.ts` | env helpers |
| `apps/api/src/utils/tokens.ts` | set/clear JWT cookie |
| `apps/api/src/middleware/requireAuth.ts` | protect |
| `apps/api/src/routes/auth.ts` | register/login/logout/me |
| `apps/api/src/index.ts` | mount middleware + routes |
| `apps/api/prisma/seed.ts` | demo super-admin user |

### Web

| Path | Role |
|------|------|
| `apps/web/lib/api.ts` | `fetch` wrapper, `credentials: 'include'`, `NEXT_PUBLIC_API_URL` |
| `apps/web/lib/auth.ts` | `login`, `register`, `logout`, `getMe` (replaces `dummy-auth.ts`) |
| `apps/web/app/login/page.tsx` | call API login |
| `apps/web/app/register/page.tsx` | new; same visual language as login |
| `apps/web/app/page.tsx` | redirect based on `/auth/me` (or client session check) |

Delete `apps/web/lib/dummy-auth.ts` once replaced.

## Seed

- Email: `owner@relay.local`
- Password: `password` (documented in seed output / `.env.example` comment)
- `is_super_admin: true`
- No org membership in this pass

## Web behavior

1. Logged-out `/` → `/login`
2. Successful login/register → existing app entry (e.g. `lndev-ui/team/CORE/all`) until real orgs exist
3. `/login` link to `/register` and vice versa
4. Session = cookie; refresh calls `/auth/me` (no localStorage session flag)

## Out of scope

- Organizations, memberships, tenant middleware
- Issues / projects / teams tables
- Rate limiting (can add in hardening)
- Password reset, SSO
- Bearer token / localStorage JWT

## Done when

- [ ] `docker compose up -d` runs Postgres
- [ ] Prisma migrate creates `users`
- [ ] Register / login / logout / `/auth/me` work via curl (cookie jar)
- [ ] Web login + register use API cookies; refresh stays signed in
- [ ] Unauthenticated `/auth/me` returns 401
- [ ] `ARCHITECTURE.md` notes Prisma + JWT HttpOnly cookie
- [ ] Dummy localStorage auth removed

## Docs to update when implementing

- [ARCHITECTURE.md](../../ARCHITECTURE.md) — Prisma, JWT cookie auth
- [STEPS.md](../../STEPS.md) / step status for 3–4 as appropriate
- [03-database.md](../../steps/03-database.md) / [04-auth.md](../../steps/04-auth.md) — mark progress / ORM choice
