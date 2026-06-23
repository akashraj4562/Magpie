// Magpie domain — D2C commerce-ops, brand-agnostic. Money is always integer paise.
export type Money = number;
export type Provenance = { basis: 'measured' | 'projected' | 'derived'; confidence?: number; source: string; asOf: string };

// --- D2C domain ---
export type Channel = 'own_store' | 'amazon' | 'flipkart';
export const CHANNELS: Channel[] = ['own_store', 'amazon', 'flipkart'];
export const CHANNEL_LABEL: Record<Channel, string> = { own_store: 'Own store', amazon: 'Amazon', flipkart: 'Flipkart' };
export type PaymentMode = 'PREPAID' | 'COD';
export type ZoneClass = 'metro' | 'tier2' | 'tier3';
export type Sensitivity = 'standard' | 'fragile' | 'high_value';

export type Product = {
  sku: string; title: string; category: string;
  pricePaise: Money; cogsPaise: Money; mrpPaise: Money;
  stock: number; reserved: number; weightGrams: number;
  channels: Channel[]; sensitivity: Sensitivity;
  status: 'active' | 'draft' | 'oos'; returnRate: number;
};

export type OrderState =
  | 'NEW' | 'CONFIRMED' | 'PACKED' | 'SHIPPED' | 'OUT_FOR_DELIVERY' | 'DELIVERED'
  | 'NDR' | 'RTO' | 'CANCELLED' | 'RETURNED';

export type Order = {
  orderId: string; channel: Channel; sku: string; title: string; category: string;
  qty: number; sellingPricePaise: Money; cogsPaise: Money; weightGrams: number;
  state: OrderState; paymentMode: PaymentMode; sensitivity: Sensitivity;
  customerMasked: string; pincode: string; city: string; zoneClass: ZoneClass;
  placedAt: string; courierId?: string; awb?: string;
};

// --- SCALE (courier intelligence) ---
export type CourierPerf = { onTime: number; rtoRate: number; ndrRate: number; damageRate: number };
export type Courier = {
  id: string; name: string; capabilities: Sensitivity[]; zones: ZoneClass[];
  baseFreightMultiplier: number; codRemittanceLagDays: number; base: CourierPerf; penalized?: boolean;
};

// --- decision contract (the governed loop) ---
export type AgentId = 'routing' | 'pricing' | 'inventory' | 'fulfilment' | 'finance' | 'cx' | 'marketing';
export type RoutingTier = 'AUTO' | 'ONE_TAP' | 'REVIEW' | 'ESCALATE';
export type DecisionStatus = 'PENDING' | 'AUTO_EXECUTED' | 'APPROVED' | 'DENIED' | 'OVERRIDDEN' | 'ESCALATED';
export type Reversibility = 'reversible' | 'one_way';
export type GuardrailFlag = 'one_way' | 'above_cap' | 'person_impacting' | 'policy_violating';
export type Evidence = { label: string; value: string; provenance: Provenance };
export type DecisionOption = { optionId: string; label: string; confidence: number; deltaPaise: Money; reversible: boolean; lowValue?: boolean; recommended?: boolean };
export type Decision = {
  decisionId: string; agentId: AgentId; domainLabel: string;
  title: string; rationale: string; createdAt: string;
  options: DecisionOption[]; recommendedOptionId: string;
  confidence: number; deltaPaise: Money; evidence: Evidence[];
  guardrails: GuardrailFlag[]; reversibility: Reversibility;
  routingTier: RoutingTier; status: DecisionStatus;
  writeBackTarget: string; writeBackStatus: 'pending' | 'written' | 'na';
  resolvedAt?: string; resolvedBy?: string; ledgerEntryId?: string;
  channel?: Channel; orderId?: string; sku?: string;
};

export type LedgerEntry = {
  ledgerEntryId: string; decisionId: string; agentId: AgentId;
  metric: string; predictedPaise: Money; actualPaise: Money; precisionPct: number; closedAt: string;
};
