-- Comment threads (replies) and stable ordering for entries sharing a timestamp.

-- AlterTable
ALTER TABLE "Activity" ADD COLUMN     "position" SERIAL NOT NULL;

-- AlterTable
ALTER TABLE "DocumentComment" ADD COLUMN     "parentId" TEXT,
ADD COLUMN     "position" SERIAL NOT NULL;

-- AlterTable
ALTER TABLE "TaskEvent" ADD COLUMN     "position" SERIAL NOT NULL;

-- CreateIndex
CREATE INDEX "DocumentComment_parentId_idx" ON "DocumentComment"("parentId");

-- AddForeignKey
ALTER TABLE "DocumentComment" ADD CONSTRAINT "DocumentComment_parentId_fkey" FOREIGN KEY ("parentId") REFERENCES "DocumentComment"("id") ON DELETE CASCADE ON UPDATE CASCADE;

