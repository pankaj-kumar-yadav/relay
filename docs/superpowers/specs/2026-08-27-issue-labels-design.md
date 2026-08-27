# Issue labels — design

**Date:** 2026-08-27  
**Status:** Implemented  
**Step:** [11-labels.md](../../steps/11-labels.md)  
**Parent:** [2026-08-27-v1-product-design.md](./2026-08-27-v1-product-design.md)

## Goal

Org-scoped issue labels. Admins CRUD them in settings. Any member assigns them on an issue. Issue properties and the settings issue-labels page talk to the API. Label changes write activity events.

## Decisions locked

| Topic | Choice |
|-------|--------|
| Scope | Workspace (org) labels only. No project labels |
| Name | Trimmed, 1–40 chars. Unique per org, **case-insensitive** |
| Color | Hex `#RRGGBB`. Palette in `label.constant.ts`; API accepts any matching hex |
| Join | Explicit `issue_labels` with `organization_id` (not Prisma implicit M2M) |
| Label CRUD | **Admin** only (`requireOrgRole(ADMIN)`) |
| Assign on issue | **Any member**. Replace-all via `PUT …/issues/:issueId/labels` `{ labelIds }` |
| Create issue | Optional `labelIds` (same validation as PUT) |
| Event type | `label`. Payload `{ added, removed }` each `Array<{ id, name }>` (names survive later delete) |
| Unchanged set | No event |
| Delete label | Cascade join rows. No events on issues that had it |
| Max on one issue | `LABEL_IDS_MAX` = 20 |
| List on issue | `labels: { id, name, color }[]` on issue GET/list/create/patch/PUT |
| Project-labels nav | Hidden (comment out). Page file stays |
| Filters / command palette | Out of this slice (still mock). Properties + settings + create-issue + context menu are in |

## Data model

### `labels`

| Column | Notes |
|--------|--------|
| `id` | UUID PK |
| `organization_id` | FK → organizations, cascade |
| `name` | text |
| `color` | text, `#RRGGBB` |
| `created_at` / `updated_at` | timestamptz |

Indexes: `(organization_id)`, unique `(organization_id, name)` (exact). Case-insensitive uniqueness is enforced in the API.

### `issue_labels`

| Column | Notes |
|--------|--------|
| `id` | UUID PK |
| `organization_id` | FK → organizations, cascade |
| `issue_id` | FK → issues, cascade |
| `label_id` | FK → labels, cascade |
| `created_at` | timestamptz |

Unique `(issue_id, label_id)`. Indexes `(organization_id)`, `(label_id)`.

Prisma relations on `Issue`, `Organization`, `Label`.

## Constants

`apps/api/src/constants/label.constant.ts` and `apps/web/constants/label.constant.ts` — same keys/values:

```ts
export const LABEL_NAME_MAX = 40;
export const LABEL_IDS_MAX = 20;
export const LABEL_COLOR_PATTERN = /^#[0-9A-Fa-f]{6}$/;
export const LABEL_COLORS = [
  '#EB5757',
  '#F2994A',
  '#F2C94C',
  '#27AE60',
  '#2F80ED',
  '#9B51E0',
  '#BB6BD9',
  '#56CCF2',
  '#6FCF97',
  '#4F4F4F',
] as const;
export const DEFAULT_LABEL_COLOR = LABEL_COLORS[4];
```

`IssueEventType.LABEL = 'label'` in both `activity.constant.ts` files.

Path: `issueLabelsPath` stays unused; org settings path already exists as `OrgPath.SETTINGS_ISSUE_LABELS`.

## API

Envelope unchanged. All org routes: `requireAuth` + `requireOrgMember`. Queries use `req.org.id`.

Mounted at `/orgs/:orgId/labels` and on the issues router.

| Method | Path | Who | Behavior |
|--------|------|-----|----------|
| `GET` | `/orgs/:orgId/labels` | member | `{ labels }` ordered by name. Each row `{ id, name, color, createdAt, issueCount }` |
| `POST` | `/orgs/:orgId/labels` | admin | Body `{ name, color? }`. Default color `DEFAULT_LABEL_COLOR`. 201 `{ label }` |
| `PATCH` | `/orgs/:orgId/labels/:labelId` | admin | `{ name?, color? }`. 200 `{ label }`. Missing → 404 |
| `DELETE` | `/orgs/:orgId/labels/:labelId` | admin | 200 `{ id }`. Missing → 404 |
| `PUT` | `/orgs/:orgId/issues/:issueId/labels` | member | `{ labelIds: string[] }`. Replace set. Unknown / other-org ids → 400. 200 `{ issue }` |

Employee hitting POST/PATCH/DELETE labels → 403.

Non-member hitting another org’s GET labels → 403 (same as other org routes).

Duplicate name (case-insensitive) → 400 validation.

Empty `labelIds` clears labels.

### Label shape

```ts
{
  id: string;
  name: string;
  color: string;
  createdAt: string; // ISO; omitted on nested issue.labels
  issueCount?: number; // list only
}
```

Issue `labels` (nested): `{ id, name, color }[]` sorted by name.

### Events

Helper `labelEventPayload(added, removed)` in `issueEvent.ts`. `PUT` labels and `POST` issue with `labelIds` write one `label` event when the set changes.

## Web

- `apps/web/services/labels.service.ts`: `listLabelsApi`, `createLabelApi`, `patchLabelApi`, `deleteLabelApi`, `setIssueLabelsApi`
- `apps/web/hooks/use-labels.ts` via TanStack Query
- Query key: `queryKeys.labels(orgSlug)`
- Settings `issue-labels-settings.tsx`: API list; admin create/edit/delete; drop mock issues/descriptions/last-applied
- Issue properties: `LabelSelector` + `LabelBadge` against API; `useIssueMutations.updateIssueLabels`
- Create-issue dialog: `LabelSelector`; send `labelIds`
- Issue context menu: toggle via `setIssueLabelsApi` (not mock catalog)
- `mapApiIssue` maps `issue.labels`
- Activity feed: `label` copy from `added` / `removed` names
- `nav-settings.tsx`: comment out Projects → Labels (`SETTINGS_PROJECT_LABELS`)

## Seed

On each org that has no labels yet: Bug / Feature / Design from the palette. On Acme’s first issue, attach Bug if it has no labels. Idempotent.

## Tests

- Tenant: user B cannot `GET` org A’s labels (403)
- Employee cannot create/update/delete labels (403); can list and `PUT` issue labels
- Admin CRUD + duplicate name → 400
- `PUT` labels writes a `label` event with added/removed names; unchanged set writes none
- Cross-org `labelIds` → 400

Run: `pnpm --filter @relay/api test`

## Out of scope

- Project labels
- Inbox (step 12)
- Issue-list filter / command palette label search (still mock)
- Label groups
- Description field on labels
