import { Store, Image, Layout, Check } from 'lucide-react';
import { BRAND } from '../config';
import { useStore } from '../store/useStore';
import { PageHeader, Tag } from '../components/primitives';

export function Storefront() {
  const products = useStore((s) => s.world.products).filter((p) => p.status === 'active').slice(0, 3);
  const blocks = [
    { icon: <Image size={14} />, label: 'Hero banner', status: 'published' },
    { icon: <Layout size={14} />, label: 'Best-sellers grid', status: 'published' },
    { icon: <Image size={14} />, label: 'Ingredient story', status: 'published' },
    { icon: <Layout size={14} />, label: 'Reviews + UGC', status: 'draft' },
  ];
  return (
    <div>
      <PageHeader title="Storefront" sub={`${BRAND.name}'s website — blocks, themes, custom domain (${BRAND.domain}), checkout. The block builder ships in Phase 1.5.`} right={<Tag tone="review">Phase 1.5</Tag>} />
      <div className="grid grid-cols-3 gap-4">
        <div className="col-span-2 overflow-hidden rounded-[10px] border border-line bg-surface">
          <div className="flex h-32 items-center justify-center border-b border-line bg-gradient-to-br from-accent-bg to-surface-2"><span className="flex items-center gap-2 text-lg font-semibold"><Store size={18} className="text-accent" /> {BRAND.name}</span></div>
          <div className="grid grid-cols-3 gap-2 p-3">
            {products.map((p) => (
              <div key={p.sku} className="rounded-md border border-line bg-surface-2 p-2 text-center"><div className="mb-1 h-12 rounded bg-surface" /><div className="truncate text-[11px] text-dim">{p.title}</div></div>
            ))}
          </div>
          <div className="border-t border-line px-3 py-2 text-[11px] text-mute">Checkout: Razorpay + COD, with the SCALE 3-tier COD-RTO gate applied at the point of sale.</div>
        </div>
        <div className="space-y-2">
          <div className="text-sm font-medium text-text">Content blocks</div>
          {blocks.map((b) => (
            <div key={b.label} className="flex items-center justify-between rounded-[10px] border border-line bg-surface px-3 py-2 text-xs"><span className="flex items-center gap-2 text-dim">{b.icon} {b.label}</span><Tag tone={b.status === 'published' ? 'pos' : 'review'}>{b.status}</Tag></div>
          ))}
          <div className="mt-2 flex items-center gap-1.5 rounded-md border border-line bg-surface-2 px-3 py-2 text-[11px] text-dim"><Check size={12} className="text-auto" /> Custom domain {BRAND.domain} · SSL · SEO defaults.</div>
        </div>
      </div>
    </div>
  );
}
