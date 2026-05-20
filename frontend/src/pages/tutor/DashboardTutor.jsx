// ============================================================
// src/pages/tutor/DashboardTutor.jsx — Dashboard Tutor
// ============================================================

import { useState, useEffect } from 'react';
import Sidebar from '../../components/Sidebar.jsx';
import ProfileEditorCard from '../../components/ProfileEditorCard.jsx';
import { AbsensiAPI } from '../../services/api.js';

function DashboardTutor() {
  const [user, setUser] = useState(() => JSON.parse(localStorage.getItem('pkbm_user') || '{}'));
  const normalizeSesiAktif = (raw) => {
    if (Array.isArray(raw)) return raw[0] || null;
    return raw && raw.id ? raw : null;
  };

  // State: cek apakah ada sesi absensi aktif milik Tutor ini
  const [sesiAktif, setSesiAktif] = useState(null);
  const [loading, setLoading]     = useState(true);

  useEffect(() => {
    const fetchSesiAktif = async () => {
      try {
        const response = await AbsensiAPI.getSesiAktif();
        setSesiAktif(normalizeSesiAktif(response.data.data));
      } catch {
        setSesiAktif(null); // Tidak ada sesi aktif
      } finally {
        setLoading(false);
      }
    };

    fetchSesiAktif();
  }, []);

  return (
    <div className="app-layout">
      <Sidebar user={user} />
      <main className="app-main">
        <div className="app-content">

          <div style={{ marginBottom: '2rem' }}>
            <h1 style={{ fontFamily: 'var(--font-heading)', fontSize: 'var(--text-2xl)', fontWeight: 800 }}>
              Dashboard Tutor
            </h1>
            <p style={{ color: 'var(--color-text-muted)', marginTop: 4 }}>
              Halo, {user.nama_lengkap || user.nama}! Kelola kelas dan absensi Anda di sini.
            </p>
          </div>

          <ProfileEditorCard user={user} onUserUpdate={setUser} compact />

          {/* Banner Sesi Absensi Aktif */}
          {!loading && sesiAktif && (
            <div className="alert alert-warning" style={{ marginBottom: '1.5rem', borderRadius: 'var(--radius-md)' }}>
              <i className="bi bi-record-circle-fill" style={{ color: 'var(--color-danger)', animation: 'pulse 1s infinite' }}></i>
              <div>
                <strong>Sesi Absensi Sedang Aktif!</strong>
                <p style={{ margin: '2px 0 0', fontSize: 'var(--text-sm)' }}>
                  Sesi untuk <strong>{sesiAktif.nama_rombel}</strong> sedang berjalan.{' '}
                  <a href="/dashboard/tutor/absensi">Pantau sekarang →</a>
                </p>
              </div>
            </div>
          )}

          {/* Aksi Cepat Tutor */}
          <div className="card" style={{ marginBottom: '2rem' }}>
            <div className="card-header">
              <h3 className="card-title">Aksi Cepat</h3>
            </div>
            <div style={{ display: 'flex', gap: '1rem', flexWrap: 'wrap' }}>
              <a href="/dashboard/tutor/absensi" className="btn btn-primary">
                <i className="bi bi-calendar-check"></i> Kelola Absensi
              </a>
              <a href="/dashboard/tutor/kelas" className="btn btn-secondary">
                <i className="bi bi-journal-text"></i> Materi & Tugas
              </a>
              <a href="/dashboard/tutor/ujian" className="btn btn-secondary">
                <i className="bi bi-file-earmark-check"></i> Soal & Ujian
              </a>
            </div>
          </div>

          {/* Placeholder konten berikutnya */}
          <div className="card">
            <div className="empty-state">
              <i className="bi bi-journal-code"></i>
              <h3>Kelas & Jadwal</h3>
              <p>Konten ini akan ditampilkan setelah Anda terhubung ke rombel aktif.</p>
            </div>
          </div>

        </div>
      </main>
    </div>
  );
}

export default DashboardTutor;
