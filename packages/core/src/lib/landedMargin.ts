import type { Channel, Money, PaymentMode, Provenance, ZoneClass } from '../types';
import { CAC_PCT, CHANNEL_COMMISSION_PCT, COD_FEE_PCT, COST_OF_CAPITAL, GST_ON_FEES_PCT, PSP_PCT, shippingPaise } from './rateCard';
import { DEMO_NOW } from './util';

// THE spine: true D2C profit from first principles. COGS + CAC are the big costs (a brand's reality);
// marketplace commission only applies on marketplace channels. Integer paise; ties to the paisa.
export type LandedInput = {
  channel: Channel; sellingPricePaise: Money; cogsPaise: Money; qty: number;
  weightGrams: number; zoneClass: ZoneClass; paymentMode: PaymentMode; returnRate: number; adSpendPaise?: Money;
};
export type MarginLine = { label: string; valuePaise: Money; provenance: Provenance };
export type LandedMargin = { revenuePaise: Money; lines: MarginLine[]; netPaise: Money; marginPct: number };

const meas = (s: string): Provenance => ({ basis: 'measured', source: s, asOf: DEMO_NOW });
const der = (s: string): Provenance => ({ basis: 'derived', source: s, asOf: DEMO_NOW });
const proj = (s: string, c: number): Provenance => ({ basis: 'projected', confidence: c, source: s, asOf: DEMO_NOW });

export function computeLandedMargin(i: LandedInput): LandedMargin {
  const revenue = i.sellingPricePaise * i.qty;
  const cogs = i.cogsPaise * i.qty;
  const commission = Math.round((revenue * CHANNEL_COMMISSION_PCT[i.channel]) / 100);
  const psp = i.channel === 'own_store' ? Math.round((revenue * PSP_PCT) / 100) : 0;
  const shipping = shippingPaise(i.weightGrams, i.zoneClass) * i.qty;
  const codFee = i.paymentMode === 'COD' ? Math.round((revenue * COD_FEE_PCT) / 100) : 0;
  const gstOnFees = Math.round(((commission + psp + shipping + codFee) * GST_ON_FEES_PCT) / 100);
  const returnRisk = Math.round(i.returnRate * shipping * 2);
  const ads = i.adSpendPaise ?? (i.channel === 'own_store' ? Math.round((revenue * CAC_PCT) / 100) : 0);
  const wcc = Math.round((revenue * 7 * COST_OF_CAPITAL) / 365);

  const lines: MarginLine[] = [
    { label: 'Selling price', valuePaise: revenue, provenance: meas('order') },
    { label: 'Cost of goods (COGS)', valuePaise: -cogs, provenance: meas('catalog') },
  ];
  if (commission) lines.push({ label: `${i.channel === 'amazon' ? 'Amazon' : 'Flipkart'} commission`, valuePaise: -commission, provenance: meas('channel') });
  if (psp) lines.push({ label: 'Payment gateway (2%)', valuePaise: -psp, provenance: meas('razorpay') });
  lines.push({ label: 'Shipping (dim-wt x zone)', valuePaise: -shipping, provenance: meas('courier') });
  if (codFee) lines.push({ label: 'COD handling', valuePaise: -codFee, provenance: meas('courier') });
  lines.push({ label: 'GST on fees (18%)', valuePaise: -gstOnFees, provenance: der('gst') });
  lines.push({ label: 'Returns-risk', valuePaise: -returnRisk, provenance: proj('forecast', 0.8) });
  if (ads) lines.push({ label: 'Ad spend (CAC)', valuePaise: -ads, provenance: meas('ads') });
  lines.push({ label: 'Working-capital', valuePaise: -wcc, provenance: der('cash') });

  const net = lines.reduce((s, l) => s + l.valuePaise, 0);
  return { revenuePaise: revenue, lines, netPaise: net, marginPct: revenue ? net / revenue : 0 };
}

// The LTV-loaded true cost of an RTO (the doctrine): forward freight already spent + reverse freight +
// the CAC wasted acquiring a customer who didn't convert + COD cash-blockage (per-courier lag) + restock.
export function trueRtoCostPaise(i: LandedInput, lagDays: number): Money {
  const ship = shippingPaise(i.weightGrams, i.zoneClass) * i.qty;
  const orderValue = i.sellingPricePaise * i.qty;
  const wastedCac = i.channel === 'own_store' ? Math.round((orderValue * CAC_PCT) / 100) : 0;
  const codBlockage = i.paymentMode === 'COD' ? Math.round((orderValue * lagDays * COST_OF_CAPITAL) / 365) : 0;
  return ship + ship + wastedCac + codBlockage + 2000;
}
