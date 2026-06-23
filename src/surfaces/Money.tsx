import { useStore } from '../store/useStore';
import { computeLandedMargin } from '../lib/landedMargin';
import { formatINR } from '../lib/format';
import { PageHeader, Stat, Tag } from '../components/primitives';

export function Money() {
  const world = useStore((s) => s.world);
  const delivered = world.orders.filter((o) => o.state === 'DELIVERED');
  const rr = (sku: string) => world.products.find((p) => p.sku === sku)?.returnRate ?? 0.1;

  let revenue = 0, net = 0;
  const lineTotals = new Map<string, number>();
  for (const o of delivered) {
    const m = computeLandedMargin({ channel: o.channel, sellingPricePaise: o.sellingPricePaise, cogsPaise: o.cogsPaise, qty: o.qty, weightGrams: o.weightGrams, zoneClass: o.zoneClass, paymentMode: o.paymentMode, returnRate: rr(o.sku) });
    revenue += m.revenuePaise; net += m.netPaise;
    for (const l of m.lines) lineTotals.set(l.label, (lineTotals.get(l.label) ?? 0) + l.valuePaise);
  }
  const lines = [...lineTotals.entries()];

  const bySku = world.products.filter((p) => p.status === 'active').map((p) => {
    const m = computeLandedMargin({ channel: 'own_store', sellingPricePaise: p.pricePaise, cogsPaise: p.cogsPaise, qty: 1, weightGrams: p.weightGrams, zoneClass: 'metro', paymentMode: 'PREPAID', returnRate: p.returnRate });
    return { p, marginPct: Math.round(m.marginPct * 100), net: m.netPaise };
  }).sort((a, b) => a.marginPct - b.marginPct);
  const losers = bySku.filter((x) => x.marginPct < 8);

  return (
    <div>
      <PageHeader title="Money" sub="True landed profit — what you actually keep after COGS, shipping, COD, GST, returns and CAC. Not vanity revenue." right={<Tag tone="accent">Finance</Tag>} />

      <div className="mb-5 grid grid-cols-3 gap-3">
        <Stat label="Revenue (delivered)" value={formatINR(revenue, { compact: true })} sub={`${delivered.length} orders`} />
        <Stat label="Net landed profit" value={formatINR(net, { compact: true })} accent={net >= 0 ? 'text-pos' : 'text-neg'} />
        <Stat label="Net margin" value={`${revenue ? Math.round((net / revenue) * 100) : 0}%`} accent="text-auto" />
      </div>

      <div className="grid grid-cols-2 gap-6">
        <div>
          <h3 className="mb-2 text-sm font-semibold text-text">P&amp;L — from the one landed-margin engine</h3>
          <div className="overflow-hidden rounded-[10px] border border-line">
            {lines.map(([label, v], i) => (
              <div key={i} className="flex items-center justify-between border-b border-line bg-surface px-4 py-2 text-sm last:border-0">
                <span className={v < 0 ? 'text-mute' : 'text-dim'}>{label}</span>
                <span className={`font-mono text-xs ${v < 0 ? 'text-neg' : 'text-dim'}`}>{formatINR(v)}</span>
              </div>
            ))}
            <div className="flex items-center justify-between bg-surface-2 px-4 py-2 text-sm">
              <span className="font-semibold text-text">Net landed profit</span>
              <span className={`font-mono font-semibold ${net >= 0 ? 'text-pos' : 'text-neg'}`}>{formatINR(net)}</span>
            </div>
          </div>
        </div>

        <div>
          <h3 className="mb-2 text-sm font-semibold text-text">SKUs to watch <span className="font-normal text-mute">— margin &lt; 8%</span></h3>
          <div className="space-y-2">
            {losers.slice(0, 8).map((x) => (
              <div key={x.p.sku} className="flex items-center justify-between rounded-[10px] border border-line bg-surface px-4 py-2 text-sm">
                <span className="truncate text-dim">{x.p.title}</span>
                <Tag tone={x.marginPct < 0 ? 'neg' : 'review'}>{x.marginPct}% margin</Tag>
              </div>
            ))}
            {losers.length === 0 && <div className="rounded-[10px] border border-line bg-surface px-4 py-6 text-center text-xs text-mute">Every SKU clears 8% landed margin.</div>}
          </div>
          <div className="mt-2 text-[11px] text-mute">The Pricing agent proposes a fix (raise price or drop a channel) for each — review-first.</div>
        </div>
      </div>
    </div>
  );
}
