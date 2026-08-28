# Step 12 — Inbox

**Status:** Done

## Goal

In-app notifications for comment, assignee, and status changes. Polling only.

## Prerequisites

- Step 10 done (comments). Step 11 should already be emitting label events if labels shipped.

## Design

- Product: [v1 product design](../superpowers/specs/2026-08-27-v1-product-design.md) §12
- Slice: [inbox design](../superpowers/specs/2026-08-28-inbox-design.md)
- Plan: [inbox plan](../superpowers/plans/2026-08-28-inbox.md)

## Done when

- [x] `notifications` table exists; list/mark-read/mark-all-read for the current user in the current org
- [x] Comment (not author), assignee change, and status change emit rows in the same request
- [x] Inbox is restored in the sidebar; TanStack Query polls (`refetchInterval` 5 mins)
- [x] User B cannot see user A’s notifications
- [x] No notification emails

## Out of scope

- WebSockets / Redis
- Email per notification
- Reviews inbox

## Next

[12a-api-docs.md](./12a-api-docs.md)
