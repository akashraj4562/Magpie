import { NavLink, Outlet } from 'react-router-dom';
import { LayoutGrid, ListChecks, Package, Truck, Boxes, Network, Store, Wallet, ScrollText, Users, Settings } from 'lucide-react';
import { BRAND } from '../config';
import { Rail } from './Rail';
import { EvidenceDrawer } from './EvidenceDrawer';

const NAV = [
  { to: '/', label: 'Today', icon: LayoutGrid, end: true },
  { to: '/decisions', label: 'Decisions', icon: ListChecks },
  { to: '/orders', label: 'Orders', icon: Package },
  { to: '/shipping', label: 'Shipping · SCALE', icon: Truck },
  { to: '/catalog', label: 'Catalog', icon: Boxes },
  { to: '/channels', label: 'Channels', icon: Network },
  { to: '/storefront', label: 'Storefront', icon: Store },
  { to: '/money', label: 'Money', icon: Wallet },
  { to: '/ledger', label: 'Ledger', icon: ScrollText },
  { to: '/customers', label: 'Customers', icon: Users },
  { to: '/settings', label: 'Settings', icon: Settings },
];

export function AppShell() {
  return (
    <div className="flex h-screen overflow-hidden bg-bg text-text">
      <nav className="flex w-56 shrink-0 flex-col overflow-y-auto border-r border-line bg-surface">
        <div className="flex items-center gap-2 px-4 py-4">
          <span className="grid h-7 w-7 place-items-center rounded-md bg-gradient-to-br from-accent to-[#3a4a8f] text-sm">🐦</span>
          <div><div className="text-sm font-semibold leading-none">{BRAND.product}</div><div className="mt-0.5 text-[10px] text-mute">{BRAND.name}</div></div>
        </div>
        <div className="px-3 pb-6">
          {NAV.map((n) => (
            <NavLink key={n.to} to={n.to} end={n.end} className={({ isActive }) => `flex items-center gap-2.5 rounded-md px-2 py-1.5 text-[13px] ${isActive ? 'bg-accent-bg text-accent' : 'text-dim hover:bg-surface-2 hover:text-text'}`}>
              <n.icon size={15} /> {n.label}
            </NavLink>
          ))}
        </div>
      </nav>

      <div className="flex min-w-0 flex-1 flex-col">
        <header className="flex h-14 shrink-0 items-center justify-between border-b border-line bg-surface px-6">
          <div className="flex items-center gap-2">
            <span className="text-sm font-medium">{BRAND.name}</span>
            <span className="rounded border border-line bg-surface-2 px-1.5 py-0.5 text-[11px] text-mute">{BRAND.tagline}</span>
            <span className="rounded border border-accent bg-accent-bg px-1.5 py-0.5 text-[11px] text-accent">{BRAND.domain}</span>
          </div>
          <span className="text-[11px] text-mute">brand-agnostic · config-driven · demo data</span>
        </header>
        <main className="flex-1 overflow-y-auto px-6 py-5"><Outlet /></main>
      </div>

      <Rail />
      <EvidenceDrawer />
    </div>
  );
}
