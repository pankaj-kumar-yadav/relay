# Step 9 — Hardening (MVP readiness)

**Status:** Done

## Goal

Make the MVP safe and runnable for demos: seed data, consistent errors, env docs, and a short smoke-test checklist.

## Prerequisites

- Steps 1–8 functionally complete for the MVP path

## 1. Seed script

`pnpm --filter @relay/api db:seed` should create:

| Entity | Example |
|--------|---------|
| User | `owner@relay.local` / documented password |
| Org | slug `acme` |
| Membership | owner |
| Team | key `CORE` |
| Project | “Launch” |
| Issues | 5–10 with varied status/priority |

Document credentials in `apps/api/README.md` (dev only).

## 2. Error handling

Standardize API responses with the envelope (success responses use the same four keys with `error: null` and a non-null `data` object):

```json
{
  "success": false,
  "message": "You are not a member of this organization",
  "data": null,
  "error": {
    "code": "FORBIDDEN",
    "message": "You are not a member of this organization"
  }
}
```

Map:

- `400` validation
- `401` unauthenticated
- `403` not a member / insufficient role
- `404` missing resource (within tenant)
- `409` conflicts (duplicate email, slug, team key)
- `500` unexpected (log server-side; generic client message)

## 3. Validation and limits

- Zod (or equivalent) on all write endpoints
- Request size limits on Express
- Separate rate limits on `/auth/login` and `/auth/register` (shipped in step 4)

## 4. Config and secrets

Ensure `.env.example` files list every required var:

**API:** `PORT`, `WEB_ORIGIN`, `DATABASE_URL`, `TOKEN_SECRET`, `TOKEN_ISSUER`, `TOKEN_AUDIENCE`, `NODE_ENV` (`development` or `production`; optional `ACCESS_TOKEN_VALIDITY_SEC`, `REFRESH_TOKEN_VALIDITY_SEC`)  
**Web:** `NEXT_PUBLIC_API_URL`

Auth already revokes sessions via `KeyStore` delete on logout/refresh; hardening here is rate limits and prod cookie/CORS notes (see [ARCHITECTURE.md](../ARCHITECTURE.md)).

## 5. CORS / production notes

Document in ARCHITECTURE:

- Local: web `3000`, api `4000`, credentials CORS
- Production: set explicit origins; `Secure` cookies; HTTPS only

## 6. Smoke test checklist (manual)

Run through and tick in PR description:

- [ ] Register new user
- [ ] Login / logout / `/auth/session` / `/auth/refresh` (session survives short access TTL)
- [ ] Create organization
- [ ] Create team + project
- [ ] Create issue, edit status, reorder if supported
- [ ] Second user without invite cannot access org
- [ ] Invite + accept (if implemented)
- [ ] `pnpm build` succeeds for web + api

## 7. Optional automated tests

Minimum useful set:

- Auth register/login unit or integration
- Tenant isolation test: user B cannot `GET` user A’s issue id

Do not block MVP on full coverage.

## 8. Docs sync

Update these when hardening finishes:

- [ ] [SCOPE-MVP.md](../SCOPE-MVP.md) — confirm MVP still accurate
- [ ] [ARCHITECTURE.md](../ARCHITECTURE.md) — ORM, auth mode, cookie details
- [ ] [STEPS-MVP.md](../STEPS-MVP.md) — mark steps complete
- [ ] Root [README.md](../../README.md) — how to run seed + local login

## Done when

- [x] Seed boots a demoable workspace
- [x] Error shape is consistent
- [x] Env examples are complete
- [x] Smoke checklist passes once on a clean DB
- [x] Out-of-MVP features remain out

## After MVP

v1 continues at [10-comments-activity.md](./10-comments-activity.md). Billing, SSO, realtime, uploads, and AI stay out until they appear in [SCOPE-V1.md](../SCOPE-V1.md).
