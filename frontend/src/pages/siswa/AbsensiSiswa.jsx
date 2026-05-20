// ============================================================
// src/pages/siswa/AbsensiSiswa.jsx — Check-In Absensi Mandiri
// ============================================================
// FITUR KRITIS: WB melakukan check-in mandiri jika Tutor
// mengaktifkan sesi absensi mandiri (ada token + timer aktif).
//
// Alur:
//  1. Halaman polling GET /api/absensi/sesi-aktif tiap 5 detik
//     (untuk WB: endpoint ini digunakan untuk cek sesi di rombel WB)
//  2. Jika ada sesi mandiri aktif → tampilkan tombol Check-In + timer
//  3. WB klik Check-In → POST /api/absensi/sesi/:sesiId/checkin
//  4. Tampilkan rekap kehadiran pribadi dari GET /api/absensi/rekap/saya
// ============================================================

import { useState, useEffect, useCallback } from 'react';
import Sidebar from '../../components/Sidebar.jsx';
import { AbsensiAPI } from '../../services/api.js';

// Interval polling untuk cek sesi aktif (millisecond)
const POLLING_INTERVAL = 5000;

function AbsensiSiswa() {
  const user = JSON.parse(localStorage.getItem('pkbm_user') || '{}');

  // ── State: Sesi Absensi Aktif ────────────────────────────
  const [sesiAktif,  setSesiAktif]  = useState(null);
  // Status check-in WB ini: null | 'checkin' | 'sudah'
  const [statusCi,   setStatusCi]   = useState(null);
  const [loadingCi,  setLoadingCi]  = useState(false);
  const [feedbackCi, setFeedbackCi] = useState({ type: '', msg: '' });

  // ── State: Timer countdown (detik) ──────────────────────
  const [sisaWaktu,  setSisaWaktu]  = useState(0);

  // ── State: Rekap Kehadiran Pribadi ───────────────────────
  const [rekap,      setRekap]      = useState(null);
  const [loadingRekap, setLoadingRekap] = useState(true);

  // ── Fetch rekap kehadiran saat mount ────────────────────
  useEffect(() => {
    const fetchRekap = async () => {
      try {
        const res = await AbsensiAPI.getRekapSaya();
        setRekap(res.data.data);
      } catch { setRekap(null); }
      finally  { setLoadingRekap(false); }
    };
    fetchRekap();
  }, []);

  // ── Polling: cek sesi aktif setiap POLLING_INTERVAL ms ──
  const cekSesiAktif = useCallback(async () => {
    try {
      const res = await AbsensiAPI.getSesiAktif();
      const sesi = res.data.data;
      setSesiAktif(sesi);

      if (sesi) {
        // Hitung sisa waktu berdasarkan waktu_mulai + durasi_timer dari backend
        const mulai   = new Date(sesi.waktu_mulai).getTime();
        const durasi  = (sesi.durasi_timer || 0) * 1000; // detik → ms
        const selesai = mulai + durasi;
        const sisa    = Math.max(0, Math.floor((selesai - Date.now()) / 1000));
        setSisaWaktu(sisa);

        // Cek apakah WB ini sudah check-in
        const sudahCheckin = Number(sesi.sudah_checkin) === 1;
        setStatusCi(sudahCheckin ? 'sudah' : null);
        if (!sudahCheckin) {
          setFeedbackCi({ type: '', msg: '' });
        }
      } else {
        // Tidak ada sesi aktif — reset
        setSisaWaktu(0);
        setStatusCi(null);
        setFeedbackCi({ type: '', msg: '' });
      }
    } catch {
      // Tidak ada sesi aktif (404 atau error) — normal
      setSesiAktif(null);
      setSisaWaktu(0);
      setStatusCi(null);
      setFeedbackCi({ type: '', msg: '' });
    }
  }, []);

  useEffect(() => {
    cekSesiAktif(); // Langsung cek sekali saat mount
    const interval = setInterval(cekSesiAktif, POLLING_INTERVAL);
    return () => clearInterval(interval); // Bersihkan saat unmount
  }, [cekSesiAktif]);

  // ── Timer countdown lokal (detik mundur setiap 1 detik) ─
  useEffect(() => {
    if (!sesiAktif || sisaWaktu <= 0) return;
    const tick = setInterval(() => {
      setSisaWaktu(prev => {
        if (prev <= 1) { clearInterval(tick); return 0; }
        return prev - 1;
      });
    }, 1000);
    return () => clearInterval(tick);
  }, [sesiAktif, sisaWaktu > 0]); // Hanya jalan jika sesi aktif dan ada sisa waktu

  // ── Handler: WB Check-In ─────────────────────────────────
  const handleCheckIn = async () => {
    if (!sesiAktif || sisaWaktu <= 0 || statusCi === 'sudah') return;
    setLoadingCi(true);
    setFeedbackCi({ type: '', msg: '' });
    try {
      await AbsensiAPI.checkIn(sesiAktif.id);
      setStatusCi('sudah');
      setFeedbackCi({ type: 'success', msg: 'Kehadiran berhasil disubmit.' });
      // Refresh rekap kehadiran setelah check-in
      const res = await AbsensiAPI.getRekapSaya();
      setRekap(res.data.data);
      await cekSesiAktif();
    } catch (err) {
      setFeedbackCi({
        type: 'error',
        msg: err.response?.data?.message || 'Gagal submit kehadiran. Coba lagi.',
      });
    } finally {
      setLoadingCi(false);
    }
  };

  // ── Helper: format detik → MM:SS ─────────────────────────
  const formatTimer = (detik) => {
    const m = Math.floor(detik / 60).toString().padStart(2, '0');
    const s = (detik % 60).toString().padStart(2, '0');
    return `${m}:${s}`;
  };

  // ── Helper: warna timer berdasarkan sisa waktu ───────────
  const warnaTimer = sisaWaktu > 60 ? 'var(--color-success)'
                   : sisaWaktu > 20 ? 'var(--color-warning)'
                   : 'var(--color-danger)';

  return (
    <div className="app-layout">
      <Sidebar user={user} />
      <main className="app-main">
        <div className="app-content">

          <div style={{ marginBottom: '2rem' }}>
            <h1 style={{ fontFamily: 'var(--font-heading)', fontSize: 'var(--text-2xl)', fontWeight: 800 }}>
              Absensi Saya
            </h1>
            <p style={{ color: 'var(--color-text-muted)', marginTop: 4 }}>
              Check-in kehadiran jika Tutor mengaktifkan sesi absensi mandiri.
            </p>
          </div>

          {/* ── Widget Sesi Absensi (bagian utama) ── */}
          <div className="card" style={{ marginBottom: '2rem', textAlign: 'center', padding: '2.5rem' }}>

            {/* Kondisi: Tidak ada sesi aktif */}
            {!sesiAktif && (
              <>
                <div style={{
                  width: 72, height: 72, borderRadius: '50%',
                  background: 'var(--color-bg)', border: '2px solid var(--color-border)',
                  display: 'flex', alignItems: 'center', justifyContent: 'center',
                  margin: '0 auto 1.25rem', fontSize: '2rem', color: 'var(--color-text-muted)',
                }}>
                  <i className="bi bi-calendar-x"></i>
                </div>
                <h3 style={{ fontFamily: 'var(--font-heading)', marginBottom: 8 }}>
                  Belum Ada Sesi Absensi
                </h3>
                <p style={{ color: 'var(--color-text-muted)', fontSize: 'var(--text-sm)', maxWidth: 360, margin: '0 auto' }}>
                  Tunggu Tutor mengaktifkan sesi absensi. Halaman ini otomatis memperbarui setiap {POLLING_INTERVAL / 1000} detik.
                </p>
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 6, marginTop: '1rem', color: 'var(--color-text-muted)', fontSize: 'var(--text-xs)' }}>
                  <div className="spinner" style={{ width: 14, height: 14, borderWidth: 2 }}></div>
                  Memantau sesi aktif...
                </div>
              </>
            )}

            {/* Kondisi: Ada sesi aktif */}
            {sesiAktif && (
              <>
                {/* Nama rombel */}
                <p style={{ fontSize: 'var(--text-sm)', color: 'var(--color-text-muted)', marginBottom: 8 }}>
                  Sesi absensi untuk
                </p>
                <h2 style={{ fontFamily: 'var(--font-heading)', fontWeight: 800, fontSize: 'var(--text-xl)', marginBottom: '1.5rem' }}>
                  {sesiAktif.nama_rombel || 'Kelas Anda'}
                </h2>

                {/* Timer countdown — tampilan besar */}
                <div style={{
                  width: 140, height: 140, borderRadius: '50%',
                  border: `6px solid ${sisaWaktu > 0 ? warnaTimer : 'var(--color-border)'}`,
                  display: 'flex', flexDirection: 'column',
                  alignItems: 'center', justifyContent: 'center',
                  margin: '0 auto 1.75rem',
                  boxShadow: sisaWaktu > 0 ? `0 0 24px ${warnaTimer}40` : 'none',
                  transition: 'all 0.5s',
                }}>
                  <span style={{ fontFamily: 'var(--font-heading)', fontSize: '2.2rem', fontWeight: 900, color: warnaTimer, lineHeight: 1 }}>
                    {formatTimer(sisaWaktu)}
                  </span>
                  <span style={{ fontSize: 'var(--text-xs)', color: 'var(--color-text-muted)', marginTop: 4 }}>sisa waktu</span>
                </div>

                {/* Tombol Check-In */}
                {feedbackCi.msg && (
                  <div
                    className={`alert ${feedbackCi.type === 'success' ? 'alert-success' : 'alert-danger'}`}
                    style={{ display: 'inline-flex', margin: '0 auto 1rem' }}
                  >
                    <i className={`bi ${feedbackCi.type === 'success' ? 'bi-check-circle-fill' : 'bi-exclamation-triangle-fill'}`}></i>
                    <span>{feedbackCi.msg}</span>
                  </div>
                )}
                {statusCi === 'sudah' ? (
                  <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 8 }}>
                    <div style={{
                      width: 64, height: 64, borderRadius: '50%', background: '#D1FAE5',
                      display: 'flex', alignItems: 'center', justifyContent: 'center',
                      fontSize: '2rem', color: 'var(--color-success)',
                    }}>
                      <i className="bi bi-check-circle-fill"></i>
                    </div>
                    <span style={{ fontWeight: 700, color: 'var(--color-success)' }}>
                      Anda sudah tercatat hadir!
                    </span>
                    <span style={{ fontSize: 'var(--text-xs)', color: 'var(--color-text-muted)' }}>
                      Check-in berhasil. Terima kasih!
                    </span>
                  </div>
                ) : sisaWaktu > 0 ? (
                  <button
                    className="btn btn-primary"
                    style={{ fontSize: 'var(--text-lg)', padding: '1rem 2.5rem', minHeight: 56 }}
                    onClick={handleCheckIn}
                    disabled={loadingCi}
                  >
                    {loadingCi ? (
                      <><span className="spinner-sm"></span> Mengirim kehadiran...</>
                    ) : (
                      <><i className="bi bi-send-check"></i> SUBMIT KEHADIRAN</>
                    )}
                  </button>
                ) : (
                  <div className="alert alert-danger" style={{ display: 'inline-flex', margin: '0 auto' }}>
                    <i className="bi bi-clock-history"></i>
                    <span>Waktu check-in sudah habis.</span>
                  </div>
                )}
              </>
            )}
          </div>

          {/* ── Rekap Kehadiran Pribadi ── */}
          <div className="card">
            <div className="card-header">
              <h3 className="card-title">
                <i className="bi bi-bar-chart-fill" style={{ color: 'var(--color-primary)' }}></i>
                {' '}Rekap Kehadiran Saya
              </h3>
            </div>

            {loadingRekap ? (
              <div className="loading-container" style={{ padding: '2rem' }}>
                <div className="spinner"></div>
              </div>
            ) : !rekap ? (
              <div className="empty-state" style={{ padding: '2rem' }}>
                <i className="bi bi-inbox"></i>
                <p>Belum ada data kehadiran.</p>
              </div>
            ) : (
              <div className="grid-cols-4">
                <RekapItem label="Total Pertemuan" value={rekap.total_pertemuan ?? '—'} color="var(--color-primary)" />
                <RekapItem label="Hadir"  value={rekap.hadir  ?? '—'} color="var(--color-success)" />
                <RekapItem label="Izin / Sakit" value={(rekap.izin ?? 0) + (rekap.sakit ?? 0)} color="var(--color-warning)" />
                <RekapItem label="Alpa"   value={rekap.alpa   ?? '—'} color="var(--color-danger)" />
              </div>
            )}

            {/* Bar persentase kehadiran */}
            {rekap?.persentase_hadir != null && (
              <div style={{ marginTop: '1.5rem', paddingTop: '1rem', borderTop: '1px solid var(--color-border)' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 'var(--text-sm)', marginBottom: 8 }}>
                  <span style={{ fontWeight: 700 }}>Tingkat Kehadiran</span>
                  <span style={{ fontWeight: 800, color: rekap.persentase_hadir >= 75 ? 'var(--color-success)' : 'var(--color-danger)' }}>
                    {rekap.persentase_hadir}%
                  </span>
                </div>
                <div style={{ height: 12, background: 'var(--color-border)', borderRadius: 999, overflow: 'hidden' }}>
                  <div style={{
                    height: '100%', borderRadius: 999,
                    width: `${rekap.persentase_hadir}%`,
                    background: rekap.persentase_hadir >= 75 ? 'var(--color-success)' : 'var(--color-danger)',
                    transition: 'width 0.5s ease',
                  }} />
                </div>
                {rekap.persentase_hadir < 75 && (
                  <p style={{ fontSize: 'var(--text-xs)', color: 'var(--color-danger)', marginTop: 6, fontWeight: 600 }}>
                    <i className="bi bi-exclamation-triangle-fill"></i>{' '}
                    Kehadiran di bawah 75%. Harap tingkatkan kehadiran Anda.
                  </p>
                )}
              </div>
            )}
          </div>

        </div>
      </main>
    </div>
  );
}

function RekapItem({ label, value, color }) {
  return (
    <div style={{
      textAlign: 'center', padding: '1rem',
      background: 'var(--color-bg)', borderRadius: 'var(--radius-md)',
      border: '1px solid var(--color-border)',
    }}>
      <div style={{ fontFamily: 'var(--font-heading)', fontSize: 'var(--text-3xl)', fontWeight: 800, color }}>
        {value}
      </div>
      <div style={{ fontSize: 'var(--text-xs)', color: 'var(--color-text-muted)', marginTop: 4, fontWeight: 600 }}>
        {label}
      </div>
    </div>
  );
}

export default AbsensiSiswa;
