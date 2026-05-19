---
title: Formatador de valores monetários
slug: money-format
status: pending
created_at: 2026-05-19T10:00:00Z
updated_at: 2026-05-19T10:00:00Z
implemented_at: null
canceled_at: null
language: pt
rigor: strict
rigor_detected: strict
mode_history:
  - { mode: plan, at: 2026-05-19T10:00:00Z }
---

# Formatador de valores monetários

## Context & Constraints

Precisamos de uma função pura `format_brl(cents: int) -> str` que converta um
valor inteiro em centavos para uma string no formato `R$ 1.234,56`. Sem
dependências externas. Comportamento determinístico, fácil de testar.

- Driver: padronizar exibição de preços em toda a aplicação.
- Não-objetivo: i18n para outras moedas (YAGNI por enquanto).

## Implementation Phases

### Phase 1 — `format_brl` para valores positivos

- **Goal:** formatar centavos não-negativos como `R$ X.XXX,YY`.
- **Changes:** criar `money.py` com `format_brl`.
- **Tests:** `0 -> "R$ 0,00"`, `5 -> "R$ 0,05"`, `123456 -> "R$ 1.234,56"`,
  `100000000 -> "R$ 1.000.000,00"`.
- **Acceptance:**
  - [ ] `format_brl` existe em `money.py`
  - [ ] todos os casos acima passam

### Phase 2 — valores negativos

- **Goal:** suportar centavos negativos como `-R$ X.XXX,YY`.
- **Changes:** estender `format_brl`.
- **Tests:** `-5 -> "-R$ 0,05"`, `-123456 -> "-R$ 1.234,56"`.
- **Acceptance:**
  - [ ] casos negativos passam
  - [ ] casos positivos da Phase 1 continuam passando

## Risks & Trade-offs

- KISS sobre extensibilidade: uma função focada em BRL, sem camada de
  localização genérica. Adicionamos o ponto de extensão quando a segunda moeda
  aparecer (YAGNI).

## References

- Kent Beck, *Test-Driven Development: By Example* — ciclo red-green-refactor.
