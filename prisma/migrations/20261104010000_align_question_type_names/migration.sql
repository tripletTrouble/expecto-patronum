-- Align the initial question type values with the question API vocabulary.
ALTER TYPE "QuestionType" RENAME VALUE 'MULTIPLE_CHOICE' TO 'SINGLE';
ALTER TYPE "QuestionType" RENAME VALUE 'MULTIPLE_SELECT' TO 'MULTIPLE';
