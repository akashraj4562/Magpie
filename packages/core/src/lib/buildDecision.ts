import type { AgentId, Channel, Decision, DecisionOption, Evidence, GuardrailFlag } from '../types';
import { initialStatus, routeTier } from './routeDecision';
import { DEMO_NOW } from './util';

let n = 0;

// Runtime decision factory — a surface proposes a decision into the review-first drawer, governed
// identically to a seeded one.
export function buildDecision(p: {
  agentId: AgentId; domainLabel: string; title: string; rationale: string;
  evidence: Evidence[]; options: DecisionOption[]; recommendedOptionId: string;
  writeBackTarget: string; guardrails?: GuardrailFlag[]; channel?: Channel; orderId?: string; sku?: string;
}): Decision {
  const rec = p.options.find((o) => o.optionId === p.recommendedOptionId) ?? p.options[0]!;
  const guardrails = p.guardrails ?? [];
  const tier = routeTier(rec, guardrails);
  const status = initialStatus(tier);
  n += 1;
  return {
    decisionId: `DC-NEW-${n}`, agentId: p.agentId, domainLabel: p.domainLabel,
    title: p.title, rationale: p.rationale, createdAt: DEMO_NOW,
    options: p.options, recommendedOptionId: rec.optionId, confidence: rec.confidence, deltaPaise: rec.deltaPaise,
    evidence: p.evidence, guardrails, reversibility: rec.reversible === false ? 'one_way' : 'reversible',
    routingTier: tier, status, writeBackTarget: p.writeBackTarget,
    writeBackStatus: status === 'AUTO_EXECUTED' ? 'written' : 'pending',
    channel: p.channel, orderId: p.orderId, sku: p.sku,
  };
}
