import { useStore } from '../store/useStore';
import { ledgerStats } from '../lib/ledger';
import { formatINR, formatIST } from '../lib/format';
import { PageHeader, Stat, Tag } from '../components/primitives';

export function Ledger() {
  const world = useStore((s) => s.world);
  const stats = ledgerStats(world.ledger);
  const entries = [...world.ledger].sort((a, b) => new Date(b.closedAt).getTime() - new Date(a.closedAt).getTime());
  const title = (id: string) => world.decisions.find((d) => d.decisionId === id)?.title ?? id;

  return (
    <div>
      <PageHeader title="Ledger" sub="Every decision Magpie makes is recorded predicted-vs-actual. This is the proof no incumbent has — so the number on your P&L holds." right={<Tag tone="accent">the differentiator</Tag>} />

      <div className="mb-5 grid grid-cols-3 gap-3">
        <Stat label="Closed decisions" value={String(stats.count)} />
        <Stat label="Recovered / protected" value={formatINR(stats.recoveredPaise, { compact: true })} accent="text-pos" />
        <Stat label="Precision (predicted-vs-actual)" value={`${stats.precisionPct}%`} accent={stats.precisionPct >= 85 ? 'text-auto' : 'text-review'} sub="target ≥ 85%" />
      </div>

      <div className="overflow-hidden rounded-[10px] border border-line">
        <div className="grid grid-cols-[2.2fr_1.2fr_1fr_1fr_0.8fr_0.8fr] gap-2 border-b border-line bg-surface-2 px-4 py-2 text-[10px] uppercase tracking-wide text-mute">
          <span>Decision</span><span>Metric</span><span>Predicted</span><span>Actual</span><span>Precision</span><span>Closed</span>
        </div>
        {entries.map((e) => (
          <div key={e.ledgerEntryId} className="grid grid-cols-[2.2fr_1.2fr_1fr_1fr_0.8fr_0.8fr] items-center gap-2 border-b border-line bg-surface px-4 py-2 text-xs last:border-0">
            <span className="truncate text-dim">{title(e.decisionId)}</span>
            <span className="text-mute">{e.metric}</span>
            <span className="font-mono text-mute">{formatINR(e.predictedPaise, { compact: true })}</span>
            <span className="font-mono text-dim">{formatINR(e.actualPaise, { compact: true })}</span>
            <span className={`font-mono ${e.precisionPct >= 85 ? 'text-auto' : 'text-review'}`}>{e.precisionPct}%</span>
            <span className="text-mute">{formatIST(e.closedAt)}</span>
          </div>
        ))}
      </div>
    </div>
  );
}
