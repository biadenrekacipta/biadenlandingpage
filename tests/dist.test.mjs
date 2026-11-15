import { test } from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync, readdirSync, existsSync, statSync } from 'node:fs';
import { join } from 'node:path';

const root = new URL('..', import.meta.url).pathname.replace(/^\/([A-Za-z]:)/, '$1');
const dist = process.env.DIST_DIR || join(root, 'dist');
const UMAMI_HOST = 'cloud.umami.is';

function walk(dir, ext, out = []) {
  for (const n of readdirSync(dir)) {
    const p = join(dir, n);
    if (statSync(p).isDirectory()) walk(p, ext, out);
    else if (p.endsWith(ext)) out.push(p);
  }
  return out;
}
const htmlFiles = () => walk(dist, '.html').map((p) => [p, readFileSync(p, 'utf8')]);

test('dist/ ada (jalankan npm run build dulu)', () => {
  assert.ok(existsSync(dist), `tidak ada ${dist}`);
  assert.ok(htmlFiles().length > 0);
});

test('BUG-4: setiap href="#x" punya id="x"', () => {
  for (const [p, html] of htmlFiles()) {
    const ids = new Set([...html.matchAll(/\sid="([^"]+)"/g)].map((m) => m[1]));
    for (const m of html.matchAll(/href="#([^"]+)"/g)) assert.ok(ids.has(m[1]), `${p}: #${m[1]} tanpa id`);
  }
});

test('SEC-4 / GR-15: tidak ada <script src> eksternal selain Umami', () => {
  for (const [p, html] of htmlFiles()) {
    for (const m of html.matchAll(/<script\b[^>]*\bsrc="([^"]+)"/g)) {
      const src = m[1];
      if (/^(https?:)?\/\//.test(src)) assert.equal(new URL(src, 'https://x').host, UMAMI_HOST, `${p}: ${src}`);
    }
  }
});

test('SEC-10: target=_blank dan link eksternal pakai rel="noopener noreferrer"', () => {
  for (const [p, html] of htmlFiles()) {
    for (const m of html.matchAll(/<a\b[^>]*>/g)) {
      const tag = m[0];
      const blank = /target="_blank"/.test(tag);
      const ext = /href="https?:\/\//.test(tag);
      if (blank || ext) assert.match(tag, /rel="[^"]*noopener[^"]*noreferrer[^"]*"|rel="[^"]*noreferrer[^"]*noopener[^"]*"/, `${p}: ${tag}`);
    }
  }
});

test('SEC-3 / GR-14: tidak ada set:html di src/', () => {
  const files = [...walk(join(root, 'src'), '.astro'), ...walk(join(root, 'src'), '.ts')];
  for (const f of files) assert.ok(!readFileSync(f, 'utf8').includes('set:html'), f);
});

const SITE_URL = process.env.SITE_URL || 'http://localhost:4321';

test('FR-34 / SEC-7: _headers memuat CSP, nosniff, Referrer-Policy, frame-ancestors, noindex *.pages.dev', () => {
  const h = readFileSync(join(dist, '_headers'), 'utf8');
  assert.match(h, /Content-Security-Policy:.*default-src 'self'/);
  assert.match(h, /Content-Security-Policy:.*form-action https:\/\/api\.web3forms\.com(;|$)/m);
  assert.match(h, /Content-Security-Policy:.*frame-ancestors 'none'/);
  assert.match(h, /X-Content-Type-Options:\s*nosniff/);
  assert.match(h, /Referrer-Policy:\s*\S+/);
  assert.match(h, /https:\/\/\*\.pages\.dev\/\*\r?\n\s+X-Robots-Tag:\s*noindex/);
});

test('TC-6: tidak ada script inline (kecuali JSON-LD) dan tidak ada style inline', () => {
  for (const [p, html] of htmlFiles()) {
    for (const m of html.matchAll(/<script\b([^>]*)>/g)) {
      if (/\bsrc=/.test(m[1]) || /type="application\/ld\+json"/.test(m[1])) continue;
      assert.fail(`${p}: script inline ${m[0]}`);
    }
    assert.ok(!/<style\b/.test(html), `${p}: <style> inline melanggar CSP`);
  }
});

test('BUG-7 / SEO-4: semua canonical memakai host SITE_URL', () => {
  const host = new URL(SITE_URL).host;
  for (const [p, html] of htmlFiles()) {
    const m = /<link rel="canonical" href="([^"]+)"/.exec(html);
    assert.ok(m, `${p}: tidak ada canonical`);
    assert.equal(new URL(m[1]).host, host, p);
  }
});

test('SEO-3: robots.txt menunjuk sitemap-index.xml di host SITE_URL', () => {
  const r = readFileSync(join(dist, 'robots.txt'), 'utf8');
  const line = r.split(/\r?\n/).find((l) => l.startsWith('Sitemap:'));
  assert.equal(line, `Sitemap: ${new URL('sitemap-index.xml', SITE_URL).href}`);
});

test('FR-16: sitemap tidak memuat /terima-kasih/', () => {
  for (const f of walk(dist, '.xml')) assert.ok(!readFileSync(f, 'utf8').includes('terima-kasih'), f);
});

test('FR-1 / SEO-6: beranda punya tepat satu h1, CTA utama, dan badge hero maks 3', () => {
  const html = readFileSync(join(dist, 'index.html'), 'utf8');
  assert.equal((html.match(/<h1\b/g) || []).length, 1);
  assert.match(html, /<a [^>]*href="#ajukan"[^>]*data-umami-event="cta-ajukan"[^>]*>Ajukan Naskah<\/a>/);
  assert.ok((html.match(/class="badge /g) || []).length <= 3);
});
