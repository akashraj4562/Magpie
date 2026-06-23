# ADR-003 — The cross-tenant SCALE pool (the moat)

- **Status:** Accepted
- **Date:** 2026-06-23
- **Deciders:** Magpie eng (Phase-1)
- **Related:** ADR-002 (tenancy), the Product-Staff productization review (cold-start finding)

## Context

The review found Magpie's fault line: a brand "just starting" can neither pay much **nor feed** a
courier-intelligence engine — with no shipment history, SCALE has nothing to score on (cold-start).
The ICP moved to **growth-stage D2C**, but the durable answer is a **moat**: pool courier performance
*across* tenants so any brand — even on day one — routes on the network's collective experience, not
its own thin history. This is the one thing a single-tenant Shopify app or an in-house team
structurally cannot replicate.

The tension with ADR-002 is obvious: pooling needs shared data; isolation forbids sharing identifiable
data. The resolution is to share **only anonymized aggregates**, never orders or people.

## Decision

A **contribute-and-consume aggregate pool**, keyed by `courier × lane × payment_mode × zone_class`,
holding **counts only**.

**Contribution (tenant → pool).** A periodic job reads each tenant's `courier_scorecard` rows and
upserts deltas into the shared `scale` schema. It writes only: the four key dimensions, `shipments`,
`delivered`, `rto`, and `avg_sla_days`. No order id, no SKU, no customer, no brand identity, no
price. A **k-anonymity floor** applies: a `(courier, lane, payment, zone)` cell is only published once
≥ K distinct tenants (and ≥ N shipments) contribute to it, so no single brand's behaviour is
re-identifiable from the pool.

**Consumption (pool → decision).** `recommendCourier` blends the tenant's *local* scorecard with the
*pool prior* using confidence-weighted shrinkage: when local data is thin (cold-start), the pool
dominates; as the tenant accumulates its own shipments, local evidence takes over. The blend weight is
a function of local shipment count, so the transition is smooth and self-correcting.

```
 score(courier, lane, pay, zone)
   = w_local · local_rate  +  (1 − w_local) · pool_rate
   where w_local = n_local / (n_local + κ)   # κ = shrinkage constant
```

**Governance.** Contribution is on by default (it's what funds the moat and the pricing model — see
the open-core plan) but disclosed in the DPA; an enterprise tenant may opt out of *contributing* while
still *consuming* (asymmetric, by design — consumers who don't contribute get the pool as-is, no
penalty, because the marginal cost of a read is zero and network effects favour adoption).

## Consequences

**Good**
- Day-one cold-start is solved: a new brand inherits priors for every lane the network has seen.
- The moat compounds: every shipment any tenant makes sharpens routing for all — a flywheel a
  single-tenant competitor cannot match.
- Privacy-preserving by construction: counts + k-anonymity, no PII, isolation (ADR-002) intact.

**Costs / risks**
- **Poisoning / free-riding:** a tenant could feed garbage or only consume. Mitigations: k-anonymity,
  outlier rejection on contribution, and consume-only being acceptable (read cost ≈ 0).
- **Pool ≠ reality for a niche lane:** thin/odd lanes get wide priors; shrinkage handles this by
  trusting local data faster where the pool is sparse.
- **Regulatory:** aggregates of logistics performance are not personal data, but the DPA must state
  the practice plainly. Tracked with legal before GA.

## Alternatives considered

- **No pooling (per-tenant only)** — rejected: re-creates the cold-start problem the review flagged and
  surrenders the only defensible moat.
- **Share raw shipment rows centrally** — rejected: maximal signal, maximal liability; violates the
  spirit of ADR-002 and DPDP. Aggregates carry ~all the routing signal at a fraction of the risk.
- **A bought third-party courier-SLA feed** — rejected as the *core* (it's generic, buyable by
  competitors, and not tuned to D2C COD/RTO reality) — but viable as a *cold-start seed* before the
  pool has depth.
