# Architecture Decision Records

How `plan` mode produces ADRs and how `dev` mode keeps them true. Read this when a plan is about to record decisions, or when a `dev` phase changes one.

## Why ADRs exist

Code shows *what* the system does. Git history shows *when* it changed. Neither shows **why someone chose this over the alternative they rejected** — and that's the information the next engineer needs before they "clean up" a decision they don't understand.

Michael Nygard's 2011 post ("Documenting Architecture Decisions") is the origin; `adr-tools` (Nat Pryce) and MADR are the two widely-used implementations. The pattern is on ThoughtWorks Radar's *Adopt* ring. This is settled practice, not a preference.

## The immutability rule — ADRs work like migrations

You never edit an applied migration. You write a new one. ADRs work the same way, and for the same reason: the record of a decision that was later reversed is *more* valuable than the reversal alone, because it tells you what was known at the time.

So when a decision changes:

1. The old ADR **keeps its content, unchanged**. Nobody rewrites the Context, the Considered Options, or the Decision Outcome.
2. Its `Status` line — and only that line — becomes `Superseded by ADR-0012`.
3. A new ADR is written with `Supersedes ADR-0007` and explains what changed: new information, new constraints, or the old decision simply not surviving contact with reality.

The only edits an accepted ADR ever receives are to its `Status` line. If you find yourself rewriting the body of an accepted ADR, stop — you want a new ADR.

## Where ADRs live

Detect before defaulting. Check in this order and use the first that exists:

1. `docs/adr/`
2. `doc/adr/`
3. `adr/`
4. `docs/architecture/decisions/`
5. `docs/decisions/`

None found → create `docs/adr/`.

**If ADRs already exist, read one and match it.** Its numbering width, its filename convention, its template (Nygard vs MADR vs house style), its heading names, its language. Imposing your template on a repo that already has thirty ADRs in another format is exactly the failure this skill's `adaptive` instinct exists to prevent — and it applies to documentation as much as to code.

### The gitignore guard

`docs/adr/` must be **committed**. This is the opposite of `staff-engineer-skill/`, which the skill offers to ignore. Plans are your working artifact; ADRs are the team's record.

Before writing, check the ADR directory isn't covered by `.gitignore`. If it is, say so and stop — an ignored ADR is a file nobody will ever read, and silently writing one is worse than writing none.

### The index

If `docs/adr/README.md` exists, append a row when you add an ADR. If it doesn't and you're creating the first ADR, create it — a one-line-per-decision table is the cheapest possible navigation and `adr-tools` generates one by default:

```markdown
# Architecture Decision Records

| ADR | Title | Status | Date |
|-----|-------|--------|------|
| [0001](0001-use-postgres-append-only-event-log.md) | Use Postgres append-only event log | Accepted | 2026-07-26 |
| [0002](0002-jwt-over-server-sessions.md) | JWT over server sessions | Superseded by [0009](0009-...) | 2026-07-26 |
```

### The meta-ADR

Convention (from `adr-tools`) is that ADR 0000 or 0001 records the decision to use ADRs at all. When you're creating a repo's very first ADR, offer to add it — once, like the gitignore check. If the user declines, don't ask again.

## Numbering

`NNNN-kebab-case-title.md`, zero-padded to 4 digits, monotonically increasing. Scan the directory for the highest existing number and add one. Numbers are **never reused** — even for an ADR that was superseded, rejected, or turned out to be wrong. A gap or a dead number is fine; a reused number breaks every existing cross-reference.

Title in the filename mirrors the ADR's title, kebab-cased and ASCII-only.

## Language

**ADRs are written in English**, regardless of the conversation's language or the plan's language, unless the repo's existing ADRs are in another language — in which case match them (see *Where ADRs live*).

The reasoning: ADRs are committed, long-lived, team-facing repo artifacts, and this project's conventions put committed content in English. Plans are working documents in whatever language the conversation runs; ADRs outlive the conversation.

## The significance gate — the part that matters most

"Plans generate ADRs by default" has a well-known failure mode: one ADR per plan turns `docs/adr/` into noise, and the moment a directory is noise, nobody reads any of it — including the three ADRs that mattered.

So the default is on, but each candidate decision has to earn its record. Write an ADR when the decision is **architecturally significant**, which means at least one of:

- **Expensive to reverse.** Changing it later means touching many call sites, a data migration, or a coordinated deploy.
- **Structural.** It sets or moves a boundary: a bounded context, a module split, a layering rule, a service edge.
- **Contractual.** It changes a public API, an event schema, a database schema others read, or a wire format.
- **A dependency commitment.** Adopting, replacing, or deliberately not adopting a significant third-party library, service, or platform.
- **A non-functional trade-off.** A deliberate choice about consistency, latency, availability, cost, or security posture.
- **A conscious divergence from good practice.** Deciding to follow an existing convention that falls short of the canon, because fighting the codebase costs more than living with it. This one is easy to miss and is often the most valuable ADR in the repo — it's the difference between "the team knew and chose this" and "nobody noticed".

Do **not** write an ADR for: adding a CRUD endpoint, a naming choice, a formatting rule, an internal refactor with no boundary change, or "we will use the framework we already use".

A plan legitimately produces **zero, one, or several** ADRs. When zero decisions clear the gate, say so explicitly — *"no architecturally significant decisions in this plan, so no ADRs"* — rather than manufacturing one to look thorough. That sentence is itself useful information about the size of the change.

## Status lifecycle

```
Proposed  ──(dev implements the phase)──▶  Accepted  ──▶  Superseded by ADR-NNNN
   │                                          │
   └──(user rejects the decision)──▶ Rejected └──▶  Deprecated (no replacement)
```

- **Proposed** — written by `plan`. The decision is on the table; nothing has been built yet.
- **Accepted** — flipped by `dev` when the phase implementing the decision lands. The decision is now real, in code.
- **Rejected** — the user turned it down during planning. Keep the file; a rejected option with recorded reasoning saves the next person from re-proposing it.
- **Superseded by ADR-NNNN** — a later decision replaced this one.
- **Deprecated** — the decision no longer applies and nothing replaced it (the feature was removed, the constraint disappeared).

Flipping `Proposed → Accepted` is a one-line edit. It's what keeps `docs/adr/` a record of what the system *is* rather than what someone once intended.

## Committing ADRs

ADRs are repo artifacts, so unlike plans they belong in git. Offer the commit; don't make it silently.

- Plan mode, after writing: offer `docs(adr): propose <short decision>`.
- Dev mode, on acceptance: `docs(adr): accept ADR-NNNN <short decision>` — or fold the one-line status edit into the phase's commit when it's the same logical change.
- Supersession: `docs(adr): supersede ADR-0007 with ADR-0012 <short reason>`.

Conventional Commits, English, per the project's git conventions.

## Template — MADR-lean (default)

Use this when the repo has no existing ADRs to match. It's MADR 4.x trimmed to what actually gets read.

```markdown
# NNNN. <Decision title, imperative and specific>

* **Status:** Proposed
* **Date:** YYYY-MM-DD
* **Plan:** staff-engineer-skill/plans/<plan-file>.md
* **Supersedes:** — <or ADR-NNNN>
* **Superseded by:** — <or ADR-NNNN>

## Context and Problem Statement

What forced a decision here. The constraints in play, the problem in one or two
paragraphs. Written so someone with no memory of this week can follow it.

## Decision Drivers

* <the constraint or quality attribute that actually drove the choice>
* <another one>

## Considered Options

1. **<Option A>** — one line.
2. **<Option B>** — one line.
3. **<Do nothing / keep current approach>** — almost always a real option; say why it lost.

## Decision Outcome

**Chosen: <Option X>**, because <the reason that actually decided it, not a list
of every advantage>.

### Consequences

* **Good:** <what this buys us>
* **Bad:** <what this costs us — if this bullet is empty, the analysis is incomplete>
* **Neutral:** <what changes without being better or worse>

### Reversal

What undoing this looks like and roughly what it costs. This is the field that
tells a future reader how hard to think before changing it.

## Pros and Cons of the Options

### <Option A>
* Good: …
* Bad: …

### <Option B>
* Good: …
* Bad: …

## More Information

Research file, benchmarks, RFCs, canon citations, links to the discussion.
```

## Template — Nygard (when matching an existing repo)

```markdown
# NNNN. <Title>

Date: YYYY-MM-DD

## Status

Proposed

## Context

<the forces at play>

## Decision

<what we're doing, in active voice: "We will …">

## Consequences

<what becomes easier, what becomes harder, for whom>
```

Shorter and older; if a repo already uses it, don't upgrade them to MADR unasked.

## Writing the thing well

- **The title is a decision, not a topic.** "Use Postgres append-only event log" — not "Event storage". A reader scanning the index should learn the decision from the title alone.
- **Rejected options are the point.** An ADR listing one option is a design doc. The reader's real question is usually "did they consider X?", and the answer needs to be in the file.
- **The Bad bullet is mandatory.** Every real decision costs something. A consequences section with only upsides means the analysis stopped early — and it destroys the reader's trust in the rest of the record.
- **Write for someone with no context.** Not your teammate this sprint; a new hire in two years, or you, having forgotten.
- **Present tense, active voice, in the moment of deciding.** "We will use X because Y." Not "It was decided that…".
- **One decision per ADR.** Two decisions bundled together can't be superseded independently, and one of them always changes first.

## Interaction with the rigor levels

ADRs are **orthogonal to rigor** — the significance gate decides, not the rigor level.

`adaptive` in particular should still produce them. Choosing to follow a legacy convention that diverges from the canon is precisely an architecturally significant decision, and the plan's *Risks & Trade-offs* section already requires that it be named. An ADR is that requirement in its durable, team-visible form: *"we know this isn't how you'd do it greenfield; here's the cost of doing it the other way, and here's the signal that should make us revisit."*
