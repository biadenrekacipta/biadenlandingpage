# Hosting di Hostinger (Node.js)

Keputusan pemilik (2026-11-16): situs berjalan sebagai aplikasi Node.js di Hostinger (Astro adapter `@astrojs/node`, mode `standalone`). Halaman tetap diprerender statis; hanya endpoint form `POST /api/kirim/` yang dinamis dan mengirim email lewat mailbox Hostinger (SMTP). Web3Forms tidak dipakai lagi. Jalur lama (statis Apache + `.htaccess`, branch `deploy`, FTPS) usang; lihat bagian 7.

Status: belum pernah di-deploy ke Hostinger. Kode dan header sudah terbukti lokal (`tests/server.test.mjs` menjalankan `dist/server/entry.mjs` sungguhan). Semua langkah di bawah dicoba pertama kali oleh pemilik.

## 1. Pengaturan aplikasi Node.js di hPanel

| Kolom | Nilai |
|---|---|
| Sumber | Repositori GitHub `biadenrekacipta/biadenlandingpage` |
| Branch | Branch yang berisi perubahan Node.js SSR ini. Saat ini `rak-vhs`, BUKAN `main` (`main` belum memuat adapter Node, endpoint, dan pembungkus header). Setelah `rak-vhs` di-merge ke `main`, ganti ke `main` |
| Framework | Astro (atau "Other" bila tidak ada) |
| Versi Node.js | 22.x (sesuai `.node-version`) |
| Package manager | npm |
| Perintah build | `npm run build` |
| Direktori output | `dist` |
| Entry file | `dist/server/entry.mjs` |

Jangan klik Lanjutkan/Deploy sebelum branch dan entry file benar. `npm run build` menjalankan `astro build` lalu `scripts/wrap-entry.mjs`, yang menjadikan `dist/server/entry.mjs` pembungkus header keamanan (CSP dan kawan-kawan) untuk semua respons, termasuk halaman statis, aset, endpoint, dan 404.

## 2. Variabel lingkungan

Isi di hPanel (Environment variables) langsung oleh pemilik. Nilai rahasia tidak ditulis di repo, di dokumen ini, maupun di chat.

| Nama | Nilai | Kapan dibaca |
|---|---|---|
| `SITE_URL` | `https://biadenrekacipta.com` | Saat build (canonical, sitemap, OG) |
| `PUBLIC_UMAMI_ID` | `50c40988-5e6c-4465-86d7-88662f0b81f4` | Saat build (ID publik Umami) |
| `SMTP_HOST` | `smtp.hostinger.com` | Saat jalan |
| `SMTP_PORT` | `465` (SSL) | Saat jalan |
| `SMTP_USER` | alamat mailbox pengirim yang dibuat di hPanel (Emails) | Saat jalan |
| `SMTP_PASS` | password mailbox itu; diisi pemilik sendiri | Saat jalan |
| `MAIL_TO` | alamat penerima pengajuan (staf penerbit) | Saat jalan |

Catatan:

- `SITE_URL` dan `PUBLIC_UMAMI_ID` ikut tertanam ke halaman statis. Setel keduanya SEBELUM build; mengubahnya berarti build ulang (deploy ulang).
- `SMTP_*` dan `MAIL_TO` dibaca saat server jalan. Bila salah satunya kosong, endpoint tidak mengirim email, mencatat peringatan di log, dan membalas halaman 503 "Form belum aktif" (server tidak crash).
- `HOST` dan `PORT`: Hostinger biasanya menyetel `PORT` sendiri; entry membacanya dan memakai `0.0.0.0` bila `HOST` tidak diisi sesuai konfigurasi adapter. Jangan menyetel `PORT` kecuali diminta panel.
- Buat mailbox dulu: hPanel → Emails → buat akun email di domain, lalu pakai alamat dan password-nya untuk `SMTP_USER` dan `SMTP_PASS`.

## 3. Domain dan SSL

1. hPanel → Domains: sambungkan `biadenrekacipta.com` ke aplikasi Node.js.
2. hPanel → Security → SSL: aktifkan SSL gratis dan tunggu status aktif.
3. Aktifkan "Force HTTPS" bila ada. Server Node tidak memaksa HTTPS sendiri (`public/.htaccess` tidak berlaku di Node).

Peringatan deploy pertama: konten produksi tidak boleh memuat placeholder `[verify]` (GR-11; lihat `docs/catatan-sumber-konten.md`). Cek `STRICT=1 npm run test:content` sebelum mengarahkan domain.

## 4. Verifikasi header setelah deploy

Header dikirim oleh server Node (bukan Apache), jadi tidak bergantung `mod_headers`. Tetap wajib dicek:

```bash
curl -sI https://biadenrekacipta.com/ | grep -iE "content-security-policy|x-content-type-options|referrer-policy|x-frame-options|x-robots-tag"
curl -sI https://biadenrekacipta.com/_astro/<file-css> | grep -iE "content-security-policy|cache-control"
curl -sI https://biadenrekacipta.com/tidak-ada/ | head -1
curl -sI -X POST https://biadenrekacipta.com/api/kirim/ | head -5
```

Yang harus tampil di produksi: CSP (`form-action 'self'`, tanpa domain pihak ketiga selain Umami), `X-Content-Type-Options: nosniff`, `Referrer-Policy`, `X-Frame-Options: DENY`; `X-Robots-Tag` TIDAK ada. Aset di `/_astro/` dan `/fonts/` memakai `Cache-Control: public, max-age=31536000, immutable`. URL tidak dikenal mengembalikan 404 dengan header yang sama.

Periksa juga di browser (DevTools → Console) bahwa tidak ada pelanggaran CSP pada halaman, form, dan Umami.

Uji form: kirim satu pengajuan nyata dari produksi; email masuk ke `MAIL_TO` (balas ke pengirim lewat Reply-To) dan browser mendarat di `/terima-kasih/`. Kirim satu dengan kolom honeypot terisi (hanya bisa lewat curl): tidak ada email.

## 5. Staging dan noindex

Server mengirim `X-Robots-Tag: noindex, nofollow` bila host diawali `staging.`, `stg.`, `dev.`, `test.`, atau `preview.`, atau berakhiran `.hostingersite.com` (pola domain sementara Hostinger; belum diverifikasi bahwa itu pola domain akun ini). Pakai salah satu nama itu untuk staging, dengan `SITE_URL` staging, mailbox/`MAIL_TO` uji, dan aplikasi Node terpisah.

## 6. Backup dan rollback

Tidak ada tombol rollback bawaan.

- Sebelum deploy produksi pertama dan sebelum perubahan besar: catat commit yang sedang jalan dan, bila ada berkas lain di folder domain, unduh lewat hPanel → Files → Backups atau File Manager.
- Rollback: di hPanel ganti branch/commit ke yang sehat sebelumnya dan deploy ulang, atau `git revert <sha>` di branch yang dipakai Hostinger lalu push (deploy ulang otomatis bila auto-deploy aktif). Aplikasi membangun sendiri, jadi tidak perlu mengunggah apa pun.
- Catat tanggal percobaan rollback pertama di README setelah benar-benar dicoba (belum dilakukan).

## 7. Jalur lama (usang)

Tidak berlaku untuk hosting Node.js dan sudah dinonaktifkan (berkas tidak dihapus, menunggu keputusan pemilik):

- Branch `deploy` yang dihasilkan `.github/workflows/publish-deploy-branch.yml` (hasil build statis tanpa server; endpoint form tidak ada di dalamnya).
- Deploy FTPS lewat `.github/workflows/deploy-hostinger.yml` (hanya mengunggah `dist/` statis).
- `public/.htaccess` (Apache/LiteSpeed): tidak dibaca oleh Node. Header kini dikirim `dist/server/entry.mjs`.

## 8. Batasan

- HSTS belum diaktifkan (sulit dibatalkan); pertimbangkan setelah HTTPS stabil beberapa minggu.
- Rate limit form disimpan di memori proses (lihat `buatLimiter` yang dipakai `src/pages/api/kirim.ts`); hilang saat restart dan tidak dibagi antarinstance. Cukup untuk satu proses.
- CDN dan preview per PR dari Cloudflare Pages tidak tersedia; preview digantikan staging manual.
- Kuota SMTP, jumlah email per jam, dan batas resource paket Node.js mengikuti paket Hostinger [verify].
