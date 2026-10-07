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

describe("comment threads", () => {
  test("replies hang from their thread; the author comes from the session", async () => {
    const { body: reply } = await ana.post("/documents/cs-onboarding/comments", { body: "Sí, buena idea", parentId: "dc-1" }, 201);
    assert.equal(reply.parentId, "dc-1");
    assert.equal(reply.authorId, "u-ana");
    const comments = await moge.get("/documents/cs-onboarding/comments");
    assert.deepEqual(
      comments.map((comment) => [comment.id === reply.id ? "reply" : comment.id, comment.parentId]),
      [
        ["dc-1", null],
        ["reply", "dc-1"],
      ],
    );
  });

  test("threads are one level deep and belong to their page", async () => {
    const [, reply] = await moge.get("/documents/cs-onboarding/comments");
    await moge.post("/documents/cs-onboarding/comments", { body: "x", parentId: reply.id }, 400);
    await moge.post("/documents/pl-roadmap/comments", { body: "x", parentId: "dc-1" }, 400);
    await moge.post("/documents/cs-onboarding/comments", { body: "x", parentId: "nope" }, 400);
  });
});

describe("task mentions (backlinks)", () => {
  const pill = (id) => `<span data-type="task-mention" data-id="${id}">${id}</span>`;

  test("saving a page links the tasks its pills mention (unknown ids are ignored)", async () => {
    await moge.patch("/documents/pl-roadmap", { content: `<p>${pill("PL-42")} y ${pill("CS-17")} y ${pill("XX-99")} y otra vez ${pill("PL-42")}</p>` }, 200);
    assert.deepEqual((await moge.get("/tasks/PL-42")).mentionedInDocumentIds, ["pl-jam-rules", "pl-roadmap"]);
    assert.deepEqual((await moge.get("/tasks/CS-17")).mentionedInDocumentIds, ["pl-roadmap"]);
  });

  test("removing a pill removes the backlink", async () => {
    await moge.patch("/documents/pl-roadmap", { content: `<p>${pill("PL-42")}</p>` }, 200);
    assert.equal((await moge.get("/tasks/CS-17")).mentionedInDocumentIds, undefined);
    await moge.patch("/documents/pl-roadmap", { content: "<p>Sin menciones</p>" }, 200);
    assert.deepEqual((await moge.get("/tasks/PL-42")).mentionedInDocumentIds, ["pl-jam-rules"]);
  });

  test("editing only the title leaves backlinks alone", async () => {
    await moge.patch("/documents/pl-jam-rules", { title: "Reglas de la game jam (v2)" }, 200);
    assert.deepEqual((await moge.get("/tasks/PL-42")).mentionedInDocumentIds, ["pl-jam-rules"]);
  });
});

describe("activity feed", () => {
  const latest = async (teamId, limit) =>
    (await moge.get(`/activity/recent?teamId=${teamId}&limit=${limit}`)).map((item) => `${item.actorId}: ${item.summary}`);

  test("completing, creating and commenting show up newest first, in order", async () => {
    await ana.patch("/tasks/PL-55/status", { status: "done" }, 200);
    await ana.patch("/tasks/PL-55/status", { status: "in_review" }, 200); // not a completion: not in the feed
    const { body: task } = await moge.post("/tasks", { teamId: "pl", title: "Créditos del juego", status: "todo" }, 201);
    await ana.post(`/tasks/${task.id}/comments`, { body: "Yo me encargo" }, 201);
    await moge.post("/documents/pl-roadmap/comments", { body: "Revisar fechas" }, 201);
    assert.deepEqual(await latest("pl", 4), [
      "u-moge: comentó en Roadmap del semestre",
      `u-ana: comentó en ${task.id}`,
      `u-moge: creó ${task.id}`,
      "u-ana: completó PL-55",
    ]);
  });

  test("entries go to the team that owns the task or page", async () => {
    await moge.patch("/tasks/CS-17/status", { status: "done" }, 200);
    assert.deepEqual(await latest("cs", 1), ["u-moge: completó CS-17"]);
    assert.notEqual((await latest("pl", 1))[0], "u-moge: completó CS-17");
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

describe("inbox (triage)", () => {
  let fer; // the other leader of Play
  before(async () => {
    fer = as(await login("fer@flow.test"));
  });

  test("anyone can ask another team; asking your own team is refused", async () => {
    const { body } = await ana.post("/triage", { toTeamId: "cs", title: "Revisar el build de Windows" }, 201);
    assert.deepEqual([body.fromTeamId, body.toTeamId, body.requesterId, body.status], ["pl", "cs", "u-ana", "pending"]);
    assert.ok((await moge.get("/triage?teamId=cs")).some((request) => request.id === body.id));
    await ana.post("/triage", { toTeamId: "pl", title: "x" }, 400);
  });

  test("only leaders of the receiving team decide", async () => {
    const [toCs] = await moge.get("/triage?teamId=cs");
    await moge.post(`/triage/${toCs.id}/accept`, {}, 403); // leads Play, not CS
    await ana.post("/triage/tr-1/accept", {}, 403); // member of Play
  });

  test("accepting creates the task in the receiving team, exactly once", async () => {
    const { body } = await moge.post("/triage/tr-1/accept", { status: "backlog" }, 200);
    assert.equal(body.request.status, "accepted");
    assert.equal(body.request.taskId, body.task.id);
    assert.deepEqual([body.task.teamId, body.task.title, body.task.status], ["pl", "Medidas del control para el stand", "backlog"]);
    assert.equal((await moge.get(`/tasks/${body.task.id}`)).title, "Medidas del control para el stand");
    await fer.post("/triage/tr-1/accept", {}, 409);
    await fer.post("/triage/tr-1/decline", {}, 409);
  });

  test("declining removes it from the inbox", async () => {
    assert.equal((await fer.post("/triage/tr-2/decline", {}, 200)).body.status, "declined");
    assert.deepEqual(await moge.get("/triage?teamId=pl"), []);
  });
});

describe("calendar", () => {
  const october = "/events?teamId=pl&from=2026-10-01T06:00:00.000Z&to=2026-11-01T06:00:00.000Z";
  let created;

  test("events in a date range", async () => {
    assert.deepEqual((await moge.get(october)).map((event) => event.id), ["ev-kickoff", "ev-playtest", "ev-builds"]);
    assert.equal((await moge.raw("/events?teamId=pl&from=2026-11-01T00:00:00Z&to=2026-10-01T00:00:00Z")).status, 400);
    assert.equal((await moge.raw("/events?teamId=pl")).status, 400);
  });

  test("create validates the span and the tone, and shows up in the feed", async () => {
    const base = { teamId: "pl", title: "Retro del ciclo", startsAt: "2026-10-12T17:00:00-06:00" };
    await ana.post("/events", { ...base, endsAt: "2026-10-12T16:00:00-06:00" }, 400);
    await ana.post("/events", { ...base, tone: "zz" }, 400);
    ({ body: created } = await ana.post("/events", { ...base, endsAt: "2026-10-12T18:00:00-06:00" }, 201));
    assert.equal(created.tone, "pl");
    assert.ok((await moge.get(october)).some((event) => event.id === created.id));
    const [latest] = await moge.get("/activity/recent?teamId=pl&limit=1");
    assert.equal(`${latest.actorId}: ${latest.summary}`, "u-ana: agregó Retro del ciclo al calendario");
  });

  test("edit and delete", async () => {
    const { body } = await moge.patch(`/events/${created.id}`, { title: "Retro del ciclo 4", endsAt: null }, 200);
    assert.deepEqual([body.title, body.endsAt], ["Retro del ciclo 4", null]);
    await moge.delete(`/events/${created.id}`, undefined, 200);
    await moge.delete(`/events/${created.id}`, undefined, 404);
  });
});

describe("members", () => {
  let nico; // member of Play
  before(async () => {
    nico = as(await login("nico@flow.test"));
  });

  test("filter people by team", async () => {
    assert.equal((await moge.get("/users?teamId=pl")).length, 4);
    assert.deepEqual(await moge.get("/users?teamId=cs"), []);
  });

  test("leaders change roles in their team, never their own; members can't", async () => {
    await nico.patch("/users/u-ana/role", { role: "leader" }, 403);
    await moge.patch("/users/u-moge/role", { role: "member" }, 400);
    assert.equal((await moge.patch("/users/u-ana/role", { role: "leader" }, 200)).body.role, "leader");
    // The guard re-reads the user, so Ana's new role applies to her current session.
    await ana.patch("/users/u-nico/role", { role: "member" }, 200);
    await moge.patch("/users/u-ana/role", { role: "member" }, 200);
    await ana.patch("/users/u-nico/role", { role: "leader" }, 403);
  });
});

describe("invitations", () => {
  let nico;
  let token;
  before(async () => {
    nico = as(await login("nico@flow.test"));
  });

  test("leaders invite; existing accounts and members are refused", async () => {
    await nico.post("/invitations", { email: "sofia@flow.test", name: "Sofía Ramírez", role: "member" }, 403);
    await moge.post("/invitations", { email: "ANA@flow.test", name: "Ana", role: "member" }, 409);
    const { body } = await moge.post("/invitations", { email: " Sofia@Flow.test ", name: "Sofía Ramírez", role: "member" }, 201);
    token = body.token;
    assert.equal(body.invitation.email, "sofia@flow.test");
    assert.ok(!("tokenHash" in body.invitation));
    assert.deepEqual((await moge.get("/invitations?teamId=pl")).map((invitation) => invitation.email), ["sofia@flow.test"]);
    assert.equal((await nico.raw("/invitations?teamId=pl")).status, 403);
  });

  test("the link previews the invitation without a session", async () => {
    const preview = await request("GET", `/invitations/preview/${token}`);
    assert.equal(preview.status, 200);
    assert.deepEqual(preview.body, { email: "sofia@flow.test", name: "Sofía Ramírez", role: "member", teamId: "pl", teamName: "Play" });
    assert.equal((await request("GET", "/invitations/preview/not-a-token")).status, 404);
  });

  test("accepting creates the account, signs in and uses up the link", async () => {
    assert.equal((await request("POST", "/invitations/accept", { body: { token, password: "corta" } })).status, 400);
    const { status, body } = await request("POST", "/invitations/accept", { body: { token, password: "una-clave-segura" } });
    assert.equal(status, 200);
    assert.deepEqual([body.user.shortName, body.user.initials, body.user.teamId, body.user.role], ["Sofía", "SR", "pl", "member"]);
    assert.equal((await as(body.token).get("/users/me")).email, "sofia@flow.test");

    const again = await request("POST", "/auth/login", { body: { email: "sofia@flow.test", password: "una-clave-segura" } });
    assert.equal(again.status, 200);
    assert.equal((await request("POST", "/invitations/accept", { body: { token, password: "otra-clave-segura" } })).status, 404);
    assert.equal((await request("GET", `/invitations/preview/${token}`)).status, 404);
    assert.equal((await moge.get("/users?teamId=pl")).length, 5);
    assert.deepEqual(await moge.get("/invitations?teamId=pl"), []);
    const [latest] = await moge.get("/activity/recent?teamId=pl&limit=1");
    assert.equal(latest.summary, "se unió al equipo");
  });

  test("revoked links stop working", async () => {
    const { body } = await moge.post("/invitations", { email: "leo@flow.test", name: "Leo", role: "member" }, 201);
    await nico.delete(`/invitations/${body.invitation.id}`, undefined, 403);
    await moge.delete(`/invitations/${body.invitation.id}`, undefined, 200);
    assert.equal((await request("GET", `/invitations/preview/${body.token}`)).status, 404);
  });
});
