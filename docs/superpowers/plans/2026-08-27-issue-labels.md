# Issue Labels Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Org-scoped issue labels — admin CRUD in settings, any member assigns on issues, label changes write activity events.

**Architecture:** `labels` + `issue_labels` (both org-scoped). Labels router at `/orgs/:orgId/labels`. Replace-all assign at `PUT /orgs/:orgId/issues/:issueId/labels`. `label` events via `recordIssueEvent` in the same transaction. Web: `labels.service.ts` `*Api` + TanStack Query; settings + issue properties talk to the API.

**Tech Stack:** Express, Prisma, PostgreSQL, Zod, TanStack Query, existing envelope + `requireAuth` + `requireOrgMember` + `requireOrgRole`

**Spec:** [docs/superpowers/specs/2026-08-27-issue-labels-design.md](../specs/2026-08-27-issue-labels-design.md)

## Global Constraints

- Tenancy: `requireAuth` → `requireOrgMember` → `req.org.id` — never authorize from URL alone
- Envelope: `{ success, message, data, error }` via `sendSuccess` / `sendError`
- Path aliases `@/` in API and web
- Constants in `*.constant.ts` (new domain `label`); mirror API and web keys/values
- Web HTTP only in `apps/web/services/*.service.ts` named `*Api`; UI uses TanStack Query
- Label CRUD admin-only; assign on issue any member
- Keep project-labels settings hidden (comment out nav, keep page file)
- Do not commit unless the user explicitly asks
- Do not implement steps 12–17 in this plan

## File map

| Path | Responsibility |
|------|----------------|
| `apps/api/prisma/schema.prisma` | `Label`, `IssueLabel` + relations |
| `apps/api/prisma/migrations/20260827190000_add_labels/migration.sql` | Tables + indexes |
| `apps/api/src/constants/label.constant.ts` | Name max, colors, hex pattern |
| `apps/api/src/constants/activity.constant.ts` | `IssueEventType.LABEL` |
| `apps/api/src/utils/label/labelColor.ts` | `isLabelColor` |
| `apps/api/src/utils/issue/issueEvent.ts` | `labelEventPayload` |
| `apps/api/src/utils/issue/issueLabels.ts` | `syncIssueLabels` |
| `apps/api/src/routes/labels.ts` | Label CRUD |
| `apps/api/src/routes/labels.tenant.test.ts` | Tenant + admin/member tests |
| `apps/api/src/routes/issues/issues.ts` | Nested labels on issue; PUT labels; create `labelIds` |
| `apps/api/src/routes/issues/labels.test.ts` | Assign + event tests |
| `apps/api/prisma/seed.ts` | Seed labels + attach Bug on Acme #1 |
| `apps/web/constants/label.constant.ts` | Mirrored consts |
| `apps/web/constants/activity.constant.ts` | `LABEL` |
| `apps/web/services/labels.service.ts` | HTTP wrappers |
| `apps/web/hooks/use-labels.ts` | Query + mutations |
| `apps/web/lib/query-keys.ts` | `labels(orgSlug)` |
| `apps/web/lib/mappers.ts` | Map `issue.labels` |
| `apps/web/components/common/settings/issue-labels-settings.tsx` | API-backed CRUD |
| `apps/web/components/layout/sidebar/nav-settings.tsx` | Hide project labels |
| `apps/web/components/layout/sidebar/create-new-issue/label-selector.tsx` | API labels |
| `apps/web/components/common/issues/details/issue-properties-panel.tsx` | Assign labels |
| `apps/web/components/common/issues/details/activity-feed.tsx` | Label event copy |
| `apps/web/components/common/issues/issue-context-menu.tsx` | Toggle via API |

---

### Task 1: Constants + color helper

- [x] Spec written
- [ ] Failing `isLabelColor` / `labelEventPayload` tests
- [ ] Constants + helpers
- [ ] Schema + migration

### Task 2: Labels CRUD API

- [ ] Failing tenant/role tests
- [ ] `labels.ts` router mounted on orgs
- [ ] Tests pass

### Task 3: Assign on issue + events

- [ ] Failing PUT/event tests
- [ ] `syncIssueLabels`, issue select includes labels, PUT route, create `labelIds`
- [ ] Tests pass

### Task 4: Seed + web

- [ ] Seed labels
- [ ] Services, hooks, settings, properties, selector, activity, hide project-labels nav
- [ ] Browser verify settings + issue properties
