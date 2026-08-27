# @relay/api

Express API for Relay. Dev-only seed credentials live here so the web app can stay UI-only.

## Seed (dev only)

```bash
pnpm --filter @relay/api db:seed
```

All seed users share password `password`.

| Email | Role | Org slug |
|-------|------|----------|
| `owner@relay.local` | Super-admin + org admin | `acme` (team `CORE`, project Launch, 8 issues) |
| `admin@techap.local` | Org admin | `techap-solutions` |
| `employee@techap.local` | Employee | `techap-solutions` |
| `admin@stratxg.local` | Org admin | `stratxg` |
| `employee@stratxg.local` | Employee | `stratxg` |

Do not use these accounts in production.
