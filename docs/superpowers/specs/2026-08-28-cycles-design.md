# Cycles — design

**Date:** 2026-08-28  
**Status:** Implemented  
**Step:** [13-cycles.md](../../steps/13-cycles.md)  
**Parent:** [2026-08-27-v1-product-design.md](./2026-08-27-v1-product-design.md)

## Goal

Per-team timeboxed cycles. An issue may belong to one cycle. The API allows at most one **active** cycle per team. Circle cycle list/detail pages show API names and dates; burn-up stays hidden.

## Decisions locked

| Topic | Choice |
|-------|--------|
| Scope | Team-scoped. Every row has `organization_id` + `team_id` |
| Status | `upcoming` \| `active` \| `completed`. Circle `current` is `active` |
| Planned | No fourth status |
| One active | Partial unique index on `team_id` where `status = 'active'` **and** API 400 |
| CRUD | Any **member** (same as teams). No delete — complete instead |
| Issue link | `issues.cycle_id` nullable, `ON DELETE SET NULL` |
| Cross-team cycle | 400. Changing an issue’s team clears `cycle_id` if it is not on the new team |
| Dates | `starts_at` / `ends_at` timestamptz. `endsAt` must be after `startsAt` |
| Events | `cycle` activity with `{ from, to }` as cycle **names** (null when unset) |
| Burn-up | Hidden in UI. No capacity APIs |
| Filters / command palette | Out of this slice (still mock) |

## Data model

### `cycles`

| Column | Notes |
|--------|--------|
| `id` | UUID PK |
| `organization_id` | FK → organizations, cascade |
| `team_id` | FK → teams, cascade |
| `name` | text, trimmed 1–80 chars |
| `starts_at` / `ends_at` | timestamptz |
| `status` | `upcoming` \| `active` \| `completed` |
| `created_at` / `updated_at` | timestamptz |

Indexes: `(organization_id)`, `(team_id, starts_at)`, `(team_id, status)`. Unique: one active row per `team_id` (SQL `WHERE status = 'active'`).

Prisma relations on `Team`, `Organization`, `Issue`.

### `issues.cycle_id`

Nullable UUID FK → `cycles.id`, `ON DELETE SET NULL`. Index `(cycle_id)`.

## Constants

`apps/api/src/constants/cycle.constant.ts` and `apps/web/constants/cycle.constant.ts` — same keys/values:

```ts
export const CycleStatus = {
  UPCOMING: 'upcoming',
  ACTIVE: 'active',
  COMPLETED: 'completed',
} as const;

export const CYCLE_NAME_MAX = 80;
```

`IssueEventType.CYCLE = 'cycle'` in both `activity.constant.ts` files.

Team URL builders stay in `team.constant.ts`.

## API

Envelope unchanged. `requireAuth` + `requireOrgMember`. Queries use `req.org.id`. Team from `findTeam(org, teamId)` (UUID or key).

Mounted at `/orgs/:orgId/teams/:teamId/cycles`.

| Method | Path | Who | Behavior |
|--------|------|-----|----------|
| `GET` | `/orgs/:orgId/teams/:teamId/cycles` | member | `{ cycles }` newest `startsAt` first. Each row includes `issueCount` |
| `POST` | `/orgs/:orgId/teams/:teamId/cycles` | member | `{ name, startsAt, endsAt, status? }`. Default status `upcoming`. 201 `{ cycle }` |
| `PATCH` | `/orgs/:orgId/teams/:teamId/cycles/:cycleId` | member | Any of name / dates / status. Missing → 404. 200 `{ cycle }` |

Plus issue routes:

| Method | Path | Behavior |
|--------|------|----------|
| `GET` | `/orgs/:orgId/issues?cycleId=` | Filter. Unknown cycle in this org → empty list |
| `POST` / `PATCH` | issues | Optional `cycleId` (`string \| null`). Nested `cycle` on the issue |

Unauthenticated → 401. Non-member → 403. Unknown team → 404.

Second **active** cycle for the same team → 400 `VALIDATION_ERROR` (`Team already has an active cycle`). Invalid dates / status / name → 400. Cycle id from another team or org on an issue → 400.

### Cycle shape

```ts
{
  id: string;
  name: string;
  status: 'upcoming' | 'active' | 'completed';
  startsAt: string; // ISO
  endsAt: string;
  teamId: string;
  issueCount: number;
  createdAt: string;
  updatedAt: string;
}
```

Issue nested `cycle`: `{ id, name, status } | null`. `cycleId: string | null`.

### Events

Patch (or create) that changes `cycleId` writes one `cycle` event: `{ from, to }` are names, or `null`. Unchanged id writes none. Team change that clears the cycle writes the same event.

## Web

- `apps/web/services/cycles.service.ts`: `listCyclesApi`, `createCycleApi`, `patchCycleApi`
- `apps/web/hooks/use-cycles.ts` via TanStack Query; `queryKeys.cycles(orgSlug, teamId)`
- `nav-teams.tsx`: restore **Cycles** → `teamCyclesPath`
- Cycles timeline + active/upcoming issue pages: API list + dates; `listIssuesApi({ teamId, cycleId })`
- Headers use `useTeam` + API cycle (drop mock `teams` / `getCurrentCycle`)
- Hide burn-up (`CycleBurnupChart`) and mock capacity rings on wired cycle pages
- `mapApiIssue` maps `cycleId` / nested `cycle` name on properties
- `mock-data/cycles.ts` stays on disk, unused by wired pages

## Seed

Each team in each org: five two-week cycles (three completed, one active, one upcoming), two named projects, and sample issues on those projects. Re-seed normalizes cycle dates/status and re-spreads every issue onto cycles by status. Idempotent.

## Tests

- Unauthenticated GET → 401
- User B cannot `GET` org A’s cycles (403)
- Member can create/update; second active on the same team → 400
- `cycleId` list filter; patch issue cycle; other-team cycle id → 400
- Cycle change writes a `cycle` event; unchanged writes none

Run: `pnpm --filter @relay/api test`

## Out of scope

- Burn-up / capacity APIs
- Delete cycle
- Cycle create form (API only; Circle list is enough)
- Documents
- Issue-list filter column / command palette cycle search (still mock)
