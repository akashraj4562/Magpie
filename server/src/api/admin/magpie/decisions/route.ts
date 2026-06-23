import type { MedusaRequest, MedusaResponse } from '@medusajs/framework/http';
import { MAGPIE_MODULE } from '../../../../modules/magpie';
import type MagpieModuleService from '../../../../modules/magpie/service';

// GET /admin/magpie/decisions — the queue the founder cockpit reads. Newest first; the review-first
// drawer in the Vite app will fetch a single decision's `payload` for its evidence.
export async function GET(req: MedusaRequest, res: MedusaResponse) {
  const magpie: MagpieModuleService = req.scope.resolve(MAGPIE_MODULE);
  const decisions = await magpie.listDecisions({}, { take: 50, order: { created_at: 'DESC' } });
  res.json({ count: decisions.length, decisions });
}
