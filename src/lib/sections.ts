// Daftar section yang benar-benar dirender di beranda (FR-2, BR-6, BUG-4).
// Nav dibangun dari daftar ini, jadi tidak ada link ke section yang tidak ada di HTML.
export type SectionId = 'profil' | 'alur' | 'katalog' | 'testimoni' | 'faq' | 'ajukan';
export interface Section {
  id: SectionId;
  label: string;
}

// Urutan = urutan di halaman.
const SEMUA: readonly Section[] = [
  { id: 'profil', label: 'Profil' },
  { id: 'alur', label: 'Alur Terbit' },
  { id: 'katalog', label: 'Katalog' },
  { id: 'testimoni', label: 'Testimoni' },
  { id: 'faq', label: 'FAQ' },
  { id: 'ajukan', label: 'Ajukan Naskah' },
];

/** `ada` = section mana yang punya isi untuk dirender. Halaman memakai daftar yang sama untuk nav dan markup. */
export const sectionTampil = (ada: Partial<Record<SectionId, boolean>>): Section[] =>
  SEMUA.filter((s) => ada[s.id] === true);
