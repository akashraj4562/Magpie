import type { ReactNode } from 'react';

const WEDGE = [
  { tag: 'The lead feature', h: 'Promise-safe courier routing', p: 'Every COD order routed to the courier that won’t bounce — priced on expected RTO/SLA cost, not just freight. A 3-tier checkout gate (allow / prepaid-nudge / suppress) cuts RTO without killing conversion.' },
  { tag: 'The moat', h: 'Collective intelligence, day one', p: 'A growth-stage brand has thin data; pooled across hundreds of brands, every lane × courier × pincode is statistically real. New brands inherit the network’s intelligence on the first order.' },
  { tag: 'Why it’s un-copyable', h: 'It shows its work', p: 'Every decision carries a confidence %, a ₹ impact, and a reversibility tag — then the ledger proves it, predicted-vs-actual. The only D2C tool that shows you every call it makes and proves it was right.' },
];

const PLAN: { ph: string; body: ReactNode; now?: boolean }[] = [
  { ph: 'Phase 0', now: true, body: <>De-brand + extract the reusable core (the engines + the governed decision loop + the design system) into this brand-agnostic, open-source foundation. Write the founding ADRs (Medusa adapter seam · schema-per-tenant · the cross-tenant SCALE data pool).</> },
  { ph: 'Phase 1', body: <><b>The hero loop, on real data (≈4–6 mo):</b> Medusa + Postgres + auth · Razorpay/COD · Shiprocket + NDR + a reliable webhook pipeline · <b>SCALE on pooled data + the 3-tier COD-RTO gate</b> · landed-margin · one governed AI loop + ledger · DPDP baseline. Pilot 3–5 brands.</> },
  { ph: 'Phase 1.5', body: <>The store/website builder — block editor, themes, custom domain. Off the critical path; ships after the order/shipping loop is proven.</> },
  { ph: 'Phase 2', body: <>Full multi-tenancy + the marketplace channel (Amazon/Flipkart) + multi-channel inventory truth + GST e-invoicing + the broadened agent crew + the copilot.</> },
  { ph: 'Phase 3', body: <>Helm Cloud: usage-based billing (per routed order), onboarding, managed hosting + a founder-friendly self-host installer, and the content/community GTM engine.</> },
];

const DOCS = [
  ['Strategy', 'docs/PRODUCTIZATION.md'],
  ['Build backlog (v2)', 'docs/PRODUCTIZATION-TASKS.md'],
  ['Product-Staff review', 'docs/reviews/REVIEW-PRODUCTIZATION.md'],
  ['Reviewer sections', 'docs/reviews/productization-sections/'],
];

export function App() {
  return (
    <div>
      <div className="topbar"><div className="wrap">
        <div className="logo"><span className="mark">🐦</span> Magpie</div>
        <span className="pill">Phase 0 · foundation</span>
      </div></div>

      <div className="wrap">
        <section className="hero">
          <div className="kicker">Open-source · brand-agnostic · for growth-stage D2C</div>
          <h1>The AI operations brain for D2C brands.</h1>
          <p className="lede">Magpie routes every order to the courier that won’t bounce, flags the SKU that’s quietly losing money after shipping, prevents the oversell — and proves, predicted-vs-actual, that every call was right. One governed decision layer over your own store and your marketplace channels.</p>
          <p className="note">A new, separate project — spun out of the <b style={{ color: 'var(--dim)' }}>Helm</b> seller-portal’s reusable core, re-pointed at D2C founders. Runs on <b style={{ color: 'var(--dim)' }}>127.0.0.1:5190</b> (Helm stays on 5180, untouched).</p>
        </section>

        <section className="section">
          <h2>The wedge</h2>
          <div className="cards">
            {WEDGE.map((c) => (
              <div className="card" key={c.h}>
                <div className="tag">{c.tag}</div>
                <h3>{c.h}</h3>
                <p>{c.p}</p>
              </div>
            ))}
          </div>
        </section>

        <section className="section">
          <h2>The plan</h2>
          {PLAN.map((p) => (
            <div className={`phase ${p.now ? 'now' : ''}`} key={p.ph}>
              <div className="ph">{p.ph}{p.now ? ' ◄' : ''}</div>
              <div className="body">{p.body}</div>
            </div>
          ))}
        </section>

        <section className="section">
          <h2>The thinking (carried over from review)</h2>
          <div className="docs">
            {DOCS.map(([label, path]) => (
              <div className="doc" key={path}><span>{label}</span><code style={{ marginLeft: 'auto' }}>{path}</code></div>
            ))}
          </div>
        </section>

        <footer>
          <b>Locked decisions (post Product-Staff review):</b> ICP = growth-stage D2C (~50+ orders/day) · ambition = fundable startup · moat = cross-tenant data pooling · open-core line = storefront free / decision-layer paid per routed order. The 6/6-CONDITIONAL review is in <code>docs/reviews/</code>.<br />
          Magpie is the product; Helm remains the marketplace seller-portal demo it grew from.
        </footer>
      </div>
    </div>
  );
}
