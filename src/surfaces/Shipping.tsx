import { Truck, Network, AlertTriangle } from 'lucide-react';
import { useStore } from '../store/useStore';
import { COURIERS, codGate, courierScore, perfFor } from '../lib/courier';
import { PageHeader, Stat, Tag } from '../components/primitives';
import type { ZoneClass } from '../types';

const ZONES: ZoneClass[] = ['metro', 'tier2', 'tier3'];
const ZL: Record<ZoneClass, string> = { metro: 'Metro', tier2: 'Tier-2', tier3: 'Tier-3' };
const TIER_TONE = { allow: 'pos', nudge: 'review', suppress: 'neg' } as const;
const TIER_LABEL = { allow: 'allow COD', nudge: 'prepaid-nudge', suppress: 'suppress COD' } as const;

export function Shipping() {
  const world = useStore((s) => s.world);
  const atRisk = world.orders.filter((o) => o.state === 'NDR' || (['SHIPPED', 'OUT_FOR_DELIVERY'].includes(o.state) && o.zoneClass === 'tier3')).slice(0, 6);

  return (
    <div>
      <PageHeader title="Shipping · SCALE" sub="The courier brain behind every dispatch: scored per lane × payment × SKU, an RTO-aware COD gate, and SLA/NDR watch." right={<Tag tone="accent">collective intelligence</Tag>} />

      <div className="mb-4 grid grid-cols-3 gap-3">
        <Stat label="Couriers scored" value={String(COURIERS.length)} sub="per lane × payment × SKU" />
        <Stat label="Network outcomes (pooled)" value="9.2M" sub="across the brand network" accent="text-accent" />
        <Stat label="SLA / NDR at risk" value={String(atRisk.length)} sub="orders in flight" accent={atRisk.length ? 'text-review' : 'text-auto'} />
      </div>

      <div className="mb-5 flex items-start gap-3 rounded-[10px] border border-accent bg-surface px-4 py-3">
        <Network size={16} className="mt-0.5 shrink-0 text-accent" />
        <div className="text-xs text-dim"><span className="font-medium text-text">Collective intelligence, day one.</span> Your brand alone has thin data — but SCALE's scorecards are pooled across hundreds of D2C brands, so every lane × courier × pincode is statistically real from your first order. You inherit the network's intelligence; the cold-start problem becomes the moat.</div>
      </div>

      <h3 className="mb-2 text-sm font-semibold text-text">Courier scorecards <span className="font-normal text-mute">— COD, by zone</span></h3>
      <div className="mb-6 grid grid-cols-3 gap-3">
        {COURIERS.map((c) => {
          const avg = ZONES.filter((z) => c.zones.includes(z)).reduce((a, z) => a + courierScore(c, z, 'COD'), 0) / Math.max(1, ZONES.filter((z) => c.zones.includes(z)).length);
          return (
            <div key={c.id} className={`rounded-[10px] border bg-surface p-3 ${c.penalized ? 'border-review' : 'border-line'}`}>
              <div className="flex items-center justify-between">
                <span className="flex items-center gap-1.5 text-sm font-medium text-text"><Truck size={13} className="text-mute" /> {c.name}{c.penalized && <Tag tone="review">penalised</Tag>}</span>
                <span className={`font-mono text-sm ${avg >= 0.8 ? 'text-auto' : 'text-review'}`}>{avg.toFixed(2)}</span>
              </div>
              <div className="mt-1 text-[11px] text-mute">COD remittance T+{c.codRemittanceLagDays}{c.capabilities.includes('fragile') ? ' · fragile-ok' : ''}</div>
              <div className="mt-1.5 space-y-0.5">
                {ZONES.filter((z) => c.zones.includes(z)).map((z) => {
                  const p = perfFor(c, z, 'COD');
                  return <div key={z} className="flex items-center justify-between font-mono text-[10px] text-dim"><span>{ZL[z]}</span><span>RTO {Math.round(p.rtoRate * 100)}% · on-time {Math.round(p.onTime * 100)}%</span></div>;
                })}
              </div>
            </div>
          );
        })}
      </div>

      <div className="grid grid-cols-2 gap-6">
        <div>
          <h3 className="mb-2 text-sm font-semibold text-text">COD-RTO gate at checkout <span className="font-normal text-mute">— 3-tier</span></h3>
          <div className="space-y-2">
            {ZONES.map((z) => {
              const g = codGate(z, false);
              return (
                <div key={z} className="flex items-center justify-between rounded-[10px] border border-line bg-surface px-4 py-2.5 text-sm">
                  <span className="text-dim">{ZL[z]} <span className="font-mono text-[11px] text-mute">best RTO {g.bestRtoPct}% · threshold {g.threshold}%</span></span>
                  <Tag tone={TIER_TONE[g.tier]}>{TIER_LABEL[g.tier]}</Tag>
                </div>
              );
            })}
          </div>
          <div className="mt-2 text-[11px] text-mute">Hard-suppressing COD kills 40–60% of orders, so the middle tier offers a prepaid-nudge (cashback / split-pay) — recovering margin without killing conversion.</div>
        </div>

        <div>
          <h3 className="mb-2 flex items-center gap-1.5 text-sm font-semibold text-text"><AlertTriangle size={14} className="text-review" /> SLA / NDR watch</h3>
          <div className="space-y-2">
            {atRisk.map((o) => (
              <div key={o.orderId} className="flex items-center justify-between rounded-[10px] border border-line bg-surface px-4 py-2.5 text-sm">
                <span className="min-w-0"><span className="block truncate text-dim">{o.title}</span><span className="font-mono text-[11px] text-mute">{o.orderId} · {o.city} · {o.awb ?? 'no AWB'}</span></span>
                <Tag tone={o.state === 'NDR' ? 'neg' : 'review'}>{o.state === 'NDR' ? 'NDR — reattempt' : 'delayed lane'}</Tag>
              </div>
            ))}
            {atRisk.length === 0 && <div className="rounded-[10px] border border-line bg-surface px-4 py-6 text-center text-xs text-mute">No shipments at risk.</div>}
          </div>
          <div className="mt-2 text-[11px] text-mute">NDR auto-reattempts with a corrected address (≥97% confidence); RTO-prone shipments route to review.</div>
        </div>
      </div>
    </div>
  );
}
