// Menjalankan dist/server/entry.mjs sungguhan (tanpa SMTP) dan memeriksa header di semua jenis respons + endpoint.
import { test, before, after } from 'node:test';
import assert from 'node:assert/strict';
import { spawn } from 'node:child_process';
import { readdirSync, existsSync } from 'node:fs';
import { join } from 'node:path';
import { createServer } from 'node:net';

const root = new URL('..', import.meta.url).pathname.replace(/^\/([A-Za-z]:)/, '$1');
const entry = join(root, 'dist', 'server', 'entry.mjs');
let proc, base;

const portBebas = () => new Promise((res) => { const s = createServer().listen(0, '127.0.0.1', () => { const p = s.address().port; s.close(() => res(p)); }); });

before(async () => {
  assert.ok(existsSync(entry), 'jalankan npm run build dulu');
  const port = await portBebas();
  base = `http://127.0.0.1:${port}`;
  const env = { ...process.env, HOST: '127.0.0.1', PORT: String(port) };
  for (const k of ['SMTP_HOST', 'SMTP_PORT', 'SMTP_USER', 'SMTP_PASS', 'MAIL_TO']) delete env[k];
  proc = spawn(process.execPath, [entry], { env, stdio: 'ignore' });
  for (let i = 0; i < 50; i++) {
    try { await fetch(base + '/'); return; } catch { await new Promise((r) => setTimeout(r, 100)); }
  }
  assert.fail('server tidak jalan');
});
after(() => proc?.kill());

const aset = () => '/_astro/' + readdirSync(join(root, 'dist', 'client', '_astro')).find((n) => n.endsWith('.css'));
const kirim = (data, extra = {}) => fetch(base + '/api/kirim/', { method: 'POST', redirect: 'manual', headers: { 'Content-Type': 'application/x-www-form-urlencoded' }, body: new URLSearchParams(data), ...extra });
const baik = { nama: 'Budi Santoso', email: 'budi@example.com', peran: 'Dosen', jenis: 'Ajukan naskah buku', judul_atau_topik: 'Judul naskah', pesan: 'Pesan yang cukup panjang untuk lolos.', persetujuan: 'ya' };

test('FR-34 / SEC-6: CSP, nosniff, Referrer-Policy, X-Frame-Options di halaman, aset, 404, endpoint, robots', async () => {
  for (const [path, init, status] of [['/', {}, 200], ['/kebijakan-privasi/', {}, 200], [aset(), {}, 200], ['/og.png', {}, 200], ['/robots.txt', {}, 200], ['/tidak-ada/', {}, 404], ['/api/kirim/', {}, 405], ['/api/kirim/', { method: 'POST' }, 415]]) {
    const r = await fetch(base + path, init);
    assert.equal(r.status, status, path);
    const csp = r.headers.get('content-security-policy') ?? '';
    assert.match(csp, /(^|; )default-src 'self'(;|$)/, path);
    assert.match(csp, /(^|; )form-action 'self'(;|$)/, path);
    assert.match(csp, /(^|; )frame-ancestors 'none'(;|$)/, path);
    assert.match(csp, /(^|; )script-src 'self' https:\/\/cloud\.umami\.is(;|$)/, path);
    assert.match(csp, /(^|; )connect-src 'self' https:\/\/api-gateway\.umami\.dev https:\/\/gateway\.umami\.is(;|$)/, path);
    assert.ok(!/web3forms/i.test(csp), path);
    assert.equal(r.headers.get('x-content-type-options'), 'nosniff', path);
    assert.equal(r.headers.get('x-frame-options'), 'DENY', path);
    assert.ok(r.headers.get('referrer-policy'), path);
    assert.equal(r.headers.get('x-robots-tag'), null, `${path}: host lokal bukan staging`);
    await r.arrayBuffer();
  }
});

test('FR-34: noindex hanya untuk host staging; cache immutable hanya aset sukses', async () => {
  const stg = await fetch(base + '/', { headers: { Host: 'staging.example.com' } }).catch(() => null);
  // fetch (undici) melarang override Host; tes noindex dilakukan lewat modul header.
  stg?.body?.cancel();
  const { securityHeaders } = await import(new URL('../scripts/security-headers.mjs', import.meta.url));
  assert.equal(securityHeaders('staging.biadenrekacipta.com')['X-Robots-Tag'], 'noindex, nofollow');
  assert.equal(securityHeaders('abc.hostingersite.com')['X-Robots-Tag'], 'noindex, nofollow');
  assert.equal(securityHeaders('biadenrekacipta.com')['X-Robots-Tag'], undefined);
  assert.equal(securityHeaders('biadenrekacipta.com', '/fonts/a.woff2')['Cache-Control'], 'public, max-age=31536000, immutable');
  const r = await fetch(base + aset());
  assert.equal(r.headers.get('cache-control'), 'public, max-age=31536000, immutable');
  await r.arrayBuffer();
  const r404 = await fetch(base + '/fonts/tidak-ada.woff2');
  assert.equal(r404.status, 404);
  assert.ok(!/immutable/.test(r404.headers.get('cache-control') ?? ''));
  await r404.arrayBuffer();
});

test('endpoint: tolak Content-Type bukan form dan body terlalu besar', async () => {
  assert.equal((await fetch(base + '/api/kirim/', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: '{}' })).status, 415);
  assert.equal((await kirim({ ...baik, pesan: 'x'.repeat(20000) })).status, 413);
});

test('endpoint: validasi gagal -> 400 tanpa mengirim', async () => {
  const r = await kirim({ ...baik, email: 'salah' });
  assert.equal(r.status, 400);
  assert.match(await r.text(), /email/i);
});

test('endpoint: honeypot terisi -> 303 ke /terima-kasih/ tanpa validasi/email', async () => {
  const r = await kirim({ botcheck: 'on' });
  assert.equal(r.status, 303);
  assert.equal(new URL(r.headers.get('location'), base).pathname, '/terima-kasih/');
});

test('endpoint: SMTP kosong -> 503 tanpa detail internal, bukan sukses palsu', async () => {
  const r = await kirim(baik);
  assert.equal(r.status, 503);
  const t = await r.text();
  assert.ok(!/smtp_|nodemailer|stack/i.test(t));
});

test('endpoint: rate limit per IP -> 429 setelah batas', async () => {
  let last;
  for (let i = 0; i < 8; i++) last = (await kirim({ ...baik, email: 'salah' })).status;
  assert.equal(last, 429);
});
