import { ArrayMaxSize, IsArray, IsIn, IsNotEmpty, IsOptional, IsString, Matches, MaxLength } from "class-validator";

import type { TaskPriority, TaskStatus } from "@/contracts";

const STATUSES = ["backlog", "todo", "in_progress", "in_review", "done"] as const satisfies readonly TaskStatus[];
const PRIORITIES = ["low", "medium", "high"] as const satisfies readonly TaskPriority[];

/** Every field is optional: omit to keep it, `null` to clear it. */
export class UpdateTaskDto {
  @IsOptional()
  @IsString()
  @IsNotEmpty()
  @MaxLength(200)
  title?: string;

  @IsOptional()
  @IsString()
  description?: string | null;

  @IsOptional()
  @IsString()
  assigneeId?: string | null;

  @IsOptional()
  @IsIn(PRIORITIES)
  priority?: TaskPriority | null;

  @IsOptional()
  @IsString()
  labelId?: string | null;

  /** Calendar day "YYYY-MM-DD". */
  @IsOptional()
  @Matches(/^\d{4}-(0[1-9]|1[0-2])-(0[1-9]|[12]\d|3[01])$/, { message: "dueDate must be YYYY-MM-DD" })
  dueDate?: string | null;

  @IsOptional()
  @IsString()
  cycleId?: string | null;

  /** Replaces the whole list of tasks that block this one. */
  @IsOptional()
  @IsArray()
  @ArrayMaxSize(50)
  @IsString({ each: true })
  blockedByIds?: string[];
}

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
