# Saved views — design

**Date:** 2026-08-29  
**Status:** Implemented  
**Step:** [14-saved-views.md](../../steps/14-saved-views.md)  
**Parent:** [2026-08-27-v1-product-design.md](./2026-08-27-v1-product-design.md)

## Goal

Named, org-visible issue filters stored as JSON matching `IssueListQuery`. The owner CRUD’s a view; any org member can open it and run its filters through `listIssuesApi`. Circle views list/detail talk to the API (no mock views). Project views stay out.

## Decisions locked

| Topic | Choice |
|-------|--------|
| Scope | Org-scoped. Every row has `organization_id` + `owner_id` |
| Visibility | Any **member** may list and GET. Only the **owner** may PATCH / DELETE |
| Filters | JSON object whose keys are `IssueListQuery` filter fields (not `cursor` / `limit`) |
| `labelId` | Add to issue list query so a stored view can run a label filter |
| `assigneeId: "me"` | Rejected on save (session-relative; not a stored filter) |
| Name | Trimmed, 1–80 chars. Duplicates allowed |
| Icon / description / type | Not stored. UI uses `VIEW_ICON`; subtitle is a filter summary |
| Project views | Out. Hide the Circle Projects tab; keep the file |
| Team list | Client-filter where `filters.teamId` matches that team’s id or key |
| Nav | Restore workspace **Views**; restore team **Views** → `teamViewsPath` |
| ACL | No shared-vs-private beyond “owner edits, members can open” |

## Data model

### `views`

| Column | Notes |
|--------|--------|
| `id` | UUID PK |
| `organization_id` | FK → organizations, cascade |
| `owner_id` | FK → users, cascade |
| `name` | text, trimmed 1–80 chars |
| `filters` | JSON object (see shape below) |
| `created_at` / `updated_at` | timestamptz |

Indexes: `(organization_id)`, `(owner_id)`.

Prisma relations on `Organization` and `User` (`ViewOwner`).

### `filters` JSON

Allowed keys only (strict; unknown key → 400):

```ts
{
  teamId?: string;        // UUID or team key
  status?: string;
  priority?: string;
  assigneeId?: string;    // UUID, not "me"
  projectId?: string;     // UUID
  q?: string;
  statusCategory?: string;
  cycleId?: string;       // UUID
  labelId?: string;       // UUID
}
```

Empty `{}` is valid (all issues). Omit empty strings. Do not persist `cursor` or `limit`.

## Constants

`apps/api/src/constants/view.constant.ts` and `apps/web/constants/view.constant.ts` — same keys/values:

```ts
export const VIEW_NAME_MAX = 80;
```

Web also has `VIEW_ICON`, `ViewPath`, `viewsPath`, `viewPath` (moved off `workspace.constant.ts`). Team URL `teamViewsPath` stays in `team.constant.ts`.

## API

Envelope unchanged. `requireAuth` + `requireOrgMember`. Queries use `req.org.id`. Owner checks use `req.user.id`.

Mounted at `/orgs/:orgId/views`.

| Method | Path | Who | Behavior |
|--------|------|-----|----------|
| `GET` | `/orgs/:orgId/views` | member | `{ views }` newest `updatedAt` first |
| `POST` | `/orgs/:orgId/views` | member | `{ name, filters? }`. Default filters `{}`. 201 `{ view }` |
| `GET` | `/orgs/:orgId/views/:viewId` | member | `{ view }`. Missing in this org → 404 |
| `PATCH` | `/orgs/:orgId/views/:viewId` | owner | Any of name / filters. Non-owner → 403. Missing → 404 |
| `DELETE` | `/orgs/:orgId/views/:viewId` | owner | `{ id }`. Non-owner → 403. Missing → 404 |

Plus issue list:

| Method | Path | Behavior |
|--------|------|----------|
| `GET` | `/orgs/:orgId/issues?labelId=` | Filter issues that have that org label. Unknown / other-org id → empty list |

Unauthenticated → 401. Non-member → 403. Invalid name / filters / `assigneeId: "me"` / unknown keys → 400 `VALIDATION_ERROR`. Empty PATCH → 400.

### View shape

```ts
{
  id: string;
  name: string;
  filters: ViewFilters;
  ownerId: string;
  owner: { id: string; name: string };
  createdAt: string; // ISO
  updatedAt: string;
}
```

## Web

- `apps/web/services/views.service.ts`: `listViewsApi`, `getViewApi`, `createViewApi`, `patchViewApi`, `deleteViewApi`
- `apps/web/hooks/use-views.ts` via TanStack Query; `queryKeys.views(orgSlug)` / `queryKeys.view(orgSlug, viewId)`
- List page: API views, issues only. Hide Projects tab (comment out). Plus opens a create dialog (`name` + filter fields matching `IssueListQuery`)
- Team list: same, filtered by that team
- Detail: `useIssuesList(orgSlug, view.filters)` into existing `GroupedIssuesView`. Drop mock `filterIssuesForView`
- Header uses API view name + issue count; owner More menu: rename / delete
- Workspace nav: Views → `viewsPath`. Team nav: Views → `teamViewsPath`
- `mock-data/views.ts` stays on disk, unused by wired pages

## Seed

Each org: a handful of views owned by an admin (completed issues, a team-scoped view, a Bug-label view). Idempotent by name per org.

## Tests

- Unauthenticated GET → 401
- User B cannot `GET` org A’s views (403)
- Member can GET another member’s view; non-owner PATCH/DELETE → 403
- Owner can CRUD; unknown filter key / `assigneeId: "me"` → 400
- `labelId` list filter returns labeled issues; unknown id → empty list

Run: `pnpm --filter @relay/api test`

## Out of scope

- Shared-vs-private ACL
- Project views
- Icon / description / emoji picker
- Saving the live issue-list filter bar as a view
