# Catatan sumber konten

Sumber: "Jawaban Tugas Klien - PT Biaden Reka Cipta.docx" (2 November 2026), dari penerbit (sah menurut GR-11). Hanya fakta yang tertulis jelas di dokumen yang dipakai. Sisanya tetap `[verify]`.

## Terisi
| Berkas | Isian | Bagian dokumen |
|---|---|---|
| site.json | `tagline` (apa adanya, bahasa Inggris) | "ABOUT US", judul |
| site.json | `ringkasan`, `profil` (ringkasan bahasa Indonesia dari teks About) | "ABOUT US", "Our Journals" |
| site.json | `email` | A1, "Email PT" (sementara; klien menandainya "mungkin belum aman") |
| site.json | `whatsapp` | A1, "Contact PT: 0859-3454-2215" ditulis `+62 859-3454-2215` agar tautan wa.me benar. SEMENTARA: dokumen tidak menyebut nomor ini WhatsApp |
| faq.json `alur` | alur artikel jurnal saja | Manuscript Submission Process |
| jurnal.json | `nama` tiga jurnal (singkatan + judul resmi) | A2, "Our Journals" |
| jurnal.json | `bidang`, `ringkasan` | Narasi Focus & Scope (bagian B) |
| jurnal.json | `issn: null` | B, "ISSN cetak/online": belum ada, menunggu terbitan pertama |
| faq.json `review` | double-blind, min. 2 reviewer, tahapan, empat keputusan | Peer Review Process |
| faq.json `jadwal` (baru) | 2x setahun, Juni dan Desember | Publication Frequency |
| faq.json `issn` (baru) | ISSN belum ada | B, ISSN |
| faq.json `syarat` | syarat artikel jurnal saja | Manuscript Submission Process, Step 2; C5 |
| syarat.json `jurnal` | tujuh butir | Manuscript Submission Process, Step 1-3; C5 |
| faq.json `durasi` | bagian jurnal saja: tahapan sebelum terbit dan edisi Juni/Desember, tanpa angka hari | Publication Frequency; Peer Review Process |

## Masih `[verify]`
- jurnal.json: `sampul`, `sampulAlt`, `link` (alamat situs jurnal di dokumen masih "…………"; sampul "dapat dibuat setelah nama, volume/nomor, periode, desain disepakati"). `unggulan` tetap false.
- faq.json: `biaya`, `isbn`; bagian buku di `alur`, `syarat`, `durasi`.
- syarat.json `buku`.
- site.json: `lokasi`, `sameAs`, SLA, `klaimAngka`. `profil` belum menyebut lokasi.
- legalitas, alur, buku, mitra, testimoni: tidak ada data di dokumen.
- kebijakan-privasi.astro: klausul hukum UU PDP (pengendali data, dasar hukum, lokasi pemrosesan, retensi, hak subjek data) menunggu tinjauan hukum.
- Gambar: `src/assets/` belum ada. Logo penerbit/jurnal dan banner ada di Google Drive (tautan di docx); belum diunduh.

## Kenapa section Alur tidak disembunyikan
`alur.json` seluruhnya `[verify]`, tetapi `dist.test.mjs` mewajibkan `<section id="alur">` ada (FR-9, SEO-7, GEO-3) dan FR-15 memakai tahap 2 sebagai "langkah berikutnya" setelah form. Menyembunyikannya berarti melonggarkan tes (GR-8). Mengganti tahapnya dengan 7 langkah OJS juga tidak dilakukan: alur di situs ini adalah alur pengajuan lewat form penerbit, dan tidak ada sumber durasi/biaya per tahap. Perlu keputusan pemilik (pertanyaan 4).

## Kontradiksi dan catatan
- Daftar bullet Focus & Scope menukar judul BEDSOCART dan BECONEX (bullet BEDSOCART berisi bisnis/ekonomi, bullet BECONEX berisi pendidikan/sosial). Dipakai: A2, "Our Journals", dan narasi Focus & Scope, yang konsisten satu sama lain.
- Ejaan "BITECNOS" muncul di tabel redaksi dan slug (`biacipta-bitecnos`); dipakai "BITECHNOS" (A2, narasi). Pemilik perlu memastikan.
- Butir "DOCX" dan "PDF pendamping" berasal dari tabel C5 berkolom "Rekomendasi"; belum ada tanda persetujuan pemilik di dokumen.
- Kebijakan CC BY 4.0 (C3), captcha (A3), tampilan ponsel (C4), dan open peer review (C1) belum diputuskan pemilik; tidak dipakai.

## Pertanyaan untuk pemilik
1. Kontak resmi: dokumen menyebut biadenrekacipta@gmail.com dan 0859-3454-2215 sebagai kontak PT, tetapi menandai email Gmail "mungkin belum aman". Tetap dipakai di situs? Nomor itu WhatsApp atau telepon biasa?
2. Lokasi penerbit: kota dan alamat lengkap (`site.lokasi`, juga dipakai JSON-LD `address`).
3. Alamat situs ketiga jurnal (di dokumen masih "…………"). Ejaan final BITECHNOS atau BITECNOS (slug `biacipta-bitecnos`)?
4. Alur terbit di beranda: tahap apa saja (judul, deskripsi, penanggung jawab, output), durasi tiap tahap, dan biaya tiap tahap. Bila biaya tidak dipublikasikan, setuju ditulis "Dikonfirmasi tertulis sebelum kontrak" (BR-11)? Alurnya untuk buku, jurnal, atau keduanya?
5. Biaya penerbitan buku dan artikel jurnal (APC), atau gratis?
6. Lama proses: perkiraan hari/minggu untuk buku dan untuk artikel jurnal.
7. Buku: apakah mendapat ISBN, syarat naskah buku, dan daftar buku yang sudah terbit (judul, penulis, tahun, ISBN, sampul, tautan).
8. Legalitas: nomor/akta badan hukum, NIB, keanggotaan asosiasi (mis. IKAPI), beserta tautan bukti.
9. Testimoni penulis (dengan izin tertulis dan tanggal izin) dan logo mitra/institusi.
10. Akun media sosial resmi untuk `sameAs`, dan target hari kerja balasan pengajuan (SLA).
11. Kebijakan privasi: badan hukum pengendali data, dasar hukum, retensi, dan hak subjek data perlu ditinjau pihak hukum.
12. Lisensi CC BY 4.0 (C3): setuju atau kebijakan lain?
13. Berkas gambar: taruh logo penerbit, logo tiap jurnal, dan banner dari folder Google Drive ke `src/assets/` (PNG/JPG/WebP/AVIF, maks 1 MB per berkas). Sampul terbitan menyusul setelah volume/nomor disepakati.

Data pribadi dari tabel redaksi (nama dan email akun uji) sengaja tidak dimasukkan.
