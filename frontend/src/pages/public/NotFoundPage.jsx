// ============================================================
// src/pages/public/NotFoundPage.jsx — Halaman 404
// ============================================================
// Ditampilkan saat user mengakses URL yang tidak dikenali.
// ============================================================

import { Link, useNavigate } from 'react-router-dom';

function NotFoundPage() {
  const navigate  = useNavigate();
  // Cek apakah user sudah login, agar tombol "Kembali" arahkan ke tempat yang tepat
  const isLoggedIn = !!localStorage.getItem('pkbm_token');

  return (
    <div style={{
      minHeight: '100vh',
      display: 'flex',
      flexDirection: 'column',
      alignItems: 'center',
      justifyContent: 'center',
      background: 'var(--color-bg)',
      padding: '2rem',
      textAlign: 'center',
    }}>
      {/* Angka 404 besar */}
      <div style={{
        fontFamily: 'var(--font-heading)',
        fontSize: 'clamp(5rem, 20vw, 9rem)',
        fontWeight: 900,
        lineHeight: 1,
        color: 'var(--color-primary)',
        opacity: 0.15,
        marginBottom: '-1rem',
        userSelect: 'none',
      }}>
        404
      </div>

      {/* Ikon */}
      <div style={{
        width: 80, height: 80,
        background: 'var(--color-primary-light)',
        borderRadius: 'var(--radius-xl)',
        display: 'flex', alignItems: 'center', justifyContent: 'center',
        fontSize: '2.2rem',
        color: 'var(--color-primary)',
        marginBottom: '1.5rem',
      }}>
        <i className="bi bi-compass"></i>
      </div>

      <h1 style={{
        fontFamily: 'var(--font-heading)',
        fontSize: 'var(--text-2xl)',
        fontWeight: 800,
        marginBottom: '0.75rem',
        color: 'var(--color-text)',
      }}>
        Halaman Tidak Ditemukan
      </h1>

      <p style={{
        color: 'var(--color-text-muted)',
        maxWidth: 400,
        marginBottom: '2rem',
        lineHeight: 1.7,
        fontSize: 'var(--text-sm)',
      }}>
        Halaman yang Anda cari tidak ada atau sudah dipindahkan.
        Periksa kembali alamat URL, atau kembali ke halaman sebelumnya.
      </p>

      <div style={{ display: 'flex', gap: '1rem', flexWrap: 'wrap', justifyContent: 'center' }}>
        {/* Tombol kembali ke halaman sebelumnya */}
        <button
          onClick={() => navigate(-1)}
          className="btn btn-secondary"
        >
          <i className="bi bi-arrow-left"></i>
          Kembali
        </button>

        {/* Tombol ke dashboard atau login */}
        <Link
          to={isLoggedIn ? '/dashboard' : '/'}
          className="btn btn-primary"
        >
          <i className="bi bi-house-fill"></i>
          {isLoggedIn ? 'Ke Dashboard' : 'Ke Halaman Login'}
        </Link>
      </div>
    </div>
  );
}

export default NotFoundPage;
