/**
 * Response contracts — the shapes the web frontend consumes
 * (apps/web/src/entities/*\/model/types.ts). New fields are only ever added, so the
 * web keeps working while it adopts them.
 */

export type TeamId = string;

export type TaskStatus = "backlog" | "todo" | "in_progress" | "in_review" | "done";
export type TaskPriority = "low" | "medium" | "high";
/** Role in a space. Guests (mentors) read and comment. */
export type UserRole = "leader" | "member" | "guest";

export type TeamDto = {
  id: TeamId;
  name: string;
  abbreviation: string;
  mascotAlt: string;
  /** Weekly highlight on the space's home (null: the web shows its default line). */
  weeklyNote: string | null;
};

export type MembershipDto = {
  teamId: TeamId;
  role: UserRole;
  joinedAt: string;
};

export type UserDto = {
  id: string;
  name: string;
  shortName: string;
  initials: string;
  email: string;
  /**
   * Role in the home space — or, in `GET /users?teamId=`, the role in that space.
   * Every space and role is in `memberships`.
   */
  role: UserRole;
  /** Home space (where the user lands after signing in). */
  teamId: TeamId;
  avatarTone: TeamId | null;
  /** Every space the person belongs to, with their role in each. */
  memberships: MembershipDto[];
  area: string | null;
  /** Last authenticated request (null if never). Presence = active in the last few minutes. */
  lastActiveAt: string | null;
  /** Path of the profile photo under the API (`/api/uploads/avatars/...`), or null. */
  avatarUrl: string | null;
  onboardedAt: string | null;
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

export type CycleRollover = "next_cycle" | "backlog";

export type CycleSettingsDto = {
  teamId: TeamId;
  enabled: boolean;
  /** 1 to 3. */
  lengthWeeks: number;
  /** 0 = domingo … 6 = sábado. */
  startDay: number;
  rollover: CycleRollover;
  /** Next cycles as these settings would schedule them (preview). */
  upcoming: { number: number; startsAt: string; endsAt: string }[];
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
  /** Emoji shown before the title (only when set). */
  icon?: string;
  /** Team palette key for the cover (only when set). */
  coverTone?: TeamId;
  /** "BORRADOR" (only when true). */
  isDraft?: true;
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
  /** null for a single all-day event; set for timed and multi-day events. */
  endsAt: string | null;
  /** True for all-day events, including multi-day ones. */
  allDay: boolean;
  tone: TeamId;
  /** People attending (any team). */
  attendeeIds: string[];
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
  /** "work": another team asks for something; "join": a person asks to join the space. */
  kind: "work" | "join";
  fromTeamId: TeamId;
  toTeamId: TeamId;
  title: string;
  requesterId: string | null;
  createdAt: string;
  status: "pending" | "accepted" | "declined";
  /** Task created when the request was accepted. */
  taskId: string | null;
  description?: string;
  /** Desired date "YYYY-MM-DD". */
  dueDate?: string;
  /** Requester's task that will be blocked by the new one once accepted. */
  linkedTaskId?: string;
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
  /** Who sent it ("Invitación de Fer Ruiz · líder de Play"). */
  invitedBy: { name: string; role: UserRole };
};

export type NotificationKind = "mention" | "assignment" | "comment" | "status";

export type NotificationDto = {
  id: string;
  kind: NotificationKind;
  /** Ready-to-show line ("Ana te asignó PL-42"). */
  title: string;
  excerpt?: string;
  actorId: string | null;
  taskId?: string;
  documentId?: string;
  /** Space of the task or page, to build the link. */
  teamId?: TeamId;
  createdAt: string;
  readAt: string | null;
};
