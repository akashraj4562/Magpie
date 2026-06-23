import { X } from 'lucide-react';
import { useStore } from '../store/useStore';
import { computeLandedMargin } from '../lib/landedMargin';
import { formatINR } from '../lib/format';
import { ConfidenceBadge, MoneyDelta, ProvenanceTag, RoutingBadge, Tag } from './primitives';

// Review-first: a decision shows a summary; Approve / Deny / Override happen here. Nothing acts until
// a human acts. The landed-margin doctrine: every call shows its ₹ impact, from one engine.
export function EvidenceDrawer() {
  const id = useStore((s) => s.openDecisionId);
  const world = useStore((s) => s.world);
  const close = useStore((s) => s.closeDrawer);
  const resolve = useStore((s) => s.resolveDecision);
  const d = world.decisions.find((x) => x.decisionId === id);
  if (!d) return null;

  const order = d.orderId ? world.orders.find((o) => o.orderId === d.orderId) : undefined;
  const product = d.sku ? world.products.find((p) => p.sku === d.sku) : undefined;
  const lm = order
    ? computeLandedMargin({ channel: order.channel, sellingPricePaise: order.sellingPricePaise, cogsPaise: order.cogsPaise, qty: order.qty, weightGrams: order.weightGrams, zoneClass: order.zoneClass, paymentMode: order.paymentMode, returnRate: 0.1 })
    : product
      ? computeLandedMargin({ channel: 'own_store', sellingPricePaise: product.pricePaise, cogsPaise: product.cogsPaise, qty: 1, weightGrams: product.weightGrams, zoneClass: 'metro', paymentMode: 'PREPAID', returnRate: product.returnRate })
      : undefined;
  const resolved = d.status === 'APPROVED' || d.status === 'DENIED' || d.status === 'OVERRIDDEN' || d.status === 'AUTO_EXECUTED';

  return (
    <>
      <button className="fixed inset-0 z-40 bg-black/40" aria-label="Close" onClick={close} />
      <aside className="fixed right-0 top-0 z-50 flex h-full w-[440px] flex-col overflow-y-auto border-l border-line bg-surface">
        <div className="flex items-start justify-between gap-2 border-b border-line px-5 py-4">
          <div>
            <div className="text-[11px] uppercase tracking-wide text-mute">{d.domainLabel} · {d.agentId} agent</div>
            <div className="mt-1 text-sm font-medium text-text">{d.title}</div>
          </div>
          <button onClick={close} className="shrink-0 text-mute hover:text-text"><X size={16} /></button>
        </div>

        <div className="border-b border-line px-5 py-4">
          <div className="mb-1 flex items-center gap-2 text-[11px] uppercase tracking-wide text-mute">Recommendation <RoutingBadge tier={d.routingTier} /></div>
          <p className="text-sm leading-relaxed text-dim">{d.rationale}</p>
          <div className="mt-2 flex items-center gap-3 text-xs">
            <MoneyDelta paise={d.deltaPaise} />
            <span className="text-mute">confidence <ConfidenceBadge c={d.confidence} /></span>
            <Tag tone={d.reversibility === 'one_way' ? 'review' : 'mute'}>{d.reversibility === 'one_way' ? 'one-way door' : 'reversible'}</Tag>
          </div>
        </div>

        {d.evidence.length > 0 && (
          <div className="border-b border-line px-5 py-4">
            <div className="mb-2 text-[11px] uppercase tracking-wide text-mute">Evidence</div>
            <div className="space-y-1.5">
              {d.evidence.map((e, i) => (
                <div key={i} className="flex items-center justify-between gap-2 text-xs">
                  <span className="flex items-center gap-1.5 text-mute"><ProvenanceTag p={e.provenance} /> {e.label}</span>
                  <span className="font-mono text-dim">{e.value}</span>
                </div>
              ))}
            </div>
          </div>
        )}

        <div className="border-b border-line px-5 py-4">
          <div className="mb-2 text-[11px] uppercase tracking-wide text-mute">Options</div>
          <div className="space-y-1.5">
            {d.options.map((o) => (
              <div key={o.optionId} className={`flex items-center justify-between gap-2 rounded-md border px-3 py-2 text-xs ${o.recommended ? 'border-accent bg-accent-bg' : 'border-line bg-surface-2'}`}>
                <span className={o.recommended ? 'text-text' : 'text-dim'}>{o.label}</span>
                <span className="flex items-center gap-2"><ConfidenceBadge c={o.confidence} /><MoneyDelta paise={o.deltaPaise} /></span>
              </div>
            ))}
          </div>
        </div>

        {lm && (
          <div className="border-b border-line px-5 py-4">
            <div className="mb-2 text-[11px] uppercase tracking-wide text-mute">Landed margin — ties to the paisa</div>
            <div className="overflow-hidden rounded-md border border-line">
              {lm.lines.map((l, i) => (
                <div key={i} className="flex items-center justify-between border-b border-line px-3 py-1.5 text-[11px] last:border-0">
                  <span className="text-mute">{l.label}</span>
                  <span className={`font-mono ${l.valuePaise < 0 ? 'text-neg' : 'text-dim'}`}>{formatINR(l.valuePaise)}</span>
                </div>
              ))}
              <div className="flex items-center justify-between bg-surface-2 px-3 py-1.5 text-[11px]">
                <span className="font-semibold text-text">Net landed margin ({Math.round(lm.marginPct * 100)}%)</span>
                <span className={`font-mono font-semibold ${lm.netPaise >= 0 ? 'text-pos' : 'text-neg'}`}>{formatINR(lm.netPaise)}</span>
              </div>
            </div>
          </div>
        )}

        <div className="mt-auto flex gap-2 border-t border-line px-5 py-4">
          {resolved ? (
            <div className="flex-1 rounded-md border border-line bg-surface-2 px-3 py-2 text-center text-xs text-mute">{d.status === 'AUTO_EXECUTED' ? 'Auto-executed — view record' : `Resolved · ${d.status.toLowerCase()}`}</div>
          ) : (
            <>
              <button onClick={() => resolve(d.decisionId, 'DENIED')} className="flex-1 rounded-md border border-line bg-surface-2 py-2 text-sm text-dim hover:border-line-strong">Deny</button>
              <button onClick={() => resolve(d.decisionId, 'OVERRIDDEN')} className="flex-1 rounded-md border border-line bg-surface-2 py-2 text-sm text-dim hover:border-line-strong">Override</button>
              <button onClick={() => resolve(d.decisionId, 'APPROVED')} className="flex-[1.4] rounded-md bg-accent py-2 text-sm font-medium text-white hover:opacity-90">Approve</button>
            </>
          )}
        </div>
      </aside>
    </>
  );
}
