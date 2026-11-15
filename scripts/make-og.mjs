// Sekali jalan: membuat public/og.png (1200x630) dari template SVG memakai token desain. Hasil PNG di-commit.
// Pakai: node scripts/make-og.mjs   (sharp sudah terpasang)
// ponytail: hanya nama + deskripsi generik; tagline di site.json masih placeholder [verify], jadi tidak dipakai. Tanpa foto (GR-11).
// Font: librsvg tidak bisa memakai woff2, jadi pakai serif sistem. Upgrade: render dari HTML bila butuh font Newsreader.
import sharp from 'sharp';
import { readFileSync, writeFileSync } from 'node:fs';

const site = JSON.parse(readFileSync(new URL('../src/content/site.json', import.meta.url), 'utf8'))[0];
const esc = (s) => s.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;');
const PAPER = '#edebe6', INK = '#141414', COBALT = '#1f3fb0', MUTED = '#6d6a63';
const svg = `<svg xmlns="http://www.w3.org/2000/svg" width="1200" height="630" viewBox="0 0 1200 630">
  <rect width="1200" height="630" fill="${PAPER}"/>
  <rect x="64" y="64" width="1072" height="2" fill="${INK}"/>
  <rect x="64" y="564" width="1072" height="2" fill="${INK}"/>
  <rect x="64" y="64" width="12" height="502" fill="${COBALT}"/>
  <text x="120" y="330" font-family="Georgia, 'Times New Roman', serif" font-size="112" fill="${INK}" letter-spacing="-2">${esc(site.nama)}</text>
  <text x="120" y="410" font-family="Arial, Helvetica, sans-serif" font-size="36" fill="${MUTED}">Penerbit buku dan jurnal akademik</text>
</svg>`;
const out = await sharp(Buffer.from(svg)).png({ compressionLevel: 9 }).toBuffer();
writeFileSync(new URL('../public/og.png', import.meta.url), out);
console.log(`public/og.png ${out.length} bytes`);
