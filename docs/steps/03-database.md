# Step 3 — Database (PostgreSQL)

**Status:** Pending

## Goal

Add PostgreSQL, migrations, and the core schema needed for auth + multi-tenant MVP.

## Prerequisites

- Step 1 done
- Docker Desktop (recommended) or a local Postgres 16+

## Decisions to lock before coding

| Decision | Recommendation |
|----------|----------------|
| ORM / query layer | Prisma **or** Drizzle (pick one; document in ARCHITECTURE) |
| Migration tool | Same as ORM (Prisma migrate / Drizzle kit) |
| IDs | UUID (`gen_random_uuid()`) for all primary keys |
| Soft delete | Optional later; MVP can use hard delete for issues |

Update [ARCHITECTURE.md](../ARCHITECTURE.md) when the ORM choice is made.

## Local Postgres (Docker)

From repo root, add `docker-compose.yml` (example):

```yaml
services:
  db:
    image: postgres:16-alpine
    ports:
      - "5432:5432"
    environment:
      POSTGRES_USER: relay
      POSTGRES_PASSWORD: relay
      POSTGRES_DB: relay
    volumes:
      - relay_pg:/var/lib/postgresql/data

volumes:
  relay_pg:
```

```bash
docker compose up -d
```

API env (`apps/api/.env`):

```env
DATABASE_URL=postgresql://relay:relay@localhost:5432/relay
```

Also add `DATABASE_URL` to `apps/api/.env.example` (no real secrets).

## MVP tables (minimum)

Implement in this order:

### 1. `users`

| Column | Notes |
|--------|--------|
| `id` | UUID PK |
| `email` | unique, lowercased |
| `password_hash` | nullable if you add OAuth later |
| `name` | display name |
| `created_at` / `updated_at` | timestamptz |

### 2. `organizations`

| Column | Notes |
|--------|--------|
| `id` | UUID PK |
| `name` | display name |
| `slug` | unique, URL-safe (maps to Circle `[orgId]` if possible) |
| `created_at` / `updated_at` | |

### 3. `memberships`

| Column | Notes |
|--------|--------|
| `id` | UUID PK |
| `organization_id` | FK → organizations |
| `user_id` | FK → users |
| `role` | `owner` \| `admin` \| `member` (start simple) |
| unique | (`organization_id`, `user_id`) |

### 4. Domain tables (can land in this step or step 6)

Minimal for issues later:

- `teams` — `organization_id`, `key` (e.g. `CORE`), `name`
- `projects` — `organization_id`, `team_id` (nullable), `name`, dates optional
- `issues` — `organization_id`, `team_id`, `project_id`, `identifier` or number, `title`, `description`, `status`, `priority`, `assignee_id`, `rank` (LexoRank string), timestamps

Statuses/priorities: start as **enums or lookup tables**. Match Circle naming where practical to reduce UI mapping pain.

## Migration workflow

```bash
# examples — adjust to chosen tool
pnpm --filter @relay/api db:migrate
pnpm --filter @relay/api db:generate   # if Prisma
```

Document exact scripts in `apps/api/package.json` when added.

## Seed (lightweight)

Create a seed script (run manually):

1. One user: `owner@relay.local` / known password
2. One org: slug `demo`
3. Membership: owner
4. Optional: one team + 2–3 sample issues

Full rich Circle-like seed can wait until step 9.

## Done when

- [ ] Postgres runs locally
- [ ] `DATABASE_URL` configured
- [ ] Migrations create users, organizations, memberships (+ teams/projects/issues if included)
- [ ] Seed creates one demo org membership
- [ ] `.env.example` updated

## Out of scope

- Auth routes (step 4)
- Tenant middleware (step 5)
- UI wiring

## Next

[04-auth.md](./04-auth.md)
