import { IsIn, IsNotEmpty, IsOptional, IsString, Matches, MaxLength } from "class-validator";

import type { TaskStatus, UserRole } from "@/contracts";

const STATUSES = ["backlog", "todo", "in_progress", "in_review", "done"] as const satisfies readonly TaskStatus[];

export class CreateTriageDto {
  /** "work" (default): ask another team for something. "join": ask to join that space. */
  @IsOptional()
  @IsIn(["work", "join"])
  kind?: "work" | "join";

  /** Team that should take the work, or the space to join (not your own for work: create the task). */
  @IsString()
  @IsNotEmpty()
  toTeamId!: string;

  /** Required for work requests; optional note for join requests. */
  @IsOptional()
  @IsString()
  @IsNotEmpty()
  @MaxLength(200)
  title?: string;

  @IsOptional()
  @IsString()
  @MaxLength(5000)
  description?: string;

  /** Desired date, calendar day "YYYY-MM-DD". */
  @IsOptional()
  @Matches(/^\d{4}-(0[1-9]|1[0-2])-(0[1-9]|[12]\d|3[01])$/, { message: "dueDate must be YYYY-MM-DD" })
  dueDate?: string;

  /** A task of yours that waits on this: once accepted, it's blocked by the new task. */
  @IsOptional()
  @IsString()
  linkedTaskId?: string;
}

export class AcceptTriageDto {
  /** Work requests: column the new task lands in (default "Por hacer"; "backlog" to park it). */
  @IsOptional()
  @IsIn(STATUSES)
  status?: TaskStatus;

  /** Work requests: who takes the new task (assigned in the same step). */
  @IsOptional()
  @IsString()
  assigneeId?: string;

  /** Join requests: role in the space (default "member"). */
  @IsOptional()
  @IsIn(["member", "guest", "leader"])
  role?: UserRole;
}
