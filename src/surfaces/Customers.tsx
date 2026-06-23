import { useStore } from '../store/useStore';
import { formatINR } from '../lib/format';
import { PageHeader, Stat, Tag } from '../components/primitives';

export function Customers() {
  const world = useStore((s) => s.world);
  const map = new Map<string, { name: string; city: string; orders: number; value: number }>();
  for (const o of world.orders) {
    const k = `${o.customerMasked}·${o.city}`;
    const e = map.get(k) ?? { name: o.customerMasked, city: o.city, orders: 0, value: 0 };
    e.orders += 1; e.value += o.sellingPricePaise * o.qty;
    map.set(k, e);
  }
  const customers = [...map.values()].sort((a, b) => b.value - a.value);
  const repeat = customers.filter((c) => c.orders > 1).length;

  return (
    <div>
      <PageHeader title="Customers" sub="The customers you own — the D2C advantage a marketplace seller never has. Repeat-purchase, lifetime value, your data." right={<Tag tone="accent">CRM</Tag>} />
      <div className="mb-5 grid grid-cols-3 gap-3">
        <Stat label="Customers" value={String(customers.length)} />
        <Stat label="Repeat buyers" value={String(repeat)} accent="text-pos" />
        <Stat label="Repeat rate" value={`${customers.length ? Math.round((repeat / customers.length) * 100) : 0}%`} accent="text-auto" />
      </div>
      <div className="overflow-hidden rounded-[10px] border border-line">
        <div className="grid grid-cols-[1.5fr_1.2fr_0.8fr_1fr] gap-2 border-b border-line bg-surface-2 px-4 py-2 text-[10px] uppercase tracking-wide text-mute"><span>Customer</span><span>City</span><span>Orders</span><span>Lifetime value</span></div>
        {customers.slice(0, 20).map((c, i) => (
          <div key={i} className="grid grid-cols-[1.5fr_1.2fr_0.8fr_1fr] items-center gap-2 border-b border-line bg-surface px-4 py-2 text-xs last:border-0">
            <span className="flex items-center gap-1.5 text-dim">{c.name}{c.orders > 1 && <Tag tone="pos">repeat</Tag>}</span>
            <span className="text-mute">{c.city}</span>
            <span className="font-mono text-mute">{c.orders}</span>
            <span className="font-mono text-dim">{formatINR(c.value, { compact: true })}</span>
          </div>
        ))}
      </div>
    </div>
  );
}
