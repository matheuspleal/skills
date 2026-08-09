# Rigor levels — the contract

Rigor answers one question: **how hard do you push the canon against this codebase?**

It is recorded once, in the plan's frontmatter, and then three modes read it. `design`
uses it to decide which sections the plan needs. `build` uses it to decide how code gets
written. `review` uses it as the yardstick for what counts as a finding — which is why
this file exists as a contract rather than as three adjectives. A reviewer without a
written standard raises whatever it happens to notice, and a loop built on that is a
taste generator.

Read the section for the resolved level. Reading all three wastes context.

## Table of contents

- [How rigor gets resolved](#how-rigor-gets-resolved)
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
upgrade, it's the cheapest way to not break production.

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
in a project that doesn't test, or "this would be better as a value object." Not as a
`nit`, not as a footnote — **out of scope entirely**. The user chose this level precisely
to buy silence on those, and a reviewer that smuggles them back in as advice has
overridden the user's decision by volume.

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

---

## `strict` — the boilerplate is the standard

Full canon, with a concrete reference implementation instead of a book quote. For
**backend**, `matheuspleal/node-js-boilerplate` is the source of truth — read
`backend-canon.md` for when to fetch it and what to pull. For **frontend**, there is no
reference repo yet, so it's current community practice, stated explicitly as such.

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
- **Test layout** — fast isolated unit specs, plus e2e against a real dependency for the
  seams that matter.

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

Used only to form a *suggestion* when neither a token nor a config value is present. Keep
it cheap — a few reads, not a full audit.

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
