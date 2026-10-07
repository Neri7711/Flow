# @flow/api

Backend REST API for Flow — **NestJS + Prisma + PostgreSQL**. Notion-style docs
plus Linear-style tasks for the four Panteras teams: teams, members and
invitations, tasks, cycles, projects, documents, calendar, activity and triage.

The web app (`@flow/web`) talks to it from the server only: its entity `api`
layers are Server Functions that call this API and forward the user's session
(see `apps/web/src/shared/api`). The browser never calls the API directly.

## Requirements

- Node 20+ and pnpm 10 (via `corepack`)
- PostgreSQL 16 (a `docker-compose.yml` is provided; Docker Desktop must be running)

## Run everything locally

PowerShell, one command per line.

API (from `apps/api`):

```powershell
corepack pnpm install                        # also generates the Prisma client
docker compose up -d                         # local PostgreSQL
Copy-Item .env.example .env                  # then set a real JWT_SECRET
corepack pnpm prisma:deploy                  # apply migrations
corepack pnpm db:seed                        # load the demo data
corepack pnpm dev                            # http://localhost:4000/api
```

Web (from `apps/web`, in another terminal):

```powershell
Copy-Item .env.example .env                  # API_URL=http://localhost:4000
corepack pnpm dev                            # http://localhost:3000
```

Sign in with any seeded user (`moge@flow.test` and `fer@flow.test` lead Play;
`ana@flow.test` and `nico@flow.test` are members) and the `SEED_PASSWORD` from `.env`.

`db:seed` wipes the database and reloads the demo data. After changing
`prisma/schema.prisma`, create a migration with `corepack pnpm prisma:migrate --name <change>`.

## Tests

End-to-end tests (`test/e2e.test.mjs`, Node's built-in runner) exercise the
whole API against a running server. They create and delete data, so start from
a fresh seed:

```powershell
corepack pnpm db:seed
corepack pnpm start                          # in another terminal (after `corepack pnpm build`)
corepack pnpm test:e2e
```

## Auth and permissions

- `POST /auth/login` `{ email, password }` → `{ token, user }`. Send the token as
  `Authorization: Bearer <token>`; the web app keeps it in an httpOnly cookie.
- Every route needs a session except `/auth/login`, `/health`, `/teams` (the
  login screen lists them) and the invitation preview/accept routes.
- Whoever performs an action (status changes, comments, page edits, events…)
  is taken from the session; clients can't send it.
- Leaders of a team (and only of that team) decide its triage requests, change
  its members' roles (not their own) and manage its invitations.
- Passwords are hashed with scrypt; invitation tokens are stored as SHA-256 hashes.

## Endpoints

All routes are under `/api`. `teamId` is **required** wherever it appears
without brackets; `limit` is optional (1–100).

### Teams, people and invitations
- `GET /teams`, `GET /teams/:id` (public)
- `GET /users[?teamId=]`, `GET /users/me`, `GET /users/:id`
- `PATCH /users/:id/role` — `{ role }` (leaders)
- `POST /invitations` — `{ email, name, role }` (leaders) → `{ invitation, token }`;
  the link is `<web>/invite/<token>`, valid 7 days, one use
- `GET /invitations?teamId=` (leaders) — pending invitations
- `DELETE /invitations/:id` (leaders)
- `GET /invitations/preview/:token` (public) — who is invited, to which team
- `POST /invitations/accept` — `{ token, password }` (public) → `{ token, user }`

### Tasks
- `GET /tasks[?teamId=&cycleId=&status=]`, `GET /tasks/:id`, `GET /tasks/:id/events`
- `GET /task-labels`
- `POST /tasks` — `{ teamId, title, status, assigneeId?, cycleId?, sourceDocumentId? }`
  → next per-team id (`PL-57`). `abbreviation` (from the web's `NewTask`) is accepted and ignored.
- `PATCH /tasks/:id/status` — `{ status }`
- `PATCH /tasks/:id/toggle-done` (done ↔ todo)
- `POST /tasks/:id/comments` — `{ body }`

### Documents (Notion-style pages)
- `GET /documents[?teamId=]` — sidebar order
- `GET /documents/tree?teamId=`, `GET /documents/recent?teamId=[&limit=4]`
- `GET /documents/:id`, `GET /documents/:id/content` (`{ content }`, TipTap HTML)
- `POST /documents` — `{ teamId, title, parentId?, content?, properties? }`
- `PATCH /documents/:id` — `{ title?, content?, parentId?, properties? }`. `parentId: null`
  moves to the top level; a property set to `null` (or `tags: []`) is cleared. A page
  can't move into its own subtree or into another space. Saving `content` rebuilds the
  page's task backlinks from its `task-mention` pills.
- `DELETE /documents/:id` — the page and its whole subtree → `{ deletedIds }`
- `GET /documents/:id/comments` — flat list; replies carry `parentId`
- `POST /documents/:id/comments` — `{ body, parentId? }` (threads are one level deep)

### Inbox (triage)
- `GET /triage?teamId=` — pending requests for that team
- `POST /triage` — `{ toTeamId, title }` (from your team to another)
- `POST /triage/:id/accept` — `{ status? }` (leaders of the receiving team) →
  `{ request, task }`; the task is created in the same transaction
- `POST /triage/:id/decline` (leaders of the receiving team)

### Calendar, planning and feed
- `GET /events?teamId=&from=&to=` (ISO instants, `to` exclusive), `GET /events/upcoming?teamId=[&limit=3]`
- `POST /events` — `{ teamId, title, startsAt, endsAt?, tone? }` (`endsAt: null` = all day)
- `PATCH /events/:id`, `DELETE /events/:id`
- `GET /cycles/active?teamId=` (the cycle running now, or the latest; `null` if none), `GET /cycles/:id`
- `GET /projects/active?teamId=`, `GET /projects/:id`
- `GET /activity/recent?teamId=[&limit=3]` — written automatically when tasks are
  created/completed/commented, pages created/commented, events added, people join, etc.

### Errors

`400` invalid payload or a reference to something that doesn't exist, `401` no or
expired session, `403` not allowed (e.g. not a leader of that team), `404` unknown
resource, `409` conflict (already decided, email already registered). Unknown body
fields are rejected.

## Notes

- **Dates.** Instants are `DateTime` columns returned as ISO-8601 UTC strings; the
  web parses them with `new Date()` and formats them in America/Mexico_City.
  `Task.dueDate` is a `"YYYY-MM-DD"` string because the web compares it with `===`.
- **Order.** `position` columns keep insertion order (teams, board, sidebar) and
  break ties between entries that share a timestamp (history, comments, feed).
- **Task ids.** `Team.taskSeq` is incremented atomically, so concurrent creates never collide.
- **Clock.** `src/shared/clock.ts` mirrors the web's mock clock (`MOCK_NOW`, 30 Sep 2026)
  so the seeded data looks like the mockups. Switch both to the real clock before going live.
  Invitation expiry already uses the real clock.
