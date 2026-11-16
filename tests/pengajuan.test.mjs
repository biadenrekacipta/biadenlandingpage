import { test } from 'node:test';
import assert from 'node:assert/strict';
import { validasi, susunEmail, satuBaris, buatLimiter } from '../src/lib/pengajuan.ts';

const baik = () => new URLSearchParams({
  nama: 'Budi Santoso', email: 'budi@example.com', peran: 'Dosen', jenis: 'Ajukan naskah buku',
  judul_atau_topik: 'Judul naskah', institusi: '', link_naskah: '', pesan: 'Pesan yang cukup panjang untuk lolos.', persetujuan: 'ya',
});
const tolak = (ubah) => { const f = baik(); ubah(f); const r = validasi(f); assert.equal(r.ok, false); return r.galat; };

test('validasi: isian benar lolos', () => assert.equal(validasi(baik()).ok, true));
test('validasi: nama, email, enum, judul, pesan, persetujuan', () => {
  tolak((f) => f.set('nama', 'A'));
  tolak((f) => f.set('nama', 'x'.repeat(101)));
  tolak((f) => f.set('email', 'bukan-email'));
  tolak((f) => f.set('email', 'a@b'));
  tolak((f) => f.set('peran', 'Hacker'));
  tolak((f) => f.set('jenis', 'Lain'));
  tolak((f) => f.set('judul_atau_topik', 'ab'));
  tolak((f) => f.set('institusi', 'x'.repeat(151)));
  tolak((f) => f.set('pesan', 'terlalu pendek'));
  tolak((f) => f.set('pesan', 'x'.repeat(1001)));
  tolak((f) => f.delete('persetujuan'));
  tolak((f) => f.set('persetujuan', 'on'));
});
test('validasi: link_naskah opsional, hanya https', () => {
  const f = baik(); f.set('link_naskah', 'https://drive.example.com/x'); assert.equal(validasi(f).ok, true);
  tolak((g) => g.set('link_naskah', 'http://example.com'));
  tolak((g) => g.set('link_naskah', 'javascript:alert(1)'));
  tolak((g) => g.set('link_naskah', 'https://' + 'a'.repeat(500)));
});
test('header injection: CR/LF dibersihkan dari nama, judul, subject; email dengan CRLF ditolak', () => {
  const f = baik(); f.set('nama', 'Budi\r\nBcc: x@evil.test');
  const r = validasi(f); assert.equal(r.ok, true);
  assert.ok(!/[\r\n]/.test(r.data.nama));
  const m = susunEmail(r.data, 'dari@example.com', 'ke@example.com');
  assert.ok(!/[\r\n]/.test(m.subject));
  assert.equal(m.replyTo, 'budi@example.com');
  assert.equal(satuBaris('a\r\nb c'), 'a b c');
  tolak((g) => g.set('email', 'a@example.com\r\nBcc: x@evil.test'));
});
test('rate limit: batas per kunci dan jendela waktu', () => {
  let t = 0;
  const izin = buatLimiter(2, 1000, () => t);
  assert.ok(izin('ip1') && izin('ip1'));
  assert.equal(izin('ip1'), false);
  assert.ok(izin('ip2'));
  t = 1001;
  assert.ok(izin('ip1'));
});
