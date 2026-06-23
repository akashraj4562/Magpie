import type { SubscriberArgs, SubscriberConfig } from '@medusajs/framework';
import { Modules } from '@medusajs/framework/utils';
import { adaptOrder, produceRoutingDecision, type MedusaOrderLike } from '@magpie/core';
import { MAGPIE_MODULE } from '../modules/magpie';
import type MagpieModuleService from '../modules/magpie/service';

// THE SEAM, live. Medusa emits order.placed → we load the order, hand it to @magpie/core through the
// adapter (adaptOrder), let the decision-core decide (produceRoutingDecision), and persist the result.
// Nothing about courier scoring or landed-margin lives here — this file is plumbing, not policy.
export default async function orderPlacedHandler({ event: { data }, container }: SubscriberArgs<{ id: string }>) {
  const orderModule = container.resolve(Modules.ORDER);
  const magpie: MagpieModuleService = container.resolve(MAGPIE_MODULE);

  const order = await orderModule.retrieveOrder(data.id, {
    relations: ['items', 'shipping_address'],
  });

  // Medusa's Order is structurally close to the seam's MedusaOrderLike; the seam owns the contract, so
  // the cast is the only Medusa-shaped line in the whole decision path.
  const core = adaptOrder(order as unknown as MedusaOrderLike);
  const decision = produceRoutingDecision(core);

  await magpie.createDecisions({
    order_id: decision.orderId,
    agent_id: decision.agentId,
    domain_label: decision.domainLabel,
    title: decision.title,
    rationale: decision.rationale,
    routing_tier: decision.routingTier,
    status: decision.status,
    confidence: decision.confidence,
    delta_paise: decision.deltaPaise ?? 0,
    channel: decision.channel ?? null,
    sku: decision.sku ?? null,
    payload: decision as unknown as Record<string, unknown>,
  });
}

export const config: SubscriberConfig = {
  event: 'order.placed',
};
