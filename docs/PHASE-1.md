# Phase-1 — the Medusa backend (what's built, how it runs)

Phase-1 turns Magpie from a seeded front-end into a real product on a real commerce backbone, **exactly
in the order the Product-Staff review demanded**: the seam and the ADRs first, then code.

## What exists now

```
Magpie/
├── packages/core/         @magpie/core — the decision-core, framework-free, RUNNABLE today
│   ├── src/types.ts       the domain types (Order, Decision, Evidence, …)
│   ├── src/lib/*          the engines (landed-margin, SCALE courier, gates, ledger, selectors)
│   ├── src/seam.ts        ★ the Medusa↔Magpie adapter seam (ADR-001)
│   ├── src/index.ts       the barrel — what the backend imports
│   └── src/demo.ts        a runnable proof of the seam (no Postgres needed)
├── server/                magpie-server — Medusa v2 + the Magpie decision module
│   ├── medusa-config.ts
│   └── src/
│       ├── modules/magpie/        the custom module: models + service
│       │   ├── models/decision.ts, ledger-entry.ts, courier-scorecard.ts
│       │   ├── service.ts         MedusaService(...) auto-CRUD
│       │   └── index.ts
│       ├── subscribers/order-placed.ts   ★ THE SEAM, LIVE (order.placed → core → persist)
│       └── api/admin/magpie/decisions/route.ts   GET the decision queue
└── docs/adr/              ADR-001 (seam) · ADR-002 (tenancy) · ADR-003 (SCALE pool)
```

★ = the two files that are the whole point: the seam, and the one place it runs in production.

## Runnable *today*, with zero infra

The decision-core stands on its own — prove the seam end-to-end without Medusa, Postgres, or Redis:

```bash
cd packages/core
npm run demo
```

Output (a fake Medusa `order.placed` payload → a governed Decision):

```
— Medusa → Magpie adapter seam —
order      order_01HQZX · own_store · COD · tier2 · Bettiah
decision   Courier for order_01HQZX (Onion Hair Oil)
tier       REVIEW   confidence 83%   Δ 1435 paise
rationale  Route via Delhivery (score 0.90) not Delcon (0.69) — Delcon's RTO on this lane is 28% vs
           18%, saving the expected RTO cost. The cheapest freight loses when it risks a broken promise.
```

That is the real engine, the real seam, the real Decision shape the database will store.

## Running the full backend (needs infra)

Medusa v2 requires **Postgres + Redis**. This is honest scaffolding — correct code, not yet a deployed
service:

```bash
cd server
cp .env.template .env          # point DATABASE_URL / REDIS_URL at your instances
npm install                    # pulls Medusa v2 + links @magpie/core (file:../packages/core)
npm run build && npm run dev    # boots Medusa; the order.placed subscriber wires the seam
```

Then a placed order fires `order-placed.ts`, which runs `@magpie/core` and writes a row queryable at
`GET /admin/magpie/decisions`.

## The seam, in one paragraph

Medusa owns commerce. `@magpie/core` owns decisions. They meet in exactly one place — the
`order.placed` subscriber — which calls `adaptOrder()` (Medusa shape → core `Order`) and
`produceRoutingDecision()` (core `Order` → governed `Decision`), then persists the result through the
Magpie module. The core never imports Medusa; the subscriber is the only Medusa-shaped line in the
decision path. Swap Medusa later → rewrite one adapter, not the product. (Full rationale: ADR-001.)

## What Phase-1 deliberately defers

- **Auth / tenant middleware** that sets `search_path` per request (ADR-002) — stubbed by config.
- **The contribution job** that feeds the cross-tenant pool (ADR-003) — the schema (`courier_scorecard`)
  is in place; the job is Phase-2.
- **Razorpay / Shiprocket** real adapters, **reconciliation** filling `ledger_entry.actual_paise`, and
  the Vite app fetching from `/admin/magpie/*` instead of seeded data.

These are tracked in `PRODUCTIZATION-TASKS.md`. Phase-1's job was the foundation the review insisted on:
**a clean seam, proven runnable, with the architecture decisions written down.**
