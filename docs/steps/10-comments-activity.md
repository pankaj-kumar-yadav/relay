# Step 10 — Comments and activity

**Status:** Done

## Goal

Replace the in-memory issue activity feed with real comments and change events, scoped by org membership.

## Prerequisites

- Steps 1–9 done (issues CRUD + issue detail UI)

## Design

- Product: [v1 product design](../superpowers/specs/2026-08-27-v1-product-design.md)
- Slice: [comments + activity design](../superpowers/specs/2026-08-27-issue-comments-activity-design.md)
- Plan: [comments + activity plan](../superpowers/plans/2026-08-27-issue-comments-activity.md)

## Done when

- [x] `comments` and `issue_events` tables exist; every row has `organization_id`
- [x] Members can list activity, create a comment, and delete their own comment
- [x] Creating/updating an issue writes the matching event (created, status, priority, assignee)
- [x] Activity feed on issue detail talks to the API (no mock composer / mock users)
- [x] User B cannot read or write comments on org A’s issues
- [x] Subscribe and reactions stay hidden

## Out of scope

- Labels / cycle events (steps 11 / 13)
- Inbox notifications (step 12)
- Comment reactions, subscribe, rich ContentBlocks

## Next

[11-labels.md](./11-labels.md)
