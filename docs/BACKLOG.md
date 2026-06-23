# Magpie — Backlog

Prioritized list of everything still pending. Phase-1 (the decision-core, the Medusa adapter seam, the
three ADRs) is **done and pushed**; this is what comes next. We'll work it later.

**Priority:** P0 = closes the core loop / unblocks everything · P1 = the moat + trust + compliance ·
P2 = product-surface depth · P3 = scale & polish.
**Effort:** S ≈ ≤2 days · M ≈ ~1 week · L ≈ multi-week.

---

## ✅ Done — Phase-1 (foundation)

- `@magpie/core` extracted framework-free; the **Medusa↔Magpie adapter seam** (`adaptOrder` +
  `produceRoutingDecision`), proven runnable with zero infra (`npm run demo`).
- Medusa v2 server scaffold + the Magpie decision module (decision / ledger_entry / courier_scorecard);
  the `order.placed` subscriber wires the seam; `GET /admin/magpie/decisions`.
- ADR-001 (seam) · ADR-002 (schema-per-tenant) · ADR-003 (cross-tenant SCALE pool). `docs/PHASE-1.md`.
- The full Vite product surface (11 screens) on seeded data; production build green.

---

## P0 — close the core loop (make one real order flow end-to-end)

| # | Item | Effort | Depends on | Why |
|---|------|:---:|---|---|
| P0-1 | **Razorpay adapter** — prepaid capture + COD flagging into the order metadata the seam reads | M | — | Money-in is the start of every real order; the seam already reads `metadata.cod` |
| P0-2 | **Shiprocket (courier-aggregator) adapter** — push the chosen courier, ingest AWB + status/NDR webhooks | L | P0-1 | Turns a `Decision` into a real shipment; NDR feeds the ledger |
| P0-3 | **Reconciliation job** — fill `ledger_entry.actual_paise` from delivery / RTO / return outcomes | M | P0-2 | The predicted-vs-actual ledger is THE differentiator; today it only predicts |
| P0-4 | **Tenant middleware** — set Postgres `search_path` per request/job from auth context (ADR-002) | M | P0-5 | Without it multi-tenancy is unsafe; a hard gate before any real tenant data |
| P0-5 | **Auth + tenant context** — Medusa admin auth, tenant resolution (currently config-stubbed) | M | — | Everything tenant-scoped depends on knowing *which* tenant |
| P0-6 | **Point the cockpit at the API** — Decisions queue + review drawer fetch `/admin/magpie/*` instead of seed | M | P0-5 | First real data in the UI; proves the loop visibly |
| P0-7 | **Seam mapping test fixture** — pin Medusa `Order` → `MedusaOrderLike` (the one cast / trust boundary) | S | — | The seam's single point of coupling; a renamed Medusa field should fail one test, loudly |

## P1 — the moat, trust, and compliance baseline

| # | Item | Effort | Depends on | Why |
|---|------|:---:|---|---|
| P1-1 | **SCALE pool — contribution job** — anonymize `courier_scorecard` → shared `scale` schema, k-anonymity floor (ADR-003) | L | P0-4 | Lights up the moat; without contribution there's no pool |
| P1-2 | **SCALE pool — consumption** — blend pool prior into `recommendCourier` via confidence-weighted shrinkage | M | P1-1 | Solves cold-start: a day-one brand routes on the network's experience |
| P1-3 | **Webhook reliability pipeline (BullMQ)** — idempotent, retried, dead-lettered courier/payment webhooks | M | P0-2 | Webhooks are lossy; a dropped NDR corrupts the ledger |
| P1-4 | **DPDP baseline** — consent records, data export, schema-scoped right-to-erasure, DPA copy on pooling | L | P0-4 | We're a Data Fiduciary; this is table stakes for selling to real brands |
| P1-5 | **Cross-schema migration runner** — fan migrations out across all tenant schemas (ADR-002) | M | P0-4 | Schema-per-tenant needs a migration strategy before tenant #2 |
| P1-6 | **Multi-shipment / multi-line `adaptOrder`** — map per shipment, not just the first line item | M | P0-7 | Real orders have many lines; today the seam decides on line 0 only |

## P2 — product-surface depth

| # | Item | Effort | Depends on | Why |
|---|------|:---:|---|---|
| P2-1 | **Storefront / website builder** — the OSS free tier (currently a preview screen) | L | — | The open-core wedge; free storefront → paid decision layer |
| P2-2 | **Marketplace channel sync** — real Amazon / Flipkart adapters + GST on channel commission | L | P0-1 | "Own store + marketplace" is the stated scope; today channels are seeded |
| P2-3 | **Wire the other agents to real data** — pricing, inventory, finance, cx, marketing (routing is live) | L | P0-6 | One live agent proves the pattern; the rest make it a product |
| P2-4 | **Simulation / what-if on real data** — replay the engine over a tenant's history | M | P0-6 | Trust-builder; "what would Magpie have done?" |
| P2-5 | **Billing / metering** — per-routed-order usage (Helm Cloud), the paid line | M | P0-6 | The business model; meter the decisions, not the storefront |
| P2-6 | **Tenant provisioning** — admin onboarding → real schema create + seed rate cards | M | P0-4 | Self-serve signup needs automated tenant creation |

## P3 — scale & polish

| # | Item | Effort | Depends on | Why |
|---|------|:---:|---|---|
| P3-1 | **Observability** — decision latency, gate distribution, precision-over-time dashboards | M | P0-3 | Operating the loop needs to *see* the loop |
| P3-2 | **Rate-card management UI** — editable courier rate cards (today hard-coded in `rateCard.ts`) | S | P0-6 | Rates change; ops shouldn't need a deploy |
| P3-3 | **E2E test across the seam** — order.placed → decision persisted → API, against a test Postgres | M | P0-2 | Locks the whole loop against regression |
| P3-4 | **Pool query caching + scorecard rollups** — keep `recommendCourier` fast as the pool grows | M | P1-2 | Performance once the pool has depth |
| P3-5 | **CI/CD + hosted deploy** — Helm Cloud (hosted-first per the locked decisions) | L | P0-* | Pilots need a URL, not a localhost |

---

## Notes / sequencing

- **Critical path to a live pilot:** P0-5 → P0-4 → P0-1 → P0-2 → P0-3 → P0-6. That's one real order
  in, one real shipment out, one real ledger row reconciled, shown in the cockpit.
- **The moat (P1-1/P1-2)** can start in parallel once the tenant boundary (P0-4) exists — it only needs
  `courier_scorecard` rows, which the reconciliation job (P0-3) begins producing.
- Full source of strategy + the review that set these priorities: `docs/PRODUCTIZATION-TASKS.md`,
  `docs/reviews/REVIEW-PRODUCTIZATION.md`, `docs/PHASE-1.md`.
