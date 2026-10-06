/**
 * Seeds the database with the same data the frontend currently ships as
 * fixtures (apps/web/src/entities/*\/api/fixtures.ts and inline *-api.ts data),
 * so the backend-backed app renders identically to the mockups.
 *
 * Run: pnpm db:seed   (or `prisma migrate reset` which calls it).
 */
import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

const TODAY = "2026-09-30";

async function wipe() {
  await prisma.taskEvent.deleteMany();
  await prisma.taskDependency.deleteMany();
  await prisma.documentTaskMention.deleteMany();
  await prisma.documentComment.deleteMany();
  await prisma.task.deleteMany();
  await prisma.document.deleteMany();
  await prisma.projectArea.deleteMany();
  await prisma.milestone.deleteMany();
  await prisma.project.deleteMany();
  await prisma.cycle.deleteMany();
  await prisma.calendarEvent.deleteMany();
  await prisma.activity.deleteMany();
  await prisma.triageRequest.deleteMany();
  await prisma.taskLabel.deleteMany();
  await prisma.user.deleteMany();
  await prisma.team.deleteMany();
}

async function seedTeams() {
  await prisma.team.createMany({
    data: [
      { id: "cs", name: "Computer Science", abbreviation: "CS", mascotAlt: "Pantera de Computer Science" },
      { id: "pl", name: "Play", abbreviation: "PL", mascotAlt: "Pantera de Play" },
      { id: "me", name: "Mechanics", abbreviation: "ME", mascotAlt: "Pantera de Mechanics" },
      { id: "ii", name: "IISE", abbreviation: "II", mascotAlt: "Pantera de IISE" },
    ],
  });
}

async function seedUsers() {
  await prisma.user.createMany({
    data: [
      { id: "u-moge", name: "Moge", shortName: "Moge", initials: "EM", role: "leader", teamId: "pl", avatarTone: null },
      { id: "u-ana", name: "Ana López", shortName: "Ana", initials: "AL", role: "member", teamId: "pl", avatarTone: "cs" },
      { id: "u-fer", name: "Fer Ruiz", shortName: "Fer", initials: "FR", role: "leader", teamId: "pl", avatarTone: "pl" },
      { id: "u-nico", name: "Nico Herrera", shortName: "Nico", initials: "NH", role: "member", teamId: "pl", avatarTone: "ii" },
    ],
  });
}

async function seedLabels() {
  await prisma.taskLabel.createMany({
    data: [
      { id: "design", name: "Diseño", tone: "pl" },
      { id: "art", name: "Arte", tone: "cs" },
      { id: "code", name: "Código", tone: "ii" },
      { id: "audio", name: "Audio", tone: "me" },
      { id: "logistics", name: "Logística", tone: null },
    ],
  });
}

async function seedCycles() {
  await prisma.cycle.createMany({
    data: [{ id: "pl-c4", teamId: "pl", number: 4, startsAt: "2026-09-29T00:00:00-06:00", endsAt: "2026-10-12T23:59:00-06:00" }],
  });
}

async function seedProjects() {
  await prisma.project.create({ data: { id: "pl-game-jam", teamId: "pl", name: "Game jam de otoño" } });
  await prisma.milestone.createMany({
    data: [
      { id: "kickoff", projectId: "pl-game-jam", name: "Kickoff", date: "2026-10-02T00:00:00-06:00", position: 0 },
      { id: "playtest", projectId: "pl-game-jam", name: "Playtest", date: "2026-10-07T00:00:00-06:00", position: 1 },
      { id: "delivery", projectId: "pl-game-jam", name: "Entrega", date: "2026-10-10T00:00:00-06:00", position: 2 },
    ],
  });
  await prisma.projectArea.createMany({
    data: [
      { projectId: "pl-game-jam", name: "Diseño", progress: 80, tone: "pl", position: 0 },
      { projectId: "pl-game-jam", name: "Arte", progress: 55, tone: "cs", position: 1 },
      { projectId: "pl-game-jam", name: "Programación", progress: 40, tone: "ii", position: 2 },
      { projectId: "pl-game-jam", name: "Audio", progress: 20, tone: "me", position: 3 },
    ],
  });
}

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

type SeedDoc = {
  id: string;
  teamId: string;
  title: string;
  parentId: string | null;
  updatedAt: string;
  updatedById: string;
  content?: string;
  propStatus?: string;
  propOwnerId?: string;
  propTags?: string[];
};

// Ordered parent-first so self-referencing parentId FKs are satisfied on insert.
const DOCUMENTS: SeedDoc[] = [
  { id: "pl-roadmap", teamId: "pl", title: "Roadmap del semestre", parentId: null, updatedAt: "2026-09-25T12:00:00-06:00", updatedById: "u-moge" },
  { id: "pl-game-jam", teamId: "pl", title: "Game jam de otoño", parentId: null, updatedAt: "2026-09-26T18:00:00-06:00", updatedById: "u-moge" },
  { id: "pl-ideas", teamId: "pl", title: "Ideas y pitches", parentId: "pl-game-jam", updatedAt: "2026-09-30T07:30:00-06:00", updatedById: "u-fer" },
  { id: "pl-roles", teamId: "pl", title: "Equipos y roles", parentId: "pl-game-jam", updatedAt: "2026-09-26T10:00:00-06:00", updatedById: "u-moge" },
  { id: "pl-deliverables", teamId: "pl", title: "Entregables", parentId: "pl-game-jam", updatedAt: "2026-09-24T10:00:00-06:00", updatedById: "u-nico" },
  { id: "pl-jam-rules", teamId: "pl", title: "Reglas de la game jam", parentId: "pl-deliverables", updatedAt: "2026-09-29T20:00:00-06:00", updatedById: "u-moge" },
  { id: "pl-minutes", teamId: "pl", title: "Minutas semanales", parentId: null, updatedAt: "2026-09-22T19:00:00-06:00", updatedById: "u-nico" },
  { id: "pl-minute-0929", teamId: "pl", title: "Minuta · 29 sep", parentId: "pl-minutes", updatedAt: "2026-09-29T19:00:00-06:00", updatedById: "u-nico" },
  { id: "pl-wiki", teamId: "pl", title: "Wiki del equipo", parentId: null, updatedAt: "2026-09-20T10:00:00-06:00", updatedById: "u-ana" },
  { id: "pl-art-guide", teamId: "pl", title: "Guía de estilo de arte", parentId: "pl-wiki", updatedAt: "2026-09-27T11:00:00-06:00", updatedById: "u-ana" },
  { id: "cs-sprints", teamId: "cs", title: "Sprints", parentId: null, updatedAt: "2026-09-28T10:00:00-06:00", updatedById: "u-ana" },
  { id: "cs-wiki", teamId: "cs", title: "Wiki del equipo", parentId: null, updatedAt: "2026-09-22T10:00:00-06:00", updatedById: "u-ana" },
  {
    id: "cs-onboarding",
    teamId: "cs",
    title: "Onboarding para nuevos integrantes",
    parentId: "cs-wiki",
    updatedAt: "2026-09-30T09:25:00-06:00",
    updatedById: "u-ana",
    content: CS_ONBOARDING_CONTENT,
    propStatus: "En revisión",
    propOwnerId: "u-ana",
    propTags: ["guía", "primer semestre"],
  },
  { id: "cs-backend", teamId: "cs", title: "Arquitectura del backend", parentId: "cs-wiki", updatedAt: "2026-09-21T10:00:00-06:00", updatedById: "u-ana" },
  { id: "cs-sprite-import", teamId: "cs", title: "Importar sprites al motor", parentId: "cs-wiki", updatedAt: "2026-09-23T10:00:00-06:00", updatedById: "u-ana" },
  { id: "cs-conventions", teamId: "cs", title: "Convenciones de código", parentId: "cs-wiki", updatedAt: "2026-09-19T10:00:00-06:00", updatedById: "u-ana" },
  { id: "cs-minutes", teamId: "cs", title: "Minutas", parentId: null, updatedAt: "2026-09-29T10:00:00-06:00", updatedById: "u-nico" },
  { id: "cs-resources", teamId: "cs", title: "Recursos", parentId: null, updatedAt: "2026-09-10T10:00:00-06:00", updatedById: "u-ana" },
  { id: "me-wiki", teamId: "me", title: "Wiki del equipo", parentId: null, updatedAt: "2026-09-18T10:00:00-06:00", updatedById: "u-nico" },
  { id: "me-minutes", teamId: "me", title: "Minutas", parentId: null, updatedAt: "2026-09-26T10:00:00-06:00", updatedById: "u-nico" },
  { id: "ii-wiki", teamId: "ii", title: "Wiki del equipo", parentId: null, updatedAt: "2026-09-18T10:00:00-06:00", updatedById: "u-fer" },
  { id: "ii-minutes", teamId: "ii", title: "Minutas", parentId: null, updatedAt: "2026-09-26T10:00:00-06:00", updatedById: "u-fer" },
];

async function seedDocuments() {
  for (const doc of DOCUMENTS) {
    await prisma.document.create({
      data: {
        id: doc.id,
        teamId: doc.teamId,
        title: doc.title,
        parentId: doc.parentId,
        updatedAt: doc.updatedAt,
        updatedById: doc.updatedById,
        content: doc.content ?? "<p></p>",
        propStatus: doc.propStatus ?? null,
        propOwnerId: doc.propOwnerId ?? null,
        propTags: doc.propTags ?? [],
      },
    });
  }

  await prisma.documentComment.createMany({
    data: [{ id: "dc-1", documentId: "cs-onboarding", authorId: "u-nico", body: "¿Agregamos aquí el link al canal de dudas?", at: "2026-09-30T08:30:00-06:00" }],
  });
}

type SeedTask = {
  id: string;
  teamId: string;
  title: string;
  status: "backlog" | "todo" | "in_progress" | "in_review" | "done";
  priority?: "low" | "medium" | "high";
  assigneeId?: string | null;
  labelId?: string | null;
  description?: string;
  dueDate?: string;
  cycleId?: string;
  projectId?: string;
  milestoneId?: string;
  sourceDocumentId?: string;
};

const TASKS: SeedTask[] = [
  { id: "PL-54", teamId: "pl", title: "Definir mecánica principal", status: "todo", assigneeId: "u-fer", labelId: "design", dueDate: TODAY, cycleId: "pl-c4" },
  { id: "PL-55", teamId: "pl", title: "Sprites del personaje", status: "todo", assigneeId: "u-ana", labelId: "art", dueDate: TODAY, cycleId: "pl-c4" },
  { id: "PL-56", teamId: "pl", title: "Prototipo de movimiento", status: "in_progress", assigneeId: "u-moge", labelId: "code", dueDate: TODAY, cycleId: "pl-c4" },
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
  { id: "CS-21", teamId: "cs", title: "Controlador de input", status: "in_review", assigneeId: "u-ana", labelId: "code" },
  { id: "CS-17", teamId: "cs", title: "Configurar entorno de desarrollo", status: "in_progress", assigneeId: "u-ana", labelId: "code" },
];

async function seedTasks() {
  await prisma.task.createMany({
    data: TASKS.map((t) => ({
      id: t.id,
      teamId: t.teamId,
      title: t.title,
      description: t.description ?? null,
      status: t.status,
      priority: t.priority ?? null,
      assigneeId: t.assigneeId ?? null,
      labelId: t.labelId ?? null,
      dueDate: t.dueDate ?? null,
      cycleId: t.cycleId ?? null,
      projectId: t.projectId ?? null,
      milestoneId: t.milestoneId ?? null,
      sourceDocumentId: t.sourceDocumentId ?? null,
    })),
  });

  // blockedByIds: PL-47 <- PL-42, PL-42 <- CS-21
  await prisma.taskDependency.createMany({
    data: [
      { taskId: "PL-47", blockerId: "PL-42" },
      { taskId: "PL-42", blockerId: "CS-21" },
    ],
  });

  // mentionedInDocumentIds: PL-42 mentioned in pl-jam-rules
  await prisma.documentTaskMention.createMany({
    data: [{ documentId: "pl-jam-rules", taskId: "PL-42" }],
  });

  await prisma.taskEvent.createMany({
    data: [
      { id: "te-1", taskId: "PL-42", kind: "status", actorId: "u-moge", status: "in_progress", body: null, at: "2026-09-30T07:30:00-06:00" },
      { id: "te-2", taskId: "PL-42", kind: "comment", actorId: "u-ana", status: null, body: "Cuando quede el salto aviso para empezar PL-47", at: "2026-09-30T08:50:00-06:00" },
    ],
  });
}

async function seedEvents() {
  await prisma.calendarEvent.createMany({
    data: [
      { id: "ev-kickoff", teamId: "pl", title: "Kickoff game jam", startsAt: "2026-10-02T17:00:00-06:00", endsAt: "2026-10-02T18:30:00-06:00", tone: "pl" },
      { id: "ev-playtest", teamId: "pl", title: "Playtest interno", startsAt: "2026-10-07T16:00:00-06:00", endsAt: "2026-10-07T17:00:00-06:00", tone: "cs" },
      { id: "ev-builds", teamId: "pl", title: "Entrega de builds", startsAt: "2026-10-10T00:00:00-06:00", endsAt: null, tone: "ii" },
      { id: "ev-cs-review", teamId: "cs", title: "Revisión de arquitectura", startsAt: "2026-10-03T12:00:00-06:00", endsAt: "2026-10-03T13:00:00-06:00", tone: "cs" },
    ],
  });
}

async function seedActivity() {
  await prisma.activity.createMany({
    data: [
      { id: "act-1", teamId: "pl", actorId: "u-ana", summary: "comentó en Guía de estilo de arte", at: "2026-09-30T09:10:00-06:00" },
      { id: "act-2", teamId: "pl", actorId: "u-fer", summary: "completó 2 tareas", at: "2026-09-30T08:30:00-06:00" },
      { id: "act-3", teamId: "pl", actorId: "u-nico", summary: "agregó Playtest interno al calendario", at: "2026-09-30T06:30:00-06:00" },
    ],
  });
}

async function seedTriage() {
  await prisma.triageRequest.createMany({
    data: [
      { id: "tr-1", fromTeamId: "me", toTeamId: "pl", title: "Medidas del control para el stand", requesterId: null, createdAt: "2026-09-30T08:00:00-06:00" },
      { id: "tr-2", fromTeamId: "me", toTeamId: "pl", title: "Validar sprites del robot", requesterId: null, createdAt: "2026-09-30T08:20:00-06:00" },
    ],
  });
}

async function main() {
  await wipe();
  await seedTeams();
  await seedUsers();
  await seedLabels();
  await seedCycles();
  await seedProjects();
  await seedDocuments();
  await seedTasks();
  await seedEvents();
  await seedActivity();
  await seedTriage();
  // eslint-disable-next-line no-console
  console.log("Seed complete.");
}

main()
  .catch((error) => {
    // eslint-disable-next-line no-console
    console.error(error);
    process.exit(1);
  })
  .finally(() => {
    void prisma.$disconnect();
  });
