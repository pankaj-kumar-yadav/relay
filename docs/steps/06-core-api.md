# Step 6 — Core API (issues)

**Status:** Pending

## Goal

Ship tenant-scoped **issues CRUD** (plus statuses/priorities/labels as needed) so the UI can stop using mocks for the main workflow.

## Prerequisites

- Steps 3–5 done
- `issues` table (and related) migrated

## Align with Circle fields (mapping)

Use Circle’s issue shape as the **API contract target** where practical:

| Concept | Circle-ish field | API / DB |
|---------|------------------|----------|
| Title | `title` | `title` |
| Status | status object / id | `status` enum or FK |
| Priority | priority | `priority` enum or FK |
| Assignee | user | `assignee_id` nullable |
| Project | project | `project_id` nullable |
| Team | team | `team_id` |
| Cycle | cycleId | defer (out of MVP API) |
| Order | `rank` (LexoRank) | `rank` text |
| Identifier | `LNUI-703` | `number` per team/org + display `KEY-number` |

Prefer returning JSON that the UI can adapt with a thin mapper in `apps/web` rather than forcing Circle components to change wholesale.

## Endpoints (minimum)

Prefix all with org scope, e.g. `/orgs/:orgId/...`:

| Method | Path | Behavior |
|--------|------|----------|
| `GET` | `/issues` | List + filters (status, assignee, project, search) |
| `GET` | `/issues/:issueId` | Detail |
| `POST` | `/issues` | Create (default status/priority/rank) |
| `PATCH` | `/issues/:issueId` | Update fields |
| `DELETE` | `/issues/:issueId` | Delete (or archive) |
| `PATCH` | `/issues/:issueId/status` | Board drag convenience (optional if PATCH covers it) |

### List filters (query params)

Support early what Circle filters need:

- `status`, `priority`, `assigneeId`, `projectId`, `q` (search)
- Pagination: `cursor` or `limit`/`offset` — pick one and document

## Rank / board ordering

Circle uses LexoRank. On create:

1. Insert with a rank between neighbors or at end
2. On reorder, accept `rank` or `beforeIssueId` / `afterIssueId` and compute new rank server-side

Do not rely on array index as source of truth.

## Validation

- Zod schemas for create/update
- Reject cross-org IDs (assignee/project must belong to same org)

## Optional in this step

- Labels M2M table
- Comments / activity feed (can wait)
- Issue detail rich blocks (Circle mock) — return simple markdown/text for MVP

## Done when

- [ ] Authenticated org member can CRUD issues
- [ ] Non-member cannot
- [ ] Filters work for the main list
- [ ] Rank updates work for at least one reorder path
- [ ] OpenAPI or a short `docs/api-issues.md` lists routes + example payloads (optional but useful)

## Next

[07-wire-ui.md](./07-wire-ui.md)
