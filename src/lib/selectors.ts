import type { Decision, Order } from '../types';
import { DEMO_NOW } from './util';

// The single North-Star for a D2C brand: Order-Fulfilment Rate (the Perfect-Order family — Amazon ODR,
// Shopify/Flipkart scorecards). Delivered-as-promised / accepted.
export function ofrFor(orders: Order[]): { ofrPct: number; delivered: number; completed: number } {
  const completed = orders.filter((o) => o.state === 'DELIVERED' || o.state === 'RTO' || o.state === 'RETURNED');
  const delivered = completed.filter((o) => o.state === 'DELIVERED');
  return { ofrPct: completed.length ? Math.round((delivered.length / completed.length) * 1000) / 10 : 100, delivered: delivered.length, completed: completed.length };
}

// RTO rate — the cost line a growth-stage D2C brand feels most.
export function rtoRate(orders: Order[]): number {
  const shipped = orders.filter((o) => ['SHIPPED', 'OUT_FOR_DELIVERY', 'DELIVERED', 'NDR', 'RTO'].includes(o.state));
  const rto = orders.filter((o) => o.state === 'RTO');
  return shipped.length ? Math.round((rto.length / shipped.length) * 1000) / 10 : 0;
}

const DAY = 24 * 60 * 60 * 1000;
export const isToday = (d: Decision) => new Date(DEMO_NOW).getTime() - new Date(d.createdAt).getTime() < DAY;
const isNeedYou = (d: Decision) => (d.routingTier === 'REVIEW' || d.routingTier === 'ESCALATE') && (d.status === 'PENDING' || d.status === 'ESCALATED');

export function todayCounts(decisions: Decision[]): { total: number; auto: number; oneTap: number; needYou: number; clusters: number } {
  const t = decisions.filter(isToday);
  const auto = t.filter((d) => d.routingTier === 'AUTO').length;
  const oneTap = t.filter((d) => d.routingTier === 'ONE_TAP').length;
  const needYou = t.filter(isNeedYou).length;
  return { total: t.length, auto, oneTap, needYou, clusters: Math.max(1, Math.round(oneTap / 5)) };
}
export const needYouDecisions = (decisions: Decision[]) => decisions.filter((d) => isToday(d) && isNeedYou(d));
export function trustedAutomationRate(decisions: Decision[]): number {
  const c = todayCounts(decisions);
  return c.total ? Math.round(((c.auto + c.oneTap) / c.total) * 100) : 0;
}
