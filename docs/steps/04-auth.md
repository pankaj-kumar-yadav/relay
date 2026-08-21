# Step 4 — Authentication

**Status:** Done (JWT HttpOnly cookie; web login/register wired)

## Goal

Users can register, log in, and call protected API routes. Web can store and send the auth credential.

## Prerequisites

- Step 3 — `users` table exists
- Password hashing library chosen (e.g. `argon2` or `bcrypt`)

## Decision: session vs JWT

| Approach | Pros | Cons |
|----------|------|------|
| **HTTP-only cookie session** (recommended) | Safer XSS default, fits same-site web+api with CORS credentials | Needs cookie + CORS config |
| Bearer JWT in memory/localStorage | Simple for mobile later | XSS risk if stored in JS-readable storage |

**Choice for MVP:** JWT in HttpOnly cookie named `jwt` (ekalakar pattern). Documented in [ARCHITECTURE.md](../ARCHITECTURE.md).

## API endpoints (minimum)

| Method | Path | Auth | Behavior |
|--------|------|------|----------|
| `POST` | `/auth/register` | public | email, password, name → create user (and optionally first org later) |
| `POST` | `/auth/login` | public | verify password → set session/cookie |
| `POST` | `/auth/logout` | auth | clear session |
| `GET` | `/auth/me` | auth | current user profile |

### Request/response conventions

- JSON body
- Validation with Zod (or equivalent)
- Envelope: `{ "success", "message", "data", "error" }` — on failure `error` is `{ "code", "message" }` and `data` is `null`
- Never return `password_hash`

## Middleware

`requireAuth`:

1. Read session/token from cookie or `Authorization` header
2. Load user
3. Attach `req.user = { id, email, name }`
4. `401` if missing/invalid

## Web work (minimal)

1. Login + register pages (can be simple; Circle polish later)
2. Client API helper that:
   - uses `NEXT_PUBLIC_API_URL`
   - sends `credentials: 'include'` if cookies
3. After login, redirect into app shell (even if still mock data)

Do **not** block on replacing all Circle mocks in this step.

## CORS / cookies

API already allows `WEB_ORIGIN`. For cookies:

```env
# apps/api/.env
WEB_ORIGIN=http://localhost:3000
SESSION_SECRET=change-me-to-long-random
```

Ensure:

- `cors({ origin: WEB_ORIGIN, credentials: true })`
- Cookie `Path=/`, correct domain for local (usually omit Domain)

## Security checklist

- [ ] Passwords hashed (never plaintext)
- [ ] Rate-limit login/register (basic is enough for MVP)
- [ ] Generic error on bad login (don’t leak whether email exists) — optional but preferred
- [ ] `SESSION_SECRET` / JWT secret only in env

## Done when

- [x] Register + login + logout + `/auth/me` work via HTTP client (Thunder Client / curl)
- [x] Web can log in and call `/auth/me`
- [x] Unauthenticated requests to a protected stub route return 401

## Out of scope

- Org invites email sending (can stub invite accept later)
- SSO
- Password reset email polish (optional stub)

## Next

[05-multi-tenant.md](./05-multi-tenant.md)
