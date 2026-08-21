# Step 9 — Hardening (MVP readiness)

**Status:** Pending

## Goal

Make the MVP safe and runnable for demos: seed data, consistent errors, env docs, and a short smoke-test checklist.

## Prerequisites

- Steps 1–8 functionally complete for the MVP path

## 1. Seed script

`pnpm --filter @relay/api db:seed` should create:

| Entity | Example |
|--------|---------|
| User | `owner@relay.local` / documented password |
| Org | slug `demo` |
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
- Basic rate limit on `/auth/login` and `/auth/register`

## 4. Config and secrets

Ensure `.env.example` files list every required var:

**API:** `PORT`, `WEB_ORIGIN`, `DATABASE_URL`, `SESSION_SECRET` (names may vary)  
**Web:** `NEXT_PUBLIC_API_URL`

## 5. CORS / production notes

Document in ARCHITECTURE:

- Local: web `3000`, api `4000`, credentials CORS
- Production: set explicit origins; `Secure` cookies; HTTPS only

## 6. Smoke test checklist (manual)

Run through and tick in PR description:

- [ ] Register new user
- [ ] Login / logout / `/auth/me`
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

- [ ] [SCOPE.md](../SCOPE.md) — confirm MVP still accurate
- [ ] [ARCHITECTURE.md](../ARCHITECTURE.md) — ORM, auth mode, cookie details
- [ ] [STEPS.md](../STEPS.md) — mark steps complete
- [ ] Root [README.md](../../README.md) — how to run seed + demo login

## Done when

- [ ] Seed boots a demoable workspace
- [ ] Error shape is consistent
- [ ] Env examples are complete
- [ ] Smoke checklist passes once on a clean DB
- [ ] Out-of-MVP features remain out

## After MVP

Only then consider items from SCOPE “Out of MVP”: billing, SSO, realtime, uploads, AI, cycles/docs APIs.
