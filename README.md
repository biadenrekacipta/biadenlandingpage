# Biadenrekacipta Landing Page

Situs statis (Astro) untuk penerbit buku dan jurnal akademik. Rencana lengkap: `planything/PRD.md`, daftar kerja: `planything/TASKS.md`.

## Versi terpasang (TC-2)

Hasil `npm ls --depth=0` pada 2026-11-15. Node: lihat `.node-version`.

| Paket | Versi | Jenis |
|---|---|---|
| astro | 7.3.8 | dependencies |
| @astrojs/sitemap | 3.7.5 | dependencies |
| sharp | 0.35.5 | dependencies (opsional di Astro, dipasang eksplisit) |
| @astrojs/check | 0.9.12 | devDependencies |
| typescript | 6.0.3 | devDependencies |
| @lhci/cli | 0.15.1 | devDependencies |

Node: 22 (`.node-version`), terverifikasi dengan v22.12.0 lokal.

## Script npm

| Script | Fungsi |
|---|---|
| `npm run dev` | Server lokal |
| `npm run build` | Build Astro (halaman prerender + server Node) ke `dist/`; entry `dist/server/entry.mjs` |
| `npm run check` | `astro check` (lint + tipe) |
| `npm run test:content` | `node --test tests/content.test.mjs` |
| `npm run test:dist` | `node --test tests/dist.test.mjs` (butuh build dulu) |
| `npm run lhci` | Lighthouse CI |

## Env var

Salin `.env.example` ke `.env`: `SITE_URL`, `PUBLIC_UMAMI_ID`, serta `SMTP_HOST`, `SMTP_PORT`, `SMTP_USER`, `SMTP_PASS`, `MAIL_TO` (form kirim email lewat mailbox Hostinger). Nilai SMTP nyata hanya di hPanel, jangan di berkas.

## Catatan audit dependensi

`npm audit --omit=dev --audit-level=high` bersih (hanya 1 temuan moderate di `astro`, perbaikan tersedia lewat update minor). Temuan high ada di rantai `@lhci/cli` (alat CI, bukan bagian situs). Tahap audit di CI memakai `--omit=dev`; tinjau kembali di t5.

## Skill desain (t2)

Perintah yang dijalankan di root proyek (2026-11-15):

```bash
npx ui-ux-pro-max-cli init --ai claude
npx skills add Leonxlnx/taste-skill -a claude-code -y
npx impeccable install --providers=claude --scope=project
```

Hasil: `.claude/skills/ui-ux-pro-max`, `.claude/skills/design-taste-frontend` (isi taste-skill), `.claude/skills/impeccable` plus agent di `.claude/agents`, dan hook di `.claude/settings.local.json` (menjalankan binary lokal `impeccable hook` setelah Edit/Write dan saat Stop). Cek manual: `npx impeccable detect src`.

Referensi desain ada di `docs/design-reference.md` (GR-12). UI wajib mengikuti file itu.

## Tes

- `npm run test:content` memvalidasi JSON (BR-1/2/3/4/10/11, tanggal). Memakai `--experimental-strip-types` agar bisa mengimpor `src/lib/*.ts` di Node 22.12. `STRICT=1` menggagalkan tes bila masih ada `[verify]` (wajib hijau sebelum rilis produksi, GR-11).
- `npm run test:dist` memeriksa `dist/` (jalankan `npm run build` dulu). `DIST_DIR=<folder>` untuk fixture.

## CI dan branch

`.github/workflows/ci.yml` punya 6 tahap berurutan (tiap tahap `needs` tahap sebelumnya): (1) `astro check`, (2) tes konten, (3) `npm audit --omit=dev --audit-level=high`, (4) gitleaks, (5) CodeQL JS/TS, (6) build, `tests/dist.test.mjs`, lalu `lhci autorun` (preset mobile bawaan Lighthouse). Satu merah memblok merge.

Aturan repo: `main` dilindungi, merge hanya lewat PR dengan semua tahap hijau (atur di GitHub Settings → Branches; belum dilakukan; remote origin ada, belum di-push).

Tahap 3 memakai `--omit=dev` karena temuan high ada di rantai `@lhci/cli` (devDependency, alat CI). Tinjau ulang bila versi `@lhci/cli` diperbarui.

## Konten legalitas dan testimoni (BR-9, SEC-9)

Perubahan `src/content/legalitas.json` dan `src/content/testimoni.json` wajib di-approve satu reviewer selain penulis PR. Editor tidak boleh merge perubahan klaim legalnya sendiri. Item legalitas hanya tampil bila `terverifikasi: true` dan `nilai` terisi; tes `content.test.mjs` dan `dist.test.mjs` memeriksanya.

## Env var (detail)

| Var | Fungsi | Catatan |
|---|---|---|
| `SITE_URL` | URL kanonik, sitemap, OG | Beda per lingkungan: produksi = domain final, staging = URL subdomain staging, lokal = `http://localhost:4321` |
| `SMTP_HOST`, `SMTP_PORT`, `SMTP_USER`, `SMTP_PASS`, `MAIL_TO` | SMTP mailbox Hostinger dan penerima pengajuan | Dibaca saat server jalan; `SMTP_PASS` rahasia, isi di hPanel |
| `PUBLIC_UMAMI_ID` | Website ID Umami | Kosong = script analytics tidak dimuat |

Jangan commit `.env`. Hanya `.env.example` yang masuk repo.

## Edit konten lewat PR

Semua konten ada di `src/content/*.json`. Alur: buat branch, edit JSON, jalankan `npm run test:content` dan `npm run build`, buka PR, tunggu CI hijau, minta review, merge. Jangan edit langsung di `main`. Isi faktual (legalitas, testimoni, angka, tanggal izin, jawaban FAQ) berasal dari penerbit; placeholder `[verify]` tidak lolos build produksi.

## Reviewer kedua (BR-9)

PR yang menyentuh `legalitas.json` atau `testimoni.json` butuh approve satu reviewer selain penulis PR. Penulis tidak boleh approve atau merge perubahannya sendiri. Testimoni hanya tampil bila `izin: true` dan `tanggalIzin` terisi.

## Checklist staf: membuka link naskah (SEC-2)

Link naskah dari form bisa berbahaya (phishing atau malware). Sebelum membuka:

1. Pastikan link berawalan `https://`. Tolak `http://`, `javascript:`, dan skema lain.
2. Baca domain lengkapnya. Waspada domain mirip, subdomain panjang, atau pemendek URL.
3. Jangan unduh atau jalankan file `.exe`, `.zip`, `.js`, atau dokumen yang minta aktifkan makro.
4. Buka di browser terbaru, bukan dari aplikasi lain yang mengeksekusi file otomatis. Jangan login atau isi kata sandi bila diminta.
5. Layanan penyimpanan yang dikenal (Google Drive, Dropbox, OneDrive) lebih aman; tetap periksa pemilik file.
6. Ragu: jangan buka, balas penulis lewat email resmi yang tercatat, dan laporkan ke penanggung jawab.

Situs tidak pernah mengambil (fetch) isi link naskah; hanya staf yang membukanya.

## Gambar (FR-35, TC-9)

Taruh sampul, foto testimoni, dan logo di `src/assets/` (sumber maks 1 MB per berkas; PNG, JPG, WebP, atau AVIF). Di JSON tulis path relatif ke folder itu, mis. `"sampul": "buku/judul.jpg"`. Build mengubahnya jadi WebP sesuai ukuran tampil (hasil maks 200 KB), dan gagal bila berkasnya tidak ada.

## Deploy: Hostinger (Node.js)

Keputusan pemilik (2026-11-16): hosting Hostinger jenis Node.js (Astro `@astrojs/node`, standalone); form kirim email lewat SMTP mailbox Hostinger. Panduan lengkap: [docs/hosting-hostinger.md](docs/hosting-hostinger.md).

- Pengaturan hPanel: build `npm run build`, output `dist`, entry `dist/server/entry.mjs`, Node 22.x, npm. Hostinger membangun sendiri dari GitHub.
- Branch: pilih branch yang berisi perubahan Node.js SSR ini, saat ini `rak-vhs`, bukan `main` (belum memuat adapter, endpoint, dan pembungkus header). Ganti ke `main` setelah di-merge.
- Header keamanan (CSP, nosniff, Referrer-Policy, X-Frame-Options, noindex staging, cache aset) dikirim server Node lewat pembungkus `dist/server/entry.mjs` (`scripts/security-headers.mjs`, `scripts/wrap-entry.mjs`). `public/.htaccess` tidak dipakai di Node (dipertahankan, ditandai).
- Workflow `publish-deploy-branch.yml` dan `deploy-hostinger.yml` (deploy statis) dinonaktifkan; berkas dipertahankan menunggu keputusan pemilik. CI: `.github/workflows/ci.yml` (build + semua tes).

Status: belum diuji di Hostinger. Verifikasi `curl -I` produksi setelah deploy pertama (docs/hosting-hostinger.md bagian 4). Belum ada deploy nyata.

## Rollback

Tidak ada tombol rollback di Hostinger. Rollback = deploy ulang commit/tag sebelumnya yang sehat:

1. Di hPanel pilih commit/branch sehat sebelumnya dan deploy ulang, atau `git revert <sha>` di branch yang dipakai Hostinger lalu push. Hostinger membangun ulang.
2. Cadangan: backup hPanel atau unduhan folder domain sebelum perubahan besar.

Bukti uji rollback: belum dilakukan (butuh deploy nyata). Catat tanggal dan commit di sini setelah dicoba.

## Form pengajuan (SMTP Hostinger)

- Form mengirim POST ke `/api/kirim/` (endpoint Node `src/pages/api/kirim.ts`); CSP `form-action 'self'`. Tidak ada layanan form pihak ketiga (sebelumnya Web3Forms, diganti 2026-11-16).
- Validasi di server, honeypot `botcheck` (terisi = redirect sukses tanpa email), rate limit per IP di memori, batas ukuran body. Sukses: redirect 303 ke `/terima-kasih/`.
- Email dikirim lewat nodemailer ke `MAIL_TO` dari mailbox `SMTP_USER`; `Reply-To` = email pengirim form. SMTP kosong: tidak mengirim, halaman 503, log peringatan.
- Kredensial SMTP hanya di env hPanel; jangan di-commit (GR-7).
- Uji nyata (kirim ke mailbox, honeypot terisi tidak mengirim) belum dilakukan; butuh deploy dan mailbox.

## Catatan sumber konten

Ringkasan asal tiap isian konten dari dokumen klien dan sisa `[verify]`: lihat [docs/catatan-sumber-konten.md](docs/catatan-sumber-konten.md).
