# Inbox email — design

**Date:** 2026-09-09  
**Status:** Approved for implementation  
**Step:** [19-inbox-email.md](../../../../steps/v2/19-inbox-email.md)  
**Parent:** [2026-09-09-v2-product-design.md](./2026-09-09-v2-product-design.md)

## Goal

One SMTP email per inbox notification row, after the Prisma transaction commits. Same recipients as step 18. Mail must not fail the comment or patch.

## Decisions locked

| Topic | Choice |
|-------|--------|
| When | After notify insert **commits**, not inside the transaction |
| Volume | One email per notification row |
| Types | `comment` \| `assignee` \| `status` |
| Link | `{WEB_ORIGIN}/{orgSlug}/issue/{identifier}` |
| Unset SMTP | Existing `sendMail` (log in development, warn in production) |
| Failure | Catch per message; HTTP success |
| Actor | Never mailed (`shouldNotify` already skips) |
| Copy | Same strings as in-app inbox (`InboxNotificationCopy`) |

## Flow

`notifyIfRecipient` / `notifyWatchers` return `{ userId, type }[]`. After `$transaction`, `deliverInboxMails` loads recipient emails and calls `sendMail`.

## Out of scope

Digest, mute, unsubscribe headers, uploads.
