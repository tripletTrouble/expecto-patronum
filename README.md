# Expectro Pratronum - Exam App for Indonesian students

An online exam application for Indonesian students. Teachers build a question bank and compose exams from it; students, with or without an account, take the exams and get graded automatically.

> **Status:** planning complete, implementation not started.

---

## Table of Contents

1. [Goals](#goals)
2. [Features](#features)
3. [Roles](#roles)
4. [Tech Stack](#tech-stack)
5. [Design Highlights](#design-highlights)
6. [Project Structure](#project-structure)
7. [Getting Started](#getting-started)
8. [Deployment](#deployment)
9. [Roadmap](#roadmap)
10. [MVP Scope](#mvp-scope)
11. [Open Decisions](#open-decisions)

---

## Goals

The stack and scope are chosen to be:

1. **Simple to deploy**: one app, one database.
2. **Cheap or free to run**: free tiers for development and small classes.
3. **Simple to work with**: a single TypeScript codebase in a familiar framework (Vue/Nuxt).
4. **Fast to deliver**: a lean MVP first, everything else deferred.

---

## Features

- **Teacher registration with admin approval.** Teachers can register but cannot use the app until an administrator approves them.
- **Student registration and exam taking.** Students can register, log in, take exams and review their history.
- **Question bank with categories.** Teachers create questions and organise them into categories.
- **Exam builder.** Teachers compose exams from questions they have already created.
- **Multiple question types:**
  - Normal multiple choice
  - Complex multiple choice
  - Matching with lines
- **Flexible access.** An exam can be taken with or without an account, depending on the exam's setting.
- **Automatic grading and results.** Scores are calculated on submission; teachers can review results per exam.

---

## Roles

| Role | How they get in | What they can do |
|---|---|---|
| **Admin** | Seeded account | Approve or reject teacher registrations |
| **Teacher** | Registers, then waits for approval | Manage categories, questions and exams; view results |
| **Student** | Registers | Take exams; view own history and results |
| **Guest** | No account; opens an exam link or enters an exam code | Enters a name and takes the exam |

---

## Tech Stack

| Concern | Choice |
|---|---|
| Framework | Nuxt (Vue, TypeScript), frontend and API in one project |
| Database | PostgreSQL (Supabase or Neon free tier) |
| ORM | Prisma |
| Auth | nuxt-auth-utils (cookie sessions) |
| UI | Nuxt UI (Tailwind-based) |
| Validation | Zod |
| Hosting | Vercel, Singapore region |

Free tiers are fine for development and small classes. For large exams with many simultaneous students, plan for a paid database and hosting tier.

---

## Design Highlights

- **Single deployable.** Nuxt serves both the pages and the API (`server/api`).
- **Role and approval checks on the server.** Browser-side guards are for UX only.
- **Server-controlled exam timer.** The client clock is never trusted.
- **Autosave and resume.** Students can refresh or lose connection without losing their work.
- **Exam content is snapshotted per attempt.** Editing a question later does not affect exams in progress.
- **Answer keys stay on the server** while an exam is running.
- **Mobile-first student UI.** Most students will take exams on phones.

---

## Project Structure

```
app/
  pages/
    login.vue, register.vue
    exam/[code].vue              # students and guests take an exam
    teacher/                     # questions, exams, results
    admin/teachers.vue           # teacher approval
  components/
    question/                    # editor and player per question type
  middleware/
server/
  api/                           # auth, admin, teacher, exams, attempts
  utils/                         # shared server helpers
prisma/
  schema.prisma
  seed.ts                        # creates the admin account
.env.example
README.md
```

---

## Getting Started

> The repo is not scaffolded yet. These are the intended steps.

**Prerequisites:** [Bun](https://bun.sh), Node.js (current LTS, still used by some tooling such as the Prisma CLI), a PostgreSQL database.

```bash
bun install
cp .env.example .env
bunx prisma migrate dev
bunx prisma db seed
bun run dev
```

### Environment variables

```env
DATABASE_URL=""              # Postgres connection string
NUXT_SESSION_PASSWORD=""     # at least 32 random characters
ADMIN_EMAIL=""               # seeded administrator
ADMIN_PASSWORD=""
```

---

## Deployment

1. Create a Postgres database (Supabase or Neon), ideally in the Singapore region.
2. Import the repo in Vercel and set the environment variables above.
3. Set the function region to Singapore (`sin1`).
4. Run `bunx prisma migrate deploy` against the production database and seed the admin once.

---

## Roadmap

Estimates assume one developer working roughly full-time. Double them for part-time work.

- [ ] **M0: Setup** (1-2 days): repo, Nuxt, database, deploy pipeline
- [ ] **M1: Auth and approval** (3-4 days): seeded admin, register and login, roles, teacher approval
- [ ] **M2: Question bank** (5-6 days): categories and all three question types
- [ ] **M3: Exam builder** (3-4 days): create, configure and publish exams; share link and code
- [ ] **M4: Taking an exam** (6-8 days): student and guest flow, timer, autosave, submit, grading
- [ ] **M5: Results** (3 days): teacher results view, student result page, CSV export
- [ ] **M6: Hardening** (3-4 days): mobile testing, edge cases, rate limiting, load test

**MVP (M0-M5): about 3.5-4.5 weeks. With hardening (M6): about 4-5 weeks.**

---

## MVP Scope

**In scope:** everything under [Features](#features), plain-text questions, link or code based exam access, teacher results with CSV export.

**Deferred to later versions:**

- Rich text and images in questions
- Question import from Excel or Word
- Exam scheduling windows and per-student assignment
- Anti-cheat features
- Email verification and password reset (needed before a real launch)
- Essay questions and manual grading

---

## Open Decisions

- Should students see the correct answers after an exam, or only their score?
- How many students are expected to take the same exam at the same time?
- UI language: Bahasa Indonesia, English, or both?

### Decided

- Stack: Nuxt (Vue) with PostgreSQL and Prisma.
