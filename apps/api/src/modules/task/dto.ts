import { IsIn, IsOptional, IsString, MinLength } from "class-validator";

const STATUSES = ["backlog", "todo", "in_progress", "in_review", "done"] as const;
type Status = (typeof STATUSES)[number];

export class CreateTaskDto {
  @IsString()
  teamId!: string;

  /** Team abbreviation used to build the identifier (PL -> PL-57). */
  @IsString()
  abbreviation!: string;

  @IsString()
  @MinLength(1)
  title!: string;

  @IsIn(STATUSES)
  status!: Status;

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
  status!: Status;

  /** Pass to record the change in the task's activity. */
  @IsOptional()
  @IsString()
  actorId?: string;
}

export class ToggleDoneDto {
  @IsOptional()
  @IsString()
  actorId?: string;
}

export class AddCommentDto {
  @IsString()
  actorId!: string;

  @IsString()
  @MinLength(1)
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
  status?: Status;
}
