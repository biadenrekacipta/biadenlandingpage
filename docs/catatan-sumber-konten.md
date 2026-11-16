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

## Masih `[verify]`
- jurnal.json: `sampul`, `sampulAlt`, `link` (alamat situs jurnal di dokumen masih "…………"; sampul "dapat dibuat setelah nama, volume/nomor, periode, desain disepakati"). `unggulan` tetap false.
- faq.json: `alur`, `durasi`, `biaya`, `isbn`; bagian buku di `syarat`.
- syarat.json `buku`.
- site.json: `lokasi`, `sameAs`, SLA, `klaimAngka`. `profil` belum menyebut lokasi.
- faq.json `alur`: bagian buku.
- legalitas, alur, buku, mitra, testimoni: tidak ada data di dokumen.

## Kontradiksi dan catatan
- Daftar bullet Focus & Scope menukar judul BEDSOCART dan BECONEX (bullet BEDSOCART berisi bisnis/ekonomi, bullet BECONEX berisi pendidikan/sosial). Dipakai: A2, "Our Journals", dan narasi Focus & Scope, yang konsisten satu sama lain.
- Ejaan "BITECNOS" muncul di tabel redaksi dan slug (`biacipta-bitecnos`); dipakai "BITECHNOS" (A2, narasi). Pemilik perlu memastikan.
- Butir "DOCX" dan "PDF pendamping" berasal dari tabel C5 berkolom "Rekomendasi"; belum ada tanda persetujuan pemilik di dokumen.
- Kebijakan CC BY 4.0 (C3), captcha (A3), tampilan ponsel (C4), dan open peer review (C1) belum diputuskan pemilik; tidak dipakai.

## Pertanyaan untuk pemilik
1. Kontak resmi untuk situs: dokumen menyebut biadenrekacipta@gmail.com dan 0859-3454-2215 sebagai kontak PT, tetapi menandai email Gmail "mungkin belum aman". Dipakai di situs atau tidak? Nomor itu WhatsApp atau telepon biasa?
2. Alamat/lokasi penerbit, alamat situs ketiga jurnal, biaya, durasi per tahap, ISBN dan syarat buku.
3. Ejaan final BITECHNOS vs BITECNOS.

Data pribadi dari tabel redaksi (nama dan email akun uji) sengaja tidak dimasukkan.
