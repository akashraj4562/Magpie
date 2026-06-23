# ADR-002 — Multi-tenancy: schema-per-tenant

- **Status:** Accepted
- **Date:** 2026-06-23
- **Deciders:** Magpie eng (Phase-1)

## Context

Magpie is a multi-tenant SaaS: many D2C brands, one platform. Two forces pull in opposite directions:

1. **Isolation.** Each brand's orders, customers (PII), and margins must be invisible to every other
   brand. India's **DPDP Act 2023** treats us as a Data Fiduciary — a leak across tenants is a
   reportable breach, not just an embarrassment.
2. **Pooling.** Magpie's moat (ADR-003) is *cross-tenant* courier intelligence — a brand on day one
   should benefit from the network's aggregate experience. That requires *some* shared data.

These aren't actually in conflict if we separate **identifiable tenant data** from **anonymized
aggregate signal**, and isolate the former hard while sharing only the latter.

## Decision

**Schema-per-tenant on a single Postgres cluster** for all identifiable data; a **separate shared
`scale` schema** for anonymized pool aggregates.

- Each tenant gets a Postgres schema (`tenant_<id>`) holding their Medusa commerce tables **and** the
  Magpie module's `decision`, `ledger_entry`, `courier_scorecard` tables. Connection is set with
  `search_path` per request/job from the authenticated tenant context.
- The cross-tenant pool lives in **one** `scale` schema, written only via the contribution job
  (ADR-003) which strips identifiers. No tenant ever reads another tenant's schema; they read the
  pool.
- Customer PII (names, addresses, phones) never leaves the tenant schema. The pool stores counts, not
  people.

## Consequences

**Good**
- Strong blast-radius containment: a query bug can't cross `search_path`; a tenant export/delete
  (DPDP right to erasure) is a schema-scoped operation.
- Clean mental model for audits: "where is brand X's data?" → "schema `tenant_x`, nowhere else."
- Cheaper than database-per-tenant; one migration pipeline, one backup policy.

**Costs / risks**
- Schema sprawl at thousands of tenants; mitigated by Postgres handling tens of thousands of schemas,
  and by a future shard-by-schema-range plan if needed.
- Migrations must fan out across schemas — handled by iterating tenants in the migration runner.
- The app must *never* forget to set `search_path`; enforced centrally in the request/job middleware,
  not per-query.

## Alternatives considered

- **Row-level (shared tables + `tenant_id` column + RLS)** — rejected for Phase-1: one missing
  `WHERE tenant_id =` or a misconfigured RLS policy leaks across tenants. Too sharp an edge given DPDP
  exposure, and Medusa's own tables aren't built around our `tenant_id`.
- **Database-per-tenant** — rejected: strongest isolation but the heaviest ops (connection pools,
  migrations, backups per DB). Revisit for enterprise/regulated tenants who demand a dedicated DB.

## Notes

This ADR governs *where data lives*. *What may be shared* is ADR-003; the two are deliberately
decoupled so the pool's privacy rules can tighten without touching tenant storage.
