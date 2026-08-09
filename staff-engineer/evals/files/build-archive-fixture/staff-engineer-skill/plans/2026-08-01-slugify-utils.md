---
kind: plan
title: Utilitários de string — slugify e truncate
slug: slugify-utils
status: pending
created_at: 2026-08-01T09:14:22Z
updated_at: 2026-08-01T09:14:22Z
implemented_at: null
canceled_at: null
language: pt-BR
rigor: balanced
rigor_detected: balanced
derived_from: staff-engineer-skill/research/2026-07-30-slug-transliteration.md
adrs: [docs/adr/0003-hand-rolled-slug-transliteration.md]
reviews: []
mode_history:
  - { mode: design, at: 2026-08-01T09:14:22Z }
---

# Utilitários de string — slugify e truncate

## Context & Constraints

Precisamos de dois utilitários de texto em `string_utils.py`, usados pela geração de
URLs e pela listagem de títulos. Python 3.12, `pytest` já configurado no projeto.

**Escopo.** `slugify` e `truncate`, sem dependências novas.

**Não-objetivos.** Normalização Unicode completa, i18n de URLs.

**Restrição.** A pesquisa em `derived_from` já decidiu: tabela de transliteração
própria, sem `unidecode`.

## Phase 1 — `slugify`

**Goal.** `slugify(texto)` devolve um slug ASCII, kebab-case, sem acentos.

**Changes.**
- `string_utils.py` — função `slugify` e a tabela de transliteração.

**Tests.**
- `"Olá Mundo"` → `"ola-mundo"`.
- `"  Café   com   Leite "` → `"cafe-com-leite"` (espaços colapsados, bordas aparadas).
- `"Ação & Reação!"` → `"acao-reacao"` (pontuação removida).
- `""` → `""`.

**Acceptance criteria.**
- [ ] Os quatro casos acima passam.
- [ ] Nenhuma dependência nova em `requirements.txt`.

## Phase 2 — `truncate`

**Goal.** `truncate(texto, limite)` corta preservando palavras e sinaliza o corte.

**Changes.**
- `string_utils.py` — função `truncate`.

**Tests.**
- Texto menor que o limite volta intacto, sem reticências.
- Texto maior corta na última palavra inteira que cabe e termina com `…`.
- Limite menor que a primeira palavra corta no limite mesmo.

**Acceptance criteria.**
- [ ] Os três casos acima passam.
- [ ] O resultado nunca excede o limite, incluindo o caractere de reticências.

## Risks & Trade-offs

- **YAGNI na transliteração.** Cobrimos só Latin-1, conforme a pesquisa. Reverter é
  trocar a tabela por uma chamada de biblioteca; revisitar se entrar conteúdo fora
  de Latin-1.
- **KISS sobre DRY.** `slugify` e `truncate` não compartilham normalização de espaços
  por enquanto — são oito linhas duplicadas e a abstração certa ainda não apareceu.

## Decision Records

| ADR | Decision | Status | Phase |
|-----|----------|--------|-------|
| [0003](../../../docs/adr/0003-hand-rolled-slug-transliteration.md) | Tabela de transliteração própria em vez de dependência | Proposed | 1 |

## References

- Metz, "The Wrong Abstraction" (2016) — a duplicação tolerada acima.
