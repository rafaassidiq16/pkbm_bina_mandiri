// ============================================================
// src/pages/siswa/TagihanSiswa.jsx — Tagihan & Status Bayar WB
// ============================================================
// WB melihat tagihan SPP/modul miliknya dan riwayat pembayaran.
//
// API:
//   GET /api/tagihan  → daftar tagihan (backend filter by token WB)
// ============================================================

import { useState, useEffect } from 'react';
import Sidebar from '../../components/Sidebar.jsx';
import { TagihanAPI } from '../../services/api.js';

function TagihanSiswa() {
  const user = JSON.parse(localStorage.getItem('pkbm_user') || '{}');

  const [tagihan, setTagihan] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error,   setError]   = useState('');
  // Filter tab: 'semua' | 'belum_lunas' | 'lunas'
  const [filter, setFilter] = useState('semua');

  useEffect(() => {
    const fetchTagihan = async () => {
      try {
        const res = await TagihanAPI.getAll();
        setTagihan(res.data.data || []);
      } catch {
        setError('Gagal memuat data tagihan.');
      } finally {
        setLoading(false);
      }
    };
    fetchTagihan();
  }, []);

  // Hitung ringkasan keuangan
  const totalBelumLunas = tagihan
    .filter(t => t.status !== 'lunas')
    .reduce((sum, t) => sum + Number(t.jumlah || 0), 0);

  // Filter tagihan berdasarkan tab
  const tagihanTampil = tagihan.filter(t => {
    if (filter === 'belum_lunas') return t.status !== 'lunas';
    if (filter === 'lunas')       return t.status === 'lunas';
    return true;
  });

  const formatRupiah = (n) => 'Rp ' + Number(n || 0).toLocaleString('id-ID');

  const warnaBadge = (status) => {
    if (status === 'lunas')   return 'badge-success';
    if (status === 'proses')  return 'badge-info';
    return 'badge-danger';
  };

  const labelStatus = (status) => {
    if (status === 'lunas')   return 'Lunas';
    if (status === 'proses')  return 'Sedang Diverifikasi';
    return 'Belum Dibayar';
  };

  return (
    <div className="app-layout">
      <Sidebar user={user} />
      <main className="app-main">
        <div className="app-content">

          <div style={{ marginBottom: '1.5rem' }}>
            <h1 style={{ fontFamily: 'var(--font-heading)', fontSize: 'var(--text-2xl)', fontWeight: 800 }}>
              Tagihan Saya
            </h1>
            <p style={{ color: 'var(--color-text-muted)', marginTop: 4 }}>
              Riwayat tagihan SPP dan modul pembelajaran Anda.
            </p>
          </div>

          {loading && <div className="loading-container"><div className="spinner"></div></div>}
          {!loading && error && <div className="alert alert-danger"><i className="bi bi-exclamation-triangle-fill"></i><span>{error}</span></div>}

          {!loading && !error && (
            <>
              {/* Banner tunggakan jika ada */}
              {totalBelumLunas > 0 && (
                <div className="alert alert-warning" style={{ marginBottom: '1.5rem' }}>
                  <i className="bi bi-exclamation-triangle-fill"></i>
                  <div>
                    <strong>Anda memiliki tagihan yang belum dibayar</strong>
                    <p style={{ margin: '4px 0 0', fontSize: 'var(--text-sm)' }}>
                      Total tunggakan: <strong>{formatRupiah(totalBelumLunas)}</strong>.
                      Segera lakukan pembayaran ke Admin TU untuk menghindari gangguan akses belajar.
                    </p>
                  </div>
                </div>
              )}

              {/* Tab filter */}
              <div style={{ display: 'flex', gap: 4, marginBottom: '1.5rem', background: 'var(--color-bg)', padding: 4, borderRadius: 'var(--radius-md)', width: 'fit-content', border: '1px solid var(--color-border)' }}>
                {[
                  { key: 'semua',       label: `Semua (${tagihan.length})` },
                  { key: 'belum_lunas', label: `Belum Lunas (${tagihan.filter(t => t.status !== 'lunas').length})` },
                  { key: 'lunas',       label: `Lunas (${tagihan.filter(t => t.status === 'lunas').length})` },
                ].map(t => (
                  <button
                    key={t.key}
                    onClick={() => setFilter(t.key)}
                    style={{
                      padding: '0.5rem 1rem', borderRadius: 'var(--radius-sm)', border: 'none',
                      background: filter === t.key ? 'var(--color-primary)' : 'transparent',
                      color: filter === t.key ? 'white' : 'var(--color-text-muted)',
                      fontWeight: 700, fontSize: 'var(--text-xs)', cursor: 'pointer', transition: 'all 0.15s',
                      whiteSpace: 'nowrap',
                    }}
                  >
                    {t.label}
                  </button>
                ))}
              </div>

              {/* Daftar tagihan */}
              {tagihanTampil.length === 0 ? (
                <div className="card"><div className="empty-state">
                  <i className="bi bi-receipt"></i>
                  <h3>Tidak Ada Tagihan</h3>
                  <p>Tidak ada tagihan untuk filter yang dipilih.</p>
                </div></div>
              ) : (
                <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
                  {tagihanTampil.map(t => (
                    <div key={t.id} className="card" style={{ padding: '1.25rem' }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '1rem', flexWrap: 'wrap' }}>
                        {/* Ikon status */}
                        <div style={{
                          width: 44, height: 44, borderRadius: 'var(--radius-md)', flexShrink: 0,
                          background: t.status === 'lunas' ? '#D1FAE5' : '#FEE2E2',
                          color: t.status === 'lunas' ? 'var(--color-success)' : 'var(--color-danger)',
                          display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '1.2rem',
                        }}>
                          <i className={`bi ${t.status === 'lunas' ? 'bi-check-circle-fill' : 'bi-receipt'}`}></i>
                        </div>

                        {/* Info tagihan */}
                        <div style={{ flex: 1, minWidth: 0 }}>
                          <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 4, flexWrap: 'wrap' }}>
                            <span style={{ fontWeight: 700, fontSize: 'var(--text-sm)' }}>
                              {t.jenis === 'spp' ? 'SPP' : t.jenis === 'modul' ? 'Biaya Modul' : t.jenis}
                              {t.bulan && ` — ${namaBulan(t.bulan)} ${t.tahun}`}
                            </span>
                            <span className={`badge ${warnaBadge(t.status)}`}>{labelStatus(t.status)}</span>
                          </div>
                          <p style={{ fontSize: 'var(--text-xs)', color: 'var(--color-text-muted)' }}>
                            Diterbitkan: {t.tanggal_terbit ? new Date(t.tanggal_terbit).toLocaleDateString('id-ID', { day:'numeric', month:'long', year:'numeric' }) : '—'}
                            {t.tanggal_jatuh_tempo && ` • Jatuh tempo: ${new Date(t.tanggal_jatuh_tempo).toLocaleDateString('id-ID', { day:'numeric', month:'long', year:'numeric' })}`}
                          </p>
                        </div>

                        {/* Jumlah */}
                        <div style={{ textAlign: 'right', flexShrink: 0 }}>
                          <div style={{
                            fontFamily: 'var(--font-heading)', fontWeight: 800, fontSize: 'var(--text-lg)',
                            color: t.status === 'lunas' ? 'var(--color-success)' : 'var(--color-danger)',
                          }}>
                            {formatRupiah(t.jumlah)}
                          </div>
                        </div>
                      </div>

                      {/* Catatan pembayaran */}
                      {t.status !== 'lunas' && (
                        <div style={{
                          marginTop: '0.75rem', paddingTop: '0.75rem',
                          borderTop: '1px solid var(--color-border)',
                          fontSize: 'var(--text-xs)', color: 'var(--color-text-muted)',
                          display: 'flex', alignItems: 'center', gap: 6,
                        }}>
                          <i className="bi bi-info-circle"></i>
                          Lakukan pembayaran ke Admin TU PKBM Bina Mandiri dan simpan bukti transfer Anda.
                        </div>
                      )}
                    </div>
                  ))}
                </div>
              )}
            </>
          )}
        </div>
      </main>
    </div>
  );
}

// Helper: nomor bulan → nama bulan
function namaBulan(nomor) {
  const list = ['', 'Januari','Februari','Maret','April','Mei','Juni',
                 'Juli','Agustus','September','Oktober','November','Desember'];
  return list[nomor] || nomor;
}

export default TagihanSiswa;
