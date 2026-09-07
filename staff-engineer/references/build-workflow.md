# Build workflow reference

How `build` mode actually executes a plan. Read this before starting `build` mode for the first time in a session.

## The loop, end-to-end

For each phase in the plan:

```
read phase → red → green → refactor → review → fix → commit (impl + test) → mark done + accept ADRs
```

Then repeat for the next phase. When all phases pass, mark the plan `implemented` and archive it.

How hard the red step binds, and what `review` is allowed to raise, both depend on the plan's recorded `rigor` — read that level's section in `rigor-levels.md` before the first phase.

## Step 1 — Read the phase

Re-read **the entire phase** before writing a line of code:

- The **goal** sentence — what's true after this phase.
- The **changes** list — concrete files and modules.
- The **tests** list — what acceptance looks like.
- The **acceptance criteria** checkboxes.

If the phase contradicts itself, or the acceptance criteria don't match the goal, **stop and tell the user**. The plan is the contract; if the contract is broken, fix the contract before fixing the code.

If the phase is fine but you realize during implementation that the plan was wrong (a missing edge case, a wrong assumption about the existing system), again — stop, surface it, update the plan, then continue. Silent drift between plan and reality kills the value of having a plan.

## Step 2 — Red

Write the smallest failing test that encodes one acceptance criterion. Run it. **Confirm it fails for the right reason.**

This step is more important than it looks:

- A test that fails because of a typo or missing import is not "red"; it's broken. Fix it until it fails because the production code doesn't yet do the thing.
- A test that passes immediately is also not "red". Either the behavior already exists (good — cross the criterion off, move on) or the test is asserting nothing meaningful (bad — rewrite the test).

**One test at a time.** Resist the urge to write the whole test file before any production code. The next test depends on what the code looks like after the previous green-refactor cycle.

### Whether this step is mandatory

- **`strict`** — always. No production line without a failing test that demanded it. A test written afterward may assert the same thing, but it didn't get to shape the design, and that's what the discipline buys.
- **`balanced`** — a test is required wherever failure would be *silent* (domain logic, security boundaries, contracts between layers); the order is yours. Test-first when the design is unclear, test-after when the shape was obvious. Skip entirely for things that fail loudly — appearance, platform behavior, config shape.
- **`adaptive`** — only where the project already tests, or where a test is cheap and pins something risky you're about to change. A characterization test before touching untested high-risk code is the adaptive-correct move, not a rigor upgrade.

### Choosing the test type

This is not an open choice. The plan's `tests` frontmatter lists the types available on this project, and the *Test Strategy* section (when present) maps them to phases. Read both before writing the test; pick from the profile.

Within the profile, the usual fit:

- **Unit** — a small piece of logic, no I/O, no collaborators that need real wiring. Fast, isolated.
- **Integration** — when the unit under test is the seam between two real things (a use case + a real DB adapter, a controller + a real route). Slower, more realistic.
- **Component** *(frontend)* — a component driven the way a user drives it. See `frontend-canon.md`.
- **End-to-end** — only for the spine of the user-visible flow. Expensive; one well-placed E2E is worth ten brittle ones.
- **Contract**, **a11y**, **visual**, **load** — see the vocabulary in `rigor-levels.md`.

If you find yourself wanting a fourth mock to make a unit test work, that's a signal: this might be an integration test in disguise, or the design needs better boundaries.

**When the right test isn't in the profile**, don't quietly write it anyway and don't quietly skip the coverage. The profile is a recorded decision, so contradicting it is a plan/reality divergence: say what the phase needs, what the profile allows, and let the user widen the profile or accept the gap. Writing an e2e test into a project that declined e2e leaves behind a test with no harness, no CI job, and no owner — which is how a suite starts rotting.

**A type in the profile with no harness in the repo** is the mirror case. The plan should already own it (see the *Test Strategy* template). If it doesn't, stop before scaffolding — adding Playwright or testcontainers is a dependency commitment, often an ADR, and never a side effect of a phase that was about something else.

## Step 3 — Green

Write the smallest change that makes the test pass.

"Smallest" means smallest:

- If the test asserts `add(2, 3) == 5`, return `5`. The next test will force generalization.
- If you're tempted to add validation, error handling, or edge cases the test didn't ask for — don't. Add them when a test demands them.

The discipline of small green steps is what keeps the cycle tight and the design driven by tests rather than imagination.

### Verify third-party APIs before you write against them

If the green step calls into a library — configuration, lifecycle hooks, transactions, auth, anything with options you'd otherwise recall from memory — check the docs for **the version the project actually installs** before writing the call. See `live-docs.md`; the Context7 MCP is the fast path when it's available.

One lookup costs a few seconds. Confidently writing an API that moved two majors ago costs a debugging session, and the failure doesn't announce itself as a knowledge problem.

Skip this for plain language-level logic. There's nothing to verify and the round trip is pure cost.

### When the green is hard

Sometimes the smallest change is genuinely large because the test reaches across many components. When that happens, the test was probably too big — back up, write a smaller test on a smaller seam, and grow up to the original test from there. (This is GOOS / outside-in style.)

## Step 4 — Refactor

With the green bar, look at the code:

- **Naming.** Does every name earn its place? Renames are cheap with green tests.
- **Duplication that hurts.** Two identical blocks in the same file usually want extraction. Two superficially-similar blocks across different files usually want to stay separate (Metz: prefer duplication to the wrong abstraction).
- **Missed abstractions.** A long function with three obvious sections wants to be three functions. Extract.
- **Dead code.** If the test passes without it, delete it.

After every change, re-run the tests. If they go red, undo the refactor and try a smaller step.

**Refactor the test code too.** Test code that's hard to read becomes test code people don't trust. Same standards as production code.

In `adaptive`, keep refactors inside the phase's footprint — reshaping code the phase didn't touch is an unguarded change in a codebase that can't guard itself.

### What refactoring is *not*

- Adding new behavior. That's a new red-green cycle.
- Adding speculative seams "in case we need them". That's YAGNI bait.
- Reorganizing files just to make the diff prettier. The commit will look fine.

## Step 5 — Review

Unless `config.review.auto` is `off` (never) or `end_of_plan` (once, after the last phase), close the phase with a review round over its diff — **before** committing.

Read `review-mode.md` for the rubric and the ledger format. What matters here, in `build`'s seat:

- You hand `review` the phase spec, the diff, and the rigor level. It hands back findings.
- **You fix what's in `config.review.fix`** (default `blocker` and `major`) and record the rest as follow-ups. Don't fix a `minor` just because it was easy — the ledger would then disagree with the diff, and the next round can't tell a real fix from a drive-by.
- **You don't mark your own findings resolved.** A finding is `fixed` when a verifying round says so, not when you say so.
- **When the round budget runs out with something open, stop.** Escalate with each open finding, its cost to fix, its cost to ship as-is, and your recommendation. Never commit past an open `blocker` — the phase's acceptance criteria are not met, and ticking the checkbox would make the plan lie.

Why before the commit: the alternative produces a history where every phase is trailed by cleanup commits, and `tdd-atomic-commits` can no longer tell the implementation story. Fixes belong inside the phase's own commits.

## Step 6 — Commit (hand off to `tdd-atomic-commits`)

Each phase typically yields one or more impl/test commit pairs. Hand off to the `tdd-atomic-commits` skill for the actual commit work — its rules govern:

- Implementation commit first, test commit second (every commit independently runnable).
- Conventional Commits subjects: `feat(scope): …`, `fix(scope): …`, `refactor(scope): …`, then `test(scope): …`.
- Stage by explicit filename — never `git add -A` / `git add .` / `git add -u`.
- One logical unit per commit; if a phase produced two paired changes, that's two pairs (four commits), not one.

**Commit messages are always English**, even when the conversation and the plan are in Portuguese.

Skip this step entirely when `config.commits.enabled` is false, or when the user asked to review before committing. The phase isn't truly "done" until committed, but the user gets to choose the cadence.

## Step 7 — Mark the phase done and accept its ADRs

Open the plan file. In the phase body:

- Tick the acceptance-criteria checkboxes that are now true.
- If the plan uses an inline marker convention (`✓ implemented 2026-08-09`), add it after the phase title.
- Bump frontmatter `updated_at`.

Save the plan. Do **not** rewrite or restructure it — only add the markers. The plan is a historical record once written; edits are restricted to status, timestamps, phase markers, and explicit user-requested changes.

### Accepting ADRs

If the plan's *Decision Records* table maps an ADR to this phase, the decision just became real in code. Flip it:

- Change the ADR's `Status` line from `Proposed` to `Accepted`. **That line only** — never touch the Context, the Considered Options, or the Consequences of an ADR you're accepting. See `adr.md` for why ADRs are immutable.
- Update the row in `docs/adr/README.md` if that index exists.
- Update the status in the plan's *Decision Records* table.
- Commit: `docs(adr): accept ADR-NNNN <short decision>`, or fold the status edit into the phase's implementation commit when it's genuinely the same logical change.

An ADR that sits at `Proposed` forever is how `docs/adr/` drifts from a record of what the system *is* into a record of what someone once intended.

## After all phases

When the last phase passes:

1. If `config.review.auto` is `end_of_plan`, run the single review round now, over the plan's whole contribution. Same rubric, same budget, same escalation.
2. Update frontmatter: `status: implemented`, `implemented_at: <now ISO>`, `updated_at: <now ISO>`.
3. Close the review ledger: `status: closed`, and set `open_findings` to the count deliberately deferred (usually the `minor`/`nit` follow-ups).
4. **Archive the plan** — see below.
5. Tell the user. One paragraph: phases completed, commit count, where the plan moved, anything deferred.
6. Point at follow-ups — deferred review findings, and TODOs the plan intentionally left for a future plan.

### Archiving, and why backlinks get repaired

Move the plan file to `staff-engineer-skill/plans/implemented/<same-filename>` (or `plans/canceled/` on cancellation). `plans/` then holds exactly the work `build` can pick up, which is what makes plan selection correct without filtering.

Moving a file breaks every link pointing at it, so repair them in the same step:

- The research file's `spawned_plans` entry, when the plan's `derived_from` is set.
- Each ADR's `Plan:` line — every ADR listed in the plan's `adrs`.
- The review ledger's `plan:` frontmatter.

Don't touch the plan's own body. The point of archiving is to get finished work out of the queue, not to rewrite it.

A dangling link is worse than no link: it costs the reader a search before they conclude the file is gone. The whole chain — research → plan → ADR → review — exists to be followed months later by someone who wasn't here.

## Cancellation

If the user cancels mid-implementation:

- Update frontmatter: `status: canceled`, `canceled_at: <now>`, bump `updated_at`.
- Leave commits as they are unless the user explicitly asks to revert them.
- Archive to `plans/canceled/` with the same backlink repair. Canceled plans are valuable as history.
- Any ADR still at `Proposed` moves to `Rejected` with a one-line reason. Leave `Accepted` ones alone — they describe code that exists.

## Edge cases

### Working with legacy code

If a phase touches code without tests, follow Feathers (see `principles.md`):

1. Add **characterization tests** first, locking in current behavior — even bugs.
2. Find a **seam** (subclass, parameter, function pointer) that lets you change behavior without editing the legacy file.
3. **Sprout** the new behavior into a new method/class/function with its own tests; call it from the legacy code.
4. Refactor the legacy code only after the bridge is in place.

The plan should have flagged this in its *Test Strategy* section. If it didn't, that's a sign the plan needed more thought — bring it back to the user.

### A test you wrote turns out to be wrong

It happens. The fix is:

1. Make the test correct (which probably means it goes red).
2. Make the production code green again.
3. Refactor.

Do **not** make a wrong test pass by adjusting production code to match the wrong test. That's cargo-cult TDD.

### Implementation invalidates a decision the plan recorded

Sometimes the code teaches you that a recorded decision was wrong — the library doesn't support what the ADR assumed, the performance isn't there, the boundary is in the wrong place. Handle it in this order:

1. **Stop and tell the user.** Same rule as any plan/reality divergence.
2. **Agree on the new decision**, with the evidence that forced it. This is real information; it's the most valuable kind of ADR content.
3. If the old ADR is still `Proposed` (nothing was built on it), it may simply be edited or marked `Rejected`.
4. If the old ADR is `Accepted`, **write a new ADR that supersedes it**. Do not rewrite the accepted one. Set the old one's `Status` to `Superseded by ADR-NNNN`, give the new one `Supersedes ADR-NNNN`, and explain in its Context what the implementation revealed.
5. Update the plan's *Decision Records* table and `adrs` frontmatter list, then continue.

Commit as `docs(adr): supersede ADR-0007 with ADR-0012 <short reason>`.

The instinct to "just fix the old ADR" is exactly the instinct migrations exist to defeat. The record of a decision that didn't survive contact with the code is the one a future reader most needs.

### A whole phase turns out to be wrong

If you finish a phase and the result is clearly the wrong shape — wrong abstraction, wrong boundary, wrong assumption — **don't push through**. Tell the user, agree on a course correction, update the plan (or replace the phase), and continue.

This is distinct from a review finding. A finding says *the code doesn't meet the standard*; this says *the plan asked for the wrong thing*. The first is fixed in the loop; the second needs the user.

### The review keeps raising the same thing

Covered in `review-mode.md`, but from `build`'s side: if a finding you fixed comes back, do not fix it again. Two passes disagreeing about whether something is fixed is a decision, not a task — take it to the user with both readings and let them settle it. Re-fixing is how a bounded loop turns into an unbounded one while every individual step still looks reasonable.

### Multiple atomic-commit pairs in one phase

A phase can legitimately produce two or three commit pairs if it touches two or three logical units that all belong to the same phase goal. The `tdd-atomic-commits` skill handles the splitting; just make sure implementation and test files are paired correctly when you stage.

If a phase consistently produces five or more commit pairs, the phase was probably too coarse — note it for the next plan you write.

## Things to avoid in `build` mode

- **Skipping red where the level requires it.** "I know what the code should look like" is the road to untested code that happens to pass other tests.
- **Skipping refactor.** Refactor is where TDD's compounding value comes from. Skipping it leaves the code one step behind every cycle.
- **Committing past an open blocker.** The acceptance criteria aren't met; ticking the box makes the plan lie.
- **Marking your own review findings resolved.** That's what the verifying round is for.
- **Drifting from the plan silently.** If the phase doesn't fit reality, surface it.
- **Bundling unrelated changes.** A phase about pricing rules is not the place to also fix the date-formatting bug you noticed. File a follow-up; stay scoped.
- **Marking a phase done while tests are red.** "Done" means: acceptance criteria met, tests green, review clean or consciously overruled, commits clean.
