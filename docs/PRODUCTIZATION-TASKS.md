# Helm → D2C SaaS — Build Backlog (v2, post Product-Staff review)

> **Reviewed:** `docs/reviews/REVIEW-PRODUCTIZATION.md` (6/6 CONDITIONAL). **Founder decisions locked:**
> **ICP = growth-stage D2C** (~50+ orders/day, RTO is budgeted pain); **ambition = fundable startup**
> (Helm Cloud hosted-first, usage pricing, pilots → case studies → raise). This v2 folds the panel's
> build contract in; strikethrough/§notes show what the review changed from v1.
>
> **Locked strategy (post-review):**
> - **Moat = cross-tenant data pooling.** Architect SCALE's data layer as a shared pool from Phase 1 —
>   *"collective intelligence of hundreds of D2C brands on day one,"* not "learns your patterns." This is
>   the cold-start fix **and** the network effect.
> - **Positioning = the mechanism, not the label.** Lead with the **ledger + confidence gates +
>   reversibility**: *"the only D2C tool that shows you every decision, explains why, and proves —
>   predicted-vs-actual — that it was right."* Not "AI execution layer."
> - **Open-core line:** storefront/builder = **free OSS**; the **AI decision layer** (SCALE routing, the
>   review-first drawer, the COD-RTO gate, the ledger) = **paid hosted**, **per routed order (~₹0.50–1.50)**.
> - **Distribution = content + WhatsApp founder groups + aggregator communities + Helm Cloud** (OSS is
>   credibility/technical-users, not the acquisition motion).
> - **Pilot gate:** no multi-tenant hardening or billing until **3–5 real growth-stage brands ship 10+
>   real orders and return voluntarily.**
> - **Effort:** Phase 1 = **4–6 months** (not 2–3).

---

## Phase 0 — De-brand, OSS-ready, and the founding ADRs *(weeks; immediate first build)*

- [ ] Carve the clean core package (engines + decision loop + design system) behind a module boundary (M) — → reusable IP decoupled from the demo.
- [ ] Externalize all brand/identity into config (name, logo, palette, copy, currency, locale, GST/tax, courier roster) (S) — → brand-agnostic; rebrand by config.
- [ ] Theming layer (tokens → swappable theme) (S) — → white-label.
- [ ] Demo-mode toggle keeping the deterministic seed as showcase/dev data (S) — → instant "try it" + fixtures.
- [ ] Repo hygiene: README, architecture diagram, CONTRIBUTING, docs index, live demo, **license = open-core (Apache/MIT core)** (S) — → credible OSS repo + the free/paid line set.
- [ ] **ADR-1: the Medusa↔Helm adapter seam** *(review B2 — the most important missing artifact)* (M) — → a thin event/command bus between Medusa's commerce model and Helm's decision model, so engines never couple to Medusa internals.
- [ ] **ADR-2: schema-per-tenant** *(review B4)* (S) — → cleaner isolation than RLS-over-Medusa; gates every table.
- [ ] **ADR-3: the cross-tenant SCALE data schema** *(review F2 — the moat)* (M) — → courier/lane/RTO outcomes pooled across brands from day one; the design that makes day-one SCALE credible.

## Phase 1 — The hero loop, on real data *(≈4–6 months; the product)*

**Foundation**
- [ ] Adopt **Medusa** (headless commerce, MIT) as the commerce core (L) — → real products/inventory/orders/cart/payments/tax without rebuilding ~10 modules.
- [ ] Postgres + Helm tables (decisions, ledger, **pooled courier scorecards**, policies, audit) (M) — → persistence + the shared SCALE pool.
- [ ] Real auth + org/RBAC (the persona/role model is designed) (M) — → real users, enforced permissions.
- [ ] **Replace `generateWorld` with DB/adapters, per domain** *(review B3 — this is 4×L, not M: selectors go async, Zustand becomes a cache, the 312-invariant becomes a DB constraint)* (4×L) — → every surface renders real data; the riskiest refactor, sequenced per-domain.

**The hero (ships FIRST, not blocked on the store builder)**
- [ ] Razorpay checkout + COD (M) — → the money path; real orders.
- [ ] **Shiprocket integration + NDR webhooks** *(review B8/B9 — verify scan granularity + that COD-remittance-lag is even exposed before coding)* (M) — → real label/AWB/tracking + NDR, the upstream RTO lever.
- [ ] **Webhook + job-reliability pipeline** *(review B6 — first-class track, specced before integration code)*: BullMQ/Redis + retry/backoff + DLQ + alerts + dedup + min-observation floor + a feedback-latency model (RTO confirms in 7–14 days) (L) — → reliable automation; a missed payment/shipping webhook is an incident, not a log line.
- [ ] **SCALE on real, pooled data** — courier scorecards from the cross-tenant pool + per-brand fine-tuning; the COD-RTO reroute as a live decision (L) — → the hero, credible on day one via pooling.
- [ ] **3-tier COD-RTO gate at checkout** *(review B7 — allow / prepaid-nudge (cashback or split-pay) / suppress; NOT binary)* (M) — → cuts RTO without killing the 60–75% of orders that are COD.
- [ ] Landed-margin on real fees/shipping/ads/COD-blockage (M) — → true profit per order/SKU.
- [ ] **One full governed AI loop + ledger** (drawer → approve → write-back → predicted-vs-actual) (M) — → the durable differentiator, demonstrated; the positioning made real.

**Non-negotiable platform obligations**
- [ ] **DPDP Act baseline** *(review B5 — the single highest risk; attaches from the first real customer record)*: data-erasure APIs, consent records, breach-notification (72h CERT-In), a DPA template per brand (M-L) — → legal to handle a brand's customers.
- [ ] Observability + automated Postgres backups w/ tested restore + one SLO + secrets mgmt *(review devops)* (M) — → prod-grade trust; Phase-1 exit criteria.

**Validation**
- [ ] **Pilot 3–5 growth-stage brands on a shared instance** *(review B10)* (ongoing) — → case studies that make pricing + GTM defensible; the gate to Phase 2.

## Phase 1.5 — Store builder *(after the order/shipping loop is proven)*

- [ ] Block editor + responsive themes + custom-domain + SEO + published Next.js storefront (L) — → brands go fully live; the free-OSS front door. *(Pulled out of Phase 1 per review B1 — off the critical path to "order #1 shipped.")*

## Phase 2 — Multi-tenant hardening + marketplace channel + scale-out

- [ ] Full multi-tenant isolation + a cross-tenant penetration test (L) — → safe to onboard tenants at scale (after pilots prove value).
- [ ] **Marketplace channel adapters** (Amazon SP-API, Flipkart) — catalog push, order/payout import (L) — → the "+ marketplace channel" scope; the built M6/M11/M12/M23 surfaces become real. *(Deferred from Phase 1 — a growth-stage brand may already be on marketplaces, so this lands sooner than for a starter.)*
- [ ] Multi-channel Reliable-ATP (M) — → no oversell across own-store + marketplaces.
- [ ] GST e-invoicing (IRN/QR) *(review: L-effort IRP integration, deferred from Phase 1)* (L) — → tax compliance once volume warrants.
- [ ] Broaden the agents on real data (inventory, finance, returns, health, compliance) (L) — → the full decision crew.
- [ ] Own-site analytics + the LLM copilot + promote-to-shadow (L) — → the rest of the intelligence layer.

## Phase 3 — Helm Cloud SaaS *(monetize + raise)*

- [ ] **Usage-based billing (per routed order) + plans + metering** (M) — → the revenue engine, aligned to value.
- [ ] Onboarding/activation (first-run + glossary already designed) (S) — → fast time-to-value.
- [ ] Helm Cloud (managed hosting) + a founder-friendly self-host installer *(review devops — a 5-service compose stack defeats non-technical founders)* (M-L) — → both business models off one repo.
- [ ] GTM engine: content (YouTube "fix your RTO"), WhatsApp founder communities, aggregator partnerships (ongoing) — → the acquisition motion for growth-stage founders.

## Cross-cutting (run across phases)

- [ ] AI/ML ladder: pooled rules-first → cross-tenant online-learning routing → forecasting → LLM copilot (L, ongoing) — → real intelligence, deterministic core as the safe fallback.
- [ ] Real forms + writes everywhere (today: no text inputs / no persistence) (M) — → actually operable.
- [ ] Integration/e2e tests beyond engine unit tests (M) — → confidence to ship to a live business.

---

## The critical path (shortest line to "a paying growth-stage brand")

**Phase 0 (de-brand + the 3 ADRs)** → Medusa + Postgres + auth → **adapter seam → per-domain
`generateWorld` replacement** → Razorpay/COD → **Shiprocket + NDR + the reliability pipeline** → **SCALE
on pooled data + the 3-tier COD gate** → **one AI loop + ledger** → **DPDP baseline + observability** →
**pilot 3–5 brands** → Phase 3 billing. Store builder (1.5), marketplace + GST + full multi-tenancy (2),
Helm Cloud (3) layer on after the hero is proven with real brands.

**Recommended immediate build: Phase 0** — endorsed by the whole panel, decision-independent, weeks not
months, and it writes the three ADRs that de-risk all of Phase 1.

---

*Review this v2; greenlight Phase 0 (or adjust), and I'll start.*
