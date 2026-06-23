# magpie-server

Magpie's Phase-1 backend: **Medusa v2** (commerce) + the **Magpie decision module**, wired together on
`order.placed` through [`@magpie/core`](../packages/core).

## The one idea

Medusa handles the cart, catalog, inventory, payments, channels. Magpie adds a single custom module —
the **decision layer** — and listens for placed orders. When one lands, the seam runs the decision-core
and stores a governed `Decision`. See [`../docs/adr/ADR-001-medusa-adapter-seam.md`](../docs/adr/ADR-001-medusa-adapter-seam.md).

```
order.placed ─▶ src/subscribers/order-placed.ts
                  adaptOrder(order)            (@magpie/core — Medusa shape → core Order)
                  produceRoutingDecision(...)  (@magpie/core — SCALE + gates → Decision)
                  magpie.createDecisions(...)  (persist)
                                     │
            GET /admin/magpie/decisions ◀──────┘
```

## Layout

| Path | What |
|---|---|
| `medusa-config.ts` | registers the `magpie` module |
| `src/modules/magpie/models/` | `decision`, `ledger_entry`, `courier_scorecard` (the SCALE slice) |
| `src/modules/magpie/service.ts` | `MedusaService(...)` — auto CRUD |
| `src/subscribers/order-placed.ts` | **the seam, live** |
| `src/api/admin/magpie/decisions/route.ts` | the decision queue the cockpit reads |

## Run

Needs **Postgres + Redis** (Medusa v2 requirements).

```bash
cp .env.template .env     # set DATABASE_URL / REDIS_URL
npm install              # also links @magpie/core via file:../packages/core
npm run build
npm run dev
```

> Want to see the decision engine work **without** standing up infra? Run the core's proof instead:
> `cd ../packages/core && npm run demo`.

## Status

Correct, reviewed scaffolding — not a deployed service. The decision path (seam → core → persist → API)
is real; auth/tenant middleware (ADR-002) and the cross-tenant contribution job (ADR-003) are Phase-2.
