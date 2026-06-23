import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { ArrowRight, Search, Sparkles } from 'lucide-react';
import { useStore } from '../store/useStore';
import type { World } from '../seed/generate';

// Ask Magpie — the site-wide copilot + search. A typed ask resolves to a grounded route, a proposed
// decision in the review-first drawer, or an order/SKU/customer lookup. Grounded keyword routing
// (production direction is real NLU); the routes + decisions are real.
type Resolved = { label: string; hint: string; act: () => void };

const KW: [RegExp, string, string][] = [
  [/\brto\b|courier|rout|\bsla\b|\bndr\b|deliver|promise.?safe|ship/, 'Shipping · SCALE', '/shipping'],
  [/\bcod\b/, 'Orders (COD routing)', '/orders'],
  [/order/, 'Orders', '/orders'],
  [/decision|queue|approve|\breview\b/, 'Decisions', '/decisions'],
  [/margin|profit|p&l|\bpnl\b|money|losing|\bcac\b/, 'Money — true P&L', '/money'],
  [/ledger|predicted|proof|verified|recover/, 'Ledger', '/ledger'],
  [/\bsku\b|product|catalog|stock|inventor/, 'Catalog', '/catalog'],
  [/channel|amazon|flipkart|marketplace/, 'Channels', '/channels'],
  [/store|website|storefront|builder/, 'Storefront', '/storefront'],
  [/customer|repeat|\bltv\b/, 'Customers', '/customers'],
  [/setting|config|integrat|razorpay|shiprocket/, 'Settings', '/settings'],
  [/today|overnight|triage/, 'Today', '/'],
];

function resolve(q: string, world: World, navigate: (p: string) => void, open: (id: string) => void): Resolved | null {
  const s = q.toLowerCase().trim();
  if (!s) return null;
  if (/reroute|cod.?rto|promise.?safe|will rto/.test(s)) {
    const d = world.decisions.find((x) => x.agentId === 'routing' && (x.title.toLowerCase().includes('reroute') || x.title.toLowerCase().includes('promise')));
    if (d) return { label: 'Reroute a COD order (SCALE)', hint: 'opens the decision', act: () => open(d.decisionId) };
  }
  if (/losing|loses|negative/.test(s)) return { label: 'SKUs losing money', hint: 'go to Money', act: () => navigate('/money') };
  for (const [re, label, path] of KW) if (re.test(s)) return { label, hint: `go to ${label}`, act: () => navigate(path) };
  const o = world.orders.find((x) => x.orderId.toLowerCase() === s || x.title.toLowerCase().includes(s));
  if (o) return { label: `Order ${o.orderId} — ${o.title}`, hint: 'open in Orders', act: () => navigate('/orders') };
  const p = world.products.find((x) => x.sku.toLowerCase() === s || x.title.toLowerCase().includes(s));
  if (p) return { label: `${p.sku} — ${p.title}`, hint: 'open in Catalog', act: () => navigate('/catalog') };
  return null;
}

const SUGGESTED = ['Which COD orders will RTO — reroute them', 'Show me SKUs losing money', 'What did Magpie recover this week?', 'Best courier for tier-3 COD'];

export function AskPanel({ onClose }: { onClose: () => void }) {
  const navigate = useNavigate();
  const world = useStore((s) => s.world);
  const open = useStore((s) => s.openDecision);
  const [q, setQ] = useState('');
  const r = resolve(q, world, navigate, open);

  function run(res: Resolved | null) { if (res) { res.act(); onClose(); } }

  return (
    <>
      <button className="fixed inset-0 z-40" aria-label="Close" onClick={onClose} />
      <div className="fixed right-6 top-14 z-50 w-[420px] rounded-[10px] border border-line bg-surface-2 p-3 shadow-2xl">
        <div className="mb-2 flex items-center gap-2 rounded-md border border-line bg-surface px-2.5 py-2">
          <Search size={14} className="shrink-0 text-mute" />
          <input autoFocus value={q} onChange={(e) => setQ(e.target.value)} onKeyDown={(e) => e.key === 'Enter' && run(r)} placeholder="Ask or search — orders, SKUs, 'reroute COD', 'losing money'…" className="w-full bg-transparent text-[13px] text-text placeholder:text-mute focus:outline-none" />
        </div>
        {q && (
          <button onClick={() => run(r)} disabled={!r} className={`mb-2 flex w-full items-center justify-between gap-2 rounded-md border px-3 py-2 text-left text-[13px] ${r ? 'border-accent bg-accent-bg text-accent hover:opacity-90' : 'border-line bg-surface text-mute'}`}>
            <span>{r ? <><span className="font-medium">{r.label}</span> <span className="text-mute">— {r.hint}</span></> : 'No match — try a topic, an order/SKU, or a customer.'}</span>
            {r && <ArrowRight size={14} className="shrink-0" />}
          </button>
        )}
        <div className="mb-1 flex items-center gap-1 text-[11px] text-mute"><Sparkles size={12} className="text-accent" /> {q ? 'or try' : 'Try one'}</div>
        <div className="space-y-1.5">
          {SUGGESTED.map((sg) => (
            <button key={sg} onClick={() => run(resolve(sg, world, navigate, open))} className="flex w-full items-center justify-between gap-2 rounded-md border border-line bg-surface px-3 py-2 text-left text-[13px] text-dim hover:border-line-strong hover:text-text">
              {sg}<ArrowRight size={14} className="shrink-0 text-mute" />
            </button>
          ))}
        </div>
        <div className="mt-2 border-t border-line pt-2 text-[11px] text-mute">Answers are grounded in your seeded data; proposed actions route into the review-first drawer.</div>
      </div>
    </>
  );
}
