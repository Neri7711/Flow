import type { Task, TaskEvent, TaskLabel } from "../model/types";

export const TASK_LABELS: readonly TaskLabel[] = [
  { id: "design", name: "Diseño", tone: "pl" },
  { id: "art", name: "Arte", tone: "cs" },
  { id: "code", name: "Código", tone: "ii" },
  { id: "audio", name: "Audio", tone: "me" },
  { id: "logistics", name: "Logística", tone: null },
];

const TODAY = "2026-09-30";

export const TASKS: readonly Task[] = [
  // Play — due today (space home)
  { id: "PL-54", teamId: "pl", title: "Definir mecánica principal", status: "todo", assigneeId: "u-fer", labelId: "design", dueDate: TODAY, cycleId: "pl-c4", blockedByIds: [] },
  { id: "PL-55", teamId: "pl", title: "Sprites del personaje", status: "todo", assigneeId: "u-ana", labelId: "art", dueDate: TODAY, cycleId: "pl-c4", blockedByIds: [] },
  { id: "PL-56", teamId: "pl", title: "Prototipo de movimiento", status: "in_progress", assigneeId: "u-moge", labelId: "code", dueDate: TODAY, cycleId: "pl-c4", blockedByIds: [] },

  // Play — cycle 4 board
  { id: "PL-51", teamId: "pl", title: "Explorar música estilo chiptune", status: "backlog", assigneeId: "u-nico", labelId: "audio", cycleId: "pl-c4", blockedByIds: [] },
  { id: "PL-49", teamId: "pl", title: "Menú de pausa", status: "backlog", assigneeId: "u-moge", labelId: "code", cycleId: "pl-c4", blockedByIds: [] },
  { id: "PL-53", teamId: "pl", title: "Paleta de color del nivel 2", status: "backlog", assigneeId: "u-ana", labelId: "art", cycleId: "pl-c4", blockedByIds: [] },
  { id: "PL-52", teamId: "pl", title: "Sprites de la interfaz", status: "backlog", assigneeId: "u-fer", labelId: "art", blockedByIds: [] },
  { id: "PL-43", teamId: "pl", title: "Sprites del enemigo", status: "todo", assigneeId: "u-ana", labelId: "art", cycleId: "pl-c4", blockedByIds: [], sourceDocumentId: "pl-minute-0929" },
  { id: "PL-46", teamId: "pl", title: "Pantalla de game over", status: "todo", assigneeId: "u-fer", labelId: "design", cycleId: "pl-c4", blockedByIds: [] },
  { id: "PL-47", teamId: "pl", title: "Animaciones de salto", status: "todo", assigneeId: "u-ana", labelId: "art", cycleId: "pl-c4", blockedByIds: ["PL-42"] },
  {
    id: "PL-42",
    teamId: "pl",
    title: "Movimiento del jugador",
    description:
      "Caminar, correr y saltar con aceleración suave. Necesita el sistema de input de CS para soportar control y teclado.",
    status: "in_progress",
    priority: "high",
    assigneeId: "u-moge",
    labelId: "code",
    cycleId: "pl-c4",
    projectId: "pl-game-jam",
    milestoneId: "playtest",
    blockedByIds: ["CS-21"],
    sourceDocumentId: "pl-minute-0929",
    mentionedInDocumentIds: ["pl-jam-rules"],
  },
  { id: "PL-44", teamId: "pl", title: "Tileset del nivel 1", status: "in_progress", assigneeId: "u-ana", labelId: "art", cycleId: "pl-c4", blockedByIds: [] },
  { id: "PL-40", teamId: "pl", title: "Documento de reglas de la jam", status: "in_review", assigneeId: "u-fer", labelId: "design", cycleId: "pl-c4", blockedByIds: [] },
  { id: "PL-38", teamId: "pl", title: "Reservar sala para kickoff", status: "done", assigneeId: "u-nico", labelId: "logistics", dueDate: TODAY, cycleId: "pl-c4", blockedByIds: [] },
  { id: "PL-36", teamId: "pl", title: "Lluvia de ideas de temática", status: "done", assigneeId: "u-fer", labelId: "design", cycleId: "pl-c4", blockedByIds: [] },

  // Computer Science — cross-team dependency
  { id: "CS-21", teamId: "cs", title: "Controlador de input", status: "in_review", assigneeId: "u-ana", labelId: "code", blockedByIds: [] },
  { id: "CS-17", teamId: "cs", title: "Configurar entorno de desarrollo", status: "in_progress", assigneeId: "u-ana", labelId: "code", blockedByIds: [] },
];

export const TASK_EVENTS: readonly TaskEvent[] = [
  { id: "te-1", taskId: "PL-42", kind: "status", actorId: "u-moge", status: "in_progress", at: "2026-09-30T07:30:00-06:00" },
  { id: "te-2", taskId: "PL-42", kind: "comment", actorId: "u-ana", body: "Cuando quede el salto aviso para empezar PL-47", at: "2026-09-30T08:50:00-06:00" },
];
