// ============================================================
// src/pages/public/LoginPage.jsx — Halaman Login
// ============================================================

import { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { AuthAPI } from '../../services/api';
import gedungPkbm from '../../assets/gedung-pkbm.jpg';
import logoPkbm from '../../assets/logo-pkbm.png';

// ═ COLOR PALETTE ═
const PRIMARY = "#10b981";      // Hijau
const SECONDARY = "#6b7280";    // Abu-abu
const DARK_TEXT = "#1f2937";
const LIGHT_TEXT = "#6b7280";
const LIGHT_BG = "#f9fafb";
const ERROR = "#ef4444";
const SUCCESS = "#10b981";
const BORDER = "#e5e7eb";

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
    <div style={{ display: "flex", minHeight: "100vh", background: LIGHT_BG }}>
      
      {/* ═ LEFT SIDE - BRANDING ═ */}
      <div style={{
        flex: 1,
        background: `linear-gradient(135deg, rgba(16,185,129,0.95) 0%, rgba(5,150,105,0.95) 100%), url(${gedungPkbm})`,
        backgroundSize: "cover",
        backgroundPosition: "center",
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        padding: "40px",
        color: "#fff",
        position: "relative",
        minHeight: "100vh",
      }}>
        <div style={{ textAlign: "center", zIndex: 2 }}>
          <img 
            src={logoPkbm} 
            alt="Logo PKBM" 
            style={{ 
              width: 80, 
              height: 80, 
              borderRadius: "50%",
              marginBottom: 24,
              border: "3px solid rgba(255,255,255,0.3)",
              objectFit: "cover"
            }} 
          />
          <h2 style={{ fontSize: "1.8rem", fontWeight: 800, marginBottom: 16, lineHeight: 1.3 }}>
            PKBM Bina Mandiri
          </h2>
          <p style={{ fontSize: "1.1rem", fontWeight: 500, opacity: 0.9, maxWidth: 300, lineHeight: 1.6 }}>
            "Pendidikan Setara, Masa Depan Gemilang"
          </p>
        </div>
      </div>

      {/* ═ RIGHT SIDE - LOGIN FORM ═ */}
      <div style={{
        flex: 1,
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        padding: "40px clamp(20px, 5vw, 60px)",
      }}>
        <div style={{
          width: "100%",
          maxWidth: 420,
          background: "#fff",
          borderRadius: 16,
          padding: "48px 40px",
          boxShadow: "0 4px 6px rgba(0,0,0,0.07)",
          border: `1px solid ${BORDER}`,
        }}>

          {/* ═ HEADER ═ */}
          <div style={{ marginBottom: 32 }}>
            <h2 style={{ fontSize: "1.5rem", fontWeight: 800, color: DARK_TEXT, marginBottom: 8 }}>
              Selamat Datang!
            </h2>
            <p style={{ color: LIGHT_TEXT, fontSize: "0.95rem" }}>
              Silakan masuk dengan akun Anda.
            </p>
          </div>

          {/* ═ ERROR ALERT ═ */}
          {error && (
            <div style={{
              background: "rgba(239,68,68,0.1)",
              border: `1px solid ${ERROR}`,
              borderRadius: 8,
              padding: "12px 16px",
              marginBottom: 24,
              display: "flex",
              alignItems: "flex-start",
              gap: 12,
              color: ERROR,
              fontSize: "0.9rem",
            }}>
              <span style={{ fontSize: "1.2rem", marginTop: 2 }}>⚠️</span>
              <span>{error}</span>
            </div>
          )}

          {/* ═ FORM ═ */}
          <form onSubmit={handleLogin} style={{ marginBottom: 24 }}>

            {/* Email Input */}
            <div style={{ marginBottom: 20 }}>
              <label style={{
                display: "block",
                fontSize: "0.9rem",
                fontWeight: 600,
                color: DARK_TEXT,
                marginBottom: 8,
              }}>
                Email Address
              </label>
              <input
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                disabled={loading}
                required
                placeholder="nama@example.com"
                style={{
                  width: "100%",
                  padding: "12px 16px",
                  fontSize: "0.95rem",
                  border: `1.5px solid ${BORDER}`,
                  borderRadius: 8,
                  outline: "none",
                  transition: "all 0.2s",
                  boxSizing: "border-box",
                  color: DARK_TEXT,
                  background: "#fff",
                }}
                onFocus={(e) => e.target.style.borderColor = PRIMARY}
                onBlur={(e) => e.target.style.borderColor = BORDER}
              />
            </div>

            {/* Password Input */}
            <div style={{ marginBottom: 28 }}>
              <label style={{
                display: "block",
                fontSize: "0.9rem",
                fontWeight: 600,
                color: DARK_TEXT,
                marginBottom: 8,
              }}>
                Password
              </label>
              <div style={{ position: "relative" }}>
                <input
                  type={showPass ? "text" : "password"}
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  disabled={loading}
                  required
                  placeholder="••••••••"
                  style={{
                    width: "100%",
                    padding: "12px 16px 12px 16px",
                    paddingRight: "44px",
                    fontSize: "0.95rem",
                    border: `1.5px solid ${BORDER}`,
                    borderRadius: 8,
                    outline: "none",
                    transition: "all 0.2s",
                    boxSizing: "border-box",
                    color: DARK_TEXT,
                    background: "#fff",
                  }}
                  onFocus={(e) => e.target.style.borderColor = PRIMARY}
                  onBlur={(e) => e.target.style.borderColor = BORDER}
                />
                <button
                  type="button"
                  onClick={() => setShowPass(!showPass)}
                  disabled={loading}
                  style={{
                    position: "absolute",
                    right: 12,
                    top: "50%",
                    transform: "translateY(-50%)",
                    background: "none",
                    border: "none",
                    cursor: loading ? "not-allowed" : "pointer",
                    color: SECONDARY,
                    fontSize: "1.1rem",
                    padding: "4px 8px",
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                    opacity: loading ? 0.5 : 1,
                  }}
                >
                  {showPass ? "👁️" : "👁️‍🗨️"}
                </button>
              </div>
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
                borderRadius: 8,
                cursor: loading ? "not-allowed" : "pointer",
                transition: "all 0.2s",
                letterSpacing: 0.5,
              }}
              onMouseOver={(e) => !loading && (e.target.style.background = "#059669")}
              onMouseOut={(e) => !loading && (e.target.style.background = PRIMARY)}
            >
              {loading ? "⏳ Memproses..." : "Masuk"}
            </button>

          </form>

          {/* ═ FOOTER LINK ═ */}
          <div style={{
            textAlign: "center",
            fontSize: "0.9rem",
            color: LIGHT_TEXT,
          }}>
            Belum punya akun?{" "}
            <Link 
              to="/daftar"
              style={{
                color: PRIMARY,
                fontWeight: 700,
                textDecoration: "none",
                transition: "color 0.2s",
              }}
              onMouseOver={(e) => e.target.style.color = "#059669"}
              onMouseOut={(e) => e.target.style.color = PRIMARY}
            >
              Daftar sebagai siswa baru
            </Link>
          </div>

        </div>
      </div>

      {/* ═ RESPONSIVE MOBILE ═ */}
      <style>{`
        @media (max-width: 768px) {
          div[style*="display: flex"][style*="minHeight"] {
            flex-direction: column !important;
          }
          div[style*="flex: 1"] {
            flex: 1 !important;
            min-height: 200px !important;
          }
        }
      `}</style>

    </div>
  );
}

export default LoginPage;
