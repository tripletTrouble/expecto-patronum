# Expecto Patronum - Exam App for Indonesian Students

An online exam application for Indonesian students. Teachers build a question bank and compose exams from it; students, with or without an account, take the exams and get graded automatically.

> **Status:** Nuxt project scaffolded; application features are being implemented incrementally.

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

The current repository contains the Nuxt application scaffold. The following structure describes the planned application areas as they are implemented:

```
app/                         # Nuxt application pages and components
server/                      # Nitro server routes and shared server utilities
public/                      # static assets
.env.example                 # local environment variable template
README.md                    # project documentation
```

Planned areas include:

```
app/pages/                   # login, registration, exam, teacher and admin pages
app/components/question/     # question editors and exam players
app/middleware/              # client-side UX guards
server/api/                  # auth, admin, teacher, exam and attempt endpoints
server/utils/                # shared server helpers
prisma/                      # schema, migrations and seed script
```

---

## Getting Started

These steps run the current Nuxt scaffold created in issue #1. Prisma setup is covered by issue #5.

**Prerequisites:** [Bun](https://bun.sh).

```bash
bun install
cp .env.example .env
bun run dev
```

### Quality checks

```bash
bun run typecheck
bun run lint
```

Type checking uses Nuxt's `typecheck` command. Linting and formatting use Nuxt's `@nuxt/eslint` module with ESLint Stylistic as the repository's single formatting tool.

### Environment variables

The application uses a Supabase PostgreSQL project for each environment. Keep the development values in your local `.env` only. Keep production values in the password manager until issue #8 adds them to Vercel. Never use the production database from a local development environment.

```env
DATABASE_URL=""              # Supabase pooled transaction-mode URL for the running app
DIRECT_URL=""                # Supabase direct database URL for Prisma migrations
NUXT_SESSION_PASSWORD=""     # at least 32 random characters
ADMIN_EMAIL=""               # seeded administrator
ADMIN_PASSWORD=""
```

### Database setup

Issue #4 uses **Supabase** with two separate PostgreSQL projects: one for development and one for production. Both projects should be created in the Singapore region (`ap-southeast-1`) or the Supabase APAC Southeast Asia (Singapore) region.

### Health check

A public health check endpoint is available for deployments and monitoring:

```bash
curl -i http://localhost:3000/api/health
```

- When the database is reachable, it returns HTTP `200` with `{ "status": "ok" }`.
- When the database is unreachable or the query fails, it returns HTTP `503` with `{ "status": "error" }`.
- The response includes `Cache-Control: no-store` and contains no database details or error messages. Failure details are logged on the server only.
- Only `GET` is accepted.

Supabase's current connection guidance uses:

- `DATABASE_URL`: the shared pooler **transaction-mode** connection (port `6543`) for the running Nuxt serverless application. Transaction mode is intended for serverless functions with many short-lived connections.
- `DIRECT_URL`: the direct PostgreSQL connection for Prisma migrations, `pg_dump`, backup and restore, and other native PostgreSQL commands. If the local network is IPv4-only and cannot use a direct connection, use Supabase's shared pooler **session-mode** connection (port `5432`) for migration tooling instead and document that exception.

Test the development and production connections separately with `psql` or a GUI client, but do not put either password or connection string in this README, an issue, a PR, or chat. Production credentials belong in the password manager until issue #8 provisions Vercel.

The current Supabase Free plan notes relevant to this project are:

- Up to two active projects, which is sufficient for the separate development and production projects.
- 500 MB database size and 5 GB egress per project.
- Free projects may be paused after roughly one week of low activity and can be resumed from the dashboard.
- Connection capacity depends on the project's compute size; use the pooler for the application and monitor connection usage in Supabase rather than opening many direct connections.
- Downloadable managed database backups are not available on the Free plan. Use regular `supabase db dump` or `pg_dump` exports and keep them off-site if a logical backup is needed. Paid plans provide daily backups (7 days on Pro, 14 days on Team); PITR is a paid add-on.

Sources checked: [Supabase PostgreSQL connections](https://supabase.com/docs/guides/database/connecting-to-postgres), [Supabase regions](https://supabase.com/docs/guides/platform/regions), [project pausing](https://supabase.com/docs/guides/platform/pausing-projects), [database backups](https://supabase.com/docs/guides/platform/backups), and [pricing and limits](https://supabase.com/pricing).

---


### Prisma commands

```bash
bunx prisma migrate dev      # create/apply migrations in dev
bunx prisma generate         # generate Prisma Client
bunx prisma studio           # browse data
```

## Deployment

Deployment will be documented after the database, authentication and application features are implemented.

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
