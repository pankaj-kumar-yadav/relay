# JWT auth + Postgres (Prisma) — design

**Date:** 2026-08-21  
**Status:** Superseded  
**Superseded by:** [2026-08-21-access-refresh-keystore-design.md](./2026-08-21-access-refresh-keystore-design.md)  
**Canonical product docs:** [ARCHITECTURE.md](../../ARCHITECTURE.md), [steps/04-auth.md](../../steps/04-auth.md)

## What this pass delivered (still true)

- Postgres `users` via Prisma + Docker Compose
- Register / login / logout / `/auth/me` against real DB
- Passwords with `bcryptjs`; web wired with `credentials: 'include'`
- Orgs / memberships deferred to step 5

## What changed after this draft

The original choice was a **single** HttpOnly cookie `jwt` (30d, payload `{ userId }`, env `JWT_SECRET`). That was replaced by HRMS-shaped **access + refresh** JWTs + Prisma `KeyStore`:

| Topic | This draft (obsolete) | Current implementation |
|-------|----------------------|------------------------|
| Cookies | `jwt` (30d) | `relay_accessToken` (15m) + `relay_refreshToken` (1d) |
| Env | `JWT_SECRET` | `TOKEN_SECRET`, `TOKEN_ISSUER`, `TOKEN_AUDIENCE` |
| Revocation | Cookie clear only | Delete `KeyStore` on logout; rotate on refresh |
| Refresh | None | `POST /auth/refresh` + web one-shot auto-retry |
| Payload | `{ userId }` | `{ iss, aud, sub, prm, iat, exp }` |

Do not implement from this file. Use the superseding design and product docs above.
