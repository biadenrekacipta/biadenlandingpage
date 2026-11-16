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
| `npm run build` | Build statis ke `dist/` |
| `npm run check` | `astro check` (lint + tipe) |
| `npm run test:content` | `node --test tests/content.test.mjs` |
| `npm run test:dist` | `node --test tests/dist.test.mjs` (butuh build dulu) |
| `npm run lhci` | Lighthouse CI |

## Env var

Salin `.env.example` ke `.env`: `SITE_URL`, `PUBLIC_WEB3FORMS_KEY`, `PUBLIC_UMAMI_ID`.

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
| `PUBLIC_WEB3FORMS_KEY` | Access key Web3Forms untuk form pengajuan | Key publik form; jangan pakai secret lain di var `PUBLIC_*` |
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

## Deploy: Hostinger

Keputusan pemilik: hosting di Hostinger (statis, Apache/LiteSpeed), bukan Cloudflare Pages seperti di PRD. Panduan lengkap: [docs/hosting-hostinger.md](docs/hosting-hostinger.md).

- Header keamanan (CSP, nosniff, Referrer-Policy), paksa HTTPS, clean URL, ErrorDocument 404, cache aset, dan noindex untuk host staging ada di `public/.htaccess` (ikut ke `dist/`). `_headers` dan `_redirects` Cloudflare sudah dihapus; tesnya dipindah ke `.htaccess` di `tests/dist.test.mjs`.
- Workflow `.github/workflows/deploy-hostinger.yml` (push ke `main` dan manual) mengunggah `dist/` lewat FTPS, hanya bila variabel repo `DEPLOY_ENABLED` = `true`. Variabel: `SITE_URL`, `PUBLIC_WEB3FORMS_KEY`, `PUBLIC_UMAMI_ID`. Secret: `HOSTINGER_FTP_SERVER`, `HOSTINGER_FTP_USERNAME`, `HOSTINGER_FTP_PASSWORD`, `HOSTINGER_FTP_DIR`. Tidak ada kredensial di repo.
- Build: `npm run build`, output `dist`, Node sesuai `.node-version` (22).

Status: belum diuji di Hostinger. `.htaccess` hanya divalidasi statis (balance `<IfModule>`, isi direktif); tidak ada Apache lokal. Header butuh `mod_headers`: verifikasi dengan `curl -I` setelah deploy pertama. Belum ada domain final, akun FTP, atau deploy nyata.

## Rollback

Tidak ada tombol rollback di Hostinger. Rollback = deploy ulang commit/tag sebelumnya yang sehat:

1. `git revert <sha>` pada commit bermasalah di `main`, buka PR, merge; workflow deploy mengunggah ulang. Atau jalankan workflow `Deploy Hostinger` secara manual dari tag/commit lama.
2. Cadangan: backup hPanel atau unduhan `public_html/` sebelum perubahan besar.

Bukti uji rollback: belum dilakukan (butuh deploy nyata). Catat tanggal dan commit di sini setelah dicoba.

## Form pengajuan (Web3Forms)

- Form mengirim POST langsung ke `https://api.web3forms.com/submit`; CSP `form-action` hanya mengizinkan host itu.
- Access key dibaca dari env `PUBLIC_WEB3FORMS_KEY`; jangan di-commit. Build mencetak peringatan bila kosong.
- `redirect` = `${SITE_URL}/terima-kasih/`, jadi tiap lingkungan mendarat di domainnya sendiri (BUG-2).
- Keputusan: key staging terpisah dari key produksi. Set `PUBLIC_WEB3FORMS_KEY` per lingkungan (variabel repo GitHub untuk staging dan produksi). Key produksi dibatasi ke domain produksi di dashboard Web3Forms (SEC-5).
- Honeypot `botcheck` disembunyikan dari pengguna. Uji kirim dengan `botcheck` terisi harus ditolak layanan (belum diuji, butuh key).

## Catatan sumber konten

Ringkasan asal tiap isian konten dari dokumen klien dan sisa `[verify]`: lihat [docs/catatan-sumber-konten.md](docs/catatan-sumber-konten.md).
