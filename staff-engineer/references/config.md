# Configuration

`staff-engineer-skill/config.yml` sets this skill's defaults for one project. Every key is
optional, and the skill works with no config file at all — the file exists to stop you
answering the same questions in every session.

Read it **once, early**, before resolving rigor or offering any setup prompt.

## Where it lives, and why it's committed

The config sits inside the working directory but is the one thing in there that belongs
in git:

```
staff-engineer-skill/
├── config.yml          ← committed: the project's contract
├── plans/              ← gitignored
│   ├── implemented/
│   └── canceled/
├── research/           ← gitignored
└── reviews/            ← gitignored
```

Plans, research, and reviews are working artifacts — useful to whoever wrote them, noise
to everyone else. The config is the opposite: rigor level, review budget, and ADR
location are decisions the whole team should inherit, and re-deciding them per developer
produces a repo where the standard depends on who ran the skill.

So the `.gitignore` entries are the three subfolders, not the root:

```gitignore
staff-engineer-skill/plans/
staff-engineer-skill/research/
staff-engineer-skill/reviews/
```

If the repo already ignores `staff-engineer-skill/` wholesale (from an earlier version of
this skill), the config file is invisible to git. Point that out once and offer the
narrower entries — don't rewrite someone's `.gitignore` silently.

## Full schema

Everything shown with its default. Omitted keys take the default; the file below is
equivalent to no file at all.

```yaml
# staff-engineer-skill/config.yml
version: 1

# Default rigor for new plans. When set, `design` skips auto-detection AND skips the
# question — this is the intended way to stop being asked every time.
# adaptive | balanced | strict
rigor: null

# Language of written artifacts (plans, research, reviews). Replies always follow the
# conversation. pt-BR | en-US
language: null

review:
  # When build calls review automatically.
  #   per_phase   — after each phase's refactor, before its commit (default)
  #   end_of_plan — once, over the plan's whole contribution
  #   off         — never; `/staff-engineer review` still works standalone
  auto: per_phase

  # Review rounds per phase before the loop stops and escalates to the user.
  max_rounds: 2

  # Severities build fixes inside the loop.
  fix: [blocker, major]

  # Severities recorded as follow-ups and never auto-fixed.
  defer: [minor, nit]

adr:
  enabled: true
  # Where ADRs live. null = detect (docs/adr, doc/adr, adr, docs/decisions, …).
  dir: null
  # auto = match the repo's existing ADRs; otherwise force a template.
  # auto | madr | nygard
  template: auto

commits:
  # false = build implements but leaves the working tree for you to commit.
  enabled: true

paths:
  # Rename the working directory if `staff-engineer-skill` collides with something.
  root: staff-engineer-skill
```

## Precedence

| Setting | Order, highest first |
|---|---|
| `rigor` | explicit token on the invocation → `config.rigor` → auto-detect, then ask |
| `language` (artifacts) | `config.language` → detected from the conversation |
| `language` (your replies) | always the conversation's language — config never overrides this |
| `review.*` | what the user says in this session ("skip the review here") → config → default |
| `adr.enabled` | per-plan opt-out in conversation → config → default |
| `adr.dir` | `config.adr.dir` → directory detection → `docs/adr/` |
| `commits.enabled` | what the user says in this session → config → default |

**Language deserves its split.** Artifacts are shared and outlive the conversation, so
their language should be stable no matter who ran the skill — that's the config's call.
Replies are for the person reading them right now, so they follow whoever is typing.
(ADRs are the exception to both: always English, because they're committed and
team-facing — unless the repo's existing ADRs are in another language. See `adr.md`.)

## Config changes don't reach back

A plan's `rigor` is written into its frontmatter when the plan is created, and that value
is the contract `build` and `review` obey. Changing `config.rigor` later does **not**
change plans already on disk.

This matters more than it looks. A plan written and argued at `balanced` has phases,
tests, and trade-offs sized for `balanced`; re-reading it at `strict` six weeks later
would make `review` raise findings against a standard the plan was never written to meet,
and the loop would escalate on decisions nobody actually revisited. The frontmatter is
the contract precisely so that it can't drift underneath the work.

To change a live plan's rigor, say so explicitly — then it's a deliberate edit to the
plan, with the reason recorded, not a side effect of a config commit.

## When the config is broken

A config file that halts the skill is worse than no config file. Degrade, don't stop:

- **Unknown key** → ignore it, mention it once in your first reply, keep going. A typo
  shouldn't cost the session.
- **Invalid value** (`rigor: rigorous`, `max_rounds: "two"`) → fall back to the default for
  that key, say which key and which default in one line, keep going.
- **Unparseable YAML** → say so, proceed as if there were no config, and offer to fix the
  file. Don't guess at the author's intent by pattern-matching a broken document.
- **`version` higher than you know** → read the keys you recognize, ignore the rest, note
  it once.

In every case the note is one line, not a section. The user asked for a plan or an
implementation; a config warning that buries the actual answer has its priorities
backwards.

## First-run setup

The first time this skill runs in a project (no `config.yml`, working directory not
ignored), fold setup into **one** question rather than three across three sessions.

Detect rigor first (see `rigor-levels.md`), then ask, in the user's language, roughly:

> This looks like the first time you're using the Staff Engineer skill here. I'd suggest
> writing `staff-engineer-skill/config.yml` with `rigor: balanced` (detected: mixed test
> coverage, no layering) and adding `plans/`, `research/`, and `reviews/` to `.gitignore`
> — the config stays committed so the whole team inherits the same standard. Sound good,
> or would you rather set the rigor level per plan?

On acceptance: write the config with the detected rigor plus the defaults you're not
changing left out, and append the three `.gitignore` entries. Don't commit either —
offer, and let the user decide when.

On decline: write nothing. Ask the rigor question per plan as usual, and don't re-offer
the config in later sessions — declining once is an answer.

If a config exists but the gitignore entries are missing, that's the narrower prompt:
offer the three lines and nothing else.

## What doesn't belong in config

- **Anything a specific plan owns.** The plan's rigor, its phases, its ADR list. Config
  sets defaults for *new* work; the plan is the contract for *its* work.
- **Credentials, tokens, or environment values.** This file is committed. Nothing that
  can't be read by everyone with repo access goes in it.
- **Prompt overrides or behavioral instructions.** A config that can rewrite the skill's
  judgment ("always agree", "skip pushback") turns a shared file into a way to disable a
  reviewer for the whole team. Standards belong in `rigor`; opinions belong in the
  conversation.

## Worked examples

**Legacy codebase, ship fast, keep the loop out of the way.**

```yaml
version: 1
rigor: adaptive
language: pt-BR
review:
  auto: end_of_plan
  max_rounds: 1
```

One review at the end, one round, `adaptive` standards — review raises blockers and floor
violations only, which in a legacy codebase is exactly the set worth interrupting for.

**Product team, the daily driver.**

```yaml
version: 1
rigor: balanced
language: pt-BR
adr:
  dir: docs/adr
```

Everything else default: review per phase, two rounds, blockers and majors fixed in-loop,
minors deferred.

**Strict backend, no auto-commits (the team reviews the tree before it lands).**

```yaml
version: 1
rigor: strict
language: en-US
review:
  max_rounds: 3
commits:
  enabled: false
```

Three rounds because `strict` findings (TDD ordering, aggregate invariants, `Either`
returns) often take two passes to settle, and the extra round is cheaper than escalating
a decision the loop could have closed on its own.
