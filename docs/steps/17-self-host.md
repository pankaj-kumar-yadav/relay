# Step 17 — Self-host pack

**Status:** Planned

## Goal

One-command bring-up of web + API + Postgres. Production env documented. Smoke the v1 path on a clean stack.

## Prerequisites

- Steps 10–16 done

## Design

[v1 product design](../superpowers/specs/2026-08-27-v1-product-design.md) §17.

## Done when

- [ ] `docker-compose.yml` runs `db`, `api`, and `web`
- [ ] `.env.example` lists `WEB_ORIGIN`, `NODE_ENV=production`, `TRUST_PROXY`, SMTP
- [ ] Root README documents one-command bring-up
- [ ] Smoke on a clean compose stack: register → invite email → comment → label → cycle → inbox → save view
- [ ] Leftover Circle routes still hidden from live nav

## Out of scope

- Hosted SaaS deploy target
- Billing, SSO, AI

## After v1

Only then consider [SCOPE-V1.md](../SCOPE-V1.md) “Out”: billing, SSO, realtime, uploads, AI, reviews, documents, initiatives.
