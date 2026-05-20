// ============================================================
// src/pages/public/LoginPage.jsx — Halaman Login
// ============================================================
// Halaman login utama yang bisa diakses semua role.
// Setelah berhasil login, user diarahkan ke dashboard
// yang sesuai dengan role-nya melalui DashboardRouter.
// ============================================================

import { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { AuthAPI } from '../../services/api.js';
import './LoginPage.css';

function LoginPage() {
  const navigate = useNavigate();

  // ── State Formulir ──────────────────────────────────────
  const [email, setEmail]       = useState('');
  const [password, setPassword] = useState('');
  const [showPass, setShowPass] = useState(false);  // Toggle tampilkan password

  // ── State UI ────────────────────────────────────────────
  const [loading, setLoading] = useState(false);
  const [error, setError]     = useState('');       // Pesan error dari server

  // ── Handler Submit Form ─────────────────────────────────
  const handleLogin = async (e) => {
    e.preventDefault(); // Cegah reload halaman default browser

    // Reset pesan error sebelumnya
    setError('');

    // Validasi sederhana di sisi client sebelum hit API
    if (!email.trim() || !password.trim()) {
      setError('Email dan password wajib diisi.');
      return;
    }

    setLoading(true); // Tampilkan animasi loading di tombol

    try {
      // Panggil endpoint POST /api/auth/login
      const response = await AuthAPI.login(email, password);
      const { token, user } = response.data.data;

      // Simpan token dan data user ke localStorage
      // Token dipakai oleh api.js (interceptor) di setiap request berikutnya
      localStorage.setItem('pkbm_token', token);
      localStorage.setItem('pkbm_user', JSON.stringify(user));

      // Redirect ke /dashboard → DashboardRouter akan menentukan
      // ke sub-dashboard mana berdasarkan role user
      navigate('/dashboard');

    } catch (err) {
      // Ambil pesan error dari response backend, atau tampilkan pesan default
      const pesanError =
        err.response?.data?.message ||
        'Login gagal. Periksa koneksi internet Anda.';
      setError(pesanError);
    } finally {
      // Selalu matikan loading meski request sukses atau gagal
      setLoading(false);
    }
  };

  // ── Render ───────────────────────────────────────────────
  return (
    <div className="login-page">

      {/* Sisi kiri: branding & ilustrasi */}
      <div className="login-branding">
        <div className="login-branding-content">
          <div className="login-logo">
            <i className="bi bi-mortarboard-fill"></i>
          </div>
          <h1 className="login-title">PKBM Bina Mandiri</h1>
          <p className="login-subtitle">
            Ekosistem Digital Pendidikan Nonformal
          </p>
          <div className="login-features">
            <div className="login-feature-item">
              <i className="bi bi-check-circle-fill"></i>
              <span>Manajemen SPMB Online</span>
            </div>
            <div className="login-feature-item">
              <i className="bi bi-check-circle-fill"></i>
              <span>KBM & LMS Terintegrasi</span>
            </div>
            <div className="login-feature-item">
              <i className="bi bi-check-circle-fill"></i>
              <span>Absensi Dual-Mode</span>
            </div>
            <div className="login-feature-item">
              <i className="bi bi-check-circle-fill"></i>
              <span>Ujian & Keuangan Digital</span>
            </div>
          </div>
        </div>
      </div>

      {/* Sisi kanan: form login */}
      <div className="login-form-section">
        <div className="login-card">

          <div className="login-card-header">
            <h2>Selamat Datang!</h2>
            <p>Silakan masuk dengan akun Anda untuk melanjutkan.</p>
          </div>

          {/* Tampilkan pesan error jika ada */}
          {error && (
            <div className="alert alert-danger" role="alert">
              <i className="bi bi-exclamation-triangle-fill"></i>
              <span>{error}</span>
            </div>
          )}

          {/* Form Login */}
          <form onSubmit={handleLogin} noValidate>

            {/* Field Email */}
            <div className="form-group">
              <label htmlFor="email" className="form-label">
                Alamat Email <span className="required">*</span>
              </label>
              <div className="input-with-icon">
                <i className="bi bi-envelope-fill input-icon"></i>
                <input
                  id="email"
                  type="email"
                  className="form-input with-icon"
                  placeholder="contoh@email.com"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  disabled={loading}
                  autoComplete="email"
                  autoFocus
                />
              </div>
            </div>

            {/* Field Password */}
            <div className="form-group">
              <label htmlFor="password" className="form-label">
                Password <span className="required">*</span>
              </label>
              <div className="input-with-icon">
                <i className="bi bi-lock-fill input-icon"></i>
                <input
                  id="password"
                  type={showPass ? 'text' : 'password'}
                  className="form-input with-icon with-icon-right"
                  placeholder="Masukkan password Anda"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  disabled={loading}
                  autoComplete="current-password"
                />
                {/* Tombol toggle tampilkan/sembunyikan password */}
                <button
                  type="button"
                  className="input-icon-right"
                  onClick={() => setShowPass(!showPass)}
                  aria-label={showPass ? 'Sembunyikan password' : 'Tampilkan password'}
                >
                  <i className={`bi ${showPass ? 'bi-eye-slash' : 'bi-eye'}`}></i>
                </button>
              </div>
            </div>

            {/* Tombol Submit */}
            <button
              type="submit"
              className="btn btn-primary btn-block"
              disabled={loading}
            >
              {loading ? (
                <>
                  <span className="spinner-sm"></span>
                  <span>Memproses...</span>
                </>
              ) : (
                <>
                  <i className="bi bi-box-arrow-in-right"></i>
                  <span>Masuk</span>
                </>
              )}
            </button>

          </form>

          {/* Link ke SPMB */}
          <div className="login-card-footer">
            <p>
              Belum punya akun?{' '}
              <Link to="/daftar">Daftar sebagai siswa baru</Link>
            </p>
          </div>

        </div>
      </div>

    </div>
  );
}

export default LoginPage;
