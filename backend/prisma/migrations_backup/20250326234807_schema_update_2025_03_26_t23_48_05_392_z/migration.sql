-- AlterTable
ALTER TABLE "Story" ADD COLUMN     "storyWorldId" INTEGER;

-- CreateTable
CREATE TABLE "StoryWorld" (
    "id" SERIAL NOT NULL,
    "slug" TEXT NOT NULL,
    "title" TEXT NOT NULL,
    "description" TEXT NOT NULL,
    "coverImage" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "StoryWorld_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "StoryWorld_slug_key" ON "StoryWorld"("slug");

-- AddForeignKey
ALTER TABLE "Story" ADD CONSTRAINT "Story_storyWorldId_fkey" FOREIGN KEY ("storyWorldId") REFERENCES "StoryWorld"("id") ON DELETE SET NULL ON UPDATE CASCADE;
