import type { LedgerEntry } from '../types';

// Predicted-vs-actual precision (the differentiator: every decision is proven).
export function precisionPct(predicted: number, actual: number): number {
  if (predicted === 0) return 100;
  const err = Math.abs(actual - predicted) / Math.abs(predicted);
  return Math.max(0, Math.round((1 - err) * 100));
}

export function ledgerStats(entries: LedgerEntry[]): { count: number; recoveredPaise: number; precisionPct: number } {
  if (entries.length === 0) return { count: 0, recoveredPaise: 0, precisionPct: 0 };
  const recovered = entries.reduce((a, e) => a + e.actualPaise, 0);
  const precision = Math.round(entries.reduce((a, e) => a + e.precisionPct, 0) / entries.length);
  return { count: entries.length, recoveredPaise: recovered, precisionPct: precision };
}
