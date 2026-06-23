import type { Channel, Money, ZoneClass } from '../types';

// Illustrative D2C economics (configurable business rules — not any real provider's published rates).
export const PSP_PCT = 2; // payment gateway (Razorpay) on own-store
export const GST_ON_FEES_PCT = 18;
export const COD_FEE_PCT = 1.5; // COD handling
export const COST_OF_CAPITAL = 0.18; // annual, for working-capital + COD cash-blockage
export const CAC_PCT = 12; // own-store ad spend as % of revenue (customer acquisition cost)
export const CHANNEL_COMMISSION_PCT: Record<Channel, number> = { own_store: 0, amazon: 15, flipkart: 14 };

export const CATEGORIES = ['Skincare', 'Haircare', 'Supplements', 'Wellness', 'Fragrance', 'Baby Care'];

const SHIP_BASE: Record<ZoneClass, number> = { metro: 4500, tier2: 6500, tier3: 9000 };
export function shippingPaise(weightGrams: number, zone: ZoneClass): Money {
  const slabs = Math.max(1, Math.ceil(weightGrams / 500));
  return SHIP_BASE[zone] + (slabs - 1) * Math.round(SHIP_BASE[zone] * 0.6);
}
