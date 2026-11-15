import type { APIRoute } from 'astro';
import { getEntry, getCollection } from 'astro:content';
import { legalitasTampil, katalogBuku, katalogJurnal, testimoniTampil } from '../lib/visible';
import { sectionTampil } from '../lib/sections';

// FR-31, GEO-1, GEO-5, GEO-7: llms.txt statis saat build. Semua isi dari data konten (site.json dan koleksi), tanpa teks karangan.
// Hanya data yang lolos filter tampil (BR-1, BR-10) yang masuk, jadi yang tersembunyi di halaman juga tersembunyi di sini.
// ponytail: kondisi section diulang dari index.astro; jika bertambah, ekstrak ke satu helper di sections.ts.
export const GET: APIRoute = async ({ site: base }) => {
  const site = (await getEntry('site', 'site'))!.data;
  const legal = legalitasTampil((await getCollection('legalitas')).map((e) => e.data));
  const alur = ((await getCollection('alur')).map((e) => e.data)).sort((a, b) => a.nomor - b.nomor);
  const buku = katalogBuku((await getCollection('buku')).map((e) => e.data));
  const jurnal = katalogJurnal((await getCollection('jurnal')).map((e) => e.data));
  const adaTesti = testimoniTampil((await getCollection('testimoni')).map((e) => e.data)).length > 0 || ((await getCollection('mitra')).map((e) => e.data)).length > 0;
  const ada = sectionTampil({
    profil: true,
    alur: true,
    katalog: buku.length + jurnal.length > 0,
    testimoni: adaTesti,
    faq: ((await getCollection('faq')).map((e) => e.data)).length > 0,
    ajukan: true,
  });
  const origin = new URL('/', base).href;

  const L: string[] = [`# ${site.nama}`, '', `> ${site.ringkasan}`, '', '## Profil', '', site.profil, ''];
  L.push('## Kontak', '', `- Email: ${site.email}`, `- WhatsApp: ${site.whatsapp}`, `- Lokasi: ${site.lokasi}`, '');
  L.push('## Bagian situs', '', ...ada.map((s) => `- [${s.label}](${origin}#${s.id})`), `- [Kebijakan Privasi](${origin}kebijakan-privasi/)`, '');
  if (legal.length) L.push('## Legalitas terverifikasi', '', ...legal.map((l) => `- ${l.label}: ${l.nilai}`), '');
  L.push(`## Alur terbit (${alur.length} tahap)`, '', ...alur.map((t) => `${t.nomor}. ${t.judul}: durasi ${t.durasi}; biaya ${t.biaya}`), '');
  if (buku.length) L.push('## Buku', '', ...buku.map((b) => `- [${b.judul}](${b.link}): ${b.penulis}, ${b.tahun}. ${b.ringkasan}`), '');
  if (jurnal.length) L.push('## Jurnal', '', ...jurnal.map((j) => `- [${j.nama}](${j.link}): ${j.bidang}. ${j.ringkasan}`), '');
  L.push(`Terakhir diperbarui: ${site.lastUpdated}`, '');

  return new Response(L.join('\n'), { headers: { 'Content-Type': 'text/plain; charset=utf-8' } });
};
