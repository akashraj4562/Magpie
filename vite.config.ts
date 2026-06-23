import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';

// Magpie runs on its OWN endpoint (127.0.0.1:5190) - separate from Helm Seller Portal (5180) and
// SmartFleet (5173). strictPort so it never silently lands elsewhere.
export default defineConfig({
  plugins: [react()],
  server: { host: '127.0.0.1', port: 5190, strictPort: true },
});
