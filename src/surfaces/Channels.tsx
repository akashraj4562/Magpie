import { useStore } from '../store/useStore';
import { computeLandedMargin } from '../lib/landedMargin';
import { formatINR } from '../lib/format';
import { CHANNELS, CHANNEL_LABEL } from '../types';
import type { Channel } from '../types';
import { PageHeader, Stat, Tag } from '../components/primitives';

export function Channels() {
  const world = useStore((s) => s.world);
  const rr = (sku: string) => world.products.find((p) => p.sku === sku)?.returnRate ?? 0.1;
  const stat = (ch: Channel) => {
    const os = world.orders.filter((o) => o.channel === ch);
    let gmv = 0, net = 0;
    for (const o of os.filter((o) => o.state === 'DELIVERED')) {
      const m = computeLandedMargin({ channel: o.channel, sellingPricePaise: o.sellingPricePaise, cogsPaise: o.cogsPaise, qty: o.qty, weightGrams: o.weightGrams, zoneClass: o.zoneClass, paymentMode: o.paymentMode, returnRate: rr(o.sku) });
      gmv += m.revenuePaise; net += m.netPaise;
    }
    const shipped = os.filter((o) => ['SHIPPED', 'OUT_FOR_DELIVERY', 'DELIVERED', 'NDR', 'RTO'].includes(o.state)).length;
    const rto = os.filter((o) => o.state === 'RTO').length;
    return { orders: os.length, gmv, marginPct: gmv ? Math.round((net / gmv) * 100) : 0, rtoPct: shipped ? Math.round((rto / shipped) * 100) : 0 };
  };

  return (
    <div>
      <PageHeader title="Channels" sub="Sell on your own store and on marketplaces — one catalog, one decision layer, one inventory truth. Marketplace channel sync lands in Phase 2." right={<Tag tone="accent">Multi-channel</Tag>} />
      <div className="grid grid-cols-3 gap-4">
        {CHANNELS.map((ch) => {
          const s = stat(ch);
          return (
            <div key={ch} className={`rounded-[10px] border bg-surface p-4 ${ch === 'own_store' ? 'border-accent' : 'border-line'}`}>
              <div className="mb-3 flex items-center justify-between">
                <span className="text-sm font-medium text-text">{CHANNEL_LABEL[ch]}</span>
                {ch === 'own_store' ? <Tag tone="pos">0% commission</Tag> : <Tag tone="mute">{ch === 'amazon' ? '15%' : '14%'} commission</Tag>}
              </div>
              <div className="grid grid-cols-2 gap-2">
                <Stat label="Orders" value={String(s.orders)} />
                <Stat label="GMV" value={formatINR(s.gmv, { compact: true })} />
                <Stat label="Net margin" value={`${s.marginPct}%`} accent={s.marginPct >= 10 ? 'text-auto' : 'text-review'} />
                <Stat label="RTO" value={`${s.rtoPct}%`} accent="text-escalate" />
              </div>
            </div>
          );
        })}
      </div>
      <div className="mt-4 rounded-[10px] border border-line bg-surface-2 px-4 py-3 text-xs text-dim">
        <span className="font-medium text-text">Why own-store wins on margin:</span> no marketplace commission, you own the customer (repeat + LTV), and you keep the data. Magpie runs the same SCALE routing + landed-margin engine across every channel.
      </div>
    </div>
  );
}
