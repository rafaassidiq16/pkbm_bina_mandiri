// ============================================================
// src/pages/DashboardRouter.jsx — Pengalih Dashboard per Role
// ============================================================
// Komponen ini dipanggil saat user mengakses /dashboard.
// Tugasnya: membaca role dari localStorage, lalu redirect ke
// dashboard yang sesuai.
//
// Pola redirect:
//   super_admin   → /dashboard/admin
//   admin         → /dashboard/admin
//   tutor         → /dashboard/tutor
//   warga_belajar → /dashboard/siswa
//   pimpinan      → /dashboard/pimpinan
// ============================================================

import { Navigate } from 'react-router-dom';

function DashboardRouter() {
  // Ambil data user yang disimpan saat login
  const userRaw = localStorage.getItem('pkbm_user');
  let user = null;

  try {
    user = JSON.parse(userRaw);
  } catch {
    // Data rusak → kembalikan ke login
    return <Navigate to="/" replace />;
  }

  // Peta role → path dashboard tujuan
  const roleToDashboard = {
    super_admin:   '/dashboard/admin',
    admin:         '/dashboard/admin',
    tutor:         '/dashboard/tutor',
    warga_belajar: '/dashboard/siswa',
    pimpinan:      '/dashboard/pimpinan',
  };

  // Ambil path tujuan berdasarkan role
  const targetPath = roleToDashboard[user?.role];

  if (!targetPath) {
    // Role tidak dikenal → kembali ke login
    return <Navigate to="/" replace />;
  }

  // Redirect ke dashboard yang sesuai
  return <Navigate to={targetPath} replace />;
}

export default DashboardRouter;
