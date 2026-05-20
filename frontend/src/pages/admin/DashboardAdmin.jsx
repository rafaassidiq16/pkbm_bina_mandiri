// ============================================================
// src/pages/admin/DashboardAdmin.jsx — Dashboard Admin TU
// ============================================================
// Stub halaman — akan diisi penuh di fase pengembangan berikutnya.
// Menampilkan ringkasan SPMB, tagihan jatuh tempo, dan aksi cepat.
// ============================================================

import { useState, useEffect } from 'react';
import Sidebar from '../../components/Sidebar.jsx';
import ProfileEditorCard from '../../components/ProfileEditorCard.jsx';
import { SpmbAPI, TagihanAPI, SiswaAPI } from '../../services/api.js';

function DashboardAdmin() {
  const [user, setUser] = useState(() => JSON.parse(localStorage.getItem('pkbm_user') || '{}'));

  // State untuk statistik SPMB
  const [statSpmb, setStatSpmb]   = useState(null);
  const [statSiswa, setStatSiswa] = useState(null);
  const [loading, setLoading]     = useState(true);

  useEffect(() => {
    const fetchData = async () => {
      try {
        // Ambil statistik SPMB dan jumlah siswa secara paralel
        const [resSpmb, resSiswa] = await Promise.allSettled([
          SpmbAPI.getStatistik(),
          SiswaAPI.getStatistikPerJenjang(),
        ]);

        if (resSpmb.status === 'fulfilled') setStatSpmb(resSpmb.value.data.data);
        if (resSiswa.status === 'fulfilled') setStatSiswa(resSiswa.value.data.data);
      } catch {
        // Gagal diam-diam untuk data sekunder
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, []);

  return (
    <div className="app-layout">
      <Sidebar user={user} />
      <main className="app-main">
        <div className="app-content">

          <div style={{ marginBottom: '2rem' }}>
            <h1 style={{ fontFamily: 'var(--font-heading)', fontSize: 'var(--text-2xl)', fontWeight: 800 }}>
              Dashboard Admin TU & Keuangan
            </h1>
            <p style={{ color: 'var(--color-text-muted)', marginTop: 4 }}>
              Selamat datang, {user.nama_lengkap || user.nama}. Berikut ringkasan harian.
            </p>
          </div>

          <ProfileEditorCard user={user} onUserUpdate={setUser} compact />

          {loading ? (
            <div className="loading-container">
              <div className="spinner"></div>
              <p>Memuat data...</p>
            </div>
          ) : (
            <>
              {/* Statistik SPMB */}
              {statSpmb && (
                <div className="grid-cols-4" style={{ marginBottom: '2rem' }}>
                  <StatCard icon="bi-person-plus" label="Total Pendaftar" value={statSpmb.total} color="#DBEAFE" iconColor="var(--color-siswa)" />
                  <StatCard icon="bi-hourglass-split" label="Menunggu Verifikasi" value={statSpmb.pending} color="#FEF3C7" iconColor="var(--color-accent-dark)" />
                  <StatCard icon="bi-check-circle" label="Diterima" value={statSpmb.diterima} color="#D1FAE5" iconColor="var(--color-success)" />
                  <StatCard icon="bi-x-circle" label="Ditolak" value={statSpmb.ditolak} color="#FEE2E2" iconColor="var(--color-danger)" />
                </div>
              )}

              {/* Tombol Aksi Cepat */}
              <div className="card">
                <div className="card-header">
                  <h3 className="card-title">Aksi Cepat</h3>
                </div>
                <div style={{ display: 'flex', gap: '1rem', flexWrap: 'wrap' }}>
                  <a href="/dashboard/admin/spmb" className="btn btn-primary">
                    <i className="bi bi-person-check"></i> Verifikasi SPMB
                  </a>
                  <a href="/dashboard/admin/tagihan" className="btn btn-secondary">
                    <i className="bi bi-cash-stack"></i> Kelola Tagihan
                  </a>
                  <a href="/dashboard/admin/siswa" className="btn btn-secondary">
                    <i className="bi bi-people"></i> Data Siswa
                  </a>
                </div>
              </div>
            </>
          )}

        </div>
      </main>
    </div>
  );
}

function StatCard({ icon, label, value, color, iconColor }) {
  return (
    <div className="stat-card">
      <div className="stat-icon" style={{ background: color, color: iconColor }}>
        <i className={`bi ${icon}`}></i>
      </div>
      <div className="stat-body">
        <div className="stat-value">{value ?? '—'}</div>
        <div className="stat-label">{label}</div>
      </div>
    </div>
  );
}

export default DashboardAdmin;
