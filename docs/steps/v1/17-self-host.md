# Step 17 — Self-host pack

**Status:** Done

## Goal

One-command bring-up of web + API + Postgres. Production env documented. Smoke the v1 path on a clean stack.

## Prerequisites

- Steps 10–16 done

## Design

[v1 product design](../../superpowers/v1/August-2026/specs/2026-08-27-v1-product-design.md) §17.

## Done when

- [x] `docker-compose.yml` runs `db`, `api`, and `web`
- [x] `.env.example` lists `WEB_ORIGIN`, `NODE_ENV=production`, `TRUST_PROXY`, SMTP
- [x] Root README documents one-command bring-up
- [x] Smoke on a clean compose stack: register → invite email → comment → label → cycle → inbox → save view
- [x] Leftover Circle routes still hidden from live nav

## Out of scope

- Hosted SaaS deploy target
- Billing, SSO, AI

## After v1

v2: [SCOPE-V2.md](../../SCOPE-V2.md). Billing, SSO, realtime, AI, reviews, documents, initiatives stay later.
