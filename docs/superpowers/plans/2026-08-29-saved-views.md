# Saved views Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Named org-visible issue filters stored as JSON matching `IssueListQuery`; owner CRUD, members GET and run via `listIssuesApi`.

**Architecture:** `views` table (org + owner). Router at `/orgs/:orgId/views`. Filters are a strict JSON subset of issue-list query params (plus `labelId` on that list). Web: `views.service.ts` `*Api` + TanStack Query; restore Views nav; hide project-view tab.

**Tech Stack:** Express, Prisma, PostgreSQL, Zod, TanStack Query, existing envelope + `requireAuth` + `requireOrgMember`

**Spec:** [docs/superpowers/specs/2026-08-29-saved-views-design.md](../specs/2026-08-29-saved-views-design.md)

## Global Constraints

- Tenancy: `requireAuth` → `requireOrgMember` → `req.org.id` — never authorize from URL alone
- Envelope: `{ success, message, data, error }` via `sendSuccess` / `sendError`
- Path aliases `@/` in API and web
- Constants in `*.constant.ts` (new domain `view`); mirror API and web keys/values
- Web HTTP only in `apps/web/services/*.service.ts` named `*Api`; UI uses TanStack Query
- Do not delete Circle files; hide project-view tab
- Do not commit unless the user explicitly asks
- Do not implement steps 15–17 in this plan

## File map

| Path | Responsibility |
|------|----------------|
| `apps/api/prisma/schema.prisma` | `View` + User/Org relations |
| `apps/api/prisma/migrations/20260829120000_add_views/migration.sql` | Table + indexes |
| `apps/api/src/constants/view.constant.ts` | `VIEW_NAME_MAX` |
| `apps/api/src/routes/views/views.schema.ts` | Name + filters Zod |
| `apps/api/src/routes/views/views.ts` | CRUD |
| `apps/api/src/routes/views/views.tenant.test.ts` | Tenant + owner ACL + CRUD |
| `apps/api/src/routes/issues/issues.ts` | `labelId` list filter |
| `apps/api/src/routes/issues/issues.schema.ts` | `labelId` query |
| `apps/api/src/openapi/paths/views.ts` | Register paths |
| `apps/api/prisma/seed.ts` | Seed views |
| `apps/web/constants/view.constant.ts` | Mirrored const + path builders |
| `apps/web/services/views.service.ts` | HTTP wrappers |
| `apps/web/hooks/use-views.ts` | Query + mutations |
| `apps/web/lib/query-keys.ts` | `views` / `view` |
| `apps/web/components/common/views/*` | API list + detail + create dialog |
| `apps/web/components/layout/sidebar/nav-workspace.tsx` | Restore Views |
| `apps/web/components/layout/sidebar/nav-teams.tsx` | Restore team Views |

---

### Task 1: Schema + constants + CRUD API

- [ ] Constants, Prisma model, migration
- [ ] Failing tenant / owner / CRUD tests
- [ ] Router + mount + OpenAPI
- [ ] Tests pass

### Task 2: `labelId` issue filter + seed

- [ ] `GET /issues?labelId=` (unknown → empty list)
- [ ] Seed a few views per org

### Task 3: Web wiring

- [ ] Service, hooks, query keys, path constants
- [ ] List/detail/header talk to API; hide project tab
- [ ] Restore workspace + team Views nav
- [ ] Create/rename/delete for owner
