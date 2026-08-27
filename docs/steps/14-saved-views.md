# Step 14 — Saved views

**Status:** Planned

## Goal

Named, org-visible issue filters stored as JSON matching `IssueListQuery`.

## Prerequisites

- Steps 10–13 done so filters can include labels and `cycleId`

## Design

[v1 product design](../superpowers/specs/2026-08-27-v1-product-design.md) §14. Write a slice spec/plan before code.

## Done when

- [ ] `views` table (`organization_id`, `owner_id`, `name`, `filters`)
- [ ] Owner can CRUD; any org member can GET a view and run its filters
- [ ] Views list/detail pages talk to the API (no mock views)
- [ ] Filters reuse `listIssuesApi` query params
- [ ] Non-members cannot read another org’s views

## Out of scope

- Shared-vs-private ACL beyond “owner edits, members can open”
- Project views

## Next

[15-settings-chrome.md](./15-settings-chrome.md)
