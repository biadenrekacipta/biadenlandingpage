import type { APIRoute } from 'astro';
import nodemailer from 'nodemailer';
import { validasi, susunEmail, buatLimiter } from '../../lib/pengajuan.ts';

// Hanya endpoint ini yang dirender saat request; semua halaman lain statis.
export const prerender = false;

const MAKS_BODY = 10 * 1024;
const izinkan = buatLimiter();

const halaman = (status: number, judul: string, pesan: string) =>
  new Response(
    `<!doctype html><html lang="id"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"><meta name="robots" content="noindex"><title>${judul}</title></head><body style="font:18px/1.5 Georgia,serif;max-width:40rem;margin:4rem auto;padding:0 1rem"><h1>${judul}</h1><p>${pesan}</p><p><a href="/#ajukan">Kembali ke form</a></p></body></html>`,
    { status, headers: { 'Content-Type': 'text/html; charset=utf-8', 'Cache-Control': 'no-store' } },
  );

export const POST: APIRoute = async ({ request, clientAddress, redirect }) => {
  const tipe = (request.headers.get('content-type') ?? '').split(';')[0]?.trim().toLowerCase();
  if (tipe !== 'application/x-www-form-urlencoded') return halaman(415, 'Permintaan tidak didukung', 'Kirim lewat form di situs.');
  if (Number(request.headers.get('content-length') ?? 0) > MAKS_BODY) return halaman(413, 'Kiriman terlalu besar', 'Persingkat pesan Anda lalu kirim ulang.');
  const teks = await request.text();
  if (teks.length > MAKS_BODY) return halaman(413, 'Kiriman terlalu besar', 'Persingkat pesan Anda lalu kirim ulang.');
  const form = new URLSearchParams(teks);

  // Honeypot: bot mengisinya. Balas seolah sukses, jangan kirim email.
  if (form.get('botcheck')) return redirect('/terima-kasih/', 303);

  let ip = 'tidak-diketahui';
  try { ip = clientAddress; } catch { /* tanpa alamat klien */ }
  if (!izinkan(ip)) return halaman(429, 'Terlalu banyak kiriman', 'Coba lagi beberapa menit lagi.');

  const hasil = validasi(form);
  if (!hasil.ok) return halaman(400, 'Isian belum lengkap', hasil.galat);

  const { SMTP_HOST, SMTP_PORT, SMTP_USER, SMTP_PASS, MAIL_TO } = process.env;
  if (!SMTP_HOST || !SMTP_USER || !SMTP_PASS || !MAIL_TO) {
    console.warn('[kirim] SMTP_HOST/SMTP_USER/SMTP_PASS/MAIL_TO belum diisi: email tidak dikirim.');
    return halaman(503, 'Form belum aktif', 'Form belum dapat mengirim saat ini. Hubungi kami lewat email atau WhatsApp.');
  }
  try {
    const port = Number(SMTP_PORT) || 465;
    const pengirim = nodemailer.createTransport({ host: SMTP_HOST, port, secure: port === 465, auth: { user: SMTP_USER, pass: SMTP_PASS } });
    await pengirim.sendMail(susunEmail(hasil.data, SMTP_USER, MAIL_TO));
  } catch (e) {
    // Jangan bocorkan detail SMTP ke klien; log hanya kode galat.
    console.error('[kirim] gagal kirim email:', (e as { code?: string }).code ?? 'tak dikenal');
    return halaman(502, 'Pengiriman gagal', 'Pengajuan belum terkirim. Coba lagi nanti atau hubungi kami lewat email atau WhatsApp.');
  }
  return redirect('/terima-kasih/', 303);
};

// Metode lain ditolak (GET ke endpoint tidak punya halaman).
export const ALL: APIRoute = () => new Response(null, { status: 405, headers: { Allow: 'POST' } });
