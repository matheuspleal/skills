# Dev workflow reference

How `dev` mode actually executes a plan. Read this before starting `dev` mode for the first time in a session.

## The loop, end-to-end

For each phase in the plan:

```
read phase  →  red  →  green  →  refactor  →  commit (impl + test)  →  mark phase done
```

Then repeat for the next phase. When all phases pass, mark the plan `implemented`.

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

### Choosing the test type

The plan's *Test Strategy* section (if present) tells you the balance. When it's absent, default heuristic:

- **Unit test** — a small piece of logic, no I/O, no collaborators that need real wiring. Fast, isolated.
- **Integration test** — when the unit-under-test is the seam between two real things (a use case + a real DB adapter, a controller + a real route). Slower, more realistic.
- **End-to-end** — only for the spine of the user-visible flow. Expensive; one well-placed E2E is worth ten brittle ones.

If you find yourself wanting a fourth mock to make a unit test work, that's a signal: this might be an integration test in disguise, or the design needs better boundaries.

## Step 3 — Green

Write the smallest change that makes the test pass.

"Smallest" means smallest:

- If the test asserts `add(2, 3) == 5`, return `5`. The next test will force generalization.
- If you're tempted to add validation, error handling, or edge cases the test didn't ask for — don't. Add them when a test demands them.

The discipline of small green steps is what keeps the red-green-refactor cycle tight and the design driven by tests rather than imagination.

### When the green is hard

Sometimes the smallest change is genuinely large because the test reaches across many components. When that happens, the test was probably too big — back up, write a smaller test on a smaller seam, and grow up to the original test from there. (This is GOOS / outside-in mockist style.)

## Step 4 — Refactor

With the green bar, look at the code:

- **Naming.** Does every name earn its place? Renames are cheap with green tests.
- **Duplication that hurts.** Two identical blocks in the same file usually want extraction. Two superficially-similar blocks across different files usually want to stay separate (Sandi Metz: prefer duplication to the wrong abstraction).
- **Missed abstractions.** A long function with three obvious sections wants to be three functions. Extract.
- **Dead code.** If the test passes without it, delete it.

After every change, re-run the tests. If they go red, undo the refactor and try a smaller step.

**Refactor the test code too.** Test code that's hard to read becomes test code people don't trust. Same standards as production code.

### What refactoring is *not*

- Adding new behavior. That's a new red-green cycle.
- Adding speculative seams "in case we need them". That's YAGNI bait.
- Reorganizing files just to make the diff prettier. The commit will look fine.

## Step 5 — Commit (hand off to `tdd-atomic-commits`)

Each phase typically yields one or more impl/test commit pairs. Hand off to the `tdd-atomic-commits` skill for the actual commit work — its rules govern:

- Implementation commit first, test commit second (every commit independently runnable).
- Conventional Commits subjects: `feat(scope): …`, `fix(scope): …`, `refactor(scope): …`, then `test(scope): …`.
- Stage by explicit filename — never `git add -A` / `git add .` / `git add -u`.
- One logical unit per commit; if a phase produced two paired changes, that's two pairs (four commits), not one.

**Commit messages are always English**, even when the conversation and the plan are in Portuguese — see the project's git conventions.

If the user asked the skill to skip commits (e.g., they want to review before committing), respect that. The phase isn't truly "done" until committed, but the user gets to choose the cadence.

## Step 6 — Mark the phase done

Open the plan file. In the phase body:

- Tick the acceptance-criteria checkboxes that are now true.
- If the plan uses an inline marker convention (`✓ implemented 2026-05-01`), add it after the phase title.
- Bump frontmatter `updated_at` to the current ISO timestamp.

Save the plan. Do **not** rewrite or restructure the plan — only add the markers. The plan is a historical record once written; edits are restricted to status, timestamps, phase markers, and explicit user-requested changes.

## After all phases

When the last phase passes:

1. Update frontmatter:
   - `status: implemented`
   - `implemented_at: <now ISO>`
   - `updated_at: <now ISO>`
2. Tell the user. One paragraph: phases completed, commit count, anything deferred.
3. Point at follow-ups — TODOs in the plan that were intentionally left for a future plan, anything the user flagged for a separate ticket.

## Cancellation

If the user cancels mid-implementation:

- Update frontmatter: `status: canceled`, `canceled_at: <now>`, bump `updated_at`.
- Leave commits as they are unless the user explicitly asks to revert them.
- Leave the plan file in place — canceled plans are valuable as history.

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

### A whole phase turns out to be wrong

If you finish a phase and the result is clearly the wrong shape — wrong abstraction, wrong boundary, wrong assumption — **don't push through**. Tell the user, agree on a course correction, update the plan (or replace the phase), and continue. The plan exists to keep you honest, including when reality diverges from it.

### Multiple atomic-commit pairs in one phase

A phase can legitimately produce two or three commit pairs if it touches two or three logical units that all belong to the same phase goal. The `tdd-atomic-commits` skill handles the splitting; just make sure the implementation files and test files are paired correctly when you stage.

If you find a phase consistently produces five or more commit pairs, the phase was probably too coarse — note it for the next plan you write.

## Things to avoid in `dev` mode

- **Skipping red.** "I know what the code should look like" is the road to untested code that happens to pass other tests. Write the failing test.
- **Skipping refactor.** Refactor is where TDD's compounding value comes from. Skipping it leaves the code one step behind every cycle.
- **Drifting from the plan silently.** If the phase doesn't fit reality, surface it. Don't ship a different plan than the one on disk.
- **Bundling unrelated changes.** A phase about pricing rules is not the place to also fix the date-formatting bug you noticed. File a follow-up; stay scoped.
- **Marking a phase done while tests are red.** "Done" means: all acceptance criteria met, all tests green, all commits clean. No exceptions.
