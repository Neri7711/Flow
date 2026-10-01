import type { Project } from "../model/types";

const PROJECTS: readonly Project[] = [
  {
    id: "pl-game-jam",
    teamId: "pl",
    name: "Game jam de otoño",
    milestones: [
      { id: "kickoff", name: "Kickoff", date: "2026-10-02T00:00:00-06:00" },
      { id: "playtest", name: "Playtest", date: "2026-10-07T00:00:00-06:00" },
      { id: "delivery", name: "Entrega", date: "2026-10-10T00:00:00-06:00" },
    ],
    areas: [
      { name: "Diseño", progress: 80, tone: "pl" },
      { name: "Arte", progress: 55, tone: "cs" },
      { name: "Programación", progress: 40, tone: "ii" },
      { name: "Audio", progress: 20, tone: "me" },
    ],
  },
];

// Static data for now. Async on purpose: same signature the backend-backed version will have.

export async function getActiveProject(teamId: string): Promise<Project | undefined> {
  return PROJECTS.find((project) => project.teamId === teamId);
}

export async function getProject(id: string): Promise<Project | undefined> {
  return PROJECTS.find((project) => project.id === id);
}
