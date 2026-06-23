import { useStore } from '../store/useStore';
import { needYouDecisions, ofrFor, rtoRate, todayCounts } from '../lib/selectors';
import { ledgerStats } from '../lib/ledger';
import { formatINR } from '../lib/format';
import { BRAND } from '../config';
import { ConfidenceBadge, MoneyDelta, PageHeader, RoutingBadge, Stat } from '../components/primitives';

export function Today() {
  const world = useStore((s) => s.world);
  const open = useStore((s) => s.openDecision);
  const counts = todayCounts(world.decisions);
  const ofr = ofrFor(world.orders);
  const rto = rtoRate(world.orders);
  const stats = ledgerStats(world.ledger);
  const gmv = world.orders.filter((o) => o.state !== 'CANCELLED' && o.state !== 'NEW').reduce((a, o) => a + o.sellingPricePaise * o.qty, 0);
  const needYou = needYouDecisions(world.decisions);

  return (
    <div>
      <PageHeader title="Today" sub={`${BRAND.name}'s overnight business, triaged. The agents handled what was safe — these are the calls that need you.`} />

      <div className="mb-5 rounded-[10px] border border-line bg-surface px-4 py-3 text-sm text-dim">
        <span className="font-mono font-semibold text-accent">{counts.total}</span> decisions overnight — <span className="font-mono font-semibold text-auto">{counts.auto}</span> auto-executed, <span className="font-mono font-semibold text-onetap">{counts.oneTap}</span> grouped into {counts.clusters} patterns, <span className="font-mono font-semibold text-review">{counts.needYou}</span> need you.
      </div>

      <div className="mb-6 grid grid-cols-4 gap-3">
        <Stat label="GMV (trailing)" value={formatINR(gmv, { compact: true })} sub={`${world.orders.length} orders`} />
        <Stat label="OFR · North-Star" value={`${ofr.ofrPct}%`} sub="order-fulfilment rate" accent={ofr.ofrPct >= 95 ? 'text-auto' : 'text-review'} />
        <Stat label="RTO rate" value={`${rto}%`} sub="the COD pain" accent="text-escalate" />
        <Stat label="Profit protected" value={formatINR(stats.recoveredPaise, { compact: true })} sub={`${stats.count} verified · ${stats.precisionPct}% precision`} accent="text-pos" />
      </div>

      <h2 className="mb-2 text-sm font-semibold text-text">Need you ({needYou.length})</h2>
      <div className="grid grid-cols-2 gap-3">
        {needYou.map((d) => (
          <button key={d.decisionId} onClick={() => open(d.decisionId)} className="rounded-[10px] border border-line bg-surface p-4 text-left hover:border-line-strong">
            <div className="flex items-start justify-between gap-2"><span className="text-sm text-text">{d.title}</span><RoutingBadge tier={d.routingTier} /></div>
            <div className="mt-1 line-clamp-2 text-xs text-mute">{d.rationale}</div>
            <div className="mt-2 flex items-center gap-3 text-xs text-mute">{d.domainLabel} <ConfidenceBadge c={d.confidence} /> <MoneyDelta paise={d.deltaPaise} /></div>
          </button>
        ))}
      </div>
    </div>
  );
}
