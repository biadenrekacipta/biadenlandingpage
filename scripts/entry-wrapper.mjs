// Entry produksi (dist/server/entry.mjs). Dibuat oleh scripts/wrap-entry.mjs; entry asli Astro
// dipindah ke astro-entry.mjs. Middleware Astro tidak berjalan untuk halaman prerender dan aset
// yang disajikan adapter node, jadi header dipasang di sini sebelum handler mana pun menulis respons.
process.env.ASTRO_NODE_AUTOSTART = 'disabled';
const { default: http } = await import('node:http');
const { handler, options } = await import('./astro-entry.mjs');
const { securityHeaders } = await import('./security-headers.mjs');

const port = Number(process.env.PORT) || options.port || 8080;
const host = process.env.HOST ?? (options.host === true ? '0.0.0.0' : options.host || 'localhost');

const server = http.createServer((req, res) => {
  for (const [k, v] of Object.entries(securityHeaders(req.headers.host, req.url))) res.setHeader(k, v);
  // Cache immutable hanya untuk respons sukses; galat (mis. 404) tidak boleh ikut ter-cache.
  const tulis = res.writeHead;
  res.writeHead = function (status, ...rest) {
    if (status >= 400) res.removeHeader('Cache-Control');
    return tulis.call(this, status, ...rest);
  };
  handler(req, res);
});
server.on('error', (e) => { console.error(e); process.exit(1); });
server.listen(port, host, () => console.log(`Server mendengarkan di http://${host}:${port}`));
