/*
  Warnings:

  - A unique constraint covering the columns `[slug]` on the table `BranchPoint` will be added. If there are existing duplicate values, this will fail.
  - A unique constraint covering the columns `[slug]` on the table `Choice` will be added. If there are existing duplicate values, this will fail.
  - A unique constraint covering the columns `[slug]` on the table `Quest` will be added. If there are existing duplicate values, this will fail.
  - A unique constraint covering the columns `[slug]` on the table `Story` will be added. If there are existing duplicate values, this will fail.

*/
-- Step 1: Add nullable slug columns with default values based on IDs
-- AlterTable
ALTER TABLE "BranchPoint" ADD COLUMN "slug" TEXT;
UPDATE "BranchPoint" SET "slug" = 'branch-point-' || id::TEXT WHERE "slug" IS NULL;
ALTER TABLE "BranchPoint" ALTER COLUMN "slug" SET NOT NULL;

-- AlterTable
ALTER TABLE "Choice" ADD COLUMN "slug" TEXT;
UPDATE "Choice" SET "slug" = 'choice-' || id::TEXT WHERE "slug" IS NULL;
ALTER TABLE "Choice" ALTER COLUMN "slug" SET NOT NULL;

-- AlterTable
ALTER TABLE "Quest" ADD COLUMN "slug" TEXT;
UPDATE "Quest" SET "slug" = 'quest-' || id::TEXT WHERE "slug" IS NULL;
ALTER TABLE "Quest" ALTER COLUMN "slug" SET NOT NULL;

-- AlterTable
ALTER TABLE "Story" ADD COLUMN "slug" TEXT;
UPDATE "Story" SET "slug" = 'story-' || id::TEXT WHERE "slug" IS NULL;
ALTER TABLE "Story" ALTER COLUMN "slug" SET NOT NULL;

-- Step 2: Add unique constraints
-- CreateIndex
CREATE UNIQUE INDEX "BranchPoint_slug_key" ON "BranchPoint"("slug");

-- CreateIndex
CREATE UNIQUE INDEX "Choice_slug_key" ON "Choice"("slug");

-- CreateIndex
CREATE UNIQUE INDEX "Quest_slug_key" ON "Quest"("slug");

-- CreateIndex
CREATE UNIQUE INDEX "Story_slug_key" ON "Story"("slug");
