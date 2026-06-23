import { useState } from 'react';
import { Truck } from 'lucide-react';
import { useStore } from '../store/useStore';
import { courier, recommendCourier, type Reco } from '../lib/courier';
import { buildDecision } from '../lib/buildDecision';
import { formatINR } from '../lib/format';
import { CHANNEL_LABEL } from '../types';
import type { Channel, DecisionOption, Order, OrderState } from '../types';
import { PageHeader, Tag } from '../components/primitives';

const TABS: { key: string; label: string; states: OrderState[] }[] = [
  { key: 'toship', label: 'To ship', states: ['NEW', 'CONFIRMED', 'PACKED'] },
  { key: 'transit', label: 'In transit', states: ['SHIPPED', 'OUT_FOR_DELIVERY'] },
  { key: 'delivered', label: 'Delivered', states: ['DELIVERED'] },
  { key: 'issues', label: 'Issues', states: ['NDR', 'RTO', 'RETURNED', 'CANCELLED'] },
];
const CHAN_TONE: Record<Channel, string> = { own_store: 'accent', amazon: 'review', flipkart: 'mute' };

export function Orders() {
  const [tab, setTab] = useState('toship');
  const [chan, setChan] = useState<'all' | Channel>('all');
  const world = useStore((s) => s.world);
  const orders = world.orders.filter((o) => chan === 'all' || o.channel === chan);
  const activeTab = TABS.find((t) => t.key === tab)!;
  const list = orders.filter((o) => activeTab.states.includes(o.state)).slice(0, 24);

  return (
    <div>
      <PageHeader title="Orders" sub="Orders from your own store and your marketplace channels, on one guarded lifecycle. Every order's courier is chosen by SCALE." right={<Tag tone="accent">Fulfilment</Tag>} />

      <CourierPanel />

      <div className="mb-3 flex items-center gap-2">
        {(['all', 'own_store', 'amazon', 'flipkart'] as const).map((c) => (
          <button key={c} onClick={() => setChan(c)} className={`rounded-md px-2.5 py-1 text-xs ${chan === c ? 'bg-accent-bg text-accent' : 'text-dim hover:bg-surface-2'}`}>{c === 'all' ? 'All channels' : CHANNEL_LABEL[c]}</button>
        ))}
      </div>
      <div className="mb-4 flex gap-1">
        {TABS.map((t) => {
          const n = orders.filter((o) => t.states.includes(o.state)).length;
          return <button key={t.key} onClick={() => setTab(t.key)} className={`flex items-center gap-2 rounded-md px-3 py-1.5 text-xs ${tab === t.key ? 'bg-accent-bg text-accent' : 'text-dim hover:bg-surface-2'}`}>{t.label} <span className="font-mono text-[11px] text-mute">{n}</span></button>;
        })}
      </div>

      <div className="overflow-hidden rounded-[10px] border border-line">
        <div className="grid grid-cols-[1.1fr_1.6fr_1fr_0.9fr_0.8fr_1fr] gap-2 border-b border-line bg-surface-2 px-4 py-2 text-[10px] uppercase tracking-wide text-mute">
          <span>Order</span><span>Item</span><span>Buyer</span><span>Value</span><span>Pay</span><span>Courier (SCALE)</span>
        </div>
        {list.map((o) => (
          <div key={o.orderId} className="grid grid-cols-[1.1fr_1.6fr_1fr_0.9fr_0.8fr_1fr] items-center gap-2 border-b border-line bg-surface px-4 py-2.5 text-sm last:border-0">
            <span className="flex items-center gap-1.5"><Tag tone={CHAN_TONE[o.channel]}>{CHANNEL_LABEL[o.channel]}</Tag><span className="font-mono text-[11px] text-mute">{o.orderId}</span></span>
            <span className="truncate text-dim">{o.title}</span>
            <span className="text-mute">{o.customerMasked} · {o.city}</span>
            <span className="font-mono text-xs text-dim">{formatINR(o.sellingPricePaise * o.qty, { compact: true })}</span>
            <span><Tag tone={o.paymentMode === 'COD' ? 'review' : 'mute'}>{o.paymentMode}</Tag></span>
            <span className="text-xs text-mute">{o.courierId ? courier(o.courierId).name : '— pending —'}</span>
          </div>
        ))}
        {list.length === 0 && <div className="bg-surface px-4 py-6 text-center text-xs text-mute">No orders in this view.</div>}
      </div>
    </div>
  );
}

// The COD-RTO reroute hero — runtime decision into the review-first drawer.
function CourierPanel() {
  const world = useStore((s) => s.world);
  const addDecision = useStore((s) => s.addDecision);
  const open = useStore((s) => s.openDecision);
  const atRisk = world.orders
    .filter((o) => o.paymentMode === 'COD' && ['NEW', 'CONFIRMED', 'PACKED'].includes(o.state))
    .map((o) => ({ o, reco: recommendCourier(o) }))
    .filter((x) => x.reco.verdict !== 'safe' && x.reco.recommended)
    .sort((a, b) => b.reco.savingPaise - a.reco.savingPaise)
    .slice(0, 5);
  if (atRisk.length === 0) return null;

  function reroute(o: Order, reco: Reco) {
    const rec = reco.recommended!; const cheap = reco.cheapest!;
    const options: DecisionOption[] = [{ optionId: 'opt-a', label: `Route via ${rec.courier.name} — promise-safe`, confidence: 0.86, deltaPaise: reco.savingPaise, reversible: true, lowValue: false, recommended: true }];
    if (cheap.courier.id !== rec.courier.id) options.push({ optionId: 'opt-b', label: `Force cheapest freight (${cheap.courier.name}) — higher RTO`, confidence: 0.41, deltaPaise: -reco.savingPaise, reversible: true, lowValue: false });
    const d = buildDecision({
      agentId: 'routing', domainLabel: 'Logistics / SCALE', title: `Promise-safe courier — ${o.orderId} (${o.title})`,
      rationale: reco.rationale,
      evidence: [
        { label: `${rec.courier.name} — recommended`, value: `score ${rec.score.toFixed(2)} · exp. ${formatINR(rec.expected, { compact: true })}`, provenance: { basis: 'measured', source: 'pool', asOf: '' } },
        { label: `${cheap.courier.name} — cheapest freight`, value: `score ${cheap.score.toFixed(2)} · exp. ${formatINR(cheap.expected, { compact: true })}`, provenance: { basis: 'measured', source: 'pool', asOf: '' } },
        { label: 'Expected RTO-loss avoided', value: formatINR(reco.savingPaise, { compact: true }), provenance: { basis: 'projected', confidence: 0.8, source: 'scale', asOf: '' } },
      ],
      options, recommendedOptionId: 'opt-a', writeBackTarget: 'Courier / NDR-RTO', orderId: o.orderId, channel: o.channel, sku: o.sku,
    });
    addDecision(d); open(d.decisionId);
  }

  return (
    <div className="mb-4 rounded-[10px] border border-review bg-surface px-4 py-3">
      <div className="mb-2 flex items-center gap-2"><Truck size={15} className="text-review" /><span className="text-sm font-medium text-text">{atRisk.length} COD orders need promise-safe routing (SCALE)</span></div>
      <div className="space-y-1.5">
        {atRisk.map(({ o, reco }) => (
          <div key={o.orderId} className="flex items-center justify-between gap-3 rounded-md border border-line bg-surface-2 px-3 py-2">
            <span className="min-w-0"><span className="block truncate text-sm text-dim">{o.title}</span><span className="font-mono text-[11px] text-mute">{o.orderId} · {o.city} · route {reco.recommended!.courier.name} not {reco.cheapest!.courier.name} · save {formatINR(reco.savingPaise, { compact: true })}</span></span>
            <button onClick={() => reroute(o, reco)} className="shrink-0 rounded-md bg-review px-2.5 py-1 text-xs font-medium text-white hover:opacity-90">Reroute → review</button>
          </div>
        ))}
      </div>
      <div className="mt-2 text-[11px] text-mute">Expected landed cost = freight + P(RTO) × true-RTO-cost (incl. CAC wasted + COD cash-blockage). The cheapest freight loses when it risks a broken promise.</div>
    </div>
  );
}
