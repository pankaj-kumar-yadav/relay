# pgAdmin 4 Connection (Relay Local DB)

Use this after Docker DB is running.

## 1) Start DB first

From repo root:

```bash
docker compose up -d
```

## 2) Open pgAdmin 4 and register server

In pgAdmin:

1. Right click `Servers` -> `Register` -> `Server...`
2. Fill values below

### General tab

- Name: `relay-local` (any name is fine)

### Connection tab

- Host name/address: `localhost`
- Port: `5432`
- Maintenance database: `relay`
- Username: `relay`
- Password: `relay`
- Enable `Save password`

Click `Save`.

## 3) Verify connection

Expand:

- `Servers`
- `relay-local`
- `Databases`
- `relay`
- `Schemas`
- `public`
- `Tables`

If tables are missing, run migrations:

```bash
pnpm --filter @relay/api db:migrate
```

## Common issues

- Docker not running:
  - Start Docker Desktop, then re-run `docker compose up -d`
- Port already used:
  - Check what is using `5432` and stop it, or change port mapping in `docker-compose.yml`
- Password auth failed:
  - Ensure `.env` uses `DATABASE_URL=postgresql://relay:relay@localhost:5432/relay`
