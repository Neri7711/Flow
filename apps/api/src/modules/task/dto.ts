import { IsIn, IsNotEmpty, IsOptional, IsString } from "class-validator";

import type { TaskStatus } from "@/contracts";

const STATUSES = ["backlog", "todo", "in_progress", "in_review", "done"] as const satisfies readonly TaskStatus[];

export class CreateTaskDto {
  @IsString()
  @IsNotEmpty()
  teamId!: string;

  /**
   * Accepted for compatibility with the frontend's `NewTask` shape, but ignored:
   * the identifier prefix always comes from the team itself.
   */
  @IsOptional()
  @IsString()
  abbreviation?: string;

  @IsString()
  @IsNotEmpty()
  title!: string;

  @IsIn(STATUSES)
  status!: TaskStatus;

  @IsOptional()
  @IsString()
  assigneeId?: string | null;

  @IsOptional()
  @IsString()
  cycleId?: string;

  @IsOptional()
  @IsString()
  sourceDocumentId?: string;
}

export class SetStatusDto {
  @IsIn(STATUSES)
  status!: TaskStatus;
}

export class AddCommentDto {
  @IsString()
  @IsNotEmpty()
  body!: string;
}

export class TaskQueryDto {
  @IsOptional()
  @IsString()
  teamId?: string;

  @IsOptional()
  @IsString()
  cycleId?: string;

  @IsOptional()
  @IsIn(STATUSES)
  status?: TaskStatus;
}
