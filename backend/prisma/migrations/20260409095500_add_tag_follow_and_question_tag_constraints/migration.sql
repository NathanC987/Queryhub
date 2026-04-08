-- Enforce unique tag assignment per question
CREATE UNIQUE INDEX "QuestionTag_questionId_tagId_key"
ON "QuestionTag"("questionId", "tagId");

-- Add follow relationships between users and tags
CREATE TABLE "UserTagFollow" (
  "id" SERIAL NOT NULL,
  "userId" INTEGER NOT NULL,
  "tagId" INTEGER NOT NULL,
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

  CONSTRAINT "UserTagFollow_pkey" PRIMARY KEY ("id")
);

CREATE UNIQUE INDEX "UserTagFollow_userId_tagId_key"
ON "UserTagFollow"("userId", "tagId");

ALTER TABLE "UserTagFollow"
ADD CONSTRAINT "UserTagFollow_userId_fkey"
FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

ALTER TABLE "UserTagFollow"
ADD CONSTRAINT "UserTagFollow_tagId_fkey"
FOREIGN KEY ("tagId") REFERENCES "Tag"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
