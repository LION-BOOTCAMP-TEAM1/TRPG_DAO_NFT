-- DropIndex
DROP INDEX "Character_userId_key";

-- AlterTable
ALTER TABLE "Character" ADD COLUMN     "magicAttack" INTEGER NOT NULL DEFAULT 10,
ADD COLUMN     "physicalAttack" INTEGER NOT NULL DEFAULT 10,
ADD COLUMN     "sessionId" INTEGER;

-- AddForeignKey
ALTER TABLE "Character" ADD CONSTRAINT "Character_sessionId_fkey" FOREIGN KEY ("sessionId") REFERENCES "Session"("id") ON DELETE SET NULL ON UPDATE CASCADE;
