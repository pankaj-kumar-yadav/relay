# Step 18 — Issue subscribe

**Status:** Done

## Goal

Persist issue watchers. Expand inbox recipients to assignee ∪ subscribers (one row per user, never the actor). Wire existing Circle subscribe chrome.

## Prerequisites

- v1 done (steps 10–17)

## Design

[v2 product design](../../superpowers/v2/September-2026/specs/2026-09-09-v2-product-design.md) §18. Slice: [issue subscribe design](../../superpowers/v2/September-2026/specs/2026-09-09-issue-subscribe-design.md).

## Done when

- [x] `issue_subscriptions` table; unique per issue + user
- [x] Auto-subscribe creator, new assignee, comment author
- [x] Inbox notify union + dedupe; actor skipped
- [x] `PUT` subscribe/unsubscribe; issue payload `subscribed`; list `subscribed=me`
- [x] Context menu + Activity Subscribe wired; My issues Subscribed tab uses the API
- [x] Tenant isolation tests

## Out of scope

- Inbox email (step 19)
- Uploads (step 20)
- My issues Created / Activity tabs
- `issues.created_by`
