import { model } from '@medusajs/framework/utils';

// A tenant's slice of courier performance, keyed by lane × payment × zone. These aggregates are what
// get anonymized and contributed to the cross-tenant SCALE pool (ADR-003) — and the pool's priors are
// what let a brand on day one route as if it had months of its own data. The moat.
export const CourierScorecard = model.define('courier_scorecard', {
  id: model.id().primaryKey(),
  courier_id: model.text(),
  lane: model.text(),
  payment_mode: model.text(),
  zone_class: model.text(),
  shipments: model.number().default(0),
  delivered: model.number().default(0),
  rto: model.number().default(0),
  avg_sla_days: model.float().nullable(),
});
