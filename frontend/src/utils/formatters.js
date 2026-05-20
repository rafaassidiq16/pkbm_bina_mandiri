// ============================================================
// src/utils/formatters.js — Fungsi Pemformatan Data
// ============================================================
// Kumpulan fungsi utilitas untuk memformat angka, tanggal,
// dan teks yang digunakan di seluruh aplikasi.
// ============================================================

/**
 * Format angka ke format Rupiah
 * @param {number} amount
 * @returns {string} e.g. "Rp 150.000"
 */
export function formatRupiah(amount) {
  return new Intl.NumberFormat('id-ID', {
    style: 'currency',
    currency: 'IDR',
    minimumFractionDigits: 0,
  }).format(amount);
}

/**
 * Format tanggal ISO ke format Indonesia
 * @param {string} isoString
 * @returns {string} e.g. "12 Mei 2026"
 */
export function formatTanggal(isoString) {
  if (!isoString) return '-';
  return new Date(isoString).toLocaleDateString('id-ID', {
    day: 'numeric',
    month: 'long',
    year: 'numeric',
  });
}

/**
 * Format detik ke menit:detik (untuk timer absensi/ujian)
 * @param {number} totalSeconds
 * @returns {string} e.g. "05:30"
 */
export function formatTimer(totalSeconds) {
  const m = Math.floor(totalSeconds / 60).toString().padStart(2, '0');
  const s = (totalSeconds % 60).toString().padStart(2, '0');
  return `${m}:${s}`;
}

/**
 * Kapitalisasi huruf pertama setiap kata
 * @param {string} str
 * @returns {string}
 */
export function titleCase(str) {
  if (!str) return '';
  return str.replace(/\w\S*/g, (txt) => txt.charAt(0).toUpperCase() + txt.slice(1).toLowerCase());
}

/**
 * Map role ke label bahasa Indonesia
 * @param {string} role
 * @returns {string}
 */
export function labelRole(role) {
  const map = {
    super_admin:    'Super Admin',
    admin:          'Admin TU & Keuangan',
    tutor:          'Tutor',
    warga_belajar:  'Warga Belajar',
    pimpinan:       'Pimpinan PKBM',
  };
  return map[role] ?? role;
}
