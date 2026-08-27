# Step 11 — Labels

**Status:** Done

## Goal

Org-scoped issue labels: CRUD in settings (admin), assign on issues (any member).

## Prerequisites

- Step 10 done

## Design

- Product: [v1 product design](../superpowers/specs/2026-08-27-v1-product-design.md) §11
- Slice: [issue labels design](../superpowers/specs/2026-08-27-issue-labels-design.md)
- Plan: [issue labels plan](../superpowers/plans/2026-08-27-issue-labels.md)

## Done when

- [x] `labels` + `issue_labels` exist; queries use `req.org.id`
- [x] Admin can create/update/delete labels; any member can set labels on an issue
- [x] Issue properties and settings issue-labels page use the API
- [x] Issue events record label changes
- [x] Project-labels settings stay hidden
- [x] Non-members cannot read another org’s labels

## Out of scope

- Project labels
- Inbox (step 12)

## Next

[12-inbox.md](./12-inbox.md)
