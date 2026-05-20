// ============================================================
// src/components/ProtectedRoute.jsx — Pelindung Rute
// ============================================================
// Komponen ini membungkus rute-rute yang membutuhkan autentikasi.
// Cara kerja:
//   1. Cek apakah token ada di localStorage
//   2. Jika tidak ada → redirect ke halaman login
//   3. Jika ada tapi role tidak sesuai → tampilkan halaman 403
//   4. Jika semua oke → tampilkan komponen anak (children)
// ============================================================

import { Navigate } from 'react-router-dom';

function ProtectedRoute({ children, allowedRoles = [] }) {
  // Ambil data sesi dari localStorage
  const token = localStorage.getItem('pkbm_token');
  const userRaw = localStorage.getItem('pkbm_user');

  // Jika tidak ada token → belum login → redirect ke halaman login
  if (!token) {
    return <Navigate to="/" replace />;
    // 'replace' agar halaman login tidak masuk ke history browser
    // sehingga tombol "Back" tidak membawa user ke halaman terproteksi
  }

  // Parse data user dari localStorage (simpan sebagai JSON string)
  let user = null;
  try {
    user = JSON.parse(userRaw);
  } catch {
    // Jika data user korup → hapus sesi dan redirect ke login
    localStorage.clear();
    return <Navigate to="/" replace />;
  }

  // Jika ada pembatasan role DAN role user tidak termasuk dalam daftar
  if (allowedRoles.length > 0 && !allowedRoles.includes(user?.role)) {
    // Tampilkan halaman 403 — akses ditolak
    return (
      <div className="loading-container" style={{ minHeight: '100vh', flexDirection: 'column' }}>
        <i className="bi bi-shield-x" style={{ fontSize: '3rem', color: 'var(--color-danger)' }}></i>
        <h2 style={{ fontFamily: 'var(--font-heading)' }}>Akses Ditolak</h2>
        <p style={{ color: 'var(--color-text-muted)' }}>
          Anda tidak memiliki izin untuk mengakses halaman ini.
        </p>
        <a href="/dashboard" className="btn btn-primary" style={{ marginTop: '1rem' }}>
          Kembali ke Dashboard
        </a>
      </div>
    );
  }

  // Semua pengecekan lulus → tampilkan halaman yang diminta
  return children;
}

export default ProtectedRoute;
