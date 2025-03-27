/*
  Warnings:

  - A unique constraint covering the columns `[userId,chapterId]` on the table `ChapterProgress` will be added. If there are existing duplicate values, this will fail.

*/
-- CreateIndex
CREATE UNIQUE INDEX "ChapterProgress_userId_chapterId_key" ON "ChapterProgress"("userId", "chapterId");
