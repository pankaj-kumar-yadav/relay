# Implementation steps — Relay

Follow steps **in order**. Do not skip tenancy/auth before wiring the UI to real data. Do not implement a later slice before the current step’s “Done when”.

Detail for each step: [`docs/steps/`](./steps/).

| Release | File | Steps | Status |
|---------|------|-------|--------|
| MVP | [STEPS-MVP.md](./STEPS-MVP.md) | 1–9 | Done |
| v1 | [STEPS-V1.md](./STEPS-V1.md) | 10–17 | **Current: step 17 — self-host pack** |

Scope: [SCOPE.md](./SCOPE.md) → [SCOPE-MVP.md](./SCOPE-MVP.md) / [SCOPE-V1.md](./SCOPE-V1.md).

## Rules while executing steps

1. Stay inside the **current** scope file ([SCOPE-V1.md](./SCOPE-V1.md) until v1 ships) — no billing, SSO, AI, or realtime.
2. Respect [ARCHITECTURE.md](./ARCHITECTURE.md) — web is UI-only; API owns auth + DB.
3. Every org-owned query must be scoped by membership, never by URL alone.
4. Prefer small PRs/commits per step; verify the step’s “Done when” before moving on.
5. Each v1 slice needs its own spec/plan before code. Thin step files are the roadmap, not the playbook.

## Suggested order of reading for a new agent

1. [SCOPE.md](./SCOPE.md) then the **current** release scope ([SCOPE-V1.md](./SCOPE-V1.md))
2. [ARCHITECTURE.md](./ARCHITECTURE.md)
3. This file, then [STEPS-V1.md](./STEPS-V1.md)
4. The **current** step file under `steps/` (do not implement future steps early)
5. That step’s design spec under [superpowers/specs/](./superpowers/specs/) when one exists
