# Tech Lead Review — Productization Plan
**Reviewer:** Senior Tech Lead
**Documents:** `docs/PRODUCTIZATION.md` (§5 architecture, §8 roadmap) + `docs/PRODUCTIZATION-TASKS.md`
**Verdict: CONDITIONAL**

---

## Framing

The plan is well-structured, intellectually honest about what exists, and identifies the right crown jewels. The "extract the core, re-point at D2C" thesis is architecturally sound. However, several of the hardest technical decisions are named without being resolved, and the Phase 1 effort estimate is materially optimistic. My job here is to surface what will hurt you in build — not to argue with the vision.

---

## Issue 1 — Medusa: Right call, but it will fight the decision layer

Adopting Medusa is the right call over Saleor (Python/Django — wrong language-stack for a TS codebase) or Vendure (GraphQL-heavy, steeper learning curve, smaller community). Medusa is MIT, Node/TS, has a clean plugin model, and handles the commodity layer (cart, inventory, tax, payments) without rebuilding it. That is correctly decided.

The risk is not Medusa's quality. The risk is **model impedance**. Medusa has an opinionated data model: Orders, LineItems, FulfillmentSets, StockLocations, PriceLists. The Helm decision layer operates on a different abstraction: a `Decision` object wrapping `landedMargin`, `routingDecision`, `courierScore`, `reliableAtp`. These are not Medusa primitives. The two systems will need an **explicit seam** — a thin adapter layer that translates Medusa's order/inventory events into Helm's decision inputs, and Helm's approve/deny write-backs into Medusa API calls (update fulfillment, adjust inventory, tag order).

This is doable but it is not the "adopt Medusa, done" that the task list implies. The seam design needs to happen before Phase 1 implementation starts or you will end up with the engines tightly coupled to Medusa internals, making Medusa upgrades painful and the engine logic unportable. The seam is the most important design artifact for Phase 1 and it is not currently called out as a task.

**Recommendation:** Add one explicit task before the rest of Phase 1 foundation work: "Design the Medusa↔Helm adapter contract (domain events in, write-back API calls out)." This is the architectural boundary that determines whether the decision layer stays clean or gets entangled.

---

## Issue 2 — "Replace generateWorld with DB/adapters behind the same selectors" is harder than it reads

The task list rates this as M (1-2 weeks). That is underestimated.

The current codebase has a deeply seeded, in-memory `World` where every selector (`ordersForSeller`, `skuMetrics`, `courierScore`, etc.) assumes synchronous access to a fully materialized object graph. Moving to a real DB means:

- All selectors become async (Promises or async/await throughout)
- The Zustand store, which currently initializes with the full world at startup, needs to become a cache with invalidation logic
- The `312 = 287/19/6` invariant — a synchronous, in-memory consistency check — becomes a DB integrity constraint problem, not a runtime test
- The seeded scorecards, policy objects, and decision logs that the engines read at runtime need to be in Postgres with correct relational structure

This is not a refactor — it is a **layer replacement**. The selectors will need to be rewritten, not redirected. A realistic estimate is L per major domain (orders/inventory/courier/decisions = 4 domains = 4L tasks). The risk if you underestimate this: you end up with a hybrid where some state is real (DB) and some is still in-memory (seed), which is the hardest class of bug to diagnose in production.

The approach the plan describes (same selectors, different source) is architecturally correct — it is the right abstraction. The cost estimate needs to reflect the actual effort.

---

## Issue 3 — Multi-tenancy with Medusa in the mix is an unresolved decision

The plan names both RLS (row-level security) and schema-per-tenant without committing to one. This is a decision that must be made before any DB work starts, because it determines every table's structure.

With Medusa in the mix the decision is more constrained than it looks:

- Medusa v2's multi-tenancy support is still maturing. It was designed primarily for single-store deployments with a plugin extension model. Running multiple independent tenant stores on one Medusa instance requires either the SalesChannel abstraction (which Medusa v2 supports, but it is not full tenant isolation) or separate Medusa instances per tenant (operationally expensive at scale).
- RLS in Postgres is clean, well-understood, and pairs well with a `tenant_id` column pattern. It works for Helm's own tables (decisions, ledger, courier scorecards). The question is whether Medusa's own tables support it cleanly or whether Medusa's ORM bypasses RLS at the application layer.
- Schema-per-tenant is operationally painful at hundreds of tenants but gives clean isolation and avoids cross-tenant query bugs. It is the safer bet if the target is a few dozen tenants at launch.

**Recommendation:** For an early-stage SaaS targeting tens of D2C brands (not thousands), schema-per-tenant is the right call — it avoids RLS complexity with Medusa and gives you clean migrations per tenant. Commit to this before writing any migration. Document it as an explicit ADR.

---

## Issue 4 — The AI maturity ladder: sound progression, one hidden complexity

Rules-first → online-learning routing → LLM copilot is the right sequence. Do not invert it.

The hidden complexity is at the online-learning step. The plan says SCALE learns from "delivery outcome webhooks." That is correct in principle. The practical reality: Shiprocket/Delhivery webhooks are unreliable, delayed (sometimes 24-72h), and occasionally wrong (courier marks delivered when undelivered). The SCALE engine's `courierLearn.ts` already has downgrade/restore hysteresis and cold-start guards — good — but the online-learning system needs:

1. A **signal validation layer** (deduplicate webhooks, handle late arrivals, flag anomalous outcome patterns)
2. A **minimum observation floor** before any score update (the codebase has `COLD_START` constants — make sure the production version wires these to actual order counts, not time-elapsed)
3. A **feedback latency model** — RTO outcomes may not be known for 7-14 days; the learning loop must account for this or it will over-update on incomplete data

None of this is a blocker, but the "wire Shiprocket webhooks, SCALE learns" framing in the task list is one sentence for what is actually a 2-3 week reliability engineering problem.

---

## Issue 5 — Phase 1 effort is optimistic by at least 1.5x

Breaking down what "2-3 months" actually contains:

| Work item | Stated | Realistic |
|---|---|---|
| Medusa setup + Postgres schema | L | L (accurate) |
| Medusa↔Helm adapter seam design + build | not called out | L |
| Real auth + org/RBAC | M | L (Clerk/Auth.js integration + role enforcement in the existing 50 routes) |
| Multi-tenancy (schema-per-tenant) | M | L (Medusa + migrations per tenant) |
| Replace generateWorld with DB/adapters (4 domains) | M | 4×L |
| Store builder (block editor + responsive themes + custom domain) | L | XL (this is a product by itself) |
| Razorpay checkout + COD | M | M (accurate, well-documented API) |
| COD-RTO gate at checkout | M | M (accurate — SCALE engine already written) |
| Shiprocket integration + tracking webhooks + reliability | M | L |
| SCALE on real data (scorecards from real outcomes + learning loop) | L | L + the webhook reliability problem above |
| Landed-margin on real fees/shipping | M | M (accurate) |
| One full AI decision loop (drawer → approve → write-back → ledger) | M | L (first end-to-end real-data path is always longer than it looks) |
| GST e-invoicing | M | L (IRN/QR compliance has sharp edges with Indian APIs) |
| Real forms + writes (currently zero text inputs in the app) | M | L (pervasive — every surface) |

Honest Phase 1 estimate: **4-5 months** with a team of 2-3, or 3-4 months with 3-4 engineers. The store builder alone is a multi-week project; putting it inside Phase 1 alongside Medusa + multi-tenancy + SCALE-on-real-data is three parallel hard problems. I would pull the store builder into a separate track or Phase 1.5.

The one saving grace: the engines (`courierEngine.ts`, `allocation.ts`, `reliableAtp.ts`) are clean, pure, and tested. That is genuinely done work. The seam and the DB migration are the critical paths, not the logic.

---

## Biggest Technical Risks

1. **Medusa model impedance** — the adapter seam is undesigned; if it is built wrong the engine layer gets entangled with Medusa internals and the whole thing becomes brittle
2. **generateWorld replacement underestimated** — treating it as M when it is 4×L leads to mid-sprint scope creep and a half-real/half-seeded state that is production-unsafe
3. **Store builder scope** — this is a full product (Webflow/Shogun light); putting it in Phase 1 alongside everything else is the most likely cause of Phase 1 slipping
4. **Webhook reliability for SCALE learning** — the learning loop will not work correctly without a real signal pipeline; training SCALE on noisy/incomplete delivery data produces bad routing scores that damage the hero feature
5. **GST e-invoicing** — Indian IRP (Invoice Registration Portal) API has known reliability issues and sharp compliance edges; this is not a weekend integration

---

## Architecture Recommendation

The plan's architecture is correct. One addition: make the **Medusa↔Helm boundary explicit** as a first-class architectural artifact — a thin event/command bus where Medusa publishes domain events (order.created, fulfillment.updated, inventory.adjusted) and Helm's engines subscribe. Helm's write-backs go through a command adapter (not direct Medusa API calls scattered across engine code). This keeps the decision layer portable and testable independently of Medusa.

**Re-sequence Phase 1:**
1. Medusa + Postgres + auth/multi-tenancy (foundation)
2. Adapter seam (design + initial build) — **must precede engine work**
3. generateWorld replacement — per domain, not all at once
4. SCALE on real data + Shiprocket (the hero feature; deserves its own focused track)
5. Razorpay + COD + COD-RTO gate (fast path)
6. **Move store builder to Phase 1.5** — it is the right product move long-term but it is the highest-risk new build and should not gate the hero (SCALE + decision loop on real data)

Phase 0 (de-brand + OSS) as the immediate first move is exactly right — low risk, high signal, and it forces the config/theming decisions that Phase 1 will depend on.

---

*Filed: 2026-06-23 | Tech Lead | Product Staff Gate-2 Productization Review*
