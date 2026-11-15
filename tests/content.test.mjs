import { test } from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { legalitasTampil, testimoniTampil, katalogTampil } from '../src/lib/visible.ts';
import { formatTanggal } from '../src/lib/tanggal.ts';

const load = (f) => JSON.parse(readFileSync(new URL(`../src/content/${f}.json`, import.meta.url), 'utf8'));
const site = load('site')[0];
const legalitas = load('legalitas');
const alur = load('alur');
const buku = load('buku');
const jurnal = load('jurnal');
const testimoni = load('testimoni');
const faq = load('faq');
const tahunIni = new Date().getFullYear();

test('BR-1: legalitas tampil hanya jika terverifikasi dan nilai terisi', () => {
  const tampil = legalitasTampil(legalitas);
  for (const i of tampil) {
    assert.equal(i.terverifikasi, true);
    assert.notEqual(i.nilai.trim(), '');
  }
  assert.equal(legalitasTampil([{ nilai: 'x', terverifikasi: false, tampilDiHero: false }]).length, 0);
  assert.equal(legalitasTampil([{ nilai: ' ', terverifikasi: true, tampilDiHero: false }]).length, 0);
});

test('SEC-9: legalitas tanpa flag tidak tampil, hero maks 3', () => {
  const hero = legalitasTampil(legalitas).filter((i) => i.tampilDiHero);
  assert.ok(hero.length <= 3);
});

test('BR-2: testimoni tampil hanya jika izin dan tanggalIzin terisi', () => {
  for (const t of testimoniTampil(testimoni)) assert.ok(t.izin && t.tanggalIzin);
  assert.equal(testimoniTampil([{ izin: true }]).length, 0);
  assert.equal(testimoniTampil([{ izin: false, tanggalIzin: '2025-01-01' }]).length, 0);
  for (const t of testimoni) assert.ok(t.kutipan.length <= 300);
});

test('BR-3: klaim angka wajib punya sumber', () => {
  for (const k of site.klaimAngka) assert.ok(k.sumber && k.sumber.trim() !== '');
});

test('BR-4: maks 12 buku dan 6 jurnal unggulan', () => {
  assert.ok(katalogTampil(buku).length <= 12);
  assert.ok(katalogTampil(jurnal).length <= 6);
});

test('BR-10: tahun buku berstatus terbit tidak melebihi tahun berjalan', () => {
  for (const b of buku) if (b.status === 'terbit') assert.ok(b.tahun <= tahunIni, b.judul);
});

test('BR-11: setiap tahap alur punya durasi dan biaya', () => {
  for (const a of alur) {
    assert.ok(a.durasi.trim() !== '', `durasi tahap ${a.nomor}`);
    assert.ok(a.biaya.trim() !== '', `biaya tahap ${a.nomor}`);
  }
});

test('BR-13 / BUG-1: format tanggal tidak bergeser zona waktu', () => {
  assert.equal(formatTanggal('2025-01-01'), '1 Januari 2025');
  assert.equal(formatTanggal('2026-12-31'), '31 Desember 2026');
  assert.throws(() => formatTanggal('01-01-2025'));
});

test('FAQ: jawaban teks polos', () => {
  for (const f of faq) assert.ok(!/<[a-z!/]/i.test(f.jawaban), f.pertanyaan);
});

test('GR-11: STRICT=1 menolak placeholder [verify]', { skip: process.env.STRICT !== '1' }, () => {
  const semua = ['site', 'legalitas', 'alur', 'syarat', 'buku', 'jurnal', 'testimoni', 'mitra', 'faq']
    .map((f) => [f, JSON.stringify(load(f))])
    .filter(([, s]) => s.includes('[verify]'))
    .map(([f]) => f);
  assert.deepEqual(semua, [], `[verify] masih ada di: ${semua.join(', ')}`);
});

test('FR-3: item legalitas dengan tampilDiHero:true maksimal 3', () => {
  assert.ok(legalitas.filter((i) => i.tampilDiHero).length <= 3);
});

test('SEC-9: fixture legalitas tidak terverifikasi atau bernilai kosong tidak tampil', () => {
  const fx = [
    { label: 'A', nilai: 'ok-1', terverifikasi: true, tampilDiHero: false },
    { label: 'B', nilai: 'rahasia-2', terverifikasi: false, tampilDiHero: true },
    { label: 'C', nilai: '', terverifikasi: true, tampilDiHero: false },
  ];
  assert.deepEqual(legalitasTampil(fx).map((i) => i.label), ['A']);
});

test('BR-11 / kelengkapan transparansi: 100% tahap alur punya durasi dan biaya', () => {
  assert.ok(alur.length > 0);
  const lengkap = alur.filter((a) => a.durasi.trim() !== '' && a.biaya.trim() !== '');
  assert.equal(lengkap.length / alur.length, 1);
});
