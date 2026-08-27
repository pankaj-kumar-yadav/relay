# Step 11 — Labels

**Status:** Current

## Goal

Org-scoped issue labels: CRUD in settings (admin), assign on issues (any member).

## Prerequisites

- Step 10 done

## Design

[SCOPE-V1.md](../SCOPE-V1.md) · [v1 product design](../superpowers/specs/2026-08-27-v1-product-design.md) §11. Write a slice spec/plan before code.

## Done when

- [ ] `labels` + `issue_labels` exist; queries use `req.org.id`
- [ ] Admin can create/update/delete labels; any member can set labels on an issue
- [ ] Issue properties and settings issue-labels page use the API
- [ ] Issue events record label changes
- [ ] Project-labels settings stay hidden
- [ ] Non-members cannot read another org’s labels

## Out of scope

- Project labels
- Inbox (step 12)

## Next

[12-inbox.md](./12-inbox.md)
