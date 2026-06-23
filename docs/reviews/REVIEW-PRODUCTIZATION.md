# Product Staff Gate Review — Productization (Helm → D2C SaaS)

**Subjects:** `docs/PRODUCTIZATION.md` + `docs/PRODUCTIZATION-TASKS.md` · **Date:** 2026-06-23
**Panel:** Product-Manager · Business-Consultant · Tech-Lead · DevOps · Supply-Chain · Tech-Intelligence
**Sections:** `docs/reviews/productization-sections/*.md`

## Verdict: **CONDITIONAL (6/6)**

The strategy is honest and the reusable-IP call is correct — but **four of six reviewers independently
hit the same fault line**, and it's load-bearing: *the chosen customer (a brand "just starting") can
neither pay for this nor generate enough data for the lead feature (SCALE) to work — in the exact months
that feature must shine.* The plan is buildable, but **not as written and not for that customer**.
Resolve the strategic forks (§1) and lock the build decisions (§2) before any Phase-1 code.

---

## 1. The strategic forks (need the founder's call — they shape everything)

**F1 · ICP: "just starting" vs mid-stage.** (PM, Business, Supply-Chain, Tech-Intel)
A zero-order founder has a thin wallet and no budgeted RTO pain; willingness-to-pay appears at
**~50+ orders/day** when RTO is a measurable cost line. *Decision:* either **re-point at growth-stage
D2C** (RTO is budgeted pain — likely fundable), **or** keep early-stage **only if** the cold-start moat
(F2) makes day-one value real. Don't straddle.

**F2 · The cold-start truth = the moat.** (Supply-Chain, Business, Tech-Intel — unanimous)
A single brand at 50 orders/day produces ~1–1.5k orders/month — far below the ~30–50 outcomes *per
lane×courier cell* SCALE needs; GoKwik has 200M+ shipments, SCALE starts at zero. **Per-brand learning
cannot work early.** The fix is also the moat: **cross-tenant data pooling must be Phase-1 architecture,
not a "future" line.** 500 brands × 50/day ≈ 9M annual outcomes → reliable per-lane models in weeks.
**Reframe the pitch: not "SCALE learns *your* patterns" but "SCALE gives you the collective intelligence
of hundreds of D2C brands on day one."** Cold-start weakness → the selling point + a real network effect.

**F3 · Positioning: lead with the mechanism, not the label.** (Tech-Intel, Business)
"AI execution layer" is copyable by Shopify Sidekick / Shiprocket Engage in two quarters, and a founder
can already assemble Shopify + GoKwik + Shiprocket in an afternoon. The **durable, un-copyable** claim is
the **ledger + confidence gates + reversibility**: *"the only D2C tool that shows you every decision it
makes, explains why, and proves — predicted-vs-actual — that it was right."* Lead there.

**F4 · Open-core line — decide NOW, not Phase 3.** (Business)
You can't design Phase 1 without it. Recommended line: **store/storefront = free OSS; the AI decision
layer (SCALE routing, the review-first drawer, the COD-RTO gate, the ledger) = the paid hosted tier**,
priced **per routed order (~₹0.50–1.50/order)** — usage-based, aligned to value.

**F5 · Venture type.** (Business) Not fundable as written (early ICP + OSS = slow monetization). A viable
**lifestyle SaaS (~₹50–150L ARR)** with pilots + usage pricing; **fundable** only if re-pointed at
growth-stage D2C. Pick the game you're playing.

**F6 · Distribution reality.** (Business, DevOps) Non-technical founders don't discover on GitHub or
self-host a 5-service stack. Real channels: **content (YouTube "fix your RTO"), WhatsApp founder groups,
aggregator communities**; the founder path is **Helm Cloud** (managed). OSS is for credibility + technical
users, *not* the acquisition motion.

---

## 2. The build contract (lock before Phase-1 code)

- **B1 · Cut Phase 1 to the hero loop.** (PM, Tech-Lead, Business) Phase 1 = Medusa + Postgres + auth +
  single-brand catalog + **Razorpay/COD + Shiprocket + SCALE COD-RTO gate + landed-margin + ONE governed
  AI loop + ledger**. **Defer:** the full store builder → **Phase 1.5**; multi-channel ATP + marketplace
  sync → Phase 2; GST e-invoicing → Phase 2 (it's L-effort IRP integration, not needed to ship order #1).
  The hero (SCALE + decision loop on real data) ships *first*, not blocked on the builder.
- **B2 · Design the Medusa↔Helm adapter seam FIRST** (Tech-Lead — the single most important missing
  artifact). A thin event/command bus between Medusa's commerce model (Orders/LineItems/StockLocations)
  and Helm's decision model (Decision/landedMargin/courierScore), so the engines never couple to Medusa
  internals. ADR before implementation.
- **B3 · "Replace `generateWorld` with DB/adapters" is 4×L, not M** (Tech-Lead). Every selector assumes a
  synchronous in-memory `World`; production = async selectors + Zustand-as-cache-with-invalidation + the
  312-invariant becoming a DB constraint. Plan it as a per-domain layer replacement; it's the likeliest
  source of a half-real/half-seeded prod bug.
- **B4 · Multi-tenancy = schema-per-tenant** (Tech-Lead, DevOps) — RLS over Medusa's ORM tables is risky.
  **But build single-tenant in Phase 1**; pilot 3–5 brands on a shared instance; add multi-tenant infra
  in Phase 2. Write the tenancy ADR now (it gates table structure); defer the build.
- **B5 · DPDP Act is a Phase-1 legal obligation, not a checklist line** (DevOps — *highest-risk item*).
  First real customer record ⇒ Helm is a Data Processor: data-erasure APIs, consent records,
  breach-notification (72h CERT-In), a DPA template per brand. Cannot be retrofitted.
- **B6 · Webhook/job reliability is a first-class track, specced before integration code** (DevOps,
  Tech-Lead, Tech-Intel). Aggregator webhooks are delayed/unreliable; RTO confirms in 7–14 days; a missed
  Razorpay webhook is a financial incident. Need **BullMQ/Redis + retry/backoff + DLQ + alerts +
  dedup + a min-observation floor + a feedback-latency model.** ~2–3 wks the "SCALE on real data (L)" task
  hides.
- **B7 · The COD gate is THREE-TIER, not binary** (Supply-Chain — critical). COD = 60–75% of D2C; hard
  suppression kills 40–60% of impacted orders. Do **allow / prepaid-nudge (cashback or split-pay) /
  suppress** — the nudge tier recovers margin without killing conversion (how GoKwik actually works).
- **B8 · Add the NDR workflow to Phase 1** (Supply-Chain). NDR → WhatsApp/SMS buyer nudge → reattempt is
  the most direct upstream lever on RTO; Shiprocket exposes NDR webhooks. M-effort, don't defer.
- **B9 · Verify Shiprocket's API signals before coding** (Supply-Chain). Confirm per-courier scan
  granularity + that COD-remittance-lag (a named SCALE input) is even exposed per-order — it's likely a
  settlement-level metric, not a live feed. Document the gap.
- **B10 · Pilot gate before productize** (PM, Business). No multi-tenant infra or billing until **3–5 real
  pilot brands ship 10+ real orders and return voluntarily.** Pilots produce the case studies the GTM and
  pricing depend on.

**Effort realism:** Phase 1 is **4–6 months**, not 2–3 (Tech-Lead, DevOps).

---

## 3. Revised phased plan (post-review)

- **Phase 0 — De-brand + OSS-ready (weeks).** As planned, plus: bake **config for cross-tenant pooling
  hooks** and write the ADRs (tenancy, adapter seam, open-core line). Ship the showcase. *Still the right
  first move — endorsed by all.*
- **Phase 1 — The hero, single-tenant (≈4–6 mo).** Medusa adapter seam → per-domain `generateWorld`
  replacement → Razorpay/COD → Shiprocket + **NDR** + **SCALE on real data with the reliability pipeline**
  → the **3-tier COD-RTO gate** → landed-margin → one governed AI loop + ledger → **DPDP baseline**. Pilot
  3–5 brands on a shared instance.
- **Phase 1.5 — Store builder.** The block editor + themes + custom domain (off the critical path; after
  the order/shipping loop is proven).
- **Phase 2 — Multi-tenant + cross-tenant SCALE + marketplace channel + GST + broadened agents.**
- **Phase 3 — SaaS plumbing (billing, onboarding, Helm Cloud).**

---

## 4. Bottom line

The crown-jewel IP (governed decision layer + the ledger + SCALE) is real and rare; the panel is
**positive on the technology and Phase 0**, and **conditional on the founder making the ICP / moat /
positioning / business-model calls (§1) and locking the build decisions (§2).** The single highest-value
reframe: **make cross-tenant pooling the architecture and the pitch** — it converts SCALE's fatal
cold-start into the moat. The single highest risk: **DPDP + money-handling reliability**, which attach
from the first real order.

*Recommendation: keep Phase 0 as the immediate build; resolve §1 with the founder; fold §2 into a revised
`PRODUCTIZATION-TASKS.md` before Phase-1 code.*
