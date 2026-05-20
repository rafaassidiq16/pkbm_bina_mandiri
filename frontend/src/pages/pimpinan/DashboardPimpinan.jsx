// ============================================================
// src/pages/pimpinan/DashboardPimpinan.jsx — Dashboard Pimpinan
// ============================================================
// Hanya View — tidak ada tombol aksi sesuai spesifikasi roadmap.
// Menampilkan statistik eksekutif: WB per jenjang, keuangan.
// ============================================================

import { useState, useEffect } from 'react';
import Sidebar from '../../components/Sidebar.jsx';
import ProfileEditorCard from '../../components/ProfileEditorCard.jsx';
import { SiswaAPI, TagihanAPI } from '../../services/api.js';

function DashboardPimpinan() {
  const [user, setUser] = useState(() => JSON.parse(localStorage.getItem('pkbm_user') || '{}'));

  const [statJenjang, setStatJenjang] = useState([]);
  const [ringkasan, setRingkasan]     = useState(null);
  const [loading, setLoading]         = useState(true);

  useEffect(() => {
    const fetchData = async () => {
      try {
        const [resJenjang, resKeu] = await Promise.allSettled([
          SiswaAPI.getStatistikPerJenjang(),
          TagihanAPI.getRingkasanBulanan(),
        ]);

        if (resJenjang.status === 'fulfilled') setStatJenjang(resJenjang.value.data.data || []);
        if (resKeu.status === 'fulfilled')     setRingkasan(resKeu.value.data.data);
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, []);

  const formatRupiah = (angka) =>
    'Rp ' + Number(angka || 0).toLocaleString('id-ID');

  return (
    <div className="app-layout">
      <Sidebar user={user} />
      <main className="app-main">
        <div className="app-content">

          <div style={{ marginBottom: '2rem' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 6 }}>
              <h1 style={{ fontFamily: 'var(--font-heading)', fontSize: 'var(--text-2xl)', fontWeight: 800 }}>
                Dashboard Eksekutif
              </h1>
              <span className="badge badge-info">View Only</span>
            </div>
            <p style={{ color: 'var(--color-text-muted)' }}>
              Ringkasan operasional PKBM Bina Mandiri — {new Date().toLocaleDateString('id-ID', { month: 'long', year: 'numeric' })}
            </p>
          </div>

          <ProfileEditorCard user={user} onUserUpdate={setUser} compact />

          {loading ? (
            <div className="loading-container"><div className="spinner"></div><p>Memuat data...</p></div>
          ) : (
            <>
              {/* Statistik WB per Jenjang */}
              <div className="grid-cols-3" style={{ marginBottom: '2rem' }}>
                {statJenjang.map((item) => (
                  <div key={item.jenjang} className="stat-card">
                    <div className="stat-icon" style={{ background: 'var(--color-primary-light)', color: 'var(--color-primary)' }}>
                      <i className="bi bi-people-fill"></i>
                    </div>
                    <div className="stat-body">
                      <div className="stat-value">{item.jumlah}</div>
                      <div className="stat-label">WB {formatJenjang(item.jenjang)}</div>
                    </div>
                  </div>
                ))}
              </div>

              {/* Ringkasan Keuangan */}
              {ringkasan && (
                <div className="card">
                  <div className="card-header">
                    <h3 className="card-title">Ringkasan Keuangan Bulan Ini</h3>
                  </div>
                  <div className="grid-cols-3">
                    <div className="profil-detail-item">
                      <span className="profil-detail-label">Total Tagihan</span>
                      <span className="profil-detail-value">{formatRupiah(ringkasan.total_tagihan)}</span>
                    </div>
                    <div className="profil-detail-item">
                      <span className="profil-detail-label">Sudah Dibayar</span>
                      <span className="profil-detail-value" style={{ color: 'var(--color-success)' }}>{formatRupiah(ringkasan.total_terbayar)}</span>
                    </div>
                    <div className="profil-detail-item">
                      <span className="profil-detail-label">Tunggakan</span>
                      <span className="profil-detail-value" style={{ color: 'var(--color-danger)' }}>{formatRupiah(ringkasan.total_tunggakan)}</span>
                    </div>
                  </div>
                </div>
              )}
            </>
          )}

        </div>
      </main>
    </div>
  );
}

function formatJenjang(j) {
  const m = { paket_a: 'Paket A', paket_b: 'Paket B', paket_c: 'Paket C' };
  return m[j] || j;
}

export default DashboardPimpinan;
