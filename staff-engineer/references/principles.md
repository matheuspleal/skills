# Principles reference

A working summary of the canon this skill leans on. Read the section that matches the decision you're about to make, not the whole file.

## Table of contents

- [TDD — Test-Driven Development](#tdd--test-driven-development)
- [DDD — Domain-Driven Design](#ddd--domain-driven-design)
- [Clean Architecture and the dependency rule](#clean-architecture-and-the-dependency-rule)
- [SOLID](#solid)
- [YAGNI / KISS / DRY — the trade-off triangle](#yagni--kiss--dry--the-trade-off-triangle)
- [Working with legacy code](#working-with-legacy-code)
- [Patterns to reach for sparingly](#patterns-to-reach-for-sparingly)

---

## TDD — Test-Driven Development

**Canonical sources:** Kent Beck, *Test-Driven Development: By Example* (2002); Steve Freeman & Nat Pryce, *Growing Object-Oriented Software, Guided by Tests* (2009).

### The loop

1. **Red** — write the smallest failing test that encodes the next bit of behavior. Run it. Confirm it fails for the right reason (not a typo, not a missing import).
2. **Green** — write the smallest change that makes the test pass. "Smallest" really does mean smallest: hard-code the answer if that's all the test demands. The next test will force the generalization.
3. **Refactor** — with a green bar, improve the code: rename, dedupe duplication that *hurts*, extract when the abstraction has earned its keep. Re-run tests.

### Two schools

- **Detroit / classicist (Beck).** Test through real collaborators where practical. Mocks for awkward dependencies (clocks, network, filesystems). Tests pin behavior, not structure.
- **London / mockist (Freeman & Pryce).** Outside-in. Mock collaborators to drive the design of new objects. Each unit test asserts a single role's behavior. Good for greenfield with clear protocols.

Neither is universally right. Use Detroit-style for code with rich state and real collaborators worth exercising; use London-style when designing new abstractions and you want the test to drive interface shape.

### Things that go wrong

- **Tests that lock in implementation.** If a refactor that doesn't change behavior breaks the tests, the tests are testing the wrong thing. Test through public interfaces.
- **Mock-heavy tests that pass forever.** When every collaborator is mocked, the test asserts that the unit calls a list of method names. That's not behavior; that's a transcription.
- **Over-large red steps.** Writing twelve assertions before going green means you're really writing a feature, not a test. Smaller bites.

### When TDD is the wrong tool

- Spike code you intend to throw away.
- Pure exploration of a library or API where you don't yet know what behavior you want.
- Visual / pixel-level UI work where the human eye is the assertion.

In these cases, write the spike, then **rewrite under TDD** for the keeper.

---

## DDD — Domain-Driven Design

**Canonical sources:** Eric Evans, *Domain-Driven Design* (2003) — the "blue book"; Vaughn Vernon, *Implementing Domain-Driven Design* (2013) — the "red book".

DDD has two halves. They're often confused.

### Strategic DDD (Evans Part IV)

About **carving up the system** to match the business.

- **Ubiquitous Language.** A shared vocabulary between developers and domain experts. Every name in the code should appear in conversation with the business, and vice versa. Drift between the two is a defect.
- **Bounded Context.** A boundary inside which the language is consistent. The same word (e.g. "Order") may mean different things in different contexts; that's fine, as long as each context is internally coherent.
- **Context Map.** How bounded contexts relate: shared kernel, customer-supplier, conformist, anti-corruption layer, open-host service. Pick the relationship that protects each context's integrity at acceptable cost.
- **Core, Supporting, Generic Subdomains.** Spend your best engineers on the core domain (the differentiator). Buy or copy supporting and generic subdomains. Don't build a custom auth system if auth is generic for you.

Strategic DDD is what most projects need first. Many "DDD" implementations are tactical-pattern theater on a system that hasn't been carved up properly.

### Tactical DDD (Vernon)

About **modeling within a single bounded context**.

- **Entity** — has identity and a lifecycle. Two entities with the same attributes are not equal; they're distinct because of their identity.
- **Value Object** — defined by its attributes; immutable; equality by value. Money, Email, DateRange. Rich value objects > primitive obsession.
- **Aggregate** — a cluster of entities and value objects with a single root. The root enforces invariants. External code holds references only to the root. Aggregates are the unit of consistency: one transaction, one aggregate (Vernon's rule of thumb).
- **Repository** — collection-like interface for retrieving aggregate roots. Hides persistence.
- **Domain Event** — a fact about the domain that happened (`OrderPlaced`, `PaymentCaptured`). Past tense. Useful for cross-aggregate integration without making the source aggregate know its consumers.
- **Domain Service** — operations that don't naturally belong on a single entity. Use sparingly; they're often a sign you missed a value object.

### When DDD is overkill

- CRUD with no real domain logic. A blog admin form is not a place for aggregate roots.
- Reporting and analytics over flat data. The relational model is the model.
- Thin glue between two systems with no business rules of their own.

In these cases, the cost of DDD ceremony exceeds the benefit. Note this as a YAGNI trade-off in the plan.

---

## Clean Architecture and the dependency rule

**Canonical sources:** Robert C. Martin, *Clean Architecture* (2017); the original "Clean Architecture" blog post (2012).

### The dependency rule

Source code dependencies point **inward**, toward higher-level policy.

- **Entities** — enterprise-wide business rules. Know nothing about anything else.
- **Use Cases** — application-specific business rules. Know about entities. Don't know about UI, DB, or frameworks.
- **Interface Adapters** — translate between use cases and the outside world. Controllers, presenters, gateways.
- **Frameworks & Drivers** — UI, DB, web, devices. The outermost ring; everything depends on these the least.

The point is **isolation of policy from mechanism**. The business rules don't care whether you're on Postgres or Mongo, REST or gRPC, React or CLI. You can swap the outer rings.

### Hexagonal / Ports & Adapters (Cockburn, 2005)

Same idea, different vocabulary:
- **Ports** — interfaces defined by the domain (driving ports for inbound, driven ports for outbound).
- **Adapters** — implementations that connect ports to specific technologies.

The dependency rule says: domain defines the port, infrastructure implements the adapter. The arrow points into the hexagon.

### When Clean Architecture is overkill

- Scripts and one-shots.
- Prototypes meant to be thrown away.
- Apps where the framework *is* the application (a thin CRUD admin around an ORM that will never grow).

Clean Architecture pays for itself when the domain has staying power and the outer rings (DBs, frameworks, channels) are likely to change. If the framework will outlive your business rules, the layers are inverted overhead.

### Common failure mode

"Clean Architecture" implementations that have four layers, six DTOs per use case, and no actual business logic anywhere — just plumbing. The layers are scaffolding for *real domain logic*. If there's nothing in the entities, the layers are noise.

---

## SOLID

**Canonical source:** Robert C. Martin's papers, collected in *Clean Architecture* and *Agile Principles, Patterns, and Practices*.

- **S — Single Responsibility.** A module has one reason to change. The modern phrasing: a module should be answerable to one *actor* (one stakeholder group). Two actors → two modules.
- **O — Open/Closed.** Open for extension, closed for modification. Achieved via polymorphism / strategy / plugin points. **Don't pre-build extension points** — apply OCP when the second variation arrives, not the first.
- **L — Liskov Substitution.** Subtypes must be usable wherever their parents are, without surprises. Violated by `Square extends Rectangle` and friends.
- **I — Interface Segregation.** Many small client-specific interfaces beat one fat one. Each client depends only on what it uses.
- **D — Dependency Inversion.** High-level modules don't depend on low-level modules; both depend on abstractions. The dependency-rule arrow.

SOLID is a *vocabulary for trade-offs*, not a checklist. "Violates SRP" is rarely true on its own — it depends on what counts as "one reason to change" in your context.

---

## YAGNI / KISS / DRY — the trade-off triangle

These three are the most-cited and most-misapplied principles in software. They pull in different directions; the staff engineer's job is to know which way to lean *here*.

### YAGNI — You Aren't Gonna Need It

**Source:** Extreme Programming community; popularized by Ron Jeffries and Martin Fowler.

Don't build for hypothetical future requirements. Speculative generality is one of the costliest forms of technical debt because it's *invisible* — the code looks fine; it's just doing more than it needs to. Add the seam when the second use case arrives.

### KISS — Keep It Simple, Stupid

**Source:** Kelly Johnson, Lockheed Skunk Works, 1960s.

Optimize for the simplest design that solves the problem. Two short, clear functions usually beat one clever generalized one. Simple isn't easy — finding the simple design is the hard part.

### DRY — Don't Repeat Yourself

**Source:** Andy Hunt & Dave Thomas, *The Pragmatic Programmer* (1999).

The original phrasing: "Every piece of knowledge must have a single, unambiguous, authoritative representation." That's about *knowledge*, not lines of code. Two functions that look alike but encode different concepts are not duplication — they're coincidence.

### The tensions

- **YAGNI vs. extensibility.** When in doubt, lean YAGNI. The cost of adding the seam later is almost always lower than the cost of carrying speculative abstractions in the meantime.
- **KISS vs. DRY.** Sandi Metz's "Wrong Abstraction" essay (2016): *duplication is far cheaper than the wrong abstraction*. Tolerate duplication until the shape of the abstraction is clear; then extract.
- **DRY vs. coupling.** Forced DRY across modules creates coupling that bites later. Two modules that happen to compute similar things can stay separate.

Whenever a plan or a refactor invokes one of these, the *Risks & Trade-offs* section should name the tension and the reason for the choice.

---

## Working with legacy code

**Canonical source:** Michael Feathers, *Working Effectively with Legacy Code* (2004).

Feathers' working definition: *legacy code is code without tests*. Adding a test is the on-ramp.

### Key tools

- **Characterization tests** — tests that capture *what the code currently does*, not what it should do. The first step to safely changing legacy code is locking in current behavior, including bugs. Then you can refactor.
- **Seams** — places where you can change behavior without editing the file. Usually introduced via dependency injection, subclassing, or a function-pointer indirection. The whole catalog in the book is variations on "find a seam, exploit it."
- **Sprout method / sprout class** — when adding new behavior, write it in a new method/class with its own tests, called from the legacy code. Don't try to test the legacy first; bridge from new (tested) code into old (untested) code.
- **Wrap method / wrap class** — replace a call site with a wrapper that adds the new behavior. Old behavior preserved exactly; new behavior tested in isolation.

### When to use

Any time you're modifying code that lacks tests. The risk of changing untested code is silent regression. Feathers' techniques limit the blast radius.

---

## Patterns to reach for sparingly

The Gang of Four book taught a generation of programmers to apply patterns as a checklist. The literature since has been a long correction. A pattern earns its place when:

1. The problem the pattern solves is actually present.
2. The cost of the pattern is less than the cost of not having it.
3. A simpler design has been considered and rejected with a reason.

Common over-reach:

- **Factories** layered over a constructor that does the same thing. If `new Foo()` works, you don't need `FooFactory.create()`.
- **Strategy** with one strategy. The seam isn't free; pay for it when the second strategy arrives.
- **Repository** over a single `findById` query. The repository pattern earns its keep when the persistence layer is genuinely complex or when you want to swap it; for a thin DAO, it's noise.
- **Observer / EventEmitter** when a direct call would do. Decoupling has a cost: traceability. Use events when the source genuinely shouldn't know its consumers.

When citing a pattern in a plan, also explain why the simpler alternative wasn't enough. That sentence is the one that convinces the reader.
