import { Activity, ArrowUpRight } from 'lucide-react';
import { useStore } from '../store/useStore';
import { isToday, needYouDecisions, ofrFor, rtoRate, todayCounts, trustedAutomationRate } from '../lib/selectors';
import { ledgerStats } from '../lib/ledger';
import { relTimeIST } from '../lib/format';
import { MoneyDelta } from './primitives';

export function Rail() {
  const world = useStore((s) => s.world);
  const open = useStore((s) => s.openDecision);

  const counts = todayCounts(world.decisions);
  const ofr = ofrFor(world.orders);
  const rto = rtoRate(world.orders);
  const tar = trustedAutomationRate(world.decisions);
  const stats = ledgerStats(world.ledger);
  const needYou = needYouDecisions(world.decisions).slice(0, 4);
  const autoFeed = world.decisions.filter((d) => d.status === 'AUTO_EXECUTED' && isToday(d)).slice(0, 7);

  return (
    <aside className="flex h-full w-[300px] shrink-0 flex-col border-l border-line bg-surface">
      <div className="flex items-center gap-2 border-b border-line px-4 py-3">
        <Activity size={15} className="text-auto" />
        <span className="text-sm font-semibold text-text">Founder cockpit</span>
        <span className="ml-auto flex items-center gap-1 text-[11px] text-mute"><span className="h-1.5 w-1.5 animate-pulse rounded-full bg-auto" /> live</span>
      </div>

      <div className="border-b border-line bg-surface px-4 py-2.5 text-center">
        <div className="text-[10px] uppercase tracking-wide text-mute">North-Star · OFR</div>
        <div className={`font-mono text-2xl font-semibold ${ofr.ofrPct >= 95 ? 'text-auto' : ofr.ofrPct >= 90 ? 'text-review' : 'text-escalate'}`}>{ofr.ofrPct}%</div>
        <div className="text-[10px] text-mute">order-fulfilment rate</div>
      </div>
      <div className="grid grid-cols-3 gap-px border-b border-line bg-line text-center">
        <Kpi label="RTO" value={`${rto}%`} tone="text-escalate" />
        <Kpi label="Automation" value={`${tar}%`} tone="text-auto" />
        <Kpi label="Precision" value={`${stats.precisionPct}%`} tone="text-text" />
      </div>

      <div className="border-b border-line px-4 py-3">
        <div className="mb-2 text-[11px] uppercase tracking-wide text-mute">Needs you — {counts.needYou}</div>
        <div className="space-y-1.5">
          {needYou.map((d) => (
            <button key={d.decisionId} onClick={() => open(d.decisionId)} className="flex w-full items-start justify-between gap-2 rounded-md border border-line bg-surface-2 px-2.5 py-1.5 text-left hover:border-line-strong">
              <span className="line-clamp-2 text-xs text-dim">{d.title}</span>
              <span className="mt-0.5 h-1.5 w-1.5 shrink-0 rounded-full" style={{ background: d.routingTier === 'ESCALATE' ? 'var(--escalate)' : 'var(--review)' }} />
            </button>
          ))}
          {needYou.length === 0 && <div className="text-xs text-mute">All clear.</div>}
        </div>
      </div>

      <div className="flex-1 overflow-y-auto px-4 py-3">
        <div className="mb-2 flex items-center gap-1 text-[11px] uppercase tracking-wide text-mute"><ArrowUpRight size={12} /> Auto-executed</div>
        <div className="space-y-1.5">
          {autoFeed.map((d) => (
            <div key={d.decisionId} className="rounded-md border border-line bg-surface px-2.5 py-1.5">
              <div className="line-clamp-1 text-xs text-dim">{d.title}</div>
              <div className="mt-0.5 flex items-center justify-between text-[10px] text-mute"><span>→ {d.writeBackTarget}</span><span>{relTimeIST(d.createdAt)}</span></div>
            </div>
          ))}
        </div>
      </div>

      <div className="border-t border-line px-4 py-3">
        <div className="mb-1 text-[11px] uppercase tracking-wide text-mute">Recently verified</div>
        <div className="flex items-center justify-between text-xs">
          <span className="text-dim">{stats.count} closed · ledger</span>
          <MoneyDelta paise={stats.recoveredPaise} />
        </div>
      </div>
    </aside>
  );
}

function Kpi({ label, value, tone }: { label: string; value: string; tone: string }) {
  return (
    <div className="bg-surface px-2 py-2.5">
      <div className={`font-mono text-base font-semibold ${tone}`}>{value}</div>
      <div className="text-[10px] uppercase tracking-wide text-mute">{label}</div>
    </div>
  );
}
