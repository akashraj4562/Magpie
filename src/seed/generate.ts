import type {
  AgentId, Channel, Decision, DecisionOption, Evidence, GuardrailFlag, LedgerEntry,
  Order, OrderState, Product, Sensitivity, ZoneClass,
} from '../types';
import { CATEGORIES } from '../lib/rateCard';
import { recommendCourier } from '../lib/courier';
import { precisionPct } from '../lib/ledger';
import { initialStatus, routeTier } from '../lib/routeDecision';
import { DEMO_NOW, minutesBefore, daysBefore, mulberry32, pad, pick, randInt } from '../lib/util';
import { formatINR } from '../lib/format';

export type World = { products: Product[]; orders: Order[]; decisions: Decision[]; ledger: LedgerEntry[] };

const TITLES: Record<string, string[]> = {
  Skincare: ['Vitamin C Serum', 'Niacinamide 10%', 'Hyaluronic Moisturiser', 'SPF50 Sunscreen', 'Retinol Night Cream'],
  Haircare: ['Onion Hair Oil', 'Anti-Dandruff Shampoo', 'Argan Hair Mask', 'Biotin Conditioner'],
  Supplements: ['Daily Multivitamin', 'Plant Protein 1kg', 'Biotin Gummies', 'Omega-3'],
  Wellness: ['Sleep Gummies', 'Ashwagandha 60ct', 'Daily Probiotic'],
  Fragrance: ['Eau de Parfum 50ml', 'Body Mist', 'Roll-on Attar'],
  'Baby Care': ['Baby Lotion', 'Baby Wipes 72ct', 'Diaper Rash Cream'],
};
const PINS: { pin: string; city: string; zone: ZoneClass }[] = [
  { pin: '560001', city: 'Bengaluru', zone: 'metro' }, { pin: '400053', city: 'Mumbai', zone: 'metro' },
  { pin: '110024', city: 'New Delhi', zone: 'metro' }, { pin: '600028', city: 'Chennai', zone: 'metro' },
  { pin: '395007', city: 'Surat', zone: 'tier2' }, { pin: '440010', city: 'Nagpur', zone: 'tier2' },
  { pin: '305001', city: 'Ajmer', zone: 'tier2' }, { pin: '781035', city: 'Guwahati', zone: 'tier3' },
  { pin: '845401', city: 'Bettiah', zone: 'tier3' }, { pin: '263139', city: 'Nainital', zone: 'tier3' },
];
const NAMES = ['Rahul S.', 'Priya M.', 'Aisha K.', 'Vikram R.', 'Neha T.', 'Arjun P.', 'Sneha D.', 'Karan V.', 'Divya N.', 'Rohit G.'];
const CHANNEL_BAG: Channel[] = ['own_store', 'own_store', 'own_store', 'own_store', 'own_store', 'amazon', 'amazon', 'flipkart'];
const STATE_W: [OrderState, number][] = [['DELIVERED', 60], ['SHIPPED', 8], ['OUT_FOR_DELIVERY', 6], ['CONFIRMED', 8], ['NEW', 6], ['PACKED', 5], ['NDR', 4], ['RTO', 5], ['CANCELLED', 4], ['RETURNED', 3]];
const STATE_BAG: OrderState[] = STATE_W.flatMap(([s, w]) => Array<OrderState>(w).fill(s));

let DEC = 0;
const DOMAIN: Record<AgentId, string> = { routing: 'Logistics / SCALE', pricing: 'Pricing', inventory: 'Inventory', fulfilment: 'Fulfilment', finance: 'Finance', cx: 'Customer', marketing: 'Marketing / Ads' };
const ev = (label: string, value: string, basis: 'measured' | 'projected' | 'derived', confidence?: number): Evidence => ({ label, value, provenance: { basis, confidence, source: basis, asOf: DEMO_NOW } });

function mk(p: { agentId: AgentId; title: string; rationale: string; conf: number; delta: number; reversible?: boolean; lowValue?: boolean; guardrails?: GuardrailFlag[]; evidence?: Evidence[]; createdAt?: string; status?: Decision['status']; channel?: Channel; orderId?: string; sku?: string; options?: DecisionOption[]; writeBackTarget?: string }): Decision {
  DEC += 1;
  const reversible = p.reversible ?? true;
  const lowValue = p.lowValue ?? Math.abs(p.delta) < 150000;
  const options = p.options ?? [{ optionId: 'opt-a', label: p.title, confidence: p.conf, deltaPaise: p.delta, reversible, lowValue, recommended: true }];
  const rec = options.find((o) => o.recommended) ?? options[0]!;
  const guardrails = p.guardrails ?? [];
  const tier = p.status === 'APPROVED' ? 'REVIEW' : routeTier(rec, guardrails);
  const status = p.status ?? initialStatus(tier);
  return {
    decisionId: pad('DC', DEC), agentId: p.agentId, domainLabel: DOMAIN[p.agentId],
    title: p.title, rationale: p.rationale, createdAt: p.createdAt ?? minutesBefore(DEMO_NOW, randInt(mulberry32(DEC * 7 + 1), 30, 600)),
    options, recommendedOptionId: rec.optionId, confidence: rec.confidence, deltaPaise: rec.deltaPaise,
    evidence: p.evidence ?? [], guardrails, reversibility: reversible ? 'reversible' : 'one_way',
    routingTier: tier, status, writeBackTarget: p.writeBackTarget ?? DOMAIN[p.agentId],
    writeBackStatus: status === 'AUTO_EXECUTED' || status === 'APPROVED' ? 'written' : 'pending',
    channel: p.channel, orderId: p.orderId, sku: p.sku,
  };
}

const AUTO_TEMPLATES = [
  (o: Order) => `Auto-routed ${o.orderId} via ${o.courierId} — best-scored on the lane`,
  () => 'Auto-reattempted an NDR with a corrected address',
  (o: Order) => `Auto-restocked ${o.title} within cap`,
  () => 'Paused a wasteful ad keyword (ACoS > target)',
  () => 'Auto-answered a templated support reply',
  () => 'Auto-matched a clean settlement line',
];

export function generateWorld(seed = 7): World {
  DEC = 0;
  const rng = mulberry32(seed);

  // --- products ---
  const products: Product[] = [];
  let sk = 0;
  for (const cat of CATEGORIES) {
    for (const title of TITLES[cat]!) {
      sk += 1;
      const price = randInt(rng, 30000, 180000);
      const cogs = Math.round(price * (0.3 + rng() * 0.2));
      const sensitivity: Sensitivity = cat === 'Fragrance' ? 'fragile' : rng() > 0.88 ? 'high_value' : 'standard';
      const ch: Channel[] = rng() > 0.5 ? ['own_store', 'amazon', 'flipkart'] : rng() > 0.4 ? ['own_store', 'amazon'] : ['own_store'];
      products.push({
        sku: pad('SKU', sk), title, category: cat, pricePaise: price, cogsPaise: cogs, mrpPaise: Math.round(price * 1.3),
        stock: randInt(rng, 0, 400), reserved: randInt(rng, 0, 12), weightGrams: randInt(rng, 120, 900),
        channels: ch, sensitivity, status: sk % 9 === 4 ? 'draft' : 'active', returnRate: randInt(rng, 4, 16) / 100,
      });
    }
  }
  const active = products.filter((p) => p.status === 'active');

  // --- orders ---
  const orders: Order[] = [];
  for (let i = 0; i < 140; i++) {
    const p = pick(rng, active);
    const channel = pick(rng, CHANNEL_BAG);
    const state = pick(rng, STATE_BAG);
    const where = pick(rng, PINS);
    const shipped = !['NEW', 'CONFIRMED', 'PACKED', 'CANCELLED'].includes(state);
    const o: Order = {
      orderId: pad('OD', i + 1), channel, sku: p.sku, title: p.title, category: p.category, qty: randInt(rng, 1, 2),
      sellingPricePaise: p.pricePaise, cogsPaise: p.cogsPaise, weightGrams: p.weightGrams, state,
      paymentMode: rng() > 0.4 ? 'COD' : 'PREPAID', sensitivity: p.sensitivity, customerMasked: pick(rng, NAMES),
      pincode: where.pin, city: where.city, zoneClass: where.zone, placedAt: minutesBefore(DEMO_NOW, randInt(rng, 30, 60 * 24 * 60)),
    };
    if (shipped) { o.courierId = recommendCourier(o).recommended?.courier.id ?? 'delhivery'; o.awb = `AWB${randInt(rng, 100000, 999999)}`; }
    orders.push(o);
  }

  // --- decisions ---
  const decisions: Decision[] = [];
  const heroOrder = orders.find((o) => o.paymentMode === 'COD' && o.zoneClass !== 'metro' && o.courierId) ?? orders[0]!;
  const reco = recommendCourier(heroOrder, true);
  const rec = reco.recommended; const cheap = reco.cheapest;
  if (rec && cheap) {
    decisions.push(mk({
      agentId: 'routing', orderId: heroOrder.orderId, channel: heroOrder.channel, sku: heroOrder.sku,
      title: `Reroute COD ${heroOrder.orderId} via ${rec.courier.name}, not ${cheap.courier.name}`,
      rationale: reco.rationale, conf: 0.86, delta: reco.savingPaise, reversible: true, lowValue: false,
      evidence: [ev(`${rec.courier.name} — recommended`, `score ${rec.score.toFixed(2)} · exp. ${formatINR(rec.expected, { compact: true })}`, 'measured'), ev(`${cheap.courier.name} — cheapest freight`, `score ${cheap.score.toFixed(2)} · exp. ${formatINR(cheap.expected, { compact: true })}`, 'measured'), ev('Expected RTO-loss avoided', formatINR(reco.savingPaise, { compact: true }), 'projected', 0.8)],
      writeBackTarget: 'Courier / NDR-RTO',
    }));
  }
  decisions.push(mk({ agentId: 'pricing', sku: active[0]!.sku, title: `"${active[0]!.title}" loses money after shipping on Flipkart — raise ₹40 or drop the channel`, rationale: 'After commission + shipping + GST + CAC, the landed margin on this SKU/channel is negative. A small price lift or dropping the channel restores it.', conf: 0.82, delta: 180000, lowValue: false, evidence: [ev('Landed margin (Flipkart)', '-3%', 'measured'), ev('Own-store margin', '+19%', 'measured')] }));
  decisions.push(mk({ agentId: 'inventory', sku: active[2]!.sku, title: `Reorder 600 of "${active[2]!.title}" — 8 days of cover`, rationale: 'Fast-mover below the reorder point; the order exceeds the auto-restock cap, so it routes to you.', conf: 0.88, delta: 0, lowValue: false, guardrails: ['above_cap'], evidence: [ev('Days of cover', '8', 'measured'), ev('30-day forecast', '540 units', 'projected', 0.86)] }));
  decisions.push(mk({ agentId: 'marketing', title: 'Shift ₹3k/day from a 0.8x-ROAS campaign to your 3.2x performer', rationale: 'One campaign is below break-even ROAS while another scales profitably; a budget shift lifts attributed sales. Budget moves route to review.', conf: 0.83, delta: 250000, lowValue: false, evidence: [ev('Wasteful ROAS', '0.8x', 'measured'), ev('Target ROAS', '3.2x', 'measured')] }));
  decisions.push(mk({ agentId: 'finance', title: 'Delcon COD remittance is T+12 — ₹1.4L cash blocked; move COD to Delhivery (T+4)', rationale: 'A slow-remitting courier is tying up working capital on every COD order. Switching COD to a faster-remitting courier frees cash. A courier switch is a one-way door — review.', conf: 0.8, delta: 140000, reversible: false, lowValue: false, guardrails: ['one_way'], evidence: [ev('Cash blocked', '₹1.4L', 'measured'), ev('Remittance lag', 'T+12 vs T+4', 'measured')] }));
  decisions.push(mk({ agentId: 'cx', title: 'Respond to a 1-star review citing a late delivery (SCALE flagged the lane)', rationale: 'A critical review tied to a delayed shipment on a known-weak lane. Responding protects the brand; person-impacting, so it needs you.', conf: 0.78, delta: 0, guardrails: ['person_impacting'], evidence: [ev('Rating', '1★', 'measured'), ev('Lane', 'metro → tier-3 (delayed)', 'measured')] }));

  // one-tap + bulk auto
  for (let i = 0; i < 8; i++) {
    const p = pick(rng, active);
    decisions.push(mk({ agentId: pick(rng, ['marketing', 'inventory', 'pricing'] as AgentId[]), sku: p.sku, title: `1-tap: ${pick(rng, ['nudge price to hold the buy-box on', 'opt into a weekend sale —', 'top up safety stock for'])} ${p.title}`, rationale: 'High confidence; grouped for a single tap.', conf: 0.9 + rng() * 0.06, delta: randInt(rng, 300, 2500) * 100, lowValue: false }));
  }
  for (let i = 0; i < 66; i++) {
    const o = pick(rng, orders.filter((x) => x.courierId));
    const tpl = pick(rng, AUTO_TEMPLATES);
    decisions.push(mk({ agentId: pick(rng, ['routing', 'fulfilment', 'inventory', 'cx', 'finance', 'marketing'] as AgentId[]), title: tpl(o), rationale: 'Small, reversible, high-confidence — auto-executed and written back.', conf: 0.97 + rng() * 0.025, delta: randInt(rng, 40, 1400) * 100, reversible: true, lowValue: true, orderId: o.orderId }));
  }

  // --- ledger (historical predicted-vs-actual) ---
  const ledger: LedgerEntry[] = [];
  const NOISE: Partial<Record<AgentId, number>> = { routing: 0.08, pricing: 0.12, marketing: 0.18 };
  for (let i = 0; i < 32; i++) {
    const agentId = pick(rng, ['routing', 'pricing', 'inventory', 'finance', 'marketing'] as AgentId[]);
    const predicted = randInt(rng, 4000, 26000) * 100;
    const actual = Math.round(predicted * (1 + (rng() * 2 - 1) * (NOISE[agentId] ?? 0.1)));
    const closedAt = daysBefore(DEMO_NOW, randInt(rng, 2, 28));
    const d = mk({ agentId, title: `${DOMAIN[agentId]} action — closed`, rationale: 'Resolved; outcome recorded in the ledger.', conf: 0.9 + rng() * 0.08, delta: predicted, status: 'APPROVED', createdAt: closedAt });
    d.resolvedAt = closedAt; d.resolvedBy = 'Founder';
    const entry: LedgerEntry = { ledgerEntryId: pad('LG', i + 1), decisionId: d.decisionId, agentId, metric: agentId === 'routing' ? 'RTO cost avoided' : agentId === 'pricing' ? 'Margin protected' : 'Cost recovered', predictedPaise: predicted, actualPaise: actual, precisionPct: precisionPct(predicted, actual), closedAt };
    d.ledgerEntryId = entry.ledgerEntryId;
    decisions.push(d); ledger.push(entry);
  }

  return { products, orders, decisions, ledger };
}
