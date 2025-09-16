-- DropIndex
DROP INDEX "public"."Certificate_userId_key";

-- AlterTable
ALTER TABLE "public"."Certificate" ADD COLUMN     "mainModuleId" INTEGER;

-- AlterTable
ALTER TABLE "public"."Module" ADD COLUMN     "mainModuleId" INTEGER,
ADD COLUMN     "orderWithinMain" INTEGER;

-- AlterTable
ALTER TABLE "public"."Question" ADD COLUMN     "correctAnswer" TEXT,
ADD COLUMN     "optionA" TEXT,
ADD COLUMN     "optionB" TEXT,
ADD COLUMN     "optionC" TEXT,
ADD COLUMN     "optionD" TEXT,
ADD COLUMN     "orderIndex" INTEGER,
ADD COLUMN     "questionType" TEXT;

-- CreateTable
CREATE TABLE "public"."MainModule" (
    "id" SERIAL NOT NULL,
    "title" TEXT NOT NULL,
    "description" TEXT,
    "youtubeId" TEXT NOT NULL,
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "createdDate" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "certificateTemplate" TEXT,
    "orderIndex" INTEGER NOT NULL,

    CONSTRAINT "MainModule_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "public"."QuestionImport" (
    "id" SERIAL NOT NULL,
    "uploadedById" TEXT NOT NULL,
    "fileName" TEXT NOT NULL,
    "uploadDate" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "totalQuestions" INTEGER NOT NULL,
    "successfulImports" INTEGER NOT NULL,
    "failedImports" INTEGER NOT NULL,
    "errorLog" TEXT,

    CONSTRAINT "QuestionImport_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "public"."EmployeeMainModuleProgress" (
    "id" SERIAL NOT NULL,
    "employeeId" TEXT NOT NULL,
    "mainModuleId" INTEGER NOT NULL,
    "currentSubmoduleIndex" INTEGER NOT NULL DEFAULT 0,
    "isCompleted" BOOLEAN NOT NULL DEFAULT false,
    "completionDate" TIMESTAMP(3),

    CONSTRAINT "EmployeeMainModuleProgress_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "EmployeeMainModuleProgress_employeeId_mainModuleId_key" ON "public"."EmployeeMainModuleProgress"("employeeId", "mainModuleId");

-- CreateIndex
CREATE INDEX "Certificate_userId_idx" ON "public"."Certificate"("userId");

-- CreateIndex
CREATE INDEX "Certificate_mainModuleId_idx" ON "public"."Certificate"("mainModuleId");

-- CreateIndex
CREATE UNIQUE INDEX "Certificate_userId_mainModuleId_key" ON "public"."Certificate"("userId", "mainModuleId");

-- AddForeignKey
ALTER TABLE "public"."Module" ADD CONSTRAINT "Module_mainModuleId_fkey" FOREIGN KEY ("mainModuleId") REFERENCES "public"."MainModule"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."Certificate" ADD CONSTRAINT "Certificate_mainModuleId_fkey" FOREIGN KEY ("mainModuleId") REFERENCES "public"."MainModule"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."QuestionImport" ADD CONSTRAINT "QuestionImport_uploadedById_fkey" FOREIGN KEY ("uploadedById") REFERENCES "public"."User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."EmployeeMainModuleProgress" ADD CONSTRAINT "EmployeeMainModuleProgress_employeeId_fkey" FOREIGN KEY ("employeeId") REFERENCES "public"."User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."EmployeeMainModuleProgress" ADD CONSTRAINT "EmployeeMainModuleProgress_mainModuleId_fkey" FOREIGN KEY ("mainModuleId") REFERENCES "public"."MainModule"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

