import { model } from '@medusajs/framework/utils';

// The predicted-vs-actual ledger — every decision writes a prediction here; reconciliation fills
// `actual_paise` once the outcome (delivery / RTO / return) is known. This is what makes the loop
// honest: precision is measured, not asserted.
export const LedgerEntry = model.define('ledger_entry', {
  id: model.id().primaryKey(),
  decision_id: model.text(),
  order_id: model.text().nullable(),
  metric: model.text(),
  predicted_paise: model.number(),
  actual_paise: model.number().nullable(),
  resolved: model.boolean().default(false),
});
