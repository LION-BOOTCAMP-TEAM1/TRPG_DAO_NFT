-- AlterTable
ALTER TABLE "User" ADD COLUMN IF NOT EXISTS "friendlyId" TEXT;

-- AddUniqueConstraint
ALTER TABLE "User" ADD CONSTRAINT "User_friendlyId_key" UNIQUE ("friendlyId"); 