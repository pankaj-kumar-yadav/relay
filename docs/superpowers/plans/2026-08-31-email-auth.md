# Email and auth polish Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** SMTP for invite + password-reset mail (log the URL in development when unset). Forgot/reset endpoints and pages. Logged-in password change.

**Architecture:** `sendMail` in `utils/mailer.ts` (nodemailer, or log). `PasswordReset` rows hashed like invites. Auth routes for forgot/reset/change-password. Web services + AuthShell pages; wire Security and invite chrome.

**Tech Stack:** Express, Prisma, Zod, nodemailer, TanStack Query, existing envelope + `requireAuth` + KeyStore

**Spec:** [docs/superpowers/specs/2026-08-31-email-auth-design.md](../specs/2026-08-31-email-auth-design.md)

## Global Constraints

- Tenancy: org routes still `requireAuth` → `requireOrgMember`; forgot/reset are public
- Envelope: `{ success, message, data, error }` via `sendSuccess` / `sendError`
- Path aliases `@/` in API and web
- Web HTTP only in `apps/web/services/*.service.ts` named `*Api`
- Do not delete Circle files; do not change `apps/web/mock-data/**`
- Do not commit unless the user explicitly asks
- Do not implement step 17 (Compose, production README)

## File map

| Path | Responsibility |
|------|----------------|
| `apps/api/.env.example` | SMTP vars |
| `apps/api/src/config.ts` | SMTP config |
| `apps/api/src/constants/mail.constant.ts` | Port default, TTL, path builders, subjects |
| `apps/api/src/constants/auth.ts` | Forgot rate-limit |
| `apps/api/src/utils/mailer.ts` | `isSmtpConfigured`, `sendMail` |
| `apps/api/src/auth/passwordResetToken.ts` | Generate / hash / expiry |
| `apps/api/src/auth/keyStore.ts` | `deleteKeyStoresForUser` |
| `apps/api/prisma/schema.prisma` | `PasswordReset` |
| `apps/api/src/routes/auth/auth.schema.ts` | Forgot / reset / change-password Zod |
| `apps/api/src/routes/auth/auth.ts` | Three new handlers |
| `apps/api/src/routes/invites.ts` | Send invite mail |
| `apps/api/src/openapi/paths/auth.ts` | Register new paths |
| `apps/web/constants/auth.constant.ts` | Routes + API paths |
| `apps/web/services/auth.service.ts` | `*Api` wrappers |
| `apps/web/hooks/use-session.ts` | Mutations |
| `apps/web/app/forgot-password/page.tsx` | Request reset |
| `apps/web/app/reset-password/[token]/page.tsx` | Set new password |
| `apps/web/app/login/page.tsx` | Link to forgot |
| `apps/web/components/common/settings/account-security.tsx` | Password form |
| `apps/web/components/layout/headers/members/header-nav.tsx` | Email-sent + copy-link in dev |

---

### Task 1: Mailer

- [ ] Failing tests for log-when-unset
- [ ] `mail.constant.ts`, config, `sendMail`, `.env.example`
- [ ] Tests pass

### Task 2: Forgot + reset

- [ ] `PasswordReset` migration
- [ ] Failing HTTP tests (always-200 forgot, reset revokes KeyStores, reuse fails)
- [ ] Handlers + OpenAPI
- [ ] Tests pass

### Task 3: Change password

- [ ] Failing tests (401, wrong current, other sessions die, this session lives)
- [ ] Handler
- [ ] Tests pass

### Task 4: Invite mail + web

- [ ] Invite create calls `sendMail`
- [ ] Forgot/reset pages; login link; security password form
- [ ] Invite toast “email sent”; copy-link only in development
