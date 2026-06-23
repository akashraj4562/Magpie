// Brand-agnostic config (Productization Phase 0). A D2C brand owns this file — nothing about the
// brand is hardcoded anywhere else. Swap these values and the whole app is "their" store.
export const BRAND = {
  product: 'Magpie', // the platform name (stays)
  name: 'Acme Naturals', // the demo D2C brand (swap freely)
  tagline: 'D2C personal care',
  domain: 'acme.store',
  currency: 'INR',
  locale: 'en-IN',
};

// The single North-Star for a D2C brand: the Perfect-Order family every commerce op lives by.
export const NSM = {
  key: 'OFR',
  name: 'Order-Fulfilment Rate',
  tagline: 'delivered-as-promised / accepted',
};
