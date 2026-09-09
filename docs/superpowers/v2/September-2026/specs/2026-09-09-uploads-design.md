# Avatars + issue files — design

**Date:** 2026-09-09  
**Status:** Approved for implementation  
**Step:** [20-uploads.md](../../../../steps/v2/20-uploads.md)  
**Parent:** [2026-09-09-v2-product-design.md](./2026-09-09-v2-product-design.md)

## Goal

Presigned PUT/GET for profile avatars and issue files. Bytes never go through Express. Unset storage returns `STORAGE_UNCONFIGURED`; the rest of the app still runs.

## Decisions locked

| Topic | Choice |
|-------|--------|
| Client | `@aws-sdk/client-s3` + `@aws-sdk/s3-request-presigner` |
| Configured when | `S3_BUCKET` + `S3_ACCESS_KEY` + `S3_SECRET_KEY` |
| Endpoints | `S3_ENDPOINT` (API → bucket), `S3_PUBLIC_ENDPOINT` (browser PUT/GET host). Public falls back to endpoint |
| Unset | `ErrorCode.STORAGE_UNCONFIGURED`, HTTP 503 |
| Keys | Server-only: `avatars/{userId}/{attachmentId}`, `orgs/{orgId}/issues/{issueId}/{attachmentId}` |
| Flow | intent → pending row + presigned PUT → browser PUT → complete (`HeadObject`) → `ready` |
| Reads | Presigned GET, 5 minutes. JSON payloads include `url` |
| Avatar who | Upload/delete = that user. `users.avatar_attachment_id`. Missing photo → Dicebear on the web |
| Issue who | Any org member can attach or delete |
| Limits | Avatar jpeg/png/webp, 2MB. Issue those plus pdf/txt/zip, 25MB. Max 20 **ready** files per issue. PUT 15 min |

## Routes

- `POST /auth/me/avatar/intent` `{ contentType, byteSize, fileName }` → `{ attachment, uploadUrl }`
- `POST /auth/me/avatar/complete` `{ attachmentId }`
- `DELETE /auth/me/avatar`
- `POST /orgs/:orgId/issues/:issueId/attachments/intent` same body
- `POST /orgs/:orgId/issues/:issueId/attachments/:attachmentId/complete`
- `GET /orgs/:orgId/issues/:issueId/attachments`
- `DELETE /orgs/:orgId/issues/:issueId/attachments/:attachmentId`

Session / members / issue assignee include `avatarUrl: string | null` (presigned GET or null).

## UI

Wire Profile picture (upload + remove). Wire the existing issue-details paperclip; list files under it. Do not edit `mock-data`.

## Tests

Mock `StorageClient`. Cover intent validation, complete without object, storage unset, org isolation. No MinIO in unit/HTTP tests.

## Out of scope

Comment-only uploads, image pipeline, virus scan, public buckets.
