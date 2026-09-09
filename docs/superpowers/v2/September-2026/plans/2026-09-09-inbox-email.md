# Inbox email Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Email each inbox notification after the DB transaction commits, without failing the mutation.

**Architecture:** Notify helpers return mail jobs. `deliverInboxMails` runs after `$transaction`, uses existing `sendMail` + transactional templates. Per-message try/catch.

**Tech Stack:** nodemailer `sendMail`, Prisma, Express, Node `node:test`.

## Global Constraints

- Path aliases `@/`. Envelope unchanged. `NODE_ENV` only development/production.
- Constants in `packages/shared` / `mail.constant.ts`. Do not edit Circle mock-data.
- Do not git commit unless the human asks.

---

### Task 1: Tests then implementation

- [x] Failing unit tests for template + `deliverInboxMails` (throw does not propagate).
- [x] Failing HTTP test: comment logs mail to subscriber, not actor; comment still 201 if send throws.
- [x] Template, `issueMailPath`, jobs from notify, deliver after comment and patch.
- [x] Mark step 19 done in docs.
