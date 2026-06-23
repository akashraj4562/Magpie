import { useState } from 'react';
import { Check, Plug } from 'lucide-react';
import { BRAND } from '../config';
import { useStore } from '../store/useStore';
import { PageHeader, Tag } from '../components/primitives';

const INTEGRATIONS = [
  ['Razorpay', 'payments', true], ['Shiprocket', 'shipping', true], ['GST e-invoicing', 'tax', false],
  ['Amazon SP-API', 'marketplace', false], ['Flipkart', 'marketplace', false], ['WhatsApp (Gupshup)', 'messaging', false],
] as const;

export function Settings() {
  const [w, setW] = useState({ cost: 40, sla: 35, rto: 25 });
  const reset = useStore((s) => s.resetOnboarding);
  return (
    <div>
      <PageHeader title="Settings" sub="Brand-agnostic config — swap these and the whole app is your store. Plus the SCALE routing rules and integrations." right={<Tag tone="accent">Config</Tag>} />
      <div className="grid grid-cols-2 gap-6">
        <div className="space-y-4">
          <div className="rounded-[10px] border border-line bg-surface p-4">
            <div className="mb-2 text-sm font-medium text-text">Brand config</div>
            {[['Brand name', BRAND.name], ['Tagline', BRAND.tagline], ['Domain', BRAND.domain], ['Currency', BRAND.currency], ['Locale', BRAND.locale]].map(([k, v]) => (
              <div key={k} className="flex items-center justify-between border-b border-line py-1.5 text-xs last:border-0"><span className="text-mute">{k}</span><span className="font-mono text-dim">{v}</span></div>
            ))}
            <div className="mt-2 text-[11px] text-mute">Everything brand-specific lives in <code className="text-dim">src/config.ts</code> — nothing is hardcoded.</div>
            <button onClick={reset} className="mt-2 text-[11px] text-accent hover:underline">Restart onboarding</button>
          </div>
          <div className="rounded-[10px] border border-line bg-surface p-4">
            <div className="mb-2 text-sm font-medium text-text">SCALE routing preference</div>
            {(['cost', 'sla', 'rto'] as const).map((k) => (
              <label key={k} className="mb-2 block">
                <div className="flex justify-between text-[11px] text-mute"><span className="uppercase">{k}</span><span className="font-mono text-dim">{w[k]}%</span></div>
                <input type="range" min={0} max={100} value={w[k]} onChange={(e) => setW((s) => ({ ...s, [k]: Number(e.target.value) }))} className="w-full accent-accent" />
              </label>
            ))}
            <div className="mt-1 text-[11px] text-mute">Whitelisted: Bluedart, Delhivery. A hard courier ban is a one-way door → review.</div>
          </div>
        </div>
        <div>
          <div className="mb-2 text-sm font-medium text-text">Integrations</div>
          <div className="space-y-2">
            {INTEGRATIONS.map(([name, kind, on]) => (
              <div key={name} className="flex items-center justify-between rounded-[10px] border border-line bg-surface px-4 py-2.5 text-sm">
                <span className="flex items-center gap-2 text-dim"><Plug size={13} className="text-mute" /> {name} <span className="text-[11px] text-mute">{kind}</span></span>
                {on ? <span className="flex items-center gap-1 text-xs text-auto"><Check size={12} /> connected</span> : <button className="rounded-md border border-line bg-surface-2 px-2.5 py-1 text-xs text-dim hover:border-line-strong">Connect</button>}
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
