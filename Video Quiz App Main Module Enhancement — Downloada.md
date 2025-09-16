<img src="https://r2cdn.perplexity.ai/pplx-full-logo-primary-dark%402x.png" style="height:64px;margin-right:32px"/>

# Video Quiz App Main Module Enhancement — Downloadable Technical Specification

Below is your full, updated technical documentation as requested. All changes, requirements, and constraints are included for developer/AI implementation and analysis, in accordance with your current stack, logic, and design. You can download the specification here:

***

## Overview

The application enables a hierarchical learning path through **Main Modules** containing multiple **Sub-modules**, each with video content and quizzes. Sequential progression, certificate issuance, question type flexibility, and efficient administration workflows are prioritized. All enhancements strictly maintain the existing technical stack (PRISMA/PostgreSQL), business logic, UI, and styling, with continued mobile responsiveness.

## Admin User Stories \& Requirements

**As an Admin, I want to:**

- Create Main Modules with title, description, YouTube video URL, and assign existing sub-modules in a desired sequence.
- Manage sub-module hierarchy, ensuring drag-and-drop or numeric ordering and re-assignability.
- Create quizzes with:
    - Multiple Choice Questions (MCQ): Select format (2 or 4 options).
    - True/False Questions.
    - Mixed question types within the same quiz.
- Bulk upload questions/answers with correct options via CSV/Excel, preview and error resolution before final import.
- Configure completion requirements, including certificate template upload, pass/fail criteria, and progress tracking for main modules.


## Employee User Stories \& Requirements

**As an Employee, I want to:**

- Access a dashboard showing available main modules, progress, and lock/unlock status.
- Experience linear progression: watch main module video, unlock and complete sub-modules sequentially after watching each sub-module video.
- Answer MCQ (2 or 4 options), True/False questions, with max 2 retry attempts per sub-module quiz (existing logic).
- View the quiz result page (implementation should use and retain existing result calculation logic and result display).
- Download certificates after all sub-modules in a main module are completed.


## Technical Stack Requirements

- Strictly retain existing stack: Prisma ORM with PostgreSQL backend.
- All existing backend and frontend logic should be reused and preserved—any new logic should be integrated without altering current code quality or UI/UX fundamentals.
- Mobile responsiveness must be maintained throughout all interfaces.
- Existing UI styling must be preserved, with any new features visually consistent via the current design system.


## Prisma/PostgreSQL Database Schema

```prisma
// Main Module Model
model MainModule {
  id                  Int            @id @default(autoincrement())
  title               String
  description         String?
  youtubeUrl          String
  isActive            Boolean        @default(true)
  createdDate         DateTime       @default(now())
  certificateTemplate String?
  orderIndex          Int
  subModules          SubModule[]
}

// SubModule Model (retained, added linkage)
model SubModule {
  id             Int         @id @default(autoincrement())
  title          String
  description    String?
  youtubeUrl     String
  orderWithinMain Int
  mainModule     MainModule @relation(fields: [mainModuleId], references: [id])
  mainModuleId   Int
  questions      Question[]
  // Existing fields (including retry attempts) remain unchanged
}

// Enhanced Question Model
model Question {
  id            Int      @id @default(autoincrement())
  questionType  String   // 'MCQ_4', 'MCQ_2', 'TRUE_FALSE'
  questionText  String
  optionA       String
  optionB       String
  optionC       String?
  optionD       String?
  correctAnswer String   // 'A', 'B', 'C', 'D' for MCQ; 'TRUE'/'FALSE' for TF
  subModule     SubModule @relation(fields: [subModuleId], references: [id])
  subModuleId   Int
  orderIndex    Int
}

// Bulk Import Tracking
model QuestionImport {
  id               Int      @id @default(autoincrement())
  uploadedById     Int      // FK to User
  uploadedBy       User     @relation(fields: [uploadedById], references: [id])
  fileName         String
  uploadDate       DateTime @default(now())
  totalQuestions   Int
  successfulImports Int
  failedImports    Int
  errorLog         String?
}

// Progress Tracking
model EmployeeMainModuleProgress {
  id                 Int        @id @default(autoincrement())
  employeeId         Int        // FK to User
  employee           User       @relation(fields: [employeeId], references: [id])
  mainModuleId       Int        // FK to MainModule
  mainModule         MainModule @relation(fields: [mainModuleId], references: [id])
  currentSubmoduleIndex Int
  isCompleted        Boolean    @default(false)
  completionDate     DateTime?
}
```


## Frontend/UI Implementation

- Admins create/edit main modules, manage sub-module assignment, embed videos, and bulk upload questions via CSV/Excel (with preview \& error feedback).
- Bulk quiz uploader accepts 2/4 MCQ and True/False questions as per template.
- Employees view available main modules, see embedded main module and sub-module videos, and can only attempt sub-module quizzes after viewing each sub-module video.
- Quiz experience supports all question types and enforces 2 retry attempts per sub-module (retained). Results page must use and retain current logic, result calculation, and display components.
- All UI components/integrations must preserve current styling and support mobile responsiveness.


## Business Logic \& Migration Strategy

### Business Logic Enforcement

- **Sequential Unlocking:** Sub-module unlocks only after current completion. Main module certificate downloads only after all sub-modules are completed.
- **Retry Attempts:** Quiz submission for each sub-module is limited to two attempts (unchanged).
- **Bulk Import Validation:** Server-side and client-side validation for CSV/Excel uploads. Template download provided.
- **Question Type Management:** Question form adapts to MCQ/True/False, validates accordingly, and updates schema.
- **Quiz Results:** Display follows existing calculation \& UI logic.
- **Mobile Responsiveness:** All new pages and features must use existing responsive design system.
- **Video Viewing Control:** Each sub-module displays the video before users can attempt the quiz.


### Migration Steps

1. **Create and Link MainModule Model:** Add schema, admin forms, and embed videos.
2. **Enhance Question Model:** Add support for MCQ_2, MCQ_4, and TRUE_FALSE formats.
3. **Bulk Import Feature:** Integrate importer with validation/preview for all question types.
4. **Sub-module Integration:** Link sub-modules to main modules via foreign key (retain all existing logic/fields/UI).
5. **Frontend Integration:** Connect new main module hierarchy, preserve employee flow for sub-module video/quiz, update quiz attempt and results display using current code.
6. **Certificate Download:** Enable based on completion state of sub-modules/main module, reusing existing logic.
7. **UI Consistency \& Mobile Support:** Ensure no errors or inconsistencies introduced; visual components align with current styling and maintain responsiveness.

## Bulk Upload File Format (CSV)

```csv
question_type,question_text,option_a,option_b,option_c,option_d,correct_answer,sub_module_id
MCQ_4,"What is the capital of France?","Paris","London","Berlin","Madrid","A",1
MCQ_2,"Is Python object-oriented?","Yes","No",,,,"A",1
TRUE_FALSE,"HTML stands for HyperText Markup Language.",,,,,TRUE,2
```


## Final Notes

- All new features must analyze and integrate with the current codebase to ensure compatibility and preserve existing technical stack, UI, and front-end logic.
- Developer/AI should not make unapproved changes to sub-module logic, result page logic, business rules, or visual styling.
- The system must remain robust, easy to use, and mobile friendly throughout the enhancements.
<span style="display:none">[^1]</span>

<div style="text-align: center">⁂</div>

[^1]: https://ppl-ai-code-interpreter-files.s3.amazonaws.com/web/direct-files/b009079d79e0240ee545849c4be12dd5/b0b313ce-82ad-4a87-ad3f-673588d9dc94/3d6b0cbc.md

