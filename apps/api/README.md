# @flow/api

Backend REST API for Flow — **NestJS + Prisma + PostgreSQL**. It implements the
same feature surface the web frontend (`@flow/web`) was designed against
(Notion-style docs + Linear-style tasks: teams, users, tasks, cycles, projects,
documents, events, activity, triage).

The frontend currently reads static fixtures through `async` functions in
`apps/web/src/entities/*/api/`. This API returns the **exact same shapes**, so
those functions can later be swapped for HTTP calls with no change to the
frontend components. The frontend is intentionally untouched by this backend.

## Requirements

- Node 20+ and pnpm 10 (via `corepack`)
- PostgreSQL 16 (a `docker-compose.yml` is provided)

## Setup

From the repo root (or `apps/api`):

```bash
# 1. Install workspace deps
pnpm install

# 2. Start PostgreSQL
cd apps/api && docker compose up -d

# 3. Configure env
cp .env.example .env            # defaults match docker-compose

# 4. Create the schema and generate the client
pnpm --filter @flow/api prisma:migrate   # first run: name it "init"

# 5. Seed the fixture data (same data the frontend mockups use)
pnpm --filter @flow/api db:seed

# 6. Run the API (http://localhost:4000/api)
pnpm --filter @flow/api dev
```

Health check: `GET http://localhost:4000/api/health`.

## Endpoints

All routes are under the `/api` prefix.

### Teams & users
- `GET /teams`, `GET /teams/:id`
- `GET /users`, `GET /users/me`, `GET /users/:id`

### Tasks
- `GET /tasks?teamId=&cycleId=&status=`
- `GET /tasks/:id`
- `GET /tasks/:id/events`
- `GET /task-labels`
- `POST /tasks` — `{ teamId, abbreviation, title, status, assigneeId?, cycleId?, sourceDocumentId? }` (assigns the next per-team id, e.g. `PL-57`)
- `PATCH /tasks/:id/status` — `{ status, actorId? }`
- `PATCH /tasks/:id/toggle-done` — `{ actorId? }` (done ↔ todo)
- `POST /tasks/:id/comments` — `{ actorId, body }`

### Documents (Notion-style pages)
- `GET /documents`, `GET /documents?teamId=`
- `GET /documents/tree?teamId=` — nested sidebar tree
- `GET /documents/recent?teamId=&limit=`
- `GET /documents/:id`
- `GET /documents/:id/content` — `{ content }` (TipTap HTML)
- `GET /documents/:id/comments`
- `POST /documents` — `{ teamId, title, parentId?, updatedById, content?, properties? }`
- `PATCH /documents/:id` — `{ title?, content?, parentId?, properties?, updatedById? }`
- `DELETE /documents/:id` — deletes the page and its whole subtree
- `POST /documents/:id/comments` — `{ authorId, body }`

### Planning & feeds
- `GET /cycles/active?teamId=`, `GET /cycles/:id`
- `GET /projects/active?teamId=`, `GET /projects/:id`
- `GET /events/upcoming?teamId=&limit=`
- `GET /activity/recent?teamId=&limit=`
- `GET /triage?teamId=`

## Notes

- Date-like fields the frontend treats as opaque pre-formatted strings
  (`startsAt`, `dueDate`, `at`, `updatedAt`, …) are stored as `String` so
  responses stay byte-identical to the current fixtures.
- `src/shared/clock.ts` mirrors the frontend's mock clock (`MOCK_NOW`) so
  "upcoming events" and new timestamps line up with the seeded mockups.
  Swap `now()` for `new Date()` once the app runs on live data.
- Auth is simulated: `GET /users/me` returns the seeded `u-moge`
  (`CURRENT_USER_ID` in `src/modules/user/user.service.ts`).
