---
kind: plan
title: Password policy validation
slug: password-policy
status: pending
created_at: 2026-08-05T10:02:41Z
updated_at: 2026-08-05T10:02:41Z
implemented_at: null
canceled_at: null
language: en-US
rigor: balanced
rigor_detected: balanced
derived_from: null
adrs: []
reviews: []
mode_history:
  - { mode: design, at: 2026-08-05T10:02:41Z }
---

# Password policy validation

## Context & Constraints

Signup and password-reset both need the same policy check, and today each one
re-implements a subset of it. We want one module both call.

**In scope:** a pure `password_policy.py` module. Python 3.12, `pytest` already wired.

**Non-goals:** breach-list lookups, password strength scoring, rate limiting, and any
change to the signup or reset handlers — those come in a follow-up plan once this
module exists.

**Constraint:** the module stays pure. No I/O, no config reads, no logging.

## Phase 1 — Rule violations

**Goal.** `violations(password, policy)` returns the list of rule names the password
breaks, in a stable order.

**Changes.**
- `password_policy.py` — a `Policy` dataclass (`min_length`, `max_length`,
  `requires_digit`, `requires_symbol`) and the `violations` function.

**Tests.**
- A password meeting every rule returns `[]`.
- A 4-character password under `min_length=8` returns `["min_length"]`.
- A password breaking three rules returns all three, in declaration order.
- An empty password returns every applicable rule rather than raising.

**Acceptance criteria.**
- [ ] The four cases above pass.
- [ ] `violations` performs no I/O and reads no module-level state.
- [ ] Rule order is stable across calls and does not depend on dict iteration.

## Phase 2 — Acceptance and length bounds

**Goal.** `is_acceptable(password, policy)` answers the yes/no question, and
`max_length` is enforced.

**Changes.**
- `password_policy.py` — `is_acceptable`, built on `violations`.

**Tests.**
- `is_acceptable` is `True` exactly when `violations` is empty.
- A password longer than `max_length` reports `["max_length"]`.
- A password at exactly `min_length` and exactly `max_length` is accepted (bounds are
  inclusive).

**Acceptance criteria.**
- [ ] The three cases above pass.
- [ ] `is_acceptable` does not duplicate the rule logic — it delegates to `violations`.
- [ ] Both boundary values are covered by tests.

## Risks & Trade-offs

- **YAGNI on scoring.** We return rule names, not a strength score. Adding a score
  later means a new function, not a change to this contract; revisit if the product
  asks for a strength meter.
- **KISS over configurability.** The policy is a dataclass, not a plugin registry.
  Reverse if a second product surface needs rules this shape can't express.

## References

- Beck, *TDD By Example*, Part I — the red-green-refactor loop driving both phases.
