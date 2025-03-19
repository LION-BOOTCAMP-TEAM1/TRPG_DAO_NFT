-- CreateTable
CREATE TABLE "Story" (
    "id" SERIAL NOT NULL,
    "title" TEXT NOT NULL,
    "summary" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "Story_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Quest" (
    "id" SERIAL NOT NULL,
    "storyId" INTEGER NOT NULL,
    "title" TEXT NOT NULL,
    "description" TEXT NOT NULL,

    CONSTRAINT "Quest_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Choice" (
    "id" SERIAL NOT NULL,
    "questId" INTEGER NOT NULL,
    "text" TEXT NOT NULL,
    "nextStoryId" INTEGER,

    CONSTRAINT "Choice_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "BranchPoint" (
    "id" SERIAL NOT NULL,
    "storyId" INTEGER NOT NULL,
    "title" TEXT NOT NULL,
    "description" TEXT NOT NULL,
    "status" TEXT NOT NULL DEFAULT 'open',
    "daoVoteId" TEXT,

    CONSTRAINT "BranchPoint_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "StoryProgress" (
    "id" SERIAL NOT NULL,
    "userId" INTEGER NOT NULL,
    "storyId" INTEGER NOT NULL,
    "currentQuestId" INTEGER NOT NULL,
    "completed" BOOLEAN NOT NULL DEFAULT false,
    "lastUpdated" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "StoryProgress_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "PlayerNFT" (
    "id" SERIAL NOT NULL,
    "userId" INTEGER NOT NULL,
    "nftTokenId" TEXT NOT NULL,
    "choiceId" INTEGER,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "PlayerNFT_pkey" PRIMARY KEY ("id")
);

-- AddForeignKey
ALTER TABLE "Quest" ADD CONSTRAINT "Quest_storyId_fkey" FOREIGN KEY ("storyId") REFERENCES "Story"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Choice" ADD CONSTRAINT "Choice_questId_fkey" FOREIGN KEY ("questId") REFERENCES "Quest"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "BranchPoint" ADD CONSTRAINT "BranchPoint_storyId_fkey" FOREIGN KEY ("storyId") REFERENCES "Story"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "StoryProgress" ADD CONSTRAINT "StoryProgress_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "StoryProgress" ADD CONSTRAINT "StoryProgress_storyId_fkey" FOREIGN KEY ("storyId") REFERENCES "Story"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "PlayerNFT" ADD CONSTRAINT "PlayerNFT_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "PlayerNFT" ADD CONSTRAINT "PlayerNFT_choiceId_fkey" FOREIGN KEY ("choiceId") REFERENCES "Choice"("id") ON DELETE SET NULL ON UPDATE CASCADE;
