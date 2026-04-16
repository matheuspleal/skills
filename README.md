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
