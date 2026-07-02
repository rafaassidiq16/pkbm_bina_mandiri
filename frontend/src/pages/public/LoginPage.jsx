// ============================================================
// src/pages/public/LoginPage.jsx — Halaman Login
// ============================================================

import { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { AuthAPI } from '../../services/api';   // FIXED IMPORT
import gedungPkbm from '../../assets/gedung-pkbm.jpg';
import logoPkbm from '../../assets/logo-pkbm.png';
import './LoginPage.css';

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
      <div className="login-branding">
        <div className="login-branding-blur" style={{ backgroundImage: `url(${gedungPkbm})` }} />
        <div className="login-branding-container">
          <img src={logoPkbm} className="login-branding-img" alt="Logo PKBM" />
          <h2>"Pendidikan Setara, Masa Depan Gemilang"</h2>
        </div>
      </div>

      <div className="login-form-section">
        <div className="login-card">

          <h2>Selamat Datang!</h2>
          <p>Silakan masuk dengan akun Anda.</p>

          {error && (
            <div className="alert alert-danger">
              <i className="bi bi-exclamation-triangle-fill" />
              {error}
            </div>
          )}

          <form onSubmit={handleLogin}>

            <div className="form-group">
              <label>Email</label>
              <input
                type="email"
                className="form-input"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                disabled={loading}
                required
              />
            </div>

            <div className="form-group">
              <label>Password</label>
              <div className="input-with-icon">
                <input
                  type={showPass ? "text" : "password"}
                  className="form-input with-icon-right"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  disabled={loading}
                  required
                />
                <button
                  type="button"
                  className="input-icon-right"
                  onClick={() => setShowPass(!showPass)}
                >
                  <i className={`bi ${showPass ? 'bi-eye-slash' : 'bi-eye'}`} />
                </button>
              </div>
            </div>

            <button type="submit" className="btn btn-primary" disabled={loading}>
              {loading ? "Memproses..." : "Masuk"}
            </button>

          </form>

          <p className="login-card-footer">
            Belum punya akun?{" "}
            <Link to="/daftar">Daftar sebagai siswa baru</Link>
          </p>

        </div>
      </div>
    </div>
  );
}

export default LoginPage;
