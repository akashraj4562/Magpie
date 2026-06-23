# PM Review — Helm Productization Strategy + Tasks
**Reviewer:** Head of Product (Product Staff)
**Date:** 2026-06-23
**Documents reviewed:** `docs/PRODUCTIZATION.md` · `docs/PRODUCTIZATION-TASKS.md`
**Verdict:** CONDITIONAL

---

## Overall read

The strategy document is well-framed and self-aware. It correctly names the gap between "portfolio demo" and "real product," identifies the reusable IP, and arrives at a sensible phased structure. The tasks document translates that into a reasonably clean backlog. But there are five structural problems that, left unaddressed, will cause the build to over-commit before it has validated the most dangerous assumption underneath the whole thesis. This is a CONDITIONAL, not a GREEN, because the scope decision that was already made — "own-store + marketplace channel" — was made too early for a solo builder targeting users with zero orders.

---

## 1. The re-point thesis: mostly right, one mis-classification

The keep/cut map is directionally correct. The decision layer, SCALE/courier-RTO, and the landed-margin engine are genuine, transferable IP. The buy-box/FBF/marketplace-settlement cut is correct.

One mis-classification: **own-site analytics is listed as Phase 2, repurposed from AdAnalytics**. It belongs in Phase 1. A D2C brand that has just launched their store has exactly one question: "Is anyone coming, and are they buying?" Without own-site funnel data (sessions → ATC → purchase), the brand cannot diagnose their first week. Moving this to Phase 2 means the product goes live with no feedback loop for the brand's most urgent question. Swap it forward.

The second classification to challenge: **GST e-invoicing is listed in Phase 1 as an MVP task** with Medium effort. For a solo builder this is dangerous. GST e-invoicing (IRN/QR via the IRP) requires NIC sandbox integration, a registered GSTIN, IRN generation + error-handling for the 200+ error codes, and a production credential flow. This is L effort, not M, and it is not required to ship the first order. Defer it to Phase 2, gate its entry on "brand has shipped 10+ real orders and asked for it."

---

## 2. MVP scope realism: the own-store + marketplace decision is premature

This is the primary concern. The strategy document names the target user precisely: **"a brand just starting their online presence."** That user has zero orders. Their week-one problem is not multi-channel inventory sync — it is "I need to go live and ship my first order without losing money to RTO."

The scope decision that was already locked in — own-store plus marketplace channel simultaneously — contradicts this. Here is why:

- **Multi-channel Reliable-ATP** requires the brand to have inventory split across channels. A brand with zero orders has everything in one place. This feature is solving for a problem that doesn't exist at week one.
- **Marketplace channel adapters** (Amazon SP-API, Flipkart) are properly deferred to Phase 2, but the scope framing bakes them in as a design constraint from Phase 0 onward. That framing shapes architecture decisions (multi-channel catalog, channel-aware order model) before those decisions are validated.
- The PRODUCTIZATION-TASKS preamble explicitly commits to "one catalog/inventory/order core" spanning both channels. For a solo builder, designing that abstraction layer before any real D2C brand has used the product is premature generalization.

The true minimum that delivers value in week one for a brand with zero orders:
1. A store on a domain, products loaded, checkout live.
2. First order placed. Label generated. Shipped.
3. True landed margin on that order (did we make money?).
4. SCALE courier gate on that order (did we pick the right courier for this COD order?).
5. Own-site funnel: did they convert?

Everything else — marketplace sync, multi-channel ATP, the full agent crew, multi-tenancy for other brands — is after the brand has shipped 10 real orders and returned to the product voluntarily. That is the behavioral signal that validates the premise.

**Recommendation:** Run Phase 1 as own-store only. Remove the multi-channel architecture constraint from Phase 0 and Phase 1 design. Add marketplace channel as Phase 2 with an explicit trigger condition: pilot brand has shipped 50+ orders and requests it.

---

## 3. Phasing and sequencing: Phase 0 is right, but Phase 1 is under-sequenced

Phase 0 (de-brand + OSS the demo) is the correct first move. It is low-risk, produces a credible GitHub artifact, and preserves optionality. No issue here.

Phase 1 has a sequencing problem. The task list groups "foundation" (Medusa + Postgres + auth + multi-tenancy) together, then "store builder," then "shipping intelligence," then "one AI loop." But the critical path inside Phase 1 is not linear — it has a dependency structure the current ordering obscures:

**The actual Phase 1 critical path:**
1. Medusa + Postgres (nothing else works without this)
2. Auth (without this, you cannot test multi-brand)
3. Product catalog + variant model (store builder depends on this)
4. Checkout + Razorpay (real orders depend on this)
5. Shiprocket integration + webhook (SCALE needs real outcome data)
6. SCALE on real data + COD-RTO gate (the hero, now unblocked)
7. Landed margin on real fees (now real, not seeded)
8. One AI decision loop + ledger (now has real decisions to log)

The store builder (block editor, themes, custom domain mapping) is listed as a Phase 1 task but it is not on the critical path to "a brand ships their first order." A D2C brand can go live with a minimal product page — even a static one — before the full block editor exists. The store builder is high effort (L) and high risk (it is the largest net-new surface). Scope it as Phase 1b, sequenced after the order + shipping path is proven working.

**Recommended recut:**
- Phase 1a: real backend + auth + minimal catalog + checkout + SCALE-on-real-shipping + one AI loop. The brand ships their first order.
- Phase 1b: store builder + custom domain + themes + own-site analytics. The brand gets their real storefront.

---

## 4. What to cut / defer — the solo builder trap

This looks like a solo build. The Phase 1 task list has 14 items. Each is described with an effort estimate, but the interdependencies are not sequenced and the total effort understates the integration risk. "Adopt Medusa (L)" alone is a significant commitment — Medusa is well-designed but its data model is opinionated, and wrapping the existing decision layer around it requires understanding that model deeply before building anything on top of it.

Cut or defer these from Phase 1 for a solo builder:

- **Multi-tenancy (RLS or schema-per-tenant):** Defer to Phase 2. Build for one brand first. Multi-tenancy adds significant complexity to every query and test. Validate the product with one real brand before abstracting to many.
- **Full store builder (block editor, themes):** Defer to Phase 1b as described above. Ship a minimal storefront first.
- **GST e-invoicing:** Defer to Phase 2 as argued above.
- **Multi-channel Reliable-ATP:** Defer to Phase 2 per the scope argument above.

What that leaves for Phase 1 is lean enough to actually ship: Medusa + Postgres + auth + single-brand catalog + checkout + Shiprocket + SCALE COD-RTO gate + landed margin + one AI loop. That is still a real product. And it is completable.

---

## 5. The "achieves" framing: mostly honest, two exceptions

Most of the "→ achieves" lines are honest. Two are solutions looking for a problem:

**"Multi-tenancy → achieves: many brands on one deployment = the SaaS."** This is an infrastructure ambition dressed as user value. The user (an early D2C brand) does not care whether they share infrastructure with other brands. Multi-tenancy is a business model choice for the builder, not a value delivery for the user. The framing should be honest: this enables the hosted SaaS business model. That's a valid reason to build it — but not in Phase 1 for a user with zero orders.

**"Theming layer → achieves: white-label storefront + admin."** White-label presupposes a B2B2C or agency buyer. The target user is a D2C founder using Helm directly for their own brand. A theming layer is useful for brand-agnostic configuration (agreed), but the "white-label" framing implies a customer type (agencies reselling Helm) that has not been validated. Reframe: "achieves: any brand configures their own identity in config, no code edits."

---

## Sharpened MVP recommendation

**The true MVP for a brand with zero orders is:** own-store only, minimal storefront, real checkout (Razorpay + COD), Shiprocket integration, SCALE COD-RTO gate on first dispatch, landed margin per order, own-site funnel. The AI decision layer surfaces one real loop: "this COD order is high-RTO → reroute or convert-to-prepaid."

**The proof-of-value gate for the MVP:** A pilot D2C brand places 10 real orders, the SCALE gate fires on at least 3 of them with a different courier recommendation than cheapest-freight, the brand can see true landed margin per order within 24 hours of delivery. If this happens, the product core is validated. If it doesn't, the premise needs redesigning before Phase 2 investment.

**What must be decided before build starts:**

1. **Own-store only in Phase 1, or own-store + marketplace from day one?** The strategy says the latter is decided. The PM review says the former is correct for the stated user (zero orders). This is the most important unresolved tension.

2. **Multi-tenancy in Phase 1 or Phase 2?** A significant architecture decision with real complexity cost. One brand first is lower risk and faster to validate.

3. **Store builder scope in Phase 1:** Full block editor (L effort, high risk) or minimal product-page template (S effort, proven working)? Defer the builder until the order path is live.

4. **Which shipping aggregator first?** Shiprocket vs Delhivery vs Pickrr — pick one, wire it completely, learn from real webhooks. Don't design for aggregator-agnosticism until the first integration is running.

5. **What is the pilot brand, and when do they commit?** The MVP needs a real D2C brand willing to go live on it. Without a named pilot user, Phase 1 is building to a hypothesis. The behavioral signal gate (10 real orders, brand returns voluntarily) must be defined before the build starts.

---

## Summary

The strategy document is 80% right. The critical path is sound in its broad strokes. The IP identification is accurate. Phase 0 is the right first move. The SCALE/COD-RTO lead feature is correct. What is wrong: the scope decision locks in multi-channel architecture before the core single-channel premise is validated; Phase 1 is over-scoped for a solo builder; multi-tenancy and the full store builder are front-loaded when they should trail a working order loop; and there is no named pilot user to validate the behavioral assumption before Phase 2 investment.

Fix those five items and this is a GREEN. As written: CONDITIONAL.
