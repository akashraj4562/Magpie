import { BrowserRouter, Route, Routes } from 'react-router-dom';
import { AppShell } from './components/AppShell';
import { Today } from './surfaces/Today';
import { Decisions } from './surfaces/Decisions';
import { Orders } from './surfaces/Orders';
import { Shipping } from './surfaces/Shipping';
import { Catalog } from './surfaces/Catalog';
import { Channels } from './surfaces/Channels';
import { Storefront } from './surfaces/Storefront';
import { Money } from './surfaces/Money';
import { Ledger } from './surfaces/Ledger';
import { Customers } from './surfaces/Customers';
import { Settings } from './surfaces/Settings';

export function App() {
  return (
    <BrowserRouter>
      <Routes>
        <Route element={<AppShell />}>
          <Route index element={<Today />} />
          <Route path="/decisions" element={<Decisions />} />
          <Route path="/orders" element={<Orders />} />
          <Route path="/shipping" element={<Shipping />} />
          <Route path="/catalog" element={<Catalog />} />
          <Route path="/channels" element={<Channels />} />
          <Route path="/storefront" element={<Storefront />} />
          <Route path="/money" element={<Money />} />
          <Route path="/ledger" element={<Ledger />} />
          <Route path="/customers" element={<Customers />} />
          <Route path="/settings" element={<Settings />} />
        </Route>
      </Routes>
    </BrowserRouter>
  );
}
