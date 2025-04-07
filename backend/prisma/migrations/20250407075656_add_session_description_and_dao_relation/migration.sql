-- CreateEnum
CREATE TYPE "BranchPointStatus" AS ENUM ('OPEN', 'CLOSED');

-- CreateEnum
CREATE TYPE "ItemRarity" AS ENUM ('COMMON', 'UNCOMMON', 'RARE', 'EPIC', 'LEGENDARY');

-- CreateEnum
CREATE TYPE "ItemType" AS ENUM ('WEAPON', 'ARMOR', 'ACCESSORY', 'CONSUMABLE', 'QUEST_ITEM', 'MISCELLANEOUS');

-- CreateEnum
CREATE TYPE "SessionStatus" AS ENUM ('IDLE', 'VOTING', 'RESOLVED', 'WAITING_FOR_PLAYERS', 'IN_PROGRESS', 'COMPLETED');

-- CreateTable
CREATE TABLE "User" (
    "id" SERIAL NOT NULL,
    "walletAddress" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "nonce" TEXT,
    "friendlyId" TEXT,

    CONSTRAINT "User_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "CharacterClass" (
    "id" SERIAL NOT NULL,
    "code" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "description" TEXT NOT NULL,
    "recommendedStat1" TEXT NOT NULL,
    "recommendedStat2" TEXT NOT NULL,

    CONSTRAINT "CharacterClass_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Character" (
    "id" SERIAL NOT NULL,
    "userId" INTEGER NOT NULL,
    "name" TEXT NOT NULL,
    "gender" TEXT NOT NULL,
    "age" INTEGER NOT NULL,
    "attribute" TEXT NOT NULL,
    "health" INTEGER NOT NULL DEFAULT 4,
    "strength" INTEGER NOT NULL DEFAULT 4,
    "agility" INTEGER NOT NULL DEFAULT 4,
    "intelligence" INTEGER NOT NULL DEFAULT 4,
    "wisdom" INTEGER NOT NULL DEFAULT 4,
    "charisma" INTEGER NOT NULL DEFAULT 4,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "classId" INTEGER NOT NULL,
    "hp" INTEGER NOT NULL DEFAULT 4,
    "mp" INTEGER NOT NULL DEFAULT 4,
    "magicAttack" INTEGER NOT NULL DEFAULT 10,
    "physicalAttack" INTEGER NOT NULL DEFAULT 10,
    "sessionId" INTEGER,

    CONSTRAINT "Character_pkey" PRIMARY KEY ("id")
);

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
CREATE TABLE "Genre" (
    "id" SERIAL NOT NULL,
    "code" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "description" TEXT,

    CONSTRAINT "Genre_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "StoryWorld" (
    "id" SERIAL NOT NULL,
    "slug" TEXT NOT NULL,
    "title" TEXT NOT NULL,
    "description" TEXT NOT NULL,
    "coverImage" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "genreId" INTEGER,

    CONSTRAINT "StoryWorld_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Story" (
    "id" SERIAL NOT NULL,
    "slug" TEXT NOT NULL,
    "title" TEXT NOT NULL,
    "summary" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "storyWorldId" INTEGER,
    "imageUrl" TEXT,

    CONSTRAINT "Story_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "StoryScene" (
    "id" SERIAL NOT NULL,
    "storyId" INTEGER NOT NULL,
    "text" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "sequence" INTEGER NOT NULL DEFAULT 0,

    CONSTRAINT "StoryScene_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "StoryProgress" (
    "id" SERIAL NOT NULL,
    "userId" INTEGER NOT NULL,
    "storyId" INTEGER NOT NULL,
    "currentQuestId" INTEGER,
    "completed" BOOLEAN NOT NULL DEFAULT false,
    "lastUpdated" TIMESTAMP(3) NOT NULL,
    "currentChapterId" INTEGER,

    CONSTRAINT "StoryProgress_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Chapter" (
    "id" SERIAL NOT NULL,
    "storyId" INTEGER NOT NULL,
    "title" TEXT NOT NULL,
    "description" TEXT NOT NULL,
    "sequence" INTEGER NOT NULL DEFAULT 0,
    "imageUrl" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "slug" TEXT NOT NULL,

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

-- CreateTable
CREATE TABLE "Quest" (
    "id" SERIAL NOT NULL,
    "slug" TEXT NOT NULL,
    "storyId" INTEGER NOT NULL,
    "title" TEXT NOT NULL,
    "description" TEXT NOT NULL,
    "chapterId" INTEGER,

    CONSTRAINT "Quest_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Choice" (
    "id" SERIAL NOT NULL,
    "slug" TEXT NOT NULL,
    "questId" INTEGER NOT NULL,
    "text" TEXT NOT NULL,
    "nextStoryId" INTEGER,

    CONSTRAINT "Choice_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "BranchPoint" (
    "id" SERIAL NOT NULL,
    "slug" TEXT NOT NULL,
    "storyId" INTEGER NOT NULL,
    "title" TEXT NOT NULL,
    "description" TEXT NOT NULL,
    "daoVoteId" TEXT,
    "status" "BranchPointStatus" NOT NULL DEFAULT 'OPEN',
    "resultChoiceId" INTEGER,

    CONSTRAINT "BranchPoint_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "BranchPointScene" (
    "id" SERIAL NOT NULL,
    "branchPointId" INTEGER NOT NULL,
    "order" INTEGER NOT NULL,
    "text" TEXT NOT NULL,

    CONSTRAINT "BranchPointScene_pkey" PRIMARY KEY ("id")
);

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

-- CreateTable
CREATE TABLE "Inventory" (
    "id" SERIAL NOT NULL,
    "characterId" INTEGER NOT NULL,
    "maxSlots" INTEGER NOT NULL DEFAULT 20,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Inventory_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Item" (
    "id" SERIAL NOT NULL,
    "code" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "description" TEXT NOT NULL,
    "imageUrl" TEXT,
    "rarity" "ItemRarity" NOT NULL DEFAULT 'COMMON',
    "itemType" "ItemType" NOT NULL,
    "useEffect" TEXT,
    "statBonus" JSONB,
    "isConsumable" BOOLEAN NOT NULL DEFAULT false,
    "isNFT" BOOLEAN NOT NULL DEFAULT false,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "Item_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "InventoryItem" (
    "id" SERIAL NOT NULL,
    "inventoryId" INTEGER NOT NULL,
    "itemId" INTEGER NOT NULL,
    "quantity" INTEGER NOT NULL DEFAULT 1,
    "equipped" BOOLEAN NOT NULL DEFAULT false,
    "nftTokenId" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "InventoryItem_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "PlayerNFT" (
    "id" SERIAL NOT NULL,
    "userId" INTEGER NOT NULL,
    "nftTokenId" TEXT NOT NULL,
    "choiceId" INTEGER,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "itemId" INTEGER,

    CONSTRAINT "PlayerNFT_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Session" (
    "id" SERIAL NOT NULL,
    "name" TEXT NOT NULL,
    "description" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "storyWorldId" INTEGER NOT NULL,
    "slug" TEXT NOT NULL,
    "status" "SessionStatus" NOT NULL DEFAULT 'IDLE',

    CONSTRAINT "Session_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "SessionParticipant" (
    "id" SERIAL NOT NULL,
    "sessionId" INTEGER NOT NULL,
    "userId" INTEGER NOT NULL,
    "isReady" BOOLEAN NOT NULL DEFAULT false,
    "hasVoted" BOOLEAN NOT NULL DEFAULT false,
    "role" TEXT,
    "joinedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "SessionParticipant_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "SessionProgress" (
    "id" SERIAL NOT NULL,
    "sessionId" INTEGER NOT NULL,
    "storyId" INTEGER NOT NULL,
    "currentQuestId" INTEGER,
    "daoStatus" "SessionStatus" NOT NULL DEFAULT 'IDLE',
    "lastUpdated" TIMESTAMP(3) NOT NULL,
    "currentChapterId" INTEGER,
    "currentSceneId" INTEGER,

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
    "minAgility" INTEGER,
    "minHealth" INTEGER,
    "minHp" INTEGER,
    "minIntelligence" INTEGER,
    "minMp" INTEGER,

    CONSTRAINT "ChoiceCondition_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "DAOProposal" (
    "id" SERIAL NOT NULL,
    "sessionId" INTEGER NOT NULL,
    "proposalId" INTEGER NOT NULL,
    "description" TEXT NOT NULL,
    "voteEndTime" TIMESTAMP(3) NOT NULL,
    "status" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "DAOProposal_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "DAOVote" (
    "id" SERIAL NOT NULL,
    "proposalId" INTEGER NOT NULL,
    "voter" TEXT NOT NULL,
    "option" INTEGER NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "DAOVote_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "SyncState" (
    "id" INTEGER NOT NULL DEFAULT 1,
    "lastBlock" INTEGER NOT NULL,

    CONSTRAINT "SyncState_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "_UserSession" (
    "A" INTEGER NOT NULL,
    "B" INTEGER NOT NULL,

    CONSTRAINT "_UserSession_AB_pkey" PRIMARY KEY ("A","B")
);

-- CreateIndex
CREATE UNIQUE INDEX "User_walletAddress_key" ON "User"("walletAddress");

-- CreateIndex
CREATE UNIQUE INDEX "User_friendlyId_key" ON "User"("friendlyId");

-- CreateIndex
CREATE UNIQUE INDEX "CharacterClass_code_key" ON "CharacterClass"("code");

-- CreateIndex
CREATE UNIQUE INDEX "Genre_code_key" ON "Genre"("code");

-- CreateIndex
CREATE UNIQUE INDEX "StoryWorld_slug_key" ON "StoryWorld"("slug");

-- CreateIndex
CREATE UNIQUE INDEX "Story_slug_key" ON "Story"("slug");

-- CreateIndex
CREATE UNIQUE INDEX "Chapter_slug_key" ON "Chapter"("slug");

-- CreateIndex
CREATE UNIQUE INDEX "ChapterProgress_userId_chapterId_key" ON "ChapterProgress"("userId", "chapterId");

-- CreateIndex
CREATE UNIQUE INDEX "Quest_slug_key" ON "Quest"("slug");

-- CreateIndex
CREATE UNIQUE INDEX "Choice_slug_key" ON "Choice"("slug");

-- CreateIndex
CREATE UNIQUE INDEX "BranchPoint_slug_key" ON "BranchPoint"("slug");

-- CreateIndex
CREATE UNIQUE INDEX "BranchPoint_resultChoiceId_key" ON "BranchPoint"("resultChoiceId");

-- CreateIndex
CREATE UNIQUE INDEX "Inventory_characterId_key" ON "Inventory"("characterId");

-- CreateIndex
CREATE UNIQUE INDEX "Item_code_key" ON "Item"("code");

-- CreateIndex
CREATE UNIQUE INDEX "InventoryItem_inventoryId_itemId_nftTokenId_key" ON "InventoryItem"("inventoryId", "itemId", "nftTokenId");

-- CreateIndex
CREATE UNIQUE INDEX "PlayerNFT_nftTokenId_key" ON "PlayerNFT"("nftTokenId");

-- CreateIndex
CREATE UNIQUE INDEX "Session_slug_key" ON "Session"("slug");

-- CreateIndex
CREATE UNIQUE INDEX "SessionParticipant_sessionId_userId_key" ON "SessionParticipant"("sessionId", "userId");

-- CreateIndex
CREATE UNIQUE INDEX "SessionProgress_sessionId_key" ON "SessionProgress"("sessionId");

-- CreateIndex
CREATE UNIQUE INDEX "DAOProposal_proposalId_key" ON "DAOProposal"("proposalId");

-- CreateIndex
CREATE UNIQUE INDEX "DAOVote_proposalId_voter_key" ON "DAOVote"("proposalId", "voter");

-- CreateIndex
CREATE INDEX "_UserSession_B_index" ON "_UserSession"("B");

-- AddForeignKey
ALTER TABLE "Character" ADD CONSTRAINT "Character_classId_fkey" FOREIGN KEY ("classId") REFERENCES "CharacterClass"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Character" ADD CONSTRAINT "Character_sessionId_fkey" FOREIGN KEY ("sessionId") REFERENCES "Session"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Character" ADD CONSTRAINT "Character_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "UserAction" ADD CONSTRAINT "UserAction_choiceId_fkey" FOREIGN KEY ("choiceId") REFERENCES "Choice"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "UserAction" ADD CONSTRAINT "UserAction_questId_fkey" FOREIGN KEY ("questId") REFERENCES "Quest"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "UserAction" ADD CONSTRAINT "UserAction_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "StoryWorld" ADD CONSTRAINT "StoryWorld_genreId_fkey" FOREIGN KEY ("genreId") REFERENCES "Genre"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Story" ADD CONSTRAINT "Story_storyWorldId_fkey" FOREIGN KEY ("storyWorldId") REFERENCES "StoryWorld"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "StoryScene" ADD CONSTRAINT "StoryScene_storyId_fkey" FOREIGN KEY ("storyId") REFERENCES "Story"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "StoryProgress" ADD CONSTRAINT "StoryProgress_storyId_fkey" FOREIGN KEY ("storyId") REFERENCES "Story"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "StoryProgress" ADD CONSTRAINT "StoryProgress_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Chapter" ADD CONSTRAINT "Chapter_storyId_fkey" FOREIGN KEY ("storyId") REFERENCES "Story"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ChapterProgress" ADD CONSTRAINT "ChapterProgress_chapterId_fkey" FOREIGN KEY ("chapterId") REFERENCES "Chapter"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ChapterProgress" ADD CONSTRAINT "ChapterProgress_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Quest" ADD CONSTRAINT "Quest_chapterId_fkey" FOREIGN KEY ("chapterId") REFERENCES "Chapter"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Quest" ADD CONSTRAINT "Quest_storyId_fkey" FOREIGN KEY ("storyId") REFERENCES "Story"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Choice" ADD CONSTRAINT "Choice_questId_fkey" FOREIGN KEY ("questId") REFERENCES "Quest"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "BranchPoint" ADD CONSTRAINT "BranchPoint_resultChoiceId_fkey" FOREIGN KEY ("resultChoiceId") REFERENCES "DAOChoice"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "BranchPoint" ADD CONSTRAINT "BranchPoint_storyId_fkey" FOREIGN KEY ("storyId") REFERENCES "Story"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "BranchPointScene" ADD CONSTRAINT "BranchPointScene_branchPointId_fkey" FOREIGN KEY ("branchPointId") REFERENCES "BranchPoint"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "DAOChoice" ADD CONSTRAINT "DAOChoice_branchPointId_fkey" FOREIGN KEY ("branchPointId") REFERENCES "BranchPoint"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Inventory" ADD CONSTRAINT "Inventory_characterId_fkey" FOREIGN KEY ("characterId") REFERENCES "Character"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "InventoryItem" ADD CONSTRAINT "InventoryItem_inventoryId_fkey" FOREIGN KEY ("inventoryId") REFERENCES "Inventory"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "InventoryItem" ADD CONSTRAINT "InventoryItem_itemId_fkey" FOREIGN KEY ("itemId") REFERENCES "Item"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "PlayerNFT" ADD CONSTRAINT "PlayerNFT_choiceId_fkey" FOREIGN KEY ("choiceId") REFERENCES "Choice"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "PlayerNFT" ADD CONSTRAINT "PlayerNFT_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Session" ADD CONSTRAINT "Session_storyWorldId_fkey" FOREIGN KEY ("storyWorldId") REFERENCES "StoryWorld"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "SessionParticipant" ADD CONSTRAINT "SessionParticipant_sessionId_fkey" FOREIGN KEY ("sessionId") REFERENCES "Session"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "SessionParticipant" ADD CONSTRAINT "SessionParticipant_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "SessionProgress" ADD CONSTRAINT "SessionProgress_sessionId_fkey" FOREIGN KEY ("sessionId") REFERENCES "Session"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "SessionProgress" ADD CONSTRAINT "SessionProgress_storyId_fkey" FOREIGN KEY ("storyId") REFERENCES "Story"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ChoiceCondition" ADD CONSTRAINT "ChoiceCondition_choiceId_fkey" FOREIGN KEY ("choiceId") REFERENCES "Choice"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "DAOProposal" ADD CONSTRAINT "DAOProposal_sessionId_fkey" FOREIGN KEY ("sessionId") REFERENCES "Session"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "DAOVote" ADD CONSTRAINT "DAOVote_proposalId_fkey" FOREIGN KEY ("proposalId") REFERENCES "DAOProposal"("proposalId") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "_UserSession" ADD CONSTRAINT "_UserSession_A_fkey" FOREIGN KEY ("A") REFERENCES "Session"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "_UserSession" ADD CONSTRAINT "_UserSession_B_fkey" FOREIGN KEY ("B") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;
