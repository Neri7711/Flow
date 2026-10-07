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
  // The seed dates the demo relative to today: the Play events fall in the next ~10 days.
  const DAY = 24 * 60 * 60 * 1000;
  const inDays = (days) => new Date(Date.now() + days * DAY).toISOString();
  const nextMonth = `/events?teamId=pl&from=${inDays(-1)}&to=${inDays(30)}`;
  let created;

  test("events in a date range", async () => {
    assert.deepEqual((await moge.get(nextMonth)).map((event) => event.id), ["ev-kickoff", "ev-playtest", "ev-builds"]);
    assert.deepEqual(await moge.get(`/events?teamId=pl&from=${inDays(-30)}&to=${inDays(-20)}`), []);
    assert.equal((await moge.raw(`/events?teamId=pl&from=${inDays(30)}&to=${inDays(1)}`)).status, 400);
    assert.equal((await moge.raw("/events?teamId=pl")).status, 400);
  });

  test("create validates the span and the tone, and shows up in the feed", async () => {
    const base = { teamId: "pl", title: "Retro del ciclo", startsAt: inDays(12) };
    await ana.post("/events", { ...base, endsAt: inDays(11.9) }, 400);
    await ana.post("/events", { ...base, tone: "zz" }, 400);
    ({ body: created } = await ana.post("/events", { ...base, endsAt: inDays(12.05) }, 201));
    assert.equal(created.tone, "pl");
    assert.ok((await moge.get(nextMonth)).some((event) => event.id === created.id));
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

  test("filter people by team; the role is the one in that space", async () => {
    assert.equal((await moge.get("/users?teamId=pl")).length, 4);
    const cs = await moge.get("/users?teamId=cs");
    assert.deepEqual(cs.map((user) => [user.id, user.role, user.teamId]), [["u-ana", "leader", "pl"]]);
    assert.deepEqual(cs[0].memberships.map((m) => [m.teamId, m.role]), [["pl", "member"], ["cs", "leader"]]);
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
    assert.deepEqual(preview.body, {
      email: "sofia@flow.test",
      name: "Sofía Ramírez",
      role: "member",
      teamId: "pl",
      teamName: "Play",
      invitedBy: { name: "Moge", role: "leader" },
    });
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

describe("task editing", () => {
  test("edit fields; null clears them; the contract shape is kept", async () => {
    const { body } = await moge.patch(
      "/tasks/PL-46",
      { title: "Pantalla de game over (v2)", description: "Con botón de reintentar", assigneeId: "u-ana", priority: "medium", labelId: "art", dueDate: "2026-12-01" },
      200,
    );
    assert.deepEqual(
      [body.title, body.description, body.assigneeId, body.priority, body.labelId, body.dueDate],
      ["Pantalla de game over (v2)", "Con botón de reintentar", "u-ana", "medium", "art", "2026-12-01"],
    );
    const { body: cleared } = await moge.patch("/tasks/PL-46", { description: null, assigneeId: null, priority: null, labelId: null, dueDate: null }, 200);
    assert.deepEqual([cleared.description, cleared.assigneeId, cleared.priority, cleared.labelId, cleared.dueDate], [undefined, null, undefined, null, undefined]);
  });

  test("invalid values are refused", async () => {
    await moge.patch("/tasks/PL-46", { priority: "urgent" }, 400);
    await moge.patch("/tasks/PL-46", { dueDate: "1/12/2026" }, 400);
    await moge.patch("/tasks/PL-46", { title: "" }, 400);
    await moge.patch("/tasks/PL-46", { assigneeId: "u-ghost" }, 400);
    await moge.patch("/tasks/XX-1", { title: "x" }, 404);
  });

  test("dependencies: replace the list, no self-blocks, no cycles", async () => {
    // Seed: CS-21 blocks PL-42, PL-42 blocks PL-47.
    await moge.patch("/tasks/PL-47", { blockedByIds: ["PL-47"] }, 400);
    await moge.patch("/tasks/CS-21", { blockedByIds: ["PL-47"] }, 400); // PL-47 -> PL-42 -> CS-21 would loop
    await moge.patch("/tasks/PL-42", { blockedByIds: ["XX-99"] }, 400);
    const { body } = await moge.patch("/tasks/PL-46", { blockedByIds: ["PL-44", "PL-44", "CS-17"] }, 200);
    assert.deepEqual([...body.blockedByIds].sort(), ["CS-17", "PL-44"]);
    assert.deepEqual((await moge.patch("/tasks/PL-46", { blockedByIds: [] }, 200)).body.blockedByIds, []);
  });

  test("deleting a task removes it with its history and links", async () => {
    await moge.delete("/tasks/PL-47", undefined, 200);
    await moge.raw("/tasks/PL-47", undefined, 404);
    await moge.delete("/tasks/PL-47", undefined, 404);
    assert.equal((await moge.get("/tasks")).some((task) => task.blockedByIds.includes("PL-47")), false);
  });
});

describe("weekly note", () => {
  let ana2;
  before(async () => {
    ana2 = as(await login("ana@flow.test"));
  });

  test("teams carry their note; leaders edit theirs; empty clears it", async () => {
    assert.equal((await request("GET", "/teams/pl")).body.weeklyNote, "Esta semana arranca la game jam de otoño.");
    assert.equal((await request("PATCH", "/teams/pl", { body: { weeklyNote: "x" } })).status, 401);
    await ana2.patch("/teams/pl", { weeklyNote: "x" }, 403); // member
    await moge.patch("/teams/cs", { weeklyNote: "x" }, 403); // leader of another team
    assert.equal((await moge.patch("/teams/pl", { weeklyNote: "  Semana de playtest  " }, 200)).body.weeklyNote, "Semana de playtest");
    assert.equal((await moge.patch("/teams/pl", { weeklyNote: "" }, 200)).body.weeklyNote, null);
  });
});

describe("sign-in throttling", () => {
  test("after 5 failures the email is locked for a while, even with the right password", async () => {
    // A fresh address each run: the lock lives in the API process for 15 minutes.
    const email = `throttle-${Date.now()}@flow.test`;
    const attempt = (password) => request("POST", "/auth/login", { body: { email, password } });
    for (let i = 0; i < 5; i++) assert.equal((await attempt("nope")).status, 401);
    assert.equal((await attempt("nope")).status, 429);
    // Other accounts are unaffected.
    assert.equal((await request("POST", "/auth/login", { body: { email: "fer@flow.test", password: PASSWORD } })).status, 200);
  });
});

describe("live dates", () => {
  test("the seeded demo is anchored to today", async () => {
    const cycle = await moge.get("/cycles/active?teamId=pl");
    const now = Date.now();
    assert.ok(Date.parse(cycle.startsAt) <= now && now <= Date.parse(cycle.endsAt), "the seeded cycle is running now");
    const today = new Intl.DateTimeFormat("en-CA", { timeZone: "America/Mexico_City" }).format(new Date());
    assert.ok((await moge.get("/tasks?teamId=pl")).some((task) => task.dueDate === today), "some tasks are due today");
  });
});

// ---------------------------------------------------------------------------------------------
// What the web needs next (memberships, notifications, attendees, settings, profile…)
// ---------------------------------------------------------------------------------------------

describe("notifications", () => {
  let ana2;
  let nico;
  let fer;
  let first; // assigned to Ana
  let second; // assigned to Nico, blocked by `first`
  // Unread only: `before` marks everything read, so these are the notifications this suite caused.
  const inbox = async (client) => (await client.get("/notifications?unread=true")).map((n) => `${n.kind}: ${n.title}`);

  before(async () => {
    ana2 = as(await login("ana@flow.test"));
    nico = as(await login("nico@flow.test"));
    fer = as(await login("fer@flow.test"));
    // Start every inbox empty.
    for (const client of [moge, ana2, nico, fer]) await client.post("/notifications/read-all", {}, 200);
  });

  test("assignments notify the new assignee (never yourself)", async () => {
    ({ body: first } = await moge.post("/tasks", { teamId: "pl", title: "Menú principal", status: "todo", assigneeId: "u-ana" }, 201));
    ({ body: second } = await moge.post("/tasks", { teamId: "pl", title: "Música del menú", status: "todo" }, 201));
    await moge.patch(`/tasks/${second.id}`, { assigneeId: "u-nico", blockedByIds: [first.id] }, 200);
    await moge.patch(`/tasks/${second.id}`, { title: "Música del menú (v2)" }, 200); // same assignee: no new notification
    await moge.post("/tasks", { teamId: "pl", title: "Mía", status: "todo", assigneeId: "u-moge" }, 201);

    assert.deepEqual((await inbox(ana2)).filter((t) => t.startsWith("assignment")), [`assignment: Moge te asignó ${first.id}`]);
    assert.deepEqual((await inbox(nico)).filter((t) => t.startsWith("assignment")), [`assignment: Moge te asignó ${second.id}`]);
    assert.deepEqual(await inbox(moge), []);
  });

  test("status changes notify the assignee and whoever the task was blocking", async () => {
    await moge.patch(`/tasks/${first.id}/status`, { status: "in_review" }, 200);
    assert.equal((await inbox(ana2))[0], `status: Moge movió ${first.id} a En revisión`);
    assert.equal((await inbox(nico))[0], `status: ${first.id}, que bloquea ${second.id}, pasó a En revisión`);
  });

  test("task comments: @mentions notify those people; the assignee hears about the rest", async () => {
    await fer.post(`/tasks/${first.id}/comments`, { body: "@Nico revisa el loop, porfa" }, 201);
    assert.equal((await inbox(nico))[0], `mention: Fer te mencionó en ${first.id}`);
    assert.equal((await inbox(ana2))[0], `comment: Fer comentó en ${first.id}`);
    const [mention] = await nico.get("/notifications");
    assert.equal(mention.excerpt, "@Nico revisa el loop, porfa");
    assert.equal(mention.taskId, first.id);
    assert.equal(mention.teamId, "pl");
  });

  test("page comments: replies notify the thread; pills notify only when newly added", async () => {
    const { body: thread } = await nico.post("/documents/pl-roadmap/comments", { body: "¿Movemos la entrega?" }, 201);
    await fer.post("/documents/pl-roadmap/comments", { body: "Sí, una semana", parentId: thread.id }, 201);
    assert.equal((await inbox(nico))[0], "comment: Fer respondió en Roadmap del semestre");

    const pills = `<p><span data-type="user-mention" data-id="u-fer">Fer</span> y <span data-type="task-mention" data-id="${first.id}">${first.id}</span></p>`;
    await moge.patch("/documents/pl-roadmap", { content: pills }, 200);
    await moge.patch("/documents/pl-roadmap", { content: pills + "<p>más texto</p>" }, 200); // autosave: nothing new
    const fers = (await inbox(fer)).filter((t) => t.startsWith("mention"));
    assert.deepEqual(fers, ["mention: Moge te mencionó en Roadmap del semestre"]);
    assert.equal((await inbox(ana2))[0], `mention: Moge mencionó ${first.id} en Roadmap del semestre`);
  });

  test("unread count, read one, read all; only your own", async () => {
    const before = (await nico.get("/notifications/unread-count")).count;
    assert.ok(before >= 3);
    const [latest] = await nico.get("/notifications?unread=true");
    assert.equal((await nico.patch(`/notifications/${latest.id}/read`, {}, 200)).body.readAt !== null, true);
    assert.equal((await nico.get("/notifications/unread-count")).count, before - 1);
    await ana2.patch(`/notifications/${latest.id}/read`, {}, 404); // someone else's
    assert.equal((await nico.post("/notifications/read-all", {}, 200)).body.count, before - 1);
    assert.deepEqual(await nico.get("/notifications?unread=true"), []);
    assert.ok((await nico.get("/notifications")).length >= 3); // read ones are still listed
  });
});

describe("inbox: details, linked task, assign on accept, join requests", () => {
  let ana2;
  let nico;
  before(async () => {
    ana2 = as(await login("ana@flow.test"));
    nico = as(await login("nico@flow.test"));
  });

  test("a work request carries details; accepting assigns, dates and links in one step", async () => {
    const { body: request } = await moge.post(
      "/triage",
      { toTeamId: "cs", title: "Input para el control", description: "Soporte para gamepad", dueDate: "2026-12-15", linkedTaskId: "PL-44" },
      201,
    );
    assert.deepEqual([request.kind, request.description, request.dueDate, request.linkedTaskId], ["work", "Soporte para gamepad", "2026-12-15", "PL-44"]);
    await moge.post("/triage", { toTeamId: "cs", title: "x", linkedTaskId: "XX-1" }, 400);

    const { body } = await ana2.post(`/triage/${request.id}/accept`, { assigneeId: "u-ana", status: "backlog" }, 200);
    assert.deepEqual(
      [body.task.teamId, body.task.assigneeId, body.task.status, body.task.description, body.task.dueDate],
      ["cs", "u-ana", "backlog", "Soporte para gamepad", "2026-12-15"],
    );
    assert.ok((await moge.get("/tasks/PL-44")).blockedByIds.includes(body.task.id), "PL-44 now waits on the new task");
  });

  test("join requests: once per person, not for spaces you're in; a leader adds you", async () => {
    await ana2.post("/triage", { kind: "join", toTeamId: "cs" }, 409); // already in CS
    const { body: request } = await nico.post("/triage", { kind: "join", toTeamId: "cs", description: "Quiero ayudar con audio" }, 201);
    assert.deepEqual([request.kind, request.title, request.requesterId], ["join", "Quiere unirse a Computer Science", "u-nico"]);
    await nico.post("/triage", { kind: "join", toTeamId: "cs" }, 409); // already pending
    assert.ok((await ana2.get("/triage?teamId=cs")).some((item) => item.id === request.id && item.kind === "join"));

    await moge.post(`/triage/${request.id}/accept`, {}, 403); // not a CS leader
    const { body } = await ana2.post(`/triage/${request.id}/accept`, { role: "guest" }, 200);
    assert.deepEqual(body.membership, { userId: "u-nico", teamId: "cs", role: "guest" });
    const me = await nico.get("/users/me");
    assert.deepEqual(me.memberships.map((m) => [m.teamId, m.role]), [["pl", "member"], ["cs", "guest"]]);
    assert.deepEqual([me.teamId, me.role], ["pl", "member"]); // home space unchanged
  });
});

describe("memberships", () => {
  let ana2;
  before(async () => {
    ana2 = as(await login("ana@flow.test"));
  });

  test("leaders add existing people to their space, and change roles there", async () => {
    await moge.post("/teams/cs/members", { userId: "u-fer", role: "guest" }, 403); // not a CS leader
    const { body } = await ana2.post("/teams/cs/members", { userId: "u-fer", role: "guest" }, 200);
    assert.deepEqual([body.id, body.role], ["u-fer", "guest"]);
    await ana2.post("/teams/cs/members", { userId: "u-fer", role: "member" }, 409);
    await ana2.post("/teams/cs/members", { userId: "u-ghost", role: "member" }, 400);

    const changed = await ana2.patch("/users/u-fer/role", { role: "member", teamId: "cs" }, 200);
    assert.equal(changed.body.role, "member");
    const fer = await moge.get("/users/u-fer");
    assert.deepEqual([fer.role, fer.teamId], ["leader", "pl"]); // home role untouched
  });

  test("a leader role counts only in its own space", async () => {
    // Ana leads CS but is a member in Play.
    await ana2.patch("/teams/pl", { weeklyNote: "x" }, 403);
    await ana2.patch("/teams/cs", { weeklyNote: "Sprint de arquitectura" }, 200);
  });

  test("removing: not yourself, not from someone's home space", async () => {
    await ana2.delete("/teams/cs/members/u-ana", undefined, 400);
    await moge.delete("/teams/pl/members/u-ana", undefined, 400); // Play is Ana's home space
    await ana2.delete("/teams/cs/members/u-fer", undefined, 200);
    assert.equal((await moge.get("/users/u-fer")).memberships.some((m) => m.teamId === "cs"), false);
    await ana2.delete("/teams/cs/members/u-fer", undefined, 404);
  });

  test("guests can be invited; the preview names who invited", async () => {
    const { body } = await moge.post("/invitations", { email: "mentora@flow.test", name: "Lucía Vega", role: "guest" }, 201);
    assert.equal(body.invitation.role, "guest");
    const preview = await request("GET", `/invitations/preview/${body.token}`);
    assert.deepEqual(preview.body.invitedBy, { name: "Moge", role: "leader" });
    await moge.post("/invitations", { email: "ana@flow.test", name: "Ana", role: "member" }, 409);
  });

  test("last activity is tracked for presence", async () => {
    const me = await moge.get("/users/me");
    assert.ok(Date.now() - Date.parse(me.lastActiveAt) < 5 * 60 * 1000);
  });
});

describe("profile", () => {
  let sofia;
  before(async () => {
    const { body } = await request("POST", "/auth/login", { body: { email: "sofia@flow.test", password: "una-clave-segura" } });
    sofia = as(body.token);
  });

  // 1x1 transparent PNG.
  const PNG = Buffer.from("iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAQAAAC1HAwCAAAAC0lEQVR42mNkYAAAAAYAAjCB0C8AAAAASUVORK5CYII=", "base64");
  const upload = async (token, bytes, type) => {
    const form = new FormData();
    form.append("file", new Blob([bytes], { type }), "foto");
    const response = await fetch(`${BASE}/users/me/avatar`, { method: "POST", headers: { authorization: `Bearer ${token}` }, body: form });
    return { status: response.status, body: await response.json() };
  };
  let sofiaToken;
  before(async () => {
    sofiaToken = (await request("POST", "/auth/login", { body: { email: "sofia@flow.test", password: "una-clave-segura" } })).body.token;
  });

  test("edit your own name, nickname and area (initials follow the name)", async () => {
    const { body } = await sofia.patch("/users/me", { name: "Sofía Ramírez Ortiz", shortName: "Sofi", area: "Producción" }, 200);
    assert.deepEqual([body.name, body.shortName, body.initials, body.area], ["Sofía Ramírez Ortiz", "Sofi", "SR", "Producción"]);
    assert.equal((await sofia.patch("/users/me", { area: null }, 200)).body.area, null);
    await sofia.patch("/users/me", { name: "" }, 400);
    await sofia.patch("/users/me", { role: "leader" }, 400); // not editable here
  });

  test("profile photo: real images only, served publicly, replaceable and removable", async () => {
    assert.equal((await upload(sofiaToken, Buffer.from("no soy una imagen"), "image/png")).status, 400);
    const { status, body } = await upload(sofiaToken, PNG, "image/png");
    assert.equal(status, 200);
    assert.match(body.avatarUrl, /^\/api\/uploads\/avatars\/[\w-]+\.png$/);
    const photo = await fetch(BASE.replace(/\/api$/, "") + body.avatarUrl);
    assert.equal(photo.status, 200);
    assert.equal(photo.headers.get("content-type"), "image/png");
    assert.equal((await fetch(`${BASE}/uploads/avatars/..%2F..%2F.env`)).status, 404);

    const { body: cleared } = await sofia.delete("/users/me/avatar", undefined, 200);
    assert.equal(cleared.avatarUrl, null);
    assert.equal((await fetch(BASE.replace(/\/api$/, "") + body.avatarUrl)).status, 404);
  });

  test("onboarding is remembered", async () => {
    assert.equal((await sofia.get("/users/me")).onboardedAt, null);
    assert.ok((await sofia.post("/users/me/onboarded", {}, 200)).body.onboardedAt);
  });
});

describe("page look", () => {
  test("icon, cover and draft label; only set ones are sent", async () => {
    const { body: page } = await moge.post("/documents", { teamId: "pl", title: "Retro", icon: "🎮", coverTone: "ii", isDraft: true }, 201);
    assert.deepEqual([page.icon, page.coverTone, page.isDraft], ["🎮", "ii", true]);
    await moge.post("/documents", { teamId: "pl", title: "x", coverTone: "zz" }, 400);
    const { body } = await moge.patch(`/documents/${page.id}`, { icon: null, coverTone: null, isDraft: false }, 200);
    assert.deepEqual([body.icon, body.coverTone, body.isDraft], [undefined, undefined, undefined]);
    assert.equal((await moge.get("/documents/pl-roadmap")).isDraft, undefined);
  });
});

describe("calendar: attendees, all teams, multi-day", () => {
  const DAY = 24 * 60 * 60 * 1000;
  const inDays = (days) => new Date(Date.now() + days * DAY).toISOString();
  let hackathon;

  test("seeded events carry attendees and the all-day flag", async () => {
    const events = await moge.get(`/events?teamId=pl&from=${inDays(-1)}&to=${inDays(30)}`);
    const kickoff = events.find((event) => event.id === "ev-kickoff");
    assert.deepEqual([kickoff.allDay, kickoff.attendeeIds], [false, ["u-ana", "u-fer", "u-moge", "u-nico"]]);
    assert.equal(events.find((event) => event.id === "ev-builds").allDay, true);
  });

  test("without teamId, every team's events", async () => {
    const all = await moge.get(`/events?from=${inDays(-1)}&to=${inDays(30)}`);
    assert.deepEqual([...new Set(all.map((event) => event.teamId))].sort(), ["cs", "pl"]);
  });

  test("multi-day events show up in any range they overlap", async () => {
    ({ body: hackathon } = await moge.post(
      "/events",
      { teamId: "ii", title: "Hackathon", startsAt: inDays(20), endsAt: inDays(21.9), allDay: true, attendeeIds: ["u-nico", "u-ana", "u-nico"] },
      201,
    ));
    assert.deepEqual([hackathon.allDay, hackathon.attendeeIds], [true, ["u-ana", "u-nico"]]);
    // A range that starts on day 2 of the hackathon still includes it.
    assert.ok((await moge.get(`/events?teamId=ii&from=${inDays(21)}&to=${inDays(23)}`)).some((e) => e.id === hackathon.id));
    assert.equal((await moge.get(`/events?teamId=ii&from=${inDays(23)}&to=${inDays(25)}`)).some((e) => e.id === hackathon.id), false);
    await moge.post("/events", { teamId: "ii", title: "x", startsAt: inDays(1), attendeeIds: ["u-ghost"] }, 400);
  });

  test("attendees are replaced on update", async () => {
    const { body } = await moge.patch(`/events/${hackathon.id}`, { attendeeIds: ["u-fer"] }, 200);
    assert.deepEqual(body.attendeeIds, ["u-fer"]);
  });
});

describe("cycle settings", () => {
  let ana2;
  before(async () => {
    ana2 = as(await login("ana@flow.test"));
  });

  test("settings with a preview of the next cycles", async () => {
    const settings = await moge.get("/teams/pl/cycle-settings");
    assert.deepEqual([settings.enabled, settings.lengthWeeks, settings.rollover], [true, 2, "next_cycle"]);
    const cycle = await moge.get("/cycles/active?teamId=pl");
    assert.deepEqual(settings.upcoming.map((c) => c.number), [5, 6, 7]);
    assert.ok(Date.parse(settings.upcoming[0].startsAt) > Date.parse(cycle.endsAt));
    const lengthDays = (Date.parse(settings.upcoming[0].endsAt) - Date.parse(settings.upcoming[0].startsAt)) / (24 * 60 * 60 * 1000);
    assert.ok(lengthDays > 13.9 && lengthDays < 14);
    // Spaces without settings get the defaults.
    assert.equal((await moge.get("/teams/me/cycle-settings")).lengthWeeks, 2);
  });

  test("only that space's leaders change them; values are validated", async () => {
    await ana2.patch("/teams/pl/cycle-settings", { lengthWeeks: 1 }, 403);
    await moge.patch("/teams/pl/cycle-settings", { lengthWeeks: 4 }, 400);
    await moge.patch("/teams/pl/cycle-settings", { startDay: 7 }, 400);
    const { body } = await moge.patch("/teams/pl/cycle-settings", { lengthWeeks: 1, rollover: "backlog" }, 200);
    assert.deepEqual([body.lengthWeeks, body.rollover], [1, "backlog"]);
  });

  test("closing a cycle creates the next one and rolls unfinished work over", async () => {
    await ana2.post("/cycles/pl-c4/close", {}, 403);
    const unfinished = (await moge.get("/tasks?cycleId=pl-c4")).filter((task) => task.status !== "done").map((task) => task.id);
    const { body } = await moge.post("/cycles/pl-c4/close", {}, 200);
    assert.equal(body.next.number, 5);
    assert.deepEqual([...body.moved].sort(), [...unfinished].sort());
    // rollover = backlog: back to the backlog, out of any cycle.
    const moved = await moge.get(`/tasks/${unfinished[0]}`);
    assert.deepEqual([moved.status, moved.cycleId], ["backlog", undefined]);
    assert.equal((await moge.get("/tasks?cycleId=pl-c4")).every((task) => task.status === "done"), true);
    await moge.post("/cycles/pl-c4/close", {}, 409); // cycle 5 already exists
  });
});
