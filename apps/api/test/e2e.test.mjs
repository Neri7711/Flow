/**
 * End-to-end tests for the Flow API.
 *
 * They run against a live API on a freshly seeded database (they create and delete data):
 *   corepack pnpm db:seed && corepack pnpm start      # in one terminal
 *   corepack pnpm test:e2e                            # in another
 *
 * API_URL defaults to http://localhost:4000/api; SEED_PASSWORD is read from .env.
 */
import assert from "node:assert/strict";
import { before, describe, test } from "node:test";

try {
  process.loadEnvFile(new URL("../.env", import.meta.url));
} catch {
  // Use the real environment.
}

const BASE = process.env.API_URL ?? "http://localhost:4000/api";
const PASSWORD = process.env.SEED_PASSWORD;

async function request(method, path, { token, body } = {}) {
  const headers = {};
  if (body !== undefined) headers["content-type"] = "application/json";
  if (token) headers.authorization = `Bearer ${token}`;
  const response = await fetch(BASE + path, { method, headers, body: body === undefined ? undefined : JSON.stringify(body) });
  const text = await response.text();
  return { status: response.status, body: text ? JSON.parse(text) : null };
}

async function login(email) {
  const { status, body } = await request("POST", "/auth/login", { body: { email, password: PASSWORD } });
  assert.equal(status, 200, `login ${email}: ${JSON.stringify(body)}`);
  return body.token;
}

/** Authenticated client for one user. `expected` asserts the status code when given. */
function as(token) {
  const call = (method) => async (path, body, expected) => {
    const response = await request(method, path, { token, body });
    if (expected !== undefined) assert.equal(response.status, expected, `${method} ${path}: ${JSON.stringify(response.body)}`);
    return response;
  };
  const get = async (path) => (await call("GET")(path, undefined, 200)).body;
  return { get, raw: call("GET"), post: call("POST"), patch: call("PATCH"), delete: call("DELETE") };
}

let moge; // leader of Play
let ana; // member of Play

before(async () => {
  assert.ok(PASSWORD, "SEED_PASSWORD must be set (apps/api/.env)");
  moge = as(await login("moge@flow.test"));
  ana = as(await login("ana@flow.test"));
});

describe("auth", () => {
  test("health and teams are public", async () => {
    assert.equal((await request("GET", "/health")).status, 200);
    const teams = await request("GET", "/teams");
    assert.equal(teams.status, 200);
    assert.deepEqual(teams.body.map((team) => team.id), ["cs", "pl", "me", "ii"]);
  });

  test("everything else needs a session", async () => {
    for (const path of ["/tasks", "/users", "/users/me", "/documents", "/triage?teamId=pl"]) {
      assert.equal((await request("GET", path)).status, 401, path);
    }
    assert.equal((await request("GET", "/tasks", { token: "not-a-token" })).status, 401);
  });

  test("wrong password and unknown email fail the same way", async () => {
    const wrong = await request("POST", "/auth/login", { body: { email: "moge@flow.test", password: "nope" } });
    const unknown = await request("POST", "/auth/login", { body: { email: "nadie@flow.test", password: "nope" } });
    assert.equal(wrong.status, 401);
    assert.equal(unknown.status, 401);
    assert.equal(wrong.body.message, unknown.body.message);
  });

  test("email is case-insensitive and the token identifies the user", async () => {
    const { status, body } = await request("POST", "/auth/login", { body: { email: "  ANA@Flow.Test ", password: PASSWORD } });
    assert.equal(status, 200);
    assert.equal(body.user.id, "u-ana");
    assert.equal((await as(body.token).get("/users/me")).id, "u-ana");
    assert.equal((await moge.get("/users/me")).email, "moge@flow.test");
  });

  test("password hashes never leave the API", async () => {
    const users = await moge.get("/users");
    assert.ok(users.every((user) => !("passwordHash" in user)));
  });
});

describe("reads (seed data, frontend order)", () => {
  test("users and labels", async () => {
    assert.deepEqual((await moge.get("/users")).map((user) => user.id), ["u-moge", "u-ana", "u-fer", "u-nico"]);
    assert.deepEqual((await moge.get("/task-labels")).map((label) => label.id), ["design", "art", "code", "audio", "logistics"]);
  });

  test("tasks keep fixture order and contract shape", async () => {
    const tasks = await moge.get("/tasks");
    assert.equal(tasks.length, 17);
    assert.deepEqual(tasks.slice(0, 4).map((task) => task.id), ["PL-54", "PL-55", "PL-56", "PL-51"]);
    assert.deepEqual(await moge.get("/tasks/PL-42"), {
      id: "PL-42",
      teamId: "pl",
      title: "Movimiento del jugador",
      status: "in_progress",
      assigneeId: "u-moge",
      labelId: "code",
      blockedByIds: ["CS-21"],
      description: "Caminar, correr y saltar con aceleración suave. Necesita el sistema de input de CS para soportar control y teclado.",
      priority: "high",
      cycleId: "pl-c4",
      projectId: "pl-game-jam",
      milestoneId: "playtest",
      sourceDocumentId: "pl-minute-0929",
      mentionedInDocumentIds: ["pl-jam-rules"],
    });
  });

  test("sidebar tree keeps authored order", async () => {
    const tree = await moge.get("/documents/tree?teamId=cs");
    assert.deepEqual(tree.map((node) => node.title), ["Sprints", "Wiki del equipo", "Minutas", "Recursos"]);
    assert.deepEqual(tree[1].children.map((node) => node.id), ["cs-onboarding", "cs-backend", "cs-sprite-import", "cs-conventions"]);
  });

  test("planning and feeds", async () => {
    assert.deepEqual((await moge.get("/events/upcoming?teamId=pl")).map((event) => event.id), ["ev-kickoff", "ev-playtest", "ev-builds"]);
    assert.equal((await moge.get("/cycles/active?teamId=pl")).id, "pl-c4");
    assert.equal((await moge.raw("/cycles/active?teamId=cs")).body, null);
    assert.equal((await moge.get("/projects/active?teamId=pl")).milestones.length, 3);
    assert.deepEqual((await moge.get("/activity/recent?teamId=pl")).map((item) => item.id), ["act-1", "act-2", "act-3"]);
    assert.deepEqual((await moge.get("/triage?teamId=pl")).map((item) => item.id), ["tr-1", "tr-2"]);
  });
});

describe("validation and errors", () => {
  const cases = [
    ["GET", "/events/upcoming", undefined, 400, "teamId is required"],
    ["GET", "/activity/recent?teamId=pl&limit=0", undefined, 400, "limit >= 1"],
    ["GET", "/tasks/XX-1", undefined, 404, "unknown task"],
    ["GET", "/documents/nope/comments", undefined, 404, "unknown document"],
    ["POST", "/tasks", { teamId: "pl", title: "x", status: "nope" }, 400, "bad status"],
    ["POST", "/tasks", { teamId: "zz", title: "x", status: "todo" }, 400, "unknown team"],
    ["POST", "/tasks", { teamId: "cs", title: "x", status: "todo", assigneeId: "u-ghost" }, 400, "unknown assignee"],
    ["POST", "/tasks", { teamId: "pl", title: "x", status: "todo", hack: 1 }, 400, "unknown field"],
    ["PATCH", "/tasks/PL-54/status", { status: "done", actorId: "u-fer" }, 400, "the client can't choose the actor"],
    ["POST", "/documents/nope/comments", { body: "x" }, 404, "comment on unknown document"],
  ];
  for (const [method, path, body, status, why] of cases) {
    test(`${method} ${path} -> ${status} (${why})`, async () => {
      const call = { GET: moge.raw, POST: moge.post, PATCH: moge.patch }[method];
      assert.equal((await call(path, body)).status, status);
    });
  }
});

describe("tasks", () => {
  test("create continues the team sequence; the frontend's NewTask shape is accepted", async () => {
    const { body } = await moge.post("/tasks", { teamId: "pl", abbreviation: "PL", title: "Probar backend", status: "todo", cycleId: "pl-c4" }, 201);
    assert.deepEqual(body, { id: "PL-57", teamId: "pl", title: "Probar backend", status: "todo", assigneeId: null, labelId: null, blockedByIds: [], cycleId: "pl-c4" });
  });

  test("concurrent creates get unique sequential ids", async () => {
    const results = await Promise.all(
      Array.from({ length: 10 }, (_, i) => moge.post("/tasks", { teamId: "pl", title: `Paralela ${i}`, status: "backlog" }, 201)),
    );
    const numbers = results.map(({ body }) => Number(body.id.slice(3))).sort((a, b) => a - b);
    assert.deepEqual(numbers, [58, 59, 60, 61, 62, 63, 64, 65, 66, 67]);
  });

  test("status changes are logged as the signed-in user", async () => {
    await ana.patch("/tasks/PL-57/status", { status: "in_progress" }, 200);
    await ana.patch("/tasks/PL-57/status", { status: "in_progress" }, 200); // same status: no-op
    await moge.patch("/tasks/PL-57/toggle-done", {}, 200);
    const events = await moge.get("/tasks/PL-57/events");
    assert.deepEqual(
      events.map((event) => [event.kind, event.status, event.actorId]),
      [
        ["status", "in_progress", "u-ana"],
        ["status", "done", "u-moge"],
      ],
    );
  });

  test("comments are authored by the signed-in user", async () => {
    const { body } = await ana.post("/tasks/PL-57/comments", { body: "Listo" }, 201);
    assert.equal(body.kind, "comment");
    assert.equal(body.actorId, "u-ana");
  });
});

describe("documents", () => {
  let page;

  test("create a page under cs-wiki; the author comes from the session", async () => {
    ({ body: page } = await ana.post("/documents", { teamId: "cs", title: "Nueva", parentId: "cs-wiki" }, 201));
    assert.equal(page.updatedById, "u-ana");
    const tree = await moge.get("/documents/tree?teamId=cs");
    assert.equal(tree[1].children.at(-1).id, page.id);
  });

  test("tree integrity: no cycles, no moving across spaces", async () => {
    await moge.post("/documents", { teamId: "pl", title: "x", parentId: "cs-wiki" }, 400);
    await moge.patch("/documents/cs-wiki", { parentId: page.id }, 400);
    await moge.patch("/documents/cs-wiki", { parentId: "cs-wiki" }, 400);
  });

  test("edits stamp the editor; null clears a property", async () => {
    const { body } = await moge.patch(`/documents/${page.id}`, { content: "<p>hola</p>", properties: { status: "Borrador", tags: ["a"] } }, 200);
    assert.equal(body.updatedById, "u-moge");
    assert.deepEqual(body.properties, { status: "Borrador", tags: ["a"] });
    assert.equal((await moge.get(`/documents/${page.id}/content`)).content, "<p>hola</p>");
    await moge.patch(`/documents/${page.id}`, { properties: { status: null, tags: [] } }, 200);
    assert.equal((await moge.get(`/documents/${page.id}`)).properties, undefined);
  });

  test("deleting a page removes its subtree and keeps tasks created from it", async () => {
    const { body } = await moge.delete("/documents/cs-wiki", undefined, 200);
    assert.deepEqual(
      [...body.deletedIds].sort(),
      ["cs-backend", "cs-conventions", "cs-onboarding", "cs-sprite-import", "cs-wiki", page.id].sort(),
    );
    await moge.delete("/documents/pl-minutes", undefined, 200);
    assert.equal((await moge.get("/tasks/PL-43")).sourceDocumentId, undefined);
  });
});
