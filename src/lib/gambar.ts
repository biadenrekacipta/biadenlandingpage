import type { ImageMetadata } from 'astro';

// FR-35, TC-9: gambar konten ada di src/assets/ dan dirujuk dari JSON dengan path relatif ke folder itu (mis. "buku/judul.jpg").
// Pipeline astro:assets (sharp) mengubahnya jadi WebP dengan ukuran sesuai tampil; build gagal bila berkas tidak ada (BUG-5).
const semua = import.meta.glob<{ default: ImageMetadata }>('/src/assets/**/*.{png,jpg,jpeg,webp,avif}', { eager: true });

export function gambar(path: string): ImageMetadata {
  const m = semua[`/src/assets/${path.replace(/^\/+/, '')}`];
  if (!m) throw new Error(`Gambar "${path}" tidak ditemukan di src/assets/ (path di JSON relatif ke src/assets/)`);
  return m.default;
}
