# Relay v1 — shippable Linear-lite — design

**Date:** 2026-08-27  
**Status:** Approved for planning  
**Canonical product docs:** [SCOPE-V1.md](../../SCOPE-V1.md), [STEPS-V1.md](../../STEPS-V1.md), [ARCHITECTURE.md](../../ARCHITECTURE.md)

## Goal

MVP (steps 1–9) is a demoable core: auth, orgs, invites, issues, teams, projects. **v1** is the first product a real team can self-host: comments, labels, inbox, cycles, saved views, the settings that persist, SMTP email, and Docker for web + API + Postgres.

v1 is **not** Circle-complete Linear. Leftover Circle screens stay in the repo, hidden from live nav.

## Decisions locked

| Topic | Choice |
|-------|--------|
| Delivery | Sequential STEPS 10–17; one domain per step; spec → plan → build each slice |
| Realtime | **None.** Inbox uses TanStack Query polling. No Redis, no WebSockets |
| Email | Generic **SMTP** (`nodemailer`). Development may log the link if SMTP unset |
| Comments body | **Markdown string**, not Circle `ContentBlocks` |
| Notifications | Rows written **in the same request** as the triggering mutation. No job queue |
| Invites | Token stays hashed in DB; email (or dev log) carries the unhashed link |
| Leftover Circle | **Keep files.** Hide from nav. Do not delete. Do not reintroduce mock issues on v1 routes |
| Super-admin UI | **Out.** `users.is_super_admin` stays a flag only |
| Avatars / uploads | **Out.** Profile is name only |
| First code slice | Step 10 (comments + activity), after its own spec/plan |

## In (v1)

- Issue comments + activity feed (replace in-memory composer in `activity-feed.tsx`)
- Org issue labels (assign on issues; settings issue-labels page)
- Inbox (in-app notifications; restore sidebar Inbox item)
- Cycles (per-team timeboxes; optional `issues.cycle_id`)
- Saved views (named issue filters)
- Settings that persist: profile name, members (role/remove), teams, password change
- Transactional email: invites + password reset
- Self-host pack: Docker Compose for `web` + `api` + `postgres`
- Hide leftover Circle chrome

## Out (v2+)

- Billing / plans, SSO / SAML, realtime / WebSockets
- File uploads, attachments, avatars
- AI agent, code reviews, documents, initiatives
- SLAs, issue templates, integrations, Pulse, Asks, customer requests, releases
- Super-admin console
- Email for every inbox notification (invite + reset only)
- Comment reactions, issue subscribe, burn-up chart APIs

## Success criteria

- A team can self-host, invite via email, and run issues → comments → labels → cycles → inbox → saved views **without mock data on those screens**
- Org A cannot see org B
- Hidden Circle routes do not appear in live nav
- `docker compose up` brings up web, API, and Postgres (with documented env)

## Architecture (unchanged shape)

```text
Browser → Next.js :3000 → Express :4000 → Prisma → PostgreSQL
Email: API → nodemailer SMTP (optional in development)
Inbox: TanStack Query polling
```

- Tenancy: `requireAuth` → `requireOrgMember` → query with `req.org.id`
- Web HTTP: `apps/web/services/<domain>.service.ts` named `*Api`; UI uses TanStack Query
- Envelope: `{ success, message, data, error }`
- Constants: `constants/*.constant.ts`, one domain per file, mirrored API/web until `packages/shared`

## Slice sequence

```text
10 Comments/activity ──► 12 Inbox
11 Labels ────────────► 14 Saved views
13 Cycles ────────────► 14 Saved views
10 + 11 ──────────────► 15 Settings chrome
15 ───────────────────► 16 Email/auth
16 ───────────────────► 17 Self-host pack
```

Comments before labels because the issue-detail mock is the most visible gap and inbox depends on comments. Labels and comments do not block each other; do not implement them in the same step.

Each step gets a thin file under `docs/steps/`. Implementation still needs a per-slice spec/plan before code (same as KeyStore / orgs).

### 10 — Comments and activity

- Tables: `comments`, `issue_events` (both include `organization_id`)
- Events on create / status / priority / assignee in this step; labels and cycle events when those slices land
- API: list activity, create comment, delete **own** comment
- UI: wire `activity-feed.tsx`; drop mock users and in-memory composer
- Hide Subscribe and reactions in the feed (v2)

Detail: [2026-08-27-issue-comments-activity-design.md](./2026-08-27-issue-comments-activity-design.md)

### 11 — Labels

- Tables: `labels` (org-scoped name + color), `issue_labels` join
- API: CRUD labels (**admin**), set labels on an issue (**any member**)
- UI: issue properties + settings issue-labels page
- Keep project-labels settings hidden

### 12 — Inbox

- Table: `notifications` (`user_id`, `organization_id`, `type`, `issue_id`, `actor_id`, `read_at`)
- Emit on: comment (if recipient is not the author), assignee change (new assignee), status change (assignee if set)
- API: list, mark one read, mark all read — current user in current org
- UI: restore Inbox in `nav-inbox.tsx`; poll with `refetchInterval` (default 15s)
- No notification emails in v1

### 13 — Cycles

- Table: `cycles` (`organization_id`, `team_id`, `name`, `starts_at`, `ends_at`, `status`)
- `issues.cycle_id` nullable FK, `ON DELETE SET NULL`
- Status: `upcoming` | `active` | `completed`
- **One active cycle per team** (enforced in API)
- API: list/create/update; issue list filter `cycleId`; patch issue `cycleId`
- UI: restore cycle links under team nav; reuse Circle cycle pages; skip burn-up chart APIs (show list + dates)

### 14 — Saved views

- Table: `views` (`organization_id`, `owner_id`, `name`, `filters` JSON)
- `filters` keys match existing `IssueListQuery` (`teamId`, `status`, `priority`, `assigneeId`, `projectId`, `q`, `statusCategory`, plus `cycleId` / `labelId` once those exist)
- API: CRUD **own** views; any org member may `GET` a view by id
- UI: restore views list/detail; execute via `listIssuesApi` with stored filters

### 15 — Settings chrome

- Persist profile **name** via `PATCH /auth/me` (`{ name }`)
- Members: `PATCH` role + `DELETE` membership (**admin**). Last admin cannot be removed / demoted
- Settings nav **keep:** Preferences (client-only ok), Profile, Security, Teams
- Settings nav **hide** (comment out, keep files): Code & reviews, Connected accounts, Agent personalization, Issue templates, SLAs, project labels/templates/statuses/updates, AI, Initiatives, Documents, Customer requests, Releases, Pulse, Asks, Emojis, Integrations
- Issue labels nav stays (step 11)
- Preferences stay client-only unless a field must sync

### 16 — Email and auth polish

- Env: `SMTP_HOST`, `SMTP_PORT`, `SMTP_USER`, `SMTP_PASS`, `SMTP_FROM`
- Development: if SMTP unset, log the URL (same pattern as today’s invite log in `invites.ts`)
- Send on invite create
- `POST /auth/forgot-password` + `POST /auth/reset-password` (hashed token, short TTL, delete all KeyStores for that user on reset)
- Web: forgot / reset pages; invite UI shows “email sent” and still allows copy-link in development
- Password **change** while logged in (current password + new) lives here or in step 15 Security — implement once, in step 16, so SMTP and reset share the password module

### 17 — Self-host pack

- Extend `docker-compose.yml` with `api` and `web` (today it is Postgres only)
- `.env.example` lists production vars: `WEB_ORIGIN`, `NODE_ENV=production`, `TRUST_PROXY`, SMTP
- Root README: one-command bring-up
- Smoke on a clean compose stack: register → invite email → comment → label → cycle → inbox → save view

## Leftover Circle

Keep component files (web rule). Hide from `nav-settings.tsx` and workspace nav: reviews, agent, initiatives, documents, and unused settings groups. Direct URLs may 404 or show a short “not available” stub. Never serve mock issue lists on wired v1 routes.

## Constants

New domains as slices land (not one file per value):

| Domain | File | When |
|--------|------|------|
| Activity / comments | `activity.constant.ts` | step 10 |
| Labels | `label.constant.ts` | step 11 |
| Inbox | `inbox.constant.ts` | step 12 |
| Cycles | `cycle.constant.ts` | step 13 |
| Views | `view.constant.ts` | step 14 |
| Mail | `mail.constant.ts` | step 16 |

Path builders stay in the matching domain. Mirror keys/values on API and web.

## Testing

Per slice, minimum:

- Tenant isolation: user B cannot read user A’s org-scoped row (comment, label, notification, cycle, view)
- Auth: unauthenticated → 401
- Role where specified (label CRUD admin-only; member remove admin-only)

Do not block a slice on full UI coverage.

## Docs this spec owns

- [SCOPE-V1.md](../../SCOPE-V1.md) — v1 in/out
- [STEPS-V1.md](../../STEPS-V1.md) — steps 10–17
- Thin `docs/steps/10-*.md` … `17-*.md`
- Step 10 detailed spec (separate file) before any comments code

Do not commit these files unless the human explicitly asks.

## Out of this spec’s implementation

No application code in the v1 product-spec pass. First implementation is step 10, after that slice’s spec and plan are written.
