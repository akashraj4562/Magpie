import { BrowserRouter, Route, Routes } from 'react-router-dom';
import { AppShell } from './components/AppShell';
import { Today } from './surfaces/Today';
import { Soon } from './surfaces/Soon';

export function App() {
  return (
    <BrowserRouter>
      <Routes>
        <Route element={<AppShell />}>
          <Route index element={<Today />} />
          <Route path="/decisions" element={<Soon title="Decisions" sub="The ranked decision queue + the review-first evidence drawer." />} />
          <Route path="/orders" element={<Soon title="Orders" sub="Own-store + marketplace orders, the guarded lifecycle, SCALE courier per order." />} />
          <Route path="/shipping" element={<Soon title="Shipping · SCALE" sub="The courier brain: scorecards, the COD-RTO gate, SLA-risk, NDR." />} />
          <Route path="/catalog" element={<Soon title="Catalog" sub="Products, variants, inventory truth across channels." />} />
          <Route path="/channels" element={<Soon title="Channels" sub="Own store + Amazon + Flipkart." />} />
          <Route path="/storefront" element={<Soon title="Storefront" sub="The website / store builder." />} />
          <Route path="/money" element={<Soon title="Money" sub="True landed profit per order/SKU, payouts, COD reconciliation." />} />
          <Route path="/ledger" element={<Soon title="Ledger" sub="Every decision, predicted-vs-actual — the proof." />} />
          <Route path="/customers" element={<Soon title="Customers" sub="The customers you own — repeat-purchase, LTV." />} />
          <Route path="/settings" element={<Soon title="Settings" sub="Brand config, routing rules, integrations." />} />
        </Route>
      </Routes>
    </BrowserRouter>
  );
}
