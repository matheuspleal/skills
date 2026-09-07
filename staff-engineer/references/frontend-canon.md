# Frontend canon — React and Next.js

Read this whenever a plan, a build phase, or a review touches frontend code — **at any
rigor level**, not only `strict`. Rigor decides how hard the standards below bind; it
doesn't decide whether the framework has conventions.

Covers **React** and **Next.js**. Another framework in the repo means this file's baseline
still applies (it's about testing through the accessibility tree and keeping rules out of
the view) while the framework-specific sections don't — say so rather than translating
React advice into Angular by analogy.

## Where this standard comes from

There is no in-house reference repository for frontend, the way `node-js-boilerplate` is
the source of truth for backend (`backend-canon.md`). The standard here is **community
consensus plus the documentation of the version the project actually installs**, and that
difference is worth stating out loud in the plan's *Risks & Trade-offs*: backend
conventions can be checked against a repo, frontend conventions are checked against docs
and judgment, so they are more open to the user's direction.

Which makes *verify, don't recall* load-bearing here. React and Next.js have moved
significantly and repeatedly; advice that was correct two majors ago still feels correct.
Read the installed version first, then check the docs for that version
(`live-docs.md` — Context7 is the fast path).

**When you can't reach the docs**, apply the baseline below, say in one line that the
version-specific conventions weren't verified, and flag anything version-sensitive
(App Router behavior, testing-tool support) as needing a reconciliation pass.

## Table of contents

- [Detection — what are we actually working with](#detection--what-are-we-actually-working-with)
- [The baseline — true regardless of framework](#the-baseline--true-regardless-of-framework)
- [The dependency rule in a component tree](#the-dependency-rule-in-a-component-tree)
- [React](#react)
- [Next.js — the App Router](#nextjs--the-app-router)
- [Profile types, in frontend terms](#profile-types-in-frontend-terms)
- [What `review` may raise](#what-review-may-raise)

---

## Detection — what are we actually working with

Cheap reads, before any advice:

| Question | Where to look |
|---|---|
| Framework and major version | `package.json` dependencies, then the lockfile for what's *installed* — the range in `package.json` is a wish, the lockfile is a fact |
| Next.js routing model | an `app/` directory → App Router; `pages/` only → Pages Router; both → a migration in progress, and that's context the plan needs |
| Test runner | `vitest.config.*`, `jest.config.*`, or the `test` script |
| Component testing | `@testing-library/react` in devDependencies |
| Browser tests | `playwright.config.*`, `cypress.config.*` |
| Accessibility tests | `jest-axe`, `@axe-core/playwright`, `vitest-axe` |
| Visual tests | a screenshot toolchain — Playwright snapshots, Chromatic, Percy |

The last four rows are also the test-profile detection for frontend (`rigor-levels.md`).
Run them once and use them for both.

`config.tests.frontend.framework` overrides detection — set it when the repo holds more
than one app, which is exactly when guessing from a root `package.json` goes wrong.

---

## The baseline — true regardless of framework

**Test through the accessibility tree.** Testing Library's query priority is
role → label → text → …, with `data-testid` as the last resort
[verified: testing-library.com, "About Queries — Priority", accessed 2026-09-07]. This
isn't style. A query by role only passes if the element is reachable the way a user
reaches it, so every behavioral assertion carries a free accessibility assertion. A
`data-testid` passes whether or not the button is a `<div>` with no name.

Reach for `data-testid` when there is genuinely no accessible handle — a chart canvas, a
layout region with no semantic role. Reaching for it because the role query failed is the
test telling you the markup has an accessibility bug.

**Never assert appearance as a string.** `className`, computed CSS, SVG coordinates,
z-index, spacing. These assertions break on every refactor and pass while the page renders
unusably. Appearance is asserted by the `visual` type — a screenshot — or not at all.

**Drive the DOM like a browser does.** `user-event` over `fireEvent`: a real click focuses,
blurs, fires pointer events and respects `disabled`; `fireEvent.click` dispatches one event
and lets tests pass on things a user can't actually do.

**Wait, don't sleep.** `findBy*` and `waitFor` for anything asynchronous. An
"update not wrapped in act" warning means the test finished while a state update was still
in flight [verified: React Testing Library FAQ, accessed 2026-09-07]; the fix is awaiting
the result or removing the async work, never silencing the warning.

**Snapshots are not behavioral assertions.** A snapshot asserts everything, which means it
communicates nothing about what matters, fails on every intentional change, and gets
blanket-updated until it asserts nothing at all. Narrow snapshots of serialized *data* are
fine; a snapshot of a rendered tree standing in for "this component works" is not.

**Mock at the network boundary, not the module boundary.** MSW-style request interception
keeps the test coupled to the HTTP contract, which is real. Mocking the data-fetching
library couples every test to a dependency choice, and the suite has to be rewritten when
that choice changes — which is precisely the coupling the tests were supposed to protect
against.

**Don't mock the framework.** A test that stubs the router, the image component, or the
link component to make itself pass is testing a fiction. If the component can't be
rendered without heavy framework wiring, that's the dependency rule talking — see below.

---

## The dependency rule in a component tree

`balanced` states the rule as *source dependencies point inward, toward policy*, and adds
that where a project has no layers it degrades to: **business rules do not live in
controllers, route handlers, React components, or serverless entry points**
(`rigor-levels.md`). This section is that rule, made concrete for a component tree.

**A component is transport.** It's the same role a controller plays on the backend: turn
input into a call, turn a result into output. Pricing rules, permission logic, eligibility
checks, retry policy and state machines are policy, and policy belongs in a plain module a
test can call without rendering anything.

**The seam is a plain function or a custom hook.** Extracting the rule gives you two
cheap tests instead of one expensive one: the rule as `unit`, the wiring as `component`.

**The signal is in the test setup.** When asserting a discount calculation requires a
router provider, a query client, a theme provider and two mocked contexts, the setup is
telling you the calculation is in the wrong place. Providers in a test are the cost of
rendering the view; when they're the cost of reaching a *rule*, the rule leaked into the
view.

That signal is worth naming as a finding under `balanced` and `strict`, and it is the
single most useful thing this file contributes — most frontend test pain is a design
problem wearing a testing costume.

---

## React

**Test the component's public behavior.** What a user does and what they then see. Not
internal state, not which hooks fired, not how many times something re-rendered.
Performance is measured with a profiler, not asserted in a unit test.

**Custom hooks.** Prefer testing a hook through a component that uses it — that's how it
will actually be consumed, and it keeps the test honest about integration. Reach for
`renderHook` when the hook is genuinely a reusable primitive with logic of its own; using
it for every hook reproduces exactly the mirroring-internals problem tests are meant to
avoid.

**Context.** Render with the real provider. Mocking the context to inject a value tests
your mock; wrapping with the real provider and seeding it tests the thing that ships.

**Data fetching belongs to an established library** — cache, retry, dedup, invalidation
are solved and hand-rolled `useEffect` fetching gets the edge cases wrong quietly (double
fetch in development, race between two responses, no cancellation on unmount). This is a
dependency commitment and often an ADR, so it belongs in the plan rather than appearing in
a phase.

**State as local as the use case allows.** Lift when a second consumer genuinely appears,
not in anticipation. This is OCP-on-the-second-variation applied to state, and the reversal
cost is low, so YAGNI wins the tie.

**Typed component contracts.** Props are a public interface. `any` on a prop is the same
smell as `any` on a function signature, and optional props with silent defaults hide
required decisions from callers.

---

## Next.js — the App Router

Detect the routing model first; the guidance below is App Router. A Pages Router codebase
is a different (and simpler) testing story, and a repo with both is mid-migration — say so
in the plan rather than pretending it's one thing.

### The boundary that matters is server vs. client

`'use client'` is the real architectural line in a Next.js app, and it's more consequential
than folder structure: it decides what runs where, what can hold state, and — the part
that changes the plan — **what can be tested at all**.

### Async Server Components can't be unit-tested

This is the constraint to design around, not discover in review.

Async Server Components are **not supported** by Vitest, by Jest, or by Cypress component
testing. Next.js's own testing guides say so in each case and recommend **end-to-end tests
for async components**
[verified: nextjs.org — "Testing: Vitest", "Testing: Jest", "Testing: Cypress" App Router
guides, accessed 2026-09-07]. Synchronous Server Components and Client Components unit-test
normally.

The consequence lands on the test profile, and it is the clearest real example of the gate-3
escape valve in `review-mode.md`:

> **If the app carries behavior inside async Server Components and the profile has no
> `e2e`, that behavior cannot be covered.** Say it at `design` time, in *Test Strategy* —
> either widen the profile, or move the logic out of the async component and into a plain
> module the `unit` type can reach.

The second option is usually the better engineering answer regardless, because it's the
dependency rule again: an async Server Component that awaits data *and* decides policy is
a controller with business logic in it. Split it, and the untestable half becomes trivial.

Verify this against the installed version before writing it into a plan — tool support
here is exactly the kind of thing that changes between majors, and asserting a limitation
that has since been fixed is as wrong as missing one that hasn't.

### Route handlers and Server Actions are entry points, not components

A `route.ts` handler and a Server Action are the application's public surface — the same
role a controller plays on the backend. Test them the way you'd test a backend entry point:
call them with a request and assert the response and the effect, as `integration`. Rendering
has nothing to do with it.

They also inherit the backend rules that matter: input validated at the edge, authorization
checked in the handler and not in the component that calls it, errors returned rather than
thrown into a framework boundary that swallows them.

### Server-side fetches in tests

When an e2e test needs to control what the server fetched, Next.js ships a Playwright test
mode that intercepts server-side fetches
[verified: nextjs.org — `next/experimental/testmode/playwright`, accessed 2026-09-07]. It
is experimental; treat the dependency accordingly and don't build a suite's foundation on
it without saying so.

---

## Profile types, in frontend terms

The vocabulary is defined in `rigor-levels.md`; this is what each type means once it hits
a React or Next.js codebase.

| Type | What it covers here | Typical tooling |
|---|---|---|
| `unit` | Pure logic with no rendering: formatters, reducers, permission and pricing rules, derived state, genuinely reusable hooks | the project's runner |
| `component` | A component driven the way a user drives it, through the accessibility tree | Testing Library + `user-event` |
| `e2e` | A real browser through a real flow — and **the only type that reaches async Server Components** | Playwright, Cypress |
| `a11y` | Automated accessibility assertions over rendered output. Catches a real subset (contrast, names, roles, landmarks) and no more — it is not a substitute for keyboard and screen-reader testing, and a plan that implies otherwise is overselling it | axe, in the component or e2e layer |
| `visual` | Screenshot comparison. **The assertion for appearance**, and the reason no other type asserts CSS | Playwright snapshots, Chromatic, Percy |

`contract` and `load` are backend types. A frontend consumer of a backend contract is a
real case for `contract`, but only when both sides are actually verified — a
consumer-side schema check that nobody runs against the provider is a unit test with
aspirations.

---

## What `review` may raise

Layered on top of the level's own contract in `rigor-levels.md`. Nothing here overrides
that file; a type outside the plan's profile stays out of scope no matter how much of it
appears below.

**Under `adaptive`** — nothing from this file. The floor applies (correctness, security,
no swallowed errors, suite stays green, honest names, scope discipline) and that's all.
This file is reference material for *how to write* the code, not a source of findings, and
smuggling community practice in as advice is the failure the level exists to prevent.

**Under `balanced`**, in addition to the level's list:

- `major` — a business rule living inside a component or an async Server Component; a
  component test that mocks the framework's router, link, or image to pass; appearance
  asserted as a string (`className`, computed CSS, SVG coordinates); a snapshot standing
  in as the only behavioral assertion; mocks at the module boundary where the network
  boundary was available; input validated in the component instead of in the route handler
  or Server Action it calls.
- `minor` — `data-testid` where a role or label query would have worked; `fireEvent` where
  `user-event` fits; a `waitFor` wrapping something already covered by `findBy*`; a hook
  tested through `renderHook` when a component test would have been more honest.

**Under `strict`**, additionally:

- `major` — data fetching hand-rolled in `useEffect` where the project has an established
  data library; untyped or `any`-typed props on a component that crosses a module boundary;
  an interactive element with no accessible name shipped in a plan whose profile carries
  `a11y`.

**Always, at every level**, one thing that is *not* a finding: behavior that couldn't be
covered because it lives in an async Server Component and the profile excludes `e2e`. That
belongs in the review's *Clean* section as information for the user, with no severity
attached — it's a fact about the profile, not a defect in the diff.
