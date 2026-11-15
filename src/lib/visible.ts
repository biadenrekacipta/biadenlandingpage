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
