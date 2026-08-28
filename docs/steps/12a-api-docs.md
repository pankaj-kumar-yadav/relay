# Step 12a — API version + docs

**Status:** Done

## Goal

First-party cookie API under `/api/v1`, with generated OpenAPI and Scalar. Contract stays in Zod + envelope + `ErrorCode`, not a handwritten catalog.

## Prerequisites

- Step 12 done (inbox routes exist so the spec can cover the current surface).

## Design

- Architecture: [ARCHITECTURE.md](../ARCHITECTURE.md) (API docs, `/api/v1`)
- Rules: [api-rules.md](../project-rules/api-rules.md)

No separate spec — this is tooling, not a product domain.

## Done when

- [x] All JSON routes mounted at `API_PREFIX` (`/api/v1`); unprefixed `/health` is 404
- [x] Web `api.ts` prepends `API_PREFIX`; services keep paths like `/orgs/...`
- [x] OpenAPI generated from exported Zod (`openapi/paths/`); spec at `GET /api/v1/openapi.json`
- [x] Scalar at `GET /docs` in every environment (`createApp({ docs: false })` omits docs + spec)
- [x] Default Scalar client is JavaScript / Axios
- [x] Envelope exception is only the OpenAPI JSON document

## Out of scope

- Partner / public API (API keys, OAuth)
- Cycles in the spec (step 13)
- Handwritten `docs/api/*.md` per resource

## Next

[13-cycles.md](./13-cycles.md) — register new paths in `openapi/paths/` when they ship.
