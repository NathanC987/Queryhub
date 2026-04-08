-- Add accepted answer support for questions
ALTER TABLE "Question"
ADD COLUMN "acceptedAnswerId" INTEGER;

CREATE UNIQUE INDEX "Question_acceptedAnswerId_key"
ON "Question"("acceptedAnswerId");

ALTER TABLE "Question"
ADD CONSTRAINT "Question_acceptedAnswerId_fkey"
FOREIGN KEY ("acceptedAnswerId") REFERENCES "Answer"("id")
ON DELETE SET NULL ON UPDATE CASCADE;
