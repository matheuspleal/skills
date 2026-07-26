<p align="center">
  <img src="https://em-content.zobj.net/source/apple/391/hammer-and-wrench_1f6e0-fe0f.png" width="120" />
</p>

<h1 align="center">Skills</h1>

<p align="center">
  <strong>Opinionated skills for Claude Code</strong>
</p>

<p align="center">
  <a href="https://github.com/matheuspleal/skills/stargazers"><img src="https://img.shields.io/github/stars/matheuspleal/skills?style=flat&color=yellow" alt="Stars"></a>
  <a href="https://github.com/matheuspleal/skills/commits/main"><img src="https://img.shields.io/github/last-commit/matheuspleal/skills?style=flat" alt="Last Commit"></a>
  <a href="LICENSE"><img src="https://img.shields.io/github/license/matheuspleal/skills?style=flat" alt="License"></a>
</p>

<p align="center">
  <a href="#install">Install</a> •
  <a href="#all-skills">All Skills</a> •
  <a href="#license">License</a>
</p>

---

A collection of [Claude Code](https://docs.anthropic.com/en/docs/claude-code) skills that enforce opinionated workflows around commits, testing, code quality, and more. Install once, use in every session.

## Install

| Agent | Command |
|-------|---------|
| **Claude Code** | `npx skills add matheuspleal/skills` |
| **Cursor** | `npx skills add matheuspleal/skills -a cursor` |
| **Windsurf** | `npx skills add matheuspleal/skills -a windsurf` |
| **Copilot** | `npx skills add matheuspleal/skills -a github-copilot` |
| **Cline** | `npx skills add matheuspleal/skills -a cline` |
| **Any other** | `npx skills add matheuspleal/skills` |

Uninstall: `npx skills remove skills`

## All Skills

### 🧠 staff-engineer

Senior/staff-engineer mode for non-trivial features, refactors, migrations, and deep technical investigations. Two orthogonal axes: an **execution mode** — `research`, `plan`, `dev` — and a **rigor level** that controls how strictly the canon is applied.

It is deliberately **not agreeable**. The value of a staff engineer is in finding what's wrong with an approach while changing it is still cheap, so the skill argues — once, with citations, a concrete cost, a real alternative, and what would prove it wrong — then executes your call and records the disagreement.

**Execution modes:**

```
research  ──▶  plan  ──▶  dev
   │            │          │
   │            │          └─ implements phases via red-green-refactor,
   │            │             accepts the plan's ADRs as they land
   │            └─ phased plan file + ADRs for significant decisions
   └─ sourced, falsifiable research file
```

Each step is optional — day to day it's `plan` → `dev`; a well-understood change goes straight to `dev` from an existing plan. Links between artifacts are recorded on both sides, so the chain stays traceable months later.

- **`research`** — investigates a bounded question and writes `staff-engineer-skill/research/<date>-<slug>.md`. Every finding is tagged `[verified: <source>, accessed <date>]` or `[inferred: not verified]`, so a reader knows which claims to re-check. Always compares at least two real options with adoption / carrying / **reversal** cost, recommends one, and states what would make the recommendation wrong.
- **`plan`** — interviews you (5–7 focused questions), then writes `staff-engineer-skill/plans/<date>-<slug>.md` with a frontmatter status lifecycle (`pending` → `in_progress` → `implemented` / `canceled`). Reuses existing research instead of re-asking what it already settled.
- **`dev`** — picks a pending plan, implements phase-by-phase via red-green-refactor, hands off to `tdd-atomic-commits` for commits, flips the plan's ADRs to `Accepted` as phases land, and marks the plan implemented.

**Architecture Decision Records:**

Plans record architecturally significant decisions as ADRs in `docs/adr/` ([Nygard](https://cognitect.com/blog/2011/11/15/documenting-architecture-decisions), MADR format, `adr-tools`-compatible numbering).

- **The check runs on every plan; most plans produce zero ADRs.** An ADR is about the *first* time — the system's first auth scheme earns one, the fifth endpoint using it doesn't. The gate: expensive to reverse, structural, contractual, a dependency commitment, a non-functional trade-off, or a conscious divergence from good practice. A `GET /health` plan produces none, and says so.
- **ADRs work like migrations — superseded, never overwritten.** A changed decision means a *new* ADR; the old one keeps its content and only its `Status` line becomes `Superseded by ADR-NNNN`. The record of a decision that didn't survive is the one a future reader most needs.
- Detects an existing ADR directory and matches its template rather than imposing one. Written in English (committed, team-facing) while plans and research follow your conversation's language. Guards against `docs/adr/` being gitignored.
- Opt out per plan and it won't re-offer.

**Rigor levels** (auto-detected from the project, suggested, then confirmed when a plan is created; recorded in the plan's frontmatter and obeyed by `dev`):

- `adaptive` — mirror the project's existing conventions even when subpar (staff dropped into a legacy/foreign codebase); tests only where cheap or already present
- `balanced` — pragmatic; resist clearly harmful practices, tests for new/changed behavior, improve at the edges
- `strict` — full canon: TDD/DDD/Clean Architecture, with the [node-js-boilerplate](https://github.com/matheuspleal/node-js-boilerplate) as the backend source of truth (fetched on demand); community best practices for frontend
- Override the auto-detect-and-ask flow with an explicit token: `/staff-engineer plan strict <prompt>`

**Version-pinned documentation:**

Reads the project's lockfile *before* looking anything up, then consults the docs for the version actually installed — via the [Context7](https://context7.com) MCP when available, official docs otherwise. Training-data cutoffs make stale API knowledge feel exactly as confident as current knowledge; this is the habit that catches it. Sources are cited with version and access date.

**The canon it draws on:**

Fowler (refactoring, evolutionary architecture), Evans & Vernon (DDD), Uncle Bob (Clean Architecture, SOLID), Beck (TDD), Feathers (legacy code), Metz (the wrong abstraction), Nygard (ADRs), and Bay's [Object Calisthenics](https://www.cs.helsinki.fi/u/luontola/tdd-2009/ext/ObjectCalisthenics.pdf) — the last one framed as the training exercise it was written as, not a production style guide. The three rules that survive contact with production (wrap primitives, first-class collections, no getters/setters) are tactical DDD under another name; the extreme ones (max two instance variables) are the drill.

**Plan sections:**

- Always present: *Context & Constraints*, *Implementation Phases*, *Risks & Trade-offs*, *References*
- Conditional: *Domain Model*, *Architecture Decisions*, *Test Strategy*, *Migration / Rollout Plan*, *Decision Records* — included when warranted; `strict` turns the first three on by default, `adaptive` biases them off

**Triggers:**

- `/staff-engineer [research|plan|dev] [adaptive|balanced|strict] <prompt>`
- "research the options" / "compare these approaches" / "which library should we use" / "let's plan this properly" / "think this through end-to-end" / "model the domain" / "design the architecture" / "split into phases" / "write an ADR" / "record this decision" / "follow the legacy project's pattern" / "strict/rigorous TDD"
- Portuguese: "pesquisar opções" / "investigar abordagens" / "comparar bibliotecas" / "planejar feature" / "modelar domínio" / "arquitetura limpa" / "pensar como staff" / "preciso de um plano" / "dividir em fases" / "registrar decisão arquitetural" / "seguir o padrão do projeto legado" / "modo adaptive/balanced/strict"

Prefer this skill over ad-hoc planning or ad-hoc research whenever the change is non-trivial — touches multiple modules, has architectural implications, introduces a new bounded context, or warrants phased rollout.

### ⚛️ tdd-atomic-commits

Splits a working tree containing both implementation and test changes into **two atomic commits per feature** — implementation first, then its test — so git history reads like a clean, bisectable TDD story.

**What it does:**

- Inspects staged and unstaged changes
- Pairs implementation files with their test files by naming convention (`foo.ts` ↔ `foo.test.ts`, `foo.py` ↔ `test_foo.py`, `foo.go` ↔ `foo_test.go`, etc.)
- Commits implementation first, test second — every commit stands on its own
- Uses [Conventional Commits](https://www.conventionalcommits.org/) (`feat`, `fix`, `refactor`, `test`, …)
- Stages files by explicit path — never `git add -A` or `git add .`
- Asks before committing unpaired files or ambiguous groupings

**Example output:**

```
feat(auth): validate token expiry against server clock
test(auth): ensure token expiry rejects skewed clocks
refactor(auth): extract session lookup into dedicated helper
test(auth): cover session lookup helper edge cases
```

Two logical units → four commits, each pair impl-first.

**Triggers:**

Activates automatically when the diff contains paired source + test files. Also triggers with:

- "commit this" / "faça os commits"
- "commit the changes" / "commita as mudanças"
- "make the commits"

Never silently bundles unrelated files. When in doubt, it asks.

## License

MIT
