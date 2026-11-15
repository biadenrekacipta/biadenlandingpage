# CLAUDE.md

Aturan untuk agent di proyek landing page Biadenrekacipta. Sumber: `planything/PRD.md` (bagian Guardrails). Salinan guardrail nomor 5 sampai 15 apa adanya; nomor 1 sampai 4 ada di PRD.

## Guardrails

- [GR-5] Agent hanya mengerjakan lingkup task yang diberikan → enforced by review PR.
- [GR-6] Agent tidak menambah dependensi yang tidak ada di Tech Stack → enforced by review `package.json` diff.
- [GR-7] Tidak commit secret → enforced by gitleaks (CI stage 4).
- [GR-8] Tidak menonaktifkan, melewati, atau melonggarkan test → enforced by review + CI.
- [GR-9] Tidak menghapus data atau file konten kecuali task menyebutnya → enforced by review.
- [GR-10] Jika keputusan tidak ada di dokumen ini, agent berhenti dan melapor status `blocked` → enforced by AGENTS.md / CLAUDE.md.
- [GR-11] Agent dilarang mengarang konten faktual: testimoni, legalitas, angka, nama institusi, tanggal izin, jawaban FAQ. Konten berasal dari penerbit; tanpa itu tulis placeholder bertanda `[verify]` yang tidak lolos build produksi → enforced by [BR-1], [BR-2], [BR-3] di tes konten.
- [GR-12] UI mengikuti `docs/design-reference.md`. Jika berkas tidak ada, agent berhenti `blocked` → enforced by AGENTS.md / CLAUDE.md.
- [GR-13] Simplifikasi sengaja ditandai komentar `ponytail:` dengan batas dan jalur upgrade → enforced by review.
- [GR-14] Tidak ada `set:html` untuk konten dari JSON → enforced by tes grep di CI ([SEC-3]).
- [GR-15] Tidak ada script pihak ketiga selain Umami → enforced by `dist.test.mjs` ([SEC-4]).

Keputusan yang tidak ada di PRD: berhenti dan lapor `blocked`. Jangan mengarang konten.
