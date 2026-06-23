import type { ReactNode } from 'react';
import type { Provenance, RoutingTier } from '../types';
import { formatINR } from '../lib/format';

export function PageHeader({ title, sub, right }: { title: string; sub?: string; right?: ReactNode }) {
  return (
    <div className="mb-5 flex items-start justify-between gap-4">
      <div>
        <h1 className="text-xl font-semibold text-text">{title}</h1>
        {sub && <p className="mt-1 max-w-3xl text-sm text-mute">{sub}</p>}
      </div>
      {right && <div className="shrink-0">{right}</div>}
    </div>
  );
}

export function Stat({ label, value, sub, accent }: { label: string; value: string; sub?: string; accent?: string }) {
  return (
    <div className="rounded-[10px] border border-line bg-surface p-4">
      <div className="text-[11px] uppercase tracking-wide text-mute">{label}</div>
      <div className={`mt-1 font-mono text-xl font-semibold ${accent ?? 'text-text'}`}>{value}</div>
      {sub && <div className="mt-0.5 text-[11px] text-mute">{sub}</div>}
    </div>
  );
}

const TONES: Record<string, string> = {
  pos: 'text-auto border-auto', neg: 'text-escalate border-escalate', review: 'text-review border-review',
  accent: 'text-accent border-accent', mute: 'text-mute border-line',
};
export function Tag({ tone = 'mute', children }: { tone?: string; children: ReactNode }) {
  return <span className={`inline-flex items-center rounded border bg-surface-2 px-1.5 py-0.5 text-[10px] ${TONES[tone] ?? TONES.mute}`}>{children}</span>;
}

export function ConfidenceBadge({ c }: { c: number }) {
  const pct = Math.round(c * 100);
  const tone = pct >= 97 ? 'text-auto' : pct >= 90 ? 'text-onetap' : pct >= 75 ? 'text-review' : 'text-escalate';
  return <span className={`font-mono text-[11px] ${tone}`}>{pct}%</span>;
}

const TIER: Record<RoutingTier, [string, string]> = { AUTO: ['auto', 'text-auto'], ONE_TAP: ['1-tap', 'text-onetap'], REVIEW: ['review', 'text-review'], ESCALATE: ['escalate', 'text-escalate'] };
export function RoutingBadge({ tier }: { tier: RoutingTier }) {
  const [l, c] = TIER[tier];
  return <span className={`rounded border border-line bg-surface-2 px-1.5 py-0.5 text-[10px] ${c}`}>{l}</span>;
}

export function MoneyDelta({ paise }: { paise: number }) {
  if (!paise) return <span className="font-mono text-[11px] text-mute">—</span>;
  return <span className={`font-mono text-[11px] ${paise > 0 ? 'text-pos' : 'text-neg'}`}>{paise > 0 ? '+' : ''}{formatINR(paise, { compact: true })}</span>;
}

export function ProvenanceTag({ p }: { p: Provenance }) {
  if (p.basis === 'measured') return <span className="font-mono text-[10px] text-auto">[M]</span>;
  if (p.basis === 'derived') return <span className="font-mono text-[10px] text-dim">[D]</span>;
  return <span className="font-mono text-[10px] text-projected">[P{p.confidence ? ` ${Math.round(p.confidence * 100)}%` : ''}]</span>;
}
