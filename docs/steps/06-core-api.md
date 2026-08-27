# Step 6 — Core screens (API + UI)

**Status:** Done

## Goal

Finish the **MVP path screen by screen**, top to bottom. Each Must-complete screen is a vertical slice: schema if missing → tenant-scoped API → that screen off mocks.

Do not ship API-only for a Must-complete screen. If an earlier step left a required screen half-done, finish it here before moving down the list.

## Prerequisites

- Steps 3–5 done (auth, orgs, memberships, invites API)
- Circle UI running under `apps/web` (still on mock-data for domain screens)

## How to work this step

1. Read the **screen list** — that is the order of work.
2. For the next Must-complete row: implement only what that screen needs, then mark it done.
3. Shared tables (`teams`, `issues`) land with the **first** screen that needs them (issues list). Later screens reuse the same API.
4. Leave Later / Out of MVP screens on mocks or hide them from nav. Do not build them in this step.

---

## Screen list (routes)

Work **top → down**. `Complete` means API + this screen wired, no mock as source of truth.

### Must complete (this step)

| # | Screen | Route | Today | This step |
|---|--------|-------|-------|-----------|
| 1 | Login | `/login` | API wired; redirects to hardcoded `/lndev-ui/team/CORE/all` | Send user to a real org home (or create-org if none) |
| 2 | Register | `/register` | Same hardcoded home | Same as login |
| 3 | App home | `/` | Hardcoded `lndev-ui` redirect | `GET /orgs` → first org home, else create-org |
| 4 | Create org | `/new` (add) | **Missing** (API `POST /orgs` exists) | Form → create org + default team → issues list |
| 5 | Accept invite | `/invite/[token]` (add) | **Missing** (API exists) | Logged-in user accepts → org home |
| 6 | Org switcher | shell (`OrgSwitcher`) | Hardcoded `lndev-ui` | List real orgs; switch by slug; logout already works |
| 7 | Team issues | `/[orgId]/team/[teamId]/all` | Mock | **Main list.** Filters, create, reorder |
| 8 | Active issues | `/[orgId]/team/[teamId]/active` | Mock (`AllIssues` + category filter) | Same list API with status-category filter |
| 9 | Backlog | `/[orgId]/team/[teamId]/backlog` | Mock | Same as #8 |
| 10 | Create issue | sidebar modal (not a route) | Mock Zustand | `POST` issue; modal stays UI-only |
| 11 | Issue detail | `/[orgId]/issue/[issueId]` | Mock | Get + patch title/status/priority/assignee/description |
| 12 | My issues | `/[orgId]/my-issues` | Mock | List with `assigneeId=me` |
| 13 | Members | `/[orgId]/members` | Mock | List members; admin creates invite |

`[orgId]` is the org **slug**. `[teamId]` is the team **key** (e.g. `CORE`).

### Thin this step (enough for nav + issue FKs; full CRUD in step 8)

| # | Screen | Route | This step |
|---|--------|-------|-----------|
| 14 | Teams | `/[orgId]/teams` | `GET` teams; show seeded/default team |
| 15 | Team home | `/[orgId]/team/[teamId]/overview` | Resolve real team; keep overview widgets static if needed |
| 16 | Projects | `/[orgId]/projects` | Optional: list if `projects` table exists; else hide nav item |
| 17 | Project issues | `/[orgId]/project/[projectId]/issues` | Optional: issues list filtered by `projectId` |

### Later (step 7 hide or step 8+)

| Screen | Route |
|--------|-------|
| Team projects | `/[orgId]/team/[teamId]/projects` |
| Project overview / activity | `/[orgId]/project/[projectId]/overview`, `.../activity` |
| Views | `/[orgId]/views`, `/[orgId]/view/[viewId]`, team views |
| Inbox / reviews | `/[orgId]/inbox`, `/[orgId]/reviews`, `/[orgId]/review/...` |
| Settings (most) | `/[orgId]/settings/*` except a working back-to-app link |
| Profile | `/[orgId]/profiles/[memberId]`, `/[orgId]/settings/profile` |

### Out of MVP (hide from nav; leave pages alone)

| Screen | Route | Why |
|--------|-------|-----|
| Cycles | `/[orgId]/team/[teamId]/cycles`, `.../cycle/*` | SCOPE: later |
| Documents | `/[orgId]/team/[teamId]/documents`, settings documents | SCOPE: later |
| Agent | `/[orgId]/agent`, settings AI / agent | SCOPE: later |
| Initiatives | `/[orgId]/initiatives`, `/[orgId]/initiative/[initiativeId]` | SCOPE: later |

---

## Shared rules (every org-scoped handler)

```text
requireAuth → requireOrgMember → query with req.org.id
```

Never authorize from URL `orgId` alone. Prefix: `/orgs/:orgId/...` where `:orgId` is **slug**.

JSON envelope: `{ success, message, data, error }` — see [project-rules/api-rules.md](../project-rules/api-rules.md).

Statuses/priorities: store Circle **ids** as strings (`to-do`, `in-progress`, `urgent`, …) so the UI mapper stays thin. Categories (`started`, `backlog`, …) can be derived in the API or mapped in web from the same const list.

---

## 1–6 — Auth / org shell (finish incomplete screens)

Login, register, and logout already hit the API. They are **not complete** until URLs use a real slug.

### Behavior

After login / register / `/`:

1. `GET /orgs`
2. If empty → `/new`
3. Else → `/${org.slug}/team/${defaultTeamKey}/all`

`defaultTeamKey`: first team for that org (`GET /orgs/:slug/teams`). Until teams exist, org create must insert a default team (`key` unique per org, e.g. `CORE`).

### New / missing UI

| Screen | Files (expected) | API |
|--------|------------------|-----|
| Create org | `apps/web/app/new/page.tsx` | `POST /orgs` `{ name, slug }` — already exists; **also create default team** in that transaction |
| Accept invite | `apps/web/app/invite/[token]/page.tsx` | `POST /invites/:token/accept` — already exists. Require login; if anonymous, redirect `/login?next=/invite/:token` |
| Org switcher | `apps/web/components/layout/sidebar/org-switcher.tsx` | `GET /orgs` |

Replace every hardcoded `lndev-ui` / `APP_HOME` in `app/page.tsx`, `login/page.tsx`, `register/page.tsx`, `org-switcher.tsx`, `nav-inbox.tsx`, `nav-teams.tsx`.

### Done when (1–6)

- [x] Logged-in user never lands on `/lndev-ui/...`
- [x] User with no orgs can create one and land on that org’s issues list
- [x] Invite link works for a matching logged-in email
- [x] Org switcher shows real org names/slugs

---

## 7–9 — Team issues list (main workflow)

**Routes:** `/[orgId]/team/[teamId]/all` · `.../active` · `.../backlog`

This is the core of the original “issues API” step. Ship schema + CRUD + this screen together.

### Schema (if not already migrated)

`teams`

| Column | Notes |
|--------|--------|
| `id` | UUID PK |
| `organization_id` | FK |
| `key` | unique per org (URL `[teamId]`) |
| `name` | display |
| timestamps | |

`issues`

| Column | Notes |
|--------|--------|
| `id` | UUID PK |
| `organization_id` | FK |
| `team_id` | FK |
| `project_id` | nullable FK (ok null in this step) |
| `number` | int, unique per team |
| `title` | |
| `description` | text, nullable (markdown later) |
| `status` | string (Circle id) |
| `priority` | string (Circle id) |
| `assignee_id` | nullable FK → users |
| `rank` | text (LexoRank) |
| timestamps | |

Display identifier = `{team.key}-{number}` (e.g. `CORE-12`). Do not store a separate identifier column unless you need it.

### Endpoints

| Method | Path | Behavior |
|--------|------|----------|
| `GET` | `/orgs/:orgId/teams` | List teams (needed for sidebar + default home) |
| `GET` | `/orgs/:orgId/issues` | List + filters |
| `POST` | `/orgs/:orgId/issues` | Create (default status/priority/rank; next `number`) |
| `GET` | `/orgs/:orgId/issues/:issueId` | Detail (used by screen 11) |
| `PATCH` | `/orgs/:orgId/issues/:issueId` | Update fields including `rank` |
| `DELETE` | `/orgs/:orgId/issues/:issueId` | Hard delete MVP |

`issueId` may be UUID **or** display id (`CORE-12`) — pick one, document it, use it in the issue-detail route.

### List filters (query)

Support what these three pages need:

- `teamId` (team key or uuid — document)
- `status`, `priority`, `assigneeId`, `projectId`, `q`
- `statusCategory` — `started` (active), `backlog`+`triage` (backlog); omit on `/all`
- Pagination: `limit` + `cursor` (prefer cursor). Default limit 50.

### Rank

On create: append (rank after last in that team).

On reorder: accept `rank` **or** `beforeIssueId` / `afterIssueId`; compute server-side. Do not trust array index.

### Validation

- Zod on create/update
- Assignee and project (when set) must belong to the same org
- Non-member → 403

### UI

- `apps/web/app/[orgId]/team/[teamId]/all/page.tsx` (and active/backlog) already render `AllIssues`
- Replace mock reads in the issues store/components with API
- Sidebar `NavTeams`: real teams, links `/${orgId}/team/${team.key}/all` (today hardcoded `lndev-ui`)

### Done when (7–9)

- [x] Authenticated member sees API issues on `/all`, `/active`, `/backlog`
- [x] Non-member cannot list
- [x] Filters work for status / assignee / search
- [x] Rank updates work for at least one reorder path
- [x] Hard refresh shows the same list

---

## 10 — Create issue (modal)

**UI:** `apps/web/components/layout/sidebar/create-new-issue/`

`POST /orgs/:orgId/issues` with `title`, optional `status`, `priority`, `assigneeId`, `projectId`, `teamId` (default current team).

Selectors can stay Circle components; options come from API (members, teams) or the same status/priority consts the API uses.

### Done when (10)

- [x] Submit creates a row; it appears on the list after refresh / invalidation
- [x] Modal does not write to mock/Zustand as source of truth

---

## 11 — Issue detail

**Route:** `/[orgId]/issue/[issueId]`

`GET` + `PATCH` title, description, status, priority, `assigneeId`.

Skip Circle mock extras: comments, activity feed, related issues, PRs, cycles, file attachments.

### Done when (11)

- [x] Open from list → real issue
- [x] Edit title/status/priority/assignee persists after refresh

---

## 12 — My issues

**Route:** `/[orgId]/my-issues`

Same list endpoint with `assigneeId` = current user. Fix inbox nav URLs (today `/lndev-ui/my-issues`).

### Done when (12)

- [x] Shows only issues assigned to the session user
- [x] Empty state when none

---

## 13 — Members

**Route:** `/[orgId]/members`

Needed for SCOPE: invite a member, then they can use issues.

| Method | Path | Behavior |
|--------|------|----------|
| `GET` | `/orgs/:orgId/members` | Memberships + user `{ id, name, email }` |
| `POST` | `/orgs/:orgId/invites` | Already exists (admin) |

UI: list members; admin form for email + role; show invite URL once (dev: also console, already logged by API).

No member directory polish, no profile pages.

### Done when (13)

- [x] Members list is API data
- [x] Admin can invite; invitee accepts on screen 5 and appears in the list

---

## 14–15 — Teams (thin)

`GET /orgs/:orgId/teams` from screen 7. Teams page and team overview **resolve the real team** so Circle routes stop using mock `CORE` / `lndev-ui`.

Create/update team, team settings, members-of-team → step 8.

### Done when (14–15)

- [x] `/[slug]/teams` lists API teams
- [x] `/[slug]/team/[key]/overview` does not 404 for the default team

---

## 16–17 — Projects (optional in this step)

If you add `projects` now: `GET` list + `projectId` on issues. Full project screens and create-project → [08-projects-teams.md](./08-projects-teams.md).

If skipped: hide Projects in workspace nav until step 8.

---

## Align with Circle fields

| Concept | Circle-ish | API / DB |
|---------|------------|----------|
| Title | `title` | `title` |
| Status | status id | `status` string |
| Priority | priority id | `priority` string |
| Assignee | user | `assignee_id` nullable |
| Project | project | `project_id` nullable |
| Team | team | `team_id` + `key` |
| Cycle | cycleId | out of MVP |
| Order | LexoRank | `rank` text |
| Identifier | `LNUI-703` | `{team.key}-{number}` |

Prefer JSON the UI can map thinly rather than rewriting Circle components.

---

## Out of this step

- Labels M2M, comments, activity
- Issue detail rich blocks
- Cycles, documents, agent, inbox, views, initiatives
- Billing, SSO, realtime (SCOPE)

---

## Manual test (MVP path)

1. Register → `/new` → create org → land on `/{slug}/team/CORE/all`
2. Create issue → appears on list; refresh still shows it
3. Open detail → change status/assignee → persists
4. Invite second user → they accept → see members + issues; cannot see another org
5. Login as existing seed user → org switcher uses real slugs, not `lndev-ui`

---

## Done when (step)

- [x] Screens **1–13** complete (table above)
- [x] Screens **14–15** thin-complete
- [x] Nav for Out of MVP items hidden or clearly inert
- [x] No production path for those screens depends on `mock-data` issues/users/teams

## Next

[07-wire-ui.md](./07-wire-ui.md) — leftover Circle routes (hide or keep mock).  
[08-projects-teams.md](./08-projects-teams.md) — full teams/projects CRUD.
