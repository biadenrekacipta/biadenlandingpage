import type { APIRoute } from 'astro';

// SEO-3, GEO-2: robots.txt statis saat build; URL sitemap dari SITE_URL (TC-8, BUG-7), jadi bukan berkas di public/.
// Crawler AI diizinkan eksplisit supaya situs bisa dikutip.
const AI_BOTS = ['GPTBot', 'OAI-SearchBot', 'ClaudeBot', 'PerplexityBot', 'Google-Extended'];
export const GET: APIRoute = ({ site }) =>
  new Response(
    [
      'User-agent: *',
      'Allow: /',
      '',
      ...AI_BOTS.flatMap((b) => [`User-agent: ${b}`, 'Allow: /', '']),
      `Sitemap: ${new URL('sitemap-index.xml', site).href}`,
      '',
    ].join('\n'),
    { headers: { 'Content-Type': 'text/plain; charset=utf-8' } },
  );
