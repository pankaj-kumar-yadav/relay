# Step 13 — Cycles

**Status:** Current

## Goal

Per-team timeboxed cycles; issues may belong to a cycle. One active cycle per team.

## Prerequisites

- Step 8 done (teams + issues). Prefer after step 12 so the roadmap stays in order.

## Design

[v1 product design](../superpowers/specs/2026-08-27-v1-product-design.md) §13. Write a slice spec/plan before code.

## Done when

- [ ] `cycles` table + `issues.cycle_id` (nullable, `ON DELETE SET NULL`)
- [ ] API enforces one **active** cycle per team
- [ ] List/create/update cycles; filter issues by `cycleId`; patch issue cycle
- [ ] Team nav cycle links restored; Circle cycle pages use the API for list + dates
- [ ] Burn-up charts stay mock or hidden
- [ ] Non-members cannot read another org’s cycles

## Out of scope

- Burn-up / capacity APIs
- Documents

## Next

[14-saved-views.md](./14-saved-views.md)
