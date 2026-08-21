# Access + refresh tokens (HRMS-shaped keystore) — design

**Date:** 2026-08-21  
**Status:** Implemented  
**Scope:** Dual JWT + KeyStore; web auto-refresh (replaced single 30d `jwt` cookie)  
**Reference:** HRMS `apps/api` auth patterns (`JWT`, `KeyStore`, `createTokens`, `createAndSetTokens`, refresh flow), Prisma instead of Mongoose  
**Canonical product docs:** [ARCHITECTURE.md](../../ARCHITECTURE.md), [steps/04-auth.md](../../steps/04-auth.md)  
**Prior draft (superseded):** [2026-08-21-jwt-auth-postgres-design.md](./2026-08-21-jwt-auth-postgres-design.md)

## Goal

Relay API auth uses short-lived access JWTs, longer-lived refresh JWTs, and a Prisma `KeyStore` so logout/refresh can revoke server-side sessions. Web silently refreshes once on expired access.

## Decisions

| Topic | Choice |
|-------|--------|
| Pattern | Access + refresh JWTs + `KeyStore` (primary/secondary keys in `prm`) |
| Access TTL | **15 minutes** (`ACCESS_TOKEN_VALIDITY_SEC` default 900) |
| Refresh TTL | **1 day** (`REFRESH_TOKEN_VALIDITY_SEC` default 86400) |
| Rotation | On each successful `/auth/refresh`: delete old keystore, issue new pair |
| Cookies | `relay_accessToken`, `relay_refreshToken` (HttpOnly; prefix from `BRAND_SLUG`) |
| Cookie flags | Local `secure: false`, `sameSite: 'lax'`; prod `secure: true`, `sameSite: 'none'` |
| Web recovery | `api.ts`: on `401` / `TOKEN_EXPIRED`, call `POST /auth/refresh` once, retry original request |
| Env | `TOKEN_SECRET`, `TOKEN_ISSUER`, `TOKEN_AUDIENCE` |
| Not in this pass | API keys / role middleware; rate limits; password reset |

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
       → Set-Cookie relay_accessToken + relay_refreshToken
  requireAuth → validate access → user → KeyStore(userId, primaryKey, status)
  /auth/refresh → decode access + validate refresh → match keys → delete → re-issue
  logout → delete KeyStore → clear cookies
       ↓
PostgreSQL (Prisma User + KeyStore)
```

## Data model

### `KeyStore` (Prisma → `key_stores`)

| Column | Type | Notes |
|--------|------|--------|
| `id` | UUID PK | |
| `userId` | UUID FK → `users.id` | |
| `primaryKey` | text | Embedded in access JWT as `prm` |
| `secondaryKey` | text | Embedded in refresh JWT as `prm` |
| `status` | boolean | default `true`; inactive = reject |
| `createdAt` / `updatedAt` | timestamptz | |

Indexes: `(userId)`, `(userId, primaryKey, status)`, `(userId, primaryKey, secondaryKey)`.

Relation: `User` has many `KeyStore`.

## JWT payload

- `iss` — `TOKEN_ISSUER`
- `aud` — `TOKEN_AUDIENCE`
- `sub` — user id (UUID string)
- `prm` — primaryKey (access) or secondaryKey (refresh)
- `iat` / `exp` — unix seconds

Algorithm: HS256 via `TOKEN_SECRET`.

`validateTokenData`: require `iss`/`aud` match config, `sub` UUID, `prm` present.

## API

| Method | Path | Auth | Behavior |
|--------|------|------|----------|
| `POST` | `/auth/register` | public | create user → `createAndSetTokens` → `{ user }` |
| `POST` | `/auth/login` | public | verify password → `createAndSetTokens` → `{ user }` |
| `POST` | `/auth/logout` | access required | delete current keystore → clear both cookies |
| `GET` | `/auth/me` | access required | `{ user }` |
| `POST` | `/auth/refresh` | cookies | see flow below |

Envelope: `{ success, message, data, error }`. User payload: `id`, `email`, `name`, `isSuperAdmin`. Never return password hash or keystore keys.

### Refresh flow

1. Read access cookie; **decode** (allow expired) and `validateTokenData`
2. Load user by `sub`; 401 if missing
3. Read refresh from cookie (preferred); optionally accept body `refreshToken`
4. **Validate** refresh (must be unexpired) + `validateTokenData`
5. Ensure access `sub` === refresh `sub`
6. Find `KeyStore` where `userId`, `primaryKey === access.prm`, `secondaryKey === refresh.prm`
7. If missing → 401
8. Delete that keystore row
9. `createAndSetTokens` for user
10. `sendSuccess` with empty object + message

### `createAndSetTokens`

1. `primaryKey` / `secondaryKey` = `crypto.randomBytes(64).toString('hex')`
2. Insert `KeyStore`
3. `createTokens(userId, primaryKey, secondaryKey)`
4. Set cookies with `maxAge` matching TTLs (15m / 1d)

### `requireAuth`

1. Validate access cookie (reject expired → `TOKEN_EXPIRED`)
2. `validateTokenData`
3. Load user by `sub` (public fields)
4. Find active keystore: `userId` + `primaryKey === prm` + `status: true`
5. Else 401; attach `req.user` and `req.keyStore`

### Logout

Require auth, delete `req.keyStore`, clear both cookies.

## Config / env

```env
PORT=4000
WEB_ORIGIN=http://localhost:3000
DATABASE_URL=postgresql://relay:relay@localhost:5432/relay
TOKEN_SECRET=change-me-to-long-random
TOKEN_ISSUER=relay
TOKEN_AUDIENCE=relay-web
# Optional:
# ACCESS_TOKEN_VALIDITY_SEC=900
# REFRESH_TOKEN_VALIDITY_SEC=86400
```

`assertAuthConfig` requires `TOKEN_SECRET`, `TOKEN_ISSUER`, `TOKEN_AUDIENCE`, `DATABASE_URL`.

## File layout

### API

| Path | Role |
|------|------|
| `apps/api/prisma/schema.prisma` | `User` + `KeyStore` |
| `apps/api/src/config.ts` | `tokenInfo` |
| `apps/api/src/constants/auth.ts` | Cookie names + default TTLs |
| `apps/api/src/constants/brand.constants.ts` | `BRAND_SLUG` cookie prefix |
| `apps/api/src/utils/jwt.ts` | encode / decode / validate + `JWTPayload` |
| `apps/api/src/auth/authUtils.ts` | `createTokens`, `validateTokenData` |
| `apps/api/src/auth/tokenHelpers.ts` | `createAndSetTokens`, `clearAuthCookies` |
| `apps/api/src/auth/keyStore.ts` | create / find / delete helpers |
| `apps/api/src/middleware/requireAuth.ts` | protect |
| `apps/api/src/routes/auth.ts` | register/login/logout/me/refresh |
| `apps/api/src/types/express.d.ts` | `req.user`, `req.keyStore` |

### Web

| Path | Role |
|------|------|
| `apps/web/lib/api.ts` | one-shot refresh + retry on `401` / `TOKEN_EXPIRED` |
| `apps/web/lib/auth.ts` | `login`, `register`, `logout`, `getMe` |

Skip refresh/retry for `/auth/refresh`, `/auth/login`, `/auth/register`.

## Out of scope

- API-key / role authorization middleware
- Rate limiting (step 9)
- Refresh reuse detection beyond delete-old-on-rotate
- Mobile Bearer header path (cookie-first)

## Done when

- [x] Migrate Prisma: `KeyStore` exists
- [x] Register/login set access + refresh cookies and a keystore row
- [x] `/auth/me` works with valid access; expired access returns `TOKEN_EXPIRED` / 401
- [x] `/auth/refresh` rotates keystore and cookies
- [x] Web client auto-refreshes once and retries
- [x] Logout deletes keystore and clears cookies; subsequent `/auth/me` is 401
- [x] Legacy `jwt` cookie no longer issued
- [x] ARCHITECTURE.md / step docs updated
