/*
  Warnings:

  - You are about to drop the column `type` on the `Vote` table. All the data in the column will be lost.
  - A unique constraint covering the columns `[userId,questionId]` on the table `Vote` will be added. If there are existing duplicate values, this will fail.
  - A unique constraint covering the columns `[userId,answerId]` on the table `Vote` will be added. If there are existing duplicate values, this will fail.
  - Added the required column `value` to the `Vote` table without a default value. This is not possible if the table is not empty.

*/
-- AlterTable
ALTER TABLE "Vote" DROP COLUMN "type",
ADD COLUMN     "value" INTEGER NOT NULL;

-- CreateIndex
CREATE UNIQUE INDEX "Vote_userId_questionId_key" ON "Vote"("userId", "questionId");

-- CreateIndex
CREATE UNIQUE INDEX "Vote_userId_answerId_key" ON "Vote"("userId", "answerId");
