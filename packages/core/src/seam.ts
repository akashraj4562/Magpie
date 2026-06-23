import type { Channel, Decision, DecisionOption, Order, PaymentMode, Sensitivity, ZoneClass } from './types';
import { recommendCourier } from './lib/courier';
import { buildDecision } from './lib/buildDecision';
import { formatINR } from './lib/format';

// The Medusa↔Magpie adapter seam (ADR-001 — the review's #1 artifact). Medusa owns commerce
// (Order/LineItem/Inventory); Magpie's decision-core owns decisions. This thin, one-directional
// command bus maps a Medusa order into the core's Order shape and produces governed Decisions — so the
// engines NEVER couple to Medusa internals (swap Medusa later without touching the decision layer).

// The minimal subset of a Medusa order the seam reads (the subscriber passes this).
export type MedusaOrderLike = {
  id: string;
  sales_channel_id?: string;
  metadata?: { cod?: boolean };
  items: { variant_sku?: string; title: string; quantity: number; unit_price: number; metadata?: { cogs?: number; weight_grams?: number; sensitivity?: Sensitivity; category?: string } }[];
  shipping_address?: { postal_code?: string; city?: string };
};

const METRO = ['11', '40', '56', '60', '70', '50'];
function zoneFor(pin?: string): ZoneClass {
  if (!pin) return 'tier2';
  if (METRO.includes(pin.slice(0, 2))) return 'metro';
  return [...pin].reduce((a, c) => a + c.charCodeAt(0), 0) % 2 === 0 ? 'tier2' : 'tier3';
}
const channelOf = (id?: string): Channel => (id === 'amazon' ? 'amazon' : id === 'flipkart' ? 'flipkart' : 'own_store');

// Map a Medusa order → the core's Order (first line item; a fuller impl maps per shipment).
export function adaptOrder(m: MedusaOrderLike): Order {
  const it = m.items[0]!;
  const payment: PaymentMode = m.metadata?.cod ? 'COD' : 'PREPAID';
  return {
    orderId: m.id, channel: channelOf(m.sales_channel_id), sku: it.variant_sku ?? 'SKU-?', title: it.title,
    category: it.metadata?.category ?? 'General', qty: it.quantity, sellingPricePaise: Math.round(it.unit_price),
    cogsPaise: it.metadata?.cogs ?? Math.round(it.unit_price * 0.45), weightGrams: it.metadata?.weight_grams ?? 400,
    state: 'NEW', paymentMode: payment, sensitivity: it.metadata?.sensitivity ?? 'standard',
    customerMasked: 'Customer', pincode: m.shipping_address?.postal_code ?? '560001', city: m.shipping_address?.city ?? '—',
    zoneClass: zoneFor(m.shipping_address?.postal_code), placedAt: new Date().toISOString(),
  };
}

// Produce the governed routing Decision (the Logistics/SCALE agent) for an order. The subscriber
// persists it; the gates decide whether it auto-assigns or routes to a human.
export function produceRoutingDecision(order: Order): Decision {
  const reco = recommendCourier(order, false);
  const rec = reco.recommended!; const cheap = reco.cheapest!;
  const same = rec.courier.id === cheap.courier.id;
  const ts = new Date().toISOString();
  const options: DecisionOption[] = [{ optionId: `assign-${rec.courier.id}`, label: `Assign ${rec.courier.name} (score ${rec.score.toFixed(2)})`, confidence: same ? 0.98 : reco.confidence, deltaPaise: reco.savingPaise, reversible: true, lowValue: same, recommended: true }];
  if (!same) options.push({ optionId: `force-${cheap.courier.id}`, label: `Force cheapest (${cheap.courier.name}) — higher RTO`, confidence: 0.41, deltaPaise: -reco.savingPaise, reversible: true });
  return buildDecision({
    agentId: 'routing', domainLabel: 'Logistics / SCALE', title: `Courier for ${order.orderId} (${order.title})`,
    rationale: reco.rationale,
    evidence: [
      { label: `${rec.courier.name} — recommended`, value: `exp. ${formatINR(rec.expected, { compact: true })}`, provenance: { basis: 'measured', source: 'scale-pool', asOf: ts } },
      { label: `${cheap.courier.name} — naive cheapest`, value: `exp. ${formatINR(cheap.expected, { compact: true })}`, provenance: { basis: 'measured', source: 'scale-pool', asOf: ts } },
      { label: 'Expected RTO-loss avoided', value: formatINR(reco.savingPaise, { compact: true }), provenance: { basis: 'projected', confidence: 0.8, source: 'scale', asOf: ts } },
    ],
    options, recommendedOptionId: options[0]!.optionId, writeBackTarget: 'courier-api', orderId: order.orderId, channel: order.channel, sku: order.sku,
  });
}
