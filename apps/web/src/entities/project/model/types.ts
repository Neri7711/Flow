import type { TeamId } from "@/entities/team/@x/project";

export type Milestone = {
  id: string;
  name: string;
  date: string;
};

/** Progress per work area of the project, 0–100. */
export type ProjectArea = {
  name: string;
  progress: number;
  tone: TeamId;
};

export type Project = {
  id: string;
  teamId: TeamId;
  name: string;
  milestones: Milestone[];
  areas: ProjectArea[];
};
