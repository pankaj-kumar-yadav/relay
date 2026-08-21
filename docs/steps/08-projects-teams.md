# Step 8 — Projects and teams

**Status:** Pending

## Goal

Add enough **teams** and **projects** API + UI wiring so Circle’s navigation and issue filters work with real data.

## Prerequisites

- Steps 6–7 done for issues
- Tables `teams` / `projects` migrated (from step 3 or add now)

## Why this is a separate step

Issues can ship with a single default team. Circle’s sidebar and routes expect teams/projects early — implement once issues path is proven.

## Teams API

| Method | Path | Behavior |
|--------|------|----------|
| `GET` | `/orgs/:orgId/teams` | List teams |
| `POST` | `/orgs/:orgId/teams` | Create (`name`, `key`) |
| `GET` | `/orgs/:orgId/teams/:teamId` | Detail |
| `PATCH` | `/orgs/:orgId/teams/:teamId` | Update |

Rules:

- `key` unique per org (e.g. `CORE`) — used in URLs like Circle’s `[teamId]`
- All queries scoped by `organization_id`

## Projects API

| Method | Path | Behavior |
|--------|------|----------|
| `GET` | `/orgs/:orgId/projects` | List (optional `teamId` filter) |
| `POST` | `/orgs/:orgId/projects` | Create |
| `GET` | `/orgs/:orgId/projects/:projectId` | Detail |
| `PATCH` | `/orgs/:orgId/projects/:projectId` | Update |
| `DELETE` | `/orgs/:orgId/projects/:projectId` | Delete |

MVP fields: `name`, `team_id`, optional `status`/`health`, dates optional.

Skip Circle’s rich project activity/milestones until after MVP.

## Issue linkage

- Creating/updating an issue can set `team_id` / `project_id`
- List filters already planned in step 6 — ensure they work with real FKs
- Deleting a project: null out `issues.project_id` or block delete if issues exist — pick one and document

## UI wiring

1. Sidebar teams/projects from API  
2. Team home / project list pages  
3. Create project modal → `POST`  
4. Issue properties panel: project + team selectors from API  

Leave overview/activity tabs as static or hidden if backend isn’t ready.

## Done when

- [ ] At least one team + project per demo org
- [ ] Issues can be assigned to a project/team and filtered
- [ ] Circle routes using `teamId` resolve against real keys/ids
- [ ] Non-members still blocked

## Explicitly later

- Cycles, burn-up charts
- Documents
- Project health automation
- Member directory beyond basic assignee list

## Next

[09-hardening.md](./09-hardening.md)
