/*
  Warnings:

  - The `status` column on the `BranchPoint` table would be dropped and recreated. This will lead to data loss if there is data in the column.
  - You are about to drop the column `order` on the `StoryScene` table. All the data in the column will be lost.

*/
-- CreateEnum
CREATE TYPE "BranchPointStatus" AS ENUM ('OPEN', 'CLOSED');

-- CreateEnum
CREATE TYPE "SessionStatus" AS ENUM ('IDLE', 'VOTING', 'RESOLVED');

-- AlterTable
ALTER TABLE "BranchPoint" DROP COLUMN "status",
ADD COLUMN     "status" "BranchPointStatus" NOT NULL DEFAULT 'OPEN';

-- AlterTable
ALTER TABLE "StoryScene" DROP COLUMN "order",
ADD COLUMN     "sequence" INTEGER NOT NULL DEFAULT 0;

-- CreateTable
CREATE TABLE "UserAction" (
    "id" SERIAL NOT NULL,
    "userId" INTEGER NOT NULL,
    "questId" INTEGER NOT NULL,
    "choiceId" INTEGER,
    "result" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "UserAction_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Session" (
    "id" SERIAL NOT NULL,
    "name" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "Session_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "SessionProgress" (
    "id" SERIAL NOT NULL,
    "sessionId" INTEGER NOT NULL,
    "storyId" INTEGER NOT NULL,
    "currentQuestId" INTEGER NOT NULL,
    "daoStatus" "SessionStatus" NOT NULL DEFAULT 'IDLE',
    "lastUpdated" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "SessionProgress_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "ChoiceCondition" (
    "id" SERIAL NOT NULL,
    "choiceId" INTEGER NOT NULL,
    "classOnly" TEXT,
    "minStrength" INTEGER,
    "minWisdom" INTEGER,
    "minCharisma" INTEGER,

    CONSTRAINT "ChoiceCondition_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "_UserSession" (
    "A" INTEGER NOT NULL,
    "B" INTEGER NOT NULL,

    CONSTRAINT "_UserSession_AB_pkey" PRIMARY KEY ("A","B")
);

-- CreateIndex
CREATE UNIQUE INDEX "SessionProgress_sessionId_key" ON "SessionProgress"("sessionId");

-- CreateIndex
CREATE INDEX "_UserSession_B_index" ON "_UserSession"("B");

-- AddForeignKey
ALTER TABLE "UserAction" ADD CONSTRAINT "UserAction_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "UserAction" ADD CONSTRAINT "UserAction_questId_fkey" FOREIGN KEY ("questId") REFERENCES "Quest"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "UserAction" ADD CONSTRAINT "UserAction_choiceId_fkey" FOREIGN KEY ("choiceId") REFERENCES "Choice"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "SessionProgress" ADD CONSTRAINT "SessionProgress_sessionId_fkey" FOREIGN KEY ("sessionId") REFERENCES "Session"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "SessionProgress" ADD CONSTRAINT "SessionProgress_storyId_fkey" FOREIGN KEY ("storyId") REFERENCES "Story"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ChoiceCondition" ADD CONSTRAINT "ChoiceCondition_choiceId_fkey" FOREIGN KEY ("choiceId") REFERENCES "Choice"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "_UserSession" ADD CONSTRAINT "_UserSession_A_fkey" FOREIGN KEY ("A") REFERENCES "Session"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "_UserSession" ADD CONSTRAINT "_UserSession_B_fkey" FOREIGN KEY ("B") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;
