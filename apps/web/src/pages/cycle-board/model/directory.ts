import type { Cycle } from "@/entities/cycle";
import type { Document } from "@/entities/document";
import type { Project } from "@/entities/project";
import type { TaskLabel } from "@/entities/task";
import type { Team } from "@/entities/team";
import type { User } from "@/entities/user";

/** Reference data the board needs to render tasks (resolved once on the server). */
export type BoardDirectory = {
  team: Team;
  teams: readonly Team[];
  users: readonly User[];
  currentUser: User;
  labels: readonly TaskLabel[];
  documents: readonly Document[];
  cycle?: Cycle;
  project?: Project;
};

export const findById = <T extends { id: string }>(items: readonly T[], id: string | null | undefined) =>
  id ? items.find((item) => item.id === id) : undefined;
