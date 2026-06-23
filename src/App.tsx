import type { ReactNode } from 'react';
import { BRAND } from './config';

const WEDGE = [
  { tag: 'The lead feature', h: 'Promise-safe courier routing', p: 'Every COD order routed to the courier that won’t bounce — priced on expected RTO/SLA cost, not just freight. A 3-tier checkout gate (allow / prepaid-nudge / suppress) cuts RTO without killing conversion.' },
  { tag: 'The moat', h: 'Collective intelligence, day one', p: 'A growth-stage brand has thin data; pooled across hundreds of brands, every lane × courier × pincode is statistically real. New brands inherit the network’s intelligence on the first order.' },
  { tag: 'Why it’s un-copyable', h: 'It shows its work', p: 'Every decision carries a confidence %, a ₹ impact, and a reversibility tag — then the ledger proves it, predicted-vs-actual. The only D2C tool that shows you every call and proves it was right.' },
];

const PLAN: { ph: string; body: ReactNode; now?: boolean }[] = [
  { ph: 'Phase 0', now: true, body: <>De-brand + extract the reusable core (engines + the governed decision loop + the design system) into this brand-agnostic, open-source foundation. Write the founding ADRs (Medusa adapter seam · schema-per-tenant · the cross-tenant SCALE data pool).</> },
  { ph: 'Phase 1', body: <><b className="text-text">The hero loop, on real data (≈4–6 mo):</b> Medusa + Postgres + auth · Razorpay/COD · Shiprocket + NDR + a reliable webhook pipeline · SCALE on pooled data + the 3-tier COD-RTO gate · landed-margin · one governed AI loop + ledger · DPDP baseline. Pilot 3–5 brands.</> },
  { ph: 'Phase 1.5', body: <>The store/website builder — block editor, themes, custom domain. Off the critical path; ships after the order/shipping loop is proven.</> },
  { ph: 'Phase 2', body: <>Full multi-tenancy + the marketplace channel (Amazon/Flipkart) + multi-channel inventory truth + GST e-invoicing + the broadened agent crew + the copilot.</> },
  { ph: 'Phase 3', body: <>Helm Cloud: usage-based billing (per routed order), onboarding, managed hosting + a founder-friendly self-host installer, and the content/community GTM engine.</> },
];

const DOCS: [string, string][] = [
  ['Strategy', 'docs/PRODUCTIZATION.md'],
  ['Build backlog (v2)', 'docs/PRODUCTIZATION-TASKS.md'],
  ['Product-Staff review', 'docs/reviews/REVIEW-PRODUCTIZATION.md'],
  ['Reviewer sections', 'docs/reviews/productization-sections/'],
];

export function App() {
  return (
    <div className="min-h-full">
      <div className="border-b border-line">
        <div className="mx-auto flex h-[58px] max-w-[960px] items-center gap-3 px-6">
          <span className="grid h-7 w-7 place-items-center rounded-lg bg-gradient-to-br from-accent to-[#3a4a8f] text-[15px]">🐦</span>
          <span className="text-[17px] font-bold">{BRAND.product}</span>
          <span className="ml-auto rounded-full border border-line bg-surface-2 px-2.5 py-1 text-xs text-review">Phase 0 · foundation</span>
        </div>
      </div>

      <div className="mx-auto max-w-[960px] px-6">
        <section className="py-16">
          <div className="text-[13px] font-semibold uppercase tracking-wider text-accent">Open-source · brand-agnostic · for growth-stage D2C</div>
          <h1 className="mt-3 text-[40px] font-bold leading-[1.1] tracking-tight">The AI operations brain for D2C brands.</h1>
          <p className="mt-3 max-w-[660px] text-[17px] leading-relaxed text-dim">{BRAND.product} routes every order to the courier that won’t bounce, flags the SKU that’s quietly losing money after shipping, prevents the oversell — and proves, predicted-vs-actual, that every call was right. One governed decision layer over your own store and your marketplace channels.</p>
          <p className="mt-4 text-[13px] text-mute">A new, separate project — spun out of the <span className="text-dim">Helm</span> seller-portal’s reusable core, re-pointed at D2C founders. Runs on <span className="text-dim">127.0.0.1:5190</span> (Helm stays on 5180, untouched).</p>
        </section>

        <Section title="The wedge">
          <div className="grid grid-cols-3 gap-3.5">
            {WEDGE.map((c) => (
              <div key={c.h} className="rounded-xl border border-line bg-surface p-4">
                <div className="text-[11px] font-semibold text-accent">{c.tag}</div>
                <h3 className="mb-1.5 mt-1 text-[15px] font-semibold">{c.h}</h3>
                <p className="text-[13px] leading-relaxed text-dim">{c.p}</p>
              </div>
            ))}
          </div>
        </Section>

        <Section title="The plan">
          {PLAN.map((p) => (
            <div key={p.ph} className="flex gap-3.5 border-b border-line py-3 last:border-0">
              <div className={`flex-[0_0_96px] text-[13px] font-bold ${p.now ? 'text-accent' : 'text-text'}`}>{p.ph}{p.now ? ' ◄' : ''}</div>
              <div className="text-[13px] leading-relaxed text-dim">{p.body}</div>
            </div>
          ))}
        </Section>

        <Section title="The thinking (from the Product-Staff review)">
          <div className="grid grid-cols-2 gap-2.5">
            {DOCS.map(([label, path]) => (
              <div key={path} className="flex items-center gap-2 rounded-[10px] border border-line bg-surface px-3.5 py-2.5 text-[13px] text-dim">
                <span>{label}</span>
                <code className="ml-auto text-[12px] text-text">{path}</code>
              </div>
            ))}
          </div>
        </Section>

        <footer className="border-t border-line py-7 text-[12.5px] leading-relaxed text-mute">
          <span className="text-dim">Locked decisions (post review):</span> ICP = growth-stage D2C (~50+ orders/day) · ambition = fundable startup · moat = cross-tenant data pooling · open-core line = storefront free / decision-layer paid per routed order. The 6/6-CONDITIONAL review is in <code className="text-text">docs/reviews/</code>.<br />
          {BRAND.product} is the product; Helm remains the marketplace seller-portal demo it grew from.
        </footer>
      </div>
    </div>
  );
}

function Section({ title, children }: { title: string; children: ReactNode }) {
  return (
    <section className="border-t border-line py-7">
      <h2 className="mb-4 text-[14px] uppercase tracking-wide text-mute">{title}</h2>
      {children}
    </section>
  );
}
