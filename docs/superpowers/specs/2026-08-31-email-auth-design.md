# Email and auth polish — design

**Date:** 2026-08-31  
**Status:** Implemented  
**Step:** [16-email-auth.md](../../steps/16-email-auth.md)  
**Parent:** [2026-08-27-v1-product-design.md](./2026-08-27-v1-product-design.md)

## Goal

Send invite and password-reset mail over SMTP. Development logs the link when SMTP is unset. Logged-in users can change their password. Forgot/reset pages exist on the web.

## Decisions locked

| Topic | Choice |
|-------|--------|
| Transport | `nodemailer`. Env: `SMTP_HOST`, `SMTP_PORT` (default 587), `SMTP_USER`, `SMTP_PASS`, `SMTP_FROM` |
| Unset SMTP | Development: `console.log` the mail (includes the URL). Production: skip send; log that SMTP is unset **without** the URL |
| Invite create | Persist invite, then `sendMail`. Always 201. Raw `token` still in the response (copy-link in development) |
| Reset storage | `password_resets` table. SHA-256 hash of the raw token (same pattern as invites). TTL **1 hour** |
| Forgot | `POST /auth/forgot-password` `{ email }`. **Always 200** `{ }` — do not reveal whether the email exists |
| Reset | `POST /auth/reset-password` `{ token, password }`. Invalid/expired/used → 400. On success: new hash, mark used, **delete all KeyStores**. Do not auto-login |
| Change password | `POST /auth/change-password` `{ currentPassword, newPassword }`. `requireAuth`. Wrong current → 401 `INVALID_CREDENTIALS`. Then new hash, delete all KeyStores, **re-issue cookies** for this session |
| Rate limit | Forgot uses the login limiter shape (IP, every attempt). Tests skip via `NODE_TEST_CONTEXT` |
| Web copy-link | Invite “Copy invite link” only when `NODE_ENV === development` |
| Circle security | Add a Password section. Leave mock sessions / passkeys / API keys in place |
| New pages | Allowed: Circle has no forgot/reset screens |

## API

Envelope unchanged. Forgot/reset are public. Change-password uses `requireAuth`.

| Method | Path | Who | Behavior |
|--------|------|-----|----------|
| `POST` | `/auth/forgot-password` | public | `{ email }`. Always 200 `{ }`. If a user exists, insert a reset row and send (or log) the link |
| `POST` | `/auth/reset-password` | public | `{ token, password }` (password min 8). 200 `{ }`. Unknown/expired/used token → 400 `VALIDATION_ERROR` |
| `POST` | `/auth/change-password` | self | `{ currentPassword, newPassword }` (new min 8). 200 `{ }`. Unauthenticated → 401 |

Invite create is unchanged except it calls the mailer after insert.

### Mail body

- Invite: `{webOrigin}/invite/{token}`
- Reset: `{webOrigin}/reset-password/{token}`

Plain text only. No HTML. Send failures are logged; they do not fail the HTTP request (invite already exists; forgot must not leak).

## Web

- `forgotPasswordApi` / `resetPasswordApi` / `changePasswordApi` in `auth.service.ts`
- `/forgot-password` and `/reset-password/[token]` using `AuthShell` (same chrome as login)
- Login “Forgot password?” → `/forgot-password`
- Security settings: current + new password, submit via `useChangePassword`
- Members invite: toast “Invite email sent”; copy-link only in development

## Tests

- `sendMail` logs when SMTP is unset (development)
- Forgot for a real user inserts a `password_resets` row; unknown email still 200 and inserts nothing
- Reset with a crafted token updates the hash; old cookies fail `GET /auth/session`; login with the new password works; reused/expired token → 400
- Change-password: 401 without cookies; wrong current → 401; success keeps this session and logs out other KeyStores
- Invite create still 201; mailer is invoked (log in tests)

Run: `pnpm --filter @relay/api test`

## Out of scope

- Notification emails
- SSO / passkeys / session list API
- Docker Compose web+api (step 17)
- Returning the raw reset token in the JSON body
