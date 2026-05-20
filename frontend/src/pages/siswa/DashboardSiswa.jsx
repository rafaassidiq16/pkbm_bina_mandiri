// ============================================================
// src/pages/siswa/DashboardSiswa.jsx — Dashboard Warga Belajar
// ============================================================
// Halaman utama yang dilihat oleh Warga Belajar setelah login.
// Menampilkan:
//   - Ringkasan profil siswa
//   - Widget statistik (tagihan, absensi, tugas)
//   - Daftar materi & tugas terbaru
//
// Data diambil dari backend menggunakan:
//   GET /api/siswa/profil/saya → profil WB yang login
// ============================================================

import { useState, useEffect } from 'react';
import { AuthAPI, SiswaAPI, AbsensiAPI, TagihanAPI } from '../../services/api.js';
import Sidebar from '../../components/Sidebar.jsx';
import ProfileEditorCard from '../../components/ProfileEditorCard.jsx';
import './DashboardSiswa.css';

function DashboardSiswa() {
  // ── Ambil data user dari localStorage (sudah disimpan saat login) ──
  const [user, setUser] = useState(() => JSON.parse(localStorage.getItem('pkbm_user') || '{}'));

  // ── State: Data Profil Siswa ─────────────────────────────
  const [profil, setProfil]           = useState(null);
  const [loadingProfil, setLoadingProfil] = useState(true);
  const [errorProfil, setErrorProfil]   = useState('');

  // ── State: Rekap Kehadiran ───────────────────────────────
  const [rekapAbsensi, setRekapAbsensi]     = useState(null);
  const [loadingAbsensi, setLoadingAbsensi] = useState(true);

  // ── State: Tagihan Aktif ─────────────────────────────────
  const [tagihan, setTagihan]         = useState(null);
  const [loadingTagihan, setLoadingTagihan] = useState(true);
  const [editDataDiriOpen, setEditDataDiriOpen] = useState(false);
  const [savingDataDiri, setSavingDataDiri] = useState(false);
  const [dataDiriError, setDataDiriError] = useState('');
  const [dataDiriSuccess, setDataDiriSuccess] = useState('');
  const [formDataDiri, setFormDataDiri] = useState({
    nama_lengkap: '',
    email: '',
    nik: '',
    tanggal_lahir: '',
    jenis_kelamin: 'L',
    no_telp: '',
    nama_wali: '',
    alamat: '',
  });

  // ============================================================
  // useEffect — Fetch semua data saat komponen pertama kali dimuat
  // Dependency array [] berarti hanya dijalankan sekali (on mount)
  // ============================================================
  useEffect(() => {
    // Ambil profil siswa yang sedang login
    const fetchProfil = async () => {
      try {
        setLoadingProfil(true);

        // Hit endpoint GET /api/siswa/profil/saya
        // Token JWT otomatis disisipkan oleh interceptor di api.js
        const response = await SiswaAPI.getProfilSaya();

        // response.data mengikuti format backend: { success, data }
        setProfil(response.data.data);

      } catch (err) {
        const pesanError =
          err.response?.data?.message ||
          'Gagal memuat data profil. Coba muat ulang halaman.';
        setErrorProfil(pesanError);
      } finally {
        setLoadingProfil(false); // Selalu matikan loading
      }
    };

    // Ambil rekap kehadiran pribadi WB
    const fetchAbsensi = async () => {
      try {
        const response = await AbsensiAPI.getRekapSaya();
        setRekapAbsensi(response.data.data);
      } catch {
        // Tidak tampilkan error kritis untuk data sekunder
        setRekapAbsensi(null);
      } finally {
        setLoadingAbsensi(false);
      }
    };

    // Ambil tagihan aktif milik WB ini
    const fetchTagihan = async () => {
      try {
        // Endpoint ini mengambil tagihan berdasarkan token (siswa hanya lihat miliknya)
        const response = await TagihanAPI.getAll();
        // Ambil tagihan yang belum lunas (jika ada field status)
        const semuaTagihan = response.data.data || [];
        const belumLunas = semuaTagihan.filter(t => t.status !== 'lunas');
        setTagihan({ semua: semuaTagihan, belumLunas });
      } catch {
        setTagihan(null);
      } finally {
        setLoadingTagihan(false);
      }
    };

    // Jalankan semua fetch secara paralel (lebih cepat dari serial)
    fetchProfil();
    fetchAbsensi();
    fetchTagihan();

  }, []); // [] = hanya dijalankan sekali saat komponen mount

  useEffect(() => {
    if (!profil) return;
    setFormDataDiri({
      nama_lengkap: profil.nama_lengkap || '',
      email: profil.email || '',
      nik: profil.nik || '',
      tanggal_lahir: profil.tanggal_lahir ? String(profil.tanggal_lahir).slice(0, 10) : '',
      jenis_kelamin: profil.jenis_kelamin || 'L',
      no_telp: profil.no_telp || '',
      nama_wali: profil.nama_wali || '',
      alamat: profil.alamat || '',
    });
  }, [profil]);

  const handleChangeDataDiri = (key, value) => {
    setFormDataDiri((prev) => ({ ...prev, [key]: value }));
  };

  const handleSaveDataDiri = async () => {
    try {
      setSavingDataDiri(true);
      setDataDiriError('');
      setDataDiriSuccess('');

      const payload = {
        nama_lengkap: formDataDiri.nama_lengkap.trim(),
        email: formDataDiri.email.trim(),
        nik: formDataDiri.nik.trim(),
        tanggal_lahir: formDataDiri.tanggal_lahir,
        jenis_kelamin: formDataDiri.jenis_kelamin,
        no_telp: formDataDiri.no_telp.trim(),
        nama_wali: formDataDiri.nama_wali.trim(),
        alamat: formDataDiri.alamat.trim(),
      };

      const response = await AuthAPI.updateMe(payload);
      const nextProfil = response.data.data;
      setProfil(nextProfil);

      const nextUser = {
        id: nextProfil.id,
        nama: nextProfil.nama_lengkap,
        nama_lengkap: nextProfil.nama_lengkap,
        email: nextProfil.email,
        role: nextProfil.role,
        is_active: nextProfil.is_active,
        foto_profil: nextProfil.foto_profil || null,
      };
      localStorage.setItem('pkbm_user', JSON.stringify(nextUser));
      setUser(nextUser);

      setDataDiriSuccess('Data diri berhasil diperbarui.');
      setEditDataDiriOpen(false);
    } catch (err) {
      setDataDiriError(err.response?.data?.message || 'Gagal menyimpan data diri.');
    } finally {
      setSavingDataDiri(false);
    }
  };

  // ── Render: Loading utama ────────────────────────────────
  if (loadingProfil) {
    return (
      <div className="app-layout">
        <Sidebar user={user} />
        <main className="app-main">
          <div className="loading-container" style={{ minHeight: '100vh' }}>
            <div className="spinner"></div>
            <p>Memuat data Anda...</p>
          </div>
        </main>
      </div>
    );
  }

  // ── Render: Error utama ──────────────────────────────────
  if (errorProfil) {
    return (
      <div className="app-layout">
        <Sidebar user={user} />
        <main className="app-main">
          <div className="app-content">
            <div className="error-container">
              <i className="bi bi-wifi-off"></i>
              <h3>Gagal Memuat Data</h3>
              <p>{errorProfil}</p>
              <button
                className="btn btn-primary"
                style={{ marginTop: '1rem' }}
                onClick={() => window.location.reload()}
              >
                <i className="bi bi-arrow-clockwise"></i>
                Coba Lagi
              </button>
            </div>
          </div>
        </main>
      </div>
    );
  }

  // ── Render: Konten Utama Dashboard ──────────────────────
  return (
    <div className="app-layout">

      {/* Navigasi samping — menerima data user untuk tampilkan nama & role */}
      <Sidebar user={user} />

      <main className="app-main">
        <div className="app-content">

          {/* ── Header Sambutan ── */}
          <div className="dashboard-header">
            <div>
              <h1 className="dashboard-greeting">
                Halo, {profil?.nama_lengkap?.split(' ')[0] || user.nama_lengkap || user.nama}! 👋
              </h1>
              <p className="dashboard-subtext">
                Selamat datang di ruang belajar digital Anda.
              </p>
            </div>
            <div className="dashboard-date">
              {new Date().toLocaleDateString('id-ID', {
                weekday: 'long',
                day: 'numeric',
                month: 'long',
                year: 'numeric',
              })}
            </div>
          </div>

          {/* ── Kartu Profil Singkat ── */}
          <ProfileEditorCard
            user={user}
            onUserUpdate={setUser}
            onProfileUpdate={(nextProfile) => setProfil(nextProfile)}
          />

          {profil && (
            <div className="profil-card">
              <div className="profil-avatar">
                {profil.nama_lengkap?.charAt(0)?.toUpperCase()}
              </div>
              <div className="profil-info">
                <h2 className="profil-nama">{profil.nama_lengkap}</h2>
                <div className="profil-meta">
                  <span className="profil-meta-item">
                    <i className="bi bi-card-text"></i>
                    NIS: {profil.nis || 'Belum ditetapkan'}
                  </span>
                  <span className="profil-meta-item">
                    <i className="bi bi-mortarboard"></i>
                    {formatJenjang(profil.jenjang)}
                  </span>
                  {profil.nama_rombel && (
                    <span className="profil-meta-item">
                      <i className="bi bi-people"></i>
                      Rombel: {profil.nama_rombel}
                    </span>
                  )}
                  <span className={`badge ${profil.is_aktif ? 'badge-success' : 'badge-danger'}`}>
                    {profil.is_aktif ? 'Aktif' : 'Tidak Aktif'}
                  </span>
                </div>
              </div>
            </div>
          )}

          {/* ── Grid Statistik ── */}
          <div className="grid-cols-3" style={{ marginBottom: '2rem' }}>

            {/* Widget Kehadiran */}
            <div className="stat-card">
              <div className="stat-icon" style={{ background: '#DBEAFE', color: 'var(--color-siswa)' }}>
                <i className="bi bi-calendar-check"></i>
              </div>
              <div className="stat-body">
                {loadingAbsensi ? (
                  <div className="stat-value" style={{ fontSize: '1.2rem', color: 'var(--color-text-muted)' }}>Memuat...</div>
                ) : (
                  <>
                    <div className="stat-value" style={{ color: 'var(--color-siswa)' }}>
                      {rekapAbsensi 
                        ? `${rekapAbsensi.persentase_hadir || 0}%`
                        : '0%'}
                    </div>
                    <div className="stat-label">Tingkat Kehadiran</div>
                  </>
                )}
              </div>
            </div>

            {/* Widget Tagihan */}
            <div className="stat-card">
              <div className="stat-icon" style={{ background: '#FEF3C7', color: 'var(--color-accent-dark)' }}>
                <i className="bi bi-receipt"></i>
              </div>
              <div className="stat-body">
                {loadingTagihan ? (
                  <div className="stat-value" style={{ fontSize: '1.2rem', color: 'var(--color-text-muted)' }}>Memuat...</div>
                ) : (
                  <>
                    <div className="stat-value" style={{ color: tagihan?.belumLunas?.length > 0 ? 'var(--color-danger)' : 'var(--color-success)' }}>
                      {tagihan?.belumLunas?.length ?? '—'}
                    </div>
                    <div className="stat-label">Tagihan Belum Lunas</div>
                  </>
                )}
              </div>
            </div>

            {/* Widget Status Akun */}
            <div className="stat-card">
              <div className="stat-icon" style={{ background: '#D1FAE5', color: 'var(--color-success)' }}>
                <i className="bi bi-shield-check"></i>
              </div>
              <div className="stat-body">
                <div className="stat-value" style={{ color: 'var(--color-success)', fontSize: '1.4rem' }}>
                  <i className="bi bi-check-circle-fill"></i>
                </div>
                <div className="stat-label">Status Akun Aktif</div>
              </div>
            </div>

          </div>

          {/* ── Aksi Cepat ── */}
          <div className="card" style={{ marginBottom: '2rem' }}>
            <div className="card-header">
              <h3 className="card-title">
                <i className="bi bi-lightning-charge-fill" style={{ color: 'var(--color-accent)' }}></i>{' '}
                Aksi Cepat
              </h3>
            </div>
            <div className="quick-actions">
              <a href="/dashboard/siswa/absensi" className="quick-action-item">
                <div className="quick-action-icon" style={{ background: '#DBEAFE', color: 'var(--color-siswa)' }}>
                  <i className="bi bi-qr-code"></i>
                </div>
                <span>Check-In Absensi</span>
              </a>
              <a href="/dashboard/siswa/materi" className="quick-action-item">
                <div className="quick-action-icon" style={{ background: '#D1FAE5', color: 'var(--color-success)' }}>
                  <i className="bi bi-book-fill"></i>
                </div>
                <span>Buka Materi</span>
              </a>
              <a href="/dashboard/siswa/tugas" className="quick-action-item">
                <div className="quick-action-icon" style={{ background: '#FEF3C7', color: 'var(--color-accent-dark)' }}>
                  <i className="bi bi-pencil-square"></i>
                </div>
                <span>Kumpulkan Tugas</span>
              </a>
              <a href="/dashboard/siswa/ujian" className="quick-action-item">
                <div className="quick-action-icon" style={{ background: '#EDE9FE', color: '#7C3AED' }}>
                  <i className="bi bi-patch-question-fill"></i>
                </div>
                <span>Ikuti Ujian</span>
              </a>
              <a href="/dashboard/siswa/klub" className="quick-action-item">
                <div className="quick-action-icon" style={{ background: '#FCE7F3', color: '#BE185D' }}>
                  <i className="bi bi-people-fill"></i>
                </div>
                <span>Klub Minat</span>
              </a>
              <a href="/dashboard/siswa/tagihan" className="quick-action-item">
                <div className="quick-action-icon" style={{ background: '#FEE2E2', color: 'var(--color-danger)' }}>
                  <i className="bi bi-cash-stack"></i>
                </div>
                <span>Bayar Tagihan</span>
              </a>
            </div>
          </div>

          {/* ── Detail Profil Lengkap ── */}
          {profil && (
            <div className="card">
              <div className="card-header">
                <div className="mobile-toolbar" style={{ justifyContent: 'space-between' }}>
                  <h3 className="card-title">
                    <i className="bi bi-person-lines-fill" style={{ color: 'var(--color-primary)' }}></i>{' '}
                    Data Diri
                  </h3>
                  <button type="button" className="btn btn-secondary" onClick={() => {
                    setDataDiriError('');
                    setDataDiriSuccess('');
                    setEditDataDiriOpen(true);
                  }}>
                    <i className="bi bi-pencil-square"></i> Edit Data Diri
                  </button>
                </div>
              </div>
              <div className="profil-detail-grid">
                <DetailItem label="Nama Lengkap"   value={profil.nama_lengkap} />
                <DetailItem label="NIS"             value={profil.nis || 'Belum ditetapkan'} />
                <DetailItem label="NIK"             value={profil.nik} />
                <DetailItem label="Jenjang"         value={formatJenjang(profil.jenjang)} />
                <DetailItem label="Tanggal Lahir"   value={formatTanggal(profil.tanggal_lahir)} />
                <DetailItem label="Jenis Kelamin"   value={profil.jenis_kelamin === 'L' ? 'Laki-laki' : 'Perempuan'} />
                <DetailItem label="No. Telepon"     value={profil.no_telp || '-'} />
                <DetailItem label="Nama Wali"       value={profil.nama_wali || '-'} />
                <DetailItem label="Alamat"          value={profil.alamat || '-'} colSpan={2} />
              </div>
            </div>
          )}

          {dataDiriSuccess && (
            <div className="alert alert-success" style={{ marginTop: '-1rem', marginBottom: '2rem' }}>
              <i className="bi bi-check-circle-fill"></i>
              <span>{dataDiriSuccess}</span>
            </div>
          )}

        </div>
      </main>

      {editDataDiriOpen && (
        <DataDiriModal
          form={formDataDiri}
          error={dataDiriError}
          saving={savingDataDiri}
          onClose={() => setEditDataDiriOpen(false)}
          onChange={handleChangeDataDiri}
          onSave={handleSaveDataDiri}
        />
      )}
    </div>
  );
}

function DataDiriModal({ form, error, saving, onClose, onChange, onSave }) {
  return (
    <div
      className="app-modal-backdrop"
      style={{
        position: 'fixed',
        inset: 0,
        background: 'rgba(15, 23, 42, 0.45)',
        backdropFilter: 'blur(4px)',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        zIndex: 1100,
        padding: '1rem',
      }}
      onClick={(e) => { if (e.target === e.currentTarget) onClose(); }}
    >
      <div
        className="app-modal-panel"
        style={{
          width: '100%',
          maxWidth: 760,
          maxHeight: '90vh',
          overflowY: 'auto',
          background: 'var(--color-surface)',
          borderRadius: 'var(--radius-lg)',
          boxShadow: 'var(--shadow-lg)',
          border: '1px solid var(--color-border)',
        }}
      >
        <div className="mobile-modal-header">
          <h3 style={{ margin: 0, fontFamily: 'var(--font-heading)', fontSize: '1.05rem' }}>Edit Data Diri</h3>
          <button type="button" onClick={onClose} style={{ border: 'none', background: 'transparent', cursor: 'pointer', fontSize: '1.15rem', color: 'var(--color-text-muted)' }}>
            <i className="bi bi-x-lg"></i>
          </button>
        </div>

        <div className="mobile-modal-body">
          <div className="grid-cols-2" style={{ marginBottom: '1rem' }}>
            <div className="form-group">
              <label className="form-label">Nama Lengkap <span className="required">*</span></label>
              <input className="form-input" value={form.nama_lengkap} onChange={(e) => onChange('nama_lengkap', e.target.value)} />
            </div>
            <div className="form-group">
              <label className="form-label">Email <span className="required">*</span></label>
              <input type="email" className="form-input" value={form.email} onChange={(e) => onChange('email', e.target.value)} />
            </div>
            <div className="form-group">
              <label className="form-label">NIK</label>
              <input className="form-input" maxLength={20} value={form.nik} onChange={(e) => onChange('nik', e.target.value)} />
            </div>
            <div className="form-group">
              <label className="form-label">No. Telepon</label>
              <input className="form-input" value={form.no_telp} onChange={(e) => onChange('no_telp', e.target.value)} />
            </div>
            <div className="form-group">
              <label className="form-label">Tanggal Lahir <span className="required">*</span></label>
              <input type="date" className="form-input" value={form.tanggal_lahir} onChange={(e) => onChange('tanggal_lahir', e.target.value)} />
            </div>
            <div className="form-group">
              <label className="form-label">Jenis Kelamin <span className="required">*</span></label>
              <select className="form-input" value={form.jenis_kelamin} onChange={(e) => onChange('jenis_kelamin', e.target.value)}>
                <option value="L">Laki-laki</option>
                <option value="P">Perempuan</option>
              </select>
            </div>
            <div className="form-group">
              <label className="form-label">Nama Wali</label>
              <input className="form-input" value={form.nama_wali} onChange={(e) => onChange('nama_wali', e.target.value)} />
            </div>
            <div className="form-group" style={{ gridColumn: 'span 2' }}>
              <label className="form-label">Alamat</label>
              <textarea className="form-input" rows={3} style={{ resize: 'vertical' }} value={form.alamat} onChange={(e) => onChange('alamat', e.target.value)} />
            </div>
          </div>

          {error && (
            <div className="alert alert-danger" style={{ marginBottom: '1rem' }}>
              <i className="bi bi-exclamation-triangle-fill"></i>
              <span>{error}</span>
            </div>
          )}

          <div className="mobile-actions">
            <button type="button" className="btn btn-secondary" onClick={onClose}>Batal</button>
            <button type="button" className="btn btn-primary" onClick={onSave} disabled={saving}>
              {saving ? <><div className="spinner" style={{ width: 14, height: 14 }} /> Menyimpan...</> : <><i className="bi bi-check2"></i> Simpan Data Diri</>}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}

// ── Komponen Kecil: Item Detail Profil ───────────────────────
function DetailItem({ label, value, colSpan = 1 }) {
  return (
    <div className="profil-detail-item" style={{ gridColumn: `span ${colSpan}` }}>
      <span className="profil-detail-label">{label}</span>
      <span className="profil-detail-value">{value || '—'}</span>
    </div>
  );
}

// ── Helper: Format nama jenjang ──────────────────────────────
function formatJenjang(jenjang) {
  const map = {
    paket_a: 'Paket A (Setara SD)',
    paket_b: 'Paket B (Setara SMP)',
    paket_c: 'Paket C (Setara SMA)',
  };
  return map[jenjang] || jenjang || '—';
}

// ── Helper: Format tanggal ke Bahasa Indonesia ───────────────
function formatTanggal(tanggal) {
  if (!tanggal) return '—';
  return new Date(tanggal).toLocaleDateString('id-ID', {
    day: 'numeric',
    month: 'long',
    year: 'numeric',
  });
}

export default DashboardSiswa;
