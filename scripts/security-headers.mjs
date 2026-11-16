// Header keamanan untuk SEMUA respons server Node (FR-34, TC-6, SEC-4, SEC-6, SEC-7).
// Disalin ke dist/server/ oleh scripts/wrap-entry.mjs.
export const CSP = [
  "default-src 'self'",
  "script-src 'self' https://cloud.umami.is",
  "connect-src 'self' https://api-gateway.umami.dev",
  "base-uri 'self'",
  "object-src 'none'",
  "form-action 'self'",
  "frame-ancestors 'none'",
].join('; ');

const STAGING = /^(staging|stg|dev|test|preview)\.|\.hostingersite\.com(:\d+)?$/i;

export function securityHeaders(host = '', url = '/') {
  const h = {
    'Content-Security-Policy': CSP,
    'X-Content-Type-Options': 'nosniff',
    'Referrer-Policy': 'strict-origin-when-cross-origin',
    'X-Frame-Options': 'DENY',
  };
  if (STAGING.test(host)) h['X-Robots-Tag'] = 'noindex, nofollow';
  if (url.startsWith('/_astro/') || url.startsWith('/fonts/')) h['Cache-Control'] = 'public, max-age=31536000, immutable';
  return h;
}
