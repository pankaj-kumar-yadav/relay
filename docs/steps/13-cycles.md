# Step 13 — Cycles

**Status:** Done

## Goal

Per-team timeboxed cycles; issues may belong to a cycle. One active cycle per team.

## Prerequisites

- Step 8 done (teams + issues). Prefer after step 12 so the roadmap stays in order. API is `/api/v1` ([12a](./12a-api-docs.md)).

## Design

- Product: [v1 product design](../superpowers/specs/2026-08-27-v1-product-design.md) §13
- Slice: [cycles design](../superpowers/specs/2026-08-28-cycles-design.md)
- Plan: [cycles plan](../superpowers/plans/2026-08-28-cycles.md)

## Done when

- [x] `cycles` table + `issues.cycle_id` (nullable, `ON DELETE SET NULL`)
- [x] API enforces one **active** cycle per team
- [x] List/create/update cycles; filter issues by `cycleId`; patch issue cycle
- [x] Team nav cycle links restored; Circle cycle pages use the API for list + dates
- [x] Burn-up charts stay mock or hidden
- [x] Non-members cannot read another org’s cycles

## Out of scope

- Burn-up / capacity APIs
- Documents

## Next

[14-saved-views.md](./14-saved-views.md)
