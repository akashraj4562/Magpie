import type { Courier, CourierPerf, Money, Order, PaymentMode, Sensitivity, ZoneClass } from '../types';
import { clamp01 } from './util';
import { shippingPaise } from './rateCard';
import { trueRtoCostPaise, type LandedInput } from './landedMargin';

// SCALE — the courier-intelligence engine. Deterministic; in production the scorecards are a
// CROSS-TENANT POOL (collective intelligence across hundreds of brands) — the moat that makes
// day-one prediction credible for a brand with thin data.
const P = (onTime: number, rto: number, ndr: number, dmg: number): CourierPerf => ({ onTime, rtoRate: rto, ndrRate: ndr, damageRate: dmg });
export const COURIERS: Courier[] = [
  { id: 'bluedart', name: 'Bluedart', capabilities: ['fragile', 'high_value'], zones: ['metro', 'tier2', 'tier3'], baseFreightMultiplier: 1.25, codRemittanceLagDays: 3, base: P(0.97, 0.05, 0.04, 0.01) },
  { id: 'delhivery', name: 'Delhivery', capabilities: ['fragile', 'high_value'], zones: ['metro', 'tier2', 'tier3'], baseFreightMultiplier: 1.0, codRemittanceLagDays: 4, base: P(0.94, 0.08, 0.06, 0.02) },
  { id: 'ecom', name: 'Ecom Express', capabilities: ['fragile'], zones: ['metro', 'tier2', 'tier3'], baseFreightMultiplier: 0.92, codRemittanceLagDays: 6, base: P(0.91, 0.11, 0.08, 0.03) },
  { id: 'xpressbees', name: 'XpressBees', capabilities: [], zones: ['metro', 'tier2', 'tier3'], baseFreightMultiplier: 0.86, codRemittanceLagDays: 5, base: P(0.89, 0.13, 0.1, 0.04) },
  { id: 'shadowfax', name: 'Shadowfax', capabilities: [], zones: ['metro', 'tier2'], baseFreightMultiplier: 0.82, codRemittanceLagDays: 5, base: P(0.92, 0.12, 0.09, 0.05) },
  { id: 'delcon', name: 'Delcon', capabilities: [], zones: ['metro', 'tier2', 'tier3'], baseFreightMultiplier: 0.74, codRemittanceLagDays: 12, base: P(0.84, 0.19, 0.14, 0.07), penalized: true },
];
export const courier = (id?: string) => COURIERS.find((c) => c.id === id) ?? COURIERS[1]!;

const ZONE_STEP: Record<ZoneClass, number> = { metro: 0, tier2: 1, tier3: 2 };
export function perfFor(c: Courier, zone: ZoneClass, pay: PaymentMode): CourierPerf {
  const s = ZONE_STEP[zone]; const cod = pay === 'COD' ? 1 : 0; const b = c.base;
  return {
    onTime: clamp01(b.onTime - 0.04 * s),
    rtoRate: clamp01(b.rtoRate + 0.045 * s + 0.05 * cod),
    ndrRate: clamp01(b.ndrRate + 0.03 * s + 0.03 * cod),
    damageRate: clamp01(b.damageRate + 0.01 * s),
  };
}

// Score blends only independent quality axes (RTO+NDR fused to avoid double-counting). skuFit and the
// COD-RTO threshold are GATES handled in recommendCourier, not score ingredients.
export function courierScore(c: Courier, zone: ZoneClass, pay: PaymentMode): number {
  const p = perfFor(c, zone, pay);
  const blendedFail = clamp01(p.rtoRate * 0.6 + p.ndrRate * 0.4);
  const score = clamp01(0.5 * p.onTime + 0.3 * (1 - blendedFail) + 0.2 * (1 - p.damageRate));
  return c.penalized ? clamp01(score - 0.12) : score;
}

const ZONE_RTO_BASE: Record<ZoneClass, number> = { metro: 0.12, tier2: 0.18, tier3: 0.26 };
export function codRtoThreshold(zone: ZoneClass, firstTime: boolean): number {
  return Math.max(0.06, Math.min(0.36, ZONE_RTO_BASE[zone] + (firstTime ? -0.04 : 0.03)));
}
const requiredCap = (s: Sensitivity) => (s === 'standard' ? null : s);

function landedInput(o: Order): LandedInput {
  return { channel: o.channel, sellingPricePaise: o.sellingPricePaise, cogsPaise: o.cogsPaise, qty: o.qty, weightGrams: o.weightGrams, zoneClass: o.zoneClass, paymentMode: o.paymentMode, returnRate: 0.1 };
}
export function expectedLandedCost(o: Order, c: Courier): { freight: Money; expected: Money } {
  const freight = Math.round(shippingPaise(o.weightGrams, o.zoneClass) * c.baseFreightMultiplier) * o.qty;
  const perf = perfFor(c, o.zoneClass, o.paymentMode);
  const trueRto = trueRtoCostPaise(landedInput(o), c.codRemittanceLagDays);
  const orderValue = o.sellingPricePaise * o.qty;
  const dmgCost = Math.round(orderValue * (o.sensitivity === 'standard' ? 0.3 : 0.6));
  const expected = freight + Math.round(perf.rtoRate * trueRto) + Math.round(perf.damageRate * dmgCost);
  return { freight, expected };
}

export type Scored = { courier: Courier; score: number; freight: Money; expected: Money };
export type Verdict = 'safe' | 'cheapNotSafe' | 'codBlocked' | 'sensitivityBlocked';
export type Blocked = { id: string; name: string; reason: 'cod' | 'sensitivity' | 'zone' };
export type Reco = { ranked: Scored[]; recommended?: Scored; cheapest?: Scored; blocked: Blocked[]; verdict: Verdict; rationale: string; savingPaise: Money; confidence: number };

export function recommendCourier(o: Order, firstTime = false): Reco {
  const need = requiredCap(o.sensitivity);
  const blocked: Blocked[] = [];
  const eligible: Courier[] = [];
  for (const c of COURIERS) {
    if (!c.zones.includes(o.zoneClass)) { blocked.push({ id: c.id, name: c.name, reason: 'zone' }); continue; }
    if (need && !c.capabilities.includes(need)) { blocked.push({ id: c.id, name: c.name, reason: 'sensitivity' }); continue; }
    if (o.paymentMode === 'COD' && perfFor(c, o.zoneClass, 'COD').rtoRate > codRtoThreshold(o.zoneClass, firstTime)) { blocked.push({ id: c.id, name: c.name, reason: 'cod' }); continue; }
    eligible.push(c);
  }
  const ranked: Scored[] = eligible
    .map((c) => { const cost = expectedLandedCost(o, c); return { courier: c, score: courierScore(c, o.zoneClass, o.paymentMode), freight: cost.freight, expected: cost.expected }; })
    .sort((a, b) => a.expected - b.expected || a.courier.id.localeCompare(b.courier.id));
  const recommended = ranked[0];
  const cheapest = [...ranked].sort((a, b) => a.freight - b.freight || a.courier.id.localeCompare(b.courier.id))[0];
  const codBlocked = blocked.some((b) => b.reason === 'cod');
  let verdict: Verdict = 'safe';
  if (recommended && cheapest && recommended.courier.id !== cheapest.courier.id) verdict = 'cheapNotSafe';
  if (codBlocked) verdict = 'codBlocked';
  else if (!recommended && blocked.some((b) => b.reason === 'sensitivity')) verdict = 'sensitivityBlocked';
  const savingPaise = recommended && cheapest ? Math.max(0, cheapest.expected - recommended.expected) : 0;
  let rationale = recommended ? `Route via ${recommended.courier.name} (score ${recommended.score.toFixed(2)})` : 'No eligible courier — escalate.';
  if (recommended && cheapest && recommended.courier.id !== cheapest.courier.id) {
    const r = perfFor(recommended.courier, o.zoneClass, o.paymentMode); const ch = perfFor(cheapest.courier, o.zoneClass, o.paymentMode);
    rationale += ` not ${cheapest.courier.name} (${cheapest.score.toFixed(2)}) — its RTO on this lane is ${Math.round(ch.rtoRate * 100)}% vs ${Math.round(r.rtoRate * 100)}%; the cheapest freight loses when it risks a broken promise.`;
  }
  return { ranked, recommended, cheapest, blocked, verdict, rationale, savingPaise, confidence: routingConfidence(ranked) };
}

function routingConfidence(ranked: Scored[]): number {
  if (ranked.length === 0) return 0.5;
  const top = ranked[0]!;
  if (ranked.length === 1) return clamp01(0.7 + 0.25 * top.score);
  const gap = ranked[1]!.expected > 0 ? (ranked[1]!.expected - top.expected) / ranked[1]!.expected : 0;
  return clamp01(0.6 + 0.25 * top.score + 0.4 * Math.min(gap, 0.4));
}

// The 3-tier COD gate at checkout (review B7): hard-suppressing COD kills 40-60% of orders, so the
// middle tier (prepaid-nudge) recovers margin without killing conversion.
export type CodTier = 'allow' | 'nudge' | 'suppress';
export function codGate(zone: ZoneClass, firstTime: boolean): { tier: CodTier; bestRtoPct: number; threshold: number } {
  const threshold = codRtoThreshold(zone, firstTime);
  const bestRto = Math.min(...COURIERS.filter((c) => c.zones.includes(zone)).map((c) => perfFor(c, zone, 'COD').rtoRate));
  const tier: CodTier = bestRto <= threshold ? 'allow' : bestRto <= threshold + 0.08 ? 'nudge' : 'suppress';
  return { tier, bestRtoPct: Math.round(bestRto * 100), threshold: Math.round(threshold * 100) };
}
