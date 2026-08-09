# Live documentation lookups

How to get **current, version-correct** library and language guidance instead of relying on training memory. Read this before recommending or writing code against a third-party API you haven't verified this session.

## Why this file exists

Your training data has a cutoff. Library APIs, framework idioms, and "current best practice" move faster than that cutoff — and the failure mode is nasty, because stale knowledge doesn't feel uncertain. You'll confidently write a deprecated API call, or recommend a pattern the maintainers moved away from two majors ago, and nothing in the output signals doubt.

Two habits fix most of it: **read the version the project actually runs** before looking anything up, and **cite what you looked at**.

## Rule 1 — Version first, always

Before consulting any documentation, find out what the project actually depends on. Reading docs for v6 while the project runs v3 is worse than reading nothing, because it produces plausible code that fails at runtime.

Where to look, by ecosystem:

| Ecosystem | Declared | Resolved (prefer this) |
|---|---|---|
| Node | `package.json` | `package-lock.json`, `pnpm-lock.yaml`, `yarn.lock` |
| Python | `pyproject.toml`, `requirements.txt` | `poetry.lock`, `uv.lock`, `requirements.txt` pinned |
| Go | `go.mod` | `go.sum` |
| Rust | `Cargo.toml` | `Cargo.lock` |
| Ruby | `Gemfile` | `Gemfile.lock` |
| PHP | `composer.json` | `composer.lock` |
| JVM | `pom.xml`, `build.gradle` | `gradle.lockfile` |
| .NET | `*.csproj` | `packages.lock.json` |

Prefer the lockfile: `^6.2.0` in a manifest tells you what's allowed, the lockfile tells you what's installed. Also check the language runtime itself — `.nvmrc`, `.python-version`, `go.mod`'s `go` directive, `rust-toolchain.toml` — since language-level idioms are version-gated too.

When the installed version is behind current and the gap matters, **that gap is itself a finding**. Say so: *"the project is on Prisma 4.x; interactive-transaction options changed in 5.0 — the approach below targets 4.x, and upgrading is a separate decision."* Don't quietly write code for the version you wish they were on.

## Rule 2 — Use Context7 when it's available

Context7 is an MCP server that serves current, version-tagged library documentation. When its tools are present in the session (names look like `resolve-library-id`, `query-docs`, or `get-library-docs`, usually with an MCP prefix), it's the fastest path to accurate library answers and should be preferred over web search for anything library-specific.

The flow is two steps:

1. **Resolve the library** — `resolve-library-id` with the package name, to get Context7's identifier for it. Names are ambiguous across ecosystems; this step disambiguates.
2. **Query the docs** — `query-docs` (or `get-library-docs`) with that identifier and a **specific question**, not a topic. *"How do I set a timeout on an interactive transaction in Prisma 6?"* returns something useful; *"tell me about Prisma"* returns a wall.

Include the version in the question whenever you know it, which after Rule 1 you always do.

Good uses:

- API syntax, configuration, and options for a specific version
- Migration guides between majors
- What the maintainers currently recommend, versus what a 2023 blog post recommends
- CLI flags and setup steps
- Debugging a library-specific error message

Poor uses — Context7 won't help and you'll waste a round trip:

- General programming concepts, design patterns, architecture questions
- Anything about *this* codebase's business logic
- Code review and refactoring judgment

## Rule 3 — Source hierarchy

When Context7 isn't available, or the question isn't library-specific, work down this list and stop as soon as you have a solid answer:

1. **Official docs for the installed version.** Most projects publish per-version docs; use the version selector rather than `/latest`.
2. **The spec.** RFCs, W3C, language references, database manuals. Authoritative and stable.
3. **The library's own repo.** Changelog, migration guide, release notes, and the tests — tests are underrated as documentation of intended usage.
4. **Maintainer-authored writing.** Release blog posts, RFC discussions, GitHub issues where maintainers answer.
5. **Community sources.** Engineering blogs, conference talks, Stack Overflow. Good for failure modes and war stories; weak as authority, and often pinned to whatever version was current when written — always check the date.

A community post that contradicts current official docs loses, unless it's documenting a bug the docs don't mention. Note that case explicitly rather than silently picking one.

## Rule 4 — Cite what you looked at

Every claim sourced from live docs carries the library, the version, and the access date:

> Fastify's `onRequest` hook runs before body parsing, so `request.body` is
> undefined there. *[Fastify 5.x docs, "Lifecycle", accessed 2026-07-26]*

Three reasons this matters more than it looks. It lets the reader re-verify without redoing your search. It makes the claim's shelf life visible — a 2026 citation reads differently in 2028. And it forces you to notice when you're about to state something you didn't actually check, which is the whole point.

In `research` mode this is formalized as the verification ledger (see `research-mode.md`). In `design`, `build`, and `review` mode, inline citations in the relevant section are enough.

## Rule 5 — Fresh docs don't override project conventions in `adaptive`

Finding that the community moved on from the pattern this codebase uses does **not** license you to introduce the new pattern mid-task. Under `adaptive` you mirror the project; under `balanced` you may improve at the edges of what you're already touching; under `strict` the current practice is the target.

When live docs and the project's convention disagree, the honest move is the same at every rigor level: name the gap once, in the plan's *Risks & Trade-offs* or in the ADR, and then follow the rigor level's rule. Silently upgrading a codebase to a newer idiom while implementing an unrelated feature is scope creep wearing a best-practices badge.

## When to reach for this

- **`research` mode** — always, for any library or platform question. Version-pinned lookups are a required part of the method.
- **`design` mode** — when the plan adopts, upgrades, or replaces a dependency, or when a phase depends on specific API behavior. Ground the *Architecture Decisions* or the relevant phase in what you verified, and cite it.
- **`build` mode** — before writing code against an API you haven't confirmed this session, especially anything involving configuration, lifecycle hooks, transactions, or auth. One lookup is cheaper than a debugging session.

Don't look things up reflexively. If the code you're writing is plain language-level logic with no third-party surface, there's nothing to verify and the round trip is pure cost.

## When the lookup fails

No network, no MCP, docs unreachable — don't stall and don't pretend. Proceed from what you know, and mark it: `[inferred: prior knowledge, not verified]` in research, or a line in the plan's *Risks & Trade-offs* saying which specifics need a reconciliation pass against the docs. Flag the concrete items at risk — exact option names, signatures, defaults — since those are what training memory gets wrong first.
