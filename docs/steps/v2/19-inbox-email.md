# Step 19 — Inbox email

**Status:** Planned

## Goal

One SMTP email per inbox notification (comment / assignee / status), including subscribers, after the notify transaction commits.

## Prerequisites

- Step 18 done

## Design

[v2 product design](../../superpowers/v2/September-2026/specs/2026-09-09-v2-product-design.md) §19. Write a slice spec/plan before code.

## Done when

- [ ] Email sent after notify commit; link uses `WEB_ORIGIN` + org slug + issue identifier
- [ ] Unset SMTP logs in development (existing mailer)
- [ ] Mail failure does not fail the comment/patch
- [ ] Actor never mailed; tests cover send + throw-does-not-500

## Out of scope

- Digest, per-type mute, unsubscribe headers
- Uploads (step 20)
