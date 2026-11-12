ALTER TABLE "Question" ADD COLUMN "explanation" TEXT;
ALTER TABLE "QuestionOption" ADD COLUMN "isCorrect" BOOLEAN NOT NULL DEFAULT false;
