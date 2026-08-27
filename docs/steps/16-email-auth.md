# Step 16 — Email and auth polish

**Status:** Planned

## Goal

SMTP for invite email and password reset. Logged-in password change. Development may log links if SMTP is unset.

## Prerequisites

- Step 15 done

## Design

[v1 product design](../superpowers/specs/2026-08-27-v1-product-design.md) §16. Write a slice spec/plan before code.

## Done when

- [ ] SMTP env documented; unset SMTP in development logs the URL
- [ ] Invite create sends email (or logs in development)
- [ ] `POST /auth/forgot-password` + `POST /auth/reset-password` (hashed token, short TTL, revoke all KeyStores)
- [ ] Logged-in password change (current + new)
- [ ] Web forgot/reset pages work
- [ ] Invite UI shows “email sent”; copy-link still available in development

## Out of scope

- Notification emails
- SSO

## Next

[17-self-host.md](./17-self-host.md)
