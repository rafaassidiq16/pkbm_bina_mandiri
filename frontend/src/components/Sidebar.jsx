// ============================================================
// src/components/Sidebar.jsx — Navigasi Samping Aplikasi
// ============================================================
// Sidebar dinamis yang menampilkan menu berbeda sesuai role user.
// Dipakai di semua halaman dashboard.
// ============================================================

import { useEffect, useState } from 'react';
import { NavLink, useLocation, useNavigate } from 'react-router-dom';
import './Sidebar.css';

function toAssetUrl(path) {
  if (!path) return '';
  if (/^https?:\/\//i.test(path)) return path;
  const apiUrl = import.meta.env.VITE_API_URL || '';
  const origin = apiUrl.replace(/\/api$/, '');
  return `${origin}/${String(path).replace(/\\/g, '/')}`;
}

// Definisi menu per role
const MENU_PER_ROLE = {
  warga_belajar: [
    { path: '/dashboard/siswa',          icon: 'bi-house-fill',         label: 'Beranda' },
    { path: '/dashboard/siswa/materi',   icon: 'bi-book-fill',          label: 'Materi Belajar' },
    { path: '/dashboard/siswa/tugas',    icon: 'bi-pencil-square',      label: 'Tugas' },
    { path: '/dashboard/siswa/absensi',  icon: 'bi-calendar-check-fill', label: 'Absensi Saya' },
    { path: '/dashboard/siswa/ujian',    icon: 'bi-patch-question-fill', label: 'Ujian' },
    { path: '/dashboard/siswa/klub',     icon: 'bi-people-fill',        label: 'Klub Minat' },
    { path: '/dashboard/siswa/tagihan',  icon: 'bi-receipt',            label: 'Tagihan Saya' },
  ],
  admin: [
    { path: '/dashboard/admin',          icon: 'bi-speedometer2',       label: 'Dashboard' },
    { path: '/dashboard/admin/spmb',     icon: 'bi-person-plus-fill',   label: 'Verifikasi SPMB' },
    { path: '/dashboard/admin/siswa',    icon: 'bi-people-fill',        label: 'Data Siswa' },
    { path: '/dashboard/admin/tagihan',  icon: 'bi-cash-stack',         label: 'Keuangan' },
    { path: '/dashboard/admin/klub',     icon: 'bi-trophy-fill',        label: 'Klub Minat Bakat' },
  ],
  tutor: [
    { path: '/dashboard/tutor',          icon: 'bi-speedometer2',       label: 'Dashboard' },
    { path: '/dashboard/tutor/kelas',    icon: 'bi-journal-text',       label: 'Kelas Saya' },
    { path: '/dashboard/tutor/absensi',  icon: 'bi-calendar-check',     label: 'Absensi' },
    { path: '/dashboard/tutor/ujian',    icon: 'bi-file-earmark-check', label: 'Soal & Ujian' },
  ],
  pimpinan: [
    { path: '/dashboard/pimpinan',       icon: 'bi-bar-chart-fill',     label: 'Dashboard Eksekutif' },
  ],
  super_admin: [
    { path: '/dashboard/admin',          icon: 'bi-speedometer2',       label: 'Dashboard' },
    { path: '/dashboard/admin/spmb',     icon: 'bi-person-plus-fill',   label: 'Verifikasi SPMB' },
    { path: '/dashboard/admin/siswa',    icon: 'bi-people-fill',        label: 'Data Siswa' },
    { path: '/dashboard/admin/tagihan',  icon: 'bi-cash-stack',         label: 'Keuangan' },
    { path: '/dashboard/admin/klub',     icon: 'bi-trophy-fill',        label: 'Klub Minat Bakat' },
    { path: '/dashboard/admin/users',    icon: 'bi-shield-lock-fill',   label: 'Manajemen User' },
  ],
};

function Sidebar({ user }) {
  const [mobileOpen, setMobileOpen] = useState(false);
  const location = useLocation();
  const navigate  = useNavigate();

  // Ambil menu sesuai role user yang sedang login
  const menuItems = MENU_PER_ROLE[user?.role] || [];

  // Fungsi logout: hapus semua data sesi lalu kembali ke login
  const handleLogout = () => {
    setMobileOpen(false);
    localStorage.removeItem('pkbm_token');
    localStorage.removeItem('pkbm_user');
    navigate('/'); // Kembali ke halaman login
  };

  useEffect(() => {
    setMobileOpen(false);
  }, [location.pathname]);

  useEffect(() => {
    document.body.classList.toggle('sidebar-open-mobile', mobileOpen);
    return () => document.body.classList.remove('sidebar-open-mobile');
  }, [mobileOpen]);

  return (
    <>
      <button
        type="button"
        className="mobile-sidebar-toggle mobile-only"
        onClick={() => setMobileOpen((prev) => !prev)}
        aria-label={mobileOpen ? 'Tutup menu' : 'Buka menu'}
        aria-expanded={mobileOpen}
      >
        <i className={`bi ${mobileOpen ? 'bi-x-lg' : 'bi-list'}`}></i>
      </button>

      {mobileOpen ? (
        <div
          className="mobile-sidebar-backdrop mobile-only"
          onClick={() => setMobileOpen(false)}
          aria-hidden="true"
        />
      ) : null}

      <aside className={`app-sidebar ${mobileOpen ? 'open' : ''}`}>

      {/* ── Logo & Nama Aplikasi ── */}
      <div className="sidebar-brand">
        <div className="sidebar-brand-icon">
          <i className="bi bi-mortarboard-fill"></i>
        </div>
        <div className="sidebar-brand-text">
          <span className="sidebar-brand-name">PKBM</span>
          <span className="sidebar-brand-sub">Bina Mandiri</span>
        </div>
      </div>

      {/* ── Info User yang Login ── */}
      <div className="sidebar-user">
        <div className="sidebar-user-avatar">
          {user?.foto_profil ? (
            <img
              src={toAssetUrl(user.foto_profil)}
              alt="Foto profil"
              style={{ width: '100%', height: '100%', objectFit: 'cover' }}
            />
          ) : (
            (user?.nama_lengkap || user?.nama || 'U').charAt(0)?.toUpperCase()
          )}
        </div>
        <div className="sidebar-user-info">
          <p className="sidebar-user-name">{user?.nama_lengkap || user?.nama || 'Pengguna'}</p>
          <span className="sidebar-user-role">{formatRole(user?.role)}</span>
        </div>
      </div>

      {/* ── Daftar Menu Navigasi ── */}
      <nav className="sidebar-nav">
        <p className="sidebar-nav-label">Menu Utama</p>
        <ul className="sidebar-menu">
          {menuItems.map((item) => (
            <li key={item.path}>
              {/* NavLink otomatis menambahkan class 'active' jika URL cocok */}
              <NavLink
                to={item.path}
                end={item.path.split('/').length <= 3} // 'end' untuk exact match
                onClick={() => setMobileOpen(false)}
                className={({ isActive }) =>
                  `sidebar-menu-item ${isActive ? 'active' : ''}`
                }
              >
                <i className={`bi ${item.icon}`}></i>
                <span>{item.label}</span>
              </NavLink>
            </li>
          ))}
        </ul>
      </nav>

      {/* ── Tombol Logout ── */}
      <div className="sidebar-footer">
        <button className="sidebar-logout-btn" onClick={handleLogout}>
          <i className="bi bi-box-arrow-left"></i>
          <span>Keluar</span>
        </button>
      </div>

      </aside>
    </>
  );
}

// Helper: format nama role agar lebih rapi ditampilkan
function formatRole(role) {
  const map = {
    warga_belajar: 'Warga Belajar',
    admin:         'Admin TU & Keuangan',
    tutor:         'Tutor',
    pimpinan:      'Pimpinan',
    super_admin:   'Super Admin',
  };
  return map[role] || role || 'Pengguna';
}

export default Sidebar;
