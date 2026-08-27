# Step 3 — Database (PostgreSQL)

**Status:** Done (users + `key_stores` via step 4 auth; orgs/memberships deferred to step 5)

## Goal

Add PostgreSQL, migrations, and the core schema needed for auth + multi-tenant MVP.

## Prerequisites

- Step 1 done
- Docker Desktop (recommended) or a local Postgres 16+

## Decisions to lock before coding

| Decision | Recommendation |
|----------|----------------|
| ORM / query layer | **Prisma** (locked) |
| Migration tool | Prisma migrate |
| IDs | UUID (`gen_random_uuid()` / Prisma `@default(uuid())`) for all primary keys |
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
| `password_hash` | bcrypt hash; never returned in JSON |
| `name` | display name |
| `is_super_admin` | boolean, default `false` |
| `created_at` / `updated_at` | timestamptz |

### 1b. `key_stores` (added with step 4 auth)

| Column | Notes |
|--------|--------|
| `id` | UUID PK |
| `user_id` | FK → users (cascade delete) |
| `primary_key` | embedded in access JWT `prm` |
| `secondary_key` | embedded in refresh JWT `prm` |
| `status` | boolean, default `true` |
| `created_at` / `updated_at` | timestamptz |

Indexes: `(user_id)`, `(user_id, primary_key, status)`, `(user_id, primary_key, secondary_key)`.

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
| `role` | `admin` \| `employee` (many admins per org OK) |

Platform **super-admin** (SaaS owner) is not an org membership role — store on `users` (e.g. `is_super_admin`) or a dedicated platform role field.
| unique | (`organization_id`, `user_id`) |

### 4. Domain tables (can land in this step or step 6)

Minimal for issues later:

- `teams` — `organization_id`, `key` (e.g. `CORE`), `name`
- `projects` — `organization_id`, `team_id` (nullable), `name`, dates optional
- `issues` — `organization_id`, `team_id`, `project_id`, `identifier` or number, `title`, `description`, `status`, `priority`, `assignee_id`, `rank` (LexoRank string), timestamps

Statuses/priorities: start as **enums or lookup tables**. Match Circle naming where practical to reduce UI mapping pain.

## Migration workflow

```bash
pnpm --filter @relay/api db:migrate
pnpm --filter @relay/api db:generate
pnpm --filter @relay/api db:seed
pnpm db:studio   # Prisma Studio — browse tables at http://localhost:5555
```

Document exact scripts in `apps/api/package.json` when added.

## Seed (lightweight)

Create a seed script (run manually):

1. One user: `owner@relay.local` / known password
2. One org: slug `acme`
3. Membership: owner
4. Optional: one team + 2–3 sample issues

Full rich Circle-like seed can wait until step 9.

## Done when

- [x] Postgres runs locally
- [x] `DATABASE_URL` configured
- [x] Migrations create `users` (+ `key_stores` with auth; organizations, memberships, domain tables → step 5+)
- [x] Seed creates super-admin `owner@relay.local`
- [x] `.env.example` updated

## Out of scope (still)

- Organizations / memberships tables (step 5)
- Tenant middleware (step 5)
- Issues / projects / teams tables (later)

## Next

[04-auth.md](./04-auth.md)
