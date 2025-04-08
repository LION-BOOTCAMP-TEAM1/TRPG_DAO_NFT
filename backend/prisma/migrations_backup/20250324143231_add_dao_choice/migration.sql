/*
  Warnings:

  - A unique constraint covering the columns `[resultChoiceId]` on the table `BranchPoint` will be added. If there are existing duplicate values, this will fail.

*/
-- AlterTable
ALTER TABLE "BranchPoint" ADD COLUMN     "resultChoiceId" INTEGER;

-- CreateTable
CREATE TABLE "DAOChoice" (
    "id" SERIAL NOT NULL,
    "branchPointId" INTEGER NOT NULL,
    "text" TEXT NOT NULL,
    "nextStoryId" INTEGER NOT NULL,
    "voteCount" INTEGER NOT NULL DEFAULT 0,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "DAOChoice_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "BranchPoint_resultChoiceId_key" ON "BranchPoint"("resultChoiceId");

-- AddForeignKey
ALTER TABLE "BranchPoint" ADD CONSTRAINT "BranchPoint_resultChoiceId_fkey" FOREIGN KEY ("resultChoiceId") REFERENCES "DAOChoice"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "DAOChoice" ADD CONSTRAINT "DAOChoice_branchPointId_fkey" FOREIGN KEY ("branchPointId") REFERENCES "BranchPoint"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
