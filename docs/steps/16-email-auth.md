# Step 16 — Email and auth polish

**Status:** Done

## Goal

SMTP for invite email and password reset. Logged-in password change. Development may log links if SMTP is unset.

## Prerequisites

- Step 15 done

## Design

- Product: [v1 product design](../superpowers/specs/2026-08-27-v1-product-design.md) §16
- Slice: [email-auth design](../superpowers/specs/2026-08-31-email-auth-design.md)
- Plan: [email-auth plan](../superpowers/plans/2026-08-31-email-auth.md)

## Done when

- [x] SMTP env documented; unset SMTP in development logs the URL
- [x] Invite create sends email (or logs in development)
- [x] `POST /auth/forgot-password` + `POST /auth/reset-password` (hashed token, short TTL, revoke all KeyStores)
- [x] Logged-in password change (current + new)
- [x] Web forgot/reset pages work
- [x] Invite UI shows “email sent”; copy-link still available in development

## Out of scope

- Notification emails
- SSO

## Next

[17-self-host.md](./17-self-host.md)
