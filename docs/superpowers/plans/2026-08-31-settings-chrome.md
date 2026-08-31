# Settings chrome Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Persist profile name via `PATCH /auth/me`. Admin can change member role / remove a member; last admin cannot be demoted or removed. Hide leftover Circle settings nav; keep files.

**Architecture:** Auth PATCH on the existing auth router. Member PATCH/DELETE on a nested `routes/members/` router (admin + last-admin guard). Web: `*Api` services + TanStack Query; wire Circle profile and members list; comment out leftover `settingsNav` items.

**Tech Stack:** Express, Prisma, Zod, TanStack Query, existing envelope + `requireAuth` + `requireOrgMember` + `requireOrgRole`

**Spec:** [docs/superpowers/specs/2026-08-31-settings-chrome-design.md](../specs/2026-08-31-settings-chrome-design.md)

## Global Constraints

- Tenancy: `requireAuth` → `requireOrgMember` → `req.org.id` — never authorize from URL alone
- Envelope: `{ success, message, data, error }` via `sendSuccess` / `sendError`
- Path aliases `@/` in API and web
- Web HTTP only in `apps/web/services/*.service.ts` named `*Api`; UI uses TanStack Query
- Do not delete Circle files; hide leftover settings nav by commenting out
- Do not change `apps/web/mock-data/**`
- Do not commit unless the user explicitly asks
- Do not implement steps 16–17 in this plan (password change, SMTP, avatars)

## File map

| Path | Responsibility |
|------|----------------|
| `apps/api/src/routes/auth/auth.schema.ts` | `patchMeBodySchema` |
| `apps/api/src/routes/auth/auth.ts` | `PATCH /me` |
| `apps/api/src/routes/auth/auth.me.test.ts` | Name update + 401/400 |
| `apps/api/src/openapi/paths/auth.ts` | Register `PATCH /auth/me` |
| `apps/api/src/routes/members/members.ts` | List + PATCH/DELETE (moved from `routes/members.ts`) |
| `apps/api/src/routes/members/members.schema.ts` | Role Zod |
| `apps/api/src/routes/members/members.tenant.test.ts` | Admin ACL + last admin + tenant |
| `apps/api/src/openapi/paths/orgs.ts` | PATCH/DELETE member paths |
| `apps/web/constants/auth.constant.ts` | `AuthApiPath.ME` |
| `apps/web/services/auth.service.ts` | `patchMeApi` |
| `apps/web/hooks/use-session.ts` | `usePatchMe` |
| `apps/web/services/members.service.ts` | `patchMemberApi`, `deleteMemberApi` |
| `apps/web/hooks/use-members.ts` | Mutations |
| `apps/web/components/common/settings/profile.tsx` | Session name |
| `apps/web/components/common/members/*` | Role/remove for admins |
| `apps/web/components/layout/sidebar/nav-settings.tsx` | Hide leftover items |
| `apps/web/components/layout/sidebar/nav-teams-settings.tsx` | API teams |

---

### Task 1: `PATCH /auth/me`

- [ ] Schema + failing tests (401, blank name, persist + session)
- [ ] Handler + OpenAPI
- [ ] Tests pass

### Task 2: Member role + remove

- [ ] Nest `members` routes; PATCH/DELETE admin-only
- [ ] Last admin cannot be demoted or removed
- [ ] Tenant + ACL tests; OpenAPI paths

### Task 3: Web chrome

- [ ] Profile name from session; `patchMeApi`
- [ ] Members list: admin role dropdown + remove
- [ ] Hide leftover settings nav; wire `NavTeamsSettings` to API teams
