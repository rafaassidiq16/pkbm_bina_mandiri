// ============================================================
// src/pages/public/DaftarSpmbPage.jsx - Formulir SPMB Publik
// ============================================================
// Bisa diakses TANPA login oleh calon Warga Belajar.
// Alur: Step 1 (Data Diri) -> Step 2 (Upload Berkas) -> Step 3 (Selesai)
//
// API yang dipakai:
//   POST /api/spmb/daftar     -> submit data diri -> dapat pendaftar_id
//   POST /api/spmb/:id/berkas -> upload berkas (KK, ijazah, foto)
// ============================================================

import { useState } from 'react';
import { Link } from 'react-router-dom';
import { SpmbAPI } from '../../services/api.js';

const DAFTAR_BERKAS = [
  { key: 'kk', label: 'Kartu Keluarga (KK)', keterangan: 'Format JPG/PNG/PDF, maks 10MB' },
  { key: 'ijazah', label: 'Ijazah Terakhir', keterangan: 'Format JPG/PNG/PDF, maks 10MB' },
  { key: 'foto', label: 'Foto 3x4 Terbaru', keterangan: 'Format JPG/PNG, maks 10MB' },
];

function DaftarSpmbPage() {
  const [step, setStep] = useState(1);
  const [form, setForm] = useState({
    nama_lengkap: '',
    email: '',
    nik: '',
    no_telp: '',
    password: '',
    konfirmasi_password: '',
    tanggal_lahir: '',
    jenis_kelamin: 'L',
    jenjang_daftar: 'paket_c',
    alamat: '',
    nama_wali: '',
  });
  const [pendaftarId, setPendaftarId] = useState(null);
  const [files, setFiles] = useState({ kk: null, ijazah: null, foto: null });
  const [uploadStatus, setUploadStatus] = useState({ kk: 'idle', ijazah: 'idle', foto: 'idle' });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);

  const handleChange = (e) => {
    setForm((prev) => ({ ...prev, [e.target.name]: e.target.value }));
  };

  const handleFileChange = (key, file) => {
    setFiles((prev) => ({ ...prev, [key]: file }));
    setUploadStatus((prev) => ({ ...prev, [key]: 'idle' }));
  };

  const handleSubmitDataDiri = async (e) => {
    e.preventDefault();
    setError('');

    const wajib = [
      'nama_lengkap',
      'email',
      'no_telp',
      'password',
      'konfirmasi_password',
      'tanggal_lahir',
      'jenjang_daftar',
      'alamat',
      'nama_wali',
    ];

    for (const field of wajib) {
      if (!String(form[field] || '').trim()) {
        setError('Harap isi semua kolom yang bertanda bintang (*).');
        return;
      }
    }

    if (form.password.length < 8) {
      setError('Password minimal 8 karakter.');
      return;
    }

    if (form.password !== form.konfirmasi_password) {
      setError('Konfirmasi password tidak cocok.');
      return;
    }

    setLoading(true);
    try {
      const payload = {
        nama_lengkap: form.nama_lengkap.trim(),
        email: form.email.trim(),
        nik: form.nik.trim(),
        no_telp: form.no_telp.trim(),
        password: form.password,
        jenjang_daftar: form.jenjang_daftar,
        tanggal_lahir: form.tanggal_lahir,
        jenis_kelamin: form.jenis_kelamin,
        alamat: form.alamat.trim(),
        nama_wali: form.nama_wali.trim(),
      };

      const res = await SpmbAPI.daftar(payload);
      const id = res.data.data?.pendaftar_id;

      if (!id) {
        throw new Error('Nomor pendaftar tidak ditemukan di response.');
      }

      setPendaftarId(id);
      setStep(2);
      window.scrollTo({ top: 0, behavior: 'smooth' });
    } catch (err) {
      setError(err.response?.data?.message || err.message || 'Gagal mengirim data. Coba lagi.');
    } finally {
      setLoading(false);
    }
  };

  const handleUploadBerkas = async (key) => {
    if (!files[key] || !pendaftarId) return;

    setUploadStatus((prev) => ({ ...prev, [key]: 'uploading' }));

    try {
      const formData = new FormData();
      formData.append('file', files[key]);
      formData.append('jenis_berkas', key);

      await SpmbAPI.uploadBerkas(pendaftarId, formData);
      setUploadStatus((prev) => ({ ...prev, [key]: 'done' }));
    } catch {
      setUploadStatus((prev) => ({ ...prev, [key]: 'error' }));
    }
  };

  const semuaBerkasDone = DAFTAR_BERKAS.every((berkas) => uploadStatus[berkas.key] === 'done');

  const handleSelesai = () => {
    setStep(3);
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  return (
    <div style={{ minHeight: '100vh', background: 'var(--color-bg)' }}>
      <div
        style={{
          background: 'linear-gradient(135deg, var(--color-primary-dark), var(--color-primary))',
          padding: '2rem',
          textAlign: 'center',
          color: 'white',
        }}
      >
        <div
          style={{
            width: 52,
            height: 52,
            background: 'rgba(255,255,255,0.15)',
            borderRadius: 'var(--radius-lg)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            margin: '0 auto 1rem',
            fontSize: '1.5rem',
            backdropFilter: 'blur(10px)',
          }}
        >
          <i className="bi bi-mortarboard-fill"></i>
        </div>
        <h1 style={{ fontFamily: 'var(--font-heading)', fontWeight: 800, marginBottom: 8 }}>
          Pendaftaran Warga Belajar Baru
        </h1>
        <p style={{ opacity: 0.85, fontSize: 'var(--text-sm)' }}>
          PKBM Bina Mandiri - Paket A, B, dan C
        </p>
      </div>

      <div style={{ maxWidth: 640, margin: '2rem auto 0', padding: '0 1.5rem' }}>
        <StepIndicator step={step} />
      </div>

      <div style={{ maxWidth: 640, margin: '1.5rem auto 3rem', padding: '0 1.5rem' }}>
        {step === 1 && (
          <div className="card">
            <div className="card-header">
              <h3 className="card-title">
                <i className="bi bi-person-fill" style={{ color: 'var(--color-primary)' }}></i>
                {' '}Langkah 1: Data Diri Calon Warga Belajar
              </h3>
              <p style={{ fontSize: 'var(--text-sm)', color: 'var(--color-text-muted)', marginTop: 6 }}>
                Isi formulir di bawah dengan data yang benar dan lengkap.
                Kolom bertanda <span style={{ color: 'var(--color-danger)' }}>*</span> wajib diisi.
              </p>
            </div>

            {error && (
              <div className="alert alert-danger" style={{ marginBottom: '1.25rem' }}>
                <i className="bi bi-exclamation-triangle-fill"></i>
                <span>{error}</span>
              </div>
            )}

            <form onSubmit={handleSubmitDataDiri} noValidate>
              <div className="form-group">
                <label className="form-label">
                  Nama Lengkap <span className="required">*</span>
                </label>
                <input
                  name="nama_lengkap"
                  type="text"
                  className="form-input"
                  placeholder="Tulis nama lengkap sesuai KK"
                  value={form.nama_lengkap}
                  onChange={handleChange}
                  disabled={loading}
                />
              </div>

              <div className="form-group">
                <label className="form-label">
                  NIK (Nomor Induk Kependudukan)
                </label>
                <input
                  name="nik"
                  type="text"
                  className="form-input"
                  placeholder="16 digit angka sesuai KTP/KK"
                  maxLength={16}
                  value={form.nik}
                  onChange={handleChange}
                  disabled={loading}
                />
                <p style={{ fontSize: 'var(--text-xs)', color: 'var(--color-text-muted)', marginTop: 6 }}>
                  Opsional untuk saat ini dan belum dipakai dalam verifikasi sistem.
                </p>
              </div>

              <div className="form-group">
                <label className="form-label">
                  Email Aktif <span className="required">*</span>
                </label>
                <input
                  name="email"
                  type="email"
                  className="form-input"
                  placeholder="contoh@email.com"
                  value={form.email}
                  onChange={handleChange}
                  disabled={loading}
                />
              </div>

              <div className="form-group">
                <label className="form-label">
                  No. HP / WhatsApp <span className="required">*</span>
                </label>
                <input
                  name="no_telp"
                  type="tel"
                  className="form-input"
                  placeholder="Contoh: 081234567890"
                  value={form.no_telp}
                  onChange={handleChange}
                  disabled={loading}
                />
              </div>

              <div className="grid-cols-2" style={{ marginBottom: '1rem' }}>
                <div className="form-group" style={{ marginBottom: 0 }}>
                  <label className="form-label">
                    Password <span className="required">*</span>
                  </label>
                  <div className="input-with-icon">
                    <input
                      name="password"
                      type={showPassword ? 'text' : 'password'}
                      className="form-input with-icon-right"
                      placeholder="Minimal 8 karakter"
                      value={form.password}
                      onChange={handleChange}
                      disabled={loading}
                    />
                    <button
                      type="button"
                      className="input-icon-right"
                      onClick={() => setShowPassword((prev) => !prev)}
                      aria-label={showPassword ? 'Sembunyikan password' : 'Tampilkan password'}
                    >
                      <i className={`bi ${showPassword ? 'bi-eye-slash' : 'bi-eye'}`}></i>
                    </button>
                  </div>
                </div>
                <div className="form-group" style={{ marginBottom: 0 }}>
                  <label className="form-label">
                    Konfirmasi Password <span className="required">*</span>
                  </label>
                  <div className="input-with-icon">
                    <input
                      name="konfirmasi_password"
                      type={showConfirmPassword ? 'text' : 'password'}
                      className="form-input with-icon-right"
                      placeholder="Ulangi password"
                      value={form.konfirmasi_password}
                      onChange={handleChange}
                      disabled={loading}
                    />
                    <button
                      type="button"
                      className="input-icon-right"
                      onClick={() => setShowConfirmPassword((prev) => !prev)}
                      aria-label={showConfirmPassword ? 'Sembunyikan konfirmasi password' : 'Tampilkan konfirmasi password'}
                    >
                      <i className={`bi ${showConfirmPassword ? 'bi-eye-slash' : 'bi-eye'}`}></i>
                    </button>
                  </div>
                </div>
              </div>

              <div className="grid-cols-2" style={{ marginBottom: '1rem' }}>
                <div className="form-group" style={{ marginBottom: 0 }}>
                  <label className="form-label">
                    Tanggal Lahir <span className="required">*</span>
                  </label>
                  <input
                    name="tanggal_lahir"
                    type="date"
                    className="form-input"
                    value={form.tanggal_lahir}
                    onChange={handleChange}
                    disabled={loading}
                  />
                </div>
                <div className="form-group" style={{ marginBottom: 0 }}>
                  <label className="form-label">
                    Jenis Kelamin <span className="required">*</span>
                  </label>
                  <select
                    name="jenis_kelamin"
                    className="form-input"
                    value={form.jenis_kelamin}
                    onChange={handleChange}
                    disabled={loading}
                    style={{ cursor: 'pointer' }}
                  >
                    <option value="L">Laki-laki</option>
                    <option value="P">Perempuan</option>
                  </select>
                </div>
              </div>

              <div className="form-group">
                <label className="form-label">
                  Jenjang yang Dituju <span className="required">*</span>
                </label>
                <select
                  name="jenjang_daftar"
                  className="form-input"
                  value={form.jenjang_daftar}
                  onChange={handleChange}
                  disabled={loading}
                  style={{ cursor: 'pointer' }}
                >
                  <option value="paket_a">Paket A - Setara SD</option>
                  <option value="paket_b">Paket B - Setara SMP</option>
                  <option value="paket_c">Paket C - Setara SMA</option>
                </select>
                <p style={{ fontSize: 'var(--text-xs)', color: 'var(--color-text-muted)', marginTop: 6 }}>
                  Jika ragu, Admin TU akan membantu penempatan jenjang yang tepat.
                </p>
              </div>

              <div className="form-group">
                <label className="form-label">
                  Alamat Lengkap <span className="required">*</span>
                </label>
                <textarea
                  name="alamat"
                  className="form-input"
                  placeholder="Jalan, RT/RW, Kelurahan, Kecamatan, Kota"
                  rows={3}
                  value={form.alamat}
                  onChange={handleChange}
                  disabled={loading}
                  style={{ resize: 'vertical' }}
                />
              </div>

              <div className="form-group">
                <label className="form-label">
                  Nama Orang Tua / Wali <span className="required">*</span>
                </label>
                <input
                  name="nama_wali"
                  type="text"
                  className="form-input"
                  placeholder="Nama orang tua atau wali"
                  value={form.nama_wali}
                  onChange={handleChange}
                  disabled={loading}
                />
              </div>

              <button
                type="submit"
                className="btn btn-primary btn-block"
                disabled={loading}
                style={{ marginTop: '1rem' }}
              >
                {loading ? (
                  <>
                    <span className="spinner-sm"></span> Menyimpan...
                  </>
                ) : (
                  <>
                    <i className="bi bi-arrow-right-circle-fill"></i> Lanjut ke Upload Berkas
                  </>
                )}
              </button>
            </form>

            <p
              style={{
                textAlign: 'center',
                marginTop: '1.25rem',
                fontSize: 'var(--text-sm)',
                color: 'var(--color-text-muted)',
              }}
            >
              Sudah punya akun? <Link to="/">Masuk di sini</Link>
            </p>
          </div>
        )}

        {step === 2 && (
          <div className="card">
            <div className="card-header">
              <h3 className="card-title">
                <i className="bi bi-file-earmark-arrow-up-fill" style={{ color: 'var(--color-primary)' }}></i>
                {' '}Langkah 2: Upload Berkas Pendukung
              </h3>
              <p style={{ fontSize: 'var(--text-sm)', color: 'var(--color-text-muted)', marginTop: 6 }}>
                Upload tiga berkas berikut. Setelah mengklik "Upload", tunggu sampai muncul tanda
                <strong> ✓ Berhasil</strong> sebelum melanjutkan.
              </p>
            </div>

            <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem', marginBottom: '1.5rem' }}>
              {DAFTAR_BERKAS.map((berkas) => (
                <BerkasUploadRow
                  key={berkas.key}
                  berkas={berkas}
                  file={files[berkas.key]}
                  status={uploadStatus[berkas.key]}
                  onFileChange={(file) => handleFileChange(berkas.key, file)}
                  onUpload={() => handleUploadBerkas(berkas.key)}
                />
              ))}
            </div>

            <button
              className="btn btn-primary btn-block"
              onClick={handleSelesai}
              disabled={!semuaBerkasDone}
            >
              <i className="bi bi-check-circle-fill"></i>
              {semuaBerkasDone ? 'Selesaikan Pendaftaran' : 'Upload semua berkas terlebih dahulu'}
            </button>

            {!semuaBerkasDone && (
              <p style={{ textAlign: 'center', fontSize: 'var(--text-xs)', color: 'var(--color-text-muted)', marginTop: '0.75rem' }}>
                <i className="bi bi-info-circle"></i>{' '}
                Tombol di atas akan aktif setelah semua berkas berhasil diupload.
              </p>
            )}
          </div>
        )}

        {step === 3 && (
          <div className="card" style={{ textAlign: 'center' }}>
            <div
              style={{
                width: 80,
                height: 80,
                background: '#D1FAE5',
                borderRadius: '50%',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                margin: '0 auto 1.5rem',
                fontSize: '2.5rem',
                color: 'var(--color-success)',
              }}
            >
              <i className="bi bi-check-circle-fill"></i>
            </div>

            <h2 style={{ fontFamily: 'var(--font-heading)', fontWeight: 800, marginBottom: '0.75rem' }}>
              Pendaftaran Berhasil Dikirim!
            </h2>

            <p style={{ color: 'var(--color-text-muted)', lineHeight: 1.8, marginBottom: '1.5rem' }}>
              Terima kasih telah mendaftar di <strong>PKBM Bina Mandiri</strong>.<br />
              Tim Admin TU kami akan memverifikasi berkas Anda dalam <strong>1-3 hari kerja</strong>.<br />
              Informasi login akan dikirimkan setelah pendaftaran disetujui.
            </p>

            <div
              style={{
                background: 'var(--color-primary-light)',
                border: '1px solid var(--color-primary)',
                borderRadius: 'var(--radius-md)',
                padding: '1rem',
                marginBottom: '1.5rem',
              }}
            >
              <p style={{ fontSize: 'var(--text-xs)', color: 'var(--color-text-muted)', marginBottom: 4 }}>
                Nomor Referensi Pendaftaran Anda
              </p>
              <p style={{ fontFamily: 'var(--font-heading)', fontWeight: 800, fontSize: 'var(--text-xl)', color: 'var(--color-primary)' }}>
                #{String(pendaftarId).padStart(6, '0')}
              </p>
              <p style={{ fontSize: 'var(--text-xs)', color: 'var(--color-text-muted)', marginTop: 4 }}>
                Simpan nomor ini untuk keperluan konfirmasi
              </p>
            </div>

            <div
              style={{
                background: 'var(--color-bg)',
                borderRadius: 'var(--radius-md)',
                padding: '1rem',
                textAlign: 'left',
                marginBottom: '1.5rem',
                border: '1px solid var(--color-border)',
              }}
            >
              <p style={{ fontWeight: 700, marginBottom: '0.5rem', fontSize: 'var(--text-sm)' }}>
                Langkah Selanjutnya:
              </p>
              <ul style={{ paddingLeft: '1.25rem', fontSize: 'var(--text-sm)', color: 'var(--color-text-muted)', lineHeight: 2 }}>
                <li>Tunggu verifikasi berkas oleh Admin TU</li>
                <li>Jika disetujui, Anda akan mendapat akun login</li>
                <li>Masuk ke sistem dan mulai belajar</li>
              </ul>
            </div>

            <Link to="/" className="btn btn-primary">
              <i className="bi bi-box-arrow-in-right"></i>
              Kembali ke Halaman Login
            </Link>
          </div>
        )}
      </div>
    </div>
  );
}

function StepIndicator({ step }) {
  const steps = [
    { no: 1, label: 'Data Diri' },
    { no: 2, label: 'Upload Berkas' },
    { no: 3, label: 'Selesai' },
  ];

  return (
    <div style={{ display: 'flex', alignItems: 'center', marginBottom: '0.5rem' }}>
      {steps.map((item, index) => (
        <div
          key={item.no}
          style={{ display: 'flex', alignItems: 'center', flex: index < steps.length - 1 ? 1 : 'none' }}
        >
          <div
            style={{
              width: 36,
              height: 36,
              borderRadius: '50%',
              flexShrink: 0,
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              background: step >= item.no ? 'var(--color-primary)' : 'var(--color-border)',
              color: step >= item.no ? 'white' : 'var(--color-text-muted)',
              fontFamily: 'var(--font-heading)',
              fontWeight: 800,
              fontSize: 'var(--text-sm)',
              transition: 'all 0.3s',
            }}
          >
            {step > item.no ? <i className="bi bi-check-lg"></i> : item.no}
          </div>

          <span
            style={{
              marginLeft: 8,
              fontSize: 'var(--text-xs)',
              fontWeight: 700,
              color: step >= item.no ? 'var(--color-primary)' : 'var(--color-text-muted)',
              whiteSpace: 'nowrap',
            }}
          >
            {item.label}
          </span>

          {index < steps.length - 1 && (
            <div
              style={{
                flex: 1,
                height: 2,
                background: step > item.no ? 'var(--color-primary)' : 'var(--color-border)',
                margin: '0 12px',
                transition: 'background 0.3s',
              }}
            />
          )}
        </div>
      ))}
    </div>
  );
}

function BerkasUploadRow({ berkas, file, status, onFileChange, onUpload }) {
  const statusConfig = {
    idle: { color: 'var(--color-text-muted)', icon: 'bi-cloud-upload', label: '' },
    uploading: { color: 'var(--color-info)', icon: 'bi-arrow-repeat spin', label: 'Mengunggah...' },
    done: { color: 'var(--color-success)', icon: 'bi-check-circle-fill', label: 'Berhasil diunggah' },
    error: { color: 'var(--color-danger)', icon: 'bi-x-circle-fill', label: 'Gagal - coba lagi' },
  };
  const cfg = statusConfig[status];

  return (
    <div
      style={{
        border: `2px solid ${status === 'done' ? 'var(--color-success)' : status === 'error' ? 'var(--color-danger)' : 'var(--color-border)'}`,
        borderRadius: 'var(--radius-md)',
        padding: '1rem',
        background: status === 'done' ? '#F0FDF4' : 'var(--color-surface)',
        transition: 'all 0.2s',
      }}
    >
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '0.75rem' }}>
        <div>
          <p style={{ fontWeight: 700, fontSize: 'var(--text-sm)', marginBottom: 2 }}>{berkas.label}</p>
          <p style={{ fontSize: 'var(--text-xs)', color: 'var(--color-text-muted)' }}>{berkas.keterangan}</p>
        </div>
        {status !== 'idle' && (
          <div style={{ display: 'flex', alignItems: 'center', gap: 5, color: cfg.color, fontSize: 'var(--text-xs)', fontWeight: 700 }}>
            <i className={`bi ${cfg.icon}`} style={status === 'uploading' ? { animation: 'spin 0.8s linear infinite' } : {}}></i>
            {cfg.label}
          </div>
        )}
      </div>

      <div style={{ display: 'flex', gap: '0.75rem', alignItems: 'center', flexWrap: 'wrap' }}>
        <input
          type="file"
          accept=".jpg,.jpeg,.png,.pdf"
          disabled={status === 'uploading' || status === 'done'}
          onChange={(e) => onFileChange(e.target.files[0])}
          style={{
            flex: 1,
            minWidth: 0,
            fontSize: 'var(--text-sm)',
            color: 'var(--color-text)',
            cursor: 'pointer',
          }}
        />
        <button
          className={`btn ${status === 'done' ? 'btn-secondary' : 'btn-primary'}`}
          onClick={onUpload}
          disabled={!file || status === 'uploading' || status === 'done'}
          style={{ flexShrink: 0, minWidth: 110 }}
        >
          {status === 'done' ? (
            <>
              <i className="bi bi-check-lg"></i> Terunggah
            </>
          ) : status === 'uploading' ? (
            <>
              <span className="spinner-sm"></span> Mengunggah
            </>
          ) : (
            <>
              <i className="bi bi-cloud-upload"></i> Upload
            </>
          )}
        </button>
      </div>
    </div>
  );
}

export default DaftarSpmbPage;
