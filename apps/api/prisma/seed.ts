/**
 * Seeds the database with the same data the frontend currently ships as
 * fixtures (apps/web/src/entities/*\/api/fixtures.ts and inline *-api.ts data),
 * so the backend-backed app renders identically to the mockups.
 *
 * Arrays are inserted in fixture order: `position` columns auto-increment, so
 * the API returns lists in the same order the frontend renders them.
 *
 * Run: pnpm db:seed   (or `prisma migrate reset`, which calls it).
 */
import { type Prisma, PrismaClient } from "@prisma/client";

import { hashPassword } from "../src/auth/password";

try {
  process.loadEnvFile();
} catch {
  // No .env file: rely on the real environment.
}

const prisma = new PrismaClient();

/** Every seeded user signs in with this password (development data only). */
const SEED_PASSWORD = process.env.SEED_PASSWORD;

/**
 * The fixtures were written for "now" = 30 Sep 2026, 09:30 in Mexico City. The seed moves them
 * to the moment it runs, so the demo always looks current:
 * - calendar things (events, cycle, milestones, due dates) keep their weekday-relative day and
 *   wall time, shifted by whole days (Mexico City has no DST);
 * - log things (activity, comments, history, edits) keep their age ("hace 20 min").
 */
const FIXTURE_NOW = new Date("2026-09-30T09:30:00-06:00");
const SEED_NOW = new Date();
const DAY_MS = 24 * 60 * 60 * 1000;
const dayKey = (date: Date) => new Intl.DateTimeFormat("en-CA", { timeZone: "America/Mexico_City" }).format(date);
const DAY_SHIFT = Math.round((Date.parse(dayKey(SEED_NOW)) - Date.parse(dayKey(FIXTURE_NOW))) / DAY_MS);

const on = (iso: string) => new Date(Date.parse(iso) + DAY_SHIFT * DAY_MS);
const ago = (iso: string) => new Date(SEED_NOW.getTime() - (FIXTURE_NOW.getTime() - Date.parse(iso)));
/** "Today" of the fixtures (due dates), as a calendar day in Mexico City. */
const TODAY = dayKey(on("2026-09-30T12:00:00-06:00"));

const TEAMS = [
  { id: "cs", name: "Computer Science", abbreviation: "CS", mascotAlt: "Pantera de Computer Science" },
  { id: "pl", name: "Play", abbreviation: "PL", mascotAlt: "Pantera de Play", weeklyNote: "Esta semana arranca la game jam de otoño." },
  { id: "me", name: "Mechanics", abbreviation: "ME", mascotAlt: "Pantera de Mechanics" },
  { id: "ii", name: "IISE", abbreviation: "II", mascotAlt: "Pantera de IISE" },
];

const USERS: Omit<Prisma.UserCreateManyInput, "passwordHash">[] = [
  { id: "u-moge", email: "moge@flow.test", name: "Moge", shortName: "Moge", initials: "EM", role: "leader", teamId: "pl", avatarTone: null },
  { id: "u-ana", email: "ana@flow.test", name: "Ana López", shortName: "Ana", initials: "AL", role: "member", teamId: "pl", avatarTone: "cs" },
  { id: "u-fer", email: "fer@flow.test", name: "Fer Ruiz", shortName: "Fer", initials: "FR", role: "leader", teamId: "pl", avatarTone: "pl" },
  { id: "u-nico", email: "nico@flow.test", name: "Nico Herrera", shortName: "Nico", initials: "NH", role: "member", teamId: "pl", avatarTone: "ii" },
];

const LABELS: Prisma.TaskLabelCreateManyInput[] = [
  { id: "design", name: "Diseño", tone: "pl" },
  { id: "art", name: "Arte", tone: "cs" },
  { id: "code", name: "Código", tone: "ii" },
  { id: "audio", name: "Audio", tone: "me" },
  { id: "logistics", name: "Logística", tone: null },
];

const CS_ONBOARDING_CONTENT = `
    <p>Bienvenida al equipo de Computer Science. Esta guía reúne todo lo que necesitas para tu primera semana: con quién hablar, cómo preparar tu entorno y dónde vive cada cosa.</p>
    <div data-type="callout"><p>Si es tu primera semana, empieza por la sección 2 y agenda una sesión con tu mentor.</p></div>
    <h2>1. Antes de tu primera reunión</h2>
    <ul data-type="taskList">
      <li data-type="taskItem" data-checked="true"><p>Unirte al canal del equipo</p></li>
      <li data-type="taskItem" data-checked="false"><p>Leer las convenciones de código</p></li>
      <li data-type="taskItem" data-checked="false"><p>Pedir acceso al repositorio a tu líder</p></li>
    </ul>
    <h2>2. Configura tu entorno</h2>
    <p>Clona el proyecto y levanta el servidor local. Si algo falla, deja un comentario en esta página. El avance del entorno compartido está en <span data-type="task-mention" data-id="CS-17"></span>.</p>
    <pre><code class="language-bash">git clone [URL DEL REPOSITORIO]
cd panteras-web
npm install
npm run dev</code></pre>
    <p></p>
  `;

// Sidebar order, parent-first.
const DOCUMENTS: Prisma.DocumentCreateManyInput[] = [
  { id: "pl-roadmap", teamId: "pl", title: "Roadmap del semestre", parentId: null, updatedAt: ago("2026-09-25T12:00:00-06:00"), updatedById: "u-moge" },
  { id: "pl-game-jam", teamId: "pl", title: "Game jam de otoño", parentId: null, updatedAt: ago("2026-09-26T18:00:00-06:00"), updatedById: "u-moge" },
  { id: "pl-ideas", teamId: "pl", title: "Ideas y pitches", parentId: "pl-game-jam", updatedAt: ago("2026-09-30T07:30:00-06:00"), updatedById: "u-fer" },
  { id: "pl-roles", teamId: "pl", title: "Equipos y roles", parentId: "pl-game-jam", updatedAt: ago("2026-09-26T10:00:00-06:00"), updatedById: "u-moge" },
  { id: "pl-deliverables", teamId: "pl", title: "Entregables", parentId: "pl-game-jam", updatedAt: ago("2026-09-24T10:00:00-06:00"), updatedById: "u-nico" },
  { id: "pl-jam-rules", teamId: "pl", title: "Reglas de la game jam", parentId: "pl-deliverables", updatedAt: ago("2026-09-29T20:00:00-06:00"), updatedById: "u-moge" },
  { id: "pl-minutes", teamId: "pl", title: "Minutas semanales", parentId: null, updatedAt: ago("2026-09-22T19:00:00-06:00"), updatedById: "u-nico" },
  { id: "pl-minute-0929", teamId: "pl", title: "Minuta · 29 sep", parentId: "pl-minutes", updatedAt: ago("2026-09-29T19:00:00-06:00"), updatedById: "u-nico" },
  { id: "pl-wiki", teamId: "pl", title: "Wiki del equipo", parentId: null, updatedAt: ago("2026-09-20T10:00:00-06:00"), updatedById: "u-ana" },
  { id: "pl-art-guide", teamId: "pl", title: "Guía de estilo de arte", parentId: "pl-wiki", updatedAt: ago("2026-09-27T11:00:00-06:00"), updatedById: "u-ana" },
  { id: "cs-sprints", teamId: "cs", title: "Sprints", parentId: null, updatedAt: ago("2026-09-28T10:00:00-06:00"), updatedById: "u-ana" },
  { id: "cs-wiki", teamId: "cs", title: "Wiki del equipo", parentId: null, updatedAt: ago("2026-09-22T10:00:00-06:00"), updatedById: "u-ana" },
  {
    id: "cs-onboarding",
    teamId: "cs",
    title: "Onboarding para nuevos integrantes",
    parentId: "cs-wiki",
    updatedAt: ago("2026-09-30T09:25:00-06:00"),
    updatedById: "u-ana",
    content: CS_ONBOARDING_CONTENT,
    propStatus: "En revisión",
    propOwnerId: "u-ana",
    propTags: ["guía", "primer semestre"],
  },
  { id: "cs-backend", teamId: "cs", title: "Arquitectura del backend", parentId: "cs-wiki", updatedAt: ago("2026-09-21T10:00:00-06:00"), updatedById: "u-ana" },
  { id: "cs-sprite-import", teamId: "cs", title: "Importar sprites al motor", parentId: "cs-wiki", updatedAt: ago("2026-09-23T10:00:00-06:00"), updatedById: "u-ana" },
  { id: "cs-conventions", teamId: "cs", title: "Convenciones de código", parentId: "cs-wiki", updatedAt: ago("2026-09-19T10:00:00-06:00"), updatedById: "u-ana" },
  { id: "cs-minutes", teamId: "cs", title: "Minutas", parentId: null, updatedAt: ago("2026-09-29T10:00:00-06:00"), updatedById: "u-nico" },
  { id: "cs-resources", teamId: "cs", title: "Recursos", parentId: null, updatedAt: ago("2026-09-10T10:00:00-06:00"), updatedById: "u-ana" },
  { id: "me-wiki", teamId: "me", title: "Wiki del equipo", parentId: null, updatedAt: ago("2026-09-18T10:00:00-06:00"), updatedById: "u-nico" },
  { id: "me-minutes", teamId: "me", title: "Minutas", parentId: null, updatedAt: ago("2026-09-26T10:00:00-06:00"), updatedById: "u-nico" },
  { id: "ii-wiki", teamId: "ii", title: "Wiki del equipo", parentId: null, updatedAt: ago("2026-09-18T10:00:00-06:00"), updatedById: "u-fer" },
  { id: "ii-minutes", teamId: "ii", title: "Minutas", parentId: null, updatedAt: ago("2026-09-26T10:00:00-06:00"), updatedById: "u-fer" },
];

const TASKS: Prisma.TaskCreateManyInput[] = [
  // Play — due today (space home)
  { id: "PL-54", teamId: "pl", title: "Definir mecánica principal", status: "todo", assigneeId: "u-fer", labelId: "design", dueDate: TODAY, cycleId: "pl-c4" },
  { id: "PL-55", teamId: "pl", title: "Sprites del personaje", status: "todo", assigneeId: "u-ana", labelId: "art", dueDate: TODAY, cycleId: "pl-c4" },
  { id: "PL-56", teamId: "pl", title: "Prototipo de movimiento", status: "in_progress", assigneeId: "u-moge", labelId: "code", dueDate: TODAY, cycleId: "pl-c4" },
  // Play — cycle 4 board
  { id: "PL-51", teamId: "pl", title: "Explorar música estilo chiptune", status: "backlog", assigneeId: "u-nico", labelId: "audio", cycleId: "pl-c4" },
  { id: "PL-49", teamId: "pl", title: "Menú de pausa", status: "backlog", assigneeId: "u-moge", labelId: "code", cycleId: "pl-c4" },
  { id: "PL-53", teamId: "pl", title: "Paleta de color del nivel 2", status: "backlog", assigneeId: "u-ana", labelId: "art", cycleId: "pl-c4" },
  { id: "PL-52", teamId: "pl", title: "Sprites de la interfaz", status: "backlog", assigneeId: "u-fer", labelId: "art" },
  { id: "PL-43", teamId: "pl", title: "Sprites del enemigo", status: "todo", assigneeId: "u-ana", labelId: "art", cycleId: "pl-c4", sourceDocumentId: "pl-minute-0929" },
  { id: "PL-46", teamId: "pl", title: "Pantalla de game over", status: "todo", assigneeId: "u-fer", labelId: "design", cycleId: "pl-c4" },
  { id: "PL-47", teamId: "pl", title: "Animaciones de salto", status: "todo", assigneeId: "u-ana", labelId: "art", cycleId: "pl-c4" },
  {
    id: "PL-42",
    teamId: "pl",
    title: "Movimiento del jugador",
    description: "Caminar, correr y saltar con aceleración suave. Necesita el sistema de input de CS para soportar control y teclado.",
    status: "in_progress",
    priority: "high",
    assigneeId: "u-moge",
    labelId: "code",
    cycleId: "pl-c4",
    projectId: "pl-game-jam",
    milestoneId: "playtest",
    sourceDocumentId: "pl-minute-0929",
  },
  { id: "PL-44", teamId: "pl", title: "Tileset del nivel 1", status: "in_progress", assigneeId: "u-ana", labelId: "art", cycleId: "pl-c4" },
  { id: "PL-40", teamId: "pl", title: "Documento de reglas de la jam", status: "in_review", assigneeId: "u-fer", labelId: "design", cycleId: "pl-c4" },
  { id: "PL-38", teamId: "pl", title: "Reservar sala para kickoff", status: "done", assigneeId: "u-nico", labelId: "logistics", dueDate: TODAY, cycleId: "pl-c4" },
  { id: "PL-36", teamId: "pl", title: "Lluvia de ideas de temática", status: "done", assigneeId: "u-fer", labelId: "design", cycleId: "pl-c4" },
  // Computer Science — cross-team dependency
  { id: "CS-21", teamId: "cs", title: "Controlador de input", status: "in_review", assigneeId: "u-ana", labelId: "code" },
  { id: "CS-17", teamId: "cs", title: "Configurar entorno de desarrollo", status: "in_progress", assigneeId: "u-ana", labelId: "code" },
];

/** Highest seeded number per team prefix, so new tasks continue the sequence (PL-56 -> PL-57). */
function taskSeqFor(abbreviation: string): number {
  const prefix = `${abbreviation}-`;
  return TASKS.reduce((max, { id }) => (id.startsWith(prefix) ? Math.max(max, Number(id.slice(prefix.length))) : max), 0);
}

async function main() {
  if (!SEED_PASSWORD) throw new Error("Set SEED_PASSWORD in apps/api/.env (see .env.example) before seeding.");

  // One statement wipes everything and resets the `position` sequences.
  await prisma.$executeRawUnsafe(`
    TRUNCATE TABLE
      "TaskEvent", "TaskDependency", "DocumentTaskMention", "DocumentComment", "Task", "Document",
      "ProjectArea", "Milestone", "Project", "Cycle", "CalendarEvent", "Activity", "TriageRequest",
      "Invitation", "TaskLabel", "User", "Team"
    RESTART IDENTITY CASCADE`);

  await prisma.team.createMany({ data: TEAMS.map((team) => ({ ...team, taskSeq: taskSeqFor(team.abbreviation) })) });
  const passwordHash = await hashPassword(SEED_PASSWORD);
  await prisma.user.createMany({ data: USERS.map((user) => ({ ...user, passwordHash })) });
  await prisma.taskLabel.createMany({ data: LABELS });

  await prisma.cycle.create({
    data: { id: "pl-c4", teamId: "pl", number: 4, startsAt: on("2026-09-29T00:00:00-06:00"), endsAt: on("2026-10-12T23:59:00-06:00") },
  });

  await prisma.project.create({
    data: {
      id: "pl-game-jam",
      teamId: "pl",
      name: "Game jam de otoño",
      milestones: {
        create: [
          { id: "kickoff", name: "Kickoff", date: on("2026-10-02T00:00:00-06:00") },
          { id: "playtest", name: "Playtest", date: on("2026-10-07T00:00:00-06:00") },
          { id: "delivery", name: "Entrega", date: on("2026-10-10T00:00:00-06:00") },
        ],
      },
      areas: {
        create: [
          { name: "Diseño", progress: 80, tone: "pl" },
          { name: "Arte", progress: 55, tone: "cs" },
          { name: "Programación", progress: 40, tone: "ii" },
          { name: "Audio", progress: 20, tone: "me" },
        ],
      },
    },
  });

  await prisma.document.createMany({ data: DOCUMENTS });
  await prisma.documentComment.createMany({
    data: [{ id: "dc-1", documentId: "cs-onboarding", authorId: "u-nico", body: "¿Agregamos aquí el link al canal de dudas?", at: ago("2026-09-30T08:30:00-06:00") }],
  });

  await prisma.task.createMany({ data: TASKS });
  await prisma.taskDependency.createMany({
    data: [
      { taskId: "PL-47", blockerId: "PL-42" },
      { taskId: "PL-42", blockerId: "CS-21" },
    ],
  });
  await prisma.documentTaskMention.createMany({ data: [{ documentId: "pl-jam-rules", taskId: "PL-42" }] });
  await prisma.taskEvent.createMany({
    data: [
      { id: "te-1", taskId: "PL-42", kind: "status", actorId: "u-moge", status: "in_progress", at: ago("2026-09-30T07:30:00-06:00") },
      { id: "te-2", taskId: "PL-42", kind: "comment", actorId: "u-ana", body: "Cuando quede el salto aviso para empezar PL-47", at: ago("2026-09-30T08:50:00-06:00") },
    ],
  });

  await prisma.calendarEvent.createMany({
    data: [
      { id: "ev-kickoff", teamId: "pl", title: "Kickoff game jam", startsAt: on("2026-10-02T17:00:00-06:00"), endsAt: on("2026-10-02T18:30:00-06:00"), tone: "pl" },
      { id: "ev-playtest", teamId: "pl", title: "Playtest interno", startsAt: on("2026-10-07T16:00:00-06:00"), endsAt: on("2026-10-07T17:00:00-06:00"), tone: "cs" },
      { id: "ev-builds", teamId: "pl", title: "Entrega de builds", startsAt: on("2026-10-10T00:00:00-06:00"), endsAt: null, tone: "ii" },
      { id: "ev-cs-review", teamId: "cs", title: "Revisión de arquitectura", startsAt: on("2026-10-03T12:00:00-06:00"), endsAt: on("2026-10-03T13:00:00-06:00"), tone: "cs" },
    ],
  });

  await prisma.activity.createMany({
    data: [
      { id: "act-1", teamId: "pl", actorId: "u-ana", summary: "comentó en Guía de estilo de arte", at: ago("2026-09-30T09:10:00-06:00") },
      { id: "act-2", teamId: "pl", actorId: "u-fer", summary: "completó 2 tareas", at: ago("2026-09-30T08:30:00-06:00") },
      { id: "act-3", teamId: "pl", actorId: "u-nico", summary: "agregó Playtest interno al calendario", at: ago("2026-09-30T06:30:00-06:00") },
    ],
  });

  await prisma.triageRequest.createMany({
    data: [
      { id: "tr-1", fromTeamId: "me", toTeamId: "pl", title: "Medidas del control para el stand", requesterId: null, createdAt: ago("2026-09-30T08:00:00-06:00") },
      { id: "tr-2", fromTeamId: "me", toTeamId: "pl", title: "Validar sprites del robot", requesterId: null, createdAt: ago("2026-09-30T08:20:00-06:00") },
    ],
  });

  console.log("Seed complete.");
}

main()
  .catch((error) => {
    console.error(error);
    process.exitCode = 1;
  })
  .finally(() => prisma.$disconnect());
