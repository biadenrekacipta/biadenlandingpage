// Filter murni untuk konten yang boleh tampil. Tanpa akses data di sini, supaya mudah dites.

export interface LegalItem {
  nilai: string;
  terverifikasi: boolean;
  tampilDiHero: boolean;
}
export interface Testimonial {
  izin: boolean;
  tanggalIzin?: string | null | undefined;
}
export interface CatalogItem {
  unggulan: boolean;
  status: 'terbit' | 'segera-terbit' | 'diarsipkan';
}

/** BR-1: tampil hanya jika terverifikasi dan nilai tidak kosong. */
export const legalitasTampil = <T extends LegalItem>(items: T[]): T[] =>
  items.filter((i) => i.terverifikasi === true && i.nilai.trim() !== '');

/** BR-2: tampil hanya jika izin dan tanggalIzin terisi. */
export const testimoniTampil = <T extends Testimonial>(items: T[]): T[] =>
  items.filter((i) => i.izin === true && !!i.tanggalIzin);

/** BR-10: unggulan dan status bukan diarsipkan. */
export const katalogTampil = <T extends CatalogItem>(items: T[]): T[] =>
  items.filter((i) => i.unggulan === true && i.status !== 'diarsipkan');

// BR-4: batas katalog unggulan. Build gagal bila terlampaui.
export const MAKS_BUKU = 12;
export const MAKS_JURNAL = 6;

export interface OrderedItem extends CatalogItem {
  urutan: number;
  tahun?: number | null | undefined;
}

/** BR-5: `urutan` naik, lalu `tahun` turun (tanpa tahun dianggap paling lama). */
const urut = <T extends OrderedItem>(items: T[]): T[] =>
  [...items].sort((a, b) => a.urutan - b.urutan || (b.tahun ?? -Infinity) - (a.tahun ?? -Infinity));

const katalog = <T extends OrderedItem>(items: T[], maks: number, nama: string): T[] => {
  const hasil = urut(katalogTampil(items));
  if (hasil.length > maks) throw new Error(`[BR-4] ${nama}: ${hasil.length} item unggulan, maksimum ${maks}`);
  if (hasil.length === 0) console.warn(`[BR-6] ${nama}: tidak ada item tampil, section disembunyikan`);
  return hasil;
};

/** BR-4, BR-5, BR-10. */
export const katalogBuku = <T extends OrderedItem>(items: T[]): T[] => katalog(items, MAKS_BUKU, 'buku');
export const katalogJurnal = <T extends OrderedItem>(items: T[]): T[] => katalog(items, MAKS_JURNAL, 'jurnal');
