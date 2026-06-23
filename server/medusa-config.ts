import { loadEnv, defineConfig } from '@medusajs/framework/utils';

loadEnv(process.env.NODE_ENV || 'development', process.cwd());

// Medusa v2 owns commerce (Order, LineItem, Inventory, Sales Channels). Magpie adds ONE custom module
// — the decision layer — and listens on order.placed. See docs/adr/ADR-001 for the seam, ADR-002 for
// how tenants are isolated (schema-per-tenant), ADR-003 for the cross-tenant SCALE pool.
export default defineConfig({
  projectConfig: {
    databaseUrl: process.env.DATABASE_URL,
    redisUrl: process.env.REDIS_URL,
    http: {
      storeCors: process.env.STORE_CORS || 'http://localhost:5190',
      adminCors: process.env.ADMIN_CORS || 'http://localhost:5190',
      authCors: process.env.AUTH_CORS || 'http://localhost:5190',
      jwtSecret: process.env.JWT_SECRET || 'dev-magpie-jwt',
      cookieSecret: process.env.COOKIE_SECRET || 'dev-magpie-cookie',
    },
  },
  modules: [
    // The Magpie decision module — landed-margin, SCALE routing, the ledger. Pure logic lives in
    // @magpie/core; this module only persists what the core decides.
    { resolve: './src/modules/magpie' },
  ],
});
