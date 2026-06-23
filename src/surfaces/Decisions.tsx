import { useState } from 'react';
import { useStore } from '../store/useStore';
import { ConfidenceBadge, MoneyDelta, PageHeader, RoutingBadge, Tag } from '../components/primitives';

const FILTERS = [['needyou', 'Need you'], ['auto', 'Auto-executed'], ['all', 'All']] as const;

export function Decisions() {
  const [f, setF] = useState<'needyou' | 'auto' | 'all'>('needyou');
  const world = useStore((s) => s.world);
  const open = useStore((s) => s.openDecision);
  const all = world.decisions;
  const list = (f === 'needyou'
    ? all.filter((d) => (d.routingTier === 'REVIEW' || d.routingTier === 'ESCALATE') && (d.status === 'PENDING' || d.status === 'ESCALATED'))
    : f === 'auto' ? all.filter((d) => d.status === 'AUTO_EXECUTED') : all
  ).slice(0, 40);

  return (
    <div>
      <PageHeader title="Decisions" sub="The governed queue. Review-first — nothing acts until you act; auto-executed items are view-records. Every call carries a confidence %, a ₹ impact and a reversibility tag." />
      <div className="mb-4 flex gap-1">
        {FILTERS.map(([k, l]) => (
          <button key={k} onClick={() => setF(k)} className={`rounded-md px-3 py-1.5 text-xs ${f === k ? 'bg-accent-bg text-accent' : 'text-dim hover:bg-surface-2'}`}>{l}</button>
        ))}
      </div>
      <div className="space-y-2">
        {list.map((d) => (
          <button key={d.decisionId} onClick={() => open(d.decisionId)} className="flex w-full items-center justify-between gap-3 rounded-[10px] border border-line bg-surface px-4 py-2.5 text-left hover:border-line-strong">
            <span className="min-w-0"><span className="block truncate text-sm text-dim">{d.title}</span><span className="text-[11px] text-mute">{d.domainLabel} · {d.agentId}</span></span>
            <span className="flex shrink-0 items-center gap-3">
              {d.status === 'AUTO_EXECUTED' && <Tag tone="pos">auto</Tag>}
              <ConfidenceBadge c={d.confidence} />
              <MoneyDelta paise={d.deltaPaise} />
              <RoutingBadge tier={d.routingTier} />
            </span>
          </button>
        ))}
      </div>
    </div>
  );
}
