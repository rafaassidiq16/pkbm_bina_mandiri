// ============================================================
// src/pages/public/DaftarSpmbPage.jsx - Formulir SPMB Publik
// ============================================================

import { useState } from 'react';
import { Link } from 'react-router-dom';
import { SpmbAPI } from '../../services/api.js';
import './DaftarSpmbPage.css';

// ═ COLOR PALETTE ═
const PRIMARY = "#10b981";
const PRIMARY_DARK = "#059669";
const PRIMARY_LIGHT = "#d1fae5";
const SECONDARY = "#6b7280";
const DARK_TEXT = "#1f2937";
const LIGHT_TEXT = "#6b7280";
const LIGHT_BG = "#f9fafb";
const SURFACE = "#ffffff";
const BORDER = "#e5e7eb";
const ERROR = "#ef4444";
const SUCCESS = "#10b981";
const WARNING = "#f59e0b";

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
    <div style={{ minHeight: '100vh', background: LIGHT_BG }}>
      <style>{`
        @keyframes fadeInUp {
          from {
            opacity: 0;
            transform: translateY(24px);
          }
          to {
            opacity: 1;
            transform: translateY(0);
          }
        }

        @keyframes spin {
          to {
            transform: rotate(360deg);
          }
        }

        @media (max-width: 768px) {
          .form-grid-2 {
            grid-template-columns: 1fr !important;
          }
        }
      `}</style>

      {/* ═ HEADER HERO ═ */}
      <div
        style={{
          background: `linear-gradient(135deg, ${PRIMARY_DARK} 0%, ${PRIMARY} 100%)`,
          padding: "48px 24px",
          textAlign: "center",
          color: "#fff",
        }}
      >
        <div
          style={{
            width: 52,
            height: 52,
            background: "rgba(255,255,255,0.15)",
            borderRadius: "12px",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            margin: "0 auto 16px",
            fontSize: "1.5rem",
            backdropFilter: "blur(10px)",
          }}
        >
          🎓
        </div>
        <h1 style={{ fontWeight: 800, marginBottom: 8, fontSize: "1.875rem" }}>
          Pendaftaran Warga Belajar Baru
        </h1>
        <p style={{ opacity: 0.85, fontSize: "0.95rem" }}>
          PKBM Bina Mandiri - Paket A, B, dan C
        </p>
      </div>

      {/* ═ STEP INDICATOR ═ */}
      <div style={{ maxWidth: 640, margin: "32px auto 0", padding: "0 24px" }}>
        <StepIndicator step={step} />
      </div>

      {/* ═ FORM CONTAINER ═ */}
      <div style={{ maxWidth: 640, margin: "24px auto 48px", padding: "0 24px" }}>
        
        {/* STEP 1: DATA DIRI */}
        {step === 1 && (
          <div
            style={{
              background: SURFACE,
              borderRadius: "16px",
              padding: "32px",
              boxShadow: "0 4px 6px rgba(0, 0, 0, 0.07)",
              border: `1px solid ${BORDER}`,
              animation: "fadeInUp 0.4s ease-out",
            }}
          >
            {/* Header */}
            <div style={{ marginBottom: "28px" }}>
              <h3
                style={{
                  fontSize: "1.25rem",
                  fontWeight: 800,
                  color: DARK_TEXT,
                  marginBottom: 8,
                  display: "flex",
                  alignItems: "center",
                  gap: 12,
                }}
              >
                <span style={{ color: PRIMARY, fontSize: "1.5rem" }}>👤</span>
                Langkah 1: Data Diri Calon Warga Belajar
              </h3>
              <p style={{ fontSize: "0.9rem", color: LIGHT_TEXT, marginTop: 6 }}>
                Isi formulir di bawah dengan data yang benar dan lengkap.
                Kolom bertanda <span style={{ color: ERROR, fontWeight: 700 }}>*</span> wajib diisi.
              </p>
            </div>

            {/* Error Alert */}
            {error && (
              <div
                style={{
                  background: "rgba(239, 68, 68, 0.1)",
                  border: `1.5px solid ${ERROR}`,
                  borderRadius: "8px",
                  padding: "12px 16px",
                  marginBottom: "24px",
                  display: "flex",
                  alignItems: "flex-start",
                  gap: 12,
                  color: ERROR,
                  fontSize: "0.9rem",
                }}
              >
                <span style={{ fontSize: "1.2rem", marginTop: 2 }}>⚠️</span>
                <span>{error}</span>
              </div>
            )}

            {/* Form */}
            <form onSubmit={handleSubmitDataDiri} style={{ marginBottom: 24 }}>
              
              {/* Row 1: Nama Lengkap & Email */}
              <div className="form-grid-2" style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 20, marginBottom: 20 }}>
                <FormInput
                  label="Nama Lengkap"
                  name="nama_lengkap"
                  type="text"
                  value={form.nama_lengkap}
                  onChange={handleChange}
                  required
                />
                <FormInput
                  label="Email"
                  name="email"
                  type="email"
                  value={form.email}
                  onChange={handleChange}
                  required
                />
              </div>

              {/* Row 2: NIK & No. Telp */}
              <div className="form-grid-2" style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 20, marginBottom: 20 }}>
                <FormInput
                  label="NIK (Nomor Induk Kependudukan)"
                  name="nik"
                  type="text"
                  value={form.nik}
                  onChange={handleChange}
                  placeholder="Opsional"
                />
                <FormInput
                  label="No. Telepon"
                  name="no_telp"
                  type="tel"
                  value={form.no_telp}
                  onChange={handleChange}
                  required
                />
              </div>

              {/* Row 3: Password & Konfirmasi */}
              <div className="form-grid-2" style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 20, marginBottom: 20 }}>
                <FormPasswordInput
                  label="Password"
                  name="password"
                  value={form.password}
                  onChange={handleChange}
                  show={showPassword}
                  onToggle={() => setShowPassword(!showPassword)}
                  required
                />
                <FormPasswordInput
                  label="Konfirmasi Password"
                  name="konfirmasi_password"
                  value={form.konfirmasi_password}
                  onChange={handleChange}
                  show={showConfirmPassword}
                  onToggle={() => setShowConfirmPassword(!showConfirmPassword)}
                  required
                />
              </div>

              {/* Row 4: Tanggal Lahir & Jenis Kelamin */}
              <div className="form-grid-2" style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 20, marginBottom: 20 }}>
                <FormInput
                  label="Tanggal Lahir"
                  name="tanggal_lahir"
                  type="date"
                  value={form.tanggal_lahir}
                  onChange={handleChange}
                  required
                />
                <FormSelect
                  label="Jenis Kelamin"
                  name="jenis_kelamin"
                  value={form.jenis_kelamin}
                  onChange={handleChange}
                  options={[
                    { value: 'L', label: 'Laki-laki' },
                    { value: 'P', label: 'Perempuan' },
                  ]}
                />
              </div>

              {/* Row 5: Jenjang Daftar */}
              <div style={{ marginBottom: 20 }}>
                <FormSelect
                  label="Jenjang Pendaftaran"
                  name="jenjang_daftar"
                  value={form.jenjang_daftar}
                  onChange={handleChange}
                  options={[
                    { value: 'paket_a', label: 'Paket A (Setara SD)' },
                    { value: 'paket_b', label: 'Paket B (Setara SMP)' },
                    { value: 'paket_c', label: 'Paket C (Setara SMA)' },
                  ]}
                  required
                />
              </div>

              {/* Row 6: Alamat */}
              <div style={{ marginBottom: 20 }}>
                <label style={{ display: "block", fontSize: "0.9rem", fontWeight: 600, color: DARK_TEXT, marginBottom: 8 }}>
                  Alamat Lengkap <span style={{ color: ERROR }}>*</span>
                </label>
                <textarea
                  name="alamat"
                  value={form.alamat}
                  onChange={handleChange}
                  required
                  placeholder="Jalan, No., RT/RW, Desa/Kelurahan, Kecamatan, Kabupaten"
                  style={{
                    width: "100%",
                    padding: "12px 16px",
                    fontSize: "0.95rem",
                    border: `1.5px solid ${BORDER}`,
                    borderRadius: "8px",
                    outline: "none",
                    transition: "all 0.2s",
                    boxSizing: "border-box",
                    color: DARK_TEXT,
                    background: "#fff",
                    minHeight: "100px",
                    fontFamily: "inherit",
                    resize: "vertical",
                  }}
                  onFocus={(e) => (e.target.style.borderColor = PRIMARY)}
                  onBlur={(e) => (e.target.style.borderColor = BORDER)}
                />
              </div>

              {/* Row 7: Nama Wali */}
              <div style={{ marginBottom: 28 }}>
                <FormInput
                  label="Nama Wali / Orang Tua"
                  name="nama_wali"
                  type="text"
                  value={form.nama_wali}
                  onChange={handleChange}
                  required
                />
              </div>

              {/* Submit Button */}
              <button
                type="submit"
                disabled={loading}
                style={{
                  width: "100%",
                  padding: "12px 16px",
                  fontSize: "0.95rem",
                  fontWeight: 700,
                  color: "#fff",
                  background: loading ? `${PRIMARY}cc` : PRIMARY,
                  border: "none",
                  borderRadius: "8px",
                  cursor: loading ? "not-allowed" : "pointer",
                  transition: "all 0.2s",
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  gap: 8,
                }}
                onMouseOver={(e) => !loading && (e.target.style.background = PRIMARY_DARK)}
                onMouseOut={(e) => !loading && (e.target.style.background = PRIMARY)}
              >
                {loading ? (
                  <>
                    <div
                      style={{
                        width: "16px",
                        height: "16px",
                        border: "2px solid rgba(255,255,255,0.4)",
                        borderTopColor: "#fff",
                        borderRadius: "50%",
                        animation: "spin 0.7s linear infinite",
                      }}
                    />
                    Memproses...
                  </>
                ) : (
                  <>
                    Lanjut ke Langkah 2 →
                  </>
                )}
              </button>
            </form>
          </div>
        )}

        {/* STEP 2: UPLOAD BERKAS */}
        {step === 2 && (
          <div
            style={{
              background: SURFACE,
              borderRadius: "16px",
              padding: "32px",
              boxShadow: "0 4px 6px rgba(0, 0, 0, 0.07)",
              border: `1px solid ${BORDER}`,
              animation: "fadeInUp 0.4s ease-out",
            }}
          >
            {/* Header */}
            <div style={{ marginBottom: "28px" }}>
              <h3
                style={{
                  fontSize: "1.25rem",
                  fontWeight: 800,
                  color: DARK_TEXT,
                  marginBottom: 8,
                  display: "flex",
                  alignItems: "center",
                  gap: 12,
                }}
              >
                <span style={{ color: PRIMARY, fontSize: "1.5rem" }}>📄</span>
                Langkah 2: Upload Berkas Pendukung
              </h3>
              <p style={{ fontSize: "0.9rem", color: LIGHT_TEXT, marginTop: 6 }}>
                Silakan upload dokumen berikut. Semua berkas wajib diupload untuk melanjutkan.
              </p>
            </div>

            {/* Berkas List */}
            <div style={{ marginBottom: 28 }}>
              {DAFTAR_BERKAS.map((berkas) => (
                <BerkasUploadCard
                  key={berkas.key}
                  berkas={berkas}
                  file={files[berkas.key]}
                  status={uploadStatus[berkas.key]}
                  onFileChange={(file) => handleFileChange(berkas.key, file)}
                  onUpload={() => handleUploadBerkas(berkas.key)}
                />
              ))}
            </div>

            {/* Action Buttons */}
            <div style={{ display: "flex", gap: 12 }}>
              <button
                onClick={() => setStep(1)}
                style={{
                  flex: 1,
                  padding: "12px 16px",
                  fontSize: "0.95rem",
                  fontWeight: 700,
                  color: PRIMARY,
                  background: PRIMARY_LIGHT,
                  border: "none",
                  borderRadius: "8px",
                  cursor: "pointer",
                  transition: "all 0.2s",
                }}
                onMouseOver={(e) => (e.target.style.background = "#a7f3d0")}
                onMouseOut={(e) => (e.target.style.background = PRIMARY_LIGHT)}
              >
                ← Kembali
              </button>
              <button
                onClick={handleSelesai}
                disabled={!semuaBerkasDone}
                style={{
                  flex: 1,
                  padding: "12px 16px",
                  fontSize: "0.95rem",
                  fontWeight: 700,
                  color: "#fff",
                  background: semuaBerkasDone ? PRIMARY : `${PRIMARY}66`,
                  border: "none",
                  borderRadius: "8px",
                  cursor: semuaBerkasDone ? "pointer" : "not-allowed",
                  transition: "all 0.2s",
                }}
                onMouseOver={(e) => semuaBerkasDone && (e.target.style.background = PRIMARY_DARK)}
                onMouseOut={(e) => semuaBerkasDone && (e.target.style.background = PRIMARY)}
              >
                Lanjut ke Langkah 3 →
              </button>
            </div>
          </div>
        )}

        {/* STEP 3: SELESAI */}
        {step === 3 && (
          <div
            style={{
              background: SURFACE,
              borderRadius: "16px",
              padding: "48px 32px",
              boxShadow: "0 4px 6px rgba(0, 0, 0, 0.07)",
              border: `1px solid ${BORDER}`,
              textAlign: "center",
              animation: "fadeInUp 0.4s ease-out",
            }}
          >
            <div
              style={{
                width: 80,
                height: 80,
                background: `${SUCCESS}15`,
                borderRadius: "50%",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                margin: "0 auto 24px",
                fontSize: "2.5rem",
              }}
            >
              ✅
            </div>
            <h2
              style={{
                fontSize: "1.5rem",
                fontWeight: 800,
                color: DARK_TEXT,
                marginBottom: 12,
              }}
            >
              Pendaftaran Berhasil!
            </h2>
            <p
              style={{
                fontSize: "0.95rem",
                color: LIGHT_TEXT,
                marginBottom: 8,
                lineHeight: 1.6,
              }}
            >
              Terima kasih telah mendaftar di PKBM Bina Mandiri.
            </p>
            <p
              style={{
                fontSize: "0.9rem",
                color: PRIMARY_DARK,
                background: PRIMARY_LIGHT,
                padding: "12px 16px",
                borderRadius: "8px",
                marginBottom: 28,
                fontWeight: 600,
              }}
            >
              <strong>Nomor Pendaftar:</strong> {pendaftarId}
            </p>

            <div style={{ marginBottom: 28 }}>
              <p style={{ fontSize: "0.9rem", color: LIGHT_TEXT, marginBottom: 16, lineHeight: 1.6 }}>
                Tim kami akan memverifikasi data Anda dalam 1-3 hari kerja.
                Anda akan menerima email konfirmasi ketika proses verifikasi selesai.
              </p>
            </div>

            <div style={{ display: "flex", gap: 12 }}>
              <Link
                to="/"
                style={{
                  flex: 1,
                  padding: "12px 16px",
                  fontSize: "0.95rem",
                  fontWeight: 700,
                  color: DARK_TEXT,
                  background: "#f3f4f6",
                  border: "none",
                  borderRadius: "8px",
                  cursor: "pointer",
                  textDecoration: "none",
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  transition: "all 0.2s",
                }}
                onMouseOver={(e) => (e.target.style.background = "#e5e7eb")}
                onMouseOut={(e) => (e.target.style.background = "#f3f4f6")}
              >
                Kembali ke Beranda
              </Link>
              <Link
                to="/masuk"
                style={{
                  flex: 1,
                  padding: "12px 16px",
                  fontSize: "0.95rem",
                  fontWeight: 700,
                  color: "#fff",
                  background: PRIMARY,
                  border: "none",
                  borderRadius: "8px",
                  cursor: "pointer",
                  textDecoration: "none",
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  transition: "all 0.2s",
                }}
                onMouseOver={(e) => (e.target.style.background = PRIMARY_DARK)}
                onMouseOut={(e) => (e.target.style.background = PRIMARY)}
              >
                Masuk Akun
              </Link>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

// ═ HELPER COMPONENTS ═

function StepIndicator({ step }) {
  const steps = [
    { num: 1, label: 'Data Diri' },
    { num: 2, label: 'Upload Berkas' },
    { num: 3, label: 'Selesai' },
  ];

  return (
    <div style={{ display: "flex", justifyContent: "space-between", marginBottom: 32 }}>
      {steps.map((s, i) => (
        <div key={s.num} style={{ display: "flex", alignItems: "center", flex: 1 }}>
          <div
            style={{
              width: 48,
              height: 48,
              borderRadius: "50%",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              fontWeight: 700,
              fontSize: "1rem",
              background: step >= s.num ? PRIMARY : BORDER,
              color: step >= s.num ? "#fff" : LIGHT_TEXT,
              transition: "all 0.3s",
            }}
          >
            {step > s.num ? "✓" : s.num}
          </div>
          <div style={{ marginLeft: 12, flex: 1 }}>
            <p style={{ fontSize: "0.75rem", color: LIGHT_TEXT, fontWeight: 700, marginBottom: 2, letterSpacing: "0.5px" }}>
              LANGKAH {s.num}
            </p>
            <p style={{ fontSize: "0.9rem", fontWeight: 600, color: step >= s.num ? DARK_TEXT : LIGHT_TEXT }}>
              {s.label}
            </p>
          </div>
          {i < steps.length - 1 && (
            <div
              style={{
                flex: 1,
                height: 2,
                background: step > s.num ? PRIMARY : BORDER,
                margin: "0 12px",
                transition: "all 0.3s",
              }}
            />
          )}
        </div>
      ))}
    </div>
  );
}

function FormInput({ label, name, type, value, onChange, required, placeholder }) {
  return (
    <div>
      <label style={{ display: "block", fontSize: "0.9rem", fontWeight: 600, color: DARK_TEXT, marginBottom: 8 }}>
        {label} {required && <span style={{ color: ERROR }}>*</span>}
      </label>
      <input
        type={type}
        name={name}
        value={value}
        onChange={onChange}
        required={required}
        placeholder={placeholder}
        style={{
          width: "100%",
          padding: "12px 16px",
          fontSize: "0.95rem",
          border: `1.5px solid ${BORDER}`,
          borderRadius: "8px",
          outline: "none",
          transition: "all 0.2s",
          boxSizing: "border-box",
          color: DARK_TEXT,
          background: "#fff",
          fontFamily: "inherit",
        }}
        onFocus={(e) => (e.target.style.borderColor = PRIMARY)}
        onBlur={(e) => (e.target.style.borderColor = BORDER)}
      />
    </div>
  );
}

function FormPasswordInput({ label, name, value, onChange, show, onToggle, required }) {
  return (
    <div>
      <label style={{ display: "block", fontSize: "0.9rem", fontWeight: 600, color: DARK_TEXT, marginBottom: 8 }}>
        {label} {required && <span style={{ color: ERROR }}>*</span>}
      </label>
      <div style={{ position: "relative" }}>
        <input
          type={show ? "text" : "password"}
          name={name}
          value={value}
          onChange={onChange}
          required={required}
          placeholder="••••••••"
          style={{
            width: "100%",
            padding: "12px 16px 12px 16px",
            paddingRight: "44px",
            fontSize: "0.95rem",
            border: `1.5px solid ${BORDER}`,
            borderRadius: "8px",
            outline: "none",
            transition: "all 0.2s",
            boxSizing: "border-box",
            color: DARK_TEXT,
            background: "#fff",
            fontFamily: "inherit",
          }}
          onFocus={(e) => (e.target.style.borderColor = PRIMARY)}
          onBlur={(e) => (e.target.style.borderColor = BORDER)}
        />
        <button
          type="button"
          onClick={onToggle}
          style={{
            position: "absolute",
            right: 12,
            top: "50%",
            transform: "translateY(-50%)",
            background: "none",
            border: "none",
            cursor: "pointer",
            color: LIGHT_TEXT,
            fontSize: "1.1rem",
            padding: "4px 8px",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            transition: "all 0.2s",
          }}
          onMouseOver={(e) => (e.target.style.color = PRIMARY)}
          onMouseOut={(e) => (e.target.style.color = LIGHT_TEXT)}
        >
          {show ? "👁️" : "👁️‍🗨️"}
        </button>
      </div>
    </div>
  );
}

function FormSelect({ label, name, value, onChange, options, required }) {
  return (
    <div>
      <label style={{ display: "block", fontSize: "0.9rem", fontWeight: 600, color: DARK_TEXT, marginBottom: 8 }}>
        {label} {required && <span style={{ color: ERROR }}>*</span>}
      </label>
      <select
        name={name}
        value={value}
        onChange={onChange}
        required={required}
        style={{
          width: "100%",
          padding: "12px 16px",
          fontSize: "0.95rem",
          border: `1.5px solid ${BORDER}`,
          borderRadius: "8px",
          outline: "none",
          transition: "all 0.2s",
          boxSizing: "border-box",
          color: DARK_TEXT,
          background: "#fff",
          fontFamily: "inherit",
          cursor: "pointer",
          appearance: "none",
          backgroundImage: `url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='12' height='12' viewBox='0 0 12 12'%3E%3Cpath fill='%236b7280' d='M6 9L1 4h10z'/%3E%3C/svg%3E")`,
          backgroundRepeat: "no-repeat",
          backgroundPosition: "right 12px center",
          paddingRight: "36px",
        }}
        onFocus={(e) => (e.target.style.borderColor = PRIMARY)}
        onBlur={(e) => (e.target.style.borderColor = BORDER)}
      >
        <option value="">-- Pilih --</option>
        {options.map((opt) => (
          <option key={opt.value} value={opt.value}>
            {opt.label}
          </option>
        ))}
      </select>
    </div>
  );
}

function BerkasUploadCard({ berkas, file, status, onFileChange, onUpload }) {
  return (
    <div
      style={{
        background: SURFACE,
        border: `1.5px dashed ${status === 'done' ? PRIMARY : BORDER}`,
        borderRadius: "12px",
        padding: "24px",
        marginBottom: "16px",
        transition: "all 0.2s",
        backgroundColor: status === 'done' ? `${PRIMARY}08` : SURFACE,
      }}
      onMouseOver={(e) => {
        if (status !== 'done') {
          e.currentTarget.style.borderColor = PRIMARY;
          e.currentTarget.style.backgroundColor = `${PRIMARY}02`;
        }
      }}
      onMouseOut={(e) => {
        if (status !== 'done') {
          e.currentTarget.style.borderColor = BORDER;
          e.currentTarget.style.backgroundColor = SURFACE;
        }
      }}
    >
      {/* Header */}
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: "16px" }}>
        <div>
          <h4 style={{ fontSize: "0.95rem", fontWeight: 700, color: DARK_TEXT, marginBottom: 4 }}>
            {berkas.label}
          </h4>
          <p style={{ fontSize: "0.8rem", color: LIGHT_TEXT }}>
            {berkas.keterangan}
          </p>
        </div>

        {/* Status Badge */}
        <div
          style={{
            display: "inline-flex",
            alignItems: "center",
            gap: 6,
            padding: "6px 12px",
            background: 
              status === 'done' ? `${SUCCESS}15` :
              status === 'uploading' ? `${WARNING}15` :
              status === 'error' ? `${ERROR}15` : "transparent",
            color:
              status === 'done' ? SUCCESS :
              status === 'uploading' ? WARNING :
              status === 'error' ? ERROR : LIGHT_TEXT,
            borderRadius: "6px",
            fontSize: "0.75rem",
            fontWeight: 700,
          }}
        >
          {status === 'done' && <>✓ Selesai</>}
          {status === 'uploading' && <>⏳ Uploading...</>}
          {status === 'error' && <>✗ Error</>}
          {status === 'idle' && file && <>📄 Siap Upload</>}
          {status === 'idle' && !file && <>⚪ Belum Upload</>}
        </div>
      </div>

      {/* File Input */}
      <div style={{ marginBottom: "16px" }}>
        <label
          style={{
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            gap: 12,
            padding: "16px",
            background: LIGHT_BG,
            border: `1.5px dashed ${BORDER}`,
            borderRadius: "8px",
            cursor: "pointer",
            transition: "all 0.2s",
            fontSize: "0.9rem",
            fontWeight: 600,
            color: DARK_TEXT,
          }}
          onMouseOver={(e) => {
            e.currentTarget.style.borderColor = PRIMARY;
            e.currentTarget.style.backgroundColor = `${PRIMARY}08`;
            e.currentTarget.style.color = PRIMARY;
          }}
          onMouseOut={(e) => {
            e.currentTarget.style.borderColor = BORDER;
            e.currentTarget.style.backgroundColor = LIGHT_BG;
            e.currentTarget.style.color = DARK_TEXT;
          }}
        >
          <span style={{ fontSize: "1.2rem" }}>📁</span>
          <span>
            {file ? `${file.name}` : "Klik atau drag file di sini"}
          </span>
          <input
            type="file"
            onChange={(e) => onFileChange(e.target.files?.[0] || null)}
            disabled={status === 'uploading' || status === 'done'}
            style={{ display: "none" }}
            accept=".jpg,.jpeg,.png,.pdf"
          />
        </label>
      </div>

      {/* File Info */}
      {file && (
        <div style={{ fontSize: "0.8rem", color: LIGHT_TEXT, marginBottom: "16px" }}>
          <p>📦 Ukuran: {(file.size / 1024 / 1024).toFixed(2)} MB</p>
          <p>📝 Tipe: {file.type || 'Unknown'}</p>
        </div>
      )}

      {/* Upload Button */}
      {file && status === 'idle' && (
        <button
          onClick={onUpload}
          style={{
            width: "100%",
            padding: "10px 16px",
            fontSize: "0.9rem",
            fontWeight: 700,
            color: "#fff",
            background: PRIMARY,
            border: "none",
            borderRadius: "8px",
            cursor: "pointer",
            transition: "all 0.2s",
          }}
          onMouseOver={(e) => (e.target.style.background = PRIMARY_DARK)}
          onMouseOut={(e) => (e.target.style.background = PRIMARY)}
        >
          Upload Berkas
        </button>
      )}

      {/* Uploading State */}
      {status === 'uploading' && (
        <div style={{ textAlign: "center", padding: "12px" }}>
          <div
            style={{
              width: "24px",
              height: "24px",
              border: "3px solid rgba(16, 185, 129, 0.2)",
              borderTopColor: PRIMARY,
              borderRadius: "50%",
              animation: "spin 0.8s linear infinite",
              margin: "0 auto",
            }}
          />
          <p style={{ fontSize: "0.9rem", color: WARNING, marginTop: "8px", fontWeight: 600 }}>
            Sedang mengunggah...
          </p>
        </div>
      )}

      {/* Done State */}
      {status === 'done' && (
        <div style={{ textAlign: "center", padding: "12px" }}>
          <p style={{ fontSize: "0.95rem", color: SUCCESS, fontWeight: 700 }}>
            ✓ Berkas berhasil diupload
          </p>
        </div>
      )}

      {/* Error State */}
      {status === 'error' && (
        <div style={{ textAlign: "center", padding: "12px" }}>
          <p style={{ fontSize: "0.9rem", color: ERROR, fontWeight: 600, marginBottom: "8px" }}>
            ✗ Upload gagal, coba lagi
          </p>
          <button
            onClick={onUpload}
            style={{
              padding: "8px 16px",
              fontSize: "0.85rem",
              fontWeight: 700,
              color: "#fff",
              background: ERROR,
              border: "none",
              borderRadius: "6px",
              cursor: "pointer",
              transition: "all 0.2s",
            }}
            onMouseOver={(e) => (e.target.style.opacity = "0.9")}
            onMouseOut={(e) => (e.target.style.opacity = "1")}
          >
            Coba Lagi
          </button>
        </div>
      )}
    </div>
  );
}

export default DaftarSpmbPage;
