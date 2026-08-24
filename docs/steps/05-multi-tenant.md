# Step 5 — Multi-tenant (organizations + memberships)

**Status:** Done

## Goal

Every authenticated action that touches org data is **membership-checked**. URL `orgId` is a hint, not authority.

## Prerequisites

- Steps 3–4 done (`organizations`, `memberships`, auth middleware)

## Core rule (non-negotiable)

```text
1. Authenticate user (session)
2. Resolve organization (by id or slug from route)
3. Verify memberships row for (user_id, organization_id)
4. Only then run the query, always filtered by organization_id
```

If step 3 fails → `403 Forbidden` (or `404` if you prefer not to leak existence).

## API endpoints (minimum)

| Method | Path | Behavior |
|--------|------|----------|
| `POST` | `/orgs` | Create org; add creator as `admin` |
| `GET` | `/orgs` | List orgs for current user |
| `GET` | `/orgs/:orgId` | Get org if member (`:orgId` = **slug**) |
| `POST` | `/orgs/:orgId/invites` | Admin creates invite (`email`, optional `role`); returns `token` once; logs URL in non-prod |
| `POST` | `/invites/:token/accept` | Auth user whose email matches invite → membership |

Public org identifier for routes: **slug** (not UUID).

## Middleware

`requireOrgMember`:

1. Depends on `requireAuth`
2. Reads `orgId` from params (slug)
3. Loads org + membership
4. Sets `req.org` and `req.membership` (include `role`)

`requireOrgRole(...roles)` — after `requireOrgMember`; invite create uses `admin`.

Optional later: `requireSuperAdmin` for platform SaaS-owner actions.

## Data access pattern

Bad:

```ts
// trusts client org only
db.issues.findMany({ where: { organizationId: req.params.orgId } })
```

Good:

```ts
// org already verified on req.org.id
db.issues.findMany({ where: { organizationId: req.org.id } })
```

## Web mapping to Circle

Circle routes look like:

```text
/[orgId]/team/[teamId]/...
```

Plan:

1. After login, `GET /orgs` → pick default org
2. Navigate to `/${org.slug}/...`
3. All client fetches include that org context (`/orgs/:slug/issues`, etc.)

Until step 7, UI can still show mocks, but org switcher/login should use real orgs when ready.

## Invite MVP (stub)

- Generate random token, store **hash** + expiry on `invites` table
- Log invite URL in server console in non-prod; also return raw `token` once in create response
- Accept requires auth, matching email, unexpired unused invite → creates membership

## Done when

- [x] User can create an org and see it in `GET /orgs`
- [x] Second user without membership gets 403 on org routes
- [x] Creating org auto-creates owner membership
- [x] All new org-scoped handlers use `requireOrgMember`
- [x] Invites create/accept
- [x] Rule documented (ARCHITECTURE + this step) and followed in handlers

## Test scenarios (manual)

1. User A creates org `acme` → OK  
2. User B calls `GET /orgs/acme/...` → 403  
3. User A invites B → B accepts → B can read  
4. Queries never return other orgs’ rows

## Next

[06-core-api.md](./06-core-api.md)
