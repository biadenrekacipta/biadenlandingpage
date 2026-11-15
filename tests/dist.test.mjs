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
  for (const f of files) {
    const src = readFileSync(f, 'utf8');
    if (f.replaceAll('\\', '/').endsWith('src/components/JsonLd.astro')) {
      // t22: satu pengecualian, hanya bila JSON di-escape (< jadi u003c) sebelum ditulis.
      assert.ok(src.includes("replace(/</g, '" + String.fromCharCode(92, 92) + "u003c')"), 'JsonLd.astro harus meng-escape <');
      continue;
    }

    assert.ok(!src.includes('set:html'), f);
  }
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

test('FR-2 / BUG-4: nav hanya berisi anchor ke section yang ada, menu mobile <details>, tanpa script', () => {
  const html = readFileSync(join(dist, 'index.html'), 'utf8');
  const nav = /<header class="nav"[\s\S]*?<\/header>/.exec(html)?.[0];
  assert.ok(nav, 'header nav tidak ada');
  assert.match(nav, /<details class="nav-mobile"/);
  assert.ok(!/<script/.test(nav), 'nav tidak boleh berisi script');
  const ids = new Set([...html.matchAll(/<section[^>]*\sid="([^"]+)"/g)].map((m) => m[1]));
  const links = [...nav.matchAll(/href="#([^"]+)"/g)].map((m) => m[1]);
  assert.ok(links.length > 0);
  for (const id of links) assert.ok(ids.has(id), `nav menaut ke #${id} yang tidak ada`);
  // tiap section tampil punya link di nav
  for (const id of ids) assert.ok(links.includes(id), `section #${id} tidak ada di nav`);
});

test('BUG-3: semua section[id] mendapat scroll-margin-top setinggi header', () => {
  const cssFile = walk(join(dist, '_astro'), '.css').map((f) => readFileSync(f, 'utf8')).join('\n');
  assert.match(cssFile, /section\[id\][^{]*\{[^}]*scroll-margin-top:\s*var\(--header-h\)/);
});

const loadJson = (f) => JSON.parse(readFileSync(join(root, 'src/content', `${f}.json`), 'utf8'));
const esc = (s) => s.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;');

test('FR-5: paragraf pembuka profil sama persis dengan site.profil', () => {
  const html = readFileSync(join(dist, 'index.html'), 'utf8');
  const profil = /<section id="profil"[\s\S]*?<\/section>/.exec(html)?.[0];
  assert.ok(profil, 'section profil tidak ada');
  const lead = /<p class="profil-lead"[^>]*>([\s\S]*?)<\/p>/.exec(profil)?.[1];
  assert.equal(lead, esc(loadJson('site')[0].profil));
});

test('FR-7 / GEO-5: kontak di profil dan footer identik (satu sumber site.json)', () => {
  const html = readFileSync(join(dist, 'index.html'), 'utf8');
  const kontak = [...html.matchAll(/<address class="kontak[^"]*"[^>]*>([\s\S]*?)<\/address>/g)].map((m) => m[1]);
  assert.equal(kontak.length, 2, 'harus ada di profil dan footer');
  assert.equal(kontak[0], kontak[1]);
  const s = loadJson('site')[0];
  for (const v of [s.email, s.whatsapp, s.lokasi]) assert.ok(kontak[0].includes(esc(v)), v);
});

test('FR-8 / BR-3: setiap klaim angka tampil bersama sumbernya', () => {
  const html = readFileSync(join(dist, 'index.html'), 'utf8');
  const klaim = loadJson('site')[0].klaimAngka;
  assert.equal((html.match(/class="klaim-item"/g) || []).length, klaim.length);
  for (const k of klaim) assert.ok(html.includes(`Sumber: ${esc(k.sumber)}`), k.label);
});

test('FR-6 / SEC-9: dist hanya memuat legalitas terverifikasi, link bukti pakai rel aman', () => {
  const html = readFileSync(join(dist, 'index.html'), 'utf8');
  const items = loadJson('legalitas');
  const ok = items.filter((i) => i.terverifikasi === true && i.nilai.trim() !== '');
  const blok = /<div class="legal"[\s\S]*?<\/ul>/.exec(html)?.[0] ?? '';
  assert.equal((blok.match(/class="legal-item"/g) || []).length, ok.length);
  for (const i of items.filter((x) => !ok.includes(x))) {
    if (i.nilai.trim() === '' || ok.some((o) => o.nilai === i.nilai)) continue;
    assert.ok(!blok.includes(esc(i.nilai)), `legalitas tak terverifikasi bocor: ${i.label}`);
  }
  for (const m of blok.matchAll(/<a [^>]*>/g)) assert.match(m[0], /rel="noopener noreferrer"/);
});

test('FR-9 / GEO-3: alur punya satu <li> per tahap, durasi dan biaya tiap tahap, kalimat pembuka benar', () => {
  const html = readFileSync(join(dist, 'index.html'), 'utf8');
  const sec = /<section id="alur"[\s\S]*?<\/section>/.exec(html)?.[0];
  assert.ok(sec, 'section alur tidak ada');
  const alur = loadJson('alur');
  const items = sec.match(/<li class="alur-item"[\s\S]*?<\/li>/g) || [];
  assert.equal(items.length, alur.length);
  for (const li of items) {
    assert.match(li, /<dt[^>]*>Durasi<\/dt><dd[^>]*>[^<]+<\/dd>/);
    assert.match(li, /<dt[^>]*>Biaya<\/dt><dd[^>]*>[^<]+<\/dd>/);
  }
  assert.ok(sec.includes(`Terbit lewat ${alur.length} tahap; durasi dan biaya tiap tahap tertulis di bawah.`));
});

test('FR-10 / FR-11: dua grup syarat sebagai h3 + ul tanpa script, CTA penutup ke #ajukan', () => {
  const html = readFileSync(join(dist, 'index.html'), 'utf8');
  const sec = /<section id="alur"[\s\S]*?<\/section>/.exec(html)?.[0];
  const syarat = /<div class="syarat"[\s\S]*<\/section>/.exec(sec)?.[0] ?? '';
  assert.equal((syarat.match(/<h3[^>]*>[^<]+<\/h3>\s*<ul/g) || []).length, 2);
  assert.ok(!/<script/.test(syarat));
  assert.match(syarat, /<a [^>]*class="btn lbl"[^>]*href="#ajukan"/);
});

// BR-12: SLA mengikuti site.json yang sedang dibangun (jalankan build dengan kedua kondisi untuk bukti penuh).
test('FR-12 / BR-12: teks "hari kerja" ada hanya bila slaBalasanHariKerja terisi', () => {
  const html = readFileSync(join(dist, 'index.html'), 'utf8');
  const sla = loadJson('site')[0].slaBalasanHariKerja;
  if (sla) assert.ok(html.includes(`dibalas dalam ${sla} hari kerja`));
  else assert.ok(!html.includes('hari kerja'), 'teks SLA tidak boleh dirender saat null');
});

// t15 / BR-7 / SEC-2: atribut tiap field form, pattern link_naskah, persetujuan, jalur kontak.
const formHtml = () => {
  const html = readFileSync(join(dist, 'index.html'), 'utf8');
  const sec = /<section id="ajukan"[\s\S]*?<\/section>/.exec(html)?.[0];
  assert.ok(sec, 'section ajukan tidak ada');
  return sec;
};
const tagOf = (sec, name) => new RegExp(String.raw`<(input|select|textarea)\b[^>]*\bname="${name}"[^>]*>`).exec(sec)?.[0];
const attr = (tag, a) => new RegExp(String.raw`\s${a}(?:="([^"]*)")?(?=[\s>/])`).exec(tag)?.[1] ?? (new RegExp(String.raw`\s${a}(?=[\s>/])`).test(tag) ? '' : undefined);

test('FR-13 / BR-7: atribut required/minlength/maxlength tiap field', () => {
  const sec = formHtml();
  const spek = {
    nama: { required: true, minlength: '2', maxlength: '100' },
    email: { required: true, type: 'email' },
    peran: { required: true },
    jenis: { required: true },
    judul_atau_topik: { required: true, minlength: '3', maxlength: '200' },
    pesan: { required: true, minlength: '20', maxlength: '1000' },
    institusi: { required: false, maxlength: '150' },
    link_naskah: { required: false, maxlength: '500', type: 'url' },
    persetujuan: { required: true, type: 'checkbox' },
  };
  for (const [name, s] of Object.entries(spek)) {
    const tag = tagOf(sec, name);
    assert.ok(tag, `field ${name} tidak ada`);
    assert.equal(attr(tag, 'required') !== undefined, s.required, `${name} required`);
    for (const k of ['minlength', 'maxlength', 'type']) if (s[k]) assert.equal(attr(tag, k), s[k], `${name} ${k}`);
    assert.ok(new RegExp(String.raw`<label[^>]*\bfor="${name}"`).test(sec), `${name} tanpa label`);
  }
  for (const [name, opsi] of [['peran', ['Mahasiswa', 'Dosen', 'Peneliti', 'Penulis umum', 'Lainnya']], ['jenis', ['Ajukan naskah buku', 'Ajukan artikel jurnal', 'Pertanyaan umum']]]) {
    const sel = new RegExp(String.raw`<select[^>]*name="${name}"[\s\S]*?</select>`).exec(sec)[0];
    const vals = [...sel.matchAll(/<option value="([^"]+)"/g)].map((m) => m[1]);
    assert.deepEqual(vals, opsi);
  }
  assert.ok(!/<script/.test(sec), 'form tanpa JavaScript');
});

test('SEC-2 / BR-8: pattern link_naskah menolak javascript: dan http://, menerima https://x.id/a', () => {
  const tag = tagOf(formHtml(), 'link_naskah');
  const pat = attr(tag, 'pattern');
  assert.equal(pat, 'https://.*');
  const re = new RegExp(String.raw`^(?:${pat})$`, 'v'); // pattern HTML dianchor penuh
  assert.ok(!re.test('javascript:alert(1)'));
  assert.ok(!re.test('http://x.id'));
  assert.ok(re.test('https://x.id/a'));
});

test('FR-17 / SEC-6: persetujuan menaut ke /kebijakan-privasi/', () => {
  const sec = formHtml();
  assert.match(sec, /<label[^>]*for="persetujuan"[^>]*>[\s\S]*?<a href="\/kebijakan-privasi\/"/);
});

test('FR-18: link email dan WhatsApp tampil di samping form', () => {
  const sec = formHtml();
  const site = loadJson('site')[0];
  assert.ok(/<aside\b/.test(sec) && sec.includes(site.email));
  assert.ok(sec.includes(site.whatsapp));
});

// t16 / FR-14 / BUG-2 / SEC-1 / SEC-6: koneksi Web3Forms.
test('FR-14: form POST ke Web3Forms dengan hidden field access_key, subject, from_name, redirect', () => {
  const sec = formHtml();
  const form = /<form\b[^>]*>/.exec(sec)[0];
  assert.match(form, /action="https:\/\/api\.web3forms\.com\/submit"/);
  assert.match(form, /method="POST"/i);
  for (const n of ['access_key', 'subject', 'from_name', 'redirect']) {
    const tag = tagOf(sec, n);
    assert.ok(tag && /type="hidden"/.test(tag), `hidden ${n}`);
  }
  assert.ok(sec.includes('name="subject" value="') && !/name="subject" value(?=[\s>])/.test(sec), 'subject tidak boleh kosong');
});

test('BUG-2: redirect = SITE_URL lingkungan + /terima-kasih/', () => {
  const tag = tagOf(formHtml(), 'redirect');
  assert.equal(attr(tag, 'value'), `${SITE_URL.replace(/\/$/, '')}/terima-kasih/`);
});

test('SEC-1: honeypot botcheck tersembunyi dari pengguna dan teknologi bantu', () => {
  const tag = tagOf(formHtml(), 'botcheck');
  assert.ok(tag);
  assert.equal(attr(tag, 'tabindex'), '-1');
  assert.equal(attr(tag, 'autocomplete'), 'off');
  assert.equal(attr(tag, 'aria-hidden'), 'true');
  assert.ok(!/\brequired\b/.test(tag));
});

test('SEC-6: form-action CSP hanya Web3Forms dan action form sama dengan itu', () => {
  const csp = /Content-Security-Policy:\s*(.*)/.exec(readFileSync(join(dist, '_headers'), 'utf8'))[1];
  assert.equal(/form-action ([^;]+)/.exec(csp)[1].trim(), 'https://api.web3forms.com');
  for (const [p, html] of htmlFiles()) for (const m of html.matchAll(/<form\b[^>]*\baction="([^"]+)"/g)) assert.equal(m[1], 'https://api.web3forms.com/submit', p);
});

// t17 / FR-15 / FR-16 / BR-12: halaman terima kasih.
const tkHtml = () => readFileSync(join(dist, 'terima-kasih', 'index.html'), 'utf8');
test('FR-16: /terima-kasih/ noindex dan tidak ada di sitemap', () => {
  assert.match(tkHtml(), /<meta name="robots" content="noindex"\s*\/?>/);
  for (const f of readdirSync(dist).filter((n) => /^sitemap.*\.xml$/.test(n))) assert.ok(!readFileSync(join(dist, f), 'utf8').includes('terima-kasih'), f);
});
test('FR-15: langkah berikutnya diambil dari tahap 2 alur.json, link kembali ke beranda', () => {
  const t2 = loadJson('alur').find((t) => t.nomor === 2);
  const html = tkHtml();
  assert.ok(html.includes(t2.judul) && html.includes(t2.deskripsi));
  assert.match(html, /<a [^>]*href="\/"/);
  assert.equal((html.match(/<h1\b/g) || []).length, 1);
});
test('BR-12: SLA di /terima-kasih/ hanya bila terisi', () => {
  const sla = loadJson('site')[0].slaBalasanHariKerja;
  const html = tkHtml();
  if (sla) assert.ok(html.includes(`dalam ${sla} hari kerja`));
  else assert.ok(!html.includes('hari kerja'));
});

// t18 / SEC-6 / BR-16: kebijakan privasi.
const kpHtml = () => readFileSync(join(dist, 'kebijakan-privasi', 'index.html'), 'utf8');
test('t18: kebijakan privasi punya satu h1, title <=60, description <=155', () => {
  const html = kpHtml();
  assert.equal((html.match(/<h1\b/g) || []).length, 1);
  assert.ok(/<title>([^<]+)<\/title>/.exec(html)[1].length <= 60);
  assert.ok(/<meta name="description" content="([^"]+)"/.exec(html)[1].length <= 155);
});
test('t18: teks menyebut retensi 12 bulan, Web3Forms, dan Umami; klausul hukum bertanda [verify]', () => {
  const html = kpHtml();
  assert.ok(html.includes('12 bulan') && html.includes('Web3Forms') && html.includes('Umami'));
  assert.ok(html.includes('[verify]'));
});
test('t18: footer dan form menaut ke /kebijakan-privasi/, halaman masuk sitemap', () => {
  const idx = readFileSync(join(dist, 'index.html'), 'utf8');
  assert.match(/<footer[\s\S]*<\/footer>/.exec(idx)[0], /href="\/kebijakan-privasi\/"/);
  assert.match(formHtml(), /href="\/kebijakan-privasi\/"/);
  const sm = readdirSync(dist).filter((n) => /^sitemap-\d+\.xml$/.test(n)).map((n) => readFileSync(join(dist, n), 'utf8')).join('');
  assert.ok(sm.includes('/kebijakan-privasi/'));
});

// FR-19..22, BR-6, BUG-4, BUG-5: katalog. Kondisional terhadap isi buku.json/jurnal.json yang sedang dibangun.
const katBuku = loadJson('buku').filter((i) => i.unggulan && i.status !== 'diarsipkan');
const katJurnal = loadJson('jurnal').filter((i) => i.unggulan && i.status !== 'diarsipkan');
const indexHtml = () => readFileSync(join(dist, 'index.html'), 'utf8');

test('BR-6 / BUG-4: katalog kosong → tanpa #katalog dan tanpa link nav ke #katalog', { skip: katBuku.length + katJurnal.length > 0 }, () => {
  const html = indexHtml();
  assert.ok(!html.includes('id="katalog"'));
  assert.ok(!html.includes('href="#katalog"'));
});

test('FR-19..22 / BUG-5 / SEC-10: kartu katalog sesuai data, sampul berdimensi, lencana, rel', { skip: katBuku.length + katJurnal.length === 0 }, () => {
  const html = indexHtml();
  const sec = html.match(/<section[^>]*id="katalog"[\s\S]*?<\/section>/)?.[0];
  assert.ok(sec, 'section #katalog tidak ada');
  assert.equal((sec.match(/class="[^"]*kartu-buku/g) || []).length, katBuku.length);
  assert.equal((sec.match(/class="[^"]*kartu-jurnal/g) || []).length, katJurnal.length);
  const imgs = [...sec.matchAll(/<img[^>]*>/g)].map((m) => m[0]);
  assert.equal(imgs.length, katBuku.length + katJurnal.length, 'jumlah img');
  for (const t of imgs) {
    assert.match(t, /\swidth="\d+"/, t);
    assert.match(t, /\sheight="\d+"/, t);
    assert.match(t, /\salt="[^"]+"/, t);
  }
  const segera = [...katBuku, ...katJurnal].filter((i) => i.status === 'segera-terbit').length;
  assert.equal((sec.match(/Segera terbit/g) || []).length, segera, 'lencana');
  for (const m of sec.matchAll(/<a[^>]*target="_blank"[^>]*>/g)) assert.match(m[0], /rel="noopener noreferrer"/);
  assert.match(html, /href="#katalog"/);
});

function jsonLdNodes() {
  const html = indexHtml();
  const nodes = [];
  for (const m of html.matchAll(/<script type="application\/ld\+json"[^>]*>([\s\S]*?)<\/script>/g)) {
    const d = JSON.parse(m[1]); // valid JSON, tidak ada </script> mentah di dalamnya
    nodes.push(...(d['@graph'] || [d]));
  }
  return nodes;
}

test('FR-23 / SEC-3: JSON-LD Book/Periodical sama dengan jumlah kartu, valid JSON, tanpa </script> mentah', () => {
  const nodes = jsonLdNodes();
  assert.equal(nodes.filter((n) => n['@type'] === 'Book').length, katBuku.length);
  assert.equal(nodes.filter((n) => n['@type'] === 'Periodical').length, katJurnal.length);
  const html = indexHtml();
  for (const m of html.matchAll(/<script type="application\/ld\+json"[^>]*>([\s\S]*?)<\/script>/g)) assert.ok(!m[1].includes('<'));
  const kartu = (html.match(/class="kartu kartu-(buku|jurnal)/g) || []).length;
  assert.equal(nodes.filter((n) => n['@type'] === 'Book' || n['@type'] === 'Periodical').length, kartu);
});

// FR-24 / FR-26 / BR-2 / SEC-9 / SEC-3: testimoni. Kondisional terhadap testimoni.json yang sedang dibangun.
const testiAll = loadJson('testimoni');
const testiOk = testiAll.filter((t) => t.izin === true && !!t.tanggalIzin);

const mitraAll = loadJson('mitra');

test('FR-26 / BUG-4: testimoni dan mitra kosong → tanpa #testimoni dan tanpa link nav', { skip: testiOk.length > 0 || mitraAll.length > 0 }, () => {
  const html = indexHtml();
  assert.ok(!html.includes('id="testimoni"'));
  assert.ok(!html.includes('href="#testimoni"'));
});

test('FR-24 / SEC-9 / SEC-3: hanya testimoni berizin tampil, kutipan ter-escape, foto beralt', { skip: testiOk.length === 0 }, () => {
  const html = indexHtml();
  const sec = html.match(/<section[^>]*id="testimoni"[\s\S]*?<\/section>/)?.[0];
  assert.ok(sec, 'section #testimoni tidak ada');
  assert.equal((sec.match(/<blockquote/g) || []).length, testiOk.length);
  for (const t of testiAll.filter((x) => !testiOk.includes(x))) assert.ok(!html.includes(esc(t.kutipan)), `tampil tanpa izin: ${t.nama}`);
  for (const t of testiOk) assert.ok(sec.includes(esc(t.kutipan)), `kutipan verbatim hilang: ${t.nama}`);
  assert.ok(!/<script(?![^>]*ld\+json)[^>]*>\s*alert/.test(html));
  for (const m of sec.matchAll(/<img[^>]*>/g)) assert.match(m[0], /\salt="[^"]+"/);
  assert.match(html, /href="#testimoni"/);
});

// FR-25 / SEC-10 / BUG-5: strip logo mitra. Kondisional terhadap mitra.json yang sedang dibangun.
test('FR-25: mitra kosong → tanpa strip logo', { skip: mitraAll.length > 0 }, () => {
  assert.ok(!indexHtml().includes('class="mitra"'));
});

test('FR-25 / SEC-10: logo mitra beralt, berukuran, link eksternal ber-rel', { skip: mitraAll.length === 0 }, () => {
  const html = indexHtml();
  const sec = html.match(/<section[^>]*id="testimoni"[\s\S]*?<\/section>/)?.[0];
  assert.ok(sec, 'section #testimoni tidak ada');
  assert.match(html, /href="#testimoni"/);
  const strip = sec.match(/<ul[^>]*class="[^"]*mitra[^"]*"[\s\S]*?<\/ul>/)?.[0];
  assert.ok(strip, 'strip mitra tidak ada');
  const imgs = [...strip.matchAll(/<img[^>]*>/g)].map((m) => m[0]);
  assert.equal(imgs.length, mitraAll.length);
  for (const i of imgs) {
    assert.match(i, /\salt="[^"]+"/);
    assert.match(i, /\swidth="\d+"/);
    assert.match(i, /\sheight="\d+"/);
  }
  for (const m of strip.matchAll(/<a[^>]*target="_blank"[^>]*>/g)) assert.match(m[0], /rel="noopener noreferrer"/);
});

// FR-27 / FR-28 / SEC-3: FAQ. Kondisional terhadap faq.json yang sedang dibangun.
const faqAll = loadJson('faq');
const faqSec = () => indexHtml().match(/<section[^>]*id="faq"[\s\S]*?<\/section>/)?.[0];

test('BR-6 / BUG-4: FAQ kosong → tanpa #faq dan tanpa link nav', { skip: faqAll.length > 0 }, () => {
  assert.ok(!indexHtml().includes('id="faq"'));
  assert.ok(!indexHtml().includes('href="#faq"'));
});

test('FR-27 / SEC-3: tiap item FAQ jadi <details><summary>, teks ter-escape, tanpa script', { skip: faqAll.length === 0 }, () => {
  const sec = faqSec();
  assert.ok(sec, 'section #faq tidak ada');
  assert.match(indexHtml(), /href="#faq"/);
  assert.equal((sec.match(/<details/g) || []).length, faqAll.length);
  assert.equal((sec.match(/<summary/g) || []).length, faqAll.length);
  for (const f of faqAll) {
    assert.ok(sec.includes(esc(f.pertanyaan)), `pertanyaan hilang: ${f.pertanyaan}`);
    assert.ok(sec.includes(esc(f.jawaban)), `jawaban hilang: ${f.id}`);
  }
  assert.ok(!/<script(?![^>]*ld\+json)/.test(sec), 'script di dalam FAQ');
});

// FR-29 / BUG-6 / GEO-4: JSON-LD FAQPage dari data yang sama dengan <details>.
const faqLd = () =>
  [...indexHtml().matchAll(/<script type="application\/ld\+json"[^>]*>([\s\S]*?)<\/script>/g)]
    .map((m) => JSON.parse(m[1]))
    .flatMap((j) => (j['@graph'] ? j['@graph'] : [j]))
    .filter((n) => n['@type'] === 'FAQPage');

test('FR-29: FAQ kosong → tanpa FAQPage', { skip: faqAll.length > 0 }, () => {
  assert.equal(faqLd().length, 0);
});

test('FR-29 / BUG-6: jumlah Question = jumlah <details> FAQ, teks identik dengan <summary>', { skip: faqAll.length === 0 }, () => {
  const nodes = faqLd();
  assert.equal(nodes.length, 1);
  const qs = nodes[0].mainEntity.filter((q) => q['@type'] === 'Question');
  const sec = faqSec();
  assert.equal(qs.length, (sec.match(/<details/g) || []).length);
  const sums = [...sec.matchAll(/<summary[^>]*>([\s\S]*?)<\/summary>/g)].map((m) => m[1]);
  assert.deepEqual(qs.map((q) => esc(q.name)), sums);
  for (const q of qs) assert.equal(q.acceptedAnswer['@type'], 'Answer');
  for (const m of indexHtml().matchAll(/<script type="application\/ld\+json"[^>]*>([\s\S]*?)<\/script>/g)) assert.ok(!m[1].includes('<'));
});

// FR-30 / SEO-1 / SEO-2 / SEO-4 / BUG-7 / BUG-8: Open Graph, Twitter card, gambar OG, title unik.
const meta = (html, attr, key) => html.match(new RegExp(`<meta ${attr}="${key}" content="([^"]*)"`))?.[1];
const SITE = (process.env.SITE_URL || '').replace(/\/$/, '');

test('FR-30: tiap halaman punya og:title/description/image dan twitter:card', () => {
  for (const [p, html] of htmlFiles()) {
    for (const k of ['og:title', 'og:description', 'og:image', 'og:url']) assert.ok(meta(html, 'property', k), `${p}: ${k}`);
    assert.equal(meta(html, 'name', 'twitter:card'), 'summary_large_image', p);
    assert.ok(meta(html, 'name', 'twitter:image'), `${p}: twitter:image`);
    assert.equal(meta(html, 'property', 'og:title'), html.match(/<title>([^<]*)<\/title>/)[1], `${p}: og:title ≠ title`);
  }
});

test('SEO-4 / BUG-7: og:image menunjuk og.png 1200x630 di host SITE_URL', () => {
  const png = join(dist, 'og.png');
  assert.ok(existsSync(png), 'dist/og.png tidak ada');
  const b = readFileSync(png);
  assert.equal(b.readUInt32BE(16), 1200);
  assert.equal(b.readUInt32BE(20), 630);
  assert.ok(statSync(png).size <= 1024 * 1024, 'og.png > 1 MB');
  for (const [p, html] of htmlFiles()) {
    const img = meta(html, 'property', 'og:image');
    assert.equal(new URL(img).pathname, '/og.png', p);
    assert.equal(img, meta(html, 'name', 'twitter:image'), p);
    if (SITE) assert.equal(new URL(img).host, new URL(SITE).host, `${p}: host og:image`);
    const url = meta(html, 'property', 'og:url');
    assert.equal(url, html.match(/<link rel="canonical" href="([^"]+)"/)[1], `${p}: og:url ≠ canonical`);
  }
});

test('SEO-1 / BUG-8: title unik ≤60 dan description ≤155 di semua halaman', () => {
  const titles = new Map();
  for (const [p, html] of htmlFiles()) {
    const t = html.match(/<title>([^<]*)<\/title>/)?.[1];
    const d = meta(html, 'name', 'description');
    assert.ok(t && t.length <= 60, `${p}: title`);
    assert.ok(d && d.length <= 155, `${p}: description`);
    assert.ok(!titles.has(t), `title kembar: ${t} (${titles.get(t)} dan ${p})`);
    titles.set(t, p);
  }
});

// FR-32 / SEO-5 / GEO-5: Organization + WebSite di `/`, BreadcrumbList hanya di /kebijakan-privasi/. Data dari site.json.
const readDist = (rel) => readFileSync(join(dist, rel), 'utf8');
const ldNodes = (html) => {
  const out = [];
  for (const m of html.matchAll(/<script type="application\/ld\+json"[^>]*>([\s\S]*?)<\/script>/g)) {
    const d = JSON.parse(m[1]);
    out.push(...(d['@graph'] || [d]));
  }
  return out;
};
const escHtml = (s) => s.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;');

test('FR-32: `/` memuat Organization dan WebSite, tanpa BreadcrumbList; privasi memuat BreadcrumbList', () => {
  const home = ldNodes(readDist('index.html')).map((n) => n['@type']);
  assert.equal(home.filter((t) => t === 'Organization').length, 1);
  assert.equal(home.filter((t) => t === 'WebSite').length, 1);
  assert.ok(!home.includes('BreadcrumbList'));
  const kp = ldNodes(readDist('kebijakan-privasi/index.html'));
  const bc = kp.filter((n) => n['@type'] === 'BreadcrumbList');
  assert.equal(bc.length, 1);
  assert.equal(bc[0].itemListElement.length, 2);
  assert.ok(bc[0].itemListElement[1].item.endsWith('/kebijakan-privasi/'));
  assert.ok(!kp.some((n) => n['@type'] === 'Organization'));
});

test('GEO-5 / FR-32: nama, email, lokasi, sameAs di hero/profil, footer, dan JSON-LD sama dengan site.json', () => {
  const s = loadJson('site')[0];
  const html = readDist('index.html');
  const org = ldNodes(html).find((n) => n['@type'] === 'Organization');
  assert.equal(org.name, s.nama);
  assert.equal(org.email, s.email);
  assert.equal(org.address, s.lokasi);
  assert.deepEqual(org.sameAs ?? [], s.sameAs);
  const web = ldNodes(html).find((n) => n['@type'] === 'WebSite');
  assert.equal(web.name, s.nama);
  const foot = html.slice(html.indexOf('<footer'));
  for (const v of [s.nama, s.email, s.lokasi]) {
    assert.ok(foot.includes(escHtml(v)), `footer tanpa "${v}"`);
    assert.ok(html.slice(0, html.indexOf('<footer')).includes(escHtml(v)), `konten (profil/kontak) tanpa "${v}"`);
  }
});
