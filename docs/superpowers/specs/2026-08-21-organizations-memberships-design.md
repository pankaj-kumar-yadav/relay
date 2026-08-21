# Organizations + memberships (multi-tenant) — design

**Date:** 2026-08-21  
**Status:** Approved for planning  
**Canonical product docs:** [ARCHITECTURE.md](../../ARCHITECTURE.md), [steps/05-multi-tenant.md](../../steps/05-multi-tenant.md)

## Goal

Add multi-tenant org membership without putting `organization_id` on `User`. A user can belong to many orgs via `memberships`. Ship create/list/get org APIs and `requireOrgMember`. Invites and web org UI are out of scope for this pass.

## Decisions locked

| Topic | Choice |
|-------|--------|
| User ↔ org link | `memberships` join table (not FK on `users`) |
| Public org id in routes | **Slug only** (`/orgs/:orgId` where `:orgId` is slug) |
| Org roles | `admin` \| `employee` (`OrgRole` const) |
| Creator role | `admin` on `POST /orgs` |
| Invites | Deferred |
| Auto-org on register | Deferred |
| Web UI | No changes this pass |
| Auth | Existing dual JWT + `requireAuth` unchanged |

## Data model

### `User` (unchanged)

No `organization_id` / `tenancy_id`. Platform flag `is_super_admin` stays on user.

### `organizations`

| Column | Notes |
|--------|--------|
| `id` | UUID PK |
| `name` | display name |
| `slug` | unique, URL-safe, lowercase |
| `created_at` / `updated_at` | timestamptz |

### `memberships`

| Column | Notes |
|--------|--------|
| `id` | UUID PK |
| `organization_id` | FK → organizations (cascade delete) |
| `user_id` | FK → users (cascade delete) |
| `role` | `admin` \| `employee` |
| unique | (`organization_id`, `user_id`) |

Prisma: `User.memberships`, `Organization.memberships`, membership → user + organization.

## API

All endpoints require `requireAuth`. Response envelope unchanged (`success`, `message`, `data`, `error`).

| Method | Path | Behavior |
|--------|------|----------|
| `POST` | `/orgs` | Body `{ name, slug }` → create org + membership (`admin`) for current user |
| `GET` | `/orgs` | List orgs the current user belongs to (join memberships) |
| `GET` | `/orgs/:orgId` | Resolve by **slug**; return org (+ membership role) if member; else 403 |

### Slug rules

- Pattern: `^[a-z0-9]+(?:-[a-z0-9]+)*$`
- Store lowercased
- Duplicate slug → `409` (slug taken)

### `requireOrgMember`

1. Depends on `requireAuth` (user on `req`)
2. Read slug from `req.params.orgId`
3. Load organization by slug → missing → `404 NotFoundError`
4. Load membership for `(req.user.id, org.id)` → missing → `403 ForbiddenError`
5. Set `req.org` and `req.membership` (include `role`)

Extend `Express.Request` with optional `org` and `membership`.

Later domain routes always query with `req.org.id`, never trust client-supplied tenant ids alone.

## Constants & errors

- `OrgRole = { ADMIN: 'admin', EMPLOYEE: 'employee' } as const` under `apps/api/src/constants/`
- Reuse `ValidationError`, `NotFoundError`, `ForbiddenError`
- Add `ErrorCode` / error class for slug conflict if not already covered (e.g. `SLUG_TAKEN` → 409)

## Seed

Extend seed: org slug `demo`, membership for `owner@relay.local` as `admin`.

## Out of scope

- Invite create/accept
- `requireOrgRole('admin')` (can add when settings need it)
- Auto-create org on register
- Web org switcher / Circle `[orgId]` wiring
- Issues, projects, teams tables

## Success criteria

- Authenticated user can create an org and see it in `GET /orgs`
- Non-member gets `403` on `GET /orgs/:slug`
- Creator is `admin` via membership row
- `User` has no org FK; tenancy is membership-based
- Manual check: User A creates `acme`; User B cannot read `/orgs/acme`
