-- AlterTable
ALTER TABLE "Quest" ADD COLUMN     "chapterId" INTEGER;

-- AlterTable
ALTER TABLE "StoryProgress" ADD COLUMN     "currentChapterId" INTEGER,
ALTER COLUMN "currentQuestId" DROP NOT NULL;

-- CreateTable
CREATE TABLE "Chapter" (
    "id" SERIAL NOT NULL,
    "storyId" INTEGER NOT NULL,
    "title" TEXT NOT NULL,
    "description" TEXT NOT NULL,
    "sequence" INTEGER NOT NULL DEFAULT 0,
    "imageUrl" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "Chapter_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "ChapterProgress" (
    "id" SERIAL NOT NULL,
    "userId" INTEGER NOT NULL,
    "chapterId" INTEGER NOT NULL,
    "currentQuestId" INTEGER,
    "completed" BOOLEAN NOT NULL DEFAULT false,
    "lastUpdated" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "ChapterProgress_pkey" PRIMARY KEY ("id")
);

-- AddForeignKey
ALTER TABLE "Chapter" ADD CONSTRAINT "Chapter_storyId_fkey" FOREIGN KEY ("storyId") REFERENCES "Story"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ChapterProgress" ADD CONSTRAINT "ChapterProgress_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ChapterProgress" ADD CONSTRAINT "ChapterProgress_chapterId_fkey" FOREIGN KEY ("chapterId") REFERENCES "Chapter"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Quest" ADD CONSTRAINT "Quest_chapterId_fkey" FOREIGN KEY ("chapterId") REFERENCES "Chapter"("id") ON DELETE SET NULL ON UPDATE CASCADE;
