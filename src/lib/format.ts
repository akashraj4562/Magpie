import { DEMO_NOW } from './util';

// ₹ with lakh/crore grouping, from integer paise.
export function formatINR(paise: number, opts?: { compact?: boolean }): string {
  const r = paise / 100;
  const sign = r < 0 ? '-' : '';
  const a = Math.abs(r);
  if (opts?.compact) {
    if (a >= 1e7) return `${sign}₹${(a / 1e7).toFixed(2)}Cr`;
    if (a >= 1e5) return `${sign}₹${(a / 1e5).toFixed(2)}L`;
    if (a >= 1e3) return `${sign}₹${(a / 1e3).toFixed(1)}k`;
  }
  return `${sign}₹${a.toLocaleString('en-IN', { maximumFractionDigits: 0 })}`;
}

export function relTimeIST(iso: string, now = DEMO_NOW): string {
  const mins = Math.round((new Date(now).getTime() - new Date(iso).getTime()) / 60000);
  if (mins < 60) return `${Math.max(1, mins)}m ago`;
  if (mins < 1440) return `${Math.round(mins / 60)}h ago`;
  return `${Math.round(mins / 1440)}d ago`;
}

export function formatIST(iso: string): string {
  return new Date(iso).toLocaleDateString('en-IN', { day: '2-digit', month: 'short', timeZone: 'Asia/Kolkata' });
}
