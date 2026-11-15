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
- [ ] Host `*.pages.dev` mengirim `X-Robots-Tag: noindex` (`curl -I <url-preview>`).

## 3. Batas domain access key Web3Forms (SEC-5)

- [ ] Di dashboard Web3Forms, access key produksi dibatasi ke domain produksi. Catat tanggal dan nama pelaksana.
- [ ] Key preview terpisah dari key produksi dan diisi lewat env Cloudflare Pages tingkat preview.
- [ ] `PUBLIC_WEB3FORMS_KEY` terisi di env produksi; tidak ada key di repo (gitleaks bersih).
- [ ] Kirim satu submission uji dari domain produksi: email masuk ke staf dan URL akhir `/terima-kasih/`.
- [ ] Kirim satu submission dengan `botcheck` terisi: tidak ada email masuk.

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
- [ ] Cek kuota Web3Forms dan Umami di dashboard masing-masing (TC-5).
- [ ] Cek persentase spam terhadap total submission (KILL-3, dua bulan berturut-turut).
- [ ] Hapus submission uji dan data yang melewati retensi 12 bulan (BR-16).

## 6. Konten dan data nyata

- [ ] `site.json`, `legalitas.json`, `alur.json`, `syarat.json`, `faq.json` terisi dari penerbit; legalitas dan testimoni ditinjau reviewer kedua (BR-9).
- [ ] Katalog, testimoni berizin, dan logo mitra diisi dari penerbit; gambar berada di `src/assets/` (sumber ≤ 1 MB).
- [ ] `PUBLIC_UMAMI_ID` terisi; dashboard Umami mencatat pageview, event `cta-ajukan`, dan kunjungan `/terima-kasih/`.
- [ ] `curl -I` produksi menampilkan CSP, `X-Content-Type-Options: nosniff`, dan `Referrer-Policy`.
- [ ] Rollback (tombol Rollback Cloudflare Pages atau `git revert`) sudah dicoba sekali; tanggal dicatat di README.
