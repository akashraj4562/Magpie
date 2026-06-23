# ADR-001 — The Medusa ↔ Magpie adapter seam

- **Status:** Accepted
- **Date:** 2026-06-23
- **Deciders:** Magpie eng (Phase-1)
- **Supersedes:** the monolithic `src/lib` engines being React-app-only

## Context

Magpie started as a Vite/React demo whose decision logic (landed-margin, SCALE courier scoring, the
governed loop, the ledger) lived in `src/lib`. To become a sellable product we adopt **Medusa v2** as
the commerce backbone (it already owns Order, LineItem, Inventory, Sales Channels, Payments — the
boring, dangerous-to-rebuild 80%). Magpie's value is the **decision layer**, not the cart.

The risk in adopting any platform is coupling: if our courier scoring reaches into Medusa's order
internals, we are married to Medusa forever and our engines can't be tested, sold as a library, or
re-pointed at Shopify/WooCommerce later. The Product-Staff review made this the #1 instruction:
*design the seam before writing backend code.*

## Decision

A **thin, one-directional adapter seam**, with the decision-core extracted to a framework-free package
`@magpie/core`:

1. **`@magpie/core` has zero framework deps.** No React, no Medusa, no DB driver. Pure TypeScript:
   `types.ts` + the engines + `seam.ts`. It builds and runs on its own (`npm run demo` proves it).

2. **The seam is two functions** (`packages/core/src/seam.ts`):
   - `adaptOrder(m: MedusaOrderLike): Order` — maps Medusa's order shape onto the core's `Order`.
   - `produceRoutingDecision(order): Decision` — runs `recommendCourier` + `buildDecision`.

3. **`MedusaOrderLike` is the contract.** The core declares the *minimal* shape it reads from a Medusa
   order (id, sales channel, items, shipping address, COD flag). Medusa's real `Order` is structurally
   compatible, so the subscriber passes it with a single cast — **the only Medusa-shaped line in the
   entire decision path.**

4. **Data flows one way: Medusa → core → persistence.** The core never calls back into Medusa. The
   subscriber (`order.placed`) is the only place the two worlds touch, and it is pure plumbing.

```
 Medusa (commerce)         the seam            @magpie/core (decisions)
 ┌───────────────┐   adaptOrder(order)   ┌──────────────────────────┐
 │ order.placed  │ ───────────────────▶ │ recommendCourier (SCALE) │
 │  subscriber   │                       │ buildDecision (gates)    │
 └───────────────┘ ◀─────────────────── └──────────────────────────┘
        │            Decision (plain object)
        ▼
   magpie module → Postgres (decision, ledger_entry, courier_scorecard)
```

## Consequences

**Good**
- The engines are unit-testable and runnable with no infra (the `demo.ts` proof).
- Swapping Medusa for another backend means rewriting one adapter, not the product.
- Open-core friendly: `@magpie/core` is the paid decision layer; the storefront/commerce is the
  free, replaceable substrate.

**Costs / risks**
- The `MedusaOrderLike` cast is a trust boundary; if Medusa renames a field, the seam breaks at one
  obvious place (acceptable — better one cast than scattered coupling). A mapping test fixture pins it.
- `adaptOrder` currently maps the first line item only; multi-shipment orders need per-shipment mapping
  (tracked for Phase-2). Documented in the function.

## Alternatives considered

- **Logic inside Medusa workflows/services** — rejected: couples decisions to Medusa, kills the
  library/open-core story, and makes the engines untestable without booting Medusa + Postgres.
- **A separate microservice the storefront calls over HTTP** — rejected for Phase-1: premature
  operational complexity. The seam is a function boundary now; it can become a network boundary later
  without changing the core.
