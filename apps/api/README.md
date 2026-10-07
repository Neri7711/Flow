# @flow/api

Backend REST API for Flow — **NestJS + Prisma + PostgreSQL**. Notion-style docs
plus Linear-style tasks for the four Panteras teams: spaces and memberships,
invitations, tasks, cycles, projects, documents, calendar, notifications,
activity and triage.

The web app (`@flow/web`) talks to it from the server only: its entity `api`
layers are Server Functions that call this API and forward the user's session
(see `apps/web/src/shared/api`). The browser never calls the API directly — except
for profile photos (see "Uploads").

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

Sign in with any seeded user and the `SEED_PASSWORD` from `.env`:
`moge@flow.test` and `fer@flow.test` lead Play; `ana@flow.test` is a member of Play
and leads Computer Science; `nico@flow.test` is a member of Play.

`db:seed` wipes the database and reloads the demo data, dated relative to the day
it runs. After changing `prisma/schema.prisma`, create a migration with
`corepack pnpm prisma:migrate --name <change>`.

## Tests

End-to-end tests (`test/e2e.test.mjs`, Node's built-in runner) exercise the
whole API against a running server. They create and delete data, so start from
a fresh seed:

```powershell
corepack pnpm db:seed
corepack pnpm start                          # in another terminal (after `corepack pnpm build`)
corepack pnpm test:e2e
```

CI (`.github/workflows/ci.yml`) runs them on every pull request against a throwaway Postgres.

## Auth and permissions

- `POST /auth/login` `{ email, password }` → `{ token, user }`. Send the token as
  `Authorization: Bearer <token>`; the web app keeps it in an httpOnly cookie.
  5 failed attempts for an email lock it for 15 minutes (`429`).
- Every route needs a session except `/auth/login`, `/health`, `GET /teams[/:id]`
  (the login screen lists them), the invitation preview/accept routes and profile photos.
- Whoever performs an action (status changes, comments, page edits, events…)
  is taken from the session; clients can't send it.
- **Spaces and roles.** A person belongs to one or more spaces (`memberships`), with a
  role in each: `leader`, `member` or `guest` (mentors). `User.teamId`/`role` are the
  home space and the role there. A leader role counts only in its own space.
- Leaders of a space (and only of that space) decide its triage requests, manage its
  members, roles and invitations, edit its weekly note and its cycle settings, and close
  its cycles.
- Passwords are hashed with scrypt; invitation tokens are stored as SHA-256 hashes.

## Endpoints

All routes are under `/api`. `teamId` is **required** wherever it appears
without brackets; `limit` is optional (1–100).

### Spaces, people and invitations
- `GET /teams`, `GET /teams/:id` (public) — includes `weeklyNote`
- `PATCH /teams/:id` — `{ weeklyNote }` (leaders)
- `POST /teams/:id/members` — `{ userId, role }` (leaders; people who already have an account)
- `DELETE /teams/:id/members/:userId` (leaders; not themselves, not from someone's home space)
- `GET /users[?teamId=]` — with `teamId`, that space's members and `role` is their role there.
  Every user carries `memberships`, `area`, `lastActiveAt`, `avatarUrl`, `onboardedAt`.
- `GET /users/me`, `GET /users/:id`
- `PATCH /users/me` — `{ name?, shortName?, area? }` (initials follow the name)
- `POST /users/me/avatar` — multipart, image in `file` (PNG/JPG/WebP, ≤ 2 MB); `DELETE /users/me/avatar`
- `POST /users/me/onboarded` — the onboarding was completed
- `PATCH /users/:id/role` — `{ role, teamId? }` (leaders of that space; `teamId` defaults to the person's home space)
- `POST /invitations` — `{ email, name, role }` (leaders) → `{ invitation, token }`;
  the link is `<web>/invite/<token>`, valid 7 days, one use. Existing accounts: use members.
- `GET /invitations?teamId=` (leaders) — pending invitations
- `DELETE /invitations/:id` (leaders)
- `GET /invitations/preview/:token` (public) — who is invited, to which space, and `invitedBy { name, role }`
- `POST /invitations/accept` — `{ token, password }` (public) → `{ token, user }`

### Notifications
Generated automatically: **assignments** (to the new assignee), **status changes**
(to the assignee, and to assignees of tasks it was blocking when it reaches review/done),
**comments** (task assignee; page owner for a new thread; thread participants for a reply)
and **mentions** (`@Name` in comments by short name; `user-mention` pills and task pills
newly added to a page). Nobody is notified about their own actions.
- `GET /notifications[?unread=true&limit=]` — the signed-in user's, newest first
  (`{ kind, title, excerpt?, taskId?, documentId?, teamId?, actorId, createdAt, readAt }`)
- `GET /notifications/unread-count` → `{ count }` (the inbox badge adds pending triage)
- `PATCH /notifications/:id/read`, `POST /notifications/read-all` → `{ count }`

### Tasks
- `GET /tasks[?teamId=&cycleId=&status=]`, `GET /tasks/:id`, `GET /tasks/:id/events`
- `GET /task-labels`
- `POST /tasks` — `{ teamId, title, status, assigneeId?, cycleId?, sourceDocumentId? }`
  → next per-team id (`PL-57`). `abbreviation` (from the web's `NewTask`) is accepted and ignored.
- `PATCH /tasks/:id` — `{ title?, description?, assigneeId?, priority?, labelId?, dueDate?, cycleId?, blockedByIds? }`
  (`null` clears; `blockedByIds` replaces the list and can't create cycles)
- `DELETE /tasks/:id`
- `PATCH /tasks/:id/status` — `{ status }`; `PATCH /tasks/:id/toggle-done` (done ↔ todo)
- `POST /tasks/:id/comments` — `{ body }`

### Documents (Notion-style pages)
- `GET /documents[?teamId=]` — sidebar order
- `GET /documents/tree?teamId=`, `GET /documents/recent?teamId=[&limit=4]`
- `GET /documents/:id`, `GET /documents/:id/content` (`{ content }`, TipTap HTML)
- `POST /documents` — `{ teamId, title, parentId?, content?, properties?, icon?, coverTone?, isDraft? }`
- `PATCH /documents/:id` — same fields, all optional. `parentId: null` moves to the top
  level; `null` clears a property, `icon` or `coverTone`. A page can't move into its own
  subtree or into another space. Saving `content` rebuilds the task backlinks.
- `DELETE /documents/:id` — the page and its whole subtree → `{ deletedIds }`
- `GET /documents/:id/comments` — flat list; replies carry `parentId`
- `POST /documents/:id/comments` — `{ body, parentId? }` (threads are one level deep)

### Inbox (triage)
- `GET /triage?teamId=` — pending requests (`kind: "work" | "join"`)
- `POST /triage` — work: `{ toTeamId, title, description?, dueDate?, linkedTaskId? }` (to another team);
  join: `{ kind: "join", toTeamId, title?, description? }` (a space you're not in)
- `POST /triage/:id/accept` (leaders of the receiving space) — work: `{ status?, assigneeId? }` →
  `{ request, task }`, the task gets the details and the linked task is blocked by it;
  join: `{ role? }` → `{ request, membership }`. Everything happens in one transaction.
- `POST /triage/:id/decline` (leaders of the receiving space)

### Calendar
- `GET /events[?teamId=]&from=&to=` — events **overlapping** [from, to) (ISO instants);
  without `teamId`, every space's events
- `GET /events/upcoming?teamId=[&limit=3]` — upcoming or still running
- `POST /events` — `{ teamId, title, startsAt, endsAt?, allDay?, tone?, attendeeIds? }`
  (`allDay` + `endsAt` = multi-day; without `allDay`, no `endsAt` still means all day)
- `PATCH /events/:id` (`attendeeIds` replaces the list), `DELETE /events/:id`

### Cycles, projects and feed
- `GET /cycles/active?teamId=` (the cycle running now, or the latest; `null` if none), `GET /cycles/:id`
- `GET /teams/:teamId/cycle-settings` → `{ enabled, lengthWeeks, startDay, rollover, upcoming[] }`
- `PATCH /teams/:teamId/cycle-settings` — `{ enabled?, lengthWeeks? (1–3), startDay? (0 = domingo … 6), rollover? }` (leaders)
- `POST /cycles/:id/close` (leaders) → `{ closed, next, moved }`: creates the next cycle and moves
  unfinished tasks to it (`rollover: "next_cycle"`) or back to the backlog (`"backlog"`)
- `GET /projects/active?teamId=`, `GET /projects/:id`
- `GET /activity/recent?teamId=[&limit=3]` — written automatically

### Uploads
- `GET /uploads/avatars/:file` (public) — profile photos (`user.avatarUrl` is this path).
  Files live in `UPLOADS_DIR` (default `./uploads`). Since the browser doesn't reach the API,
  the web needs to proxy `/api/uploads/*` to `API_URL` (one rewrite in `next.config.ts`).
  For production, use a persistent volume or move to object storage.

### Errors

`400` invalid payload or a reference to something that doesn't exist, `401` no or
expired session, `403` not allowed (e.g. not a leader of that space), `404` unknown
resource, `409` conflict (already decided, already a member, email already registered),
`429` too many sign-in attempts. Unknown body fields are rejected.

## Notes

- **Dates.** Instants are `DateTime` columns returned as ISO-8601 UTC strings; the
  web parses them with `new Date()` and formats them in America/Mexico_City.
  `Task.dueDate` and triage `dueDate` are `"YYYY-MM-DD"` strings.
- **Order.** `position` columns keep insertion order (teams, board, sidebar, members) and
  break ties between entries that share a timestamp (history, comments, feed, notifications).
- **Task ids.** `Team.taskSeq` is incremented atomically, so concurrent creates never collide.
- **Guests** are a role label for now: write access isn't restricted per space yet
  (any signed-in person can edit tasks and pages in any space).
