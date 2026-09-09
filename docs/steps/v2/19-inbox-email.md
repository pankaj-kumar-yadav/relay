# Step 19 — Inbox email

**Status:** Done

## Goal

One SMTP email per inbox notification (comment / assignee / status), including subscribers, after the notify transaction commits.

## Prerequisites

- Step 18 done

## Design

[v2 product design](../../superpowers/v2/September-2026/specs/2026-09-09-v2-product-design.md) §19. Slice: [inbox email design](../../superpowers/v2/September-2026/specs/2026-09-09-inbox-email-design.md).

## Done when

- [x] Email sent after notify commit; link uses `WEB_ORIGIN` + org slug + issue identifier
- [x] Unset SMTP logs in development (existing mailer)
- [x] Mail failure does not fail the comment/patch
- [x] Actor never mailed; tests cover send + throw-does-not-500

## Out of scope

- Digest, per-type mute, unsubscribe headers
- Uploads (step 20)
