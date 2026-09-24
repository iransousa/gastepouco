-- AlterTable
ALTER TABLE "Session" ADD COLUMN     "successorId" TEXT;

-- CreateIndex
CREATE UNIQUE INDEX "Session_successorId_key" ON "Session"("successorId");

