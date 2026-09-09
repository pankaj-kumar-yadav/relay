# Step 20 — Avatars + issue files

**Status:** Done

## Goal

S3-compatible object store. Presigned PUT for profile avatars and issue attachments. MinIO in Compose.

## Prerequisites

- Steps 18–19 done

## Design

[v2 product design](../../superpowers/v2/September-2026/specs/2026-09-09-v2-product-design.md) §20. Slice: [uploads design](../../superpowers/v2/September-2026/specs/2026-09-09-uploads-design.md).

## Done when

- [x] MinIO in `docker-compose.yml`; S3 env documented (AWS / Backblaze / MinIO)
- [x] Intent → presigned PUT → complete; presigned GET for reads
- [x] Profile avatar wired; Dicebear fallback when unset
- [x] Issue attachments on existing details UI
- [x] Limits: avatar 2MB jpeg/png/webp; issue +pdf/txt/zip 25MB; 20 files/issue
- [x] Tests mock S3; org isolation; storage unset named error

## Out of scope

- Comment-only uploads, image pipeline, virus scan
- Billing, SSO, AI, realtime
