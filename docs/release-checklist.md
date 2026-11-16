# Checklist rilis

Isi tiap kotak dengan bukti (tangkapan layar, URL, tanggal, nama pelaksana). Kotak kosong berarti belum dikerjakan. Dokumen ini tidak berisi hasil; hasil dicatat di PR rilis.

## 1. Sebelum rilis (otomatis)

- [ ] `npm run check`, `npm run build`, `npm run test:content`, `npm run test:dist` hijau.
- [ ] `STRICT=1 npm run test:content` hijau: tidak ada penanda `[verify]` tersisa (GR-11). Jika masih ada, konten belum siap rilis.
- [ ] `npm run lhci` hijau untuk `/` dan `/kebijakan-privasi/` (mobile): Performance ≥ 0,9 (KILL-4), SEO ≥ 0,95, Accessibility ≥ 0,95, CLS < 0,1, LCP < 2500 ms.
- [ ] `npm audit --omit=dev --audit-level=high` tanpa temuan; gitleaks (CI tahap 4) bersih.
- [ ] CI 6 tahap hijau pada PR rilis.

## 2. Verifikasi Google Search Console dan sitemap (SEO-12)

- [ ] Properti domain produksi diverifikasi di Google Search Console (DNS atau tag meta).
- [ ] `https://<domain>/sitemap-index.xml` disubmit di menu Sitemaps; statusnya "Success".
- [ ] Tangkapan layar verifikasi dan status sitemap dilampirkan di PR rilis.
- [ ] `https://<domain>/robots.txt` menunjuk ke sitemap yang sama; `/terima-kasih/` tidak ada di sitemap.
- [ ] Host staging mengirim `X-Robots-Tag: noindex` dan produksi tidak (`curl -I`, lihat docs/hosting-hostinger.md bagian 5).

## 3. Form SMTP Hostinger (SEC-1, SEC-5)

- [ ] Mailbox pengirim dibuat di hPanel; `SMTP_HOST`, `SMTP_PORT`, `SMTP_USER`, `SMTP_PASS`, `MAIL_TO` diisi di env hPanel oleh pemilik. Tidak ada kredensial di repo (gitleaks bersih).
- [ ] Branch yang dipilih di hPanel memuat perubahan Node.js SSR (saat ini `rak-vhs`, bukan `main`); entry file `dist/server/entry.mjs`.
- [ ] Kirim satu submission uji dari domain produksi: email masuk ke `MAIL_TO`, Reply-To = email pengirim, dan URL akhir `/terima-kasih/`.
- [ ] Kirim satu submission dengan `botcheck` terisi (curl): tidak ada email masuk.
- [ ] `curl -I` produksi pada halaman, aset `/_astro/`, 404, dan `POST /api/kirim/` menampilkan CSP (`form-action 'self'`), nosniff, Referrer-Policy, `X-Frame-Options: DENY`.

## 4. Tes 5 detik dengan 5 orang (target ≥ 4 dari 5)

Peserta: 5 orang dari target pengguna (mahasiswa, dosen, peneliti, penulis umum). Tampilkan beranda (mobile) selama 5 detik, lalu tanyakan:

1. Penerbit ini menerbitkan apa?
2. Bagaimana cara mengajukan naskah?

- [ ] Hasil per peserta dicatat (benar/salah untuk tiap pertanyaan, tanpa data pribadi).
- [ ] Jumlah peserta yang menjawab kedua pertanyaan dengan benar: ___ dari 5. Target ≥ 4.
- [ ] Jika di bawah target, catat temuan dan perbaiki hero/profil sebelum rilis.

## 5. Tes submission bulanan

Ulangi tiap bulan setelah rilis:

- [ ] Kirim satu submission uji lewat form produksi; email masuk ke staf dalam jam kerja.
- [ ] Cek kuota email/jam mailbox Hostinger dan kuota Umami (TC-5).
- [ ] Cek persentase spam terhadap total submission (KILL-3, dua bulan berturut-turut).
- [ ] Hapus submission uji dan email yang melewati retensi 12 bulan (BR-16) dari mailbox.

## 6. Konten dan data nyata

- [ ] `site.json`, `legalitas.json`, `alur.json`, `syarat.json`, `faq.json` terisi dari penerbit; legalitas dan testimoni ditinjau reviewer kedua (BR-9).
- [ ] Katalog, testimoni berizin, dan logo mitra diisi dari penerbit; gambar berada di `src/assets/` (sumber ≤ 1 MB).
- [ ] `PUBLIC_UMAMI_ID` terisi; dashboard Umami mencatat pageview, event `cta-ajukan`, dan kunjungan `/terima-kasih/`.
- [ ] `curl -I` produksi menampilkan CSP, `X-Content-Type-Options: nosniff`, dan `Referrer-Policy` (dikirim server Node, bukan `.htaccess`).
- [ ] Rollback (deploy ulang commit/tag sebelumnya atau `git revert`) sudah dicoba sekali; tanggal dicatat di README.

## 7. Rak jurnal (rak.js, keputusan 2026-11-16)

- [ ] Header CSP produksi (`curl -I`) tidak diubah, dan konsol bersih dari pelanggaran CSP di desktop dan mobile saat rak dipakai (geser, buka detail, tutup).
- [ ] Tanpa JS (matikan JavaScript di browser): tiga jurnal tampil sebagai deret statis dengan satu sampul terbuka, tab dan tombol rak tidak muncul.
- [ ] Sampul dan punggung tipografis diganti gambar asli penerbit bila sudah ada (`sampul` bukan `[verify]`); tombol "Lihat jurnal" muncul hanya bila `link` berupa URL https.
- [ ] Cek visual 1440 px dan 375 px, `prefers-reduced-motion: reduce`, dan keyboard (kiri/kanan, Enter, Escape, fokus kembali ke tombol putar).
