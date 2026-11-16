// Validasi pengajuan form (FR-13, SEC-1). Aturan sama dengan atribut HTML5 di FormAjukan.astro.
export const PERAN = ['Mahasiswa', 'Dosen', 'Peneliti', 'Penulis umum', 'Lainnya'] as const;
export const JENIS = ['Ajukan naskah buku', 'Ajukan artikel jurnal', 'Pertanyaan umum'] as const;

export interface Pengajuan {
  nama: string;
  email: string;
  peran: string;
  jenis: string;
  judul_atau_topik: string;
  institusi: string;
  link_naskah: string;
  pesan: string;
}

export type Hasil = { ok: true; data: Pengajuan } | { ok: false; galat: string };

// Hapus CR/LF dan karakter kontrol: mencegah header injection di subject/nama/replyTo.
export const satuBaris = (s: string) => [...s].map((c) => { const n = c.charCodeAt(0); return n < 32 || n === 127 || n === 0x2028 || n === 0x2029 ? ' ' : c; }).join('').replace(/ +/g, ' ').trim();

const EMAIL = /^[^\s@<>",;:()\[\]\\]+@[^\s@<>",;:()\[\]\\]+\.[^\s@<>",;:()\[\]\\]+$/;

export function validasi(f: URLSearchParams): Hasil {
  const ambil = (k: string) => (f.get(k) ?? '').trim();
  const panjang = (k: string, min: number, max: number) => ambil(k).length >= min && ambil(k).length <= max;
  const data: Pengajuan = {
    nama: satuBaris(ambil('nama')),
    email: ambil('email'),
    peran: ambil('peran'),
    jenis: ambil('jenis'),
    judul_atau_topik: satuBaris(ambil('judul_atau_topik')),
    institusi: satuBaris(ambil('institusi')),
    link_naskah: ambil('link_naskah'),
    pesan: ambil('pesan'),
  };
  if (!panjang('nama', 2, 100)) return { ok: false, galat: 'Nama harus 2 sampai 100 karakter.' };
  if (data.email.length > 254 || !EMAIL.test(data.email)) return { ok: false, galat: 'Alamat email tidak valid.' };
  if (!(PERAN as readonly string[]).includes(data.peran)) return { ok: false, galat: 'Pilih peran dari daftar.' };
  if (!(JENIS as readonly string[]).includes(data.jenis)) return { ok: false, galat: 'Pilih jenis pengajuan dari daftar.' };
  if (!panjang('judul_atau_topik', 3, 200)) return { ok: false, galat: 'Judul atau topik harus 3 sampai 200 karakter.' };
  if (data.institusi.length > 150) return { ok: false, galat: 'Institusi maksimal 150 karakter.' };
  if (data.link_naskah) {
    let u: URL | null = null;
    try { u = new URL(data.link_naskah); } catch { /* tidak valid */ }
    if (data.link_naskah.length > 500 || !u || u.protocol !== 'https:') return { ok: false, galat: 'Tautan naskah harus berupa tautan https.' };
  }
  if (!panjang('pesan', 20, 1000)) return { ok: false, galat: 'Pesan harus 20 sampai 1000 karakter.' };
  if (f.get('persetujuan') !== 'ya') return { ok: false, galat: 'Anda harus menyetujui kebijakan privasi.' };
  return { ok: true, data };
}

export function susunEmail(d: Pengajuan, dari: string, ke: string) {
  return {
    from: dari,
    to: ke,
    replyTo: d.email,
    subject: satuBaris(`Pengajuan baru: ${d.jenis} - ${d.nama}`),
    text: [
      `Nama: ${d.nama}`,
      `Email: ${d.email}`,
      `Peran: ${d.peran}`,
      `Jenis: ${d.jenis}`,
      `Judul atau topik: ${d.judul_atau_topik}`,
      `Institusi: ${d.institusi || '-'}`,
      `Tautan naskah: ${d.link_naskah || '-'}`,
      '',
      d.pesan,
    ].join('\n'),
  };
}

// ponytail: rate limit di memori proses, per IP. Batas 5 kiriman per 10 menit.
// Hilang saat restart dan tidak dibagi antar instance; upgrade ke penyimpanan bersama bila trafik naik.
export function buatLimiter(maks = 5, jendelaMs = 10 * 60 * 1000, sekarang: () => number = Date.now) {
  const catatan = new Map<string, number[]>();
  return (kunci: string): boolean => {
    const t = sekarang();
    const baru = (catatan.get(kunci) ?? []).filter((x) => t - x < jendelaMs);
    if (baru.length >= maks) { catatan.set(kunci, baru); return false; }
    baru.push(t);
    catatan.set(kunci, baru);
    // ponytail: bersihkan kunci kedaluwarsa saat peta membesar (batas 1000 IP).
    if (catatan.size > 1000) for (const [k, v] of catatan) if (!v.some((x) => t - x < jendelaMs)) catatan.delete(k);
    return true;
  };
}
