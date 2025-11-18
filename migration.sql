-- CreateTable
CREATE TABLE "User" (
    "id" INTEGER NOT NULL PRIMARY KEY AUTOINCREMENT,
    "firstName" TEXT,
    "lastName" TEXT,
    "email" TEXT,
    "password" TEXT
);


-- CreateTable
CREATE TABLE "History" (
    "id" INTEGER NOT NULL PRIMARY KEY AUTOINCREMENT,
    "userId" INTEGER,
    "action" TEXT,
    "createdAt" DATETIME DEFAULT CURRENT_TIMESTAMP,
    "workoutDetails" TEXT,
    CONSTRAINT "History_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User" ("id") ON DELETE SET NULL ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "Template" (
    "id" INTEGER NOT NULL PRIMARY KEY AUTOINCREMENT,
    "name" TEXT,
    "userId" INTEGER,
    "description" TEXT,
    CONSTRAINT "Template_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User" ("id") ON DELETE SET NULL ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "Exercise" (
    "id" INTEGER NOT NULL PRIMARY KEY AUTOINCREMENT,
    "name" TEXT,
    "kg" INTEGER,
    "reps" INTEGER,
    "completed" BOOLEAN DEFAULT false,
    "templateId" INTEGER,
    CONSTRAINT "Exercise_templateId_fkey" FOREIGN KEY ("templateId") REFERENCES "Template" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "TemplateNamedExercise" (
    "id" INTEGER NOT NULL PRIMARY KEY AUTOINCREMENT,
    "templateId" INTEGER,
    "exerciseName" TEXT,
    "notes" TEXT,
    "orderNum" INTEGER,
    "exerciseType" TEXT DEFAULT 'reps',
    CONSTRAINT "TemplateNamedExercise_templateId_fkey" FOREIGN KEY ("templateId") REFERENCES "Template" ("id") ON DELETE SET NULL ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "ExerciseSet" (
    "id" INTEGER NOT NULL PRIMARY KEY AUTOINCREMENT,
    "namedExerciseId" INTEGER NOT NULL,
    "setOrder" INTEGER,
    "kg" INTEGER,
    "reps" INTEGER,
    "completed" BOOLEAN DEFAULT false,
    "setType" TEXT DEFAULT 'reps',
    "duration" INTEGER,
    CONSTRAINT "ExerciseSet_namedExerciseId_fkey" FOREIGN KEY ("namedExerciseId") REFERENCES "TemplateNamedExercise" ("id") ON DELETE RESTRICT ON UPDATE CASCADE
);

-- CreateIndex
Pragma writable_schema=1;
CREATE UNIQUE INDEX "sqlite_autoindex_users_1" ON "User"("email");
Pragma writable_schema=0;

