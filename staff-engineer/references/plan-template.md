# Plan template

The full template plus three worked examples. Keep the structure; adapt the content.

## Frontmatter spec

Frontmatter keys are always English. Values follow this spec.

```yaml
---
title: <human-readable plan title in user's language>
slug: <kebab-case-slug>
status: pending      # pending | in_progress | implemented | canceled
created_at: 2026-05-01T14:32:00Z   # ISO 8601 UTC
updated_at: 2026-05-01T14:32:00Z   # bump on every edit
implemented_at: null  # set ISO timestamp when status -> implemented
canceled_at: null     # set ISO timestamp when status -> canceled
language: pt          # pt | en — language of the prose
mode_history:
  - { mode: plan, at: 2026-05-01T14:32:00Z }
  # append { mode: dev, at: ... } when dev mode picks the plan up
---
```

Rules:

- **Never delete entries from `mode_history`** — it's an audit trail.
- **`updated_at` bumps on every edit**, including marking phases done in `dev` mode.
- **`status` only moves forward**: `pending → in_progress → implemented` or `pending → canceled` / `in_progress → canceled`. Once `implemented` or `canceled`, the plan is terminal.
- **Slug ASCII-only**. No spaces, no accented characters. Keep it short — 2–5 words max.

## Body structure

These four sections are always present, in this order unless the conditional sections rearrange things:

1. Context & Constraints
2. *(conditional: Domain Model)*
3. *(conditional: Architecture Decisions)*
4. Implementation Phases
5. *(conditional: Migration / Rollout Plan)*
6. *(conditional: Test Strategy)*
7. Risks & Trade-offs
8. References

### 1. Context & Constraints

Restate the problem in your own words. The user should be able to read this and confirm you understood. Cover:

- **What we're building** — one or two sentences.
- **Why** — the business or technical driver. Without this, future readers can't judge trade-offs.
- **Scope** — what's in.
- **Non-goals** — what's deliberately out. This is often more important than scope.
- **Constraints** — stack, deadline, team size, performance/scale targets, compliance, anything that bounds the design space.

### 2. Domain Model *(conditional)*

Include when the change is domain-heavy. Skip for thin glue or CRUD.

- **Ubiquitous language** — table or list mapping domain terms to what they mean here. Distinguish them from terms in adjacent contexts if relevant.
- **Bounded context** — what context are we in? What's the relationship to other contexts?
- **Aggregates** — name them, identify the root, list invariants enforced at the root.
- **Domain events** — past-tense facts that flow out of the aggregate.

### 3. Architecture Decisions *(conditional)*

Include for greenfield, major restructuring, or when justifying a layering choice. Skip when following existing structure.

- **Layering** — which layers exist, which depend on which (point at the dependency rule).
- **Ports & adapters** — what's a port (domain-defined interface), what's an adapter (infrastructure implementation).
- **Key decisions** — for each, name the alternatives considered, the choice, and the reason. *Decisions without alternatives are not decisions.*

### 4. Implementation Phases

The spine of the plan. Each phase is **incremental** (the system works after each one) and **atomic** (one logical change, one or two atomic commit pairs per the `tdd-atomic-commits` skill).

For each phase:

```markdown
## Phase N — <imperative title>

**Goal.** One sentence: what's true after this phase that wasn't before.

**Changes.**
- File / module changes, bullet form. Be concrete enough that another engineer could pick this up.

**Tests.**
- The acceptance tests that prove the phase is done. Red-green-refactor candidates.

**Acceptance criteria.**
- [ ] Bullet list of observable outcomes.

**Notes.** *(optional)* Subtleties, deferred work flagged for later phases, references to specific principles.
```

Phases should ship a working system. If a phase requires the next one to compile or pass tests, they're really one phase.

### 5. Migration / Rollout Plan *(conditional)*

Include when touching production data, public contracts, or anything that warrants phased rollout.

- **Strategy** — strangler fig, dual-write, expand-contract, feature flag, big bang. Name and justify.
- **Rollback** — what does "undo" look like at each phase?
- **Monitoring** — what signal tells you it's working / broken?
- **Deprecation timeline** — if a feature flag, when does the old code go away?

### 6. Test Strategy *(conditional)*

Include when the testing approach is non-obvious. Skip when standard unit + a few integration tests is enough.

- **Pyramid balance** — how many unit, integration, end-to-end. Why.
- **Outside-in vs. inside-out** — which school is driving design here. Why.
- **Characterization tests** — if we're around legacy code, which behaviors do we lock in first?
- **Test doubles** — what gets mocked, what stays real. Justify.

### 7. Risks & Trade-offs

The honest section. For each significant decision, name the tension:

- **YAGNI vs. extensibility.** Where did we choose not to add a seam, and what would the cost be if we needed it later?
- **KISS vs. DRY.** Where are we tolerating duplication on purpose because the abstraction isn't clear yet?
- **Simplicity vs. defensiveness.** Where did we skip validation / error handling because the contract makes it impossible? (Per the project's "trust internal code" rule.)
- **Speed vs. correctness.** Where are we shipping a partial solution and following up?

Each trade-off is one sentence: *"We chose X over Y because Z; reverse if W."*

### 8. References

Cite specifically. Author, work, chapter or section if you know it. Examples:

- Evans, *Domain-Driven Design*, Ch. 14 (Maintaining Model Integrity) — for the bounded-context choice.
- Vernon, *Implementing DDD*, Ch. 10 — for the aggregate-root design.
- Martin, *Clean Architecture*, Ch. 22 (The Clean Architecture) — for the layering.
- Feathers, *Working Effectively with Legacy Code*, Ch. 23 (Sprout Method) — for the integration approach.

Cite only what informed a decision. A plan that name-drops six authors without using their ideas is worse than one that cites two well.

---

## Worked example A — greenfield feature

```markdown
---
title: JWT Authentication with Refresh Tokens
slug: auth-jwt-refresh
status: pending
created_at: 2026-05-01T14:32:00Z
updated_at: 2026-05-01T14:32:00Z
implemented_at: null
canceled_at: null
language: en
mode_history:
  - { mode: plan, at: 2026-05-01T14:32:00Z }
---

# JWT Authentication with Refresh Tokens

## Context & Constraints

We need stateless authentication for the public REST API. Sessions in the
DB are causing read-replica lag during peak hours.

**In scope:** issue access tokens (15 min) + refresh tokens (30 days),
rotate refresh tokens on use, revoke on logout.

**Non-goals:** SSO, social login, MFA — separate plans.

**Constraints:** Node 20 + Express, Postgres, ~1k req/s peak, must coexist
with the existing session-based admin UI for at least one quarter.

## Architecture Decisions

We split *Auth* into a use-case layer (issue, refresh, revoke) behind ports
(`TokenSigner`, `RefreshTokenStore`), with adapters for `jsonwebtoken` and
Postgres respectively. The HTTP layer is a thin adapter that calls use cases.

This pays for itself when we later add MFA or rotate the signing scheme —
the use cases don't change. (Martin, *Clean Architecture*, Ch. 22.)

## Phase 1 — Define ports and the issue-token use case

**Goal.** A pure use-case function that takes credentials and returns
{ accessToken, refreshToken }, behind a `TokenSigner` port.

**Changes.**
- `src/auth/ports/TokenSigner.ts` — interface.
- `src/auth/usecases/issueTokens.ts` — depends on `TokenSigner` and a
  `UserRepository` (already exists).

**Tests.**
- Unit: issues a signed access token with `sub`, `exp` 15 min in the future.
- Unit: issues a refresh token with a unique jti.
- Unit: rejects invalid credentials with a typed error.

**Acceptance criteria.**
- [ ] `issueTokens` is a pure function (no I/O imports).
- [ ] All three tests pass under `vitest`.

## Phase 2 — Postgres-backed refresh token store

**Goal.** A `RefreshTokenStore` adapter that persists, looks up, and revokes
refresh tokens in Postgres.

**Changes.**
- `db/migrations/2026xxxxx_refresh_tokens.sql` — table with `jti`, `user_id`,
  `expires_at`, `revoked_at`.
- `src/auth/adapters/PgRefreshTokenStore.ts`.

**Tests.**
- Integration test against a real Postgres (testcontainers): persist,
  look up, revoke. No mocks. (Beck classicist; the DB is the contract.)

**Acceptance criteria.**
- [ ] Round-trip test green against real Postgres.
- [ ] Revoked tokens fail lookup.

## Phase 3 — HTTP layer + refresh-with-rotation

**Goal.** `POST /auth/login`, `POST /auth/refresh`, `POST /auth/logout`
end-to-end.

**Changes.**
- `src/auth/http/routes.ts`.
- Wire the use cases with the Postgres adapter and `jsonwebtoken` adapter
  in `src/composition.ts`.

**Tests.**
- E2E (supertest): login → refresh → logout flow.
- E2E: refresh with revoked token → 401.
- E2E: refresh rotates the refresh token (old one is revoked).

**Acceptance criteria.**
- [ ] All three E2E tests pass.
- [ ] Manual smoke against a running instance with curl.

## Risks & Trade-offs

- **YAGNI on key rotation.** We hard-code the JWT signing key for now. The
  `TokenSigner` port lets us swap to a JWKS-based implementation without
  touching use cases. Cost of late-binding: one day of work when we need
  rotation; cost of early-binding now: weeks for a feature we may never use.

- **KISS on token storage.** Refresh tokens go in the same Postgres as the
  rest of the app. A dedicated cache (Redis) would be faster but adds
  operational surface. Revisit if `auth.refresh.p99` exceeds 100 ms.

- **Coexistence with sessions.** The admin UI keeps its session middleware;
  no shared state. Trade-off: two auth paths in the codebase for one quarter.
  Cleanup ticket already filed.

## References

- Martin, *Clean Architecture*, Ch. 22 — layering.
- Beck, *TDD By Example*, Part I — the red-green-refactor loop driving the
  use-case design in Phase 1.
- RFC 7519 (JWT), RFC 6749 §1.5 (refresh tokens).
```

---

## Worked example B — refactor

```markdown
---
title: Strangle the Old Pricing Service
slug: pricing-strangler
status: pending
created_at: 2026-05-01T14:32:00Z
updated_at: 2026-05-01T14:32:00Z
implemented_at: null
canceled_at: null
language: en
mode_history:
  - { mode: plan, at: 2026-05-01T14:32:00Z }
---

# Strangle the Old Pricing Service

## Context & Constraints

`PricingService` is 4k lines, no tests, mixes tax / discount / shipping
logic, and is the source of every other production bug. Replacing it
wholesale is risky; we'll strangle it (Fowler) one rule at a time.

**In scope:** discount rules (the noisiest area).

**Non-goals:** tax and shipping in this plan — separate strangler runs.

## Test Strategy

Characterization tests first (Feathers, Ch. 13). For each discount rule we
plan to extract, we capture current behavior — bugs included — before
touching anything. Behavioral changes go through review separately.

Pyramid: characterization tests at the integration level (real
`PricingService` against a fixture catalog), unit tests for the new rule
classes. No mocks of `PricingService` itself; that defeats the purpose.

## Phase 1 — Characterize current behavior for `PercentageDiscount`

**Goal.** A test suite that pins `PricingService.applyPercentageDiscount`
behavior across a fixture catalog.

**Changes.**
- `tests/characterization/percentage_discount_test.py` — fixture catalog
  + table-driven tests asserting current outputs.

**Tests.**
- ~50 cases covering: stacked discounts, rounding, zero quantity, expired
  promotions. Outputs are whatever the current code produces — bugs and all.

**Acceptance criteria.**
- [ ] Suite passes against `main`.
- [ ] Coverage report shows the percentage-discount path is exercised.

## Phase 2 — Extract `PercentageDiscountRule` behind a port

**Goal.** A new `DiscountRule` interface and a `PercentageDiscountRule`
implementation. `PricingService` delegates to it for percentage discounts;
the characterization suite still passes.

**Changes.**
- `src/pricing/rules/DiscountRule.py`.
- `src/pricing/rules/PercentageDiscountRule.py`.
- `PricingService.applyPercentageDiscount` becomes a one-liner that
  delegates.

**Tests.**
- Unit tests on `PercentageDiscountRule` for the same 50 cases (now
  testable in isolation).
- Characterization suite continues to pass unchanged.

**Acceptance criteria.**
- [ ] Both suites green.
- [ ] `PricingService` lost ~150 lines.

## Migration / Rollout Plan

- **Strategy.** Strangler fig (Fowler). Each phase moves one rule out;
  the legacy `PricingService` is the host until the last rule is extracted.
- **Rollback.** Each phase is a single PR; revert the PR.
- **Monitoring.** Pricing-mismatch alarm already in place (compares
  `PricingService` output against the warehouse's reconciliation job).

## Risks & Trade-offs

- **Bug-for-bug parity.** The characterization tests lock in *current*
  behavior, including known bugs. Behavior fixes go through a separate PR
  with explicit before/after diffs in the test fixtures, so the change is
  visible in code review.
- **Two pricing paths during the strangle.** Until the last rule is out,
  `PricingService` still owns orchestration. Acceptable; this is the
  textbook strangler shape.

## References

- Fowler, "StranglerFigApplication" (martinfowler.com, 2004).
- Feathers, *Working Effectively with Legacy Code*, Ch. 13 (characterization
  tests), Ch. 23 (sprout method).
```

---

## Worked example C — domain-heavy feature (DDD)

When the change introduces a new bounded context, include the *Domain Model* section. Sketch:

```markdown
## Domain Model

**Bounded context:** Order Fulfillment.
**Relationship to adjacent contexts:** customer-supplier with Catalog
(consumes product info), conformist with Payments (we accept their model).

### Ubiquitous language
- **Order** — a customer's intent to purchase a set of items, prior to
  fulfillment. Distinct from *Shipment* (a physical box) and *Invoice*
  (the billing artifact).
- **Line Item** — a (product, quantity, price) triple within an Order.
- **Allocation** — the act of reserving inventory against a Line Item.

### Aggregate: Order
- **Root:** `Order`.
- **Invariants:**
  - Total price equals sum of line-item subtotals.
  - Cannot transition to `Confirmed` while any line item is unallocated.
  - Once `Shipped`, no further line-item edits.
- **Domain events:** `OrderPlaced`, `OrderConfirmed`, `OrderShipped`,
  `OrderCanceled`.

(Then the rest of the plan as usual — Implementation Phases, etc.)
```

That's enough to anchor the rest of the plan in the domain. If the user is
working in Portuguese, the language table is in Portuguese — that's the
whole point of ubiquitous language.
