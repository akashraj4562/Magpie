# Helm → a productized, open-source SaaS for D2C brands

*A critical evaluation of what it takes to turn this portfolio build into a real, sellable,
brand-agnostic product D2C founders can actually run their business on — and put on GitHub.*

> **POST-REVIEW UPDATE (2026-06-23).** Product-Staff reviewed (`docs/reviews/REVIEW-PRODUCTIZATION.md`,
> 6/6 CONDITIONAL). **Founder decisions locked: ICP = growth-stage D2C (~50+ orders/day); ambition =
> fundable startup.** Key reframes the review forced: **cross-tenant data pooling is the moat + the
> cold-start fix** (architect SCALE as a shared pool — "collective intelligence on day one"); **lead
> positioning with the ledger/mechanism, not "AI execution layer"**; **open-core line = storefront free /
> decision layer paid per routed order**; **Phase 1 = the hero loop only** (store builder → 1.5,
> multi-tenancy/marketplace/GST → Phase 2); DPDP + webhook-reliability + a 3-tier COD gate are Phase-1
> obligations. The build-ready plan is `docs/PRODUCTIZATION-TASKS.md` (v2). The sections below are the
> original evaluation that led here.

---

## 0. The honest starting point

What exists today is a **marketplace-seller execution layer** (Flipkart Seller Hub / Amazon Seller
Central mould) rendered as a **front-end demo over in-memory, deterministic seeded data**. There is no
backend, no database, no auth, no real integration, and the "AI" is hand-tuned deterministic functions.
That is exactly right for a portfolio piece — and **~60-70% of the surface area is not what an
early-stage D2C brand needs.** Productizing is therefore *not* "wire a backend to the demo." It is
**extract the reusable core, re-point the product at a different customer, and build the real thing
around it.** Said plainly so we don't fool ourselves.

**The crown jewels that DO transfer** (the actual IP):
- The **governed decision loop** + the **review-first evidence drawer** + the **confidence gates** + the
  **reversibility / one-way-door** model + the **ledger** (predicted-vs-actual). This is the
  differentiator and it is product-agnostic.
- The **shared-engine pattern**: landed-margin/true-cost, Reliable-ATP inventory-truth, and especially
  **SCALE (courier allocation)** — RTO is the #1 cost-and-pain for Indian D2C, so SCALE is *more*
  relevant to a D2C brand than to a marketplace seller.
- The **design system + primitives** (tokens, EvidenceDrawer, GroupedList, ReliabilityBar, FunnelBar),
  the persona/RBAC access model, the glossary/first-run teachability layer.

**What's marketplace-specific and largely irrelevant to a D2C starter:** Buy-Box/repricing wars,
marketplace events, FBF, marketplace SPF claims, the marketplace settlement model, the "seller-on-a-
marketplace" framing throughout. Keep these as an *optional channel* later (sell on Amazon/Flipkart
too), not the core.

---

## 1. The strategic pivot — who is the customer now?

| | Marketplace seller (today) | **Early-stage D2C brand (target)** |
|---|---|---|
| Where they sell | On a marketplace | On **their own website** (and maybe a marketplace) |
| Their #1 problem | Account health, Buy-Box, payouts | **Getting a store live, getting the first orders shipped without losing money to RTO** |
| What they own | A storefront *on* a platform | Their **brand, site, customer, checkout, fulfilment** |
| What they lack | Operational leverage | **Everything** — store, ops, shipping, payments, analytics, and time |

The early D2C founder's job-to-be-done is: *"Get me online and selling, ship reliably, don't let me lose
money I can't see, and don't make me hire an ops team."* That reframes the whole product around
**get-live → sell → fulfil-reliably → see-the-truth**, with the AI decision layer as the unfair
advantage no other starter tool gives them.

---

## 2. Reuse map — keep / repurpose / cut / build-new

| Area | Verdict | Notes |
|---|---|---|
| Decision loop, drawer, gates, ledger, reversibility | **KEEP** | the core IP, product-agnostic |
| Landed-margin / true-cost engine | **KEEP** | re-point at D2C economics (own shipping, own ad spend, COD) |
| SCALE courier allocation, SLA/RTO prediction | **KEEP — lead with it** | the sharpest D2C wedge in India |
| Reliable-ATP inventory truth | **KEEP** | D2C with multiple channels needs it |
| Health/promise-integrity (IPOR), CHI | **REPURPOSE** | IPOR maps to "orders shipped as promised from your own store" |
| AdAnalytics (marketplace funnel/SOV) | **REPURPOSE → own-site analytics** | the funnel concept maps to *their* site (GA-style), not marketplace SOV |
| Studio (listing AI), catalog | **REPURPOSE → product catalog + content** | for their own store, not a marketplace listing |
| Payments/payouts/settlement (marketplace) | **CUT → replace** | D2C uses their *own* PSP (Razorpay) + GST invoicing on *their* sales |
| Buy-Box, FBF, marketplace events, SPF | **CUT (or optional channel later)** | not a starter need |
| **Storefront / website** | **BUILD-NEW** | the front door; doesn't exist today |
| **Checkout + own payments + COD** | **BUILD-NEW** | the money path |
| **Customer / CRM / marketing basics** | **BUILD-NEW** | email/WhatsApp, repeat-purchase |
| **Real backend, DB, auth, multi-tenancy** | **BUILD-NEW** | none exists today |

---

## 3. The MVP product for a D2C starter (the wedge, not the world)

Resist rebuilding Amazon. The MVP is the **minimum to get a brand live and shipping profitably**, with
the AI layer as the hook:

1. **Store builder** (§4) — a hosted storefront + checkout on a custom domain, live in an afternoon.
2. **Catalog** — products, variants, inventory (reuse Studio's AI content help; real DB).
3. **Orders** — orders from their own store (+ optional marketplace import), the guarded lifecycle.
4. **Shipping intelligence (SCALE, real)** — connect a shipping aggregator (Shiprocket/Delhivery/
   Pickrr), and let SCALE pick the courier per order on real lane/RTO data. **This is the lead feature.**
5. **Money** — Razorpay checkout, COD, GST-compliant invoices, a real landed-margin read per order/SKU
   so they see true profit (not vanity revenue).
6. **The decision layer** — the review-first drawer over *their* data: "this COD order is high-RTO →
   reroute / convert-to-prepaid", "this SKU loses money after shipping", "you're about to oversell".
7. **Own-site analytics** — the funnel for *their* store (sessions → ATC → purchase), repurposed from
   AdAnalytics.

Everything else (full 31 modules, marketplace breadth, growth-suite) is **post-MVP**.

---

## 4. The website builder

A real differentiator for "just starting" brands, but the biggest net-new build. **Don't build a
commerce backend from scratch** — stand on an open-source headless commerce engine and build the
*builder + the AI layer* on top:

- **Commerce backend:** **Medusa** (MIT, Node/TS — best license + stack fit), or Saleor (GraphQL/Python),
  or Vendure. Handles products, carts, orders, payments, inventory, tax. This replaces ~10 of the current
  modules with a real, battle-tested engine.
- **The builder:** a block/section editor (hero, product grid, A+ content, reviews, footer) over a few
  responsive themes; custom-domain mapping; SEO defaults; mobile-first; a published storefront (Next.js
  on the edge). Reuse the existing Brandstore surface as the seed of the editor UI.
- **Checkout:** Razorpay (cards/UPI/netbanking) + COD with the SCALE RTO-risk gate at checkout (a real
  edge: *suppress/limit COD for high-RTO pincodes at the point of sale*).
- **Build vs buy:** builder UI = build (it's the brand-facing magic + reuses our design system);
  commerce primitives = adopt Medusa; hosting = Vercel/Netlify + a managed Postgres.

---

## 5. Technical architecture to go production

| Layer | Today | Production |
|---|---|---|
| Frontend | Vite + React, in-memory zustand | Next.js (SSR for the storefront + SEO) + the React admin; multi-tenant |
| State / data | seeded `generateWorld()` in memory | **Postgres** (per-tenant rows or schema) via the commerce engine + our own tables |
| Backend / API | none | **Medusa** (commerce) + a thin **Helm service** (the decision engines, ledger, SCALE) — Node/TS |
| Auth | a `viewAs` switch | real signup/login + org/RBAC (Clerk / Auth.js / Supabase Auth); the persona/role model already designed |
| Multi-tenancy | one seeded world | tenant isolation (row-level security or schema-per-tenant); the `Tenant`/MaaS model already exists conceptually |
| The engines | deterministic functions | **real services** over real data: landed-margin (real fees/shipping), Reliable-ATP (real stock feeds), **SCALE** (real courier scorecards trained on the aggregator's delivery webhooks) |
| The "AI" | seeded | **rules-first, then ML/LLM**: routing = rules + online-learning on real outcomes; copilot/listing = an LLM (Claude) with tool-use into the real APIs; forecasting = a simple model. Keep the deterministic core as the safe fallback. |
| Integrations | fake | Razorpay (payments), Shiprocket/Delhivery (shipping + tracking webhooks), GST e-invoicing (IRN), WhatsApp/email (Gupshup/Resend), optional Amazon/Flipkart SP-APIs |
| SaaS plumbing | none | subscription billing (Stripe/Razorpay), plans + usage metering, onboarding |
| Infra / ops | `npm run dev` | containerized deploy, CI/CD, logging/metrics/tracing, backups, secrets, **PII + GST/tax compliance**, rate limits |

The good news: the **doctrine is already enforced in one shared router/policy layer** and the engines
are already **pure, deterministic, and tested** — that's the hardest part to get right and it's done.
The work is replacing the data source (seed → DB/adapters) and surfacing real flows.

---

## 6. Demo → production gap (the make-it-real checklist)

Persistence · real auth + sessions · real forms with validation + writes (today the app has *no text
inputs*) · real money movement · idempotent webhooks · error/empty/loading states wired to real failure
modes · background jobs (the "overnight run" must actually run) · audit log that's real · data export ·
GDPR/DPDP (India) data-handling · accessibility · tests at the integration/e2e level (today: unit tests
on the engines only) · security review.

---

## 7. Open-source + brand-agnostic strategy (so anyone can use it)

- **License:** for a SaaS you want OSS adoption *and* a defensible hosted business → **open-core**.
  Core admin + engines under **Apache-2.0/MIT**; the hosted multi-tenant cloud + premium integrations/AI
  as the paid layer. (If you want to prevent a competitor from running your code as a rival SaaS without
  contributing, consider **AGPL-3.0** for the server — the common "open but protected" choice.)
- **Brand-agnostic / white-label:** rip out every hardcoded brand string (Helm, Kanha, Baby-Care, the
  seeded names) into **config + theming** (logo, palette, copy, currency, locale, tax rules). The MaaS
  tenant model already proves the multi-tenant config path. A new D2C brand should `git clone`, set a
  config, run a seed, and have *their* store — no code edits.
- **Self-hostable + hosted:** a one-command `docker compose up` (Postgres + Medusa + Helm + storefront)
  for self-host; a hosted "Helm Cloud" for those who don't want ops. Both off the same repo.
- **Repo hygiene for GitHub:** clear README + architecture diagram + a `demo` seed (keep the current
  deterministic world as the **showcase/dev seed** — it's a genuine asset for onboarding), CONTRIBUTING,
  a roadmap, issues, a license, and a live demo link. The existing `docs/` (PRD, SPEC, reviews) is a
  strong differentiator most OSS repos lack.

---

## 8. Phased roadmap (honest about effort — this is quarters, not a weekend)

- **Phase 0 — Extract + de-brand (2-4 weeks).** Pull the engines + decision-layer + design system into a
  clean package; make everything **config-driven and brand-agnostic**; ship the current demo as a
  polished, self-hostable showcase on GitHub. *Outcome: a credible OSS repo + live demo.* (Low risk —
  it's mostly refactor + config.)
- **Phase 1 — The real MVP (2-3 months).** Medusa backend + Postgres + real auth/multi-tenancy; the
  **store builder + checkout (Razorpay/COD)**; **SCALE wired to one real shipping aggregator** (the
  hero); real orders + landed-margin per order; **one full AI decision loop on real data** (the COD-RTO
  gate). *Outcome: a D2C brand can actually go live and ship.*
- **Phase 2 — The decision layer, broadened (2-3 months).** More agents on real data (inventory truth,
  finance/GST, returns), own-site analytics, the copilot (LLM + tool-use), promote-to-shadow, the ledger
  proving value. Optional **marketplace channel sync**.
- **Phase 3 — Productize the SaaS (ongoing).** Billing/plans, onboarding, more integrations, scale,
  support, GTM.

Realistic: **a credible OSS MVP that helps real D2C brands is ~4-6 focused months** with a small team;
Phase 0 alone is shippable in weeks and is the right first move.

---

## 9. The wedge & why a D2C starter would pick this

Shopify gives them a store but no brain. Shiprocket gives them shipping but no decisions. Nobody gives an
early D2C founder an **AI execution layer** that ships the right courier, flags the money-losing SKU,
prevents the oversell, and shows true landed profit — **for free, open-source, and brand-agnostic**.
Lead with the one pain every Indian D2C founder feels in month one: **RTO bleeding their COD orders.**
SCALE + the review-first drawer solves it visibly on day one. That's the hook; the store + the rest of
the decision layer is the retention.

---

## 10. What to cut / de-risk

- **Don't** rebuild a marketplace, FBF, or Buy-Box. **Don't** build a commerce backend (adopt Medusa).
  **Don't** build heavy ML before rules + real outcomes justify it. **Don't** boil the 31-module ocean —
  ship the 6-surface MVP.
- **Do** lead with SCALE (the unfair, India-specific wedge), keep the decision-layer doctrine as the
  identity, and make Phase 0 (de-brand + OSS the demo) the immediate next step — it's high-signal, low-
  risk, and turns this portfolio piece into something the world can actually use.

---

*Bottom line: the reusable IP (the governed decision layer + the engines, especially SCALE) is real and
rare; the path to a sellable D2C-starter SaaS is a deliberate re-point + a real backend + a store
builder, not a wire-up — and it's eminently doable in phases, starting with an open-source de-branded
showcase in weeks.*
