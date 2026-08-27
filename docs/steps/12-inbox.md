# Step 12 — Inbox

**Status:** Current

## Goal

In-app notifications for comment, assignee, and status changes. Polling only.

## Prerequisites

- Step 10 done (comments). Step 11 should already be emitting label events if labels shipped.

## Design

[v1 product design](../superpowers/specs/2026-08-27-v1-product-design.md) §12. Write a slice spec/plan before code.

## Done when

- [ ] `notifications` table exists; list/mark-read/mark-all-read for the current user in the current org
- [ ] Comment (not author), assignee change, and status change emit rows in the same request
- [ ] Inbox is restored in the sidebar; TanStack Query polls (`refetchInterval` 15s)
- [ ] User B cannot see user A’s notifications
- [ ] No notification emails

## Out of scope

- WebSockets / Redis
- Email per notification
- Reviews inbox

## Next

[13-cycles.md](./13-cycles.md)
