import { MedusaService } from '@medusajs/framework/utils';
import { Decision } from './models/decision';
import { LedgerEntry } from './models/ledger-entry';
import { CourierScorecard } from './models/courier-scorecard';

// MedusaService auto-generates typed CRUD (createDecisions, listDecisions, retrieveDecision, …) for
// each model. We extend it only when a method needs more than CRUD.
class MagpieModuleService extends MedusaService({
  Decision,
  LedgerEntry,
  CourierScorecard,
}) {}

export default MagpieModuleService;
