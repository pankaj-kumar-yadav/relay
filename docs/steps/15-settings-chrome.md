# Step 15 — Settings chrome

**Status:** Done

## Goal

Persist profile name and member role/remove. Hide leftover Circle settings. Keep files.

## Prerequisites

- Steps 10–14 done (v1 product surfaces exist)

## Design

- Product: [v1 product design](../superpowers/specs/2026-08-27-v1-product-design.md) §15
- Slice: [settings chrome design](../superpowers/specs/2026-08-31-settings-chrome-design.md)
- Plan: [settings chrome plan](../superpowers/plans/2026-08-31-settings-chrome.md)

## Done when

- [x] `PATCH /auth/me` updates `name`
- [x] Admin can change member role and remove a member; last admin cannot be removed or demoted
- [x] Settings nav keeps Preferences, Profile, Security, Teams, Issue labels
- [x] Settings nav hides AI, reviews, documents, initiatives, SLAs, templates, integrations, and the rest listed in the v1 spec
- [x] Preferences may stay client-only

## Out of scope

- Password reset / SMTP (step 16)
- Avatar uploads
- Super-admin console

## Next

[16-email-auth.md](./16-email-auth.md)
