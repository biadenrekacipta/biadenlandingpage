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
