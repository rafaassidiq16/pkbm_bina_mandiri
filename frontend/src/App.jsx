// ============================================================
// src/App.jsx — Pengatur Rute (Router) Utama Aplikasi
// ============================================================
// File ini mendefinisikan SEMUA rute/halaman yang ada di aplikasi.
// Menggunakan React Router DOM v6 (<Routes> & <Route>).
//
// Struktur Rute Lengkap:
//   /                          → Login (halaman publik)
//   /daftar                    → Formulir SPMB publik (tanpa login)
//   /dashboard                 → Redirect otomatis berdasarkan role
//   /dashboard/siswa           → Beranda Warga Belajar
//   /dashboard/siswa/materi    → Materi belajar
//   /dashboard/siswa/tugas     → Tugas & pengumpulan
//   /dashboard/siswa/absensi   → Check-in absensi mandiri
//   /dashboard/siswa/ujian     → Ujian online
//   /dashboard/siswa/klub      → Klub minat bakat
//   /dashboard/siswa/tagihan   → Tagihan SPP
//   /dashboard/admin           → Beranda Admin TU
//   /dashboard/admin/spmb      → Verifikasi SPMB
//   /dashboard/admin/siswa     → Manajemen data WB
//   /dashboard/admin/tagihan   → Keuangan & tagihan
//   /dashboard/admin/users     → Manajemen akun (Super Admin)
//   /dashboard/tutor           → Beranda Tutor
//   /dashboard/tutor/kelas     → Materi, tugas & jadwal
//   /dashboard/tutor/absensi   → Kelola absensi dual-mode
//   /dashboard/tutor/ujian     → Bank soal & paket ujian
//   /dashboard/pimpinan        → Dashboard eksekutif (view-only)
//   *                          → Halaman 404
// ============================================================

import { Routes, Route } from 'react-router-dom';

// ── Halaman Publik (tidak butuh login) ──────────────────────
import LoginPage      from './pages/public/LoginPage.jsx';
import DaftarSpmbPage from './pages/public/DaftarSpmbPage.jsx';
import NotFoundPage   from './pages/public/NotFoundPage.jsx';

// ── Komponen Pendukung ───────────────────────────────────────
import ProtectedRoute  from './components/ProtectedRoute.jsx';
import DashboardRouter from './pages/DashboardRouter.jsx';

// ── Halaman Warga Belajar ────────────────────────────────────
import DashboardSiswa from './pages/siswa/DashboardSiswa.jsx';
import MateriSiswa    from './pages/siswa/MateriSiswa.jsx';
import TugasSiswa     from './pages/siswa/TugasSiswa.jsx';
import AbsensiSiswa   from './pages/siswa/AbsensiSiswa.jsx';
import UjianSiswa     from './pages/siswa/UjianSiswa.jsx';
import KlubSiswa      from './pages/siswa/KlubSiswa.jsx';
import TagihanSiswa   from './pages/siswa/TagihanSiswa.jsx';

// ── Halaman Admin TU & Keuangan ──────────────────────────────
import DashboardAdmin from './pages/admin/DashboardAdmin.jsx';
import SpmbAdmin      from './pages/admin/SpmbAdmin.jsx';
import SiswaAdmin     from './pages/admin/SiswaAdmin.jsx';
import TagihanAdmin   from './pages/admin/TagihanAdmin.jsx';
import UserAdmin      from './pages/admin/UserAdmin.jsx';
import KlubAdmin      from './pages/admin/KlubAdmin.jsx';

// ── Halaman Tutor ────────────────────────────────────────────
import DashboardTutor from './pages/tutor/DashboardTutor.jsx';
import KelasTutor     from './pages/tutor/KelasTutor.jsx';
import AbsensiTutor   from './pages/tutor/AbsensiTutor.jsx';
import UjianTutor     from './pages/tutor/UjianTutor.jsx';

// ── Halaman Pimpinan ─────────────────────────────────────────
import DashboardPimpinan from './pages/pimpinan/DashboardPimpinan.jsx';

function App() {
  return (
    // <Routes> adalah penampung semua definisi <Route>
    <Routes>

      {/* ════════════════════════════════════════════════════ */}
      {/* RUTE PUBLIK — tidak perlu login                      */}
      {/* ════════════════════════════════════════════════════ */}
      <Route path="/"       element={<LoginPage />} />
      <Route path="/daftar" element={<DaftarSpmbPage />} />

      {/* /dashboard → redirect otomatis sesuai role */}
      <Route path="/dashboard" element={<ProtectedRoute><DashboardRouter /></ProtectedRoute>} />

      {/* ════════════════════════════════════════════════════ */}
      {/* RUTE WARGA BELAJAR                                   */}
      {/* ════════════════════════════════════════════════════ */}
      <Route path="/dashboard/siswa"
        element={<ProtectedRoute allowedRoles={['warga_belajar']}><DashboardSiswa /></ProtectedRoute>} />
      <Route path="/dashboard/siswa/materi"
        element={<ProtectedRoute allowedRoles={['warga_belajar']}><MateriSiswa /></ProtectedRoute>} />
      <Route path="/dashboard/siswa/tugas"
        element={<ProtectedRoute allowedRoles={['warga_belajar']}><TugasSiswa /></ProtectedRoute>} />
      <Route path="/dashboard/siswa/absensi"
        element={<ProtectedRoute allowedRoles={['warga_belajar']}><AbsensiSiswa /></ProtectedRoute>} />
      <Route path="/dashboard/siswa/ujian"
        element={<ProtectedRoute allowedRoles={['warga_belajar']}><UjianSiswa /></ProtectedRoute>} />
      <Route path="/dashboard/siswa/klub"
        element={<ProtectedRoute allowedRoles={['warga_belajar']}><KlubSiswa /></ProtectedRoute>} />
      <Route path="/dashboard/siswa/tagihan"
        element={<ProtectedRoute allowedRoles={['warga_belajar']}><TagihanSiswa /></ProtectedRoute>} />

      {/* ════════════════════════════════════════════════════ */}
      {/* RUTE ADMIN TU & KEUANGAN                             */}
      {/* ════════════════════════════════════════════════════ */}
      <Route path="/dashboard/admin"
        element={<ProtectedRoute allowedRoles={['admin', 'super_admin']}><DashboardAdmin /></ProtectedRoute>} />
      <Route path="/dashboard/admin/spmb"
        element={<ProtectedRoute allowedRoles={['admin', 'super_admin']}><SpmbAdmin /></ProtectedRoute>} />
      <Route path="/dashboard/admin/siswa"
        element={<ProtectedRoute allowedRoles={['admin', 'super_admin']}><SiswaAdmin /></ProtectedRoute>} />
      <Route path="/dashboard/admin/tagihan"
        element={<ProtectedRoute allowedRoles={['admin', 'super_admin']}><TagihanAdmin /></ProtectedRoute>} />
      {/* Hanya Super Admin yang bisa akses manajemen user */}
      <Route path="/dashboard/admin/users"
        element={<ProtectedRoute allowedRoles={['super_admin']}><UserAdmin /></ProtectedRoute>} />
      {/* Admin & Super Admin kelola klub minat bakat */}
      <Route path="/dashboard/admin/klub"
        element={<ProtectedRoute allowedRoles={['admin', 'super_admin']}><KlubAdmin /></ProtectedRoute>} />

      {/* ════════════════════════════════════════════════════ */}
      {/* RUTE TUTOR                                           */}
      {/* ════════════════════════════════════════════════════ */}
      <Route path="/dashboard/tutor"
        element={<ProtectedRoute allowedRoles={['tutor', 'super_admin']}><DashboardTutor /></ProtectedRoute>} />
      <Route path="/dashboard/tutor/kelas"
        element={<ProtectedRoute allowedRoles={['tutor', 'super_admin']}><KelasTutor /></ProtectedRoute>} />
      <Route path="/dashboard/tutor/absensi"
        element={<ProtectedRoute allowedRoles={['tutor', 'super_admin']}><AbsensiTutor /></ProtectedRoute>} />
      <Route path="/dashboard/tutor/ujian"
        element={<ProtectedRoute allowedRoles={['tutor', 'super_admin']}><UjianTutor /></ProtectedRoute>} />

      {/* ════════════════════════════════════════════════════ */}
      {/* RUTE PIMPINAN                                        */}
      {/* ════════════════════════════════════════════════════ */}
      <Route path="/dashboard/pimpinan"
        element={<ProtectedRoute allowedRoles={['pimpinan', 'super_admin']}><DashboardPimpinan /></ProtectedRoute>} />

      {/* Fallback: halaman 404 */}
      <Route path="*" element={<NotFoundPage />} />

    </Routes>
  );
}

export default App;