/*
  Warnings:

  - A unique constraint covering the columns `[slug]` on the table `Chapter` will be added. If there are existing duplicate values, this will fail.
  - A unique constraint covering the columns `[nftTokenId]` on the table `PlayerNFT` will be added. If there are existing duplicate values, this will fail.
  - Added the required column `slug` to the `Chapter` table without a default value. This is not possible if the table is not empty.

*/
-- CreateEnum
CREATE TYPE "ItemRarity" AS ENUM ('COMMON', 'UNCOMMON', 'RARE', 'EPIC', 'LEGENDARY');

-- CreateEnum
CREATE TYPE "ItemType" AS ENUM ('WEAPON', 'ARMOR', 'ACCESSORY', 'CONSUMABLE', 'QUEST_ITEM', 'MISCELLANEOUS');

-- AlterTable
ALTER TABLE "Chapter" ADD COLUMN     "slug" TEXT NOT NULL;

-- AlterTable
ALTER TABLE "PlayerNFT" ADD COLUMN     "itemId" INTEGER;

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

-- CreateIndex
CREATE UNIQUE INDEX "Inventory_characterId_key" ON "Inventory"("characterId");

-- CreateIndex
CREATE UNIQUE INDEX "Item_code_key" ON "Item"("code");

-- CreateIndex
CREATE UNIQUE INDEX "InventoryItem_inventoryId_itemId_nftTokenId_key" ON "InventoryItem"("inventoryId", "itemId", "nftTokenId");

-- CreateIndex
CREATE UNIQUE INDEX "Chapter_slug_key" ON "Chapter"("slug");

-- CreateIndex
CREATE UNIQUE INDEX "PlayerNFT_nftTokenId_key" ON "PlayerNFT"("nftTokenId");

-- AddForeignKey
ALTER TABLE "Inventory" ADD CONSTRAINT "Inventory_characterId_fkey" FOREIGN KEY ("characterId") REFERENCES "Character"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "InventoryItem" ADD CONSTRAINT "InventoryItem_inventoryId_fkey" FOREIGN KEY ("inventoryId") REFERENCES "Inventory"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "InventoryItem" ADD CONSTRAINT "InventoryItem_itemId_fkey" FOREIGN KEY ("itemId") REFERENCES "Item"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
