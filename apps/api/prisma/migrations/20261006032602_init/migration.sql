-- CreateEnum
CREATE TYPE "TaskStatus" AS ENUM ('backlog', 'todo', 'in_progress', 'in_review', 'done');

-- CreateEnum
CREATE TYPE "TaskPriority" AS ENUM ('low', 'medium', 'high');

-- CreateEnum
CREATE TYPE "UserRole" AS ENUM ('leader', 'member');

-- CreateEnum
CREATE TYPE "TaskEventKind" AS ENUM ('status', 'comment');

-- CreateTable
CREATE TABLE "Team" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "abbreviation" TEXT NOT NULL,
    "mascotAlt" TEXT NOT NULL,
    "position" SERIAL NOT NULL,
    "taskSeq" INTEGER NOT NULL DEFAULT 0,

    CONSTRAINT "Team_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "User" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "shortName" TEXT NOT NULL,
    "initials" TEXT NOT NULL,
    "role" "UserRole" NOT NULL,
    "teamId" TEXT NOT NULL,
    "avatarTone" TEXT,
    "position" SERIAL NOT NULL,

    CONSTRAINT "User_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "TaskLabel" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "tone" TEXT,
    "position" SERIAL NOT NULL,

    CONSTRAINT "TaskLabel_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Task" (
    "id" TEXT NOT NULL,
    "teamId" TEXT NOT NULL,
    "title" TEXT NOT NULL,
    "description" TEXT,
    "status" "TaskStatus" NOT NULL,
    "priority" "TaskPriority",
    "assigneeId" TEXT,
    "labelId" TEXT,
    "dueDate" TEXT,
    "cycleId" TEXT,
    "projectId" TEXT,
    "milestoneId" TEXT,
    "sourceDocumentId" TEXT,
    "position" SERIAL NOT NULL,

    CONSTRAINT "Task_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "TaskDependency" (
    "taskId" TEXT NOT NULL,
    "blockerId" TEXT NOT NULL,

    CONSTRAINT "TaskDependency_pkey" PRIMARY KEY ("taskId","blockerId")
);

-- CreateTable
CREATE TABLE "TaskEvent" (
    "id" TEXT NOT NULL,
    "taskId" TEXT NOT NULL,
    "kind" "TaskEventKind" NOT NULL,
    "actorId" TEXT NOT NULL,
    "status" "TaskStatus",
    "body" TEXT,
    "at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "TaskEvent_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Cycle" (
    "id" TEXT NOT NULL,
    "teamId" TEXT NOT NULL,
    "number" INTEGER NOT NULL,
    "startsAt" TIMESTAMP(3) NOT NULL,
    "endsAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Cycle_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Project" (
    "id" TEXT NOT NULL,
    "teamId" TEXT NOT NULL,
    "name" TEXT NOT NULL,

    CONSTRAINT "Project_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Milestone" (
    "id" TEXT NOT NULL,
    "projectId" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "date" TIMESTAMP(3) NOT NULL,
    "position" SERIAL NOT NULL,

    CONSTRAINT "Milestone_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "ProjectArea" (
    "id" TEXT NOT NULL,
    "projectId" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "progress" INTEGER NOT NULL,
    "tone" TEXT NOT NULL,
    "position" SERIAL NOT NULL,

    CONSTRAINT "ProjectArea_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Document" (
    "id" TEXT NOT NULL,
    "teamId" TEXT NOT NULL,
    "title" TEXT NOT NULL,
    "parentId" TEXT,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    "updatedById" TEXT NOT NULL,
    "content" TEXT NOT NULL DEFAULT '<p></p>',
    "position" SERIAL NOT NULL,
    "propStatus" TEXT,
    "propOwnerId" TEXT,
    "propTags" TEXT[] DEFAULT ARRAY[]::TEXT[],

    CONSTRAINT "Document_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "DocumentTaskMention" (
    "documentId" TEXT NOT NULL,
    "taskId" TEXT NOT NULL,

    CONSTRAINT "DocumentTaskMention_pkey" PRIMARY KEY ("documentId","taskId")
);

-- CreateTable
CREATE TABLE "DocumentComment" (
    "id" TEXT NOT NULL,
    "documentId" TEXT NOT NULL,
    "authorId" TEXT NOT NULL,
    "body" TEXT NOT NULL,
    "at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "DocumentComment_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "CalendarEvent" (
    "id" TEXT NOT NULL,
    "teamId" TEXT NOT NULL,
    "title" TEXT NOT NULL,
    "startsAt" TIMESTAMP(3) NOT NULL,
    "endsAt" TIMESTAMP(3),
    "tone" TEXT NOT NULL,

    CONSTRAINT "CalendarEvent_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Activity" (
    "id" TEXT NOT NULL,
    "teamId" TEXT NOT NULL,
    "actorId" TEXT NOT NULL,
    "summary" TEXT NOT NULL,
    "at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Activity_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "TriageRequest" (
    "id" TEXT NOT NULL,
    "fromTeamId" TEXT NOT NULL,
    "toTeamId" TEXT NOT NULL,
    "title" TEXT NOT NULL,
    "requesterId" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "TriageRequest_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "User_teamId_idx" ON "User"("teamId");

-- CreateIndex
CREATE INDEX "Task_teamId_position_idx" ON "Task"("teamId", "position");

-- CreateIndex
CREATE INDEX "Task_cycleId_idx" ON "Task"("cycleId");

-- CreateIndex
CREATE INDEX "TaskDependency_blockerId_idx" ON "TaskDependency"("blockerId");

-- CreateIndex
CREATE INDEX "TaskEvent_taskId_at_idx" ON "TaskEvent"("taskId", "at");

-- CreateIndex
CREATE INDEX "Cycle_teamId_number_idx" ON "Cycle"("teamId", "number");

-- CreateIndex
CREATE INDEX "Project_teamId_idx" ON "Project"("teamId");

-- CreateIndex
CREATE INDEX "Milestone_projectId_idx" ON "Milestone"("projectId");

-- CreateIndex
CREATE INDEX "ProjectArea_projectId_idx" ON "ProjectArea"("projectId");

-- CreateIndex
CREATE INDEX "Document_teamId_position_idx" ON "Document"("teamId", "position");

-- CreateIndex
CREATE INDEX "Document_teamId_updatedAt_idx" ON "Document"("teamId", "updatedAt");

-- CreateIndex
CREATE INDEX "Document_parentId_idx" ON "Document"("parentId");

-- CreateIndex
CREATE INDEX "DocumentTaskMention_taskId_idx" ON "DocumentTaskMention"("taskId");

-- CreateIndex
CREATE INDEX "DocumentComment_documentId_at_idx" ON "DocumentComment"("documentId", "at");

-- CreateIndex
CREATE INDEX "CalendarEvent_teamId_startsAt_idx" ON "CalendarEvent"("teamId", "startsAt");

-- CreateIndex
CREATE INDEX "Activity_teamId_at_idx" ON "Activity"("teamId", "at");

-- CreateIndex
CREATE INDEX "TriageRequest_toTeamId_createdAt_idx" ON "TriageRequest"("toTeamId", "createdAt");

-- AddForeignKey
ALTER TABLE "User" ADD CONSTRAINT "User_teamId_fkey" FOREIGN KEY ("teamId") REFERENCES "Team"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Task" ADD CONSTRAINT "Task_teamId_fkey" FOREIGN KEY ("teamId") REFERENCES "Team"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Task" ADD CONSTRAINT "Task_assigneeId_fkey" FOREIGN KEY ("assigneeId") REFERENCES "User"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Task" ADD CONSTRAINT "Task_labelId_fkey" FOREIGN KEY ("labelId") REFERENCES "TaskLabel"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Task" ADD CONSTRAINT "Task_cycleId_fkey" FOREIGN KEY ("cycleId") REFERENCES "Cycle"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Task" ADD CONSTRAINT "Task_projectId_fkey" FOREIGN KEY ("projectId") REFERENCES "Project"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Task" ADD CONSTRAINT "Task_sourceDocumentId_fkey" FOREIGN KEY ("sourceDocumentId") REFERENCES "Document"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "TaskDependency" ADD CONSTRAINT "TaskDependency_taskId_fkey" FOREIGN KEY ("taskId") REFERENCES "Task"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "TaskDependency" ADD CONSTRAINT "TaskDependency_blockerId_fkey" FOREIGN KEY ("blockerId") REFERENCES "Task"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "TaskEvent" ADD CONSTRAINT "TaskEvent_taskId_fkey" FOREIGN KEY ("taskId") REFERENCES "Task"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "TaskEvent" ADD CONSTRAINT "TaskEvent_actorId_fkey" FOREIGN KEY ("actorId") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Cycle" ADD CONSTRAINT "Cycle_teamId_fkey" FOREIGN KEY ("teamId") REFERENCES "Team"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Project" ADD CONSTRAINT "Project_teamId_fkey" FOREIGN KEY ("teamId") REFERENCES "Team"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Milestone" ADD CONSTRAINT "Milestone_projectId_fkey" FOREIGN KEY ("projectId") REFERENCES "Project"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ProjectArea" ADD CONSTRAINT "ProjectArea_projectId_fkey" FOREIGN KEY ("projectId") REFERENCES "Project"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Document" ADD CONSTRAINT "Document_teamId_fkey" FOREIGN KEY ("teamId") REFERENCES "Team"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Document" ADD CONSTRAINT "Document_updatedById_fkey" FOREIGN KEY ("updatedById") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Document" ADD CONSTRAINT "Document_parentId_fkey" FOREIGN KEY ("parentId") REFERENCES "Document"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "DocumentTaskMention" ADD CONSTRAINT "DocumentTaskMention_documentId_fkey" FOREIGN KEY ("documentId") REFERENCES "Document"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "DocumentTaskMention" ADD CONSTRAINT "DocumentTaskMention_taskId_fkey" FOREIGN KEY ("taskId") REFERENCES "Task"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "DocumentComment" ADD CONSTRAINT "DocumentComment_documentId_fkey" FOREIGN KEY ("documentId") REFERENCES "Document"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "DocumentComment" ADD CONSTRAINT "DocumentComment_authorId_fkey" FOREIGN KEY ("authorId") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "CalendarEvent" ADD CONSTRAINT "CalendarEvent_teamId_fkey" FOREIGN KEY ("teamId") REFERENCES "Team"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Activity" ADD CONSTRAINT "Activity_teamId_fkey" FOREIGN KEY ("teamId") REFERENCES "Team"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Activity" ADD CONSTRAINT "Activity_actorId_fkey" FOREIGN KEY ("actorId") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "TriageRequest" ADD CONSTRAINT "TriageRequest_fromTeamId_fkey" FOREIGN KEY ("fromTeamId") REFERENCES "Team"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "TriageRequest" ADD CONSTRAINT "TriageRequest_toTeamId_fkey" FOREIGN KEY ("toTeamId") REFERENCES "Team"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "TriageRequest" ADD CONSTRAINT "TriageRequest_requesterId_fkey" FOREIGN KEY ("requesterId") REFERENCES "User"("id") ON DELETE SET NULL ON UPDATE CASCADE;
