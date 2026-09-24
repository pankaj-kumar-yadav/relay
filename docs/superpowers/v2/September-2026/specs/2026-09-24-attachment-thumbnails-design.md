# Issue attachment thumbnails — design

**Date:** 2026-09-24  
**Status:** Approved for implementation  
**Parent:** [uploads design](./2026-09-09-uploads-design.md)

## Goal

Show a small visual next to each issue attachment filename on the issue details page.

## Decisions locked

| Topic | Choice |
|-------|--------|
| Layout | Keep paperclip + list rows; add leading thumb/icon (~32×32, rounded, `object-cover`) |
| Images | `image/jpeg`, `image/png`, `image/webp` → `<img src={url}>` |
| Non-images | pdf / txt / zip → Lucide file-type icon (no server image pipeline) |
| Click | Image (or icon link) and filename open the file via existing presigned `url` |
| Missing url | Icon/placeholder; never a broken `<img>` |
| API | No change — use `ApiAttachment.contentType` + `url` |
| Files | Web-only: `issue-attachments.tsx` (small local helper ok) |
| Mock-data | Do not edit |

## Out of scope

Lightbox, S3-generated thumbnails, virus scan, comment attachments, layout rewrite to a card grid.

## Done when

- Image attachments show a thumbnail preview in the list.
- Non-image attachments show a type icon in the same slot.
- Upload / delete / open behavior unchanged.
