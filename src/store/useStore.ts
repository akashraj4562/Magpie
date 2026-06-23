import { create } from 'zustand';
import type { Decision, DecisionStatus, OrderState } from '../types';
import { generateWorld, type World } from '../seed/generate';
import { recommendCourier } from '../lib/courier';
import { precisionPct } from '../lib/ledger';
import { DEMO_NOW } from '../lib/util';

type ResolveAction = Extract<DecisionStatus, 'APPROVED' | 'DENIED' | 'OVERRIDDEN'>;
function noise(id: string): number { let h = 0; for (const c of id) h = (h * 31 + c.charCodeAt(0)) >>> 0; return ((h % 21) - 10) / 100; }

type State = {
  world: World;
  openDecisionId: string | null;
  openDecision: (id: string) => void;
  closeDrawer: () => void;
  addDecision: (d: Decision) => void;
  resolveDecision: (id: string, action: ResolveAction) => void;
  advanceOrder: (orderId: string, to: OrderState) => void;
};

export const useStore = create<State>((set) => ({
  world: generateWorld(),
  openDecisionId: null,
  openDecision: (id) => set({ openDecisionId: id }),
  closeDrawer: () => set({ openDecisionId: null }),

  addDecision: (d) => set((s) => ({ world: { ...s.world, decisions: [d, ...s.world.decisions] } })),

  advanceOrder: (orderId, to) => set((s) => ({
    world: {
      ...s.world,
      orders: s.world.orders.map((o) => {
        if (o.orderId !== orderId) return o;
        const courierId = to === 'SHIPPED' && !o.courierId ? recommendCourier(o).recommended?.courier.id ?? 'delhivery' : o.courierId;
        const awb = to === 'SHIPPED' && !o.awb ? `AWB${Math.floor(100000 + Math.random() * 899999)}` : o.awb;
        return { ...o, state: to, courierId, awb };
      }),
    },
  })),

  resolveDecision: (id, action) => set((s) => {
    const target = s.world.decisions.find((d) => d.decisionId === id);
    if (!target) return {};
    const decisions = s.world.decisions.map((d) =>
      d.decisionId !== id ? d : { ...d, status: action, writeBackStatus: (action === 'DENIED' ? 'na' : 'written') as 'na' | 'written', resolvedAt: DEMO_NOW, resolvedBy: 'Founder' },
    );
    let ledger = s.world.ledger;
    if (action !== 'DENIED' && target.deltaPaise !== 0) {
      const predicted = target.deltaPaise;
      const actual = Math.round(predicted * (1 + noise(id)));
      ledger = [{ ledgerEntryId: `LG-${id}`, decisionId: id, agentId: target.agentId, metric: 'Verified outcome', predictedPaise: predicted, actualPaise: actual, precisionPct: precisionPct(predicted, actual), closedAt: DEMO_NOW }, ...ledger];
    }
    return { world: { ...s.world, decisions, ledger }, openDecisionId: null };
  }),
}));
