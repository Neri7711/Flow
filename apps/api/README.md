# @flow/api

Backend REST API for Flow — **NestJS + Prisma + PostgreSQL**. It implements the
same feature surface the web frontend (`@flow/web`) was designed against
(Notion-style docs + Linear-style tasks: teams, users, tasks, cycles, projects,
documents, events, activity, triage).

The frontend currently reads static fixtures through `async` functions in
`apps/web/src/entities/*/api/`. This API returns the **same shapes, in the same
order**, so those functions can later be swapped for HTTP calls with no change
to the frontend components. The frontend is intentionally untouched by this backend.

## Requirements

- Node 20+ and pnpm 10 (via `corepack`)
- PostgreSQL 16 (a `docker-compose.yml` is provided; Docker Desktop must be running)

## Setup

Commands are for PowerShell, one per line, from `apps/api`:

```powershell
corepack pnpm install                        # also generates the Prisma client
docker compose up -d                         # local PostgreSQL
Copy-Item .env.example .env                  # defaults match docker-compose
corepack pnpm prisma:deploy                  # apply migrations
corepack pnpm db:seed                        # load the frontend's fixture data
corepack pnpm dev                            # http://localhost:4000/api
```

Health check: `GET http://localhost:4000/api/health`.

`db:seed` wipes the database and reloads the fixtures; use it whenever you
want to get back to the mockup state. After changing `prisma/schema.prisma`,
create a migration with `corepack pnpm prisma:migrate --name <change>`.

## Endpoints

All routes are under the `/api` prefix. `teamId` is **required** wherever it
appears without brackets; `limit` is optional (1–100).

### Teams & users
- `GET /teams`, `GET /teams/:id`
- `GET /users`, `GET /users/me`, `GET /users/:id`

### Tasks
- `GET /tasks[?teamId=&cycleId=&status=]`
- `GET /tasks/:id`
- `GET /tasks/:id/events`
- `GET /task-labels`
- `POST /tasks` — `{ teamId, title, status, assigneeId?, cycleId?, sourceDocumentId? }`.
  Returns the task with the next per-team id (`PL-57`); `abbreviation` from the
  frontend's `NewTask` is accepted but ignored (the team decides the prefix).
- `PATCH /tasks/:id/status` — `{ status, actorId? }` (with `actorId`, logs an event)
- `PATCH /tasks/:id/toggle-done` — `{ actorId? }` (done ↔ todo)
- `POST /tasks/:id/comments` — `{ actorId, body }`

### Documents (Notion-style pages)
- `GET /documents[?teamId=]` — sidebar order
- `GET /documents/tree?teamId=` — nested sidebar tree
- `GET /documents/recent?teamId=[&limit=4]`
- `GET /documents/:id`
- `GET /documents/:id/content` — `{ content }` (TipTap HTML)
- `GET /documents/:id/comments`
- `POST /documents` — `{ teamId, title, parentId?, updatedById, content?, properties? }`
- `PATCH /documents/:id` — `{ title?, content?, parentId?, properties?, updatedById? }`.
  `parentId: null` moves the page to the top level; a property set to `null`
  (or `tags: []`) is cleared. A page can't move into its own subtree or into
  another space.
- `DELETE /documents/:id` — deletes the page and its whole subtree; returns `{ deletedIds }`
- `POST /documents/:id/comments` — `{ authorId, body }`

### Planning & feeds
- `GET /cycles/active?teamId=` — the cycle running now (or the latest), or `null`
- `GET /cycles/:id`
- `GET /projects/active?teamId=` (or `null`), `GET /projects/:id`
- `GET /events/upcoming?teamId=[&limit=3]`
- `GET /activity/recent?teamId=[&limit=3]`
- `GET /triage?teamId=`

### Errors

`400` invalid payload/query or a reference to something that doesn't exist
(team, assignee, parent page…), `404` unknown resource in the URL, `409`
duplicate id. Unknown body fields are rejected.

## Notes

- **Dates.** Instants (`startsAt`, `at`, `updatedAt`, …) are `DateTime` columns
  returned as ISO-8601 UTC strings (`2026-09-30T15:30:00.000Z`); the frontend
  parses all of them with `new Date()` and formats them in its own time zone.
  `dueDate` is the exception: a `"YYYY-MM-DD"` string, because the frontend
  compares it with `===`.
- **Order.** `position` columns keep insertion order, which is the order the
  frontend renders (teams, board, sidebar). New tasks and pages go last.
- **Task ids.** `Team.taskSeq` is incremented atomically, so concurrent creates
  never collide.
- **Clock.** `src/shared/clock.ts` mirrors the frontend's mock clock (`MOCK_NOW`)
  so "upcoming", the active cycle and new timestamps line up with the seeded
  mockups. Swap `now()` for `new Date()` once the app runs on live data.
- **Auth** is simulated: `GET /users/me` returns the seeded `u-moge`
  (`CURRENT_USER_ID` in `src/modules/user/user.service.ts`).
