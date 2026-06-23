import { useState, type ReactNode } from 'react';
import { ArrowRight, Check, CreditCard, Network, Package, ShieldCheck, Store, Truck } from 'lucide-react';
import { BRAND } from '../config';
import { useStore } from '../store/useStore';

type Step = { id: string; icon: ReactNode; title: string; desc: string; cta: string; autoDone?: boolean };
const STEPS: Step[] = [
  { id: 'brand', icon: <Store size={16} />, title: 'Your brand & store', desc: `${BRAND.name} · ${BRAND.domain} — pulled from your config. Everything in Magpie is brand-agnostic, so this is already yours.`, cta: 'Set up', autoDone: true },
  { id: 'catalog', icon: <Package size={16} />, title: 'Import your catalog', desc: 'Bring in your products, variants and inventory — once, shared across every channel.', cta: 'Import 17 products' },
  { id: 'shipping', icon: <Truck size={16} />, title: 'Connect shipping', desc: 'Link Shiprocket / Delhivery so SCALE can route every order and learn from real delivery outcomes.', cta: 'Connect Shiprocket' },
  { id: 'payments', icon: <CreditCard size={16} />, title: 'Connect payments', desc: 'Razorpay for prepaid + COD, with the SCALE COD-RTO gate applied at checkout.', cta: 'Connect Razorpay' },
  { id: 'policy', icon: <ShieldCheck size={16} />, title: 'Set your COD-RTO policy', desc: 'The 3-tier gate — allow / prepaid-nudge / suppress. Start with SCALE’s defaults; tune later in Settings.', cta: 'Use SCALE defaults' },
];

export function Onboarding() {
  const complete = useStore((s) => s.completeOnboarding);
  const [done, setDone] = useState<Record<string, boolean>>({ brand: true });
  const doneCount = STEPS.filter((s) => done[s.id]).length;
  const pct = Math.round((doneCount / STEPS.length) * 100);
  const allDone = doneCount === STEPS.length;

  return (
    <div className="fixed inset-0 z-[60] flex items-center justify-center bg-black/70 p-6">
      <div className="flex max-h-[88vh] w-full max-w-[640px] flex-col overflow-hidden rounded-2xl border border-line bg-surface shadow-2xl">
        <div className="border-b border-line px-6 py-5">
          <div className="flex items-center gap-2.5">
            <span className="grid h-8 w-8 place-items-center rounded-lg bg-gradient-to-br from-accent to-[#3a4a8f] text-base">🐦</span>
            <div><div className="text-base font-semibold text-text">Welcome to Magpie</div><div className="text-xs text-mute">Let’s get {BRAND.name} live — 5 quick steps.</div></div>
            <button onClick={complete} className="ml-auto text-[11px] text-mute hover:text-dim">Skip for now</button>
          </div>
          <div className="mt-4 flex items-center gap-3">
            <div className="h-1.5 flex-1 overflow-hidden rounded-full bg-surface-2"><div className="h-full rounded-full bg-accent transition-all" style={{ width: `${pct}%` }} /></div>
            <span className="font-mono text-[11px] text-mute">{doneCount}/{STEPS.length}</span>
          </div>
        </div>

        <div className="flex-1 space-y-2 overflow-y-auto px-6 py-4">
          {STEPS.map((s) => {
            const isDone = !!done[s.id];
            return (
              <div key={s.id} className={`flex items-start gap-3 rounded-[10px] border px-4 py-3 ${isDone ? 'border-line bg-surface-2' : 'border-line bg-surface'}`}>
                <span className={`mt-0.5 grid h-7 w-7 shrink-0 place-items-center rounded-full border ${isDone ? 'border-auto text-auto' : 'border-line text-mute'}`}>{isDone ? <Check size={15} /> : s.icon}</span>
                <div className="min-w-0 flex-1">
                  <div className="text-sm font-medium text-text">{s.title}</div>
                  <div className="mt-0.5 text-xs leading-relaxed text-mute">{s.desc}</div>
                </div>
                {isDone ? (
                  <span className="mt-1 shrink-0 text-[11px] text-auto">{s.autoDone ? 'ready' : 'connected'}</span>
                ) : (
                  <button onClick={() => setDone((d) => ({ ...d, [s.id]: true }))} className="mt-0.5 shrink-0 rounded-md bg-accent px-2.5 py-1 text-xs font-medium text-white hover:opacity-90">{s.cta}</button>
                )}
              </div>
            );
          })}
        </div>

        <div className="border-t border-line px-6 py-4">
          <div className="mb-3 flex items-start gap-2 rounded-[10px] border border-accent bg-accent-bg px-3 py-2 text-[11px] text-accent">
            <Network size={14} className="mt-0.5 shrink-0" />
            <span>Even with zero order history, SCALE works from day one — its courier scorecards are pooled across hundreds of D2C brands. You inherit the network’s intelligence on your first order.</span>
          </div>
          <div className="flex items-center justify-between">
            <button onClick={complete} className="text-xs text-mute hover:text-dim">Explore the demo →</button>
            <button onClick={complete} className={`flex items-center gap-1.5 rounded-md px-4 py-2 text-sm font-medium ${allDone ? 'bg-accent text-white hover:opacity-90' : 'border border-line bg-surface-2 text-dim hover:border-line-strong'}`}>{allDone ? 'Go live' : 'Go live anyway'} <ArrowRight size={15} /></button>
          </div>
        </div>
      </div>
    </div>
  );
}
