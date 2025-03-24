-- CreateTable
CREATE TABLE "BranchPointScene" (
    "id" SERIAL NOT NULL,
    "branchPointId" INTEGER NOT NULL,
    "order" INTEGER NOT NULL,
    "text" TEXT NOT NULL,

    CONSTRAINT "BranchPointScene_pkey" PRIMARY KEY ("id")
);

-- AddForeignKey
ALTER TABLE "BranchPointScene" ADD CONSTRAINT "BranchPointScene_branchPointId_fkey" FOREIGN KEY ("branchPointId") REFERENCES "BranchPoint"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
