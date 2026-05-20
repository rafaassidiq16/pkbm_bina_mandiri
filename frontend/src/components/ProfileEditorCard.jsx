import { useEffect, useMemo, useState } from 'react';
import { AuthAPI } from '../services/api.js';

function getApiOrigin() {
  const apiUrl = import.meta.env.VITE_API_URL || '';
  return apiUrl.replace(/\/api$/, '');
}

function toAssetUrl(path) {
  if (!path) return '';
  if (/^https?:\/\//i.test(path)) return path;
  return `${getApiOrigin()}/${String(path).replace(/\\/g, '/')}`;
}

function normalizeSessionUser(profile) {
  return {
    id: profile.id,
    nama_lengkap: profile.nama_lengkap,
    nama: profile.nama_lengkap,
    email: profile.email,
    role: profile.role,
    is_active: profile.is_active,
    foto_profil: profile.foto_profil || null,
  };
}

function buildInitialForm(profile) {
  return {
    nama_lengkap: profile?.nama_lengkap || '',
    email: profile?.email || '',
    nik: profile?.nik || '',
    tanggal_lahir: profile?.tanggal_lahir ? String(profile.tanggal_lahir).slice(0, 10) : '',
    jenis_kelamin: profile?.jenis_kelamin || 'L',
    alamat: profile?.alamat || '',
    nama_wali: profile?.nama_wali || '',
    no_telp: profile?.no_telp || '',
    nip: profile?.nip || '',
    spesialisasi: profile?.spesialisasi || '',
    current_password: '',
    new_password: '',
    confirm_password: '',
  };
}

function getFieldsForRole(role) {
  if (role === 'warga_belajar') {
    return [
      { key: 'nama_lengkap', label: 'Nama Lengkap', type: 'text', required: true },
      { key: 'email', label: 'Email', type: 'email', required: true },
      { key: 'nik', label: 'NIK', type: 'text' },
      { key: 'tanggal_lahir', label: 'Tanggal Lahir', type: 'date', required: true },
      { key: 'jenis_kelamin', label: 'Jenis Kelamin', type: 'select', required: true, options: [
        { value: 'L', label: 'Laki-laki' },
        { value: 'P', label: 'Perempuan' },
      ] },
      { key: 'no_telp', label: 'No. Telepon', type: 'text' },
      { key: 'nama_wali', label: 'Nama Wali', type: 'text' },
      { key: 'alamat', label: 'Alamat', type: 'textarea' },
    ];
  }

  if (role === 'tutor') {
    return [
      { key: 'nama_lengkap', label: 'Nama Lengkap', type: 'text', required: true },
      { key: 'email', label: 'Email', type: 'email', required: true },
      { key: 'nip', label: 'NIP / ID Tutor', type: 'text' },
      { key: 'spesialisasi', label: 'Spesialisasi', type: 'text' },
      { key: 'no_telp', label: 'No. Telepon', type: 'text' },
    ];
  }

  return [
    { key: 'nama_lengkap', label: 'Nama Lengkap', type: 'text', required: true },
    { key: 'email', label: 'Email', type: 'email', required: true },
  ];
}

function formatRole(role) {
  const map = {
    warga_belajar: 'Warga Belajar',
    admin: 'Admin TU & Keuangan',
    tutor: 'Tutor',
    pimpinan: 'Pimpinan',
    super_admin: 'Super Admin',
  };
  return map[role] || role;
}

function summarize(profile) {
  if (!profile) return [];

  if (profile.role === 'warga_belajar') {
    return [
      ['NIS', profile.nis || '-'],
      ['Jenjang', profile.jenjang || '-'],
      ['No. Telepon', profile.no_telp || '-'],
    ];
  }

  if (profile.role === 'tutor') {
    return [
      ['NIP', profile.nip || '-'],
      ['Spesialisasi', profile.spesialisasi || '-'],
      ['No. Telepon', profile.no_telp || '-'],
    ];
  }

  return [
    ['Role', formatRole(profile.role)],
    ['Email', profile.email || '-'],
  ];
}

function ProfileModal({ title, onClose, children }) {
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
          maxWidth: 720,
          maxHeight: '90vh',
          overflowY: 'auto',
          background: 'var(--color-surface)',
          borderRadius: 'var(--radius-lg)',
          boxShadow: 'var(--shadow-lg)',
          border: '1px solid var(--color-border)',
        }}
      >
        <div
          className="mobile-modal-header"
          style={{
            padding: '1rem 1.25rem',
          }}
        >
          <h3 style={{ margin: 0, fontFamily: 'var(--font-heading)', fontSize: '1.05rem' }}>{title}</h3>
          <button
            type="button"
            onClick={onClose}
            style={{ border: 'none', background: 'transparent', cursor: 'pointer', fontSize: '1.15rem', color: 'var(--color-text-muted)' }}
          >
            <i className="bi bi-x-lg"></i>
          </button>
        </div>
        <div className="mobile-modal-body">{children}</div>
      </div>
    </div>
  );
}

function ProfileField({ field, value, onChange }) {
  if (field.type === 'textarea') {
    return (
      <textarea
        className="form-input"
        rows={3}
        value={value}
        onChange={(e) => onChange(field.key, e.target.value)}
        style={{ resize: 'vertical' }}
      />
    );
  }

  if (field.type === 'select') {
    return (
      <select className="form-input" value={value} onChange={(e) => onChange(field.key, e.target.value)}>
        {field.options.map((option) => (
          <option key={option.value} value={option.value}>{option.label}</option>
        ))}
      </select>
    );
  }

  return (
    <input
      type={field.type}
      className="form-input"
      value={value}
      onChange={(e) => onChange(field.key, e.target.value)}
    />
  );
}

export default function ProfileEditorCard({ user, onUserUpdate, onProfileUpdate, compact = false }) {
  const [profile, setProfile] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [modalOpen, setModalOpen] = useState(false);
  const [form, setForm] = useState({});
  const [saving, setSaving] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [success, setSuccess] = useState('');
  const [showPasswordSection, setShowPasswordSection] = useState(false);

  const role = profile?.role || user?.role;
  const fields = useMemo(() => getFieldsForRole(role), [role]);
  const photoUrl = toAssetUrl(profile?.foto_profil || user?.foto_profil);

  const syncProfile = (nextProfile) => {
    setProfile(nextProfile);
    setForm(buildInitialForm(nextProfile));
    const nextUser = normalizeSessionUser(nextProfile);
    localStorage.setItem('pkbm_user', JSON.stringify(nextUser));
    if (onUserUpdate) onUserUpdate(nextUser);
    if (onProfileUpdate) onProfileUpdate(nextProfile);
  };

  useEffect(() => {
    const fetchProfile = async () => {
      try {
        setLoading(true);
        setError('');
      const res = await AuthAPI.getMe();
      syncProfile(res.data.data);
      } catch (err) {
        setError(err.response?.data?.message || 'Gagal memuat profil.');
      } finally {
        setLoading(false);
      }
    };

    fetchProfile();
  }, []);

  const handleFieldChange = (key, value) => {
    setForm((prev) => ({ ...prev, [key]: value }));
  };

  const handleSave = async () => {
    try {
      setSaving(true);
      setError('');
      setSuccess('');

      if (role === 'warga_belajar') {
        if (showPasswordSection) {
          await AuthAPI.changeMyPassword({
            current_password: form.current_password,
            new_password: form.new_password,
            confirm_password: form.confirm_password,
          });
        }

        if (form._pendingFoto) {
          const fotoData = new FormData();
          fotoData.append('foto', form._pendingFoto);
          const fotoRes = await AuthAPI.uploadFotoProfil(fotoData);
          syncProfile(fotoRes.data.data);
        }

        setSuccess('Profil berhasil diperbarui.');
        setModalOpen(false);
        setForm((prev) => ({
          ...prev,
          current_password: '',
          new_password: '',
          confirm_password: '',
          _pendingFoto: null,
        }));
        return;
      }

      const payload = {};
      for (const field of fields) {
        payload[field.key] = form[field.key] ?? '';
      }
      const res = await AuthAPI.updateMe(payload);
      syncProfile(res.data.data);

      if (form._pendingFoto) {
        const fotoData = new FormData();
        fotoData.append('foto', form._pendingFoto);
        const fotoRes = await AuthAPI.uploadFotoProfil(fotoData);
        syncProfile(fotoRes.data.data);
      }

      setSuccess('Profil berhasil diperbarui.');
      setModalOpen(false);
    } catch (err) {
      setError(err.response?.data?.message || 'Gagal menyimpan profil.');
    } finally {
      setSaving(false);
    }
  };

  const handleSelectFoto = async (event) => {
    const file = event.target.files?.[0];
    if (!file) return;
    setForm((prev) => ({ ...prev, _pendingFoto: file }));
    event.target.value = '';
  };

  if (loading) {
    return (
      <div className="card" style={{ marginBottom: compact ? '1rem' : '2rem' }}>
        <div className="loading-container" style={{ padding: '2rem' }}>
          <div className="spinner"></div>
          <p>Memuat profil...</p>
        </div>
      </div>
    );
  }

  return (
    <>
      <div className="card" style={{ marginBottom: compact ? '1rem' : '2rem' }}>
        <div
          className="mobile-toolbar"
          style={{
            justifyContent: 'space-between',
            alignItems: 'flex-start',
          }}
        >
          <div className="mobile-list-row" style={{ minWidth: 0 }}>
            <div
              style={{
                width: compact ? 72 : 84,
                height: compact ? 72 : 84,
                borderRadius: '50%',
                overflow: 'hidden',
                background: 'linear-gradient(135deg, var(--color-primary), var(--color-primary-dark))',
                color: 'white',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                fontFamily: 'var(--font-heading)',
                fontSize: compact ? '1.5rem' : '1.8rem',
                fontWeight: 800,
                flexShrink: 0,
                border: '3px solid rgba(255,255,255,0.9)',
                boxShadow: 'var(--shadow-sm)',
              }}
            >
              {photoUrl ? (
                <img src={photoUrl} alt="Foto profil" style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
              ) : (
                (profile?.nama_lengkap || user?.nama_lengkap || 'U').charAt(0).toUpperCase()
              )}
            </div>
            <div style={{ minWidth: 0 }}>
              <h2 style={{ margin: 0, fontFamily: 'var(--font-heading)', fontSize: compact ? '1.15rem' : '1.35rem' }}>
                {profile?.nama_lengkap || user?.nama_lengkap || 'Pengguna'}
              </h2>
              <p style={{ margin: '0.25rem 0 0', color: 'var(--color-text-muted)', fontSize: '0.92rem' }}>
                {formatRole(role)}
              </p>
              <div style={{ display: 'flex', gap: '0.75rem', flexWrap: 'wrap', marginTop: '0.65rem' }}>
                {summarize(profile).map(([label, value]) => (
                  <span key={label} style={{ fontSize: '0.82rem', color: 'var(--color-text-muted)' }}>
                    <strong style={{ color: 'var(--color-text)' }}>{label}:</strong> {value || '-'}
                  </span>
                ))}
              </div>
            </div>
          </div>

          <div className="mobile-actions">
            <button type="button" className="btn btn-primary" onClick={() => setModalOpen(true)}>
              <i className="bi bi-pencil-square"></i> Edit Profil
            </button>
          </div>
        </div>

        {(error || success) && (
          <div className={`alert ${error ? 'alert-danger' : 'alert-success'}`} style={{ marginTop: '1rem' }}>
            <i className={`bi ${error ? 'bi-exclamation-triangle-fill' : 'bi-check-circle-fill'}`}></i>
            <span>{error || success}</span>
          </div>
        )}
      </div>

      {modalOpen && (
        <ProfileModal title="Edit Profil" onClose={() => setModalOpen(false)}>
          <div className="form-group" style={{ marginBottom: '1.25rem' }}>
            <label className="form-label">Foto Profil</label>
            <div className="mobile-list-row">
              <div
                style={{
                  width: 80,
                  height: 80,
                  borderRadius: '50%',
                  overflow: 'hidden',
                  background: 'linear-gradient(135deg, var(--color-primary), var(--color-primary-dark))',
                  color: 'white',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  fontFamily: 'var(--font-heading)',
                  fontSize: '1.6rem',
                  fontWeight: 800,
                  flexShrink: 0,
                }}
              >
                {form._pendingFoto ? (
                  <img src={URL.createObjectURL(form._pendingFoto)} alt="Preview foto profil" style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                ) : photoUrl ? (
                  <img src={photoUrl} alt="Foto profil" style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                ) : (
                  (profile?.nama_lengkap || user?.nama_lengkap || 'U').charAt(0).toUpperCase()
                )}
              </div>
              <label className="btn btn-secondary" style={{ cursor: uploading ? 'wait' : 'pointer' }}>
                <input type="file" accept="image/*" style={{ display: 'none' }} onChange={handleSelectFoto} disabled={uploading || saving} />
                <i className="bi bi-camera-fill"></i> Pilih Foto
              </label>
              {form._pendingFoto ? (
                <span style={{ fontSize: '0.82rem', color: 'var(--color-text-muted)' }}>{form._pendingFoto.name}</span>
              ) : null}
            </div>
          </div>

          {role === 'warga_belajar' ? (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem', marginBottom: '1rem' }}>
              <div style={{ padding: '1rem', border: '1px solid var(--color-border)', borderRadius: 'var(--radius-md)', background: 'var(--color-bg)' }}>
                <div className="mobile-toolbar" style={{ justifyContent: 'space-between' }}>
                  <div>
                    <div style={{ fontWeight: 700, marginBottom: 4 }}>Ganti Password</div>
                    <div style={{ fontSize: '0.82rem', color: 'var(--color-text-muted)' }}>
                      Kosongkan jika Anda tidak ingin mengganti password.
                    </div>
                  </div>
                  <button type="button" className="btn btn-secondary" onClick={() => setShowPasswordSection((prev) => !prev)}>
                    <i className={`bi ${showPasswordSection ? 'bi-dash-circle' : 'bi-key-fill'}`}></i>
                    {showPasswordSection ? 'Tutup' : 'Atur Password'}
                  </button>
                </div>
              </div>

              {showPasswordSection ? (
                <div className="grid-cols-2" style={{ marginBottom: '0.25rem' }}>
                  <div className="form-group" style={{ gridColumn: 'span 2' }}>
                    <label className="form-label">Password Lama <span className="required">*</span></label>
                    <input type="password" className="form-input" value={form.current_password ?? ''} onChange={(e) => handleFieldChange('current_password', e.target.value)} />
                  </div>
                  <div className="form-group">
                    <label className="form-label">Password Baru <span className="required">*</span></label>
                    <input type="password" className="form-input" value={form.new_password ?? ''} onChange={(e) => handleFieldChange('new_password', e.target.value)} />
                  </div>
                  <div className="form-group">
                    <label className="form-label">Konfirmasi Password Baru <span className="required">*</span></label>
                    <input type="password" className="form-input" value={form.confirm_password ?? ''} onChange={(e) => handleFieldChange('confirm_password', e.target.value)} />
                  </div>
                </div>
              ) : null}
            </div>
          ) : (
            <div className="grid-cols-2" style={{ marginBottom: '1rem' }}>
              {fields.map((field) => (
                <div key={field.key} className="form-group" style={{ gridColumn: field.type === 'textarea' ? 'span 2' : 'span 1' }}>
                  <label className="form-label">
                    {field.label} {field.required ? <span className="required">*</span> : null}
                  </label>
                  <ProfileField field={field} value={form[field.key] ?? ''} onChange={handleFieldChange} />
                </div>
              ))}
            </div>
          )}

          {error && (
            <div className="alert alert-danger" style={{ marginBottom: '1rem' }}>
              <i className="bi bi-exclamation-triangle-fill"></i>
              <span>{error}</span>
            </div>
          )}

          <div className="mobile-actions">
            <button type="button" className="btn btn-secondary" onClick={() => setModalOpen(false)}>
              Batal
            </button>
            <button type="button" className="btn btn-primary" onClick={handleSave} disabled={saving}>
              {saving ? <><div className="spinner" style={{ width: 14, height: 14 }} /> Menyimpan...</> : <><i className="bi bi-check2"></i> Simpan Profil</>}
            </button>
          </div>
        </ProfileModal>
      )}
    </>
  );
}
