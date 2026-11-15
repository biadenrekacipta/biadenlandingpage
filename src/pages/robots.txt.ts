import type { APIRoute } from 'astro';

// SEO-3: robots.txt statis saat build; URL sitemap dari SITE_URL (TC-8, BUG-7), jadi bukan berkas di public/.
// Blok crawler AI ditambah di t29.
export const GET: APIRoute = ({ site }) =>
  new Response(`User-agent: *\nAllow: /\n\nSitemap: ${new URL('sitemap-index.xml', site).href}\n`, {
    headers: { 'Content-Type': 'text/plain; charset=utf-8' },
  });
