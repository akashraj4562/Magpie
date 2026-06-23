import { model } from '@medusajs/framework/utils';

// A governed Decision produced by the decision-core and persisted by the subscriber. The full core
// Decision (evidence, options, provenance) rides in `payload`; the columns are what we query/sort on.
export const Decision = model.define('decision', {
  id: model.id().primaryKey(),
  order_id: model.text(),
  agent_id: model.text(),
  domain_label: model.text(),
  title: model.text(),
  rationale: model.text(),
  routing_tier: model.text(), // auto | one_tap | review | escalate
  status: model.text(), // executed | awaiting_review | escalated ...
  confidence: model.float(),
  delta_paise: model.number().default(0),
  channel: model.text().nullable(),
  sku: model.text().nullable(),
  payload: model.json(),
});
