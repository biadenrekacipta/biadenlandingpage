import { defineConfig } from 'astro/config';
import sitemap from '@astrojs/sitemap';
import node from '@astrojs/node';

// TC-8: domain produksi lewat env SITE_URL
const site = process.env.SITE_URL || 'http://localhost:4321';

export default defineConfig({
  site,
  trailingSlash: 'always',
  // Hosting Node.js: halaman tetap statis (prerender), hanya src/pages/api/kirim.ts yang dinamis.
  adapter: node({ mode: 'standalone' }),
  // CSP tanpa inline (TC-6): paksa CSS jadi file terpisah.
  build: { inlineStylesheets: 'never' },
  integrations: [sitemap({ filter: (page) => !page.includes('/terima-kasih/') })],
});
