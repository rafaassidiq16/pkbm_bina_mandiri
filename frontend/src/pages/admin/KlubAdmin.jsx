// ============================================================
// src/pages/admin/KlubAdmin.jsx — Manajemen Klub Minat Bakat
// ============================================================
import { useState, useEffect } from 'react';
import Sidebar from '../../components/Sidebar.jsx';
import { KlubAPI } from '../../services/api.js';
import './KlubAdmin.css';

const KATEGORI_LIST = ['seni', 'olahraga', 'teknologi', 'bahasa', 'sains', 'lainnya'];

const KATEGORI_STYLE = {
  seni:       { bg: '#FCE7F3', color: '#BE185D', icon: 'bi-palette-fill' },
  olahraga:   { bg: '#DBEAFE', color: '#1D4ED8', icon: 'bi-trophy-fill' },
  teknologi:  { bg: '#EDE9FE', color: '#6D28D9', icon: 'bi-cpu-fill' },
  bahasa:     { bg: '#D1FAE5', color: '#065F46', icon: 'bi-chat-quote-fill' },
  sains:      { bg: '#FEF3C7', color: '#92400E', icon: 'bi-flask-fill' },
  lainnya:    { bg: '#F1F5F9', color: '#475569', icon: 'bi-stars' },
};

const FORM_INIT = { nama_klub: '', deskripsi: '', kategori: 'teknologi', pembimbing_id: '', kapasitas: 20 };

function KlubAdmin() {
  const user = JSON.parse(localStorage.getItem('pkbm_user') || '{}');

  const [klubList,    setKlubList]    = useState([]);
  const [loading,     setLoading]     = useState(true);
  const [error,       setError]       = useState('');
  const [search,      setSearch]      = useState('');
  const [filterAktif, setFilterAktif] = useState('semua'); // 'semua' | 'aktif' | 'nonaktif'

  // Modal state
  const [modal,       setModal]       = useState(null);  // null | 'tambah' | 'edit' | 'detail'
  const [formData,    setFormData]    = useState(FORM_INIT);
  const [editTarget,  setEditTarget]  = useState(null);
  const [detailData,  setDetailData]  = useState(null);
  const [saving,      setSaving]      = useState(false);
  const [feedback,    setFeedback]    = useState({ type: '', msg: '' });
  const [togglingId,  setTogglingId]  = useState(null);

  const fetchKlub = async () => {
    setLoading(true); setError('');
    try {
      const res = await KlubAPI.getAllAdmin();
      setKlubList(res.data.data || []);
    } catch {
      setError('Gagal memuat data klub.');
    } finally { setLoading(false); }
  };

  useEffect(() => { fetchKlub(); }, []);

  const filtered = klubList.filter(k => {
    const q = search.toLowerCase();
    const matchSearch = !q || k.nama_klub?.toLowerCase().includes(q) || k.jenis?.toLowerCase().includes(q);
    const matchAktif = filterAktif === 'semua' || (filterAktif === 'aktif' ? k.is_aktif : !k.is_aktif);
    return matchSearch && matchAktif;
  });

  const openTambah = () => {
    setFormData(FORM_INIT); setFeedback({ type: '', msg: '' }); setModal('tambah');
  };

  const openEdit = (klub) => {
    setEditTarget(klub);
    setFormData({
      nama_klub:    klub.nama_klub || '',
      deskripsi:    klub.deskripsi || '',
      kategori:     klub.jenis || 'teknologi',
      pembimbing_id: klub.pembimbing_id || '',
      kapasitas:    klub.kapasitas || 20,
    });
    setFeedback({ type: '', msg: '' });
    setModal('edit');
  };

  const openDetail = async (id) => {
    setDetailData(null); setModal('detail');
    try {
      const res = await KlubAPI.getById(id);
      setDetailData(res.data.data);
    } catch { setDetailData({ error: 'Gagal memuat detail klub.' }); }
  };

  const handleSave = async () => {
    const { nama_klub, kapasitas } = formData;
    if (!nama_klub.trim()) { setFeedback({ type: 'error', msg: 'Nama klub wajib diisi.' }); return; }
    if (!kapasitas || kapasitas < 1) { setFeedback({ type: 'error', msg: 'Kapasitas minimal 1.' }); return; }

    setSaving(true); setFeedback({ type: '', msg: '' });
    const payload = {
      ...formData,
      pembimbing_id: formData.pembimbing_id || null,
      kapasitas: parseInt(formData.kapasitas),
    };
    try {
      if (modal === 'tambah') {
        await KlubAPI.create(payload);
        setFeedback({ type: 'success', msg: 'Klub berhasil dibuat!' });
      } else {
        await KlubAPI.update(editTarget.id, payload);
        setFeedback({ type: 'success', msg: 'Klub berhasil diperbarui!' });
      }
      await fetchKlub();
      setTimeout(() => { setModal(null); setFeedback({ type: '', msg: '' }); }, 1500);
    } catch (err) {
      setFeedback({ type: 'error', msg: err.response?.data?.message || 'Gagal menyimpan klub.' });
    } finally { setSaving(false); }
  };

  const handleToggle = async (klub) => {
    const label = klub.is_aktif ? 'nonaktifkan' : 'aktifkan';
    if (!window.confirm(`${label.charAt(0).toUpperCase() + label.slice(1)} klub "${klub.nama_klub}"?`)) return;
    setTogglingId(klub.id);
    try {
      await KlubAPI.toggleAktif(klub.id, !klub.is_aktif);
      setKlubList(prev => prev.map(k => k.id === klub.id ? { ...k, is_aktif: k.is_aktif ? 0 : 1 } : k));
    } catch (err) {
      alert(err.response?.data?.message || 'Gagal mengubah status klub.');
    } finally { setTogglingId(null); }
  };

  const handleHapus = async (klub) => {
    if (!window.confirm(`Hapus klub "${klub.nama_klub}" secara permanen?`)) return;
    try {
      await KlubAPI.hapus(klub.id);
      setKlubList(prev => prev.filter(k => k.id !== klub.id));
    } catch (err) {
      alert(err.response?.data?.message || 'Gagal menghapus klub.');
    }
  };

  const setForm = (key, val) => setFormData(p => ({ ...p, [key]: val }));

  const statAktif   = klubList.filter(k => k.is_aktif).length;
  const statNonaktif = klubList.filter(k => !k.is_aktif).length;
  const statAnggota  = klubList.reduce((s, k) => s + (parseInt(k.jumlah_anggota) || 0), 0);

  return (
    <div className="app-layout klub-admin-page">
      <Sidebar user={user} />
      <main className="app-main">
        <div className="app-content">

          {/* Header */}
          <div style={{ marginBottom: '2rem', display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', gap: '1rem', flexWrap: 'wrap' }}>
            <div>
              <h1 style={{ fontFamily: 'var(--font-heading)', fontSize: 'var(--text-2xl)', fontWeight: 800 }}>
                Manajemen Klub Minat Bakat
              </h1>
              <p style={{ color: 'var(--color-text-muted)', marginTop: 4 }}>
                Kelola klub ekstrakurikuler lintas jenjang PKBM Bina Mandiri.
              </p>
            </div>
            <button className="btn btn-primary" onClick={openTambah}>
              <i className="bi bi-plus-circle-fill" /> Tambah Klub
            </button>
          </div>

          {/* Statistik */}
          <div className="grid-cols-3" style={{ marginBottom: '2rem' }}>
            {[
              { label: 'Klub Aktif',    value: statAktif,   icon: 'bi-check-circle-fill', bg: '#D1FAE5', color: '#065F46' },
              { label: 'Klub Nonaktif', value: statNonaktif, icon: 'bi-pause-circle-fill', bg: '#FEE2E2', color: '#991B1B' },
              { label: 'Total Anggota', value: statAnggota,  icon: 'bi-people-fill',       bg: '#DBEAFE', color: '#1D4ED8' },
            ].map(s => (
              <div key={s.label} className="stat-card">
                <div className="stat-icon" style={{ background: s.bg, color: s.color }}>
                  <i className={`bi ${s.icon}`} />
                </div>
                <div className="stat-body">
                  <div className="stat-value">{s.value}</div>
                  <div className="stat-label">{s.label}</div>
                </div>
              </div>
            ))}
          </div>

          {/* Tabel */}
          <div className="card">
            <div className="card-header klub-admin-toolbar">
              <h3 className="card-title">Daftar Klub</h3>
              <div className="klub-admin-toolbar-actions">
                {/* Filter status */}
                <div className="klub-admin-filter-group">
                  {['semua', 'aktif', 'nonaktif'].map(f => (
                    <button key={f} onClick={() => setFilterAktif(f)} style={{
                      padding: '4px 12px', borderRadius: 'var(--radius-sm)', border: 'none', cursor: 'pointer', fontSize: '0.8rem', fontWeight: 600,
                      background: filterAktif === f ? 'var(--color-primary)' : 'transparent',
                      color: filterAktif === f ? 'white' : 'var(--color-text-muted)', transition: 'all 0.15s',
                    }}>
                      {f.charAt(0).toUpperCase() + f.slice(1)}
                    </button>
                  ))}
                </div>
                {/* Search */}
                <div className="klub-admin-search">
                  <i className="bi bi-search" style={{ position: 'absolute', left: 10, top: '50%', transform: 'translateY(-50%)', color: 'var(--color-text-muted)', fontSize: '0.85rem' }} />
                  <input type="text" placeholder="Cari klub…" value={search} onChange={e => setSearch(e.target.value)}
                    className="form-input" style={{ paddingLeft: '2.2rem', height: 38 }} />
                </div>
              </div>
            </div>

            {loading ? (
              <div className="loading-container" style={{ padding: '3rem' }}>
                <div className="spinner" /><p style={{ marginTop: 12, color: 'var(--color-text-muted)' }}>Memuat...</p>
              </div>
            ) : error ? (
              <div className="alert alert-danger" style={{ margin: '1.5rem' }}>
                <i className="bi bi-exclamation-triangle" /><span>{error}</span>
              </div>
            ) : filtered.length === 0 ? (
              <div className="empty-state">
                <i className="bi bi-trophy" /><h3>Belum Ada Klub</h3>
                <p>{search ? 'Tidak ada klub yang sesuai pencarian.' : 'Klik "Tambah Klub" untuk membuat klub pertama.'}</p>
              </div>
            ) : (
              <div className="table-wrapper klub-admin-table-wrapper">
                <table className="table klub-admin-table">
                  <thead>
                    <tr>
                      <th>Nama Klub</th>
                      <th>Kategori</th>
                      <th>Pembimbing</th>
                      <th>Kapasitas</th>
                      <th>Anggota</th>
                      <th>Status</th>
                      <th>Aksi</th>
                    </tr>
                  </thead>
                  <tbody>
                    {filtered.map(klub => {
                      const style = KATEGORI_STYLE[klub.jenis] || KATEGORI_STYLE.lainnya;
                      const isToggling = togglingId === klub.id;
                      const pct = klub.kapasitas ? Math.min(100, Math.round((klub.jumlah_anggota / klub.kapasitas) * 100)) : 0;
                      return (
                        <tr key={klub.id}>
                          <td>
                            <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                              <div style={{ width: 36, height: 36, borderRadius: 'var(--radius-md)', background: style.bg, color: style.color, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '1rem', flexShrink: 0 }}>
                                <i className={`bi ${style.icon}`} />
                              </div>
                              <div>
                                <div style={{ fontWeight: 600, fontSize: '0.9rem' }}>{klub.nama_klub}</div>
                                {klub.deskripsi && <div className="klub-admin-desc">{klub.deskripsi}</div>}
                              </div>
                            </div>
                          </td>
                          <td>
                            <span className="badge" style={{ background: style.bg, color: style.color }}>
                              {klub.jenis || '—'}
                            </span>
                          </td>
                          <td style={{ fontSize: '0.85rem' }}>{klub.tutor_nama || <span style={{ color: 'var(--color-text-muted)' }}>—</span>}</td>
                          <td style={{ fontSize: '0.85rem', textAlign: 'center' }}>{klub.kapasitas}</td>
                          <td>
                            <div style={{ display: 'flex', alignItems: 'center', gap: 8, minWidth: 80 }}>
                              <span style={{ fontSize: '0.85rem', fontWeight: 600, minWidth: 28 }}>{klub.jumlah_anggota}</span>
                              <div style={{ flex: 1, height: 6, background: 'var(--color-border)', borderRadius: 99, overflow: 'hidden' }}>
                                <div style={{ height: '100%', width: `${pct}%`, background: pct >= 90 ? 'var(--color-danger)' : pct >= 70 ? 'var(--color-warning)' : 'var(--color-success)', borderRadius: 99, transition: 'width 0.3s' }} />
                              </div>
                            </div>
                          </td>
                          <td>
                            <span className={`badge ${klub.is_aktif ? 'badge-success' : 'badge-danger'}`}>
                              {klub.is_aktif ? 'Aktif' : 'Nonaktif'}
                            </span>
                          </td>
                          <td>
                            <div className="klub-admin-action-group">
                              <button className="btn btn-secondary" style={{ padding: '4px 8px', fontSize: '0.78rem' }} onClick={() => openDetail(klub.id)} title="Lihat anggota">
                                <i className="bi bi-people" />
                              </button>
                              <button className="btn btn-secondary" style={{ padding: '4px 8px', fontSize: '0.78rem' }} onClick={() => openEdit(klub)} title="Edit klub">
                                <i className="bi bi-pencil" />
                              </button>
                              <button
                                className={`btn ${klub.is_aktif ? 'btn-danger' : 'btn-secondary'}`}
                                style={{ padding: '4px 8px', fontSize: '0.78rem' }}
                                onClick={() => handleToggle(klub)} disabled={isToggling} title={klub.is_aktif ? 'Nonaktifkan' : 'Aktifkan'}
                              >
                                {isToggling ? <div className="spinner" style={{ width: 12, height: 12 }} /> : <i className={`bi ${klub.is_aktif ? 'bi-pause-circle' : 'bi-play-circle'}`} />}
                              </button>
                              <button className="btn btn-danger" style={{ padding: '4px 8px', fontSize: '0.78rem' }} onClick={() => handleHapus(klub)} title="Hapus" disabled={klub.jumlah_anggota > 0}>
                                <i className="bi bi-trash3" />
                              </button>
                            </div>
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            )}

            {!loading && !error && (
              <div style={{ padding: '0.75rem 1.5rem', borderTop: '1px solid var(--color-border)', color: 'var(--color-text-muted)', fontSize: '0.83rem' }}>
                Menampilkan <strong>{filtered.length}</strong> dari <strong>{klubList.length}</strong> klub
              </div>
            )}
          </div>

        </div>
      </main>

      {/* Modal Tambah / Edit */}
      {(modal === 'tambah' || modal === 'edit') && (
        <Modal title={modal === 'tambah'
          ? <><i className="bi bi-plus-circle-fill" style={{ color: 'var(--color-primary)', marginRight: 8 }} />Tambah Klub Baru</>
          : <><i className="bi bi-pencil-fill" style={{ color: 'var(--color-accent-dark)', marginRight: 8 }} />Edit Klub</>
        } onClose={() => setModal(null)} maxWidth={520}>
          <div className="form-group">
            <label className="form-label">Nama Klub <span style={{ color: 'var(--color-danger)' }}>*</span></label>
            <input type="text" className="form-input" placeholder="Contoh: Klub Robotika" value={formData.nama_klub} onChange={e => setForm('nama_klub', e.target.value)} />
          </div>
          <div className="form-group">
            <label className="form-label">Deskripsi</label>
            <textarea className="form-input" rows={3} placeholder="Deskripsi singkat tentang klub…" value={formData.deskripsi} onChange={e => setForm('deskripsi', e.target.value)} style={{ resize: 'vertical' }} />
          </div>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem' }}>
            <div className="form-group">
              <label className="form-label">Kategori</label>
              <select className="form-input" value={formData.kategori} onChange={e => setForm('kategori', e.target.value)}>
                {KATEGORI_LIST.map(k => <option key={k} value={k}>{k.charAt(0).toUpperCase() + k.slice(1)}</option>)}
              </select>
            </div>
            <div className="form-group">
              <label className="form-label">Kapasitas Maks.</label>
              <input type="number" className="form-input" min={1} max={200} value={formData.kapasitas} onChange={e => setForm('kapasitas', e.target.value)} />
            </div>
          </div>
          <div className="form-group">
            <label className="form-label">ID Pembimbing <span style={{ color: 'var(--color-text-muted)', fontWeight: 400, fontSize: '0.8rem' }}>(opsional — user_id Tutor)</span></label>
            <input type="number" className="form-input" placeholder="Kosongkan jika belum ada pembimbing" value={formData.pembimbing_id} onChange={e => setForm('pembimbing_id', e.target.value)} />
          </div>

          {feedback.msg && (
            <div className={`alert ${feedback.type === 'success' ? 'alert-success' : 'alert-danger'}`} style={{ marginBottom: '1rem' }}>
              <i className={`bi ${feedback.type === 'success' ? 'bi-check-circle' : 'bi-exclamation-circle'}`} />
              <span>{feedback.msg}</span>
            </div>
          )}
          <div style={{ display: 'flex', gap: '0.75rem', justifyContent: 'flex-end' }}>
            <button className="btn btn-secondary" onClick={() => setModal(null)}>Batal</button>
            <button className="btn btn-primary" onClick={handleSave} disabled={saving}>
              {saving ? <><div className="spinner" style={{ width: 16, height: 16 }} /> Menyimpan…</> : <><i className="bi bi-check2" /> {modal === 'tambah' ? 'Buat Klub' : 'Simpan Perubahan'}</>}
            </button>
          </div>
        </Modal>
      )}

      {/* Modal Detail Anggota */}
      {modal === 'detail' && (
        <Modal title={<><i className="bi bi-people-fill" style={{ color: 'var(--color-primary)', marginRight: 8 }} />Daftar Anggota</>} onClose={() => setModal(null)} maxWidth={600}>
          {!detailData ? (
            <div className="loading-container"><div className="spinner" /><p style={{ marginTop: 12 }}>Memuat anggota…</p></div>
          ) : detailData.error ? (
            <div className="alert alert-danger"><i className="bi bi-exclamation-triangle" /><span>{detailData.error}</span></div>
          ) : (
            <>
              <div style={{ marginBottom: '1rem', padding: '0.75rem 1rem', background: 'var(--color-bg)', borderRadius: 'var(--radius-md)', border: '1px solid var(--color-border)' }}>
                <strong>{detailData.nama_klub}</strong>
                <span style={{ marginLeft: 12, color: 'var(--color-text-muted)', fontSize: '0.85rem' }}>
                  {detailData.anggota?.length || 0} anggota aktif
                </span>
              </div>
              {!detailData.anggota?.length ? (
                <div className="empty-state" style={{ padding: '2rem' }}>
                  <i className="bi bi-person-x" /><p>Belum ada anggota aktif di klub ini.</p>
                </div>
              ) : (
                <div className="table-wrapper">
                  <table className="table">
                    <thead><tr><th>#</th><th>Nama</th><th>NIS</th><th>Jenjang</th><th>Tgl Daftar</th></tr></thead>
                    <tbody>
                      {detailData.anggota.map((a, i) => (
                        <tr key={a.id}>
                          <td style={{ color: 'var(--color-text-muted)', fontSize: '0.85rem' }}>{i + 1}</td>
                          <td style={{ fontWeight: 600, fontSize: '0.9rem' }}>{a.nama_lengkap}</td>
                          <td style={{ fontSize: '0.85rem' }}>{a.nis || '—'}</td>
                          <td><span className="badge" style={{ fontSize: '0.72rem' }}>{a.jenjang || '—'}</span></td>
                          <td style={{ fontSize: '0.82rem', color: 'var(--color-text-muted)' }}>
                            {a.tanggal_daftar ? new Date(a.tanggal_daftar).toLocaleDateString('id-ID', { day: '2-digit', month: 'short', year: 'numeric' }) : '—'}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
            </>
          )}
        </Modal>
      )}
    </div>
  );
}

function Modal({ title, onClose, children, maxWidth = 560 }) {
  return (
    <div style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.45)', backdropFilter: 'blur(4px)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 1000, padding: '1rem' }}
      onClick={e => { if (e.target === e.currentTarget) onClose(); }}>
      <div style={{ background: 'var(--color-surface)', borderRadius: 'var(--radius-lg)', boxShadow: 'var(--shadow-lg)', width: '100%', maxWidth, maxHeight: '90vh', overflowY: 'auto' }}>
        <div style={{ padding: '1.25rem 1.5rem', borderBottom: '1px solid var(--color-border)', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
          <h3 style={{ fontFamily: 'var(--font-heading)', fontWeight: 700, margin: 0, fontSize: '1.05rem' }}>{title}</h3>
          <button onClick={onClose} style={{ background: 'none', border: 'none', cursor: 'pointer', fontSize: '1.2rem', color: 'var(--color-text-muted)' }}>
            <i className="bi bi-x-lg" />
          </button>
        </div>
        <div style={{ padding: '1.5rem' }}>{children}</div>
      </div>
    </div>
  );
}

export default KlubAdmin;
