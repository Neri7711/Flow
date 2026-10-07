-- Memberships (several spaces per person), notifications, event attendees and all-day flag,
-- richer triage requests (join requests, details, linked task), page icon/cover/draft,
-- profile fields and per-space cycle settings.

-- CreateEnum
CREATE TYPE "TriageKind" AS ENUM ('work', 'join');

-- CreateEnum
CREATE TYPE "NotificationKind" AS ENUM ('mention', 'assignment', 'comment', 'status');

-- CreateEnum
CREATE TYPE "CycleRollover" AS ENUM ('next_cycle', 'backlog');

-- AlterEnum
ALTER TYPE "UserRole" ADD VALUE 'guest';

-- AlterTable
ALTER TABLE "CalendarEvent" ADD COLUMN     "allDay" BOOLEAN NOT NULL DEFAULT false;

-- AlterTable
ALTER TABLE "Document" ADD COLUMN     "coverTone" TEXT,
ADD COLUMN     "icon" TEXT,
ADD COLUMN     "isDraft" BOOLEAN NOT NULL DEFAULT false;

-- AlterTable
ALTER TABLE "TriageRequest" ADD COLUMN     "description" TEXT,
ADD COLUMN     "dueDate" TEXT,
ADD COLUMN     "kind" "TriageKind" NOT NULL DEFAULT 'work',
ADD COLUMN     "linkedTaskId" TEXT;

-- AlterTable
ALTER TABLE "User" ADD COLUMN     "area" TEXT,
ADD COLUMN     "avatarPath" TEXT,
ADD COLUMN     "lastActiveAt" TIMESTAMP(3),
ADD COLUMN     "onboardedAt" TIMESTAMP(3);

-- CreateTable
CREATE TABLE "EventAttendee" (
    "eventId" TEXT NOT NULL,
    "userId" TEXT NOT NULL,

    CONSTRAINT "EventAttendee_pkey" PRIMARY KEY ("eventId","userId")
);

-- CreateTable
CREATE TABLE "Membership" (
    "userId" TEXT NOT NULL,
    "teamId" TEXT NOT NULL,
    "role" "UserRole" NOT NULL,
    "joinedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "position" SERIAL NOT NULL,

    CONSTRAINT "Membership_pkey" PRIMARY KEY ("userId","teamId")
);

-- CreateTable
CREATE TABLE "Notification" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "actorId" TEXT,
    "kind" "NotificationKind" NOT NULL,
    "title" TEXT NOT NULL,
    "excerpt" TEXT,
    "taskId" TEXT,
    "documentId" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL,
    "readAt" TIMESTAMP(3),
    "position" SERIAL NOT NULL,

    CONSTRAINT "Notification_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "CycleSettings" (
    "teamId" TEXT NOT NULL,
    "enabled" BOOLEAN NOT NULL DEFAULT true,
    "lengthWeeks" INTEGER NOT NULL DEFAULT 2,
    "startDay" INTEGER NOT NULL DEFAULT 1,
    "rollover" "CycleRollover" NOT NULL DEFAULT 'next_cycle',

    CONSTRAINT "CycleSettings_pkey" PRIMARY KEY ("teamId")
);

-- CreateIndex
CREATE INDEX "EventAttendee_userId_idx" ON "EventAttendee"("userId");

-- CreateIndex
CREATE INDEX "Membership_teamId_position_idx" ON "Membership"("teamId", "position");

-- CreateIndex
CREATE INDEX "Notification_userId_createdAt_idx" ON "Notification"("userId", "createdAt");

-- CreateIndex
CREATE INDEX "Notification_userId_readAt_idx" ON "Notification"("userId", "readAt");

-- CreateIndex
CREATE INDEX "CalendarEvent_startsAt_idx" ON "CalendarEvent"("startsAt");

-- AddForeignKey
ALTER TABLE "EventAttendee" ADD CONSTRAINT "EventAttendee_eventId_fkey" FOREIGN KEY ("eventId") REFERENCES "CalendarEvent"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "EventAttendee" ADD CONSTRAINT "EventAttendee_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "TriageRequest" ADD CONSTRAINT "TriageRequest_linkedTaskId_fkey" FOREIGN KEY ("linkedTaskId") REFERENCES "Task"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Membership" ADD CONSTRAINT "Membership_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Membership" ADD CONSTRAINT "Membership_teamId_fkey" FOREIGN KEY ("teamId") REFERENCES "Team"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Notification" ADD CONSTRAINT "Notification_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Notification" ADD CONSTRAINT "Notification_actorId_fkey" FOREIGN KEY ("actorId") REFERENCES "User"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Notification" ADD CONSTRAINT "Notification_taskId_fkey" FOREIGN KEY ("taskId") REFERENCES "Task"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Notification" ADD CONSTRAINT "Notification_documentId_fkey" FOREIGN KEY ("documentId") REFERENCES "Document"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "CycleSettings" ADD CONSTRAINT "CycleSettings_teamId_fkey" FOREIGN KEY ("teamId") REFERENCES "Team"("id") ON DELETE CASCADE ON UPDATE CASCADE;


-- Backfill: every existing user belongs to their current space with their current role.
INSERT INTO "Membership" ("userId", "teamId", "role")
SELECT "id", "teamId", "role" FROM "User"
ON CONFLICT DO NOTHING;

-- Backfill: events without an end were the all-day ones.
UPDATE "CalendarEvent" SET "allDay" = true WHERE "endsAt" IS NULL;
