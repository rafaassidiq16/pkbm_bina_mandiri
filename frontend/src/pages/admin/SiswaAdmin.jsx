// ============================================================
// src/pages/admin/SiswaAdmin.jsx — Manajemen Data Warga Belajar
// ============================================================
// Admin TU melihat, mencari, memfilter, dan mengedit data
// seluruh Warga Belajar yang sudah aktif di sistem.
//
// API:
//   GET /api/siswa                        → daftar semua WB (+ filter)
//   GET /api/siswa/:id                    → detail satu WB
//   PUT /api/siswa/:id                    → update data WB
//   GET /api/siswa/statistik/per-jenjang  → jumlah per jenjang
// ============================================================

import { useState, useEffect, useRef } from 'react';
import Sidebar from '../../components/Sidebar.jsx';
import { SiswaAPI } from '../../services/api.js';

// ── Konstanta ────────────────────────────────────────────────
const JENJANG_LABEL = {
  paket_a: 'Paket A',
  paket_b: 'Paket B',
  paket_c: 'Paket C',
};

const JENJANG_COLOR = {
  paket_a: { bg: '#DBEAFE', color: '#1E40AF' },
  paket_b: { bg: '#D1FAE5', color: '#065F46' },
  paket_c: { bg: '#F3E8FF', color: '#6B21A8' },
};

function SiswaAdmin() {
  const user = JSON.parse(localStorage.getItem('pkbm_user') || '{}');

  // ── State: Daftar Siswa ──────────────────────────────────
  const [siswaList,  setSiswaList]  = useState([]);
  const [statJenjang, setStatJenjang] = useState([]);
  const [loading,    setLoading]    = useState(true);
  const [error,      setError]      = useState('');

  // ── State: Filter & Pencarian ────────────────────────────
  const [search,       setSearch]       = useState('');
  const [filterJenjang, setFilterJenjang] = useState('');
  const [filterAktif,  setFilterAktif]  = useState('1'); // '1' = aktif, '0' = nonaktif, '' = semua

  // ── State: Modal Detail / Edit ───────────────────────────
  const [modalMode,   setModalMode]   = useState(null); // null | 'detail' | 'edit'
  const [selectedWB,  setSelectedWB]  = useState(null);
  const [loadDetail,  setLoadDetail]  = useState(false);

  // ── State: Form Edit ─────────────────────────────────────
  const [formEdit,    setFormEdit]    = useState({});
  const [saving,      setSaving]      = useState(false);
  const [saveError,   setSaveError]   = useState('');
  const [saveSuccess, setSaveSuccess] = useState('');

  // ── Fetch: Daftar Siswa & Statistik ─────────────────────
  useEffect(() => {
    const fetchData = async () => {
      setLoading(true);
      setError('');
      try {
        const params = {};
        if (filterJenjang) params.jenjang = filterJenjang;
        if (filterAktif !== '') params.is_aktif = filterAktif;

        const [resList, resStat] = await Promise.allSettled([
          SiswaAPI.getAll(params),
          SiswaAPI.getStatistikPerJenjang(),
        ]);

        if (resList.status === 'fulfilled')  setSiswaList(resList.value.data.data || []);
        else setError('Gagal memuat data siswa.');
        if (resStat.status === 'fulfilled') setStatJenjang(resStat.value.data.data || []);
      } catch {
        setError('Terjadi kesalahan saat memuat data.');
      } finally {
        setLoading(false);
      }
    };
    fetchData();
  }, [filterJenjang, filterAktif]);

  // ── Filter Pencarian Lokal (di client) ───────────────────
  // Filter berdasarkan nama atau NIS — tidak hit API ulang
  const siswaFiltered = siswaList.filter(s => {
    if (!search.trim()) return true;
    const q = search.toLowerCase();
    return (
      s.nama_lengkap?.toLowerCase().includes(q) ||
      s.nis?.toLowerCase().includes(q) ||
      s.email?.toLowerCase().includes(q)
    );
  });

  // ── Buka Modal Detail Siswa ──────────────────────────────
  const bukaDetail = async (id, mode = 'detail') => {
    setLoadDetail(true);
    setModalMode(mode);
    setSaveError('');
    setSaveSuccess('');
    try {
      const res = await SiswaAPI.getById(id);
      const data = res.data.data;
      setSelectedWB(data);
      // Isi form edit dengan data saat ini
      setFormEdit({
        alamat:   data.alamat   || '',
        nama_wali: data.nama_wali || '',
        no_telp:  data.no_telp  || '',
      });
    } catch {
      alert('Gagal memuat detail siswa.');
      setModalMode(null);
    } finally {
      setLoadDetail(false);
    }
  };

  // ── Tutup Modal ──────────────────────────────────────────
  const tutupModal = () => {
    setModalMode(null);
    setSelectedWB(null);
    setSaveError('');
    setSaveSuccess('');
  };

  // ── Simpan Perubahan Data Siswa ──────────────────────────
  const handleSimpan = async () => {
    setSaving(true);
    setSaveError('');
    setSaveSuccess('');
    try {
      await SiswaAPI.update(selectedWB.id, formEdit);
      setSaveSuccess('Data Warga Belajar berhasil diperbarui.');
      // Update data di list tanpa refetch ulang
      setSiswaList(prev =>
        prev.map(s => s.id === selectedWB.id
          ? { ...s, ...formEdit }
          : s
        )
      );
      setSelectedWB(prev => ({ ...prev, ...formEdit }));
    } catch (err) {
      setSaveError(err.response?.data?.message || 'Gagal menyimpan perubahan.');
    } finally {
      setSaving(false);
    }
  };

  // ── Format Tanggal ───────────────────────────────────────
  const formatTanggal = (tgl) => {
    if (!tgl) return '—';
    return new Date(tgl).toLocaleDateString('id-ID', {
      day: '2-digit', month: 'long', year: 'numeric',
    });
  };

  // ── Total WB Aktif (ringkasan cepat) ────────────────────
  const totalWB    = statJenjang.reduce((sum, s) => sum + (s.jumlah || 0), 0);
  const totalAktif = siswaList.filter(s => s.is_aktif).length;

  return (
    <div className="app-layout">
      <Sidebar user={user} />
      <main className="app-main">
        <div className="app-content">

          {/* ── Header ─────────────────────────────────── */}
          <div style={{ marginBottom: '2rem' }}>
            <h1 style={{
              fontFamily: 'var(--font-heading)', fontSize: 'var(--text-2xl)', fontWeight: 800,
            }}>
              Data Warga Belajar
            </h1>
            <p style={{ color: 'var(--color-text-muted)', marginTop: 4 }}>
              Kelola seluruh data Warga Belajar aktif di PKBM Bina Mandiri.
            </p>
          </div>

          {/* ── Statistik per Jenjang ───────────────────── */}
          <div className="grid-cols-4" style={{ marginBottom: '2rem' }}>
            <StatCard
              icon="bi-people-fill" label="Total WB Terdaftar"
              value={totalWB} bg="#F0FDF4" color="#16A34A"
            />
            {statJenjang.map(s => (
              <StatCard
                key={s.jenjang}
                icon="bi-mortarboard-fill"
                label={`WB ${JENJANG_LABEL[s.jenjang] || s.jenjang}`}
                value={s.jumlah}
                bg={JENJANG_COLOR[s.jenjang]?.bg || '#F1F5F9'}
                color={JENJANG_COLOR[s.jenjang]?.color || '#475569'}
              />
            ))}
          </div>

          {/* ── Kartu Tabel ─────────────────────────────── */}
          <div className="card">
            <div className="card-header" style={{ flexWrap: 'wrap', gap: '1rem' }}>
              <h3 className="card-title">Daftar Warga Belajar</h3>

              {/* ── Filter & Pencarian ─────────────────── */}
              <div style={{ display: 'flex', gap: '0.75rem', flexWrap: 'wrap', alignItems: 'center' }}>
                {/* Pencarian */}
                <div style={{ position: 'relative' }}>
                  <i className="bi bi-search" style={{
                    position: 'absolute', left: 10, top: '50%', transform: 'translateY(-50%)',
                    color: 'var(--color-text-muted)', fontSize: '0.85rem',
                  }} />
                  <input
                    type="text"
                    placeholder="Cari nama / NIS / email…"
                    value={search}
                    onChange={e => setSearch(e.target.value)}
                    className="form-input"
                    style={{ paddingLeft: '2.2rem', width: 220, height: 38 }}
                  />
                </div>

                {/* Filter Jenjang */}
                <select
                  value={filterJenjang}
                  onChange={e => setFilterJenjang(e.target.value)}
                  className="form-input"
                  style={{ height: 38, width: 140 }}
                >
                  <option value="">Semua Jenjang</option>
                  <option value="paket_a">Paket A</option>
                  <option value="paket_b">Paket B</option>
                  <option value="paket_c">Paket C</option>
                </select>

                {/* Filter Status Aktif */}
                <select
                  value={filterAktif}
                  onChange={e => setFilterAktif(e.target.value)}
                  className="form-input"
                  style={{ height: 38, width: 140 }}
                >
                  <option value="1">Aktif</option>
                  <option value="0">Nonaktif</option>
                  <option value="">Semua Status</option>
                </select>
              </div>
            </div>

            {/* ── Konten Tabel ──────────────────────────── */}
            {loading ? (
              <div className="loading-container" style={{ padding: '3rem' }}>
                <div className="spinner" />
                <p style={{ marginTop: 12, color: 'var(--color-text-muted)' }}>Memuat data...</p>
              </div>
            ) : error ? (
              <div className="alert alert-danger" style={{ margin: '1.5rem' }}>
                <i className="bi bi-exclamation-triangle-fill" />
                <span>{error}</span>
              </div>
            ) : siswaFiltered.length === 0 ? (
              <div className="empty-state">
                <i className="bi bi-people" />
                <h3>Tidak Ada Data</h3>
                <p>Tidak ada Warga Belajar yang sesuai dengan filter yang dipilih.</p>
              </div>
            ) : (
              <div className="table-wrapper">
                <table className="table">
                  <thead>
                    <tr>
                      <th>NIS</th>
                      <th>Nama Lengkap</th>
                      <th>Jenjang</th>
                      <th>Rombel</th>
                      <th>Jenis Kelamin</th>
                      <th>Status</th>
                      <th>Aksi</th>
                    </tr>
                  </thead>
                  <tbody>
                    {siswaFiltered.map(s => (
                      <tr key={s.id}>
                        <td>
                          <code style={{
                            fontSize: '0.8rem', background: '#F1F5F9',
                            padding: '2px 6px', borderRadius: 4,
                          }}>
                            {s.nis}
                          </code>
                        </td>
                        <td>
                          <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                            {/* Avatar inisial */}
                            <div style={{
                              width: 32, height: 32, borderRadius: '50%',
                              background: 'var(--color-primary-light)',
                              color: 'var(--color-primary)',
                              display: 'flex', alignItems: 'center', justifyContent: 'center',
                              fontWeight: 700, fontSize: '0.8rem', flexShrink: 0,
                            }}>
                              {s.nama_lengkap?.charAt(0)?.toUpperCase() || 'W'}
                            </div>
                            <div>
                              <div style={{ fontWeight: 600, fontSize: '0.9rem' }}>{s.nama_lengkap}</div>
                              <div style={{ color: 'var(--color-text-muted)', fontSize: '0.78rem' }}>{s.email}</div>
                            </div>
                          </div>
                        </td>
                        <td>
                          <span className="badge" style={{
                            background: JENJANG_COLOR[s.jenjang]?.bg || '#F1F5F9',
                            color:      JENJANG_COLOR[s.jenjang]?.color || '#475569',
                          }}>
                            {JENJANG_LABEL[s.jenjang] || s.jenjang}
                          </span>
                        </td>
                        <td style={{ color: s.nama_rombel ? 'var(--color-text)' : 'var(--color-text-muted)', fontSize: '0.88rem' }}>
                          {s.nama_rombel || '—'}
                        </td>
                        <td style={{ fontSize: '0.88rem' }}>
                          {s.jenis_kelamin === 'L' ? (
                            <span style={{ color: '#2563EB' }}><i className="bi bi-gender-male" /> Laki-laki</span>
                          ) : (
                            <span style={{ color: '#DB2777' }}><i className="bi bi-gender-female" /> Perempuan</span>
                          )}
                        </td>
                        <td>
                          <span className={`badge ${s.is_aktif ? 'badge-success' : 'badge-danger'}`}>
                            {s.is_aktif ? 'Aktif' : 'Nonaktif'}
                          </span>
                        </td>
                        <td>
                          <div style={{ display: 'flex', gap: 6 }}>
                            <button
                              className="btn btn-secondary"
                              style={{ padding: '4px 10px', fontSize: '0.8rem' }}
                              onClick={() => bukaDetail(s.id, 'detail')}
                            >
                              <i className="bi bi-eye" /> Detail
                            </button>
                            <button
                              className="btn btn-primary"
                              style={{ padding: '4px 10px', fontSize: '0.8rem' }}
                              onClick={() => bukaDetail(s.id, 'edit')}
                            >
                              <i className="bi bi-pencil" /> Edit
                            </button>
                          </div>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}

            {/* Footer jumlah data */}
            {!loading && !error && (
              <div style={{
                padding: '0.75rem 1.5rem',
                borderTop: '1px solid var(--color-border)',
                color: 'var(--color-text-muted)',
                fontSize: '0.83rem',
              }}>
                Menampilkan <strong>{siswaFiltered.length}</strong> dari <strong>{siswaList.length}</strong> Warga Belajar
              </div>
            )}
          </div>

        </div>
      </main>

      {/* ── Modal Detail / Edit ─────────────────────────── */}
      {modalMode && (
        <div style={{
          position: 'fixed', inset: 0,
          background: 'rgba(0,0,0,0.45)', backdropFilter: 'blur(4px)',
          display: 'flex', alignItems: 'center', justifyContent: 'center',
          zIndex: 1000, padding: '1rem',
        }}
          onClick={e => { if (e.target === e.currentTarget) tutupModal(); }}
        >
          <div style={{
            background: 'var(--color-surface)',
            borderRadius: 'var(--radius-lg)',
            boxShadow: 'var(--shadow-lg)',
            width: '100%', maxWidth: 640,
            maxHeight: '90vh', overflowY: 'auto',
          }}>

            {/* Header Modal */}
            <div style={{
              padding: '1.25rem 1.5rem',
              borderBottom: '1px solid var(--color-border)',
              display: 'flex', alignItems: 'center', justifyContent: 'space-between',
            }}>
              <h3 style={{ fontFamily: 'var(--font-heading)', fontWeight: 700, margin: 0, fontSize: '1.1rem' }}>
                <i className={`bi ${modalMode === 'edit' ? 'bi-pencil-square' : 'bi-person-badge'}`}
                  style={{ marginRight: 8, color: 'var(--color-primary)' }} />
                {modalMode === 'edit' ? 'Edit Data Warga Belajar' : 'Detail Warga Belajar'}
              </h3>
              <button onClick={tutupModal} style={{
                background: 'none', border: 'none', cursor: 'pointer',
                fontSize: '1.25rem', color: 'var(--color-text-muted)',
                display: 'flex', alignItems: 'center',
              }}>
                <i className="bi bi-x-lg" />
              </button>
            </div>

            {/* Body Modal */}
            <div style={{ padding: '1.5rem' }}>
              {loadDetail ? (
                <div className="loading-container" style={{ padding: '2rem' }}>
                  <div className="spinner" />
                </div>
              ) : selectedWB ? (
                <>
                  {/* Info Tidak Bisa Diubah */}
                  <div style={{
                    background: 'var(--color-bg)', borderRadius: 'var(--radius-md)',
                    padding: '1rem', marginBottom: '1.5rem',
                    display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0.75rem',
                  }}>
                    {[
                      { label: 'NIS', value: selectedWB.nis },
                      { label: 'Nama Lengkap', value: selectedWB.nama_lengkap },
                      { label: 'Email', value: selectedWB.email },
                      { label: 'Jenjang', value: JENJANG_LABEL[selectedWB.jenjang] || selectedWB.jenjang },
                      { label: 'Rombel', value: selectedWB.nama_rombel || '—' },
                      { label: 'Jenis Kelamin', value: selectedWB.jenis_kelamin === 'L' ? 'Laki-laki' : 'Perempuan' },
                      { label: 'Tanggal Lahir', value: formatTanggal(selectedWB.tanggal_lahir) },
                      { label: 'Terdaftar', value: formatTanggal(selectedWB.created_at) },
                    ].map(({ label, value }) => (
                      <div key={label} className="profil-detail-item">
                        <span className="profil-detail-label">{label}</span>
                        <span className="profil-detail-value" style={{ fontSize: '0.9rem' }}>{value || '—'}</span>
                      </div>
                    ))}
                  </div>

                  {/* Field yang Bisa Diubah */}
                  {modalMode === 'edit' ? (
                    <>
                      <div className="form-group">
                        <label className="form-label">
                          Alamat
                        </label>
                        <textarea
                          className="form-input"
                          rows={3}
                          placeholder="Masukkan alamat lengkap..."
                          value={formEdit.alamat}
                          onChange={e => setFormEdit(p => ({ ...p, alamat: e.target.value }))}
                          style={{ resize: 'vertical' }}
                        />
                      </div>

                      <div className="form-group">
                        <label className="form-label">Nama Wali / Orang Tua</label>
                        <input
                          type="text"
                          className="form-input"
                          placeholder="Nama wali..."
                          value={formEdit.nama_wali}
                          onChange={e => setFormEdit(p => ({ ...p, nama_wali: e.target.value }))}
                        />
                      </div>

                      <div className="form-group">
                        <label className="form-label">No. Telepon</label>
                        <input
                          type="tel"
                          className="form-input"
                          placeholder="08xxxxxxxxxx"
                          value={formEdit.no_telp}
                          onChange={e => setFormEdit(p => ({ ...p, no_telp: e.target.value }))}
                        />
                      </div>

                      {/* Feedback Simpan */}
                      {saveError && (
                        <div className="alert alert-danger" style={{ marginBottom: '1rem' }}>
                          <i className="bi bi-exclamation-circle" />
                          <span>{saveError}</span>
                        </div>
                      )}
                      {saveSuccess && (
                        <div className="alert alert-success" style={{ marginBottom: '1rem' }}>
                          <i className="bi bi-check-circle" />
                          <span>{saveSuccess}</span>
                        </div>
                      )}

                      <div style={{ display: 'flex', gap: '0.75rem', justifyContent: 'flex-end' }}>
                        <button className="btn btn-secondary" onClick={tutupModal}>Batal</button>
                        <button
                          className="btn btn-primary"
                          onClick={handleSimpan}
                          disabled={saving}
                        >
                          {saving ? <><div className="spinner" style={{ width: 16, height: 16 }} /> Menyimpan...</> : <><i className="bi bi-check2" /> Simpan Perubahan</>}
                        </button>
                      </div>
                    </>
                  ) : (
                    /* Mode Detail — tampilkan field yang tidak bisa diubah */
                    <>
                      <div style={{ display: 'grid', gridTemplateColumns: '1fr', gap: '0.5rem', marginBottom: '1rem' }}>
                        {[
                          { label: 'Alamat', value: selectedWB.alamat || '—' },
                          { label: 'Nama Wali', value: selectedWB.nama_wali || '—' },
                          { label: 'No. Telepon', value: selectedWB.no_telp || '—' },
                        ].map(({ label, value }) => (
                          <div key={label} className="profil-detail-item">
                            <span className="profil-detail-label">{label}</span>
                            <span className="profil-detail-value" style={{ fontSize: '0.9rem' }}>{value}</span>
                          </div>
                        ))}
                      </div>
                      <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '0.75rem' }}>
                        <button className="btn btn-secondary" onClick={tutupModal}>Tutup</button>
                        <button
                          className="btn btn-primary"
                          onClick={() => setModalMode('edit')}
                        >
                          <i className="bi bi-pencil" /> Edit Data
                        </button>
                      </div>
                    </>
                  )}
                </>
              ) : null}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

// ── Komponen Kecil: Kartu Statistik ─────────────────────────
function StatCard({ icon, label, value, bg, color }) {
  return (
    <div className="stat-card">
      <div className="stat-icon" style={{ background: bg, color }}>
        <i className={`bi ${icon}`} />
      </div>
      <div className="stat-body">
        <div className="stat-value">{value ?? '—'}</div>
        <div className="stat-label">{label}</div>
      </div>
    </div>
  );
}

export default SiswaAdmin;
