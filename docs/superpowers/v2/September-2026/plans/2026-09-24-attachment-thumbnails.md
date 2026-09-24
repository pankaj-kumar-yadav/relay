# Attachment thumbnails Implementation Plan

> **For agentic workers:** Execute inline in this session. One UI task; no subagents.

**Goal:** Show a 32×32 image thumbnail or file-type icon beside each issue attachment filename.

**Architecture:** Client-only. Use existing `ApiAttachment.contentType` + `url`. Images render `<img>`; pdf/txt/zip use Lucide icons. No API or mock-data changes.

**Tech Stack:** React, Lucide, existing TanStack Query hooks in `issue-attachments.tsx`.

## Global Constraints

- Do not edit `apps/web/mock-data/**`
- Do not change attachment API routes or schema
- Keep paperclip upload + delete behavior unchanged

---

### Task 1: Thumbnail / icon in attachment rows

**Files:**
- Modify: `apps/web/components/common/issues/details/issue-attachments.tsx`

**Interfaces:**
- Consumes: `ApiAttachment` (`id`, `fileName`, `contentType`, `url`)
- Produces: leading visual in each list row

- [ ] **Step 1: Add helpers + Lucide icons; render thumb/icon before filename**

Use `isAvatarContentType` for jpeg/png/webp. When image + `url`, show linked `<img>`. Else show icon by `contentType` (`application/pdf` → `FileText`, `text/plain` → `FileText`, `application/zip` → `FileArchive`, fallback `File`). Size `size-8`, rounded, `object-cover`.

- [ ] **Step 2: Manual check**

Open an issue with an image and a pdf/zip/txt attached. Confirm thumbnail vs icon, open-on-click, and delete still work.

- [ ] **Step 3: Commit only if user asks**

Do not commit unless the user explicitly requests it.
