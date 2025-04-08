/*
  Warnings:

  - Added the required column `classId` to the `Character` table without a default value. This is not possible if the table is not empty.

*/
-- AlterTable
ALTER TABLE "Character" ADD COLUMN     "classId" INTEGER NOT NULL,
ADD COLUMN     "hp" INTEGER NOT NULL DEFAULT 4,
ADD COLUMN     "mp" INTEGER NOT NULL DEFAULT 4;

-- AlterTable
ALTER TABLE "ChoiceCondition" ADD COLUMN     "minAgility" INTEGER,
ADD COLUMN     "minHealth" INTEGER,
ADD COLUMN     "minHp" INTEGER,
ADD COLUMN     "minIntelligence" INTEGER,
ADD COLUMN     "minMp" INTEGER;

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

-- CreateIndex
CREATE UNIQUE INDEX "CharacterClass_code_key" ON "CharacterClass"("code");

-- AddForeignKey
ALTER TABLE "Character" ADD CONSTRAINT "Character_classId_fkey" FOREIGN KEY ("classId") REFERENCES "CharacterClass"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
