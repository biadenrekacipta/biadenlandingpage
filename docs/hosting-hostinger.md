# Hosting di Hostinger

Keputusan pemilik: situs statis (`dist/`) di-host di Hostinger (shared/statis, Apache atau LiteSpeed), bukan Cloudflare Pages seperti di PRD. Tidak ada `_headers` atau `_redirects`; semuanya ada di `public/.htaccess` yang ikut ke `dist/`.

Status: belum pernah diuji di Hostinger. `.htaccess` hanya divalidasi secara statis (tes `tests/dist.test.mjs`); semua langkah di bawah harus dicoba pertama kali oleh pemilik.

## 0. Jalur utama: Deploy dari GitHub (branch `deploy`)

Fitur "Deploy dari GitHub" (Git auto-deployment) di hPanel hanya menyalin isi satu branch apa adanya ke `public_html/`, tanpa build. Branch `main` berisi source Astro (bukan situs jadi), jadi Hostinger harus memakai branch `deploy`.

Branch `deploy` dihasilkan otomatis oleh workflow `.github/workflows/publish-deploy-branch.yml` pada setiap push ke `main` (dan manual lewat Run workflow). Workflow: `npm ci`, `npm run build`, `node --test tests/dist.test.mjs`; bila tes lulus, isi `dist/` (termasuk `.htaccess`) dikomit sebagai satu commit baru (`deploy: <sha main>`) lalu di-force-push ke `deploy`. Tidak ada secret selain `GITHUB_TOKEN` bawaan. Branch `deploy` hanya berisi hasil build; jangan diedit tangan (ditimpa pada run berikutnya).

Variabel repo (opsional, Settings → Secrets and variables → Actions → Variables): `SITE_URL` (default `https://biadenrekacipta.com`), `PUBLIC_WEB3FORMS_KEY`, `PUBLIC_UMAMI_ID`. Kosong = analytics/form tanpa key (build mencetak peringatan).

### Langkah klik demi klik

1. GitHub → repo `biadenrekacipta/biadenlandingpage` → Actions → "Publish deploy branch": pastikan run terakhir hijau dan branch `deploy` ada (Code → pilih branch `deploy`). Bila belum ada, klik Run workflow (branch `main`).
2. hPanel → Websites → `biadenrekacipta.com` → Advanced → Git (atau "Hubungkan repositori Git").
3. Pilih GitHub, beri izin Hostinger ke repo `biadenlandingpage`.
4. Pilih repositori `biadenlandingpage`, Branch = `deploy` (bukan `main`). Direktori root: `public_html`.
5. Klik Deploy.
6. Setelah deploy pertama berhasil, aktifkan auto-deploy: Hostinger menyediakan URL webhook di panel Git. Tempel di GitHub → Settings → Webhooks → Add webhook (Content type `application/json`, event Push). Sejak itu tiap push ke `deploy` (oleh workflow) memicu deploy otomatis.
7. Jalankan verifikasi header di bagian 4.

Peringatan deploy pertama: Deploy pertama kali baru aman bila konten sudah tidak memuat `[verify]` (placeholder yang dilarang di produksi; lihat `docs/catatan-sumber-konten.md`). Sebelum itu, situs yang tampil di domain produksi masih berisi placeholder. Selain itu, Deploy menimpa isi `public_html/`: cadangkan dulu isi lama (bagian 6).

Risiko bila Hostinger diarahkan ke `main`: yang tersalin ke `public_html/` adalah source (`src/`, `package.json`, `planything/`, `docs/`, `tests/`, dst.), bukan situs jadi. Halaman tidak jalan (tidak ada `index.html`), dan berkas internal/perencanaan terbuka untuk publik. Selalu pilih `deploy`.

Jalur FTPS di bagian 3 tetap tersedia sebagai opsi; jangan aktifkan keduanya sekaligus ke folder yang sama.

## 1. Domain dan SSL (hPanel)

1. hPanel → Domains: sambungkan domain final ke paket hosting (nameserver Hostinger atau A record sesuai petunjuk hPanel).
2. hPanel → Security → SSL: aktifkan SSL gratis untuk domain dan tunggu status aktif.
3. Aktifkan "Force HTTPS" di hPanel bila ada. `.htaccess` juga memaksa HTTPS, jadi tidak bentrok.

Domain produksi final belum ditentukan: isi di `SITE_URL` (langkah 3).

## 2. Folder tujuan

Produksi: `public_html/` (root domain). Staging: buat subdomain (mis. `staging.<domain>`) di hPanel → Domains → Subdomains; folder default `public_html/staging/` atau yang ditampilkan hPanel. Pakai nilai itu sebagai `HOSTINGER_FTP_DIR` untuk workflow staging. Akhiri path dengan `/`.

Peringatan: action deploy menyinkronkan folder tujuan. File di `HOSTINGER_FTP_DIR` yang tidak ada di `dist/` akan dihapus pada deploy berikutnya. Jangan arahkan ke folder yang berisi file lain.

## 3. Opsional: deploy FTPS (GitHub: variabel dan secret)

Jalur alternatif; jalur utama ada di bagian 0. Settings → Secrets and variables → Actions.

Variables (nilai publik):

| Nama | Isi |
|---|---|
| `DEPLOY_ENABLED` | `true` untuk mengaktifkan workflow. Kosong/lain = job dilewati |
| `SITE_URL` | URL kanonik, mis. `https://domain-final.example` (tanpa slash akhir). Menentukan canonical, sitemap, OG, redirect form |
| `PUBLIC_WEB3FORMS_KEY` | Access key Web3Forms (key publik form; beda untuk staging dan produksi, SEC-5) |
| `PUBLIC_UMAMI_ID` | Website ID Umami (kosong = analytics mati) |

Secrets (kredensial; hanya diisi pemilik, jangan ditempel di chat atau commit):

| Nama | Isi |
|---|---|
| `HOSTINGER_FTP_SERVER` | Host FTP dari hPanel → Files → FTP Accounts |
| `HOSTINGER_FTP_USERNAME` | Username akun FTP |
| `HOSTINGER_FTP_PASSWORD` | Password akun FTP |
| `HOSTINGER_FTP_DIR` | Folder tujuan, mis. `public_html/` |

Buat akun FTP khusus deploy yang dibatasi ke folder tujuan. Workflow `.github/workflows/deploy-hostinger.yml` berjalan pada push ke `main` dan `workflow_dispatch`, hanya bila `DEPLOY_ENABLED == 'true'`. Ia menolak jalan bila `SITE_URL` atau secret kosong, menjalankan `npm run build` dan `tests/dist.test.mjs` dengan `SITE_URL` itu, lalu mengunggah `dist/` lewat FTPS.

Satu environment saja per repo. Untuk staging dan produksi terpisah, salin workflow menjadi berkas kedua dengan variabel/secret berbeda (atau pakai GitHub Environments), setelah produksi terbukti jalan.

### Pilihan action

`SamKirkland/FTP-Deploy-Action` v4.4.0, di-pin ke SHA commit `110f9186c050f71550953127052e77650219c287`. Alasan: action FTP/FTPS yang umum dipakai, sinkronisasi diff (hanya unggah file berubah), mendukung FTPS. Risiko: pihak ketiga yang menerima password FTP; karena itu di-pin ke SHA (bukan tag yang bisa dipindah) dan job hanya punya `contents: read`. Naikkan versi lewat PR terpisah dan cek ulang SHA. Alternatif tanpa pihak ketiga: unggah `dist/` manual lewat File Manager/SFTP.

Action menaruh `.ftp-deploy-sync-state.json` di folder tujuan; `.htaccess` memblokir akses ke berkas itu.

## 4. Verifikasi header

Header butuh `mod_headers`. Bila modul tidak ada, direktif dilewati diam-diam (dibungkus `<IfModule>`) dan CSP TIDAK terkirim. Wajib dicek setelah deploy pertama:

```bash
curl -sI https://domain-final.example/ | grep -iE "content-security-policy|x-content-type-options|referrer-policy|x-frame-options|x-robots-tag"
curl -sI http://domain-final.example/ | head -3          # harus 301 ke https
curl -sI https://domain-final.example/kebijakan-privasi/index.html | grep -i location   # harus 301 ke .../kebijakan-privasi/
curl -sI https://domain-final.example/tidak-ada/ | head -1   # harus 404
curl -sI https://domain-final.example/_astro/<file-css> | grep -i cache-control   # public, max-age=31536000, immutable
```

Yang harus tampil di domain produksi: CSP, `X-Content-Type-Options: nosniff`, `Referrer-Policy`, `X-Frame-Options: DENY`; `X-Robots-Tag` TIDAK ada. Bila header tidak muncul: hubungi dukungan Hostinger untuk memastikan `mod_headers` aktif, atau minta modul/`AllowOverride` diaktifkan. LiteSpeed membaca `.htaccess` Apache tetapi dukungan direktif bisa berbeda; hasil `curl` yang menentukan.

Periksa juga di browser (DevTools → Console) bahwa tidak ada pelanggaran CSP pada halaman, form, dan Umami.

## 5. Staging dan noindex

`.htaccess` mengirim `X-Robots-Tag: noindex, nofollow` bila host diawali `staging.`, `stg.`, `dev.`, `test.`, `preview.`, atau berakhiran `.hostingersite.com` (domain sementara Hostinger; belum diverifikasi bahwa itu pola domain sementara akun ini). Cek: `curl -sI https://staging.domain-final.example/ | grep -i x-robots-tag`. Pakai nama subdomain di daftar itu agar aturan berlaku. Gunakan juga `SITE_URL` staging yang benar dan access key Web3Forms terpisah.

## 6. Backup dan rollback

Tidak ada tombol rollback.

- Sebelum deploy produksi pertama dan sebelum perubahan besar: hPanel → Files → Backups (atau unduh `public_html/` lewat File Manager) dan simpan.
- Rollback (jalur `deploy`): GitHub → Actions → "Publish deploy branch" → Run workflow, pada "Use workflow from" pilih tag/commit `main` sebelumnya yang sehat (workflow membangun ulang dari ref itu dan menimpa `deploy`). Lalu di hPanel klik Deploy ulang (atau tunggu webhook). Syarat: ref itu sudah memuat berkas workflow (commit sebelum workflow ini ditambahkan tidak bisa dipakai); bila tidak, pakai `git revert <sha>` lalu merge ke `main`.
- Jalur FTPS: jalankan workflow `Deploy Hostinger` dengan cara yang sama.
- Catat tanggal percobaan rollback pertama di README setelah benar-benar dicoba (belum dilakukan).

## 7. Batasan

- HSTS belum diaktifkan (sulit dibatalkan); pertimbangkan setelah HTTPS stabil beberapa minggu.
- CDN, rate limit, dan preview per PR dari Cloudflare Pages tidak tersedia; preview per PR digantikan staging manual.
- Ukuran/kuota file dan jumlah koneksi FTP mengikuti paket Hostinger [verify].
