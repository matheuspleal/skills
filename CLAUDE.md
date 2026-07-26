# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## What this repo is

A collection of opinionated Claude Code skills distributed via `npx skills add matheuspleal/skills`. Each skill lives in its own top-level directory containing a `SKILL.md` file.

## Architecture

```
<skill-name>/
  SKILL.md      ← skill definition (frontmatter + instructions)
  references/   ← optional; docs the skill loads on demand
  evals/        ← optional; test prompts and fixtures for the skill
```

Each `SKILL.md` has YAML frontmatter with `name` and `description` fields, followed by the skill's full prompt. The `description` field controls when the skill triggers — it must list explicit activation phrases and describe the conditions under which the skill should activate.

## Adding a new skill

1. Create a new top-level directory named after the skill
2. Add a `SKILL.md` with frontmatter (`name`, `description`) and the skill body
3. Add a subsection under **All Skills** in `README.md` with a summary of the new skill

Skills are listed **alphabetically** under **All Skills** — insert the new subsection in the right position rather than appending it. Readers scan that list to find a skill by name, so ordering by name beats ordering by when it was written.
