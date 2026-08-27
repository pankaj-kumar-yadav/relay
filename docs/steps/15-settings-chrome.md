# Step 15 — Settings chrome

**Status:** Planned

## Goal

Persist profile name and member role/remove. Hide leftover Circle settings. Keep files.

## Prerequisites

- Steps 10–14 done (v1 product surfaces exist)

## Design

[v1 product design](../superpowers/specs/2026-08-27-v1-product-design.md) §15. Write a slice spec/plan before code.

## Done when

- [ ] `PATCH /auth/me` updates `name`
- [ ] Admin can change member role and remove a member; last admin cannot be removed or demoted
- [ ] Settings nav keeps Preferences, Profile, Security, Teams, Issue labels
- [ ] Settings nav hides AI, reviews, documents, initiatives, SLAs, templates, integrations, and the rest listed in the v1 spec
- [ ] Preferences may stay client-only

## Out of scope

- Password reset / SMTP (step 16)
- Avatar uploads
- Super-admin console

## Next

[16-email-auth.md](./16-email-auth.md)
