# 🐦 Magpie

**The AI operations brain for growth-stage D2C brands — open-source, brand-agnostic.**

Magpie routes every order to the courier that won't bounce, flags the SKU that's quietly losing money
after shipping, prevents the oversell — and proves, predicted-vs-actual, that every call was right. One
governed decision layer over a brand's **own store** and its **marketplace channels**.

## Lineage

Magpie is a **separate project**, spun out of the reusable core of **Helm** (an AI-native marketplace
seller-portal portfolio build) and re-pointed at D2C founders. Helm stays exactly as it is on port 5180;
Magpie runs on its own endpoint, **127.0.0.1:5190**.

## Run

```bash
npm install
npm run dev      # http://127.0.0.1:5190
```

## Status — runnable product (front-end, seeded)

The full Magpie product surface is **built and runnable** on `127.0.0.1:5190`: **Today**, **Decisions**,
**Orders** (with the COD-RTO reroute hero), **Shipping · SCALE**, **Catalog**, **Channels**, **Storefront**,
**Money** (a true landed P&L), **Ledger** (predicted-vs-actual — the proof), **Customers**, **Settings** —
over the reusable engines (landed-margin, the SCALE courier intelligence, the governed decision loop +
review-first drawer, the ledger), all on **deterministic seeded data** so every flow is demonstrable.

The **real backend** (Medusa + Postgres + auth + Razorpay/Shiprocket + DPDP) is the Phase-1 engineering
per `docs/PRODUCTIZATION-TASKS.md` — what this product surface will run on.

## Docs (the thinking, carried over from review)

- `docs/PRODUCTIZATION.md` — the strategy + reuse map
- `docs/PRODUCTIZATION-TASKS.md` — the build backlog (v2, post Product-Staff review)
- `docs/reviews/REVIEW-PRODUCTIZATION.md` — the Product-Staff review (6/6 CONDITIONAL) + `productization-sections/`

## Locked decisions (post-review)

- **ICP:** growth-stage D2C (~50+ orders/day, where RTO is a budgeted, painful cost line)
- **Ambition:** fundable startup (Helm Cloud hosted-first, usage pricing, pilots → case studies → raise)
- **Moat:** cross-tenant data pooling — *"collective intelligence of hundreds of brands on day one"*
- **Positioning:** lead with the mechanism (the ledger + confidence gates + reversibility), not "AI execution layer"
- **Open-core line:** storefront/builder free (OSS) / the AI decision layer paid (hosted, per routed order)

## License

TBD — open-core (Apache/MIT core + a paid hosted cloud; AGPL on the server is the "open-but-protected"
option). See the strategy doc.
