# Research mode reference

How `research` mode works end-to-end. Read this at the start of `research` mode.

Research is the **divergent** half of the workflow; `design` is the convergent half. Keeping them apart is the whole point: a plan written while you're still discovering the problem produces confident-sounding decisions with nothing behind them. Research earns the right to decide.

## What research is for

Good research questions:

- *Which event-store approach fits our write volume and team — EventStoreDB, Postgres-as-event-log, or Kafka + snapshots?*
- *How do we migrate off this ORM without a big-bang cutover?*
- *Is our aggregate boundary wrong, and what's the evidence either way?*
- *What does the current version of this library actually recommend, and how far is our usage from it?*

Bad research questions — send these somewhere else:

- *How do I write a for loop in Rust?* — that's a lookup, not research. Just answer it.
- *Should we use tabs or spaces?* — no structural cost, no research needed.
- *Will users like this feature?* — that's for the PM, not for you. Say so and stop.

## Step 1 — Sharpen the question, then confirm it

Research without a bounded question runs forever and produces a wall of text nobody reads. Before investigating anything, restate the question in one sentence and name what's explicitly out of scope. Show that to the user and get a nod.

While you're there, ask only what you actually need to scope the search:

- What decision hangs on this? (research nobody will act on is waste)
- What's already been tried or rejected, and why?
- What are the hard constraints — stack, versions, scale, deadline, team size, compliance?
- What's the deadline for the *answer*? (a two-hour question and a two-day question get different depth)

Cap at 3–5 questions. Research mode should ask fewer than `design` mode, not more — the investigation is where you get your answers.

## Step 2 — Investigate, cheapest source first

Order matters, because each step can make the next unnecessary:

1. **The codebase.** Read the actual code, the dependency manifests, the migrations, the tests. Most questions about "how should we do X here" are answered by how the project already does X-adjacent things. Free, and it's ground truth.
2. **Version-pinned library docs.** Read the installed versions first, then look those versions up — see `live-docs.md`. Advice for a version you don't run is worse than no advice.
3. **Primary written sources.** Official docs, RFCs, specs, the library's own repo and changelog, the canon (see `principles.md`).
4. **Secondary sources.** Conference talks, engineering blogs, Fowler's site, Stack Overflow. Useful for war stories and failure modes; weak as authority.

Stop when the next source stops changing the recommendation. That's the budget.

## Step 3 — Keep a verification ledger

The single most damaging thing research can do is state something confidently from training memory that turned out to be stale. Your knowledge has a cutoff; library APIs move.

So every finding carries its provenance inline:

```markdown
- Prisma's interactive transactions have a 5s default timeout, configurable via
  `transactionOptions.timeout`. *[verified: Prisma docs 6.x, accessed 2026-07-26]*

- Postgres advisory locks are session-scoped, so they don't survive a pooled
  connection being handed to another request. *[inferred: prior knowledge, not
  verified against current docs]*
```

Two tags, no third option. `[verified: <source>, accessed <date>]` means you actually looked at it this session. `[inferred: ...]` means you're recalling it. A reader can then decide which claims to re-check before betting on them, which is exactly the value a research file has over a chat message.

If a load-bearing claim is only `[inferred]`, either go verify it or say plainly in the recommendation that the choice rests on an unverified assumption.

## Step 4 — Compare real options

A single-option "research" is advocacy wearing a lab coat. Find at least two genuine candidates — including, where honest, "do nothing / keep the current approach", which is very often the right answer and almost never gets written down.

For each option: what it costs to adopt, what it costs to live with, what it costs to reverse. Reversal cost is the one people forget and the one that matters most (Fowler: architecture is the stuff that's hard to change).

A comparison table earns its place here. Keep the columns concrete — "medium complexity" tells the reader nothing; "two new services to operate, ~1 week of setup" tells them something.

## Step 5 — Recommend, and say what would change your mind

Pick one. Hedging across three options hands the decision back to the user unimproved, which is the one outcome that makes the research worthless.

Then write the falsification criteria: the concrete signals that would make this recommendation wrong. *"If write volume exceeds ~5k events/s, the Postgres approach stops working and Option B becomes correct."* This is what lets a future reader re-evaluate without redoing the whole investigation, and it's what keeps you honest — a recommendation you can't falsify is a preference, not a finding.

## The research file

Path: `staff-engineer-skill/research/<YYYY-MM-DD>-<slug>.md`. Same slug rules as plans — 2–5 distinctive keywords, kebab-case, ASCII. Same timestamp rule: run `date -u +%Y-%m-%dT%H:%M:%SZ` for every stamp; never synthesize it from context.

### Frontmatter

```yaml
---
kind: research
title: <Research title in the user's language>
slug: <kebab-slug>
status: complete          # complete | superseded
question: <the one-sentence question this file answers>
created_at: 2026-07-26T14:32:09Z
updated_at: 2026-07-26T14:32:09Z
language: pt-BR           # pt-BR | en-US — language of the prose
rigor_detected: balanced  # what the project looks like; a hint for the plan, not a decision
spawned_plans: []         # filled in when a plan is derived from this research
superseded_by: null       # path to a later research file that replaces this one
---
```

`rigor_detected` is recorded but **not acted on**. Rigor governs how code gets written; research writes no code. Carrying the detection forward just saves the plan a step later.

`status: complete` is the normal terminal state — research isn't "implemented". Mark an old file `superseded` only when a later research file answers the same question differently; set `superseded_by` and leave the original text untouched, for the same reason ADRs are immutable (see `adr.md`).

### Body

```markdown
# <Title>

## Question & Scope
## Method & Sources
## Findings
## Options & Trade-offs
## Recommendation
## What Would Change This
## Open Questions
## References
```

All eight are present — unlike plan sections, none are conditional. A research file missing *What Would Change This* or *Options & Trade-offs* isn't a lean research file; it's an incomplete one.

**Question & Scope.** The sharpened question, the decision that hangs on it, and what you deliberately did not investigate.

**Method & Sources.** What you consulted and when. For libraries, the version you looked up and the version the project runs — if they differ, say so, because that gap is often the finding.

**Findings.** The substance, each item tagged `[verified: …]` or `[inferred: …]`.

**Options & Trade-offs.** Two or more real candidates, with adoption cost, carrying cost, and reversal cost. Table or structured prose.

**Recommendation.** One choice, with the reasoning chain visible.

**What Would Change This.** The falsification criteria.

**Open Questions.** What you couldn't answer and what it would take to answer it. Honest gaps beat invented completeness.

**References.** Sources with URLs and access dates for anything live; author/work/chapter for the canon.

## Step 6 — Offer the next step

Research that doesn't lead anywhere is a nice document. Close by asking whether the user wants a plan built on it — and if they say yes, hand off to `design` mode with `derived_from` pointing at this file, and append the plan's path to `spawned_plans` here.

The link is bidirectional on purpose. Six months later, someone reading the plan needs to find the investigation, and someone reading the investigation needs to know whether anyone acted on it.

## Where dissent shows up in research

Research is where you're most likely to find that the user's premise is wrong — they asked "which event store should we use" and the honest answer is "you don't need one". Say that. Put it in the recommendation with the evidence, and keep the event-store comparison in the file anyway, because they asked and because ruling it out with data is more convincing than ruling it out by assertion.

See the *Constructive dissent* section in `SKILL.md` for how hard to push and when to stop.

---

## Worked example — skeleton

```markdown
---
kind: research
title: Estratégia de event store para o contexto de Pedidos
slug: order-event-store
status: complete
question: Qual abordagem de event store sustenta 2k eventos/s no contexto de Pedidos sem adicionar um serviço novo para operar?
created_at: 2026-07-26T14:32:09Z
updated_at: 2026-07-26T14:32:09Z
language: pt
rigor_detected: strict
spawned_plans: []
superseded_by: null
---

# Estratégia de event store para o contexto de Pedidos

## Question & Scope

**Pergunta.** Qual abordagem de event store sustenta ~2k eventos/s de escrita
no contexto de Pedidos sem introduzir um serviço novo no runbook do time?

**Decisão que depende disso.** A fase 1 do plano de event sourcing de Pedidos —
escolher errado aqui custa a reescrita da camada de persistência inteira.

**Fora de escopo.** Projeções de leitura e CQRS (pesquisa separada); retenção e
compactação de eventos.

## Method & Sources

- Código: `src/modules/orders/`, `prisma/schema.prisma`, `docker-compose.yml`.
  Postgres 16 já em produção, sem Kafka, time de 4 pessoas sem SRE dedicado.
- Docs versionadas: Prisma 6.x, Postgres 16 (ver `live-docs.md`).
- Canon: Vernon, *Implementing DDD* Cap. 8 (Domain Events); Fowler,
  "Event Sourcing" (martinfowler.com, 2005).

## Findings

- Postgres 16 sustenta com folga 2k inserts/s em tabela append-only com índice
  em `(aggregate_id, version)`, no hardware atual.
  *[verified: benchmark local, 2026-07-26]*
- O `WatchedList` já usado no projeto cobre o delta de coleção dentro do
  agregado; não é substituto de event store.
  *[verified: leitura de `src/core/`, 2026-07-26]*
- EventStoreDB traz projeções e subscriptions prontas, ao custo de um serviço
  novo no runbook. *[inferido: conhecimento prévio, não verificado]*

## Options & Trade-offs

| Opção | Custo de adoção | Custo de operação | Custo de reversão |
|---|---|---|---|
| Postgres append-only | ~3 dias | zero (já existe) | baixo — é uma tabela |
| EventStoreDB | ~2 semanas | serviço novo, sem SRE | alto — formato próprio |
| Kafka + snapshots | ~3 semanas | cluster + retenção | alto |

## Recommendation

Postgres append-only. Volume cabe, custo de reversão é o menor dos três, e o
time não tem capacidade operacional para um quarto serviço.

## What Would Change This

- Escrita passar de ~5k eventos/s sustentados → Postgres deixa de servir.
- Necessidade de subscriptions cross-serviço em tempo real → Kafka volta à mesa.
- Contratação de SRE dedicado → o custo operacional do EventStoreDB cai.

## Open Questions

- Estratégia de snapshot para agregados com mais de ~10k eventos. Não medimos
  se algum Pedido chega perto disso.

## References

- Fowler, "Event Sourcing" (martinfowler.com, 2005) — acessado 2026-07-26.
- Vernon, *Implementing Domain-Driven Design*, Cap. 8.
- Postgres 16 docs, "Table Partitioning" — acessado 2026-07-26.
```
