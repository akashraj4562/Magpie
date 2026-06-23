import type { DecisionOption, DecisionStatus, GuardrailFlag, RoutingTier } from '../types';

// Confidence gates (the doctrine). One-way doors + person-impacting / above-cap / policy-violating
// always route to a human regardless of confidence — checked FIRST.
export const GATES = { AUTO: 0.97, ONE_TAP: 0.9, REVIEW: 0.75 };
const FORCE_HUMAN: GuardrailFlag[] = ['one_way', 'above_cap', 'person_impacting', 'policy_violating'];

export function routeTier(opt: DecisionOption, guardrails: GuardrailFlag[]): RoutingTier {
  if (opt.reversible === false || guardrails.some((g) => FORCE_HUMAN.includes(g))) {
    return opt.confidence >= GATES.REVIEW ? 'REVIEW' : 'ESCALATE';
  }
  if (opt.confidence >= GATES.AUTO && opt.lowValue) return 'AUTO';
  if (opt.confidence >= GATES.ONE_TAP) return 'ONE_TAP';
  if (opt.confidence >= GATES.REVIEW) return 'REVIEW';
  return 'ESCALATE';
}

export function initialStatus(tier: RoutingTier): DecisionStatus {
  return tier === 'AUTO' ? 'AUTO_EXECUTED' : tier === 'ESCALATE' ? 'ESCALATED' : 'PENDING';
}
