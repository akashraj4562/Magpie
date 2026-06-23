import { useStore } from '../store/useStore';
import { computeLandedMargin } from '../lib/landedMargin';
import { formatINR } from '../lib/format';
import { CHANNEL_LABEL } from '../types';
import type { Product } from '../types';
import { PageHeader, Stat, Tag } from '../components/primitives';

export function Catalog() {
  const world = useStore((s) => s.world);
  const products = world.products;
  const margin = (p: Product) => Math.round(computeLandedMargin({ channel: 'own_store', sellingPricePaise: p.pricePaise, cogsPaise: p.cogsPaise, qty: 1, weightGrams: p.weightGrams, zoneClass: 'metro', paymentMode: 'PREPAID', returnRate: p.returnRate }).marginPct * 100);

  return (
    <div>
      <PageHeader title="Catalog" sub="Your products and inventory truth across channels, with the real landed margin per SKU." right={<Tag tone="accent">Listing</Tag>} />

      <div className="mb-5 grid grid-cols-3 gap-3">
        <Stat label="Products" value={String(products.length)} sub={`${products.filter((p) => p.status === 'active').length} active`} />
        <Stat label="Fragile / high-value" value={String(products.filter((p) => p.sensitivity !== 'standard').length)} sub="SKU-sensitive routing" />
        <Stat label="Below 8% margin" value={String(products.filter((p) => margin(p) < 8).length)} accent="text-review" />
      </div>

      <div className="overflow-hidden rounded-[10px] border border-line">
        <div className="grid grid-cols-[1.8fr_0.9fr_0.8fr_0.7fr_0.7fr_1.1fr] gap-2 border-b border-line bg-surface-2 px-4 py-2 text-[10px] uppercase tracking-wide text-mute">
          <span>Product</span><span>Category</span><span>Price</span><span>Margin</span><span>Stock</span><span>Channels</span>
        </div>
        {products.map((p) => {
          const m = margin(p);
          return (
            <div key={p.sku} className="grid grid-cols-[1.8fr_0.9fr_0.8fr_0.7fr_0.7fr_1.1fr] items-center gap-2 border-b border-line bg-surface px-4 py-2 text-xs last:border-0">
              <span className="flex items-center gap-1.5 truncate text-dim">{p.title}{p.sensitivity !== 'standard' && <Tag tone="review">{p.sensitivity === 'fragile' ? 'fragile' : 'high-value'}</Tag>}{p.status === 'draft' && <Tag tone="mute">draft</Tag>}</span>
              <span className="text-mute">{p.category}</span>
              <span className="font-mono text-mute">{formatINR(p.pricePaise, { compact: true })}</span>
              <span className={`font-mono ${m < 8 ? 'text-review' : 'text-auto'}`}>{m}%</span>
              <span className={`font-mono ${p.stock < 20 ? 'text-escalate' : 'text-mute'}`}>{p.stock}</span>
              <span className="flex gap-1">{p.channels.map((c) => <Tag key={c} tone={c === 'own_store' ? 'accent' : 'mute'}>{CHANNEL_LABEL[c].split(' ')[0]}</Tag>)}</span>
            </div>
          );
        })}
      </div>
    </div>
  );
}
