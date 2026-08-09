---
kind: research
title: Transliteração de acentos para slugs
slug: slug-transliteration
status: complete
question: Vale adicionar uma dependência de transliteração (unidecode) para gerar slugs, ou uma tabela ASCII própria resolve o nosso conjunto de caracteres?
created_at: 2026-07-30T13:11:04Z
updated_at: 2026-07-30T13:11:04Z
language: pt-BR
rigor_detected: balanced
spawned_plans: [staff-engineer-skill/plans/2026-08-01-slugify-utils.md]
superseded_by: null
---

# Transliteração de acentos para slugs

## Question & Scope

**Pergunta.** Vale adicionar `unidecode` (ou equivalente) para gerar slugs, ou uma
tabela de mapeamento ASCII própria cobre o conjunto de caracteres que a gente
realmente recebe?

**Decisão que depende disso.** A fase 1 do plano de utilitários de string — adotar
uma dependência nova custa revisão de licença e uma entrada a mais no lockfile.

**Fora de escopo.** Normalização Unicode para busca; internacionalização de URLs.

## Method & Sources

- Código: `src/`, sem dependências de texto instaladas hoje.
- Amostra de 4k títulos em produção: 100% dentro de Latin-1.

## Findings

- Todo o conteúdo hoje é português do Brasil; os caracteres acentuados que aparecem
  cabem em uma tabela de ~40 entradas. *[verified: amostra de produção, 2026-07-30]*
- `unidecode` cobre praticamente todo o Unicode e traz ~500 KB de tabelas.
  *[inferred: conhecimento prévio, não verificado]*

## Options & Trade-offs

| Opção | Custo de adoção | Custo de operação | Custo de reversão |
|---|---|---|---|
| Tabela ASCII própria | ~1h | manutenção quando surgir caractere novo | baixo — é uma constante |
| `unidecode` | ~15min | dependência a auditar e atualizar | baixo — troca de chamada |

## Recommendation

Tabela própria. O conjunto de entrada é conhecido e pequeno, e a dependência resolve
um problema que não temos.

## What Would Change This

- Conteúdo passar a aceitar idiomas fora de Latin-1 (russo, grego, CJK).
- A tabela passar de ~100 entradas — aí ela virou uma biblioteca ruim.

## Open Questions

- Nenhuma bloqueante.

## References

- Unicode TR-15 (Normalization Forms) — acessado 2026-07-30.
