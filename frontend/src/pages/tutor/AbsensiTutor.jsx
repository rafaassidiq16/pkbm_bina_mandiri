// ============================================================
// src/pages/tutor/AbsensiTutor.jsx — Kelola Absensi Dual-Mode
// ============================================================
// Tutor membuka sesi absensi, memilih mode (manual atau mandiri),
// dan memantau check-in Warga Belajar secara real-time.
//
// ALUR MODE MANUAL:
//   Tutor buka sesi → isi status setiap WB → submit
//
// ALUR MODE MANDIRI:
//   Tutor buka sesi + atur timer → WB check-in sendiri →
//   Tutor pantau daftar check-in real-time (polling 3 detik) →
//   Timer habis → sesi tutup otomatis
//
// API yang digunakan:
//   POST /api/absensi/sesi                        → buka sesi baru
//   PUT  /api/absensi/sesi/:id/tutup              → tutup sesi manual
//   GET  /api/absensi/sesi-aktif                  → cek sesi berjalan
//   GET  /api/absensi/sesi/:id/daftar-wb          → daftar WB + status (polling)
//   POST /api/absensi/sesi/:id/submit-manual      → submit absensi manual
//   GET  /api/absensi/rombel/:rombelId            → riwayat sesi
// ============================================================

import { useState, useEffect, useRef, useCallback } from 'react';
import Sidebar from '../../components/Sidebar.jsx';
import { AbsensiAPI, SiswaAPI } from '../../services/api.js';

// Interval polling status check-in WB (millisecond)
const POLLING_INTERVAL = 3000;

// Konstanta pilihan status kehadiran manual
const STATUS_OPTIONS = [
  { val: 'hadir', label: 'Hadir',  color: 'var(--color-success)', icon: 'bi-check-circle-fill' },
  { val: 'izin',  label: 'Izin',   color: '#F59E0B',              icon: 'bi-info-circle-fill'  },
  { val: 'sakit', label: 'Sakit',  color: 'var(--color-primary)', icon: 'bi-bandaid-fill'      },
  { val: 'alpa',  label: 'Alpa',   color: 'var(--color-danger)',  icon: 'bi-x-circle-fill'     },
];

function AbsensiTutor() {
  const user = JSON.parse(localStorage.getItem('pkbm_user') || '{}');
  const storageKey = `pkbm_tutor_absensi_rombel_${user?.id || 'default'}`;

  const normalizeSesiAktif = (raw) => {
    if (Array.isArray(raw)) return raw[0] || null;
    return raw && raw.id ? raw : null;
  };

  // ── State: Tab Utama ─────────────────────────────────────
  // 'buka'    → form buka sesi baru
  // 'aktif'   → sesi sedang berjalan (manual atau mandiri)
  // 'riwayat' → riwayat sesi yang sudah selesai
  const [tab, setTab] = useState('buka');
  const [rombelList, setRombelList] = useState([]);
  const [loadRombel, setLoadRombel] = useState(true);
  const [mapelList, setMapelList] = useState([]);
  const [loadMapel, setLoadMapel] = useState(false);

  // ── State: Form Buka Sesi ────────────────────────────────
  const [formSesi, setFormSesi] = useState({
    rombel_id:    '',    // ID rombel yang diabsensi
    mapel_id:     '',    // ID mapel (opsional)
    tanggal:      new Date().toISOString().split('T')[0], // Default hari ini
    mode:         'manual', // 'manual' atau 'mandiri'
    durasi_timer: '10',  // Menit (hanya untuk mode mandiri)
  });
  const [bukaLoading,  setBukaLoading]  = useState(false);
  const [bukaFeedback, setBukaFeedback] = useState({ type: '', msg: '' });

  // ── State: Sesi Aktif ────────────────────────────────────
  const [sesiAktif,   setSesiAktif]   = useState(null);  // Data sesi yang berjalan
  const [daftarWb,    setDaftarWb]    = useState([]);    // Daftar WB + status check-in
  const [loadSesi,    setLoadSesi]    = useState(true);  // Loading cek sesi saat mount

  // ── State: Timer Countdown (mode mandiri) ───────────────
  const [sisaWaktu, setSisaWaktu] = useState(0); // Detik

  // ── State: Absensi Manual ────────────────────────────────
  // Map: { [warga_belajar_id]: 'hadir'|'izin'|'sakit'|'alpa' }
  const [kehadiranMap,   setKehadiranMap]   = useState({});
  const [submitLoading,  setSubmitLoading]  = useState(false);
  const [submitFeedback, setSubmitFeedback] = useState({ type: '', msg: '' });

  // ── State: Riwayat Sesi ──────────────────────────────────
  const [riwayat,      setRiwayat]      = useState([]);
  const [loadRiwayat,  setLoadRiwayat]  = useState(false);
  const [inputRombel,  setInputRombel]  = useState(() => localStorage.getItem(storageKey) || '');  // Untuk filter riwayat
  const [detailRiwayat, setDetailRiwayat] = useState(null);
  const [loadDetailRiwayat, setLoadDetailRiwayat] = useState(false);

  // Ref untuk interval polling agar bisa dibersihkan
  const pollingRef = useRef(null);
  const timerRef   = useRef(null);

  // ────────────────────────────────────────────────────────
  // Cek sesi aktif saat pertama kali komponen dimuat
  // Jika ada sesi aktif, langsung pindah ke tab 'aktif'
  // ────────────────────────────────────────────────────────
  useEffect(() => {
    const cekSesiAwal = async () => {
      try {
        const res = await AbsensiAPI.getSesiAktif();
        const sesi = normalizeSesiAktif(res.data.data);
        if (sesi) {
          // Ada sesi aktif → langsung ke mode pemantauan
          setSesiAktif(sesi);
          setTab('aktif');
          mulaiPolling(sesi.id);
          if (sesi.mode === 'mandiri') hitungTimerDariSesi(sesi);
        } else {
          setSesiAktif(null);
        }
      } catch {
        // Tidak ada sesi aktif — tidak apa-apa
        setSesiAktif(null);
      } finally {
        setLoadSesi(false);
      }
    };
    cekSesiAwal();

    // Bersihkan interval saat komponen di-unmount
    return () => {
      clearInterval(pollingRef.current);
      clearInterval(timerRef.current);
    };
  }, []); // eslint-disable-line

  useEffect(() => {
    const fetchRombelOptions = async () => {
      try {
        setLoadRombel(true);
        const res = await SiswaAPI.getRombelOptions();
        const options = res.data.data || [];
        setRombelList(options);

        if (!options.length) {
          setFormSesi(prev => ({ ...prev, rombel_id: '' }));
          return;
        }

        const saved = localStorage.getItem(storageKey) || '';
        const hasSaved = saved && options.some(r => String(r.id) === String(saved));
        const fallback = String(options[0].id);
        const nextSelected = hasSaved ? String(saved) : fallback;

        setFormSesi(prev => ({ ...prev, rombel_id: nextSelected }));
        setInputRombel(nextSelected);
      } catch {
        setRombelList([]);
      } finally {
        setLoadRombel(false);
      }
    };

    fetchRombelOptions();
  }, [storageKey]);

  useEffect(() => {
    const fetchMapelOptions = async () => {
      if (!formSesi.rombel_id) {
        setMapelList([]);
        return;
      }

      const rombelAktif = rombelList.find(r => String(r.id) === String(formSesi.rombel_id));

      try {
        setLoadMapel(true);
        const res = await SiswaAPI.getMapelOptions({
          rombel_id: formSesi.rombel_id,
          jenjang: rombelAktif?.jenjang || undefined,
        });
        const options = res.data.data || [];
        setMapelList(options);

        if (!formSesi.mapel_id && options.length) {
          setFormSesi(prev => ({ ...prev, mapel_id: String(options[0].id) }));
        }
      } catch {
        setMapelList([]);
      } finally {
        setLoadMapel(false);
      }
    };

    fetchMapelOptions();
  }, [formSesi.rombel_id, rombelList]); // eslint-disable-line react-hooks/exhaustive-deps

  useEffect(() => {
    if (formSesi.rombel_id) {
      localStorage.setItem(storageKey, String(formSesi.rombel_id));
      setInputRombel(String(formSesi.rombel_id));
    } else {
      localStorage.removeItem(storageKey);
    }
  }, [formSesi.rombel_id, storageKey]);

  useEffect(() => {
    if (tab === 'riwayat' && inputRombel) {
      fetchRiwayat(inputRombel);
    }
  }, [tab, inputRombel]); // eslint-disable-line

  // ────────────────────────────────────────────────────────
  // Hitung sisa waktu timer berdasarkan data sesi dari backend
  // waktu_mulai (datetime) + durasi_timer (detik) = waktu selesai
  // ────────────────────────────────────────────────────────
  const hitungTimerDariSesi = (sesi) => {
    const mulai   = new Date(sesi.waktu_mulai).getTime();
    const selesai = mulai + (sesi.durasi_timer * 1000); // durasi_timer dalam detik
    const sisa    = Math.max(0, Math.floor((selesai - Date.now()) / 1000));
    setSisaWaktu(sisa);

    // Jalankan countdown lokal setiap 1 detik
    clearInterval(timerRef.current);
    timerRef.current = setInterval(() => {
      setSisaWaktu(prev => {
        if (prev <= 1) {
          clearInterval(timerRef.current);
          return 0;
        }
        return prev - 1;
      });
    }, 1000);
  };

  // ────────────────────────────────────────────────────────
  // Mulai polling daftar WB yang check-in setiap 3 detik
  // Polling aktif hanya selama ada sesi yang berjalan
  // ────────────────────────────────────────────────────────
  const mulaiPolling = useCallback((sesiId) => {
    // Fetch langsung sekali tanpa menunggu interval pertama
    const fetchDaftar = async () => {
      try {
        const res = await AbsensiAPI.getDaftarWbDiSesi(sesiId);
        const wb = res.data.data || [];
        setDaftarWb(wb);

        // Inisialisasi kehadiranMap: default semua WB = 'hadir'
        // (untuk mode manual, Tutor bisa mengubah individual)
        setKehadiranMap(prev => {
          const newMap = { ...prev };
          wb.forEach(w => {
            if (!newMap[w.warga_belajar_id]) {
              newMap[w.warga_belajar_id] = 'hadir';
            }
          });
          return newMap;
        });
      } catch { /* Biarkan data lama tampil */ }
    };

    fetchDaftar();
    clearInterval(pollingRef.current);
    pollingRef.current = setInterval(fetchDaftar, POLLING_INTERVAL);
  }, []);

  // ────────────────────────────────────────────────────────
  // Handler: Buka Sesi Absensi Baru
  // ────────────────────────────────────────────────────────
  const handleBukaSesi = async () => {
    // Validasi input wajib
    if (!formSesi.rombel_id || !formSesi.tanggal) {
      setBukaFeedback({ type: 'error', msg: 'Rombel dan tanggal wajib diisi.' });
      return;
    }
    if (formSesi.mode === 'mandiri' && !formSesi.durasi_timer) {
      setBukaFeedback({ type: 'error', msg: 'Durasi timer wajib diisi untuk mode mandiri.' });
      return;
    }

    setBukaLoading(true);
    setBukaFeedback({ type: '', msg: '' });

    try {
      // Kirim request ke backend untuk membuka sesi
      // durasi_timer dikirim dalam detik (frontend input dalam menit)
      const payload = {
        rombel_id:    Number(formSesi.rombel_id),
        tanggal:      formSesi.tanggal,
        mode:         formSesi.mode,
        mapel_id:     formSesi.mapel_id ? Number(formSesi.mapel_id) : undefined,
        // Konversi menit → detik sebelum dikirim ke backend
        durasi_timer: formSesi.mode === 'mandiri'
          ? Number(formSesi.durasi_timer) * 60
          : undefined,
      };

      const res = await AbsensiAPI.bukaSesi(payload);
      const sesiId = res.data.data.sesi_id;

      // Simpan data sesi aktif ke state
      const rombelAktif = rombelList.find(r => String(r.id) === String(formSesi.rombel_id));
      const sesiData = {
        id:           sesiId,
        mode:         formSesi.mode,
        rombel_id:    Number(formSesi.rombel_id),
        nama_rombel:  rombelAktif?.nama_rombel || `Rombel #${formSesi.rombel_id}`,
        tanggal:      formSesi.tanggal,
        waktu_mulai:  res.data.data.waktu_mulai || new Date().toISOString(),
        durasi_timer: formSesi.mode === 'mandiri'
          ? Number(formSesi.durasi_timer) * 60
          : null,
      };

      setSesiAktif(sesiData);
      setDaftarWb([]);
      setKehadiranMap({});
      setTab('aktif'); // Pindah ke tab pemantauan

      // Jika mode mandiri, mulai timer countdown
      if (formSesi.mode === 'mandiri') {
        hitungTimerDariSesi(sesiData);
      }

      // Mulai polling daftar WB
      mulaiPolling(sesiId);

    } catch (err) {
      setBukaFeedback({
        type: 'error',
        msg: err.response?.data?.message || 'Gagal membuka sesi. Coba lagi.',
      });
    } finally {
      setBukaLoading(false);
    }
  };

  // ────────────────────────────────────────────────────────
  // Handler: Submit Absensi Manual
  // Mengirim array { warga_belajar_id, status } ke backend
  // ────────────────────────────────────────────────────────
  const handleSubmitManual = async () => {
    if (daftarWb.length === 0) {
      setSubmitFeedback({ type: 'error', msg: 'Belum ada WB di daftar sesi ini.' });
      return;
    }

    setSubmitLoading(true);
    setSubmitFeedback({ type: '', msg: '' });

    try {
      // Bangun array kehadiran dari kehadiranMap
      const kehadiran = daftarWb.map(wb => ({
        warga_belajar_id: wb.warga_belajar_id,
        // Default 'hadir' jika belum dipilih
        status: kehadiranMap[wb.warga_belajar_id] || 'hadir',
      }));

      await AbsensiAPI.submitManual(sesiAktif.id, { kehadiran });

      setSubmitFeedback({
        type: 'success',
        msg: `Absensi manual berhasil disimpan untuk ${kehadiran.length} Warga Belajar!`,
      });

      // Tutup sesi setelah submit manual berhasil
      setTimeout(async () => {
        await handleTutupSesi();
      }, 1500);

    } catch (err) {
      setSubmitFeedback({
        type: 'error',
        msg: err.response?.data?.message || 'Gagal menyimpan absensi.',
      });
    } finally {
      setSubmitLoading(false);
    }
  };

  // ────────────────────────────────────────────────────────
  // Handler: Tutup Sesi Absensi
  // ────────────────────────────────────────────────────────
  const handleTutupSesi = async () => {
    if (!sesiAktif) return;

    try {
      await AbsensiAPI.tutupSesi(sesiAktif.id);
    } catch { /* Sesi mungkin sudah tutup */ }

    // Hentikan semua interval
    clearInterval(pollingRef.current);
    clearInterval(timerRef.current);

    // Reset state sesi
    setSesiAktif(null);
    setDaftarWb([]);
    setKehadiranMap({});
    setSisaWaktu(0);
    setSubmitFeedback({ type: '', msg: '' });
    setTab('buka'); // Kembali ke tab buka sesi
  };

  // ────────────────────────────────────────────────────────
  // Handler: Ambil Riwayat Sesi Berdasarkan Rombel
  // ────────────────────────────────────────────────────────
  const fetchRiwayat = async (rombelId) => {
    if (!rombelId) return;
    setLoadRiwayat(true);
    try {
      const res = await AbsensiAPI.getSesiByRombel(rombelId);
      setRiwayat(res.data.data || []);
    } catch { setRiwayat([]); }
    finally  { setLoadRiwayat(false); }
  };

  const bukaDetailRiwayat = async (sesiId) => {
    setLoadDetailRiwayat(true);
    try {
      const res = await AbsensiAPI.getSesiById(sesiId);
      setDetailRiwayat(res.data.data || null);
    } catch {
      setDetailRiwayat(null);
    } finally {
      setLoadDetailRiwayat(false);
    }
  };

  // ── Helper: Format tanggal + waktu ─────────────────────
  const formatWaktu = (w) => {
    if (!w) return '—';
    return new Date(w).toLocaleString('id-ID', {
      day: '2-digit', month: 'short', year: 'numeric',
      hour: '2-digit', minute: '2-digit',
    });
  };

  // ── Helper: Format MM:SS untuk timer countdown ──────────
  const formatTimer = (detik) => {
    const m = Math.floor(detik / 60).toString().padStart(2, '0');
    const s = (detik % 60).toString().padStart(2, '0');
    return `${m}:${s}`;
  };

  // ── Helper: Hitung statistik dari daftar WB ─────────────
  const hitungStat = () => {
    if (!daftarWb.length) return { hadir: 0, belum: 0, total: 0 };
    // Mode mandiri: cek siapa yang sudah check-in
    if (sesiAktif?.mode === 'mandiri') {
      const hadir = daftarWb.filter(w => w.status_kehadiran === 'hadir').length;
      return { hadir, belum: daftarWb.length - hadir, total: daftarWb.length };
    }
    // Mode manual: hitung dari kehadiranMap
    const hadir = Object.values(kehadiranMap).filter(s => s === 'hadir').length;
    return { hadir, belum: daftarWb.length - hadir, total: daftarWb.length };
  };

  const stat = hitungStat();

  // ── Warna timer berdasarkan sisa waktu ──────────────────
  const warnaTimer = sisaWaktu > 60 ? 'var(--color-success)'
                   : sisaWaktu > 20 ? '#F59E0B'
                   : 'var(--color-danger)';

  // ── Loading awal (cek sesi yang mungkin masih aktif) ────
  if (loadSesi) {
    return (
      <div className="app-layout">
        <Sidebar user={user} />
        <main className="app-main">
          <div className="loading-container" style={{ minHeight: '100vh' }}>
            <div className="spinner"></div>
            <p>Memeriksa sesi absensi...</p>
          </div>
        </main>
      </div>
    );
  }

  return (
    <div className="app-layout">
      <Sidebar user={user} />
      <main className="app-main">
        <div className="app-content">

          {/* ── Header ───────────────────────────────────── */}
          <div style={{ marginBottom: '2rem' }}>
            <h1 style={{ fontFamily: 'var(--font-heading)', fontSize: 'var(--text-2xl)', fontWeight: 800 }}>
              Kelola Absensi
            </h1>
            <p style={{ color: 'var(--color-text-muted)', marginTop: 4 }}>
              Buka sesi absensi manual atau mandiri untuk kelas Anda.
            </p>
          </div>

          {/* ── Navigasi Tab ──────────────────────────────── */}
          <div className="mobile-tabbar">
            {[
              { key: 'buka',    icon: 'bi-plus-circle',    label: 'Buka Sesi' },
              { key: 'aktif',   icon: 'bi-record-circle',  label: sesiAktif ? '🔴 Sesi Aktif' : 'Sesi Aktif' },
              { key: 'riwayat', icon: 'bi-clock-history',  label: 'Riwayat' },
            ].map(t => (
              <button key={t.key} onClick={() => setTab(t.key)} style={{
                background: 'none', border: 'none', cursor: 'pointer',
                padding: '0.6rem 1.1rem',
                fontWeight: tab === t.key ? 700 : 500,
                color: tab === t.key ? 'var(--color-primary)' : 'var(--color-text-muted)',
                borderBottom: tab === t.key
                  ? '2px solid var(--color-primary)'
                  : '2px solid transparent',
                marginBottom: -2, fontSize: '0.9rem',
                display: 'flex', alignItems: 'center', gap: 6,
              }}>
                <i className={`bi ${t.icon}`} />{t.label}
              </button>
            ))}
          </div>

          {/* ══════════════════════════════════════════════ */}
          {/* TAB 1: BUKA SESI BARU                         */}
          {/* ══════════════════════════════════════════════ */}
          {tab === 'buka' && (
            <div className="card" style={{ maxWidth: 560 }}>
              <div className="card-header">
                <h3 className="card-title">
                  <i className="bi bi-plus-circle" style={{ color: 'var(--color-primary)' }} />{' '}
                  Buka Sesi Absensi Baru
                </h3>
              </div>
              <div style={{ padding: '1.5rem' }}>

                {/* Jika ada sesi aktif, tampilkan peringatan */}
                {sesiAktif && (
                  <div className="alert alert-warning" style={{ marginBottom: '1.5rem' }}>
                    <i className="bi bi-exclamation-triangle-fill" />
                    <div>
                      <strong>Sesi sedang berjalan!</strong>
                      <p style={{ margin: '4px 0 0', fontSize: '0.85rem' }}>
                        Tutup sesi aktif dulu sebelum membuka yang baru.{' '}
                        <button
                          onClick={() => setTab('aktif')}
                          style={{ background: 'none', border: 'none', cursor: 'pointer', color: 'var(--color-primary)', fontWeight: 600, padding: 0 }}
                        >
                          Lihat sesi aktif →
                        </button>
                      </p>
                    </div>
                  </div>
                )}

                {/* Form Rombel & Tanggal */}
                <div className="mobile-inline-grid-2">
                  <div className="form-group">
                    <label className="form-label">
                      Rombel <span style={{ color: 'var(--color-danger)' }}>*</span>
                    </label>
                    <select
                      className="form-input"
                      value={formSesi.rombel_id}
                      onChange={e => setFormSesi(p => ({ ...p, rombel_id: e.target.value }))}
                      disabled={!!sesiAktif || loadRombel || rombelList.length === 0}
                    >
                      {loadRombel ? (
                        <option value="">Memuat rombel...</option>
                      ) : rombelList.length === 0 ? (
                        <option value="">Belum ada rombel aktif</option>
                      ) : (
                        rombelList.map(rombel => (
                          <option key={rombel.id} value={rombel.id}>
                            {rombel.nama_rombel}
                          </option>
                        ))
                      )}
                    </select>
                  </div>
                  <div className="form-group">
                    <label className="form-label">Tanggal</label>
                    <input
                      type="date" className="form-input"
                      value={formSesi.tanggal}
                      onChange={e => setFormSesi(p => ({ ...p, tanggal: e.target.value }))}
                      disabled={!!sesiAktif}
                    />
                  </div>
                </div>

                <div className="form-group">
                  <label className="form-label">Mata Pelajaran (opsional)</label>
                  <select
                    className="form-input"
                    value={formSesi.mapel_id}
                    onChange={e => setFormSesi(p => ({ ...p, mapel_id: e.target.value }))}
                    disabled={!!sesiAktif || loadMapel}
                  >
                    <option value="">Umum / tanpa mapel</option>
                    {mapelList.map(mapel => (
                      <option key={mapel.id} value={mapel.id}>
                        {mapel.nama}
                      </option>
                    ))}
                  </select>
                </div>

                {/* Pilihan Mode */}
                <div className="form-group">
                  <label className="form-label">
                    Mode Absensi <span style={{ color: 'var(--color-danger)' }}>*</span>
                  </label>
                  <div className="mobile-inline-grid-2" style={{ gap: '0.75rem' }}>
                    {[
                      {
                        val: 'manual',
                        icon: 'bi-person-check',
                        judul: 'Manual',
                        deskripsi: 'Tutor mengisi status kehadiran setiap WB',
                      },
                      {
                        val: 'mandiri',
                        icon: 'bi-qr-code',
                        judul: 'Mandiri + Timer',
                        deskripsi: 'WB check-in sendiri dalam batas waktu',
                      },
                    ].map(m => (
                      <button
                        key={m.val} type="button"
                        onClick={() => setFormSesi(p => ({ ...p, mode: m.val }))}
                        disabled={!!sesiAktif}
                        style={{
                          border: `2px solid ${formSesi.mode === m.val ? 'var(--color-primary)' : 'var(--color-border)'}`,
                          borderRadius: 'var(--radius-md)',
                          padding: '1rem',
                          background: formSesi.mode === m.val ? 'var(--color-primary-light)' : 'var(--color-surface)',
                          cursor: sesiAktif ? 'not-allowed' : 'pointer',
                          textAlign: 'left',
                          opacity: sesiAktif ? 0.5 : 1,
                        }}
                      >
                        <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 4 }}>
                          <i className={`bi ${m.icon}`} style={{ color: 'var(--color-primary)', fontSize: '1.2rem' }} />
                          <span style={{ fontWeight: 700, fontSize: '0.9rem' }}>{m.judul}</span>
                        </div>
                        <p style={{ fontSize: '0.78rem', color: 'var(--color-text-muted)', margin: 0 }}>{m.deskripsi}</p>
                      </button>
                    ))}
                  </div>
                </div>

                {/* Durasi Timer (hanya untuk mode mandiri) */}
                {formSesi.mode === 'mandiri' && (
                  <div className="form-group">
                    <label className="form-label">
                      Durasi Timer <span style={{ color: 'var(--color-danger)' }}>*</span>
                    </label>
                    <div className="mobile-choice-row" style={{ flexWrap: 'wrap' }}>
                      {['5', '10', '15', '20', '30'].map(mnt => (
                        <button
                          key={mnt} type="button"
                          onClick={() => setFormSesi(p => ({ ...p, durasi_timer: mnt }))}
                          disabled={!!sesiAktif}
                          style={{
                            padding: '6px 16px', borderRadius: 'var(--radius-sm)',
                            border: `2px solid ${formSesi.durasi_timer === mnt ? 'var(--color-primary)' : 'var(--color-border)'}`,
                            background: formSesi.durasi_timer === mnt ? 'var(--color-primary)' : 'transparent',
                            color: formSesi.durasi_timer === mnt ? '#fff' : 'var(--color-text)',
                            cursor: sesiAktif ? 'not-allowed' : 'pointer',
                            fontWeight: formSesi.durasi_timer === mnt ? 700 : 400,
                            fontSize: '0.88rem',
                          }}
                        >
                          {mnt} menit
                        </button>
                      ))}
                    </div>
                  </div>
                )}

                {/* Feedback & Tombol */}
                {bukaFeedback.msg && (
                  <div className={`alert ${bukaFeedback.type === 'success' ? 'alert-success' : 'alert-danger'}`}
                    style={{ marginBottom: '1rem' }}>
                    <i className={`bi ${bukaFeedback.type === 'success' ? 'bi-check-circle' : 'bi-exclamation-circle'}`} />
                    <span>{bukaFeedback.msg}</span>
                  </div>
                )}
                <button
                  className="btn btn-primary"
                  style={{ width: '100%', padding: '0.75rem' }}
                  onClick={handleBukaSesi}
                  disabled={bukaLoading || !!sesiAktif}
                >
                  {bukaLoading
                    ? <><div className="spinner" style={{ width: 16, height: 16 }} /> Membuka sesi...</>
                    : <><i className="bi bi-play-circle-fill" /> Buka Sesi Absensi</>
                  }
                </button>
              </div>
            </div>
          )}

          {/* ══════════════════════════════════════════════ */}
          {/* TAB 2: SESI AKTIF (PEMANTAUAN REAL-TIME)      */}
          {/* ══════════════════════════════════════════════ */}
          {tab === 'aktif' && (
            <>
              {!sesiAktif ? (
                /* Tidak ada sesi aktif */
                <div className="card">
                  <div className="empty-state" style={{ padding: '3rem' }}>
                    <i className="bi bi-calendar-x" style={{ fontSize: '3rem', color: 'var(--color-text-muted)' }} />
                    <h3>Tidak Ada Sesi Aktif</h3>
                    <p>Buka sesi absensi baru untuk mulai mencatat kehadiran.</p>
                  </div>
                </div>
              ) : (
                <>
                  {/* ── Header Sesi Aktif ─────────────────── */}
                  <div className="card" style={{ marginBottom: '1.5rem' }}>
                    <div style={{ padding: '1.25rem 1.5rem' }}>
                      <div className="mobile-toolbar" style={{ justifyContent: 'space-between' }}>

                        {/* Info Sesi */}
                        <div className="mobile-list-row">
                          {/* Indikator live */}
                          <div style={{
                            width: 12, height: 12, borderRadius: '50%',
                            background: 'var(--color-danger)',
                            boxShadow: '0 0 0 3px rgba(239,68,68,0.3)',
                            animation: 'pulse 1.5s infinite',
                            flexShrink: 0,
                          }} />
                          <div>
                            <div style={{ fontWeight: 700, fontSize: '1rem' }}>
                              Sesi #{sesiAktif.id} — {sesiAktif.nama_rombel}
                            </div>
                            <div style={{ fontSize: '0.8rem', color: 'var(--color-text-muted)', marginTop: 2 }}>
                              Mode:{' '}
                              <span style={{ fontWeight: 600, color: sesiAktif.mode === 'mandiri' ? 'var(--color-primary)' : '#065F46' }}>
                                {sesiAktif.mode === 'mandiri' ? '📱 Mandiri' : '✍️ Manual'}
                              </span>
                              {' · '}Tanggal: {sesiAktif.tanggal}
                            </div>
                          </div>
                        </div>

                        {/* Timer (mode mandiri) atau status (mode manual) */}
                        <div className="mobile-toolbar">
                          {sesiAktif.mode === 'mandiri' && (
                            <div style={{
                              padding: '0.5rem 1rem', borderRadius: 'var(--radius-md)',
                              background: sisaWaktu > 0 ? `${warnaTimer}15` : '#FEE2E2',
                              border: `2px solid ${sisaWaktu > 0 ? warnaTimer : 'var(--color-danger)'}`,
                              textAlign: 'center',
                              minWidth: 100,
                            }}>
                              <div style={{ fontFamily: 'var(--font-heading)', fontSize: '1.6rem', fontWeight: 900, color: warnaTimer, lineHeight: 1 }}>
                                {formatTimer(sisaWaktu)}
                              </div>
                              <div style={{ fontSize: '0.7rem', color: 'var(--color-text-muted)', marginTop: 2 }}>
                                {sisaWaktu > 0 ? 'sisa waktu' : 'waktu habis'}
                              </div>
                            </div>
                          )}

                          {/* Statistik cepat */}
                          <div style={{ display: 'flex', gap: '0.5rem' }}>
                            <span className="badge badge-success">{stat.hadir} Hadir</span>
                            <span className="badge badge-neutral">{stat.belum} Belum</span>
                            <span className="badge badge-info">{stat.total} Total</span>
                          </div>

                          {/* Tombol Tutup */}
                          <button className="btn btn-danger" style={{ fontSize: '0.85rem' }} onClick={handleTutupSesi}>
                            <i className="bi bi-stop-circle" /> Tutup Sesi
                          </button>
                        </div>
                      </div>
                    </div>
                  </div>

                  {/* ── Daftar WB ─────────────────────────── */}
                  <div className="card">
                    <div className="card-header">
                      <h3 className="card-title">
                        {sesiAktif.mode === 'mandiri'
                          ? <><i className="bi bi-arrow-repeat" style={{ color: 'var(--color-primary)' }} /> Pemantauan Real-time</>
                          : <><i className="bi bi-person-check" /> Isi Kehadiran Manual</>
                        }
                      </h3>
                      {sesiAktif.mode === 'mandiri' && (
                        <span style={{ fontSize: '0.78rem', color: 'var(--color-text-muted)' }}>
                          <i className="bi bi-arrow-repeat" /> Auto-refresh {POLLING_INTERVAL / 1000}s
                        </span>
                      )}
                    </div>

                    {daftarWb.length === 0 ? (
                      <div className="empty-state" style={{ padding: '2.5rem' }}>
                        <i className="bi bi-people" />
                        <h3>Belum Ada Data WB</h3>
                        <p style={{ fontSize: '0.85rem' }}>
                          {sesiAktif.mode === 'mandiri'
                            ? 'Menunggu WB check-in...'
                            : 'Data WB akan muncul setelah backend mengembalikan daftar rombel.'
                          }
                        </p>
                      </div>
                    ) : (
                      <>
                        {/* Tabel daftar WB */}
                        <div className="table-wrapper">
                          <table className="table">
                            <thead>
                              <tr>
                                <th>#</th>
                                <th>Nama Warga Belajar</th>
                                {sesiAktif.mode === 'mandiri' ? (
                                  <>
                                    <th>Status</th>
                                    <th>Waktu Check-In</th>
                                  </>
                                ) : (
                                  <th>Kehadiran</th>
                                )}
                              </tr>
                            </thead>
                            <tbody>
                              {daftarWb.map((wb, idx) => (
                                <tr key={wb.warga_belajar_id}>
                                  <td style={{ color: 'var(--color-text-muted)', fontSize: '0.85rem' }}>
                                    {idx + 1}
                                  </td>
                                  <td>
                                    <div style={{ fontWeight: 600, fontSize: '0.9rem' }}>
                                      {wb.nama_lengkap || `WB #${wb.warga_belajar_id}`}
                                    </div>
                                    {wb.nis && (
                                      <div style={{ color: 'var(--color-text-muted)', fontSize: '0.75rem', marginTop: 1 }}>
                                        NIS: {wb.nis}
                                      </div>
                                    )}
                                  </td>

                                  {/* Mode Mandiri: tampilkan status check-in */}
                                  {sesiAktif.mode === 'mandiri' ? (
                                    <>
                                      <td>
                                        {wb.status_kehadiran === 'hadir' ? (
                                          <span className="badge badge-success">
                                            <i className="bi bi-check-circle-fill" /> Hadir
                                          </span>
                                        ) : (
                                          <span className="badge badge-neutral">
                                            <i className="bi bi-clock" /> Belum Check-in
                                          </span>
                                        )}
                                      </td>
                                      <td style={{ fontSize: '0.82rem', color: 'var(--color-text-muted)' }}>
                                        {wb.waktu_check_in ? formatWaktu(wb.waktu_check_in) : '—'}
                                      </td>
                                    </>
                                  ) : (
                                    /* Mode Manual: tombol pilih status */
                                    <td>
                                      <div style={{ display: 'flex', gap: '0.35rem', flexWrap: 'wrap' }}>
                                        {STATUS_OPTIONS.map(s => {
                                          const dipilih = (kehadiranMap[wb.warga_belajar_id] || 'hadir') === s.val;
                                          return (
                                            <button
                                              key={s.val} type="button"
                                              onClick={() => setKehadiranMap(prev => ({
                                                ...prev, [wb.warga_belajar_id]: s.val,
                                              }))}
                                              style={{
                                                padding: '4px 10px',
                                                borderRadius: 'var(--radius-sm)',
                                                border: `1.5px solid ${dipilih ? s.color : 'var(--color-border)'}`,
                                                background: dipilih ? `${s.color}18` : 'transparent',
                                                color: dipilih ? s.color : 'var(--color-text-muted)',
                                                cursor: 'pointer',
                                                fontSize: '0.78rem',
                                                fontWeight: dipilih ? 700 : 400,
                                                display: 'flex', alignItems: 'center', gap: 4,
                                              }}
                                            >
                                              <i className={`bi ${s.icon}`} /> {s.label}
                                            </button>
                                          );
                                        })}
                                      </div>
                                    </td>
                                  )}
                                </tr>
                              ))}
                            </tbody>
                          </table>
                        </div>

                        {/* Tombol Submit Manual */}
                        {sesiAktif.mode === 'manual' && (
                          <div style={{ padding: '1rem 1.5rem', borderTop: '1px solid var(--color-border)' }}>
                            {submitFeedback.msg && (
                              <div className={`alert ${submitFeedback.type === 'success' ? 'alert-success' : 'alert-danger'}`}
                                style={{ marginBottom: '1rem' }}>
                                <i className={`bi ${submitFeedback.type === 'success' ? 'bi-check-circle' : 'bi-exclamation-circle'}`} />
                                <span>{submitFeedback.msg}</span>
                              </div>
                            )}
                            <button
                              className="btn btn-primary"
                              style={{ minWidth: 200 }}
                              onClick={handleSubmitManual}
                              disabled={submitLoading}
                            >
                              {submitLoading
                                ? <><div className="spinner" style={{ width: 16, height: 16 }} /> Menyimpan...</>
                                : <><i className="bi bi-check2-all" /> Simpan & Selesaikan Absensi</>
                              }
                            </button>
                          </div>
                        )}

                        {/* Info mode mandiri: timer habis */}
                        {sesiAktif.mode === 'mandiri' && sisaWaktu === 0 && (
                          <div style={{ padding: '1rem 1.5rem', borderTop: '1px solid var(--color-border)' }}>
                            <div className="alert alert-warning">
                              <i className="bi bi-clock-history" />
                              <div>
                                <strong>Waktu check-in telah habis.</strong>
                                <p style={{ margin: '4px 0 0', fontSize: '0.85rem' }}>
                                  WB yang belum check-in akan otomatis tercatat Alpa. Tutup sesi untuk menyimpan rekap.
                                </p>
                              </div>
                            </div>
                            <button className="btn btn-primary" onClick={handleTutupSesi}>
                              <i className="bi bi-stop-circle" /> Tutup & Simpan Rekap
                            </button>
                          </div>
                        )}
                      </>
                    )}
                  </div>
                </>
              )}
            </>
          )}

          {/* ══════════════════════════════════════════════ */}
          {/* TAB 3: RIWAYAT SESI                           */}
          {/* ══════════════════════════════════════════════ */}
          {tab === 'riwayat' && (
            <div className="card">
              <div className="card-header">
                <h3 className="card-title">Riwayat Sesi Absensi</h3>
              </div>
              <div style={{ padding: '1rem 1.5rem' }}>
                {/* Filter berdasarkan Rombel */}
                <div className="mobile-toolbar" style={{ marginBottom: '1.5rem', alignItems: 'flex-end' }}>
                  <div className="form-group" style={{ margin: 0, flex: 1 }}>
                    <label className="form-label">Rombel</label>
                    <select
                      className="form-input"
                      value={inputRombel}
                      onChange={e => setInputRombel(e.target.value)}
                      disabled={loadRombel || rombelList.length === 0}
                      style={{ height: 38 }}
                    >
                      {loadRombel ? (
                        <option value="">Memuat rombel...</option>
                      ) : rombelList.length === 0 ? (
                        <option value="">Belum ada rombel aktif</option>
                      ) : (
                        rombelList.map(rombel => (
                          <option key={rombel.id} value={rombel.id}>
                            {rombel.nama_rombel}
                          </option>
                        ))
                      )}
                    </select>
                  </div>
                  <button
                    className="btn btn-primary"
                    style={{ height: 38 }}
                    onClick={() => fetchRiwayat(inputRombel)}
                    disabled={!inputRombel || loadRiwayat}
                  >
                    {loadRiwayat
                      ? <div className="spinner" style={{ width: 16, height: 16 }} />
                      : <><i className="bi bi-search" /> Cari</>
                    }
                  </button>
                </div>

                {/* Daftar Riwayat */}
                {riwayat.length === 0 ? (
                  <div className="empty-state" style={{ padding: '2rem' }}>
                    <i className="bi bi-clock-history" />
                    <h3>Belum Ada Riwayat</h3>
                    <p>Pilih rombel untuk melihat riwayat sesi absensi manual maupun mandiri.</p>
                  </div>
                ) : (
                  <div className="table-wrapper">
                    <table className="table">
                      <thead>
                        <tr>
                          <th>ID Sesi</th>
                          <th>Tanggal</th>
                          <th>Mode</th>
                          <th>Status</th>
                          <th>Hadir</th>
                          <th>Waktu</th>
                          <th>Aksi</th>
                        </tr>
                      </thead>
                      <tbody>
                        {riwayat.map(s => (
                          <tr key={s.id}>
                            <td style={{ fontWeight: 700 }}>#{s.id}</td>
                            <td>{s.tanggal}</td>
                            <td>
                              <span className={`badge ${s.mode === 'mandiri' ? 'badge-info' : 'badge-neutral'}`}>
                                {s.mode === 'mandiri' ? '📱 Mandiri' : '✍️ Manual'}
                              </span>
                            </td>
                            <td>
                              <span className={`badge ${s.status_sesi === 'selesai' ? 'badge-success' : 'badge-warning'}`}>
                                {s.status_sesi === 'selesai' ? 'Selesai' : 'Aktif'}
                              </span>
                            </td>
                            <td style={{ fontWeight: 700 }}>{s.jumlah_hadir ?? 0}</td>
                            <td style={{ fontSize: '0.82rem', color: 'var(--color-text-muted)' }}>
                              {formatWaktu(s.waktu_mulai)}
                            </td>
                            <td>
                              <button
                                className="btn btn-secondary"
                                style={{ fontSize: '0.8rem', padding: '4px 10px' }}
                                onClick={() => bukaDetailRiwayat(s.id)}
                              >
                                <i className="bi bi-eye" /> Detail
                              </button>
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                )}
              </div>
            </div>
          )}

        </div>
      </main>

      {detailRiwayat && (
        <Modal
          title={<><i className="bi bi-clock-history" style={{ color: 'var(--color-primary)', marginRight: 8 }} />Detail Riwayat Absensi</>}
          onClose={() => setDetailRiwayat(null)}
        >
          {loadDetailRiwayat ? (
            <div className="loading-container" style={{ padding: '2rem' }}>
              <div className="spinner"></div>
            </div>
          ) : (
            <>
              <div className="grid-cols-2" style={{ gap: '1rem', marginBottom: '1rem' }}>
                {[
                  { label: 'Sesi', value: `#${detailRiwayat.id}` },
                  { label: 'Rombel', value: detailRiwayat.nama_rombel || '—' },
                  { label: 'Tanggal', value: detailRiwayat.tanggal || '—' },
                  { label: 'Mode', value: detailRiwayat.mode === 'mandiri' ? 'Mandiri' : 'Manual' },
                  { label: 'Status', value: detailRiwayat.status_sesi || '—' },
                  { label: 'Mapel', value: detailRiwayat.nama_mapel || 'Umum' },
                ].map(item => (
                  <div key={item.label} className="card" style={{ padding: '0.9rem 1rem' }}>
                    <div style={{ fontSize: '0.75rem', color: 'var(--color-text-muted)', marginBottom: 4 }}>{item.label}</div>
                    <div style={{ fontWeight: 700 }}>{item.value}</div>
                  </div>
                ))}
              </div>

              <div className="table-wrapper">
                <table className="table">
                  <thead>
                    <tr>
                      <th>Nama Warga Belajar</th>
                      <th>NIS</th>
                      <th>Status</th>
                      <th>Metode</th>
                      <th>Waktu Check-In</th>
                    </tr>
                  </thead>
                  <tbody>
                    {(detailRiwayat.rekaman || []).length === 0 ? (
                      <tr>
                        <td colSpan="5" style={{ textAlign: 'center', color: 'var(--color-text-muted)' }}>
                          Belum ada rekaman kehadiran untuk sesi ini.
                        </td>
                      </tr>
                    ) : (
                      detailRiwayat.rekaman.map(item => (
                        <tr key={item.id}>
                          <td>{item.nama_lengkap || '—'}</td>
                          <td>{item.nis || '—'}</td>
                          <td>
                            <span className={`badge ${
                              item.status === 'hadir'
                                ? 'badge-success'
                                : item.status === 'izin'
                                  ? 'badge-warning'
                                  : item.status === 'sakit'
                                    ? 'badge-info'
                                    : 'badge-danger'
                            }`}>
                              {String(item.status || '—').toUpperCase()}
                            </span>
                          </td>
                          <td style={{ fontSize: '0.82rem' }}>
                            {item.metode === 'mandiri_wb' ? 'Mandiri' : 'Manual Tutor'}
                          </td>
                          <td style={{ fontSize: '0.82rem', color: 'var(--color-text-muted)' }}>
                            {item.waktu_check_in ? formatWaktu(item.waktu_check_in) : '—'}
                          </td>
                        </tr>
                      ))
                    )}
                  </tbody>
                </table>
              </div>
            </>
          )}
        </Modal>
      )}
    </div>
  );
}

function Modal({ title, onClose, children, maxWidth = 760 }) {
  return (
    <div
      className="app-modal-backdrop"
      style={{
        position: 'fixed',
        inset: 0,
        background: 'rgba(15, 23, 42, 0.45)',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        padding: '1rem',
        zIndex: 1000,
      }}
      onClick={onClose}
    >
      <div
        className="card app-modal-panel"
        style={{
          width: '100%',
          maxWidth,
          maxHeight: '90vh',
          overflowY: 'auto',
          padding: 0,
        }}
        onClick={(e) => e.stopPropagation()}
      >
        <div
          className="card-header mobile-modal-header"
          style={{
            position: 'sticky',
            top: 0,
            background: 'var(--color-surface)',
            zIndex: 1,
          }}
        >
          <h3 className="card-title">{title}</h3>
          <button className="btn btn-secondary" style={{ padding: '0.45rem 0.7rem' }} onClick={onClose}>
            <i className="bi bi-x-lg" />
          </button>
        </div>
        <div className="mobile-modal-body" style={{ padding: '1rem 1.25rem 1.25rem' }}>
          {children}
        </div>
      </div>
    </div>
  );
}

export default AbsensiTutor;
