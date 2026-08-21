# API response envelope

## Goal

Every JSON response from `apps/api` uses one stable envelope so web and agents never guess shapes. Document the contract in agent rules and project docs, then migrate existing auth/health endpoints and the web API client.

## Envelope

```ts
type ApiErrorBody = {
  code: string;
  message: string;
};

type ApiResponse<T extends object = Record<string, unknown>> = {
  success: boolean;
  message: string;
  data: T | null;
  error: ApiErrorBody | null;
};
```

Rules:

- All four keys are always present.
- `success === true` → `data` is a non-null object; `error` is `null`.
- `success === false` → `data` is `null`; `error` is `{ code, message }`.
- Top-level `message` is always a human-readable string; on failure it matches `error.message`.
- HTTP status codes stay meaningful (200/201/400/401/403/404/409/500, etc.). The envelope does not replace status.

### Examples

Success (login / me):

```json
{
  "success": true,
  "message": "OK",
  "data": { "user": { "id": "...", "email": "...", "name": "...", "isSuperAdmin": false } },
  "error": null
}
```

Failure:

```json
{
  "success": false,
  "message": "Invalid email or password",
  "data": null,
  "error": {
    "code": "INVALID_CREDENTIALS",
    "message": "Invalid email or password"
  }
}
```

## API implementation

- Add `sendSuccess(res, { status?, message, data })` next to error helpers (same module or `utils/response.ts`).
- Update `sendError` to emit the full envelope (`success: false`, `data: null`, `error: { code, message }`).
- Route handlers must not call `res.json` with ad-hoc bodies for JSON APIs; use `sendSuccess` / `sendError`.
- Migrate: auth routes (`register`, `login`, `logout`, `me`) and health (`GET /` or equivalent).
- Keep existing `ApiError` subclasses and `ErrorCode` consts; only the JSON wire format changes.

## Web client

- Update `apps/web/lib/api.ts` to:
  - Treat `!res.ok` or `success === false` as failure.
  - Throw `ApiError` using `error.code` / `error.message` (fallback to top-level `message`).
  - Return `data` (typed) on success, not the whole envelope — callers keep using `api<{ user: ... }>` style against the payload inside `data`.
- Login (and any other auth callers) keep working via the client helper.

## Agent and project scope

| Place | Change |
|-------|--------|
| `.cursor/rules/api-response-envelope.mdc` | New rule: always apply (or globs for `apps/api/**` + `apps/web/lib/api.ts`); examples of good/bad responses |
| `AGENTS.md` | One bullet pointing at the envelope rule |
| `docs/ARCHITECTURE.md` | Short “API response shape” section |
| `docs/steps/04-auth.md`, `docs/steps/09-hardening.md` | Replace old `{ error: { code, message } }`-only convention with the full envelope |

## Out of scope

- Shared package for types (optional later).
- Changing HTTP status semantics or error codes.
- Non-JSON responses (none today).

## Success criteria

- [ ] Every current JSON API endpoint returns the four-key envelope.
- [ ] Web login still works against the API.
- [ ] Agents and docs state the same contract.
