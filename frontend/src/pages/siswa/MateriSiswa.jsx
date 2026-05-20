// ============================================================
// src/pages/siswa/MateriSiswa.jsx — Daftar Materi Belajar WB
// ============================================================
// Warga Belajar melihat dan mengakses materi yang dipublikasikan
// Tutor di rombelnya. WB bisa menandai materi sebagai "selesai".
//
// API:
//   GET /api/materi/rombel/:rombelId  → daftar materi
//   PUT /api/materi/:id/selesai       → tandai selesai
// ============================================================

import { useState, useEffect } from 'react';
import Sidebar from '../../components/Sidebar.jsx';
import { LmsAPI, SiswaAPI } from '../../services/api.js';

function toAssetUrl(path) {
  if (!path) return '';
  if (/^https?:\/\//i.test(path)) return path;
  const apiUrl = import.meta.env.VITE_API_URL || '';
  const origin = apiUrl.replace(/\/api$/, '');
  return `${origin}/${String(path).replace(/\\/g, '/')}`;
}

function MateriSiswa() {
  const [user, setUser] = useState(() => JSON.parse(localStorage.getItem('pkbm_user') || '{}'));

  const [materi,   setMateri]  = useState([]);
  const [loading,  setLoading] = useState(true);
  const [error,    setError]   = useState('');
  // ID materi yang sedang dibuka detailnya (expand/collapse)
  const [dibuka,   setDibuka]  = useState(null);
  // Menyimpan ID materi yang sedang diproses "tandai selesai"
  const [marking,  setMarking] = useState(null);

  useEffect(() => {
    const fetchProfilDanMateri = async () => {
      try {
        setLoading(true);
        setError('');

        const profilRes = await SiswaAPI.getProfilSaya();
        const profil = profilRes.data.data;
        const rombelId = profil?.rombel_id;

        if (!rombelId) {
          setError('Data rombel Anda belum tersedia. Hubungi Admin TU.');
          setMateri([]);
          return;
        }

        const nextUser = {
          ...user,
          rombel_id: rombelId,
          nama_rombel: profil.nama_rombel || null,
          nis: profil.nis || user.nis || null,
        };
        setUser(nextUser);
        localStorage.setItem('pkbm_user', JSON.stringify(nextUser));

        const res = await LmsAPI.getMateriByRombel(rombelId);
        setMateri(res.data.data || []);
      } catch (err) {
        setMateri([]);
        setError(err.response?.data?.message || 'Gagal memuat materi. Coba muat ulang halaman.');
      } finally {
        setLoading(false);
      }
    };

    fetchProfilDanMateri();
  }, []);

  // ── Handler: tandai satu materi sebagai selesai dibaca ──
  const handleTandaiSelesai = async (id) => {
    setMarking(id);
    try {
      await LmsAPI.tandaiMateriSelesai(id);
      // Update state lokal agar langsung berubah tanpa refetch
      setMateri(prev =>
        prev.map(m => m.id === id ? { ...m, sudah_selesai: true } : m)
      );
    } catch {
      // Gagal diam-diam — user bisa coba lagi
    } finally {
      setMarking(null);
    }
  };

  // ── Helper: ikon berdasarkan tipe materi ────────────────
  const ikonTipe = (tipe) => {
    const map = {
      video:    'bi-play-circle-fill',
      video_link: 'bi-play-circle-fill',
      dokumen:  'bi-file-earmark-pdf-fill',
      link:     'bi-link-45deg',
      link_eksternal: 'bi-link-45deg',
      teks:     'bi-file-text-fill',
    };
    return map[tipe] || 'bi-file-earmark';
  };

  const getKontenUrl = (item) => {
    if (item.url_konten) return item.url_konten;
    if (item.url) return item.url;
    if (item.path_file) return toAssetUrl(item.path_file);
    return '';
  };

  return (
    <div className="app-layout">
      <Sidebar user={user} />
      <main className="app-main">
        <div className="app-content">

          {/* Header */}
          <div style={{ marginBottom: '2rem' }}>
            <h1 style={{ fontFamily: 'var(--font-heading)', fontSize: 'var(--text-2xl)', fontWeight: 800 }}>
              Materi Belajar
            </h1>
            <p style={{ color: 'var(--color-text-muted)', marginTop: 4 }}>
              Materi yang dipublikasikan Tutor untuk rombel Anda.
            </p>
          </div>

          {/* Loading */}
          {loading && (
            <div className="loading-container">
              <div className="spinner"></div>
              <p>Memuat materi...</p>
            </div>
          )}

          {/* Error */}
          {!loading && error && (
            <div className="alert alert-danger">
              <i className="bi bi-exclamation-triangle-fill"></i>
              <span>{error}</span>
            </div>
          )}

          {/* Daftar Materi */}
          {!loading && !error && (
            <>
              {/* Ringkasan progres */}
              {materi.length > 0 && (
                <div className="card" style={{ marginBottom: '1.5rem' }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '1.5rem', flexWrap: 'wrap' }}>
                    <ProgresBar
                      selesai={materi.filter(m => m.sudah_selesai).length}
                      total={materi.length}
                    />
                  </div>
                </div>
              )}

              {/* Kondisi kosong */}
              {materi.length === 0 ? (
                <div className="card">
                  <div className="empty-state">
                    <i className="bi bi-book"></i>
                    <h3>Belum Ada Materi</h3>
                    <p>Tutor belum mempublikasikan materi untuk rombel Anda.</p>
                  </div>
                </div>
              ) : (
                <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
                  {materi.map((item, idx) => (
                    <div
                      key={item.id}
                      className="card"
                      style={{ padding: '1rem 1.25rem', cursor: 'pointer' }}
                      onClick={() => setDibuka(dibuka === item.id ? null : item.id)}
                    >
                      {/* Baris utama */}
                      <div style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
                        {/* Nomor urut */}
                        <div style={{
                          width: 32, height: 32, borderRadius: '50%', flexShrink: 0,
                          background: item.sudah_selesai ? 'var(--color-success)' : 'var(--color-primary-light)',
                          color: item.sudah_selesai ? 'white' : 'var(--color-primary)',
                          display: 'flex', alignItems: 'center', justifyContent: 'center',
                          fontFamily: 'var(--font-heading)', fontWeight: 800, fontSize: 'var(--text-sm)',
                        }}>
                          {item.sudah_selesai ? <i className="bi bi-check-lg"></i> : idx + 1}
                        </div>

                        {/* Ikon tipe & judul */}
                        <div style={{ flex: 1, minWidth: 0 }}>
                          <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 2 }}>
                            <i className={`bi ${ikonTipe(item.tipe)}`} style={{ color: 'var(--color-primary)', fontSize: '0.9rem' }}></i>
                            <span style={{ fontWeight: 700, fontSize: 'var(--text-sm)' }}>
                              {item.judul}
                            </span>
                            {item.sudah_selesai && (
                              <span className="badge badge-success" style={{ fontSize: '0.65rem' }}>Selesai</span>
                            )}
                          </div>
                          {item.nama_mapel && (
                            <span style={{ fontSize: 'var(--text-xs)', color: 'var(--color-text-muted)' }}>
                              {item.nama_mapel}
                            </span>
                          )}
                        </div>

                        {/* Chevron expand/collapse */}
                        <i className={`bi bi-chevron-${dibuka === item.id ? 'up' : 'down'}`}
                           style={{ color: 'var(--color-text-muted)', fontSize: '0.85rem', flexShrink: 0 }}></i>
                      </div>

                      {/* Konten ekspanded */}
                      {dibuka === item.id && (
                        <div
                          style={{ marginTop: '1rem', paddingTop: '1rem', borderTop: '1px solid var(--color-border)' }}
                          onClick={e => e.stopPropagation()} // Cegah collapse saat klik konten
                        >
                          {item.deskripsi && (
                            <p style={{ fontSize: 'var(--text-sm)', color: 'var(--color-text-muted)', marginBottom: '1rem', lineHeight: 1.7 }}>
                              {item.deskripsi}
                            </p>
                          )}

                          {/* Link/file materi */}
                          {getKontenUrl(item) && (
                            <a
                              href={getKontenUrl(item)}
                              target="_blank"
                              rel="noopener noreferrer"
                              className="btn btn-primary"
                              style={{ marginRight: '0.75rem' }}
                            >
                              <i className={`bi ${ikonTipe(item.tipe)}`}></i>
                              {item.tipe === 'video' || item.tipe === 'video_link'
                                ? 'Tonton Video'
                                : item.tipe === 'link' || item.tipe === 'link_eksternal'
                                  ? 'Buka Link'
                                  : 'Unduh Materi'}
                            </a>
                          )}

                          {/* Tombol tandai selesai — hanya tampil jika belum selesai */}
                          {!item.sudah_selesai && (
                            <button
                              className="btn btn-secondary"
                              onClick={() => handleTandaiSelesai(item.id)}
                              disabled={marking === item.id}
                            >
                              {marking === item.id ? (
                                <><span className="spinner-sm" style={{ borderTopColor: 'var(--color-primary)' }}></span> Menyimpan...</>
                              ) : (
                                <><i className="bi bi-check-circle"></i> Tandai Selesai Dibaca</>
                              )}
                            </button>
                          )}
                        </div>
                      )}
                    </div>
                  ))}
                </div>
              )}
            </>
          )}

        </div>
      </main>
    </div>
  );
}

// ── Komponen: Bar Progres Materi ─────────────────────────────
function ProgresBar({ selesai, total }) {
  const persen = total > 0 ? Math.round((selesai / total) * 100) : 0;
  return (
    <div style={{ flex: 1 }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 6, fontSize: 'var(--text-sm)' }}>
        <span style={{ fontWeight: 700 }}>Progres Belajar</span>
        <span style={{ color: 'var(--color-text-muted)' }}>{selesai} / {total} materi selesai</span>
      </div>
      <div style={{ height: 10, background: 'var(--color-border)', borderRadius: 999, overflow: 'hidden' }}>
        <div style={{
          height: '100%', width: `${persen}%`,
          background: 'var(--color-success)',
          borderRadius: 999,
          transition: 'width 0.4s ease',
        }} />
      </div>
      <p style={{ textAlign: 'right', fontSize: 'var(--text-xs)', color: 'var(--color-text-muted)', marginTop: 4 }}>
        {persen}% selesai
      </p>
    </div>
  );
}

export default MateriSiswa;
