# Circle UI — wired vs leftover

`apps/web` is the [Circle](https://github.com/ln-dev7/circle) frontend. Relay wires the Express API into existing screens. **Do not delete** leftover files. **Do not rewrite** a Circle page from scratch. **Do not edit** `apps/web/mock-data/**`.

If a surface is leftover: hide or comment it out of live nav; leave the route and component on disk. Typing the URL may still render mock Circle UI.

Rules: [project-rules/web-rules.md](./project-rules/web-rules.md). Scope out: [SCOPE-V1.md](./SCOPE-V1.md).

## Live nav (v1)

These links appear in `AppSidebar` (`NavInbox`, `NavWorkspace`, `NavTeams`, settings `NavSettings` + `NavTeamsSettings`) and talk to the API on the main path.

| Area | Routes (under `/{orgSlug}`) |
|------|-----------------------------|
| Auth | `/login`, `/register`, `/forgot-password`, `/reset-password/:token`, `/invite/:token`, `/new` (create org) |
| Personal | `/inbox`, `/my-issues` |
| Workspace | `/teams`, `/projects`, `/views`, `/members` |
| Team | `/team/:key/overview`, `/all`, `/active`, `/backlog`, `/cycles`, `/cycle/active`, `/cycle/upcoming`, `/views` |
| Issue | `/issue/:id` (comments, activity, labels, files) |
| Project | `/projects` list; `/project/:id/issues` |
| Settings | `/settings/preferences`, `/profile`, `/security`, `/issue-labels`; `/settings/teams`, `/settings/teams/new`, `/settings/teams/:id` |

Preferences are client-only. Profile name and photo, members role/remove, teams, labels, and password change persist via the API. Issue details attach files on the existing paperclip control.

## Hidden from live nav (keep files)

Comment-outs live in `nav-settings.tsx`. Sidebar does **not** mount `NavFeatures`. Team sidebar does **not** link documents or members tabs.

| Kind | Examples |
|------|----------|
| Workspace | `/agent`, `/reviews`, `/reviews/created`, `/review/:id…`, `/initiatives`, `/initiative/:id` |
| Team | `/team/:key/documents`, `/team/:key/members` (Circle mock members) |
| Settings | Notifications, code & reviews, connected accounts, agent personalization, issue templates, SLAs, project templates/statuses/updates/labels, AI, initiatives, documents, customer requests, releases, pulse, asks, emojis, integrations |
| Unmounted nav | `nav-features.tsx` (still uses `mock-data/side-bar-nav`) |

`constants/workspace.constant.ts` holds leftover path builders (reviews, agent, initiatives).

## Mixed (API shell, Circle mock inside)

Do not treat these as fully wired. Do not “fix” them by editing mock-data.

| Surface | What is real | What is still Circle mock |
|---------|--------------|---------------------------|
| Project overview / activity | Project row from API | Description, outline, updates (`mock-data/project-details`) |
| Command palette | Can mutate issues via API | Search catalogs from `mock-data/*` |
| Team `/members` | Page exists | `mock-data/teams` members |
| Wired screens | Lists from API | Many components still **type** against Circle (`Issue`, `Status` from mock-data) via `lib/mappers.ts` |

`apps/web/mock-data/**` is Circle’s original seed and types. Mappers map API → those types. Leave the files as Circle shipped them.

## How to tell

1. Live sidebar / settings nav → assume wired unless this doc says mixed.
2. Commented `out of v1; restore later` in nav → leftover.
3. Page imports `mock-data` for **records** (not just types) and has no matching `services/*.service.ts` call → leftover or mixed.
