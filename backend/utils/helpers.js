// ============================================================
// utils/helpers.js
// Fungsi-fungsi bantuan yang dipakai di seluruh backend.
// ============================================================

import bcrypt from 'bcryptjs';

// -----------------------------------------------------------
// hashPassword
// Mengubah plain text password menjadi hash yang aman.
// Selalu gunakan fungsi ini, jangan hash manual di controller.
// -----------------------------------------------------------
export const hashPassword = async (plainText) => {
  return bcrypt.hash(plainText, 10);
};

// -----------------------------------------------------------
// formatTanggal
// Mengubah objek Date atau string tanggal menjadi format
// yang mudah dibaca: "12 Januari 2025"
// -----------------------------------------------------------
export const formatTanggal = (tanggal) => {
  if (!tanggal) return '-';
  const bulan = [
    'Januari','Februari','Maret','April','Mei','Juni',
    'Juli','Agustus','September','Oktober','November','Desember'
  ];
  const d = new Date(tanggal);
  return `${d.getDate()} ${bulan[d.getMonth()]} ${d.getFullYear()}`;
};

// -----------------------------------------------------------
// formatRupiah
// Mengubah angka menjadi format mata uang Rupiah.
// Contoh: 150000 → "Rp 150.000"
// -----------------------------------------------------------
export const formatRupiah = (angka) => {
  if (angka === null || angka === undefined) return 'Rp 0';
  return 'Rp ' + Number(angka).toLocaleString('id-ID');
};

// -----------------------------------------------------------
// generateNIS
// Generate Nomor Induk Siswa otomatis.
// Format: PKBM-TAHUN-NOMOR_URUT (contoh: PKBM-2025-0001)
// -----------------------------------------------------------
export const generateNIS = (nomorUrut, tahunAjaran = null) => {
  const tahunDariLabel = String(tahunAjaran || '').match(/\d{4}/)?.[0];
  const tahun = tahunDariLabel || new Date().getFullYear();
  const urut  = String(nomorUrut).padStart(4, '0');
  return `PKBM-${tahun}-${urut}`;
};

// -----------------------------------------------------------
// paginasi
// Helper untuk membatasi & memilih halaman data (pagination).
// Digunakan di model saat query dengan LIMIT dan OFFSET.
// -----------------------------------------------------------
export const paginasi = (page = 1, limit = 10) => {
  const safePage  = Math.max(1, parseInt(page));
  const safeLimit = Math.min(100, Math.max(1, parseInt(limit)));
  const offset    = (safePage - 1) * safeLimit;
  return { limit: safeLimit, offset };
};
