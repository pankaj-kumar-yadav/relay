# Step 4 — Authentication

**Status:** Done (access + refresh JWT + KeyStore; web login/register + auto-refresh)

## Goal

Users can register, log in, and call protected API routes. Web can store and send the auth credential.

## Implementation notes (as shipped)

- Cookie names: `${BRAND_SLUG}_accessToken` / `${BRAND_SLUG}_refreshToken` → `relay_accessToken`, `relay_refreshToken`
- Core modules: `apps/api/src/auth/*`, `apps/api/src/utils/jwt.ts`, `apps/api/src/middleware/requireAuth.ts`
- Web auto-refresh: `apps/web/lib/api.ts`

See design: [../superpowers/specs/2026-08-21-access-refresh-keystore-design.md](../superpowers/specs/2026-08-21-access-refresh-keystore-design.md)

## Prerequisites

- Step 3 — `users` (+ `key_stores`) table exists
- Password hashing: `bcryptjs`

## Decision: session vs JWT

| Approach | Pros | Cons |
|----------|------|------|
| **HTTP-only cookie session** (recommended) | Safer XSS default, fits same-site web+api with CORS credentials | Needs cookie + CORS config |
| Bearer JWT in memory/localStorage | Simple for mobile later | XSS risk if stored in JS-readable storage |

**Choice:** Dual JWT HttpOnly cookies — `relay_accessToken` (15m) + `relay_refreshToken` (1d) — with Prisma `KeyStore` (HRMS-shaped). Documented in [ARCHITECTURE.md](../ARCHITECTURE.md).

## API endpoints (minimum)

| Method | Path | Auth | Behavior |
|--------|------|------|----------|
| `POST` | `/auth/register` | public | email, password, name → create user + set cookies |
| `POST` | `/auth/login` | public | verify password → set cookies |
| `POST` | `/auth/logout` | auth | delete keystore + clear cookies |
| `GET` | `/auth/me` | auth | current user profile |
| `POST` | `/auth/refresh` | cookies | rotate keystore + issue new token pair |

### Request/response conventions

- JSON body
- Validation with Zod (or equivalent)
- Envelope: `{ "success", "message", "data", "error" }` — on failure `error` is `{ "code", "message" }` and `data` is `null`
- Never return `password_hash` or keystore keys

## Middleware

`requireAuth`:

1. Validate `relay_accessToken` cookie
2. Load user by JWT `sub`
3. Require active `KeyStore` matching JWT `prm`
4. Attach `req.user` (+ `req.keyStore`)
5. `401` / `TOKEN_EXPIRED` if missing/invalid

## Web work (minimal)

1. Login + register pages (can be simple; Circle polish later)
2. Client API helper that:
   - uses `NEXT_PUBLIC_API_URL`
   - sends `credentials: 'include'` if cookies
   - on `401` / `TOKEN_EXPIRED`, calls `/auth/refresh` once and retries
3. After login, redirect into app shell (even if still mock data)

Do **not** block on replacing all Circle mocks in this step.

## CORS / cookies

API already allows `WEB_ORIGIN`. For cookies:

```env
# apps/api/.env
WEB_ORIGIN=http://localhost:3000
TOKEN_SECRET=change-me-to-long-random
TOKEN_ISSUER=relay
TOKEN_AUDIENCE=relay-web
```

Ensure:

- `cors({ origin: WEB_ORIGIN, credentials: true })`
- Cookie `Path=/`, correct domain for local (usually omit Domain)

## Security checklist

- [x] Passwords hashed (never plaintext)
- [ ] Rate-limit login/register (basic is enough for MVP)
- [x] Generic error on bad login (don’t leak whether email exists)
- [x] `TOKEN_SECRET` / issuer / audience only in env
- [x] Logout revokes keystore server-side

## Done when

- [x] Register + login + logout + `/auth/me` work via HTTP client (Thunder Client / curl)
- [x] `/auth/refresh` rotates tokens + keystore
- [x] Web can log in and call `/auth/me` (with auto-refresh)
- [x] Unauthenticated requests to a protected stub route return 401

## Out of scope

- Org invites email sending (can stub invite accept later)
- SSO
- Password reset email polish (optional stub)

## Next

[05-multi-tenant.md](./05-multi-tenant.md)
