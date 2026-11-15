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
