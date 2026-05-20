// ============================================================
// src/pages/admin/UserAdmin.jsx — Manajemen Akun (Super Admin)
// ============================================================
// Super Admin membuat akun Tutor/Admin TU, mengaktifkan/
// menonaktifkan akun, dan mereset password.
//
// API:
//   GET /api/users                  → semua akun user
//   POST /api/users                 → buat akun baru
//   PUT /api/users/:id/status       → aktifkan / nonaktifkan
//   PUT /api/users/:id/password     → reset password
// ============================================================

import { useState, useEffect } from 'react';
import Sidebar from '../../components/Sidebar.jsx';
import { UserAPI } from '../../services/api.js';

// ── Konstanta ────────────────────────────────────────────────
const ROLE_LABEL = {
  super_admin:   'Super Admin',
  admin:         'Admin TU & Keu',
  tutor:         'Tutor',
  warga_belajar: 'Warga Belajar',
  pimpinan:      'Pimpinan',
};

const ROLE_COLOR = {
  super_admin:   { bg: '#FEF3C7', color: '#92400E' },
  admin:         { bg: '#FCE7F3', color: '#9D174D' },
  tutor:         { bg: '#EDE9FE', color: '#5B21B6' },
  warga_belajar: { bg: '#DBEAFE', color: '#1E40AF' },
  pimpinan:      { bg: '#D1FAE5', color: '#065F46' },
};

// Role yang bisa dibuat oleh Super Admin di halaman ini
const ROLE_BUAT = ['admin', 'tutor', 'pimpinan'];

function UserAdmin() {
  const user = JSON.parse(localStorage.getItem('pkbm_user') || '{}');

  // ── State: Data ──────────────────────────────────────────
  const [userList, setUserList] = useState([]);
  const [loading,  setLoading]  = useState(true);
  const [error,    setError]    = useState('');
  const [search,   setSearch]   = useState('');

  // ── State: Modal Buat Akun ───────────────────────────────
  const [showBuat,  setShowBuat]  = useState(false);
  const [formBuat, setFormBuat] = useState({
    nama_lengkap: '', email: '', password: '', role: 'tutor',
  });
  const [buatLoading,  setBuatLoading]  = useState(false);
  const [buatFeedback, setBuatFeedback] = useState({ type: '', msg: '' });

  // ── State: Modal Reset Password ──────────────────────────
  const [resetTarget, setResetTarget] = useState(null); // { id, nama }
  const [passwordBaru, setPasswordBaru] = useState('');
  const [showPass,     setShowPass]     = useState(false);
  const [resetLoading, setResetLoading] = useState(false);
  const [resetFeedback, setResetFeedback] = useState({ type: '', msg: '' });

  // ── State: Memproses toggle status ──────────────────────
  const [togglingId, setTogglingId] = useState(null);

  // ── Fetch Daftar User ────────────────────────────────────
  const fetchUsers = async () => {
    setLoading(true);
    setError('');
    try {
      const res = await UserAPI.getAll();
      setUserList(res.data.data || []);
    } catch {
      setError('Gagal memuat daftar akun. Pastikan Anda login sebagai Super Admin.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { fetchUsers(); }, []);

  // ── Filter Pencarian Lokal ───────────────────────────────
  const filtered = userList.filter(u => {
    if (!search.trim()) return true;
    const q = search.toLowerCase();
    return u.nama_lengkap?.toLowerCase().includes(q) || u.email?.toLowerCase().includes(q);
  });

  // ── Toggle Status Aktif / Nonaktif ───────────────────────
  const handleToggleStatus = async (u) => {
    if (!window.confirm(
      `${u.is_active ? 'Nonaktifkan' : 'Aktifkan'} akun ${u.nama_lengkap}?`
    )) return;

    setTogglingId(u.id);
    try {
      await UserAPI.updateStatus(u.id, !u.is_active);
      // Update state lokal tanpa refetch
      setUserList(prev => prev.map(item =>
        item.id === u.id ? { ...item, is_active: u.is_active ? 0 : 1 } : item
      ));
    } catch (err) {
      alert(err.response?.data?.message || 'Gagal mengubah status akun.');
    } finally {
      setTogglingId(null);
    }
  };

  // ── Buat Akun Baru ───────────────────────────────────────
  const handleBuatAkun = async () => {
    const { nama_lengkap, email, password, role } = formBuat;
    if (!nama_lengkap || !email || !password || !role) {
      setBuatFeedback({ type: 'error', msg: 'Semua field wajib diisi.' });
      return;
    }
    if (password.length < 8) {
      setBuatFeedback({ type: 'error', msg: 'Password minimal 8 karakter.' });
      return;
    }

    setBuatLoading(true);
    setBuatFeedback({ type: '', msg: '' });
    try {
      await UserAPI.create({ nama_lengkap, email, password, role });
      setBuatFeedback({ type: 'success', msg: `Akun untuk ${nama_lengkap} berhasil dibuat!` });
      setFormBuat({ nama_lengkap: '', email: '', password: '', role: 'tutor' });
      // Refresh daftar
      await fetchUsers();
      setTimeout(() => {
        setShowBuat(false);
        setBuatFeedback({ type: '', msg: '' });
      }, 1800);
    } catch (err) {
      setBuatFeedback({ type: 'error', msg: err.response?.data?.message || 'Gagal membuat akun.' });
    } finally {
      setBuatLoading(false);
    }
  };

  // ── Reset Password ───────────────────────────────────────
  const handleResetPassword = async () => {
    if (!passwordBaru || passwordBaru.length < 8) {
      setResetFeedback({ type: 'error', msg: 'Password baru minimal 8 karakter.' });
      return;
    }
    setResetLoading(true);
    setResetFeedback({ type: '', msg: '' });
    try {
      await UserAPI.resetPassword(resetTarget.id, passwordBaru);
      setResetFeedback({ type: 'success', msg: 'Password berhasil direset!' });
      setTimeout(() => {
        setResetTarget(null);
        setPasswordBaru('');
        setResetFeedback({ type: '', msg: '' });
      }, 1500);
    } catch (err) {
      setResetFeedback({ type: 'error', msg: err.response?.data?.message || 'Gagal reset password.' });
    } finally {
      setResetLoading(false);
    }
  };

  // ── Statistik Cepat ──────────────────────────────────────
  const statRole = ROLE_BUAT.reduce((acc, r) => {
    acc[r] = userList.filter(u => u.role === r).length;
    return acc;
  }, {});

  const formatTanggal = (tgl) => tgl
    ? new Date(tgl).toLocaleDateString('id-ID', { day: '2-digit', month: 'short', year: 'numeric' })
    : '—';

  return (
    <div className="app-layout">
      <Sidebar user={user} />
      <main className="app-main">
        <div className="app-content">

          {/* ── Header ─────────────────────────────────── */}
          <div style={{ marginBottom: '2rem', display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', gap: '1rem', flexWrap: 'wrap' }}>
            <div>
              <h1 style={{ fontFamily: 'var(--font-heading)', fontSize: 'var(--text-2xl)', fontWeight: 800 }}>
                Manajemen Akun
              </h1>
              <p style={{ color: 'var(--color-text-muted)', marginTop: 4 }}>
                Kelola akun Tutor, Admin TU, dan Pimpinan PKBM.
              </p>
            </div>
            <button
              className="btn btn-primary"
              onClick={() => { setShowBuat(true); setBuatFeedback({ type: '', msg: '' }); }}
            >
              <i className="bi bi-person-plus-fill" /> Buat Akun Baru
            </button>
          </div>

          {/* ── Statistik ────────────────────────────────── */}
          <div className="grid-cols-3" style={{ marginBottom: '2rem' }}>
            {ROLE_BUAT.map(r => (
              <div key={r} className="stat-card">
                <div className="stat-icon" style={{ background: ROLE_COLOR[r]?.bg, color: ROLE_COLOR[r]?.color }}>
                  <i className="bi bi-person-badge-fill" />
                </div>
                <div className="stat-body">
                  <div className="stat-value">{statRole[r] ?? 0}</div>
                  <div className="stat-label">{ROLE_LABEL[r]}</div>
                </div>
              </div>
            ))}
          </div>

          {/* ── Tabel Akun ───────────────────────────────── */}
          <div className="card">
            <div className="card-header" style={{ flexWrap: 'wrap', gap: '1rem' }}>
              <h3 className="card-title">Daftar Semua Akun</h3>
              <div style={{ position: 'relative' }}>
                <i className="bi bi-search" style={{
                  position: 'absolute', left: 10, top: '50%', transform: 'translateY(-50%)',
                  color: 'var(--color-text-muted)', fontSize: '0.85rem',
                }} />
                <input
                  type="text"
                  placeholder="Cari nama / email…"
                  value={search}
                  onChange={e => setSearch(e.target.value)}
                  className="form-input"
                  style={{ paddingLeft: '2.2rem', width: 240, height: 38 }}
                />
              </div>
            </div>

            {loading ? (
              <div className="loading-container" style={{ padding: '3rem' }}>
                <div className="spinner" />
                <p style={{ marginTop: 12, color: 'var(--color-text-muted)' }}>Memuat...</p>
              </div>
            ) : error ? (
              <div className="alert alert-danger" style={{ margin: '1.5rem' }}>
                <i className="bi bi-shield-lock" /><span>{error}</span>
              </div>
            ) : filtered.length === 0 ? (
              <div className="empty-state">
                <i className="bi bi-person-x" />
                <h3>Tidak Ada Akun</h3>
                <p>Tidak ada akun yang sesuai pencarian.</p>
              </div>
            ) : (
              <div className="table-wrapper">
                <table className="table">
                  <thead>
                    <tr>
                      <th>Nama Lengkap</th>
                      <th>Role</th>
                      <th>Status</th>
                      <th>Dibuat</th>
                      <th>Aksi</th>
                    </tr>
                  </thead>
                  <tbody>
                    {filtered.map(u => {
                      const rc = ROLE_COLOR[u.role] || { bg: '#F1F5F9', color: '#475569' };
                      return (
                        <tr key={u.id}>
                          <td>
                            <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                              <div style={{
                                width: 34, height: 34, borderRadius: '50%',
                                background: rc.bg, color: rc.color,
                                display: 'flex', alignItems: 'center', justifyContent: 'center',
                                fontWeight: 700, fontSize: '0.85rem', flexShrink: 0,
                              }}>
                                {u.nama_lengkap?.charAt(0)?.toUpperCase() || 'U'}
                              </div>
                              <div>
                                <div style={{ fontWeight: 600, fontSize: '0.9rem' }}>{u.nama_lengkap}</div>
                                <div style={{ color: 'var(--color-text-muted)', fontSize: '0.78rem' }}>{u.email}</div>
                              </div>
                            </div>
                          </td>
                          <td>
                            <span className="badge" style={{ background: rc.bg, color: rc.color }}>
                              {ROLE_LABEL[u.role] || u.role}
                            </span>
                          </td>
                          <td>
                            <span className={`badge ${u.is_active ? 'badge-success' : 'badge-danger'}`}>
                              {u.is_active ? 'Aktif' : 'Nonaktif'}
                            </span>
                          </td>
                          <td style={{ fontSize: '0.85rem', color: 'var(--color-text-muted)' }}>
                            {formatTanggal(u.created_at)}
                          </td>
                          <td>
                            {/* Proteksi: Super Admin tidak bisa mengedit dirinya sendiri */}
                            {u.id !== user.id && u.role !== 'super_admin' && (
                              <div style={{ display: 'flex', gap: 6 }}>
                                {/* Toggle Aktif/Nonaktif */}
                                <button
                                  className={`btn ${u.is_active ? 'btn-danger' : 'btn-secondary'}`}
                                  style={{ padding: '4px 10px', fontSize: '0.78rem' }}
                                  disabled={togglingId === u.id}
                                  onClick={() => handleToggleStatus(u)}
                                  title={u.is_active ? 'Nonaktifkan akun' : 'Aktifkan akun'}
                                >
                                  {togglingId === u.id
                                    ? <div className="spinner" style={{ width: 14, height: 14 }} />
                                    : <><i className={`bi ${u.is_active ? 'bi-person-dash' : 'bi-person-check'}`} /></>
                                  }
                                </button>
                                {/* Reset Password */}
                                <button
                                  className="btn btn-secondary"
                                  style={{ padding: '4px 10px', fontSize: '0.78rem' }}
                                  onClick={() => {
                                    setResetTarget({ id: u.id, nama: u.nama_lengkap });
                                    setPasswordBaru('');
                                    setResetFeedback({ type: '', msg: '' });
                                  }}
                                  title="Reset password"
                                >
                                  <i className="bi bi-key" />
                                </button>
                              </div>
                            )}
                            {u.id === user.id && (
                              <span style={{ fontSize: '0.78rem', color: 'var(--color-text-muted)', fontStyle: 'italic' }}>
                                (akun Anda)
                              </span>
                            )}
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
                Menampilkan <strong>{filtered.length}</strong> dari <strong>{userList.length}</strong> akun
              </div>
            )}
          </div>

        </div>
      </main>

      {/* ── Modal Buat Akun ─────────────────────────────── */}
      {showBuat && (
        <Modal
          title={<><i className="bi bi-person-plus-fill" style={{ color: 'var(--color-primary)', marginRight: 8 }} />Buat Akun Baru</>}
          onClose={() => setShowBuat(false)}
          maxWidth={480}
        >
          <div className="form-group">
            <label className="form-label">Nama Lengkap <span style={{ color: 'var(--color-danger)' }}>*</span></label>
            <input type="text" className="form-input" placeholder="Nama lengkap tanpa gelar..." value={formBuat.nama_lengkap} onChange={e => setFormBuat(p => ({ ...p, nama_lengkap: e.target.value }))} />
          </div>
          <div className="form-group">
            <label className="form-label">Email <span style={{ color: 'var(--color-danger)' }}>*</span></label>
            <input type="email" className="form-input" placeholder="email@pkbm-binamandiri.sch.id" value={formBuat.email} onChange={e => setFormBuat(p => ({ ...p, email: e.target.value }))} />
          </div>
          <div className="form-group">
            <label className="form-label">Password <span style={{ color: 'var(--color-danger)' }}>*</span></label>
            <input type="password" className="form-input" placeholder="Minimal 8 karakter" value={formBuat.password} onChange={e => setFormBuat(p => ({ ...p, password: e.target.value }))} />
            <p style={{ fontSize: '0.75rem', color: 'var(--color-text-muted)', marginTop: 4 }}>
              Pengguna disarankan mengganti password setelah login pertama.
            </p>
          </div>
          <div className="form-group">
            <label className="form-label">Role <span style={{ color: 'var(--color-danger)' }}>*</span></label>
            <select className="form-input" value={formBuat.role} onChange={e => setFormBuat(p => ({ ...p, role: e.target.value }))}>
              {ROLE_BUAT.map(r => (
                <option key={r} value={r}>{ROLE_LABEL[r]}</option>
              ))}
            </select>
          </div>

          {buatFeedback.msg && (
            <div className={`alert ${buatFeedback.type === 'success' ? 'alert-success' : 'alert-danger'}`} style={{ marginBottom: '1rem' }}>
              <i className={`bi ${buatFeedback.type === 'success' ? 'bi-check-circle' : 'bi-exclamation-circle'}`} />
              <span>{buatFeedback.msg}</span>
            </div>
          )}

          <div style={{ display: 'flex', gap: '0.75rem', justifyContent: 'flex-end' }}>
            <button className="btn btn-secondary" onClick={() => setShowBuat(false)}>Batal</button>
            <button className="btn btn-primary" onClick={handleBuatAkun} disabled={buatLoading}>
              {buatLoading ? <><div className="spinner" style={{ width: 16, height: 16 }} /> Membuat...</> : <><i className="bi bi-check2" /> Buat Akun</>}
            </button>
          </div>
        </Modal>
      )}

      {/* ── Modal Reset Password ─────────────────────────── */}
      {resetTarget && (
        <Modal
          title={<><i className="bi bi-key-fill" style={{ color: 'var(--color-accent-dark)', marginRight: 8 }} />Reset Password</>}
          onClose={() => setResetTarget(null)}
          maxWidth={420}
        >
          <div className="alert alert-warning" style={{ marginBottom: '1.25rem' }}>
            <i className="bi bi-exclamation-triangle" />
            <span>
              Anda akan mereset password untuk akun <strong>{resetTarget.nama}</strong>.
              Akun ini harus login ulang dengan password baru.
            </span>
          </div>
          <div className="form-group">
            <label className="form-label">Password Baru <span style={{ color: 'var(--color-danger)' }}>*</span></label>
            <div style={{ position: 'relative' }}>
              <input
                type={showPass ? 'text' : 'password'}
                className="form-input"
                placeholder="Minimal 8 karakter"
                value={passwordBaru}
                onChange={e => setPasswordBaru(e.target.value)}
                style={{ paddingRight: '2.5rem' }}
              />
              <button type="button" onClick={() => setShowPass(p => !p)} style={{
                position: 'absolute', right: 10, top: '50%', transform: 'translateY(-50%)',
                background: 'none', border: 'none', cursor: 'pointer', color: 'var(--color-text-muted)',
              }}>
                <i className={`bi ${showPass ? 'bi-eye-slash' : 'bi-eye'}`} />
              </button>
            </div>
          </div>

          {resetFeedback.msg && (
            <div className={`alert ${resetFeedback.type === 'success' ? 'alert-success' : 'alert-danger'}`} style={{ marginBottom: '1rem' }}>
              <i className={`bi ${resetFeedback.type === 'success' ? 'bi-check-circle' : 'bi-exclamation-circle'}`} />
              <span>{resetFeedback.msg}</span>
            </div>
          )}

          <div style={{ display: 'flex', gap: '0.75rem', justifyContent: 'flex-end' }}>
            <button className="btn btn-secondary" onClick={() => setResetTarget(null)}>Batal</button>
            <button className="btn btn-primary" onClick={handleResetPassword} disabled={resetLoading}>
              {resetLoading ? <><div className="spinner" style={{ width: 16, height: 16 }} /> Mereset...</> : <><i className="bi bi-key" /> Reset Password</>}
            </button>
          </div>
        </Modal>
      )}
    </div>
  );
}

// ── Komponen Modal Generik ───────────────────────────────────
function Modal({ title, onClose, children, maxWidth = 560 }) {
  return (
    <div style={{
      position: 'fixed', inset: 0,
      background: 'rgba(0,0,0,0.45)', backdropFilter: 'blur(4px)',
      display: 'flex', alignItems: 'center', justifyContent: 'center',
      zIndex: 1000, padding: '1rem',
    }} onClick={e => { if (e.target === e.currentTarget) onClose(); }}>
      <div style={{
        background: 'var(--color-surface)', borderRadius: 'var(--radius-lg)',
        boxShadow: 'var(--shadow-lg)', width: '100%', maxWidth,
        maxHeight: '90vh', overflowY: 'auto',
      }}>
        {/* Header */}
        <div style={{
          padding: '1.25rem 1.5rem', borderBottom: '1px solid var(--color-border)',
          display: 'flex', alignItems: 'center', justifyContent: 'space-between',
        }}>
          <h3 style={{ fontFamily: 'var(--font-heading)', fontWeight: 700, margin: 0, fontSize: '1.05rem' }}>
            {title}
          </h3>
          <button onClick={onClose} style={{
            background: 'none', border: 'none', cursor: 'pointer',
            fontSize: '1.2rem', color: 'var(--color-text-muted)', display: 'flex',
          }}>
            <i className="bi bi-x-lg" />
          </button>
        </div>
        {/* Body */}
        <div style={{ padding: '1.5rem' }}>{children}</div>
      </div>
    </div>
  );
}

export default UserAdmin;
