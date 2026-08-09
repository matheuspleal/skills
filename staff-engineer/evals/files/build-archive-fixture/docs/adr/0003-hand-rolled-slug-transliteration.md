# 0003. Hand-rolled slug transliteration instead of a dependency

* **Status:** Proposed
* **Date:** 2026-08-01
* **Plan:** staff-engineer-skill/plans/2026-08-01-slugify-utils.md
* **Supersedes:** —
* **Superseded by:** —

## Context and Problem Statement

Slug generation has to strip accents from user-supplied titles. All content today is
Brazilian Portuguese, and a sample of 4k production titles is entirely within Latin-1.
Adding a transliteration library means a license review, a lockfile entry, and an
upgrade path for a problem bounded at roughly forty characters.

## Decision Drivers

* The input character set is known, small, and stable.
* Every dependency carries an audit and upgrade cost that outlives its usefulness.

## Considered Options

1. **Hand-rolled ASCII mapping table** — ~40 entries in a constant.
2. **`unidecode`** — covers essentially all of Unicode, ships ~500 KB of tables.
3. **Do nothing** — leave accents in slugs; rejected, the URLs are user-visible.

## Decision Outcome

**Chosen: hand-rolled ASCII mapping table**, because the dependency solves a problem
we do not have, and the reversal cost is a single function call either way.

### Consequences

* **Good:** no new dependency; the mapping is readable and testable in isolation.
* **Bad:** a character outside Latin-1 silently passes through until someone reports
  an ugly slug. We accept that until the content itself changes.
* **Neutral:** the table lives next to `slugify` rather than in a shared module.

### Reversal

Replace the table lookup with a library call — under an hour, one call site.

## More Information

Research: `staff-engineer-skill/research/2026-07-30-slug-transliteration.md`.
