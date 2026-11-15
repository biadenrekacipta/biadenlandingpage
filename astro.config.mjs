import { defineConfig } from 'astro/config';
import sitemap from '@astrojs/sitemap';

// TC-8: domain produksi lewat env SITE_URL
const site = process.env.SITE_URL || 'http://localhost:4321';

export default defineConfig({
  site,
  trailingSlash: 'always',
  integrations: [sitemap({ filter: (page) => !page.includes('/terima-kasih/') })],
});
