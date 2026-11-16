import { defineCollection } from 'astro:content';
import { file } from 'astro/loaders';
import { z } from 'astro/zod';

// Placeholder "[verify]" boleh lolos skema; tes STRICT=1 menolaknya di produksi (GR-11).
const verify = '[verify]';
const httpsUrl = z
  .string()
  .refine((v) => v === verify || /^https:\/\/\S+$/.test(v), 'harus https:// atau [verify]');
const isoDate = z.string().regex(/^\d{4}-\d{2}-\d{2}$/, 'format YYYY-MM-DD'); // BUG-1
const text = z.string().min(1);
const status = z.enum(['terbit', 'segera-terbit', 'diarsipkan']);

const site = defineCollection({
  loader: file('src/content/site.json'),
  schema: z.object({
    nama: text,
    tagline: z.string().min(1).max(90),
    ringkasan: text,
    profil: text,
    lokasi: z.string().min(1).optional(),
    email: text,
    whatsapp: text,
    sameAs: z.array(httpsUrl),
    slaBalasanHariKerja: z.number().int().positive().nullable().optional(),
    klaimAngka: z.array(z.object({ label: text, nilai: text, sumber: z.string().min(1) })), // BR-3
    lastUpdated: isoDate,
  }),
});

const legalitas = defineCollection({
  loader: file('src/content/legalitas.json'),
  schema: z.object({
    label: text,
    nilai: z.string(),
    buktiUrl: httpsUrl.nullable().optional(),
    terverifikasi: z.boolean(),
    tampilDiHero: z.boolean(),
  }),
});

const alur = defineCollection({
  loader: file('src/content/alur.json'),
  schema: z.object({
    nomor: z.number().int().positive(),
    judul: text,
    deskripsi: text,
  }),
});

const syarat = defineCollection({
  loader: file('src/content/syarat.json'),
  schema: z.object({
    jenis: z.enum(['buku', 'jurnal']),
    butir: z.array(text).min(1),
  }),
});

const buku = defineCollection({
  loader: file('src/content/buku.json'),
  schema: z.object({
    judul: text,
    penulis: text,
    tahun: z.number().int(),
    isbn: z.string().nullable().optional(),
    ringkasan: z.string().min(1).max(200),
    sampul: text,
    sampulAlt: text,
    link: httpsUrl,
    status,
    unggulan: z.boolean(),
    urutan: z.number().int(),
  })
    // BR-10: `terbit` tidak boleh bertahun depan; `segera-terbit` boleh.
    .refine((b) => b.status !== 'terbit' || b.tahun <= new Date().getFullYear(), {
      message: 'tahun buku terbit melebihi tahun berjalan (BR-10)',
      path: ['tahun'],
    }),
});

const jurnal = defineCollection({
  loader: file('src/content/jurnal.json'),
  schema: z.object({
    nama: text,
    issn: z.string().nullable().optional(),
    bidang: text,
    ringkasan: z.string().min(1).max(200),
    sampul: text.optional(),
    sampulAlt: text.optional(),
    link: httpsUrl.optional(),
    status,
    unggulan: z.boolean(),
    urutan: z.number().int(),
  }),
});

const testimoni = defineCollection({
  loader: file('src/content/testimoni.json'),
  schema: z.object({
    nama: text,
    peran: text,
    institusi: text,
    kutipan: z.string().min(1).max(300),
    foto: z.string().nullable().optional(),
    fotoAlt: z.string().nullable().optional(),
    izin: z.boolean(),
    tanggalIzin: isoDate.nullable().optional(),
  }),
});

const mitra = defineCollection({
  loader: file('src/content/mitra.json'),
  schema: z.object({
    nama: text,
    logo: text,
    alt: z.string().min(1, 'alt wajib'),
    url: httpsUrl.nullable().optional(),
  }),
});

const faq = defineCollection({
  loader: file('src/content/faq.json'),
  schema: z.object({
    pertanyaan: text,
    jawaban: z.string().min(1).max(500),
  }),
});

export const collections = { site, legalitas, alur, syarat, buku, jurnal, testimoni, mitra, faq };
