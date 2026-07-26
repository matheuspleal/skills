---
kind: research
title: Escolha de runner de jobs em background
slug: background-job-runner
status: complete
question: Qual runner de jobs em background sustenta ~500 jobs/min de envio de e-mail sem adicionar um broker novo para o time operar?
created_at: 2026-06-02T13:20:44Z
updated_at: 2026-06-02T13:20:44Z
language: pt
rigor_detected: balanced
spawned_plans: []
superseded_by: null
---

# Escolha de runner de jobs em background

## Question & Scope

**Pergunta.** Qual runner de jobs em background sustenta ~500 jobs/min de envio
de e-mail transacional sem introduzir um broker novo no runbook?

**Decisão que depende disso.** A implementação da fila de e-mails do onboarding.

**Fora de escopo.** Retry policy detalhada, dead-letter queue, e o provedor de
envio em si (já decidido: SES).

## Method & Sources

- Código: `package.json`, `docker-compose.yml`, `src/jobs/`. Stack é Node 22 +
  TypeScript, Postgres 16, sem Redis, sem broker. Time de 3 pessoas.
- Docs versionadas: pg-boss 10.x, BullMQ 5.x.

## Findings

- Já existe Postgres em produção; não existe Redis.
  *[verificado: `docker-compose.yml`, acessado 2026-06-02]*
- pg-boss usa `SKIP LOCKED` do Postgres e não precisa de broker externo;
  documenta throughput na casa dos milhares de jobs/min.
  *[verificado: pg-boss 10.x docs, acessado 2026-06-02]*
- BullMQ exige Redis. Mais rápido em volume alto, mas é um serviço a mais.
  *[verificado: BullMQ 5.x docs, acessado 2026-06-02]*
- 500 jobs/min é volume baixo para qualquer uma das duas opções.
  *[inferido: conhecimento prévio, não verificado com benchmark local]*

## Options & Trade-offs

| Opção | Custo de adoção | Custo de operação | Custo de reversão |
|---|---|---|---|
| pg-boss (Postgres) | ~1 dia | zero, já existe | baixo — interface pequena |
| BullMQ + Redis | ~3 dias | Redis novo no runbook | médio |
| `setInterval` caseiro | ~2h | perde jobs em restart | alto, retrabalho |

## Recommendation

**pg-boss.** O volume cabe com folga, não adiciona serviço, e o time não tem
capacidade operacional sobrando. A opção caseira está descartada: perder job em
restart é inaceitável para e-mail transacional.

## What Would Change This

- Volume passar de ~5k jobs/min sustentados → Redis/BullMQ volta à mesa.
- Necessidade de rate limiting por destinatário com janela deslizante → BullMQ
  já traz pronto; em pg-boss seria implementação nossa.
- Adoção de Redis por outro motivo no projeto → o custo marginal do BullMQ cai
  para quase zero.

## Open Questions

- Nenhuma bloqueante para a decisão.

## References

- pg-boss 10.x docs, "Queueing" — acessado 2026-06-02.
- BullMQ 5.x docs, "Rate limiting" — acessado 2026-06-02.
- Postgres 16 docs, `SELECT ... FOR UPDATE SKIP LOCKED` — acessado 2026-06-02.
