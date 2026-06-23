import { adaptOrder, produceRoutingDecision, type MedusaOrderLike } from './seam';

// Proves the adapter seam end-to-end WITHOUT Medusa/Postgres: a fake Medusa `order.placed` payload →
// adaptOrder → produceRoutingDecision → a governed Decision. Run: `npm run demo` in packages/core.
const medusaOrder: MedusaOrderLike = {
  id: 'order_01HQZX', sales_channel_id: 'own_store', metadata: { cod: true },
  items: [{ variant_sku: 'SKU-0007', title: 'Onion Hair Oil', quantity: 1, unit_price: 49900, metadata: { cogs: 18000, weight_grams: 250, category: 'Haircare' } }],
  shipping_address: { postal_code: '845401', city: 'Bettiah' },
};

const order = adaptOrder(medusaOrder);
const d = produceRoutingDecision(order);

console.log('— Medusa → Magpie adapter seam —');
console.log(`order      ${order.orderId} · ${order.channel} · ${order.paymentMode} · ${order.zoneClass} · ${order.city}`);
console.log(`decision   ${d.title}`);
console.log(`tier       ${d.routingTier}   confidence ${Math.round(d.confidence * 100)}%   Δ ${d.deltaPaise} paise`);
console.log(`rationale  ${d.rationale}`);
console.log(`options    ${d.options.map((o) => o.label).join('  |  ')}`);
