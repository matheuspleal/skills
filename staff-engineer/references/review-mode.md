# Review mode — the bounded loop

How `review` works, how it feeds `build`, and what keeps the two from grinding against
each other forever. Read this at the start of `review` mode, and when `build` is about to
close its first phase in a session.

## What review is

A second pass over code that already works, judged against a written standard: the
phase's acceptance criteria and the plan's recorded rigor level (`rigor-levels.md`). It
produces **findings**, not commits.

Two things make this different from asking a model to "review the code":

- **The standard is written down before the review runs.** Rigor is in the plan's
  frontmatter and its contract is in `rigor-levels.md`. A reviewer with no standard
  raises whatever it notices, which is unbounded by construction — that's the loop the
  user is afraid of.
- **The loop has a budget and an exit.** Findings are fixed by `build`, verified by the
  next round, and when the budget runs out with something still open, the decision goes
  to the user instead of another round.

## What review is not

- **Not a code writer.** It never edits source. `build` fixes; `review` judges. A
  reviewer that quietly fixes its own findings and then re-reviews has no independent
  signal left — it's marking its own homework, and the ledger becomes fiction.
- **Not a design review.** The plan and its ADRs were argued at `design` time. If the
  code reveals the *plan* was wrong, that's not a finding — that's the plan/reality
  divergence rule: stop, tell the user, update the plan (see `build-workflow.md`).
- **Not a second refactor pass.** `build` already refactored on a green bar. "This could
  be cleaner" with no hook into correctness or the rigor contract is a `nit` at most.
- **Not a scope generator.** See the validity gate below. This is the single most
  important constraint in this file.

---

## Severity — the rubric

Severity decides what happens next, so it can't be a mood. Each level has an anchor.

| Severity | Anchor | Effect (default config) |
|---|---|---|
| `blocker` | The phase's acceptance criteria are not actually met; a correctness bug; a security hole; data loss; a broken contract; the suite is red; a test the rigor contract requires is missing entirely | `build` fixes before commit |
| `major` | A violation of the **recorded rigor contract** for this plan, or a design flaw that will be expensive to reverse once it ships | `build` fixes before commit |
| `minor` | A real improvement that is cheap to defer: naming, local duplication, a missing edge case, a smell the level treats as advisory | Recorded as a follow-up, not fixed in-loop |
| `nit` | Taste. Formatting, ordering, phrasing | One line, no action, never blocks |

**What counts as a `major` is level-dependent, and that's the whole point.** A domain file
importing Prisma is a `major` under `balanced` and out of scope under `adaptive`. Missing
red-before-green is a `blocker` under `strict` and not a finding at all under `balanced`.
Read the level's own section in `rigor-levels.md` before assigning severity — that file
lists, per level, both what review may raise and what it may not.

**Severity inflation is the failure mode to watch.** A reviewer that wants a `minor`
actioned will label it `major`, because `major` is what `build` fixes. That's how a
bounded loop becomes an unbounded one while still looking well-behaved. If you can't
point at the specific line of the rigor contract a finding violates, it isn't a `major`.

---

## The validity gate

Before a finding goes in the ledger, all four must hold. A finding that fails any of
them is a follow-up note, or nothing.

1. **Anchored.** It points at a `file:line` the phase actually changed — or at something
   the phase should have changed and didn't. Code the phase never touched is out of
   scope, however much it deserves attention. File it as a follow-up.
2. **Grounded.** It engages exactly one of: the phase's acceptance criteria, the recorded
   rigor contract, correctness / security / data integrity, or an explicit trade-off in
   the plan that the code contradicts. "Best practice" unattached to any of those four is
   not grounding.
3. **Actionable.** It names the change, not just the problem. "This is coupled" is a
   complaint; "inject `Clock` at the constructor so the expiry test doesn't sleep" is a
   finding.
4. **Proportional.** Severity per the rubric above, not per how much it bothers you.

The gate exists because of a specific, predictable failure: an untethered reviewer
produces a wishlist, `build` implements the wishlist, and the phase quietly triples in
size with none of it in the plan. The user asked for a healthy loop — this is the part
that makes it one.

---

## The loop, per phase

```
build:  red → green → refactor
          │
          ▼
review: round 1 ──▶ findings ──▶ build fixes {blocker, major}
          │                            │
          │◀───────────────────────────┘
          ▼
review: round 2 (verify + new findings on the fixes only)
          │
   no open blocker/major? ──yes──▶ commit the phase
          │
          no
          ▼
   budget exhausted ──▶ STOP, escalate to the user
```

1. **`build` finishes the phase** — green bar, refactor done, working tree holds the
   phase's diff, nothing committed yet.
2. **`review` runs round 1.** Input: the phase spec from the plan, the diff, the files
   the diff touches, and the rigor contract. Not the whole repository — a review that
   re-reads everything has no natural stopping point and mostly rediscovers the codebase.
3. **`review` writes the ledger** (template below) and hands the findings back.
4. **`build` acts:** fixes everything in `config.review.fix` (default `[blocker, major]`),
   records everything in `config.review.defer` (default `[minor, nit]`) as follow-ups.
   It does not silently fix a `minor` because it was easy — the ledger would then
   disagree with the diff.
5. **`review` runs round 2:** verifies each round-1 finding is genuinely resolved, and may
   raise new findings **only against the lines the fixes changed**.
6. **Exit.** Zero open `blocker`/`major` → the phase commits (fixes fold into the phase's
   commits; the history doesn't grow a trail of `fix review finding #3`). Budget
   exhausted with something still open → stop and escalate.

**Why review runs before the commit.** The alternative — commit, then review, then fix —
produces a history where every phase is followed by cleanup commits, and `tdd-atomic-commits`
can no longer tell the implementation story. Reviewing the working tree keeps each phase
one clean pair of commits.

### The budget

`config.review.max_rounds`, default **2**, counted **per phase**. A fix never resets it.

Two rounds is the default because round 1 finds what's wrong and round 2 confirms it got
fixed. A third round is usually not new information — it's the reviewer reading more
carefully, which has no end state.

**`max_rounds: 1` is a legitimate setting, and it means "no verification".** Round 1
raises, `build` fixes, and the phase commits with those findings marked
`fixed (unverified)` in the ledger. That's an honest, cheaper trade — one pass of
scrutiny instead of two — and the ledger says so out loud rather than claiming a
verification that never happened.

**Escalation is about findings that aren't fixed, not about rounds that didn't run.** The
loop stops for the user when something stays open — `build` couldn't resolve it, the fix
didn't hold, or the two passes disagree. Running out of budget with everything addressed
is a normal, quiet exit.

### Escalation — what "stop" actually looks like

When the budget runs out with open `blocker` or `major` findings, stop the loop and put
the decision in front of the user. Give them, per open finding: the claim in one
sentence, what it will cost to fix, what it will cost to ship as-is, and your
recommendation. Then three options:

- **Fix it** — the loop reopens with a fresh budget for that finding specifically.
- **Ship as-is** — the finding is marked `overruled` with the user's one-line reason, and
  the same reason lands in the plan's *Risks & Trade-offs* as an attributed trade-off.
  This is the same mechanism as the *Constructive dissent* rule in `SKILL.md`: argued
  once, then the user's call stands, on the record.
- **Defer it** — becomes a follow-up, optionally a new plan.

Never continue past an open `blocker` without an explicit decision. A blocker means the
phase's acceptance criteria are not met, and committing it makes the plan's checkboxes
lie.

---

## Anti-oscillation rules

The failure this loop is designed against isn't a reviewer that's too strict — it's two
passes that disagree and take turns undoing each other while both look productive.

1. **A finding that survives its own fix escalates; it does not respawn.** If round 2
   re-raises substantially the same claim as a finding that `build` marked `fixed`, do
   not put it back in the fix queue. Two passes disagreeing about whether something is
   fixed is a **decision**, and decisions go to the user.
2. **New findings in round ≥ 2 must anchor to the fix diff.** Not to code that was
   already there in round 1 and didn't change. If it was reviewable in round 1 and wasn't
   raised, it's a follow-up — otherwise "one more careful read" becomes an unbounded
   source of new work.
3. **`review` never writes code.** Stated in the rubric, repeated here because it's the
   rule that keeps the ledger meaningful.
4. **Finding IDs are permanent.** `F001`, `F002`, monotonic per review file, never reused,
   never renumbered. Rule 1 is only enforceable if a finding has a stable identity across
   rounds.
5. **Withdrawal is allowed and cheap.** If re-inspection shows the reviewer was wrong,
   mark the finding `invalid` with a one-line reason and leave the row in place. A
   reviewer that can't be wrong on the record will defend bad findings to stay
   consistent.

---

## The review ledger

One file per plan, at `staff-engineer-skill/reviews/<YYYY-MM-DD>-<plan-slug>.md`, appended
across phases and rounds. It is the loop's memory — rules 1 and 4 above depend on it
existing.

Same timestamp discipline as everywhere else in this skill: run
`date -u +%Y-%m-%dT%H:%M:%SZ` for each stamp; never synthesize one from context.

### Frontmatter

```yaml
---
kind: review
title: <Review of "<plan title>">
slug: <plan-slug>
status: open              # open | closed
plan: staff-engineer-skill/plans/2026-08-09-checkout-queue.md
rigor: balanced           # copied from the plan; the standard this review applied
created_at: 2026-08-09T11:04:17Z
updated_at: 2026-08-09T13:22:41Z
language: pt-BR           # pt-BR | en-US — language of the prose
rounds: 3                 # total rounds run across all phases
open_findings: 0
---
```

`status: closed` when the plan reaches `implemented` or `canceled`. When the plan is
archived (see `plan-template.md`), the `plan:` path is rewritten to the archived location
in the same move — a ledger pointing at a file that isn't there is worse than no ledger.

### Body

```markdown
# Review — <plan title>

## Phase 2 — round 1 *(2026-08-09T11:04:17Z)*

**Scope.** `src/checkout/enqueue.ts`, `src/checkout/handler.ts`, and the phase's three
acceptance criteria. Suite green before review (`npm test`, 84 passing).

**Clean.** Criteria 1 and 3 verified against the tests. Dependency direction correct —
`enqueue.ts` imports the port, not the pg client.

| ID | Sev | Location | Finding | Status |
|---|---|---|---|---|
| F001 | blocker | `handler.ts:42` | Retry path swallows the enqueue error, so a failed job reports success to the caller. Criterion 2 ("failures surface to the caller") is not met. Return the error instead of logging it. | fixed |
| F002 | major | `enqueue.ts:17` | `payload: Record<string, unknown>` crosses the module boundary unvalidated — primitive obsession on a concept the domain owns. Parse into a `JobPayload` at the edge. | fixed |
| F003 | minor | `handler.ts:60` | The two branches differ only in the log message; collapse when a third case appears. | deferred |

## Phase 2 — round 2 *(2026-08-09T11:38:02Z)*

**Scope.** The fix diff for F001 and F002 only.

| ID | Sev | Location | Finding | Status |
|---|---|---|---|---|
| F001 | — | `handler.ts:42` | Verified: error is returned, and the new test fails without the fix. | fixed |
| F002 | — | `enqueue.ts:17` | Verified: `JobPayload.create()` validates at the boundary. | fixed |
| F004 | minor | `enqueue.ts:24` | The parse failure message repeats the field name twice. | deferred |

**Exit.** No open blocker/major after 2 rounds. Phase committed.

## Follow-ups

- F003 — collapse the duplicated branch in `handler.ts` when a third case arrives.
- F004 — tidy the parse failure message.
```

Findings carry enough that a reader who wasn't here can act: what's wrong, why it's
wrong under *this* standard, and what to do. A one-word finding ("coupling") fails the
validity gate's actionability test.

### Finding status

- `open` — raised, not yet addressed.
- `fixed` — `build` changed the code, and a later round verified it. Not "build says so."
- `deferred` — recorded as a follow-up. The normal end state for `minor` and `nit`.
- `overruled` — the user chose to ship as-is. Requires their one-line reason, and the same
  reason goes into the plan's *Risks & Trade-offs*.
- `invalid` — withdrawn; the reviewer was wrong. One-line reason, row stays.

### The `Clean` line is not decoration

A review that lists only problems tells the reader nothing about coverage — they can't
tell a clean phase from a shallow review. Naming what was checked and found sound is what
makes "no findings" a meaningful result instead of an ambiguous one.

---

## Standalone review

`/staff-engineer review [adaptive|balanced|strict] [<target>]` runs outside the loop, with
or without a plan. This is the mode for "look at what I just did" — a branch before a PR,
the working tree, someone else's commit.

**Target resolution**, first that applies:

1. What the user named ("the last commit", "this branch", a path).
2. Uncommitted changes in the working tree, if any.
3. `git diff <merge-base with the default branch>` — the branch's whole contribution.

**Rigor resolution**, first that applies: explicit token → `config.yml` → the plan's
`rigor`, when the changes clearly belong to one → auto-detection. In the last case, don't
stop to ask: state the level you're applying in one line and proceed. A standalone review
writes no code, so being wrong about the level costs one re-run, and a question here buys
less than it costs.

**Output** goes inline in the conversation: the same severity rubric, the same validity
gate, grouped by severity with the `Clean` line. Then offer to persist it as a ledger
under `staff-engineer-skill/reviews/` — useful when it's feeding a PR or a follow-up plan,
overhead when it's a glance. Let the user pick.

**When there's no plan**, the validity gate loses its first anchor (acceptance criteria)
and leans on the other three. Be more conservative with `blocker`, not less: without a
plan you don't know what was in scope, so "this doesn't do X" may simply mean X was never
being built.

---

## Interaction with the rest of the skill

- **ADRs.** Review may raise "this decision cleared the significance gate and has no ADR"
  as a finding — `major` when the decision is structural, `minor` otherwise. It never
  flips an ADR's status; `Proposed → Accepted` belongs to `build`, when the phase lands.
- **Commits.** Fixes fold into the phase's commits via `tdd-atomic-commits`. If
  `config.commits.enabled` is false, the loop still runs; only the commit step is skipped.
- **`config.review.auto: end_of_plan`.** One review over the plan's whole contribution
  after the last phase, same rubric and budget. Cheaper in interruptions, and structural
  findings arrive when they're expensive — that trade is the user's to make in config.
- **`config.review.auto: off`.** `build` never calls `review`; the mode still exists
  standalone. Nothing else changes.
- **Follow-ups** accumulate in the ledger's *Follow-ups* section. When they add up to real
  work, that's a `design` prompt, not a growing list of deferred items nobody reads.
