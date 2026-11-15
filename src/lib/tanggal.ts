const BULAN = [
  'Januari', 'Februari', 'Maret', 'April', 'Mei', 'Juni',
  'Juli', 'Agustus', 'September', 'Oktober', 'November', 'Desember',
] as const;

/** '2025-01-01' -> '1 Januari 2025'. Tanpa `new Date` supaya tidak bergeser zona waktu (BUG-1, BR-13). */
export function formatTanggal(iso: string): string {
  const m = /^(\d{4})-(\d{2})-(\d{2})$/.exec(iso);
  if (!m) throw new Error(`Tanggal harus YYYY-MM-DD: ${iso}`);
  const [, y, mo, d] = m as unknown as [string, string, string, string];
  const bulan = BULAN[Number(mo) - 1];
  if (!bulan || Number(d) < 1 || Number(d) > 31) throw new Error(`Tanggal tidak valid: ${iso}`);
  return `${Number(d)} ${bulan} ${y}`;
}
