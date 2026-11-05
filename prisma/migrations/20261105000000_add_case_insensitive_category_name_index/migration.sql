CREATE UNIQUE INDEX "Category_teacherId_lower_name_key"
ON "Category" ("teacherId", LOWER("name"));
