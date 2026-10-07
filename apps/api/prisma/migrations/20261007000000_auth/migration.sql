-- Sign-in credentials for users.

-- AlterTable: add as nullable first so existing rows can be backfilled.
ALTER TABLE "User" ADD COLUMN "email" TEXT,
ADD COLUMN "passwordHash" TEXT;

-- Existing users get a placeholder address (they have no password, so they can't sign in
-- until one is set). Re-seed or update these addresses as needed.
UPDATE "User" SET "email" = "id" || '@flow.test' WHERE "email" IS NULL;

ALTER TABLE "User" ALTER COLUMN "email" SET NOT NULL;

-- CreateIndex
CREATE UNIQUE INDEX "User_email_key" ON "User"("email");
