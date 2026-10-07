/**
 * Response contracts — the exact shapes the web frontend expects
 * (apps/web/src/entities/*\/model/types.ts). Services map Prisma rows to these
 * so the frontend's fixture-backed `api` functions can be swapped for HTTP
 * calls with no change to the frontend.
 */

export type TeamId = string;

export type TaskStatus = "backlog" | "todo" | "in_progress" | "in_review" | "done";
export type TaskPriority = "low" | "medium" | "high";
export type UserRole = "leader" | "member";

export type TeamDto = {
  id: TeamId;
  name: string;
  abbreviation: string;
  mascotAlt: string;
  /** Weekly highlight on the space's home (null: the web shows its default line). */
  weeklyNote: string | null;
};

export type UserDto = {
  id: string;
  name: string;
  shortName: string;
  initials: string;
  email: string;
  role: UserRole;
  teamId: TeamId;
  avatarTone: TeamId | null;
};

export type TaskLabelDto = {
  id: string;
  name: string;
  tone: TeamId | null;
};

export type TaskDto = {
  id: string;
  teamId: TeamId;
  title: string;
  description?: string;
  status: TaskStatus;
  priority?: TaskPriority;
  assigneeId: string | null;
  labelId: string | null;
  dueDate?: string;
  cycleId?: string;
  projectId?: string;
  milestoneId?: string;
  blockedByIds: string[];
  sourceDocumentId?: string;
  mentionedInDocumentIds?: string[];
};

export type TaskEventDto =
  | { id: string; taskId: string; kind: "status"; actorId: string; status: TaskStatus; at: string }
  | { id: string; taskId: string; kind: "comment"; actorId: string; body: string; at: string };

export type MilestoneDto = { id: string; name: string; date: string };
export type ProjectAreaDto = { name: string; progress: number; tone: TeamId };
export type ProjectDto = {
  id: string;
  teamId: TeamId;
  name: string;
  milestones: MilestoneDto[];
  areas: ProjectAreaDto[];
};

export type CycleDto = {
  id: string;
  teamId: TeamId;
  number: number;
  startsAt: string;
  endsAt: string;
};

export type DocumentPropertiesDto = {
  status?: string;
  ownerId?: string;
  tags?: string[];
};

export type DocumentDto = {
  id: string;
  teamId: TeamId;
  title: string;
  parentId: string | null;
  updatedAt: string;
  updatedById: string;
  properties?: DocumentPropertiesDto;
};

export type DocumentCommentDto = {
  id: string;
  documentId: string;
  /** null for a thread's first comment. */
  parentId: string | null;
  authorId: string;
  body: string;
  at: string;
};

export type CalendarEventDto = {
  id: string;
  teamId: TeamId;
  title: string;
  startsAt: string;
  endsAt: string | null;
  tone: TeamId;
};

export type ActivityDto = {
  id: string;
  teamId: TeamId;
  actorId: string;
  summary: string;
  at: string;
};

export type TriageRequestDto = {
  id: string;
  fromTeamId: TeamId;
  toTeamId: TeamId;
  title: string;
  requesterId: string | null;
  createdAt: string;
  status: "pending" | "accepted" | "declined";
  /** Task created when the request was accepted. */
  taskId: string | null;
};

export type InvitationDto = {
  id: string;
  email: string;
  name: string;
  role: UserRole;
  teamId: TeamId;
  invitedById: string;
  createdAt: string;
  expiresAt: string;
};

/** What an invitation link reveals before it's accepted. */
export type InvitationPreviewDto = {
  email: string;
  name: string;
  role: UserRole;
  teamId: TeamId;
  teamName: string;
};
