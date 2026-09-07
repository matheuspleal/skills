# Rigor levels — the contract

Rigor answers one question: **how hard do you push the canon against this codebase?**

It is recorded once, in the plan's frontmatter, and then three modes read it. `design`
uses it to decide which sections the plan needs. `build` uses it to decide how code gets
written. `review` uses it as the yardstick for what counts as a finding — which is why
this file exists as a contract rather than as three adjectives. A reviewer without a
written standard raises whatever it happens to notice, and a loop built on that is a
taste generator.

The contract has a second half. Rigor says *how hard* you test; the **test profile** says
*which kinds* of test the project maintains. Both are resolved at `design` time, both are
written into the plan's frontmatter, and both bind `build` and `review`. See
[The test profile](#the-test-profile).

Read the section for the resolved level, plus the test-profile section. Reading all three
levels wastes context.

## Table of contents

- [How rigor gets resolved](#how-rigor-gets-resolved)
- [The test profile](#the-test-profile)
- [`adaptive` — mirror the project, hold a floor](#adaptive--mirror-the-project-hold-a-floor)
- [`balanced` — Clean Architecture + SOLID + Object Calisthenics](#balanced--clean-architecture--solid--object-calisthenics)
- [`strict` — the boilerplate is the standard](#strict--the-boilerplate-is-the-standard)
- [True at every level](#true-at-every-level)
- [Language fit](#language-fit)
- [Auto-detection heuristics](#auto-detection-heuristics)

---

## How rigor gets resolved

Precedence, highest first:

1. **Explicit token** on the invocation — `/staff-engineer design strict …`.
2. **`rigor:` in `staff-engineer-skill/config.yml`** — see `config.md`. When set, the question is not asked. This is the intended way to stop being asked every time.
3. **Auto-detection**, presented as a suggestion, then confirmed by the user.

Whatever wins is written to the plan's `rigor` key, and what detection *suggested* is
written to `rigor_detected`. When those two differ, the user deliberately steered away
from what the project looks like — that gap is signal, so it is preserved rather than
normalized away.

`build` and `review` read `rigor` from the plan and do not re-ask. The decision was made
at design time; re-litigating it mid-implementation would mean the plan is not the
contract, and everything downstream depends on it being one.

---

## The test profile

Rigor alone can't answer "should this phase have an end-to-end test?" — that depends on
whether the project maintains end-to-end tests at all, which is a standing decision about
the suite, not a judgment about this change. Teams differ on it for good reasons: an e2e
suite nobody keeps green is worse than none, and a contract test is only worth writing
when there's a second service on the other end.

So the profile is a separate axis: **rigor decides how hard, the profile decides which
kinds.** They compose. `strict` with a `[unit]` profile is a real configuration — TDD on
every phase, all of it at the unit level — and so is `adaptive` with `[unit, e2e]`, which
is what a legacy codebase with a smoke suite and no unit tests actually looks like.

### The vocabulary

A closed set, so a config value can be checked and a review finding can be ruled out of
scope by name.

**Backend**

| Type | What it covers |
|---|---|
| `unit` | Logic in isolation. No I/O, no real collaborators. |
| `integration` | One seam against one real dependency — a repository against a real DB, an adapter against a real broker. |
| `e2e` | The application through its own public entry point (HTTP, GraphQL, CLI) with real dependencies behind it. |
| `contract` | The agreement with another service, verified from both sides (Pact and kin). Only meaningful when a second service exists. |
| `load` | Throughput and latency under a stated load. Only meaningful against a stated target. |

**Frontend**

| Type | What it covers |
|---|---|
| `unit` | Pure logic — formatters, reducers, custom hooks, derived state. |
| `component` | A component through its rendered output, driven the way a user drives it (Testing Library). |
| `e2e` | A real browser through a real flow (Playwright, Cypress). |
| `a11y` | Automated accessibility assertions (axe and kin) over rendered output. |
| `visual` | Screenshot comparison. **This is the assertion for appearance** — CSS, class names, spacing, SVG coordinates are never asserted as strings. |

### Presets

The profile is normally chosen as a preset and expanded to a list. Presets exist so the
question has three answers instead of asking someone to compose a list from a table.

| Preset | Backend | Frontend |
|---|---|---|
| `minimal` | `unit` | `unit` |
| `standard` | `unit`, `integration` | `unit`, `component` |
| `full` | `unit`, `integration`, `e2e`, `contract` | `unit`, `component`, `e2e`, `a11y` |

Rigor supplies the default preset when nothing else does: `adaptive` → `minimal`,
`balanced` → `standard`, `strict` → `full`. That mapping is a starting point for the
question, not a rule — a user who picks `strict` and `minimal` has said something
coherent, and the skill records it rather than arguing.

Any explicit list overrides the preset. `[unit, integration, visual]` is valid; a type
outside the vocabulary is not — fall back to the preset for that stack and say which value
you rejected, in one line.

### Resolution

Precedence, highest first, resolved at `design` time alongside rigor:

1. **What the user says in the prompt** — "sem e2e", "quero contract tests com o serviço
   de pagamentos".
2. **`tests:` in `config.yml`** — see `config.md`. When set, the question is not asked.
3. **What the project already runs.** Detect it: test scripts in `package.json`, a
   `playwright.config.*` or `cypress.config.*`, `*.e2e.*` / `*.spec.*` naming, a
   testcontainers or docker-compose test service, an axe or Pact dependency. Detection
   produces a *suggestion*, exactly as it does for rigor.
4. **Ask**, offering the three presets with the detected one labeled.

The resolved value is written to the plan's frontmatter as an **expanded list**, never as
a preset name. A preset is a shorthand whose meaning could shift with a later version of
this skill; the plan is a contract and has to mean the same thing in six months.

### The profile never invents infrastructure

A type in the profile that the project has no runner for does not mean "silently scaffold
Playwright in phase 2". It means the plan owns that gap explicitly: either a phase that
stands the harness up, with its cost visible, or a note in *Risks & Trade-offs* that the
type is aspirational and nothing in this plan will use it. Adding a test framework is a
dependency commitment and often an ADR — it is not a side effect of a checkbox.

### What the profile does to `review`

**A test type absent from the profile is out of scope for findings — at every severity.**
Not a `blocker`, not a `nit`, not a footnote. The user declined that type; a reviewer that
asks for it anyway has overridden the decision by volume, which is the same failure the
`adaptive` scope rules exist to prevent.

What the profile does **not** do is excuse testing altogether. The level's own doctrine
still decides *whether* a surface needs a test; the profile only decides which kind is
available to cover it. Under `balanced`, a silent-failure surface shipped with no test of
any type in the profile is still a `blocker`.

Those two rules collide in exactly one place, and it is worth handling honestly: a surface
whose only sensible coverage is a type the profile excludes — cross-tenant isolation that
really needs an integration test in a `[unit]` project. That is not a finding. It is
evidence the profile is wrong for this work. Name it in one line in the review's *Clean*
section and let the user decide whether to widen the profile. Reviewing against a standard
the user explicitly declined is how a loop stops being trustworthy.

---

## `adaptive` — mirror the project, hold a floor

**You are a staff engineer dropped into someone else's codebase.** The conventions are
already there, they are internally consistent, and they are not what you would have
chosen. Fighting them produces a codebase with two conventions, which is worse than a
codebase with one mediocre convention. So you mirror what exists.

The failure mode of that instruction, taken alone, is that `adaptive` becomes a license
to be sloppy. It isn't. There is a floor, and the floor is short enough to hold in any
codebase, no matter how old:

1. **Don't make it worse than you found it.** If a module is currently clean of a
   dependency, don't be the change that introduces it. Spreading a bad pattern further
   is not "following the convention" — the convention already exists where it exists.
2. **No secrets in source, no string-concatenated queries with user input, no swallowed
   errors.** An empty `catch` is not a project convention; it's a silent failure waiting
   to be someone's on-call night.
3. **The suite stays green, and covered code stays covered.** If the file you touched had
   tests, it still has them and they still pass. If the project has no tests, you are not
   introducing a framework here.
4. **Honest names.** You match the project's naming style — including abbreviations and
   the project's language — but a name that lies (`data2`, `handleStuff` for a function
   that charges a card) is a defect at any rigor level.
5. **Scope discipline.** Touch what the phase needs. No drive-by reformatting, no
   reorganizing files the task didn't require. In a codebase without tests, an unrelated
   change is an unguarded change.

**Testing.** Only where the project already tests, or where a test is genuinely cheap and
pins something risky you're about to change. Feathers' characterization test is the
adaptive-correct move before touching untested high-risk behavior — that's not a rigor
upgrade, it's the cheapest way to not break production. Which *kinds* of test are on the
table is the plan's test profile, and at this level the profile is usually just a
description of what the project already runs.

**Architecture.** Don't impose DDD, don't impose layering, don't introduce value objects
into a codebase that passes primitives everywhere. One `Money` type in a system of
`number` cents creates two conventions and a translation layer nobody asked for.

### What `review` may raise under `adaptive`

- `blocker` — acceptance criteria unmet; a correctness bug; a security hole; a broken
  contract; the suite went red; a previously-covered path lost its coverage.
- `major` — a floor violation from the list above.
- `minor` — a cheap, local improvement inside the code the phase already touched.

### What `review` may **not** raise under `adaptive`

SOLID violations, Clean Architecture layering, Object Calisthenics smells, missing tests
in a project that doesn't test, a test of a type the plan's profile excludes, or "this
would be better as a value object." Not as a `nit`, not as a footnote — **out of scope
entirely**. The user chose this level precisely to buy silence on those, and a reviewer
that smuggles them back in as advice has overridden the user's decision by volume.

The place where the divergence gets recorded is the plan's *Risks & Trade-offs* section,
once, deliberately — and an ADR when the divergence is structural. That's the difference
between "the team knew and chose this" and "nobody noticed."

---

## `balanced` — Clean Architecture + SOLID + Object Calisthenics

The default for real work: a codebase you own and intend to keep. You apply the design
canon as **active standards**, and you apply the testing canon as **judgment**. Those two
halves are what separate this level from `strict` — the architecture bar is high, the
ceremony bar is not.

### Architecture — Clean Architecture as the dependency rule

The rule, not the folder structure: **source dependencies point inward, toward policy.**

- Domain and use-case code doesn't import infrastructure, frameworks, or transport. No
  ORM model in a business rule, no `req`/`res` below the controller, no SDK import in a
  domain file.
- **If the project has no layers at all**, the rule degrades to its useful minimum:
  business rules do not live in controllers, route handlers, React components, or
  serverless entry points. Extract the rule; leave the wiring where the framework wants it.
  `frontend-canon.md` works this out for a component tree, including the tell: when
  asserting a *rule* costs you four providers of test setup, the rule leaked into the view.
- Ports are defined by the side that *needs* them (the domain), implemented by the side
  that *has* the technology (infrastructure). A repository interface next to its Prisma
  implementation is an interface pointing the wrong way.

Full layering with four folders per bounded context is **not** required here. That's
`strict`. What's required is that the arrow points the right way.

### SOLID — as vocabulary, not as a checklist

- **SRP** by *actor*: two stakeholder groups with different reasons to change means two
  modules. "This class does two things" is not, by itself, a finding.
- **OCP** on the *second* variation, never the first. Building an extension point for a
  variation that doesn't exist yet is speculative generality — YAGNI wins that tie, every
  time.
- **LSP** matters wherever there's a subtype or a shared interface with divergent
  behavior. A "not supported" implementation that throws is the classic violation.
- **ISP** at the consumer boundary: a client that uses two methods shouldn't depend on
  an interface with nine.
- **DIP** at the I/O edge specifically. Business logic depends on an abstraction of the
  database, the clock, the network, and randomness. This is also what makes the code
  testable without mocking the universe.

### Object Calisthenics — as smells, by name

Bay wrote these as an exaggerated drill, not a style guide (see `principles.md`). At
`balanced`, four of them are worth acting on, and they earn it because they're tactical
DDD wearing different clothes:

| Rule | Real name | Weight here |
|---|---|---|
| 3 — wrap primitives | primitive obsession / Value Object | **active** — a validated concept crossing a boundary (money, email, document id, date range) wants a type |
| 4 — first-class collections | collection with behavior | **active** — when collection rules are being duplicated at call sites |
| 5 — one dot per line | Law of Demeter | **active** — reaching *through* objects; fluent chains and pipelines are fine |
| 9 — no getters/setters | Tell, Don't Ask | **active** — an object whose behavior lives in whoever reads its fields is a struct with ceremony |
| 1, 2, 6, 7, 8 | indentation, `else`, abbreviations, size, two fields | **advisory** — good instincts, arbitrary thresholds; rule 8 in particular produces wrapper classes that exist to satisfy rule 8 |

Cite the smell by its name — "primitive obsession", "Tell Don't Ask" — never by its
number. "Violates rule 8" persuades nobody, and shouldn't.

### Testing — test what fails silently

This is the half of `balanced` that keeps it usable day to day. The question is not
"is this covered?" but **"if this breaks, how do we find out?"**

**Test it when the failure is silent:**

- Domain logic — pure functions, value objects, validation, precedence rules, permissions.
- Security boundaries — tenancy, authorization, row-level access. A cross-tenant leak
  raises no error and fails no type check. Nothing else catches it.
- Contracts between layers — a database enum against the code that reasons about it, key
  parity across i18n catalogues, a serialization format two services share.

**Don't test it when the failure is loud:**

- That the platform works — the framework's routing, the HTTP client, `Intl`, the ORM.
- Rendered appearance — CSS, class names, SVG coordinates, z-index. A screenshot is the
  assertion for those, not an equality check on a string.
- The shape of a config object or a constants file.

**A structural constraint is lint, not a test.** "Never import X here", "never hardcode
Y" belongs in an ESLint rule (`no-restricted-imports`, `no-restricted-syntax`) or its
equivalent. It fails in the editor while the line is being typed, instead of minutes
later in a runner — and it can't be deleted by someone who "fixed the failing test."

TDD ordering is available but **not mandatory** at this level. Test-first is the better
loop when the design is unclear; test-after is honest when the shape was obvious. What
matters is that the test exists where the doctrine above says it should, and that it
pins behavior through a public interface rather than mirroring internals.

The doctrine above decides **whether** a surface gets a test. The plan's test profile
decides **which kind** is available to cover it — and it is the profile, not this
doctrine, that answers "does this project do e2e?"

### What `review` may raise under `balanced`

- `blocker` — acceptance criteria unmet; correctness; security; broken contract; suite
  red; a silent-failure surface from the list above shipped with no test at all.
- `major` — dependency rule violated (domain importing infrastructure, business rule
  inside a controller/component); primitive obsession on a validated concept that crosses
  a boundary; an abstraction that inverts the dependency arrow; a test that asserts
  implementation instead of behavior; a structural rule enforced by a test where lint
  is the right tool.
- `minor` — other Calisthenics smells, local duplication, naming, a missing edge case.
- `nit` — taste. One line, no action.

### What `review` may **not** raise under `balanced`

Missing aggregates, missing `Either`-style error returns, missing domain events, missing
four-layer folder structure, or "this doesn't match the boilerplate." Those belong to
`strict`. Raising them here is scope the user explicitly did not buy.

Nor a test of a type the plan's profile excludes — a missing e2e in a
`[unit, integration]` project is not a finding at any severity. If the surface genuinely
can't be covered by anything in the profile, that's a note in the *Clean* section for the
user to weigh, not a `blocker` (see [The test profile](#the-test-profile)).

---

## `strict` — the boilerplate is the standard

Full canon, with a concrete reference implementation instead of a book quote. For
**backend**, `matheuspleal/node-js-boilerplate` is the source of truth — read
`backend-canon.md` for when to fetch it and what to pull. For **frontend**, read
`frontend-canon.md`; there is no reference repo, so its authority is community consensus
plus the installed version's docs, and it says so. Don't cite the two with equal
confidence — one is checkable against code, the other against judgment.

What `strict` adds on top of everything in `balanced`:

- **TDD is the loop, not a preference.** Red before green, every phase, no production
  line without a failing test that demanded it. A test written after the fact may test
  the same thing, but it didn't get to shape the design, and that's what the discipline
  is actually buying.
- **DDD tactical patterns where the domain warrants them.** Aggregate roots that enforce
  their own invariants; value objects with validated `create()` and `reconstitute()`;
  domain events dispatched *after* persistence; repositories over aggregate roots;
  specifications for composable rules.
- **Four layers per bounded context** — `domain/`, `application/`, `infrastructure/`,
  `presentation/` — plus explicit wiring in factories rather than a DI container.
- **Explicit error handling** — `Either<Error, Result>` over thrown control flow, so the
  failure path is in the type and the caller can't forget it.
- **Test layout** — fast isolated unit specs, plus, for the seams that matter, whichever
  higher-level types the plan's profile carries. `full` is the default profile here, but a
  `strict` plan with a narrower profile is coherent and binding: TDD applies to every type
  in the profile and demands nothing outside it.

The one honest exception: **don't manufacture a domain that isn't there.** Genuine CRUD
and thin glue have no invariants to protect, and wrapping them in an aggregate produces
four layers of plumbing around a single `UPDATE`. `strict` means rigor, not ceremony —
YAGNI still applies inside a clean architecture, and Martin's own failure mode for this
style is layers with no policy in them.

### What `review` may raise under `strict`

Everything from `balanced`, plus:

- `blocker` — production code written with no failing test that preceded it; an invariant
  enforced outside its aggregate root; a domain event dispatched inside the transaction
  that persists the aggregate.
- `major` — new code that diverges from a boilerplate pattern without a recorded reason;
  a thrown error where the codebase uses `Either`; a repository that leaks persistence
  types past the application layer; a value object bypassed with a raw primitive.

When the boilerplate couldn't be fetched (no network), say so in the finding rather than
asserting a convention from memory. An unverified claim about someone's repo, delivered
with confidence, is exactly the failure this skill's *verify, don't recall* rule exists
to prevent.

---

## True at every level

Rigor changes the standard, not the honesty. These hold at `adaptive` as much as at
`strict`:

- **The plan is the contract.** If reality breaks the plan, update the plan first.
- **Trade-offs are named, with a reversal signal.** "We chose X over Y because Z; reverse
  if W." A trade-off with no falsifier is a preference with a citation stapled to it.
- **ADRs are orthogonal to rigor.** The significance gate decides, not the level. An
  `adaptive` plan that consciously follows a legacy convention has made an architecturally
  significant decision, and it's often the most valuable ADR in the repo.
- **Verify, don't recall.** Read the installed version before writing against an API.
- **The suite is never left red**, and commits stay atomic and conventional.
- **`review` never writes code, at any level.** It writes findings; `build` fixes them.

---

## Language fit

The design canon is class-oriented and doesn't port uniformly.

In Go, Rust, Elixir, or a functional TypeScript codebase, Calisthenics rules 8 and 9 have
no referent — a Go struct with exported fields plus functions over it *is* idiomatic, and
"no getters" is meaningless where there are none. Rule 3 ports well (newtypes, branded
types, opaque types) and is usually the one worth carrying.

The dependency rule ports everywhere. It's about the direction of imports, not about
objects.

Applying OO calisthenics to non-OO code is cargo cult, and a finding built on it is
indefensible. If the level's checklist doesn't translate to the language in front of you,
say so in the review rather than forcing it.

---

## Auto-detection heuristics

Used only to form a *suggestion* **for rigor**, when neither a token nor a config value is
present. The test profile has its own detection list in
[The test profile](#the-test-profile); the two run off mostly the same reads, so do them
together. Keep it cheap — a few reads, not a full audit.

| Signal | Where to look |
|---|---|
| Test suite wired up | `package.json` / `pyproject.toml` / build config; a test directory with actual tests in it |
| Layered structure | `domain/`, `application/`, `infrastructure/`, `presentation/`, `usecases/`, `adapters/`, or equivalent |
| Enforcement | lint config, commit hooks (Husky, pre-commit, lefthook), CI running the suite |
| Type discipline | static types on, `strict` flags enabled |

Map to a suggestion:

- **Solid tests + clean layering** → suggest `strict`. Match the bar the project already holds.
- **No tests, tangled or ad-hoc structure, legacy** → suggest `adaptive`. Don't boil the ocean.
- **Greenfield, or mixed signals** (some tests, no layers) → suggest `balanced`.

Present all three regardless of what you detected, each with a one-line rationale, and
label the detected one. The user owns this call; you only bring evidence to it.
