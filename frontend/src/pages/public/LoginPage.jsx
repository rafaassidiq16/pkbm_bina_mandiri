// ============================================================
// src/pages/public/LoginPage.jsx — Halaman Login
// Palet: Sky Blue #5CB8FF | Soft Cream #FFF8EE | Dark Navy #243B53
// ============================================================

import { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { AuthAPI } from '../../services/api';
import gedungPkbm from '../../assets/gedung-pkbm.jpg';
import logoPkbm from '../../assets/logo-pkbm.png';
import './LoginPage.css';

// ═ COLOR PALETTE ═
const PRIMARY       = "#5CB8FF";    // Sky Blue
const PRIMARY_DARK  = "#1a8fd1";    // Sky Blue Darker
const PRIMARY_LIGHT = "#EBF6FF";    // Sky Blue Light
const NAVY          = "#243B53";    // Dark Navy
const CREAM         = "#FFF8EE";    // Soft Cream
const LIGHT_TEXT    = "#6b7280";    // Gray
const SURFACE       = "#ffffff";    // White
const BORDER        = "#d4eeff";    // Light Blue Border
const ERROR         = "#ef4444";    // Red

function LoginPage() {
  const navigate = useNavigate();

  // State input
  const [email, setEmail]       = useState('');
  const [password, setPassword] = useState('');
  const [showPass, setShowPass] = useState(false);

  // State UI
  const [loading, setLoading] = useState(false);
  const [error, setError]     = useState('');

  const handleLogin = async (e) => {
    e.preventDefault();
    setError("");

    if (!email.trim() || !password.trim()) {
      setError("Email dan password wajib diisi.");
      return;
    }

    setLoading(true);

    try {
      const response = await AuthAPI.login(email, password);

      if (!response.data.success) {
        setError(response.data.message || "Email atau password salah.");
        return;
      }

      const { token, user } = response.data.data;

      // Simpan token dan user
      localStorage.setItem("pkbm_token", token);
      localStorage.setItem("pkbm_user", JSON.stringify(user));

      navigate("/dashboard");

    } catch (err) {
      const msg =
        err.response?.data?.message ||
        "Login gagal. Periksa koneksi internet Anda.";
      setError(msg);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="login-page">
      
      {/* ═ LEFT SIDE - BRANDING ═ */}
      <div className="login-branding" style={{ backgroundImage: `url(${gedungPkbm})` }}>
        <div className="login-branding-blur" style={{ backgroundImage: `url(${gedungPkbm})` }} />
        <div className="login-branding-container">
          <img 
            src={logoPkbm} 
            alt="Logo PKBM" 
            className="login-branding-img"
            style={{ 
              width: 100, 
              height: 100, 
              borderRadius: "50%",
              border: "3px solid rgba(255,255,255,0.3)",
              objectFit: "cover"
            }} 
          />
          <div className="login-branding-info">
            <h2 className="login-branding-tagline">PKBM Bina Mandiri</h2>
            <p className="login-branding-subtext">
              "Pendidikan Setara, Masa Depan Gemilang"
            </p>
          </div>
        </div>
      </div>

      {/* ═ RIGHT SIDE - LOGIN FORM ═ */}
      <div className="login-form-section">
        <div className="login-card">

          {/* ═ HEADER ═ */}
          <div style={{ marginBottom: 32 }}>
            <h2 style={{ fontSize: "1.5rem", fontWeight: 800, color: NAVY, marginBottom: 8 }}>
              Selamat Datang!
            </h2>
            <p style={{ color: LIGHT_TEXT, fontSize: "0.95rem" }}>
              Silakan masuk dengan akun Anda.
            </p>
          </div>

          {/* ═ ERROR ALERT ═ */}
          {error && (
            <div className="alert alert-danger">
              <span style={{ fontSize: "1.2rem" }}>⚠️</span>
              <span>{error}</span>
            </div>
          )}

          {/* ═ FORM ═ */}
          <form onSubmit={handleLogin} style={{ marginBottom: 24 }}>

            {/* Email Input */}
            <div className="form-group">
              <label style={{ color: NAVY }}>
                Email Address
              </label>
              <input
                type="email"
                className="form-input"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                disabled={loading}
                required
                placeholder="nama@example.com"
              />
            </div>

            {/* Password Input */}
            <div className="form-group" style={{ marginBottom: 28 }}>
              <label style={{ color: NAVY }}>
                Password
              </label>
              <div style={{ position: "relative" }}>
                <input
                  type={showPass ? "text" : "password"}
                  className="form-input form-input.with-icon-right"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  disabled={loading}
                  required
                  placeholder="••••••••"
                />
                <button
                  type="button"
                  onClick={() => setShowPass(!showPass)}
                  disabled={loading}
                  className="input-icon-right"
                >
                  {showPass ? "👁️" : "👁️‍🗨️"}
                </button>
              </div>
            </div>

            {/* Submit Button */}
            <button
              type="submit"
              disabled={loading}
              className="btn btn-primary"
            >
              {loading ? (
                <>
                  <div className="spinner-sm" />
                  Memproses...
                </>
              ) : (
                "Masuk"
              )}
            </button>

          </form>

          {/* ═ FOOTER LINK ═ */}
          <div className="login-card-footer">
            Belum punya akun?{" "}
            <Link to="/daftar">
              Daftar sebagai siswa baru
            </Link>
          </div>

        </div>
      </div>

    </div>
  );
}

export default LoginPage;
