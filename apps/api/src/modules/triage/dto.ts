import { IsIn, IsNotEmpty, IsOptional, IsString } from "class-validator";

import type { TaskStatus } from "@/contracts";

const STATUSES = ["backlog", "todo", "in_progress", "in_review", "done"] as const satisfies readonly TaskStatus[];

export class CreateTriageDto {
  /** Team that should take the work (not your own: for that, create the task). */
  @IsString()
  @IsNotEmpty()
  toTeamId!: string;

  @IsString()
  @IsNotEmpty()
  title!: string;
}

export class AcceptTriageDto {
  /** Column the new task lands in (defaults to "Por hacer"). */
  @IsOptional()
  @IsIn(STATUSES)
  status?: TaskStatus;
}
