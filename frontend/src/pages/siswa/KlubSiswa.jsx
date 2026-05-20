// ============================================================
// src/pages/siswa/KlubSiswa.jsx — Katalog & Pendaftaran Klub
// ============================================================
// WB melihat semua klub lintas jenjang dan bisa daftar/keluar.
//
// API:
//   GET    /api/klub         → katalog semua klub
//   GET    /api/klub/saya    → klub yang diikuti WB
//   POST   /api/klub/:id/daftar  → daftar masuk klub
//   DELETE /api/klub/:id/keluar  → keluar dari klub
// ============================================================

import { useState, useEffect } from 'react';
import Sidebar from '../../components/Sidebar.jsx';
import { KlubAPI } from '../../services/api.js';

function KlubSiswa() {
  const user = JSON.parse(localStorage.getItem('pkbm_user') || '{}');

  const [semuaKlub, setSemuaKlub] = useState([]);
  const [klubSaya,  setKlubSaya]  = useState(new Set()); // Set of id klub yang diikuti
  const [loading,   setLoading]   = useState(true);
  const [error,     setError]     = useState('');
  // ID klub yang sedang diproses (daftar/keluar) — untuk disable tombol
  const [processing, setProcessing] = useState(null);
  // Tab aktif: 'semua' | 'saya'
  const [tab, setTab] = useState('semua');

  useEffect(() => {
    const fetchData = async () => {
      try {
        const [resAll, resSaya] = await Promise.all([
          KlubAPI.getAll(),
          KlubAPI.getKlubSaya(),
        ]);
        setSemuaKlub(resAll.data.data || []);
        // Buat Set berisi ID klub yang sudah diikuti WB untuk lookup O(1)
        const idKlubSaya = new Set((resSaya.data.data || []).map(k => k.id));
        setKlubSaya(idKlubSaya);
      } catch {
        setError('Gagal memuat data klub.');
      } finally {
        setLoading(false);
      }
    };
    fetchData();
  }, []);

  const handleDaftar = async (klubId) => {
    setProcessing(klubId);
    try {
      await KlubAPI.daftar(klubId);
      setKlubSaya(prev => new Set([...prev, klubId]));
    } catch (err) {
      alert(err.response?.data?.message || 'Gagal mendaftar klub.');
    } finally {
      setProcessing(null);
    }
  };

  const handleKeluar = async (klubId) => {
    if (!window.confirm('Yakin ingin keluar dari klub ini?')) return;
    setProcessing(klubId);
    try {
      await KlubAPI.keluar(klubId);
      setKlubSaya(prev => { const s = new Set(prev); s.delete(klubId); return s; });
    } catch (err) {
      alert(err.response?.data?.message || 'Gagal keluar dari klub.');
    } finally {
      setProcessing(null);
    }
  };

  // Klub yang ditampilkan berdasarkan tab
  const tampilKlub = tab === 'saya'
    ? semuaKlub.filter(k => klubSaya.has(k.id))
    : semuaKlub;

  // Warna ikon per jenis klub
  const warnaKlub = (jenis) => {
    const m = {
      seni:       { bg: '#FCE7F3', color: '#BE185D' },
      olahraga:   { bg: '#DBEAFE', color: '#1D4ED8' },
      teknologi:  { bg: '#EDE9FE', color: '#6D28D9' },
      bahasa:     { bg: '#D1FAE5', color: '#065F46' },
      sains:      { bg: '#FEF3C7', color: '#92400E' },
    };
    return m[jenis] || { bg: 'var(--color-primary-light)', color: 'var(--color-primary)' };
  };

  return (
    <div className="app-layout">
      <Sidebar user={user} />
      <main className="app-main">
        <div className="app-content">

          <div style={{ marginBottom: '1.5rem' }}>
            <h1 style={{ fontFamily: 'var(--font-heading)', fontSize: 'var(--text-2xl)', fontWeight: 800 }}>
              Klub Minat Bakat
            </h1>
            <p style={{ color: 'var(--color-text-muted)', marginTop: 4 }}>
              Ikuti klub yang sesuai dengan minat dan bakat Anda — terbuka lintas jenjang!
            </p>
          </div>

          {/* Tab: Semua Klub / Klub Saya */}
          <div style={{ display: 'flex', gap: 4, marginBottom: '1.5rem', background: 'var(--color-bg)', padding: 4, borderRadius: 'var(--radius-md)', width: 'fit-content', border: '1px solid var(--color-border)' }}>
            {['semua', 'saya'].map(t => (
              <button
                key={t}
                onClick={() => setTab(t)}
                style={{
                  padding: '0.5rem 1.25rem', borderRadius: 'var(--radius-sm)', border: 'none',
                  background: tab === t ? 'var(--color-primary)' : 'transparent',
                  color: tab === t ? 'white' : 'var(--color-text-muted)',
                  fontWeight: 700, fontSize: 'var(--text-sm)', cursor: 'pointer', transition: 'all 0.15s',
                }}
              >
                {t === 'semua' ? `Semua Klub (${semuaKlub.length})` : `Klub Saya (${klubSaya.size})`}
              </button>
            ))}
          </div>

          {loading && <div className="loading-container"><div className="spinner"></div><p>Memuat klub...</p></div>}
          {!loading && error && <div className="alert alert-danger"><i className="bi bi-exclamation-triangle-fill"></i><span>{error}</span></div>}

          {!loading && !error && (
            tampilKlub.length === 0 ? (
              <div className="card"><div className="empty-state">
                <i className="bi bi-people"></i>
                <h3>{tab === 'saya' ? 'Belum Ikuti Klub' : 'Belum Ada Klub'}</h3>
                <p>{tab === 'saya' ? 'Anda belum mengikuti klub apapun. Jelajahi tab "Semua Klub".' : 'Admin belum membuat klub.'}</p>
              </div></div>
            ) : (
              <div className="grid-cols-2">
                {tampilKlub.map(klub => {
                  const warna   = warnaKlub(klub.jenis);
                  const diikuti = klubSaya.has(klub.id);
                  const isProc  = processing === klub.id;

                  return (
                    <div key={klub.id} className="card" style={{ padding: '1.25rem' }}>
                      <div style={{ display: 'flex', gap: '1rem', alignItems: 'flex-start' }}>
                        {/* Ikon klub */}
                        <div style={{
                          width: 52, height: 52, borderRadius: 'var(--radius-md)', flexShrink: 0,
                          background: warna.bg, color: warna.color,
                          display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '1.5rem',
                        }}>
                          <i className="bi bi-people-fill"></i>
                        </div>

                        <div style={{ flex: 1, minWidth: 0 }}>
                          <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 4, flexWrap: 'wrap' }}>
                            <span style={{ fontWeight: 800, fontFamily: 'var(--font-heading)' }}>{klub.nama_klub}</span>
                            {diikuti && <span className="badge badge-success" style={{ fontSize: '0.65rem' }}>✓ Diikuti</span>}
                          </div>
                          {klub.deskripsi && (
                            <p style={{ fontSize: 'var(--text-xs)', color: 'var(--color-text-muted)', marginBottom: 8, lineHeight: 1.6 }}>
                              {klub.deskripsi}
                            </p>
                          )}
                          <div style={{ display: 'flex', gap: 12, flexWrap: 'wrap', fontSize: 'var(--text-xs)', color: 'var(--color-text-muted)' }}>
                            {klub.jumlah_anggota != null && (
                              <span><i className="bi bi-people"></i> {klub.jumlah_anggota} anggota</span>
                            )}
                            {klub.jadwal && (
                              <span><i className="bi bi-calendar-week"></i> {klub.jadwal}</span>
                            )}
                            {klub.tutor_nama && (
                              <span><i className="bi bi-person-badge"></i> {klub.tutor_nama}</span>
                            )}
                          </div>
                        </div>
                      </div>

                      {/* Tombol aksi */}
                      <div style={{ marginTop: '1rem', paddingTop: '1rem', borderTop: '1px solid var(--color-border)', display: 'flex', justifyContent: 'flex-end' }}>
                        {diikuti ? (
                          <button
                            className="btn btn-danger"
                            style={{ padding: '0.5rem 1rem', fontSize: 'var(--text-sm)' }}
                            onClick={() => handleKeluar(klub.id)}
                            disabled={isProc}
                          >
                            {isProc ? <><span className="spinner-sm" style={{ borderTopColor: 'var(--color-danger)' }}></span> Memproses...</> : <><i className="bi bi-box-arrow-right"></i> Keluar</>}
                          </button>
                        ) : (
                          <button
                            className="btn btn-primary"
                            style={{ padding: '0.5rem 1rem', fontSize: 'var(--text-sm)' }}
                            onClick={() => handleDaftar(klub.id)}
                            disabled={isProc}
                          >
                            {isProc ? <><span className="spinner-sm"></span> Mendaftar...</> : <><i className="bi bi-plus-circle"></i> Daftar</>}
                          </button>
                        )}
                      </div>
                    </div>
                  );
                })}
              </div>
            )
          )}
        </div>
      </main>
    </div>
  );
}

export default KlubSiswa;
