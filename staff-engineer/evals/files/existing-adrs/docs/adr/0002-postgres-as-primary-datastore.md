# 2. Postgres as primary datastore

Date: 2025-04-02

## Status

Accepted

## Context

The service needs a primary datastore for orders and customers. The team has
operational experience with Postgres and none with the alternatives. Expected
volume is well within a single instance for the foreseeable future.

## Decision

We will use Postgres 16 as the primary datastore, accessed through Prisma.

## Consequences

Relational modelling for everything, including the event log. No document
store, so denormalised read models are built as materialised views rather than
separate collections. If write volume outgrows a single instance we revisit —
partitioning first, then a second datastore.
