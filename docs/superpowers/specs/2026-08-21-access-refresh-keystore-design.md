# Access + refresh tokens (HRMS-shaped keystore) — design

**Date:** 2026-08-21  
**Status:** Approved for planning  
**Scope:** Replace single 30d `jwt` cookie with HRMS-style dual JWT + KeyStore; wire web auto-refresh  
**Reference:** `ekalakaar` / Relay current single-cookie auth; port patterns from `hrms/apps/api` auth (`JWT`, `KeyStore`, `createTokens`, `createAndSetTokens`, refresh flow)

## Goal

Relay API auth matches HRMS **code-level** dual-token + keystore design (Prisma instead of Mongoose), so access tokens are short-lived, refresh rotates keystores, and logout can invalidate server-side sessions. Web silently refreshes once on expired access.

## Decisions

| Topic | Choice |
|-------|--------|
| Pattern | HRMS-shaped: access + refresh JWTs + `KeyStore` (primary/secondary keys in `prm`) |
| Access TTL | **15 minutes** |
| Refresh TTL | **1 day** |
| Rotation | On each successful `/auth/refresh`: delete old keystore, issue new pair |
| Cookies | `accessToken`, `refreshToken` (HttpOnly); remove legacy `jwt` |
| Cookie flags | Same as today: local `secure: false`, `sameSite: 'lax'`; prod `secure: true`, `sameSite: 'none'` |
| Web recovery | `api.ts`: on `401` / `TOKEN_EXPIRED`, call `POST /auth/refresh` once, retry original request |
| Env | `TOKEN_SECRET`, `TOKEN_ISSUER`, `TOKEN_AUDIENCE` (migrate off sole `JWT_SECRET`) |
| Not in this pass | HRMS API keys / role middleware; rate limits; password reset |

## Architecture

```text
Browser (apps/web)
  credentials: include
       ↓
Express API
  register/login → createAndSetTokens
       → crypto primaryKey + secondaryKey
       → KeyStore row
       → JWTs (iss, aud, sub=userId, prm=key, iat, exp)
       → Set-Cookie accessToken + refreshToken
  requireAuth → validate access → user → KeyStore(userId, primaryKey, status)
  /auth/refresh → decode access + validate refresh → match keys → delete → re-issue
  logout → delete KeyStore → clear cookies
       ↓
PostgreSQL (Prisma User + KeyStore)
```

## Data model

### `KeyStore` (Prisma)

| Column | Type | Notes |
|--------|------|--------|
| `id` | UUID PK | |
| `userId` | UUID FK → `users.id` | HRMS `client` |
| `primaryKey` | text | Embedded in access JWT as `prm` |
| `secondaryKey` | text | Embedded in refresh JWT as `prm` |
| `status` | boolean | default `true`; inactive = reject |
| `createdAt` / `updatedAt` | timestamptz | |

Indexes (match HRMS intent): `(userId)`, `(userId, primaryKey, status)`, `(userId, primaryKey, secondaryKey)`.

Relation: `User` has many `KeyStore`.

## JWT payload

Same shape as HRMS `JWTPayload`:

- `iss` — `TOKEN_ISSUER`
- `aud` — `TOKEN_AUDIENCE`
- `sub` — user id (UUID string)
- `prm` — primaryKey (access) or secondaryKey (refresh)
- `iat` / `exp` — unix seconds; validity from config (900s access, 86400s refresh)

Algorithm: HS256 via `TOKEN_SECRET`.

`validateTokenData`: require `iss`/`aud` match config, `sub` present and valid UUID, `prm` present.

## API

| Method | Path | Auth | Behavior |
|--------|------|------|----------|
| `POST` | `/auth/register` | public | create user → `createAndSetTokens` → `{ user }` |
| `POST` | `/auth/login` | public | verify password → `createAndSetTokens` → `{ user }` |
| `POST` | `/auth/logout` | access required | delete current keystore → clear both cookies |
| `GET` | `/auth/me` | access required | `{ user }` |
| `POST` | `/auth/refresh` | cookies | see flow below |

All responses keep the existing `{ success, message, data, error }` envelope. User payload unchanged (`id`, `email`, `name`, `isSuperAdmin`); never return password hash or keystore keys.

### Refresh flow (HRMS)

1. Read `accessToken` cookie; **decode** (allow expired) and `validateTokenData`
2. Load user by `sub`; 401 if missing
3. Read `refreshToken` from cookie (preferred for web); optionally also accept body `refreshToken` for HRMS parity / curl
4. **Validate** refresh (must be unexpired) + `validateTokenData`
5. Ensure access `sub` === refresh `sub`
6. Find `KeyStore` where `userId`, `primaryKey === access.prm`, `secondaryKey === refresh.prm`
7. If missing → 401
8. Delete that keystore row
9. `createAndSetTokens` for user
10. `sendSuccess` (e.g. `{ ok: true }` or empty object + message)

### `createAndSetTokens`

1. `primaryKey` / `secondaryKey` = `crypto.randomBytes(64).toString('hex')`
2. Insert `KeyStore`
3. `createTokens(user, primaryKey, secondaryKey)`
4. Set cookies with `maxAge` matching TTLs (15m / 1d)

### `requireAuth`

1. Validate `accessToken` cookie (reject expired → `TOKEN_EXPIRED`)
2. `validateTokenData`
3. Load user by `sub` (select public fields)
4. Find active keystore: `userId` + `primaryKey === prm` + `status: true`
5. Else 401; attach `req.user` (and `req.keyStore` if typed)

### Logout

Require auth (so `req.keyStore` known), delete that keystore, clear both cookies. Clearing legacy `jwt` cookie once is fine for migration.

## Config / env

`apps/api/.env` / `.env.example`:

```env
PORT=4000
WEB_ORIGIN=http://localhost:3000
DATABASE_URL=postgresql://relay:relay@localhost:5432/relay
TOKEN_SECRET=change-me-to-long-random
TOKEN_ISSUER=relay
TOKEN_AUDIENCE=relay-web
# Optional overrides (seconds):
# ACCESS_TOKEN_VALIDITY_SEC=900
# REFRESH_TOKEN_VALIDITY_SEC=86400
```

`assertAuthConfig` requires `TOKEN_SECRET`, `TOKEN_ISSUER`, `TOKEN_AUDIENCE`, `DATABASE_URL`. Remove reliance on `JWT_SECRET` (or accept it as alias only during one migration if needed — prefer clean cut).

## File layout

### API

| Path | Role |
|------|------|
| `apps/api/prisma/schema.prisma` | add `KeyStore` + User relation |
| `apps/api/src/config.ts` | `tokenInfo` (issuer, audience, secret, access/refresh validity) |
| `apps/api/src/utils/jwt.ts` | encode / decode / validate + `JWTPayload` |
| `apps/api/src/auth/authUtils.ts` | `createTokens`, `validateTokenData` |
| `apps/api/src/auth/tokenHelpers.ts` | `createAndSetTokens`, `clearAuthCookies` |
| `apps/api/src/auth/keyStore.ts` | create / find / delete helpers |
| `apps/api/src/middleware/requireAuth.ts` | HRMS-style protect |
| `apps/api/src/routes/auth.ts` | register/login/logout/me/refresh |
| `apps/api/src/types/express.d.ts` | `req.user`, optional `req.keyStore` |
| `apps/api/src/utils/tokens.ts` | remove or replace (no single `jwt` cookie) |
| `apps/api/src/constants/` | cookie names if shared |

### Web

| Path | Role |
|------|------|
| `apps/web/lib/api.ts` | one-shot refresh + retry on `401` / `TOKEN_EXPIRED` |
| `apps/web/lib/auth.ts` | unchanged call sites if envelope still unwraps `data` |

Skip refresh/retry for `/auth/refresh`, `/auth/login`, `/auth/register` to avoid loops.

## Docs to update when implementing

- [ARCHITECTURE.md](../../ARCHITECTURE.md) — dual cookie + KeyStore; TTLs
- [steps/04-auth.md](../../steps/04-auth.md) — note upgrade; endpoints include refresh
- [steps/09-hardening.md](../../steps/09-hardening.md) — optional note that revocation exists via keystore

## Out of scope

- HRMS `x-api-key` / role authorization middleware
- Rate limiting (step 9)
- Refresh reuse detection beyond delete-old-on-rotate (no family tree)
- Mobile Bearer header path (cookie-first)

## Done when

- [ ] Migrate Prisma: `KeyStore` exists
- [ ] Register/login set `accessToken` + `refreshToken` and a keystore row
- [ ] `/auth/me` works with valid access; expired access returns `TOKEN_EXPIRED` / 401
- [ ] `/auth/refresh` rotates keystore and cookies
- [ ] Web client auto-refreshes once and retries
- [ ] Logout deletes keystore and clears cookies; subsequent `/auth/me` is 401
- [ ] Legacy `jwt` cookie no longer issued
- [ ] ARCHITECTURE.md updated
