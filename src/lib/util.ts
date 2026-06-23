export const DEMO_NOW = '2026-06-23T21:30:00+05:30';

export function mulberry32(seed: number): () => number {
  let a = seed >>> 0;
  return function () {
    a |= 0; a = (a + 0x6d2b79f5) | 0;
    let t = Math.imul(a ^ (a >>> 15), 1 | a);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}
export const clamp01 = (n: number) => Math.max(0, Math.min(1, n));
export const pick = <T,>(rng: () => number, arr: readonly T[]): T => arr[Math.floor(rng() * arr.length)] as T;
export const randInt = (rng: () => number, min: number, max: number) => Math.floor(rng() * (max - min + 1)) + min;
export const pad = (prefix: string, n: number) => `${prefix}-${String(n).padStart(4, '0')}`;
export const minutesBefore = (baseISO: string, m: number) => new Date(new Date(baseISO).getTime() - m * 60000).toISOString();
export const daysBefore = (baseISO: string, d: number) => minutesBefore(baseISO, d * 24 * 60);
