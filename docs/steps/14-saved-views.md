# Step 14 — Saved views

**Status:** Done

## Goal

Named, org-visible issue filters stored as JSON matching `IssueListQuery`.

## Prerequisites

- Steps 10–13 done so filters can include labels and `cycleId`

## Design

- Product: [v1 product design](../superpowers/specs/2026-08-27-v1-product-design.md) §14
- Slice: [saved views design](../superpowers/specs/2026-08-29-saved-views-design.md)
- Plan: [saved views plan](../superpowers/plans/2026-08-29-saved-views.md)

## Done when

- [x] `views` table (`organization_id`, `owner_id`, `name`, `filters`)
- [x] Owner can CRUD; any org member can GET a view and run its filters
- [x] Views list/detail pages talk to the API (no mock views)
- [x] Filters reuse `listIssuesApi` query params
- [x] Non-members cannot read another org’s views

## Out of scope

- Shared-vs-private ACL beyond “owner edits, members can open”
- Project views

## Next

[15-settings-chrome.md](./15-settings-chrome.md)
