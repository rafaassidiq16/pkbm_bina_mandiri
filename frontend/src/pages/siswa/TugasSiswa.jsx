// ============================================================
// src/pages/siswa/TugasSiswa.jsx — Daftar & Pengumpulan Tugas
// ============================================================
// Warga Belajar melihat tugas dari Tutor dan mengumpulkan file.
//
// API:
//   GET  /api/tugas/rombel/:rombelId    → daftar tugas
//   POST /api/tugas/:id/kumpulkan       → upload file tugas
// ============================================================

import { useState, useEffect, useRef } from 'react';
import Sidebar from '../../components/Sidebar.jsx';
import { LmsAPI } from '../../services/api.js';

function TugasSiswa() {
  const user     = JSON.parse(localStorage.getItem('pkbm_user') || '{}');
  const rombelId = user.rombel_id;

  const [tugas,    setTugas]   = useState([]);
  const [loading,  setLoading] = useState(true);
  const [error,    setError]   = useState('');
  // ID tugas yang form uploadnya sedang dibuka
  const [formTerbuka, setFormTerbuka] = useState(null);

  useEffect(() => {
    if (!rombelId) { setLoading(false); setError('Data rombel tidak ditemukan.'); return; }

    const fetch_ = async () => {
      try {
        const res = await LmsAPI.getTugasByRombel(rombelId);
        setTugas(res.data.data || []);
      } catch { setError('Gagal memuat tugas.'); }
      finally  { setLoading(false); }
    };
    fetch_();
  }, [rombelId]);

  // ── Hitung status deadline ───────────────────────────────
  const statusDeadline = (deadline) => {
    if (!deadline) return { label: 'Tidak ada deadline', color: 'var(--color-text-muted)', kritis: false };
    const sisa = new Date(deadline) - new Date();
    const hari = Math.ceil(sisa / (1000 * 60 * 60 * 24));
    if (sisa < 0)    return { label: 'Sudah lewat deadline', color: 'var(--color-danger)', kritis: true };
    if (hari <= 1)   return { label: 'Deadline hari ini!', color: 'var(--color-danger)', kritis: true };
    if (hari <= 3)   return { label: `Sisa ${hari} hari`, color: 'var(--color-warning)', kritis: false };
    return { label: `Sisa ${hari} hari`, color: 'var(--color-success)', kritis: false };
  };

  return (
    <div className="app-layout">
      <Sidebar user={user} />
      <main className="app-main">
        <div className="app-content">

          <div style={{ marginBottom: '2rem' }}>
            <h1 style={{ fontFamily: 'var(--font-heading)', fontSize: 'var(--text-2xl)', fontWeight: 800 }}>
              Tugas Saya
            </h1>
            <p style={{ color: 'var(--color-text-muted)', marginTop: 4 }}>
              Kumpulkan tugas sebelum batas waktu yang ditentukan.
            </p>
          </div>

          {loading && <div className="loading-container"><div className="spinner"></div><p>Memuat tugas...</p></div>}
          {!loading && error && <div className="alert alert-danger"><i className="bi bi-exclamation-triangle-fill"></i><span>{error}</span></div>}

          {!loading && !error && (
            tugas.length === 0 ? (
              <div className="card"><div className="empty-state">
                <i className="bi bi-pencil"></i>
                <h3>Belum Ada Tugas</h3>
                <p>Tutor belum memberikan tugas untuk rombel Anda.</p>
              </div></div>
            ) : (
              <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
                {tugas.map((t) => {
                  const dl     = statusDeadline(t.deadline);
                  const sudah  = !!t.pengumpulan_saya;
                  const nilai  = t.pengumpulan_saya?.nilai;
                  const isOpen = formTerbuka === t.id;

                  return (
                    <div key={t.id} className="card" style={{ padding: '1.25rem' }}>
                      {/* Baris header tugas */}
                      <div style={{ display: 'flex', alignItems: 'flex-start', gap: '1rem', marginBottom: isOpen || sudah ? '1rem' : 0 }}>
                        {/* Ikon status */}
                        <div style={{
                          width: 40, height: 40, borderRadius: 'var(--radius-md)', flexShrink: 0,
                          display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '1.1rem',
                          background: nilai != null ? '#D1FAE5' : sudah ? '#DBEAFE' : dl.kritis ? '#FEE2E2' : 'var(--color-primary-light)',
                          color: nilai != null ? 'var(--color-success)' : sudah ? 'var(--color-siswa)' : dl.kritis ? 'var(--color-danger)' : 'var(--color-primary)',
                        }}>
                          <i className={`bi ${nilai != null ? 'bi-patch-check-fill' : sudah ? 'bi-check-circle-fill' : 'bi-pencil-square'}`}></i>
                        </div>

                        <div style={{ flex: 1, minWidth: 0 }}>
                          <div style={{ display: 'flex', alignItems: 'center', gap: 8, flexWrap: 'wrap', marginBottom: 4 }}>
                            <span style={{ fontWeight: 700, fontSize: 'var(--text-sm)' }}>{t.judul}</span>
                            {/* Badge status pengumpulan */}
                            {nilai != null && (
                              <span className="badge badge-success">Dinilai: {nilai}</span>
                            )}
                            {sudah && nilai == null && (
                              <span className="badge badge-info">Sudah Dikumpulkan</span>
                            )}
                            {!sudah && dl.kritis && (
                              <span className="badge badge-danger">Mendesak!</span>
                            )}
                          </div>
                          <div style={{ display: 'flex', gap: 16, flexWrap: 'wrap' }}>
                            <span style={{ fontSize: 'var(--text-xs)', color: dl.color, fontWeight: 600 }}>
                              <i className="bi bi-clock"></i> {dl.label}
                            </span>
                            {t.deadline && (
                              <span style={{ fontSize: 'var(--text-xs)', color: 'var(--color-text-muted)' }}>
                                Deadline: {new Date(t.deadline).toLocaleDateString('id-ID', { day:'numeric', month:'long', year:'numeric', hour:'2-digit', minute:'2-digit' })}
                              </span>
                            )}
                          </div>
                        </div>

                        {/* Tombol kumpulkan / lihat */}
                        {!sudah && (
                          <button
                            className="btn btn-primary"
                            style={{ flexShrink: 0, padding: '0.5rem 1rem' }}
                            onClick={() => setFormTerbuka(isOpen ? null : t.id)}
                          >
                            <i className={`bi bi-${isOpen ? 'chevron-up' : 'upload'}`}></i>
                            {isOpen ? 'Tutup' : 'Kumpulkan'}
                          </button>
                        )}
                      </div>

                      {/* Deskripsi tugas */}
                      {t.deskripsi && (
                        <p style={{ fontSize: 'var(--text-sm)', color: 'var(--color-text-muted)', lineHeight: 1.7, marginBottom: isOpen ? '1rem' : 0, paddingLeft: '3.25rem' }}>
                          {t.deskripsi}
                        </p>
                      )}

                      {/* Form upload — hanya tampil jika belum mengumpulkan & form dibuka */}
                      {isOpen && !sudah && (
                        <FormKumpulkan
                          tugasId={t.id}
                          onSuccess={(pengumpulan) => {
                            // Update state lokal agar langsung berubah
                            setTugas(prev => prev.map(x =>
                              x.id === t.id ? { ...x, pengumpulan_saya: pengumpulan } : x
                            ));
                            setFormTerbuka(null);
                          }}
                        />
                      )}

                      {/* Tampilkan info pengumpulan jika sudah */}
                      {sudah && (
                        <div style={{
                          background: nilai != null ? '#F0FDF4' : '#EFF6FF',
                          border: `1px solid ${nilai != null ? 'var(--color-success)' : 'var(--color-siswa)'}`,
                          borderRadius: 'var(--radius-md)',
                          padding: '0.75rem 1rem',
                          fontSize: 'var(--text-sm)',
                          display: 'flex', alignItems: 'center', gap: 10,
                        }}>
                          <i className={`bi ${nilai != null ? 'bi-patch-check-fill' : 'bi-check-circle-fill'}`}
                             style={{ color: nilai != null ? 'var(--color-success)' : 'var(--color-siswa)', fontSize: '1.1rem' }}></i>
                          <div>
                            <strong>
                              {nilai != null ? `Tugas dinilai: ${nilai} / 100` : 'Tugas berhasil dikumpulkan'}
                            </strong>
                            {t.pengumpulan_saya?.feedback && (
                              <p style={{ margin: '4px 0 0', color: 'var(--color-text-muted)' }}>
                                Catatan Tutor: {t.pengumpulan_saya.feedback}
                              </p>
                            )}
                          </div>
                        </div>
                      )}
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

// ── Sub-komponen: Form Upload Pengumpulan Tugas ──────────────
function FormKumpulkan({ tugasId, onSuccess }) {
  const [file,    setFile]    = useState(null);
  const [catatan, setCatatan] = useState('');
  const [loading, setLoading] = useState(false);
  const [error,   setError]   = useState('');
  const fileRef = useRef();

  const handleSubmit = async () => {
    if (!file) { setError('Pilih file tugas terlebih dahulu.'); return; }
    setLoading(true); setError('');
    try {
      const fd = new FormData();
      fd.append('file',    file);
      fd.append('catatan', catatan);
      const res = await LmsAPI.kumpulkanTugas(tugasId, fd);
      onSuccess(res.data.data);
    } catch (err) {
      setError(err.response?.data?.message || 'Gagal mengumpulkan tugas.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div style={{
      background: 'var(--color-bg)', border: '2px dashed var(--color-primary)',
      borderRadius: 'var(--radius-md)', padding: '1.25rem', marginTop: '0.5rem',
    }}>
      {error && <div className="alert alert-danger" style={{ marginBottom: '1rem', padding: '0.5rem 0.75rem' }}>
        <i className="bi bi-exclamation-triangle-fill"></i><span>{error}</span>
      </div>}

      <div className="form-group">
        <label className="form-label">File Tugas <span className="required">*</span></label>
        <input
          ref={fileRef} type="file"
          accept=".pdf,.doc,.docx,.jpg,.jpeg,.png,.zip"
          onChange={e => setFile(e.target.files[0])}
          disabled={loading}
          style={{ fontSize: 'var(--text-sm)', cursor: 'pointer' }}
        />
        <p style={{ fontSize: 'var(--text-xs)', color: 'var(--color-text-muted)', marginTop: 4 }}>
          Format: PDF, Word, gambar, atau ZIP. Maks 10MB.
        </p>
      </div>

      <div className="form-group" style={{ marginBottom: '1rem' }}>
        <label className="form-label">Catatan untuk Tutor (opsional)</label>
        <textarea
          className="form-input" rows={2} placeholder="Tulis catatan jika perlu..."
          value={catatan} onChange={e => setCatatan(e.target.value)}
          disabled={loading} style={{ resize: 'vertical' }}
        />
      </div>

      <button className="btn btn-primary" onClick={handleSubmit} disabled={loading || !file}>
        {loading ? <><span className="spinner-sm"></span> Mengumpulkan...</> : <><i className="bi bi-send-fill"></i> Kirim Tugas</>}
      </button>
    </div>
  );
}

export default TugasSiswa;
