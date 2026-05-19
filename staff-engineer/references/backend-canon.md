# Backend canon — `strict` rigor source of truth

Read this **only when resolved rigor is `strict`**. It tells you how to use the
`node-js-boilerplate` as the authoritative reference for backend work, and what
to do for frontend (no reference project yet).

The repo is the source of truth, not this file. This file does not copy the
repo's code — copies rot. It tells you *when* to look, *what* to pull, and
*how* to degrade when you can't reach it.

---

## The reference project

**`https://github.com/matheuspleal/node-js-boilerplate`** — a production-grade
TypeScript backend implementing Clean Architecture + DDD + TDD. Use it as the
concrete pattern bank whenever a `strict` plan or `dev` phase touches backend.

Stack baseline (for orientation; verify against the repo, versions move):
TypeScript / Node, Fastify (REST) + Apollo Server (GraphQL), Prisma + Postgres,
Vitest + Supertest + faker, JWT + bcrypt, Husky + commitlint + semantic-release,
ESLint + Prettier.

Layering — four layers **per bounded context** under `src/modules/<context>/`,
plus the same split for cross-cutting code under `src/core/`, and manual
dependency wiring under `src/main/factories/`:

- `domain/` — entities, aggregate roots, value objects, domain events,
  specifications. Zero external dependencies.
- `application/` — use cases, repository/gateway contracts, mappers, subscribers.
- `infrastructure/` — Prisma repositories, gateway adapters (JWT, bcrypt).
- `presentation/` — controllers, presenters, validators.

Recurring patterns to honor: `Either<Error, Result>` for explicit error handling
(no thrown control flow); `AggregateRoot` + domain events dispatched
*after* persistence; value objects with validated `create()` and
`reconstitute()`; the specification pattern (`.and()` / `.or()` / `.not()`);
`WatchedList` for collection deltas; manual factory DI (no container); fluent
validator builders in controllers. Tests: unit `*.spec.ts` (fast, isolated),
e2e `*.e2e.ts` (spins a Docker DB). Conventional commits, enforced by commitlint.

---

## When to WebFetch the repo

Fetch on demand — don't fetch speculatively, and don't fetch more than the
decision in front of you needs. Good triggers:

- Writing a `strict` plan's *Architecture Decisions* / *Domain Model* /
  *Test Strategy* section for backend → fetch to ground the layering, the
  aggregate/value-object conventions, and the test layout in how the repo
  actually does it.
- A `strict` `dev` phase introduces a new bounded context, aggregate, use case,
  repository, gateway, controller, or test file → fetch the closest existing
  example and mirror its structure before writing.
- You're unsure how the repo wires a specific concern (events post-persistence,
  factory composition, validator chains, e2e DB setup) → fetch the specific
  file/dir rather than guessing.

Prefer narrow fetches. Point `WebFetch` at the directory or file you need
(GitHub renders `tree`/`blob` URLs), and ask a specific question — e.g. *"show
the Users bounded context folder structure and the SignUp use case: file
layout, Either usage, how the controller validates input"* — not *"explain the
whole repo"*. The 15-minute response cache makes repeated narrow fetches cheap
within a session.

## When the fetch fails (no network / unreachable)

`strict` does not stall on a network error. Proceed from the canon you already
know — Clean Architecture (Martin), DDD strategic + tactical (Evans, Vernon),
TDD (Beck), legacy seams (Feathers) — applying the layering and patterns
described above. Then record the gap honestly: add a line to the plan's
*Risks & Trade-offs* (plan mode) or tell the user (dev mode) that the
`node-js-boilerplate` could not be reached, so concrete repo conventions were
not verified and the implementation follows general canon — flag specifics
(naming, factory wiring, exact folder names) as needing a later reconciliation
pass against the repo.

---

## Frontend (`strict`, no reference project)

There is no reference repo for frontend yet. In `strict`, apply current
community/industry best practices and say so explicitly in the plan:
component-driven structure with clear separation of view / state / data-access;
typed APIs and typed component contracts; colocated tests (Testing Library +
the project's runner) covering behavior, not implementation; accessibility as a
default, not a phase; data fetching/caching via an established library rather
than hand-rolled effects; state kept as local as the use case allows. Note in
*Risks & Trade-offs* that frontend rigor rests on community consensus, not a
pinned in-house source of truth, so conventions are open to the user's
direction.
