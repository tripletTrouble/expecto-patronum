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

These steps install the Nuxt application and its Prisma ORM dependencies.

**Prerequisites:** [Bun](https://bun.sh).

```bash
bun install
cp .env.example .env
bunx prisma generate
bun run dev
```

### Quality checks

```bash
bun run typecheck
bun run lint
bun run test
```

Type checking uses Nuxt's `typecheck` command. Linting and formatting use Nuxt's `@nuxt/eslint` module with ESLint Stylistic as the repository's single formatting tool.

### Testing

Tests use Vitest. The recommended test directories are:

- `test/unit/` for fast unit tests that do not need the Nuxt runtime.
- `test/nuxt/` for tests that need the Nuxt runtime.
- `test/e2e/` for end-to-end tests, which are not part of the current test suite.

Run the test suite with:

```bash
bun run test
```

The current tests do not connect to Prisma or any database. Future database-backed tests must use a separate, isolated test database and must never use development or production database credentials. Test configuration must not fall back to `DATABASE_URL` or `DIRECT_URL` for database tests.

### Continuous Integration

GitHub Actions runs CI on pull requests and pushes to `main`. The workflow (`.github/workflows/ci.yml`) installs dependencies with `bun install --frozen-lockfile`, generates the Prisma client (`bunx prisma generate`), and runs in order: `bun run typecheck`, `bun run lint`, `bun run test`, `bun run build`. All third-party actions are pinned to commit SHAs and the workflow uses read-only permissions with placeholder environment values only.

### Environment variables

The application uses a Supabase PostgreSQL project for each environment. Keep the development values in your local `.env` only. Keep production values in the password manager until issue #8 adds them to Vercel. Never use the production database from a local development environment.

Authentication uses `nuxt-auth-utils` with an encrypted session cookie. The application session contains only the authenticated user's database ID; roles, account status, email addresses and password hashes remain in the database and are not stored in the session. The module's session endpoint is `/api/_auth/session`.

```env
DATABASE_URL=""              # Supabase pooled transaction-mode URL for the running app
DIRECT_URL=""                # Supabase direct database URL for Prisma migrations
NUXT_SESSION_PASSWORD=""     # random value of at least 32 characters; different per environment
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

This project uses Prisma ORM 7 with the PostgreSQL driver adapter. Prisma Client
is generated into `prisma/generated/prisma`, and the runtime client uses the
pooled `DATABASE_URL`. Prisma CLI migration commands use `DIRECT_URL` through
`prisma.config.ts`.

```bash
bunx prisma generate         # regenerate Prisma Client after schema changes
bunx prisma migrate dev      # create/apply migrations in development
bunx prisma migrate deploy  # apply existing migrations in deployment
bunx prisma studio          # browse data
```

Prisma ORM 7 no longer loads environment variables automatically. The root
`prisma.config.ts` explicitly loads `.env` with `dotenv` and uses `DIRECT_URL`
for Prisma CLI operations. Keep `DATABASE_URL` and `DIRECT_URL` in the local
`.env` file or provide them through the deployment environment; never commit
their values.

After changing `prisma/schema.prisma`, run `bunx prisma generate` explicitly.
Schema changes still require a Prisma migration. Prisma ORM 7 does not run the
seed script automatically after migrations, so run `bunx prisma db seed` when a
seed script is configured.

### Bootstrap the administrator

The first administrator is created by a one-off Nitro task. It is not an HTTP
endpoint, so it cannot be called by an unauthenticated client. The task is
idempotent: if any administrator already exists, it makes no changes.

Set `ADMIN_EMAIL` and a strong, unique `ADMIN_PASSWORD` in the environment
that has access to the target database, then run:

```bash
bun run bootstrap-admin
```

If a Nuxt server is already running, the command can use it directly instead
of starting a second server:

```bash
BOOTSTRAP_ADMIN_URL=http://127.0.0.1:3000 bun run bootstrap-admin
```

Set `BOOTSTRAP_ADMIN_PORT` to change the temporary server's port. The command
keeps the temporary Nuxt server's output visible so startup or database errors
are actionable rather than becoming an opaque timeout.

For a deployed Vercel project, run the command with the production environment
variables:

```bash
vercel env run -e production -- bun run bootstrap-admin
```

Run Prisma migrations before bootstrapping the account:

```bash
DIRECT_URL="..." bunx prisma migrate deploy
```

The command prints its progress and whether the administrator was created or
already existed. It never prints the password or its hash. After confirming
that the administrator can log in, remove
`ADMIN_PASSWORD` from the environment. Keep production and development
administrator passwords different. Do not put either password in Git, the
README, an issue, a pull request, or chat.

The current repository does not yet contain the application login flow. The
tests verify the real `nuxt-auth-utils` hash and verification helpers against
each other; end-to-end verification through the application login remains a
follow-up for the M1 login work.

Nuxt exposes `hashPassword` only inside the Nitro server runtime, while Prisma
seed scripts run as standalone programs. The bootstrap uses an experimental
Nitro task so it runs inside the same Nuxt server runtime and uses the same
`hashPassword` helper as login. A public bootstrap route was rejected because
it would create an unnecessary credentialed attack surface; a standalone
script importing the private helper was rejected because that import is not a
supported package export.

## Deployment

### Vercel (production)

1. Import the repository into [Vercel](https://vercel.com). Use the Nuxt framework preset. With Bun, use `bun install` as the install command and `bun run build` as the build command (confirmed against current Vercel/Nuxt docs).
2. Set the Serverless/Functions region to **Singapore (`sin1`)** in Project Settings → Functions.
3. In Project Settings → Environment Variables, add the following **to Production only** (do not expose to Preview):
   - `DATABASE_URL` — Supabase pooled transaction-mode URL for production
   - `DIRECT_URL` — Supabase direct URL for running migrations
   - `NUXT_SESSION_PASSWORD` — at least 32 random characters, generated fresh for production (different from development)
   - `ADMIN_EMAIL`
   - `ADMIN_PASSWORD`
4. Apply migrations from your machine (do **not** run migrations automatically on every build):
   ```bash
   DIRECT_URL="..." bunx prisma migrate deploy
   ```
5. Deploy from `main`. Vercel will auto-deploy on subsequent merges to `main` with no manual steps.
6. Verify: `GET https://<production-url>/api/health` should return `200` with `{ "status": "ok" }`. Failure returns `503` with `{ "status": "error" }` and logs details server-side only.

`nuxt-auth-utils` uses an encrypted, `HttpOnly` session cookie. Its default cookie configuration uses `SameSite=Lax`; production must be served over HTTPS so the cookie is secure in transit. The module's session password must never be committed or shared in documentation, issues or pull requests.

---

## Roadmap

Estimates assume one developer working roughly full-time. Double them for part-time work.

- [x] **M0: Setup** (1-2 days): repo, Nuxt, database, deploy pipeline
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

### Decided

- Stack: Nuxt (Vue) with PostgreSQL and Prisma.
- UI language: Indonesian for all user-facing application text.
