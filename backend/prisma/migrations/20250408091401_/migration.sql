/*
  Warnings:

  - You are about to drop the column `createdAt` on the `PlayerNFT` table. All the data in the column will be lost.
  - You are about to drop the column `itemId` on the `PlayerNFT` table. All the data in the column will be lost.
  - Added the required column `description` to the `PlayerNFT` table without a default value. This is not possible if the table is not empty.
  - Added the required column `image` to the `PlayerNFT` table without a default value. This is not possible if the table is not empty.
  - Added the required column `mintType` to the `PlayerNFT` table without a default value. This is not possible if the table is not empty.
  - Added the required column `name` to the `PlayerNFT` table without a default value. This is not possible if the table is not empty.
  - Added the required column `tokenURI` to the `PlayerNFT` table without a default value. This is not possible if the table is not empty.

*/
-- AlterTable
ALTER TABLE "PlayerNFT" DROP COLUMN "createdAt",
DROP COLUMN "itemId",
ADD COLUMN     "attributes" JSONB,
ADD COLUMN     "confirmed" BOOLEAN NOT NULL DEFAULT false,
ADD COLUMN     "description" TEXT NOT NULL,
ADD COLUMN     "image" TEXT NOT NULL,
ADD COLUMN     "mintType" TEXT NOT NULL,
ADD COLUMN     "mintedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
ADD COLUMN     "name" TEXT NOT NULL,
ADD COLUMN     "questId" INTEGER,
ADD COLUMN     "sessionId" INTEGER,
ADD COLUMN     "tokenURI" TEXT NOT NULL,
ADD COLUMN     "txHash" TEXT;

-- AlterTable
ALTER TABLE "Session" ADD COLUMN     "gameMasterId" INTEGER;

-- CreateTable
CREATE TABLE "MintQueue" (
    "id" SERIAL NOT NULL,
    "userId" INTEGER NOT NULL,
    "walletAddress" TEXT NOT NULL,
    "metadataURI" TEXT NOT NULL,
    "mintType" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "processed" BOOLEAN NOT NULL DEFAULT false,
    "processedAt" TIMESTAMP(3),
    "sessionId" INTEGER,
    "questId" INTEGER,

    CONSTRAINT "MintQueue_pkey" PRIMARY KEY ("id")
);

-- AddForeignKey
ALTER TABLE "PlayerNFT" ADD CONSTRAINT "PlayerNFT_sessionId_fkey" FOREIGN KEY ("sessionId") REFERENCES "Session"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "PlayerNFT" ADD CONSTRAINT "PlayerNFT_questId_fkey" FOREIGN KEY ("questId") REFERENCES "Quest"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Session" ADD CONSTRAINT "Session_gameMasterId_fkey" FOREIGN KEY ("gameMasterId") REFERENCES "User"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "MintQueue" ADD CONSTRAINT "MintQueue_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
