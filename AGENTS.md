# AGENTS.md

Instructions for AI agents that write or review code in this repository. Read this file fully before making changes. For the project overview, read `README.md`.

**Project:** an online exam app for Indonesian students. Teachers (admin-approved) build a question bank and exams; students and guests take exams; scoring is automatic.

**Stack:** Nuxt (Vue 3, TypeScript), Nitro server routes in `server/api`, PostgreSQL, Prisma, `nuxt-auth-utils`, Nuxt UI, Zod, Bun.

---

## 1. Core Principles

1. **Simple over sophisticated.** The best solution is the plainest one that is correct and secure. Boring, readable code wins over clever code.
2. **Secure by default.** Every endpoint is untrusted input until proven otherwise. When security and convenience conflict, choose security.
3. **Production-ready, not demo-ready.** Handle errors, validate input, check permissions, and write migrations. Do not leave `TODO` placeholders in code paths that ship.
4. **Smallest correct change.** Solve the task that was asked. Do not fix, rename, or reformat unrelated code.
5. **Honest over impressive.** Say "I don't know" or "I did not verify this" instead of guessing.

---

## 2. Do Not Hallucinate

Most bad changes come from confident guesses. Before you write or claim anything:

- **Read before you edit.** Open the files you are about to change and the files that call them. Never edit from memory of "how this probably looks."
- **Verify APIs before using them.** Libraries change between versions (Nuxt, Prisma, `nuxt-auth-utils`, Nuxt UI, Zod). Check `package.json` for the installed version, then check the type definitions in `node_modules` or the official docs for that version. If you cannot verify a function, option or config key exists, do not use it. Say so.
- **Never invent** file paths, scripts, environment variables, database columns, routes, or package names. If it is not in the repo or the docs you checked, it does not exist.
- **Check scripts before running them.** Read `package.json` `scripts` for the real commands. Do not assume `test`, `lint` or `typecheck` exist.
- **Never claim something works unless you ran it.** "Tests pass", "builds successfully" and "fixed" require actual command output from this session. If you could not run it, say "not run" and why.
- **Do not fabricate requirements.** If behaviour is not specified in the repo, `README.md`, or the task, **ask**. This applies especially to scoring and grading rules, permissions, and anything involving exam results. Do not invent business rules.
- **Do not guess at data.** Do not invent seed data, example IDs, or "typical" values and present them as real.
- **Quote evidence.** When reporting a finding or a fix, reference the file and line, or paste the command output that supports it.
- **When uncertain, stop and ask** one concrete question instead of choosing silently.

---

## 3. Do Not Over-Engineer

- **No speculative features.** Build only what the current task needs. Features in the README's "Deferred" list are out of scope unless explicitly requested.
- **No premature abstraction.** Do not introduce a base class, generic helper, plugin system, repository layer, or config option until the same code exists in at least three places. Duplicating a few lines is cheaper than the wrong abstraction.
- **No new dependencies by default.** Prefer the platform, Nuxt, Nitro, Prisma and the libraries already installed. A new dependency needs a one-line justification and approval (see Section 9).
- **Follow existing patterns.** Match the structure, naming and style already in the repo. Do not introduce a second way of doing something the codebase already does.
- **No architecture changes** (state libraries, microservices, queues, caching layers, ORMs, new frameworks) without explicit approval. The target is a single Nuxt app and one Postgres database.
- **No performance tuning without evidence.** Do not add caching, memoization, or denormalisation unless there is a measured problem. Add database indexes for columns used in lookups and foreign keys, and nothing fancier.
- **Prefer plain TypeScript.** Avoid advanced type gymnastics, deep generics, decorators, or metaprogramming. If a type needs more than a few lines to understand, simplify it.
- **Keep diffs small and reviewable.** One concern per change.

---

## 4. Security Rules (Non-Negotiable)

**Authentication and authorisation**

- Enforce roles and account status **on the server, in every protected handler** (for example with a shared `requireRole` helper). Route middleware in the browser is UX only and is never a security boundary.
- Teachers must have status `APPROVED` to use any teacher endpoint. Check status on each request, not only at login.
- **Check ownership.** A teacher may only read or change their own categories, questions, exams and results. Never trust an ID from the client without verifying it belongs to the current user.
- Students may only read their own attempts and results. Guest attempts are accessed only with that attempt's own unguessable token.

**Input and output**

- Validate **all** request bodies, params and query strings with Zod on the server. Reject unknown or malformed input.
- Use Prisma's query API. Do not build SQL by string concatenation. If raw SQL is truly needed, use parameterised queries and flag it for review.
- Return only the fields the client needs. Select explicitly instead of returning whole database rows.
- Never expose internal errors, stack traces, or SQL errors to clients. Return generic messages and log details server-side.
- Use unguessable identifiers (`cuid` or UUID) for anything exposed in URLs. Exam codes are public identifiers, not secrets.

**Secrets and data**

- Never commit secrets, `.env` files, tokens or real credentials. Use `.env.example` with empty values.
- Never log passwords, session secrets, tokens, or answer keys. Avoid logging personal data.
- Passwords are hashed with the library's provided hashing helper. Do not roll your own crypto.
- Sessions use secure, `HttpOnly`, `SameSite` cookies. Do not move session data into `localStorage`.

**Abuse resistance**

- Rate-limit login, registration and guest attempt creation.
- Limit request body sizes and list sizes (use pagination for list endpoints).

---

## 5. Exam Integrity Invariants

These must hold in every change that touches exams. A change that breaks one is a bug.

1. **The answer key never reaches the browser while an exam is in progress.** Do not send fields that reveal correct answers (for example `isCorrect` or matching targets) in any payload a student or guest can fetch before submission.
2. **The timer is server-controlled.** The deadline is computed and enforced on the server. Never trust a client-supplied time or elapsed value. Reject or auto-submit answers that arrive after the deadline.
3. **Exam content is snapshotted per attempt.** Edits to a question or exam after an attempt starts must not change that attempt.
4. **Autosave is safe to repeat.** Saving the same answer twice must not create duplicates or corrupt state. Resuming an attempt returns the same questions in the same order.
5. **Submitted attempts are immutable.** No answer changes after submission.
6. **Access setting is enforced server-side.** An exam's access mode (account only, guest only, both) is checked when an attempt is created, not just hidden in the UI.
7. **Scoring logic lives in one place** on the server and is covered by tests. If scoring rules are not documented in the repo, ask. Do not guess them.

---

## 6. Code Standards

- **TypeScript strict mode.** No `any` unless unavoidable, and then with a short comment explaining why. Prefer explicit types at module boundaries (API inputs and outputs).
- **Server code** lives in `server/`. Keep handlers thin: validate, authorise, call a small function, return. Put reusable logic in `server/utils/`.
- **Vue components:** Composition API with `<script setup lang="ts">`. Keep components small and single-purpose. Question types have separate Editor and Player components.
- **Naming:** clear, descriptive, consistent with the existing code. No abbreviations that need a glossary.
- **Comments explain why, not what.** Do not add comments that restate the code. Do not leave commented-out code.
- **Error handling:** handle expected failures explicitly and return correct HTTP status codes (400 validation, 401 unauthenticated, 403 forbidden, 404 not found, 409 conflict). Do not swallow errors silently.
- **No `console.log` debugging left behind.**
- **UI text:** keep user-facing strings easy to find and change, since the UI language is still undecided.
- **Accessibility and mobile:** most students use phones. Forms and exam screens must work on small touch screens and be keyboard accessible.

---

## 7. Database Rules

- **Schema changes go through Prisma migrations.** Never edit the database by hand or change `schema.prisma` without creating a migration.
- **Ask before** any migration that drops, renames, or retypes a column or table, or could lose data.
- Use **transactions** for multi-step writes that must succeed together (for example creating an exam with its questions, or submitting and grading an attempt).
- Add **indexes** for foreign keys and columns used in lookups and filters. Use `onDelete` behaviour deliberately.
- Never run destructive commands (`migrate reset`, dropping tables, truncating data) against any non-local database.
- Keep the seed script limited to the admin account and clearly labelled development data.

---

## 8. Commands

Use **Bun**. Do not use npm, yarn or pnpm, and do not commit their lockfiles.

```bash
bun install                  # install dependencies
bun run dev                  # start the dev server
bun run typecheck            # check TypeScript and Vue types
bun run lint                 # check code style with ESLint
bun run test                 # run the test suite
bunx prisma migrate dev      # create/apply a migration locally
bunx prisma db seed          # seed the admin account
```

The Nuxt scaffold provides `dev`, `build`, `generate`, `preview`, `test` and `postinstall` scripts. Read `package.json` for the real scripts before running commands; if a script is missing, say so. Do not invent it. Prisma commands apply only after the database issues add Prisma to the project.

---

## 9. Ask First

Stop and ask the human before:

- Adding or upgrading a dependency
- Changing the database schema in a way that affects existing data
- Changing authentication, session, or permission logic
- Changing the deployment setup or environment variables
- Deleting files or large amounts of code
- Doing anything the task did not explicitly request but that seems "obviously helpful"
- Any requirement that is ambiguous or missing

---

## 10. Never Do

- Never commit secrets, credentials or `.env` files.
- Never disable, weaken or bypass a security check, validation or test to make something pass.
- Never delete, skip or loosen a failing test to get a green result. Fix the cause or report it.
- Never mock away real behaviour to hide a failure.
- Never use `--no-verify`, force-push, or rewrite shared history.
- Never run destructive database commands against shared or production databases.
- Never claim work is done when it is partial. State clearly what is and is not complete.

---

## 11. Workflow for Coding Agents

1. **Understand.** Read the task and the relevant code. If anything is ambiguous, ask.
2. **Plan briefly.** State what you will change and which files are affected. Keep it short.
3. **Change minimally.** Follow existing patterns. Touch only what the task needs.
4. **Test.** Add or update tests for new logic, especially authorisation and exam integrity rules. Test the failure cases (wrong user, wrong role, invalid input), not just the happy path.
5. **Verify.** Run the typecheck, lint and tests that actually exist. Fix what you broke.
6. **Report.** Summarise what changed, what you ran and its result, what you did not verify, and any follow-ups or risks. Do not overstate.

**Done means:** the change works, passes the checks that exist, respects the invariants above, and introduces no unrelated changes.

**Commits:** small and focused, with a clear message describing what and why.

---

## 12. Guidelines for Review Agents

When reviewing code (a diff, a PR, or the existing codebase):

**Priorities, in order**

1. Security and authorisation: missing role or ownership checks, unvalidated input, leaked answer keys, secrets, unsafe queries
2. Correctness and exam integrity: broken invariants in Section 5, race conditions, data loss, wrong HTTP status handling
3. Data safety: risky migrations, missing transactions or indexes
4. Test coverage of risky logic
5. Simplicity: unnecessary abstraction, dependencies or complexity (see Section 3)
6. Readability and consistency

**How to review**

- **Verify before reporting.** Read the surrounding code and, when possible, reproduce the problem. Do not report a bug you have not confirmed.
- **Label confidence:** *Confirmed* (you verified it), *Likely* (strong reasoning, not run), or *Question* (you need information). Never present a guess as a fact.
- **Be specific:** reference file and line, explain the impact, and suggest the smallest fix.
- **Rate severity:** *Blocker* (security hole, data loss, broken invariant), *Should fix*, *Optional*.
- **Do not nitpick** formatting or personal style when a formatter or linter handles it.
- **Do not propose rewrites or new abstractions** unless the current design is actually causing a defect. Flag over-engineering in the change under review when you see it.
- **Say what you did not review** (for example "did not run the app" or "did not check migrations").
- If the change is fine, say so plainly. Do not invent issues to look thorough.

---

## 13. Communication Style

- Be concise and direct. Lead with the result.
- Distinguish clearly between what you verified, what you assumed, and what you did not check.
- Disagree when something is wrong, and explain why. Do not agree just to be agreeable.
- Ask one clear question at a time when you need input.
