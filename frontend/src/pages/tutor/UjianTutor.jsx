// ============================================================
// src/pages/tutor/UjianTutor.jsx — Soal & Ujian
// ============================================================
// Tutor mengelola bank soal dan merakit paket ujian untuk WB.
//
// Tiga sub-modul dalam satu halaman:
//   1. Bank Soal — buat, lihat, hapus soal (pilgan & essay)
//   2. Paket Ujian — rakit soal menjadi satu paket ujian
//   3. Rekap Hasil — lihat rekap nilai WB per paket ujian
//
// API yang digunakan:
//   GET    /api/ujian/soal                  → daftar soal (+ filter)
//   POST   /api/ujian/soal                  → buat soal baru
//   PUT    /api/ujian/soal/:id              → edit soal
//   DELETE /api/ujian/soal/:id              → hapus soal
//   GET    /api/ujian/paket/rombel/:id      → daftar paket ujian
//   POST   /api/ujian/paket                 → buat paket ujian baru
//   GET    /api/ujian/paket/:id/rekap       → rekap hasil ujian WB
// ============================================================

import { useState, useEffect } from 'react';
import Sidebar from '../../components/Sidebar.jsx';
import { SiswaAPI, UjianAPI } from '../../services/api.js';

// ── Konstanta ────────────────────────────────────────────────
const JENJANG_OPTS = [
  { val: 'paket_a', label: 'Paket A' },
  { val: 'paket_b', label: 'Paket B' },
  { val: 'paket_c', label: 'Paket C' },
  { val: 'semua',   label: 'Semua Jenjang' },
];

const TIPE_BADGE = {
  pilihan_ganda: { cls: 'badge-info',    label: 'Pilihan Ganda' },
  essay:         { cls: 'badge-neutral', label: 'Essay' },
};

const KATEGORI_BADGE = {
  akademik:    { cls: 'badge-success', label: 'Akademik' },
  bakat_minat: { cls: 'badge-warning', label: 'Bakat Minat' },
};

// Opsi pilihan jawaban pilihan ganda (A, B, C, D)
const KUNCI_OPTS = ['A', 'B', 'C', 'D'];

function UjianTutor() {
  const user = JSON.parse(localStorage.getItem('pkbm_user') || '{}');
  const storageKey = `pkbm_tutor_ujian_rombel_${user?.id || 'default'}`;

  // ── State: Tab Utama ─────────────────────────────────────
  const [tab, setTab] = useState('bank'); // 'bank' | 'paket' | 'rekap'

  // ════════════════════════════════════════════════════════
  // TAB 1: BANK SOAL
  // ════════════════════════════════════════════════════════

  const [soalList,    setSoalList]    = useState([]);
  const [loadSoal,    setLoadSoal]    = useState(true);
  const [errSoal,     setErrSoal]     = useState('');

  // Filter bank soal
  const [filterMapel,   setFilterMapel]   = useState('');
  const [filterJenjang, setFilterJenjang] = useState('');
  const [filterJenis,   setFilterJenis]   = useState('');
  const [rombelList,    setRombelList]    = useState([]);
  const [mapelList,     setMapelList]     = useState([]);
  const [loadRombel,    setLoadRombel]    = useState(true);
  const [loadMapel,     setLoadMapel]     = useState(false);

  // Form tambah soal
  const [showFormSoal,  setShowFormSoal]  = useState(false);
  const [formSoal, setFormSoal] = useState({
    mapel_id:      '',
    jenjang:       'paket_c',
    jenis:         'pilihan_ganda', // 'pilihan_ganda' | 'essay'
    kategori:      'akademik',      // 'akademik' | 'bakat_minat'
    pertanyaan:    '',
    // Pilihan jawaban (hanya untuk pilihan_ganda) — array 4 teks
    pilihan:       ['', '', '', ''],
    kunci_jawaban: 'A',
    skor_benar:    1,
    tag_dimensi:   '', // Untuk soal bakat minat
  });
  const [soalLoading,  setSoalLoading]  = useState(false);
  const [soalFeedback, setSoalFeedback] = useState({ type: '', msg: '' });

  // Konfirmasi hapus soal
  const [hapusId, setHapusId] = useState(null);
  const [hapusLoading, setHapusLoading] = useState(false);

  // ════════════════════════════════════════════════════════
  // TAB 2: PAKET UJIAN
  // ════════════════════════════════════════════════════════

  const [inputRombel,  setInputRombel]  = useState(() => localStorage.getItem(storageKey) || '');
  const [rombelDipilih, setRombelDipilih] = useState(() => localStorage.getItem(storageKey) || '');
  const [paketList,    setPaketList]    = useState([]);
  const [loadPaket,    setLoadPaket]    = useState(false);

  // Form buat paket ujian
  const [showFormPaket, setShowFormPaket] = useState(false);
  const [formPaket, setFormPaket] = useState({
    judul:        '',
    deskripsi:    '',
    mapel_id:     '',
    sumber_ujian: 'internal',
    link_google_form: '',
    durasi_menit: 60,
    acak_soal:    false,
    jenis:        'uh', // 'uh' | 'uts' | 'uas' | 'bakat_minat' | 'latihan'
    nilai_lulus:  60,
    // IDs soal yang dipilih dari bank soal
    soal_ids:     [],
  });
  const [paketLoading,  setPaketLoading]  = useState(false);
  const [paketFeedback, setPaketFeedback] = useState({ type: '', msg: '' });

  // ════════════════════════════════════════════════════════
  // TAB 3: REKAP HASIL UJIAN
  // ════════════════════════════════════════════════════════

  const [paketRekap,   setPaketRekap]   = useState(''); // ID paket yang dipilih
  const [rekap,        setRekap]        = useState(null);
  const [loadRekap,    setLoadRekap]    = useState(false);
  const [nilaiManualMap, setNilaiManualMap] = useState({});
  const [manualSaveId, setManualSaveId] = useState(null);

  // ────────────────────────────────────────────────────────
  // Fetch bank soal (dengan filter opsional)
  // ────────────────────────────────────────────────────────
  const fetchSoal = async () => {
    setLoadSoal(true);
    setErrSoal('');
    try {
      const params = {};
      if (filterMapel)   params.mapel_id = filterMapel;
      if (filterJenjang) params.jenjang  = filterJenjang;
      if (filterJenis)   params.jenis    = filterJenis;

      const res = await UjianAPI.getAllSoal(params);
      setSoalList(res.data.data || []);
    } catch {
      setErrSoal('Gagal memuat bank soal.');
    } finally {
      setLoadSoal(false);
    }
  };

  // Fetch soal saat pertama kali masuk tab bank
  useEffect(() => {
    if (tab === 'bank') fetchSoal();
  }, [tab]); // eslint-disable-line

  useEffect(() => {
    const fetchRombelOptions = async () => {
      try {
        setLoadRombel(true);
        const res = await SiswaAPI.getRombelOptions();
        const options = res.data.data || [];
        setRombelList(options);

        if (!options.length) {
          setInputRombel('');
          setRombelDipilih('');
          return;
        }

        const saved = localStorage.getItem(storageKey) || '';
        const hasSaved = saved && options.some(r => String(r.id) === String(saved));
        const nextRombel = hasSaved ? String(saved) : String(options[0].id);
        setInputRombel(nextRombel);
        setRombelDipilih(nextRombel);
      } catch {
        setRombelList([]);
      } finally {
        setLoadRombel(false);
      }
    };

    fetchRombelOptions();
  }, [storageKey]);

  useEffect(() => {
    if (!rombelDipilih) {
      setMapelList([]);
      return;
    }

    const fetchMapelOptions = async () => {
      const rombelAktif = rombelList.find(r => String(r.id) === String(rombelDipilih));
      try {
        setLoadMapel(true);
        const res = await SiswaAPI.getMapelOptions({
          rombel_id: rombelDipilih,
          jenjang: rombelAktif?.jenjang || undefined,
        });
        const options = res.data.data || [];
        setMapelList(options);

        if (!filterMapel && options.length) setFilterMapel(String(options[0].id));
        if (!formSoal.mapel_id && options.length) {
          setFormSoal(prev => ({ ...prev, mapel_id: String(options[0].id), jenjang: rombelAktif?.jenjang || prev.jenjang }));
        }
        if (!formPaket.mapel_id && options.length) {
          setFormPaket(prev => ({ ...prev, mapel_id: String(options[0].id) }));
        }
      } catch {
        setMapelList([]);
      } finally {
        setLoadMapel(false);
      }
    };

    fetchMapelOptions();
  }, [rombelDipilih, rombelList]); // eslint-disable-line

  useEffect(() => {
    if (rombelDipilih) {
      localStorage.setItem(storageKey, String(rombelDipilih));
    } else {
      localStorage.removeItem(storageKey);
    }
  }, [rombelDipilih, storageKey]);

  // ────────────────────────────────────────────────────────
  // Fetch paket ujian berdasarkan rombel
  // ────────────────────────────────────────────────────────
  const fetchPaket = async (rombelId) => {
    if (!rombelId) return;
    setLoadPaket(true);
    try {
      const res = await UjianAPI.getPaketByRombel(rombelId);
      setPaketList(res.data.data || []);
    } catch { setPaketList([]); }
    finally  { setLoadPaket(false); }
  };

  useEffect(() => {
    if (rombelDipilih) fetchPaket(rombelDipilih);
  }, [rombelDipilih]);

  // ────────────────────────────────────────────────────────
  // Handler: Simpan Soal Baru
  // ────────────────────────────────────────────────────────
  const handleSimpanSoal = async () => {
    // Validasi input wajib
    if (!formSoal.mapel_id || !formSoal.jenjang || !formSoal.pertanyaan) {
      setSoalFeedback({ type: 'error', msg: 'Mata pelajaran, jenjang, dan pertanyaan wajib diisi.' });
      return;
    }
    if (formSoal.jenis === 'pilihan_ganda') {
      const kosong = formSoal.pilihan.filter(p => !p.trim());
      if (kosong.length > 0) {
        setSoalFeedback({ type: 'error', msg: 'Semua 4 pilihan jawaban harus diisi.' });
        return;
      }
    }

    setSoalLoading(true);
    setSoalFeedback({ type: '', msg: '' });

    try {
      // Format pilihan jawaban sesuai struktur JSON yang diharapkan backend
      // Format: [{"kunci":"A","teks":"Jakarta"},{"kunci":"B","teks":"Bandung"},...]
      const pilihan_json = formSoal.jenis === 'pilihan_ganda'
        ? JSON.stringify(
            formSoal.pilihan.map((teks, i) => ({
              kunci: KUNCI_OPTS[i],
              teks: teks.trim(),
            }))
          )
        : undefined;

      await UjianAPI.createSoal({
        mapel_id:      Number(formSoal.mapel_id),
        jenjang:       formSoal.jenjang,
        jenis:         formSoal.jenis,
        kategori:      formSoal.kategori,
        pertanyaan:    formSoal.pertanyaan,
        pilihan_json,
        jawaban_benar: formSoal.jenis === 'pilihan_ganda' ? formSoal.kunci_jawaban : undefined,
        bobot:         Number(formSoal.skor_benar),
        tag:           formSoal.tag_dimensi || undefined,
      });

      setSoalFeedback({ type: 'success', msg: 'Soal berhasil ditambahkan ke bank soal!' });

      // Reset form
      setFormSoal({
        mapel_id: '', jenjang: 'paket_c', jenis: 'pilihan_ganda', kategori: 'akademik',
        pertanyaan: '', pilihan: ['', '', '', ''], kunci_jawaban: 'A', skor_benar: 1, tag_dimensi: '',
      });

      await fetchSoal(); // Reload bank soal
      setTimeout(() => { setShowFormSoal(false); setSoalFeedback({ type: '', msg: '' }); }, 1500);
    } catch (err) {
      setSoalFeedback({
        type: 'error',
        msg: err.response?.data?.message || 'Gagal menyimpan soal.',
      });
    } finally {
      setSoalLoading(false);
    }
  };

  // ────────────────────────────────────────────────────────
  // Handler: Hapus Soal
  // ────────────────────────────────────────────────────────
  const handleHapusSoal = async (id) => {
    setHapusLoading(true);
    try {
      await UjianAPI.deleteSoal(id);
      setSoalList(prev => prev.filter(s => s.id !== id));
      setHapusId(null);
    } catch {
      alert('Gagal menghapus soal.');
    } finally {
      setHapusLoading(false);
    }
  };

  // ────────────────────────────────────────────────────────
  // Handler: Toggle Soal ke dalam Paket (pilih/batal pilih)
  // ────────────────────────────────────────────────────────
  const toggleSoalDiPaket = (soalId) => {
    setFormPaket(prev => {
      const ids = prev.soal_ids;
      return {
        ...prev,
        soal_ids: ids.includes(soalId)
          ? ids.filter(id => id !== soalId) // Hapus jika sudah dipilih
          : [...ids, soalId],              // Tambahkan jika belum
      };
    });
  };

  // ────────────────────────────────────────────────────────
  // Handler: Buat Paket Ujian Baru
  // ────────────────────────────────────────────────────────
  const handleBuatPaket = async () => {
    if (!rombelDipilih) {
      setPaketFeedback({ type: 'error', msg: 'Pilih rombel terlebih dahulu.' });
      return;
    }
    if (!formPaket.judul) {
      setPaketFeedback({ type: 'error', msg: 'Judul paket ujian wajib diisi.' });
      return;
    }
    if (!formPaket.mapel_id) {
      setPaketFeedback({ type: 'error', msg: 'Mata pelajaran wajib dipilih.' });
      return;
    }
    if (formPaket.sumber_ujian === 'internal' && formPaket.soal_ids.length === 0) {
      setPaketFeedback({ type: 'error', msg: 'Pilih minimal 1 soal untuk ujian internal.' });
      return;
    }
    if (formPaket.sumber_ujian === 'google_form' && !formPaket.link_google_form) {
      setPaketFeedback({ type: 'error', msg: 'Link Google Form wajib diisi.' });
      return;
    }

    setPaketLoading(true);
    setPaketFeedback({ type: '', msg: '' });

    try {
      await UjianAPI.createPaket({
        rombel_id:    Number(rombelDipilih),
        mapel_id:     formPaket.mapel_id ? Number(formPaket.mapel_id) : undefined,
        judul:        formPaket.judul,
        deskripsi:    formPaket.deskripsi,
        sumber_ujian: formPaket.sumber_ujian,
        link_google_form: formPaket.link_google_form || undefined,
        durasi_menit: Number(formPaket.durasi_menit),
        acak_soal:    formPaket.acak_soal ? 1 : 0,
        jenis:        formPaket.jenis,
        nilai_lulus:  Number(formPaket.nilai_lulus),
        soal_ids:     formPaket.soal_ids,
      });

      setPaketFeedback({ type: 'success', msg: 'Paket ujian berhasil dibuat!' });

      // Reset form
      setFormPaket({
        judul: '', deskripsi: '', mapel_id: '', sumber_ujian: 'internal', link_google_form: '', durasi_menit: 60,
        acak_soal: false, jenis: 'uh', nilai_lulus: 60, soal_ids: [],
      });

      await fetchPaket(rombelDipilih);
      setTimeout(() => { setShowFormPaket(false); setPaketFeedback({ type: '', msg: '' }); }, 1500);
    } catch (err) {
      setPaketFeedback({
        type: 'error',
        msg: err.response?.data?.message || 'Gagal membuat paket ujian.',
      });
    } finally {
      setPaketLoading(false);
    }
  };

  // ────────────────────────────────────────────────────────
  // Fetch rekap hasil ujian
  // ────────────────────────────────────────────────────────
  const fetchRekap = async (paketId) => {
    if (!paketId) return;
    setLoadRekap(true);
    setRekap(null);
    try {
      const res = await UjianAPI.getRekapPaket(paketId);
      const data = res.data.data;
      setRekap(data);
      setNilaiManualMap(
        (data?.peserta || []).reduce((acc, item) => {
          acc[item.warga_belajar_id] = item.nilai_total ?? '';
          return acc;
        }, {})
      );
    } catch { setRekap(null); }
    finally  { setLoadRekap(false); }
  };

  const handleSimpanNilaiManual = async (wargaBelajarId) => {
    const nilai = nilaiManualMap[wargaBelajarId];
    if (nilai === '' || nilai === null || nilai === undefined) {
      alert('Masukkan nilai terlebih dahulu.');
      return;
    }

    setManualSaveId(wargaBelajarId);
    try {
      await UjianAPI.simpanNilaiManualPaket(rekap.paket_id, {
        warga_belajar_id: wargaBelajarId,
        nilai_total: Number(nilai),
      });
      await fetchRekap(rekap.paket_id);
    } catch (err) {
      alert(err.response?.data?.message || 'Gagal menyimpan nilai manual.');
    } finally {
      setManualSaveId(null);
    }
  };

  // ── Helpers ──────────────────────────────────────────────
  const formatWaktu = (w) => w
    ? new Date(w).toLocaleString('id-ID', { day:'2-digit', month:'short', year:'numeric', hour:'2-digit', minute:'2-digit' })
    : '—';

  return (
    <div className="app-layout">
      <Sidebar user={user} />
      <main className="app-main">
        <div className="app-content">

          {/* ── Header ───────────────────────────────────── */}
          <div style={{ marginBottom: '2rem' }}>
            <h1 style={{ fontFamily: 'var(--font-heading)', fontSize: 'var(--text-2xl)', fontWeight: 800 }}>
              Soal & Ujian
            </h1>
            <p style={{ color: 'var(--color-text-muted)', marginTop: 4 }}>
              Kelola soal, ujian internal, atau ujian via Google Form untuk WB.
            </p>
          </div>

          {/* ── Navigasi Tab ──────────────────────────────── */}
          <div className="mobile-tabbar">
            {[
              { key: 'bank',  icon: 'bi-archive',             label: `Soal (${soalList.length})` },
              { key: 'paket', icon: 'bi-file-earmark-check',  label: 'Paket Ujian' },
              { key: 'rekap', icon: 'bi-bar-chart-line',      label: 'Rekap Hasil' },
            ].map(t => (
              <button key={t.key} onClick={() => setTab(t.key)} style={{
                background: 'none', border: 'none', cursor: 'pointer',
                padding: '0.6rem 1.1rem',
                fontWeight: tab === t.key ? 700 : 500,
                color: tab === t.key ? 'var(--color-primary)' : 'var(--color-text-muted)',
                borderBottom: tab === t.key ? '2px solid var(--color-primary)' : '2px solid transparent',
                marginBottom: -2, fontSize: '0.9rem',
                display: 'flex', alignItems: 'center', gap: 6,
              }}>
                <i className={`bi ${t.icon}`} />{t.label}
              </button>
            ))}
          </div>

          {/* ════════════════════════════════════════════════ */}
          {/* TAB 1: BANK SOAL                                */}
          {/* ════════════════════════════════════════════════ */}
          {tab === 'bank' && (
            <div className="card">
              <div className="card-header">
                <h3 className="card-title">Soal</h3>
                <button className="btn btn-primary" style={{ fontSize: '0.85rem' }}
                  onClick={() => { setShowFormSoal(true); setSoalFeedback({ type: '', msg: '' }); }}>
                  <i className="bi bi-plus-circle" /> Tambah Soal
                </button>
              </div>

              {/* Filter Bar */}
              <div className="mobile-toolbar" style={{ padding: '1rem 1.5rem', borderBottom: '1px solid var(--color-border)', alignItems: 'flex-end' }}>
                <div className="form-group" style={{ margin: 0 }}>
                  <label className="form-label" style={{ fontSize: '0.78rem' }}>Jenjang</label>
                  <select className="form-input" value={filterJenjang} onChange={e => setFilterJenjang(e.target.value)} style={{ height: 36 }}>
                    <option value="">Semua</option>
                    {JENJANG_OPTS.map(j => <option key={j.val} value={j.val}>{j.label}</option>)}
                  </select>
                </div>
                <div className="form-group" style={{ margin: 0 }}>
                  <label className="form-label" style={{ fontSize: '0.78rem' }}>Tipe Soal</label>
                  <select className="form-input" value={filterJenis} onChange={e => setFilterJenis(e.target.value)} style={{ height: 36 }}>
                    <option value="">Semua</option>
                    <option value="pilihan_ganda">Pilihan Ganda</option>
                    <option value="essay">Essay</option>
                  </select>
                </div>
                <button className="btn btn-secondary" style={{ height: 36 }} onClick={fetchSoal}>
                  <i className="bi bi-funnel" /> Filter
                </button>
              </div>

              {/* Daftar Soal */}
              {loadSoal ? (
                <div className="loading-container" style={{ padding: '3rem' }}><div className="spinner" /></div>
              ) : errSoal ? (
                <div className="alert alert-danger" style={{ margin: '1.5rem' }}><i className="bi bi-exclamation-triangle" /><span>{errSoal}</span></div>
              ) : soalList.length === 0 ? (
                <div className="empty-state">
                  <i className="bi bi-archive" />
                    <h3>Soal Masih Kosong</h3>
                    <p>Tambahkan soal pertama untuk mulai menyusun ujian.</p>
                </div>
              ) : (
                <div style={{ padding: '0 1rem 1rem' }}>
                  {soalList.map((soal, idx) => {
                    // Parse pilihan dari JSON string
                    let pilihan = [];
                    try {
                      pilihan = Array.isArray(soal.pilihan)
                        ? soal.pilihan
                        : JSON.parse(soal.pilihan || '[]');
                    } catch {
                      pilihan = [];
                    }

                    return (
                      <div key={soal.id} style={{
                        padding: '1rem 0.75rem',
                        borderBottom: '1px solid var(--color-border)',
                      }}>
                        <div className="mobile-list-row" style={{ alignItems: 'flex-start' }}>
                          {/* Nomor soal */}
                          <div style={{
                            width: 32, height: 32, borderRadius: '50%',
                            background: 'var(--color-primary-light)', color: 'var(--color-primary)',
                            display: 'flex', alignItems: 'center', justifyContent: 'center',
                            fontWeight: 700, fontSize: '0.85rem', flexShrink: 0,
                          }}>
                            {idx + 1}
                          </div>

                          <div style={{ flex: 1 }}>
                            {/* Badge tipe & kategori */}
                            <div style={{ display: 'flex', gap: '0.4rem', marginBottom: 6, flexWrap: 'wrap' }}>
                              <span className={`badge ${TIPE_BADGE[soal.tipe]?.cls || 'badge-neutral'}`}>
                                {TIPE_BADGE[soal.tipe]?.label || soal.tipe}
                              </span>
                              <span className={`badge ${KATEGORI_BADGE[soal.kategori]?.cls || 'badge-neutral'}`}>
                                {KATEGORI_BADGE[soal.kategori]?.label || soal.kategori}
                              </span>
                              <span className="badge badge-neutral">{soal.jenjang?.replace('_', ' ').toUpperCase()}</span>
                              {soal.tag_dimensi && (
                                <span className="badge badge-info" style={{ background: '#FEF3C7', color: '#92400E' }}>
                                  🎯 {soal.tag_dimensi}
                                </span>
                              )}
                            </div>

                            {/* Teks pertanyaan */}
                            <p style={{ fontWeight: 600, fontSize: '0.9rem', margin: '0 0 6px' }}>
                              {soal.pertanyaan}
                            </p>

                            {/* Pilihan jawaban (jika pilihan ganda) */}
                            {pilihan.length > 0 && (
                              <div style={{ display: 'flex', gap: '0.5rem', flexWrap: 'wrap', marginTop: 4 }}>
                                {pilihan.map(p => (
                                  <span key={p.kunci} style={{
                                    padding: '2px 10px', borderRadius: 'var(--radius-sm)',
                                    background: soal.kunci_jawaban === p.kunci ? '#D1FAE5' : 'var(--color-bg)',
                                    color: soal.kunci_jawaban === p.kunci ? '#065F46' : 'var(--color-text-muted)',
                                    border: `1px solid ${soal.kunci_jawaban === p.kunci ? '#6EE7B7' : 'var(--color-border)'}`,
                                    fontSize: '0.78rem', fontWeight: soal.kunci_jawaban === p.kunci ? 700 : 400,
                                  }}>
                                    {soal.kunci_jawaban === p.kunci && '✓ '}{p.kunci}. {p.teks}
                                  </span>
                                ))}
                              </div>
                            )}

                            {/* Skor */}
                            <div style={{ fontSize: '0.75rem', color: 'var(--color-text-muted)', marginTop: 6 }}>
                              Skor: <strong>{soal.skor_benar || 1}</strong> poin
                            </div>
                          </div>

                          {/* Tombol hapus */}
                          <button
                            className="btn btn-secondary"
                            style={{ fontSize: '0.8rem', padding: '4px 10px', color: 'var(--color-danger)', border: '1px solid var(--color-danger)', flexShrink: 0 }}
                            onClick={() => setHapusId(soal.id)}
                          >
                            <i className="bi bi-trash" />
                          </button>
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}
            </div>
          )}

          {/* ════════════════════════════════════════════════ */}
          {/* TAB 2: PAKET UJIAN                              */}
          {/* ════════════════════════════════════════════════ */}
          {tab === 'paket' && (
            <>
              {/* Pilih Rombel */}
              <div className="card" style={{ marginBottom: '1.5rem' }}>
                <div className="mobile-toolbar" style={{ padding: '1rem 1.5rem', alignItems: 'flex-end' }}>
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
                  <button className="btn btn-primary" style={{ height: 38 }}
                    onClick={() => setRombelDipilih(inputRombel)} disabled={!inputRombel}>
                    <i className="bi bi-arrow-right-circle" /> Muat Paket
                  </button>
                  <button className="btn btn-secondary" style={{ height: 38 }}
                    onClick={() => { setShowFormPaket(true); setPaketFeedback({ type: '', msg: '' }); }}
                    disabled={!rombelDipilih}>
                    <i className="bi bi-plus-circle" /> Buat Paket Baru
                  </button>
                </div>
              </div>

              {/* Daftar Paket Ujian */}
              <div className="card">
                <div className="card-header">
                  <h3 className="card-title">Daftar Paket Ujian</h3>
                </div>
                {!rombelDipilih ? (
                  <div className="empty-state">
                    <i className="bi bi-file-earmark-check" />
                    <h3>Pilih Rombel</h3>
                    <p>Pilih nama rombel untuk melihat daftar paket ujian.</p>
                  </div>
                ) : loadPaket ? (
                  <div className="loading-container" style={{ padding: '3rem' }}><div className="spinner" /></div>
                ) : paketList.length === 0 ? (
                  <div className="empty-state">
                    <i className="bi bi-file-earmark-x" />
                    <h3>Belum Ada Paket Ujian</h3>
                    <p>Buat paket ujian pertama untuk rombel ini.</p>
                  </div>
                ) : (
                  <div className="table-wrapper">
                    <table className="table">
                      <thead>
                        <tr>
                          <th>Judul Paket</th>
                          <th>Jenis</th>
                          <th>Durasi</th>
                          <th>Nilai Lulus</th>
                          <th>Status</th>
                          <th>Aksi</th>
                        </tr>
                      </thead>
                      <tbody>
                        {paketList.map(p => (
                          <tr key={p.id}>
                            <td>
                              <div style={{ fontWeight: 600, fontSize: '0.9rem' }}>{p.judul}</div>
                              {p.deskripsi && (
                                <div style={{ color: 'var(--color-text-muted)', fontSize: '0.78rem', marginTop: 2 }}>
                                  {p.deskripsi}
                                </div>
                              )}
                            </td>
                            <td>
                            <span className="badge badge-info" style={{ textTransform: 'uppercase' }}>
                                {p.jenis}
                              </span>
                              <div style={{ marginTop: 6 }}>
                                <span className={`badge ${p.sumber_ujian === 'google_form' ? 'badge-warning' : 'badge-success'}`}>
                                  {p.sumber_ujian === 'google_form' ? 'Google Form' : 'Internal'}
                                </span>
                              </div>
                            </td>
                            <td style={{ fontSize: '0.88rem' }}>{p.durasi_menit} menit</td>
                            <td style={{ fontWeight: 700 }}>{p.nilai_lulus}</td>
                            <td>
                              <span className={`badge ${p.is_aktif ? 'badge-success' : 'badge-neutral'}`}>
                                {p.is_aktif ? 'Aktif' : 'Draft'}
                              </span>
                            </td>
                            <td>
                              <button
                                className="btn btn-secondary" style={{ fontSize: '0.8rem', padding: '4px 10px' }}
                                onClick={() => { setPaketRekap(p.id); setTab('rekap'); fetchRekap(p.id); }}
                              >
                                <i className="bi bi-bar-chart" /> Lihat Hasil
                              </button>
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                )}
              </div>
            </>
          )}

          {/* ════════════════════════════════════════════════ */}
          {/* TAB 3: REKAP HASIL UJIAN                        */}
          {/* ════════════════════════════════════════════════ */}
          {tab === 'rekap' && (
            <div className="card">
              <div className="card-header">
                <h3 className="card-title">Rekap Hasil Ujian</h3>
              </div>
              <div style={{ padding: '1rem 1.5rem' }}>
                <div className="mobile-toolbar" style={{ marginBottom: '1.5rem', alignItems: 'flex-end' }}>
                  <div className="form-group" style={{ margin: 0, flex: 1 }}>
                    <label className="form-label">ID Paket Ujian</label>
                    <input
                      type="number" className="form-input"
                      placeholder="Masukkan ID paket ujian..."
                      value={paketRekap}
                      onChange={e => setPaketRekap(e.target.value)}
                      style={{ height: 38 }}
                    />
                  </div>
                  <button
                    className="btn btn-primary" style={{ height: 38 }}
                    onClick={() => fetchRekap(paketRekap)}
                    disabled={!paketRekap || loadRekap}
                  >
                    {loadRekap
                      ? <div className="spinner" style={{ width: 16, height: 16 }} />
                      : <><i className="bi bi-search" /> Tampilkan Rekap</>
                    }
                  </button>
                </div>

                {!rekap ? (
                  <div className="empty-state" style={{ padding: '2rem' }}>
                    <i className="bi bi-bar-chart-line" />
                    <h3>Belum Ada Data</h3>
                    <p>Masukkan ID paket ujian dan klik Tampilkan Rekap.</p>
                  </div>
                ) : (
                  <>
                    {/* Ringkasan statistik */}
                    <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(150px, 1fr))', gap: '1rem', marginBottom: '1.5rem' }}>
                      {[
                        { label: 'Total Peserta', val: rekap.total_peserta ?? '—', color: 'var(--color-primary)' },
                        { label: 'Nilai Tertinggi', val: rekap.nilai_tertinggi ?? '—', color: 'var(--color-success)' },
                        { label: 'Nilai Terendah', val: rekap.nilai_terendah ?? '—', color: 'var(--color-danger)' },
                        { label: 'Rata-rata', val: rekap.nilai_rata_rata ? Number(rekap.nilai_rata_rata).toFixed(1) : '—', color: '#F59E0B' },
                        { label: 'Lulus', val: rekap.jumlah_lulus ?? '—', color: 'var(--color-success)' },
                      ].map(s => (
                        <div key={s.label} style={{
                          textAlign: 'center', padding: '1rem',
                          background: 'var(--color-bg)', borderRadius: 'var(--radius-md)',
                          border: '1px solid var(--color-border)',
                        }}>
                          <div style={{ fontFamily: 'var(--font-heading)', fontSize: '1.6rem', fontWeight: 800, color: s.color }}>
                            {s.val}
                          </div>
                          <div style={{ fontSize: '0.75rem', color: 'var(--color-text-muted)', marginTop: 4, fontWeight: 600 }}>
                            {s.label}
                          </div>
                        </div>
                      ))}
                    </div>

                    <div style={{ display: 'flex', gap: '0.75rem', flexWrap: 'wrap', marginBottom: '1rem' }}>
                      <span className="badge badge-info">{rekap.sumber_ujian === 'google_form' ? 'Google Form' : 'Internal'}</span>
                      {rekap.link_google_form && (
                        <a
                          href={rekap.link_google_form}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="btn btn-secondary"
                          style={{ fontSize: '0.8rem', padding: '4px 10px' }}
                        >
                          <i className="bi bi-box-arrow-up-right" /> Buka Google Form
                        </a>
                      )}
                    </div>

                    {/* Tabel per WB */}
                    {rekap.peserta?.length > 0 && (
                      <div className="table-wrapper">
                        <table className="table">
                          <thead>
                            <tr>
                              <th>Nama WB</th>
                              <th>Nilai</th>
                              <th>Status</th>
                              <th>Waktu Selesai</th>
                              {rekap.sumber_ujian === 'google_form' && <th>Aksi</th>}
                            </tr>
                          </thead>
                          <tbody>
                            {rekap.peserta.map(p => (
                              <tr key={p.warga_belajar_id}>
                                <td style={{ fontWeight: 600 }}>{p.nama_lengkap || `WB #${p.warga_belajar_id}`}</td>
                                <td>
                                  {rekap.sumber_ujian === 'google_form' ? (
                                    <input
                                      type="number"
                                      className="form-input"
                                      min={0}
                                      max={100}
                                      value={nilaiManualMap[p.warga_belajar_id] ?? ''}
                                      onChange={e => setNilaiManualMap(prev => ({
                                        ...prev,
                                        [p.warga_belajar_id]: e.target.value,
                                      }))}
                                      style={{ maxWidth: 100 }}
                                    />
                                  ) : (
                                    <span style={{ fontFamily: 'var(--font-heading)', fontWeight: 800, fontSize: '1.1rem', color: p.is_lulus ? 'var(--color-success)' : 'var(--color-danger)' }}>
                                      {p.nilai_total !== null ? Number(p.nilai_total).toFixed(1) : '—'}
                                    </span>
                                  )}
                                </td>
                                <td>
                                  {p.is_lulus === null ? (
                                    <span className="badge badge-neutral">Belum Dinilai</span>
                                  ) : p.is_lulus ? (
                                    <span className="badge badge-success">✓ Lulus</span>
                                  ) : (
                                    <span className="badge badge-danger">✗ Tidak Lulus</span>
                                  )}
                                </td>
                                <td style={{ fontSize: '0.82rem', color: 'var(--color-text-muted)' }}>
                                  {formatWaktu(p.waktu_selesai)}
                                </td>
                                {rekap.sumber_ujian === 'google_form' && (
                                  <td>
                                    <button
                                      className="btn btn-primary"
                                      style={{ fontSize: '0.8rem', padding: '4px 10px' }}
                                      onClick={() => handleSimpanNilaiManual(p.warga_belajar_id)}
                                      disabled={manualSaveId === p.warga_belajar_id}
                                    >
                                      {manualSaveId === p.warga_belajar_id
                                        ? <><div className="spinner" style={{ width: 14, height: 14 }} /> Menyimpan</>
                                        : <><i className="bi bi-check2" /> Simpan Nilai</>}
                                    </button>
                                  </td>
                                )}
                              </tr>
                            ))}
                          </tbody>
                        </table>
                      </div>
                    )}
                  </>
                )}
              </div>
            </div>
          )}

        </div>
      </main>

      {/* ── Modal Tambah Soal ─────────────────────────────── */}
      {showFormSoal && (
        <Modal title={<><i className="bi bi-plus-square" style={{ color: 'var(--color-primary)', marginRight: 8 }} />Tambah Soal ke Bank</>}
          onClose={() => setShowFormSoal(false)} maxWidth={640}>

          {/* Tipe soal */}
          <div className="form-group">
            <label className="form-label">Tipe Soal</label>
            <div style={{ display: 'flex', gap: '0.5rem' }}>
              {['pilihan_ganda', 'essay'].map(t => (
                <button key={t} type="button" onClick={() => setFormSoal(p => ({ ...p, jenis: t }))}
                  style={{
                    flex: 1, padding: '8px', borderRadius: 'var(--radius-sm)', cursor: 'pointer',
                    border: `2px solid ${formSoal.jenis === t ? 'var(--color-primary)' : 'var(--color-border)'}`,
                    background: formSoal.jenis === t ? 'var(--color-primary-light)' : 'transparent',
                    fontWeight: formSoal.jenis === t ? 700 : 400, fontSize: '0.85rem',
                  }}>
                  {t === 'pilihan_ganda' ? '📝 Pilihan Ganda' : '✏️ Essay'}
                </button>
              ))}
            </div>
          </div>

          {/* Kategori soal */}
          <div className="form-group">
            <label className="form-label">Kategori</label>
            <div style={{ display: 'flex', gap: '0.5rem' }}>
              {[{ val: 'akademik', label: '📚 Akademik' }, { val: 'bakat_minat', label: '🎯 Bakat Minat' }].map(k => (
                <button key={k.val} type="button" onClick={() => setFormSoal(p => ({ ...p, kategori: k.val }))}
                  style={{
                    flex: 1, padding: '8px', borderRadius: 'var(--radius-sm)', cursor: 'pointer',
                    border: `2px solid ${formSoal.kategori === k.val ? 'var(--color-primary)' : 'var(--color-border)'}`,
                    background: formSoal.kategori === k.val ? 'var(--color-primary-light)' : 'transparent',
                    fontWeight: formSoal.kategori === k.val ? 700 : 400, fontSize: '0.85rem',
                  }}>
                  {k.label}
                </button>
              ))}
            </div>
          </div>

          {/* Jenjang & Mapel */}
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem' }}>
            <div className="form-group">
              <label className="form-label">Jenjang <span style={{ color: 'var(--color-danger)' }}>*</span></label>
              <select className="form-input" value={formSoal.jenjang} onChange={e => setFormSoal(p => ({ ...p, jenjang: e.target.value }))}>
                {JENJANG_OPTS.map(j => <option key={j.val} value={j.val}>{j.label}</option>)}
              </select>
            </div>
            <div className="form-group">
              <label className="form-label">Mata Pelajaran <span style={{ color: 'var(--color-danger)' }}>*</span></label>
              <select
                className="form-input"
                value={formSoal.mapel_id}
                onChange={e => setFormSoal(p => ({ ...p, mapel_id: e.target.value }))}
                disabled={loadMapel || mapelList.length === 0}
              >
                {loadMapel ? (
                  <option value="">Memuat mata pelajaran...</option>
                ) : mapelList.length === 0 ? (
                  <option value="">Belum ada mata pelajaran</option>
                ) : (
                  mapelList.map(mapel => (
                    <option key={mapel.id} value={mapel.id}>
                      {mapel.nama}
                    </option>
                  ))
                )}
              </select>
            </div>
          </div>

          {/* Tag dimensi bakat (khusus bakat_minat) */}
          {formSoal.kategori === 'bakat_minat' && (
            <div className="form-group">
              <label className="form-label">Dimensi Bakat</label>
              <input type="text" className="form-input"
                placeholder="contoh: logika, seni, sosial, sains, bahasa, olahraga"
                value={formSoal.tag_dimensi} onChange={e => setFormSoal(p => ({ ...p, tag_dimensi: e.target.value }))} />
            </div>
          )}

          {/* Teks Pertanyaan */}
          <div className="form-group">
            <label className="form-label">Pertanyaan <span style={{ color: 'var(--color-danger)' }}>*</span></label>
            <textarea className="form-input" rows={3} placeholder="Tulis pertanyaan di sini..."
              value={formSoal.pertanyaan} onChange={e => setFormSoal(p => ({ ...p, pertanyaan: e.target.value }))}
              style={{ resize: 'vertical' }} />
          </div>

          {/* Pilihan Jawaban (hanya untuk pilihan ganda) */}
          {formSoal.jenis === 'pilihan_ganda' && (
            <>
              <div className="form-group">
                <label className="form-label">Pilihan Jawaban <span style={{ color: 'var(--color-danger)' }}>*</span></label>
                {KUNCI_OPTS.map((kunci, i) => (
                  <div key={kunci} style={{ display: 'flex', gap: '0.5rem', alignItems: 'center', marginBottom: '0.5rem' }}>
                    {/* Tombol pilih sebagai kunci jawaban */}
                    <button type="button"
                      onClick={() => setFormSoal(p => ({ ...p, kunci_jawaban: kunci }))}
                      style={{
                        width: 32, height: 32, borderRadius: '50%', flexShrink: 0, cursor: 'pointer',
                        border: `2px solid ${formSoal.kunci_jawaban === kunci ? 'var(--color-success)' : 'var(--color-border)'}`,
                        background: formSoal.kunci_jawaban === kunci ? 'var(--color-success)' : 'transparent',
                        color: formSoal.kunci_jawaban === kunci ? '#fff' : 'var(--color-text-muted)',
                        fontWeight: 700, fontSize: '0.85rem',
                        display: 'flex', alignItems: 'center', justifyContent: 'center',
                      }}>
                      {kunci}
                    </button>
                    <input type="text" className="form-input"
                      placeholder={`Pilihan ${kunci}`}
                      value={formSoal.pilihan[i]}
                      onChange={e => {
                        const newPilihan = [...formSoal.pilihan];
                        newPilihan[i] = e.target.value;
                        setFormSoal(p => ({ ...p, pilihan: newPilihan }));
                      }}
                      style={{ flex: 1 }} />
                  </div>
                ))}
                <p style={{ fontSize: '0.75rem', color: 'var(--color-text-muted)', marginTop: 4 }}>
                  <i className="bi bi-info-circle" /> Klik huruf kunci (A/B/C/D) untuk menandai sebagai jawaban benar (lingkaran hijau).
                </p>
              </div>
            </>
          )}

          {/* Skor */}
          <div className="form-group">
            <label className="form-label">Skor Jika Benar</label>
            <input type="number" className="form-input" value={formSoal.skor_benar} min={1}
              onChange={e => setFormSoal(p => ({ ...p, skor_benar: e.target.value }))} />
          </div>

          {soalFeedback.msg && (
            <div className={`alert ${soalFeedback.type === 'success' ? 'alert-success' : 'alert-danger'}`} style={{ marginBottom: '1rem' }}>
              <i className={`bi ${soalFeedback.type === 'success' ? 'bi-check-circle' : 'bi-exclamation-circle'}`} />
              <span>{soalFeedback.msg}</span>
            </div>
          )}

            <div className="mobile-actions">
            <button className="btn btn-secondary" onClick={() => setShowFormSoal(false)}>Batal</button>
            <button className="btn btn-primary" onClick={handleSimpanSoal} disabled={soalLoading}>
              {soalLoading
                ? <><div className="spinner" style={{ width: 16, height: 16 }} /> Menyimpan...</>
                : <><i className="bi bi-check2" /> Simpan Soal</>
              }
            </button>
          </div>
        </Modal>
      )}

      {/* ── Modal Buat Paket Ujian ─────────────────────────── */}
      {showFormPaket && (
        <Modal title={<><i className="bi bi-file-earmark-plus" style={{ color: 'var(--color-primary)', marginRight: 8 }} />Buat Paket Ujian</>}
          onClose={() => setShowFormPaket(false)} maxWidth={700}>

          <div className="form-group">
            <label className="form-label">Judul Paket <span style={{ color: 'var(--color-danger)' }}>*</span></label>
            <input type="text" className="form-input" placeholder="contoh: UTS Matematika Semester 1"
              value={formPaket.judul} onChange={e => setFormPaket(p => ({ ...p, judul: e.target.value }))} />
          </div>

          <div className="form-group">
            <label className="form-label">Sumber Ujian</label>
            <div className="mobile-choice-row">
              {[
                { val: 'internal', label: 'Internal' },
                { val: 'google_form', label: 'Google Form' },
              ].map(opt => (
                <button
                  key={opt.val}
                  type="button"
                  onClick={() => setFormPaket(p => ({ ...p, sumber_ujian: opt.val }))}
                  style={{
                    flex: 1,
                    padding: '8px',
                    borderRadius: 'var(--radius-sm)',
                    cursor: 'pointer',
                    border: `2px solid ${formPaket.sumber_ujian === opt.val ? 'var(--color-primary)' : 'var(--color-border)'}`,
                    background: formPaket.sumber_ujian === opt.val ? 'var(--color-primary-light)' : 'transparent',
                    fontWeight: formPaket.sumber_ujian === opt.val ? 700 : 400,
                    fontSize: '0.85rem',
                  }}
                >
                  {opt.label}
                </button>
              ))}
            </div>
          </div>

          <div className="form-group">
            <label className="form-label">Mata Pelajaran <span style={{ color: 'var(--color-danger)' }}>*</span></label>
            <select
              className="form-input"
              value={formPaket.mapel_id}
              onChange={e => setFormPaket(p => ({ ...p, mapel_id: e.target.value }))}
              disabled={loadMapel || mapelList.length === 0}
            >
              {loadMapel ? (
                <option value="">Memuat mata pelajaran...</option>
              ) : mapelList.length === 0 ? (
                <option value="">Belum ada mata pelajaran</option>
              ) : (
                mapelList.map(mapel => (
                  <option key={mapel.id} value={mapel.id}>
                    {mapel.nama}
                  </option>
                ))
              )}
            </select>
          </div>

          {formPaket.sumber_ujian === 'google_form' && (
            <div className="form-group">
              <label className="form-label">Link Google Form <span style={{ color: 'var(--color-danger)' }}>*</span></label>
              <input
                type="url"
                className="form-input"
                placeholder="https://forms.gle/..."
                value={formPaket.link_google_form}
                onChange={e => setFormPaket(p => ({ ...p, link_google_form: e.target.value }))}
              />
            </div>
          )}

          <div className="mobile-inline-grid-3">
            <div className="form-group">
              <label className="form-label">Jenis Ujian</label>
              <select className="form-input" value={formPaket.jenis} onChange={e => setFormPaket(p => ({ ...p, jenis: e.target.value }))}>
                <option value="uh">UH (Ulangan Harian)</option>
                <option value="uts">UTS</option>
                <option value="uas">UAS</option>
                <option value="latihan">Latihan</option>
                <option value="bakat_minat">Asesmen Bakat</option>
              </select>
            </div>
            <div className="form-group">
              <label className="form-label">Durasi (menit)</label>
              <input type="number" className="form-input" value={formPaket.durasi_menit} min={5}
                onChange={e => setFormPaket(p => ({ ...p, durasi_menit: e.target.value }))} />
            </div>
            <div className="form-group">
              <label className="form-label">Nilai Lulus</label>
              <input type="number" className="form-input" value={formPaket.nilai_lulus} min={0} max={100}
                onChange={e => setFormPaket(p => ({ ...p, nilai_lulus: e.target.value }))} />
            </div>
          </div>

          {/* Opsi acak soal */}
          <div className="form-group">
            <label style={{ display: 'flex', alignItems: 'center', gap: 8, cursor: 'pointer' }}>
              <input type="checkbox" checked={formPaket.acak_soal}
                onChange={e => setFormPaket(p => ({ ...p, acak_soal: e.target.checked }))} />
              <span className="form-label" style={{ margin: 0 }}>Acak urutan soal untuk setiap WB</span>
            </label>
          </div>

          {/* Pilih soal */}
          {formPaket.sumber_ujian === 'internal' && (
          <div className="form-group">
            <label className="form-label">
              Pilih Soal <span style={{ color: 'var(--color-danger)' }}>*</span>
              {' '}
              <span className="badge badge-info">{formPaket.soal_ids.length} dipilih</span>
            </label>
            <div style={{ maxHeight: 250, overflowY: 'auto', border: '1px solid var(--color-border)', borderRadius: 'var(--radius-md)', padding: '0.5rem' }}>
              {soalList.length === 0 ? (
                <p style={{ color: 'var(--color-text-muted)', fontSize: '0.85rem', padding: '0.5rem', textAlign: 'center' }}>
                  Soal masih kosong. Tambahkan soal dulu di tab Soal.
                </p>
              ) : soalList.map((soal, idx) => {
                const dipilih = formPaket.soal_ids.includes(soal.id);
                return (
                  <div key={soal.id} onClick={() => toggleSoalDiPaket(soal.id)} style={{
                    display: 'flex', alignItems: 'center', gap: '0.75rem',
                    padding: '0.6rem 0.75rem', borderRadius: 'var(--radius-sm)',
                    cursor: 'pointer',
                    background: dipilih ? 'var(--color-primary-light)' : 'transparent',
                    border: `1px solid ${dipilih ? 'var(--color-primary)' : 'transparent'}`,
                    marginBottom: 4, transition: 'all 0.12s',
                  }}>
                    <div style={{
                      width: 20, height: 20, borderRadius: 4, flexShrink: 0,
                      border: `2px solid ${dipilih ? 'var(--color-primary)' : 'var(--color-border)'}`,
                      background: dipilih ? 'var(--color-primary)' : 'transparent',
                      display: 'flex', alignItems: 'center', justifyContent: 'center',
                    }}>
                      {dipilih && <i className="bi bi-check" style={{ color: '#fff', fontSize: '0.8rem' }} />}
                    </div>
                    <div style={{ flex: 1, minWidth: 0 }}>
                      <div style={{ fontSize: '0.82rem', fontWeight: 600, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                        {idx + 1}. {soal.pertanyaan}
                      </div>
                      <div style={{ display: 'flex', gap: 4, marginTop: 2 }}>
                        <span className={`badge ${TIPE_BADGE[soal.tipe]?.cls}`} style={{ fontSize: '0.65rem', padding: '1px 6px' }}>
                          {TIPE_BADGE[soal.tipe]?.label}
                        </span>
                        <span className="badge badge-neutral" style={{ fontSize: '0.65rem', padding: '1px 6px' }}>
                          {soal.jenjang}
                        </span>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
          )}

          {paketFeedback.msg && (
            <div className={`alert ${paketFeedback.type === 'success' ? 'alert-success' : 'alert-danger'}`} style={{ marginBottom: '1rem' }}>
              <i className={`bi ${paketFeedback.type === 'success' ? 'bi-check-circle' : 'bi-exclamation-circle'}`} />
              <span>{paketFeedback.msg}</span>
            </div>
          )}

          <div className="mobile-actions">
            <button className="btn btn-secondary" onClick={() => setShowFormPaket(false)}>Batal</button>
            <button className="btn btn-primary" onClick={handleBuatPaket} disabled={paketLoading}>
              {paketLoading
                ? <><div className="spinner" style={{ width: 16, height: 16 }} /> Membuat...</>
                : <><i className="bi bi-check2" /> Buat Paket Ujian</>
              }
            </button>
          </div>
        </Modal>
      )}

      {/* ── Dialog Konfirmasi Hapus Soal ──────────────────── */}
      {hapusId && (
        <Modal title={<><i className="bi bi-trash" style={{ color: 'var(--color-danger)', marginRight: 8 }} />Hapus Soal?</>}
          onClose={() => setHapusId(null)} maxWidth={400}>
          <p style={{ color: 'var(--color-text-muted)', marginBottom: '1.5rem' }}>
            Soal ini akan dihapus permanen dari bank soal. Tindakan ini tidak dapat dibatalkan.
          </p>
          <div className="mobile-actions">
            <button className="btn btn-secondary" onClick={() => setHapusId(null)}>Batal</button>
            <button
              className="btn btn-danger" onClick={() => handleHapusSoal(hapusId)} disabled={hapusLoading}
              style={{ background: 'var(--color-danger)', color: '#fff', border: 'none' }}
            >
              {hapusLoading
                ? <div className="spinner" style={{ width: 16, height: 16 }} />
                : <><i className="bi bi-trash" /> Ya, Hapus</>
              }
            </button>
          </div>
        </Modal>
      )}
    </div>
  );
}

// ── Komponen Modal Generik ─────────────────────────────────
function Modal({ title, onClose, children, maxWidth = 580 }) {
  return (
    <div className="app-modal-backdrop" style={{
      position: 'fixed', inset: 0,
      background: 'rgba(0,0,0,0.45)', backdropFilter: 'blur(4px)',
      display: 'flex', alignItems: 'center', justifyContent: 'center',
      zIndex: 1000, padding: '1rem',
    }} onClick={e => { if (e.target === e.currentTarget) onClose(); }}>
      <div className="app-modal-panel" style={{
        background: 'var(--color-surface)', borderRadius: 'var(--radius-lg)',
        boxShadow: 'var(--shadow-lg)', width: '100%', maxWidth,
        maxHeight: '90vh', overflowY: 'auto',
      }}>
        <div className="mobile-modal-header">
          <h3 style={{ fontFamily: 'var(--font-heading)', fontWeight: 700, margin: 0, fontSize: '1.05rem' }}>{title}</h3>
          <button onClick={onClose} style={{ background: 'none', border: 'none', cursor: 'pointer', fontSize: '1.2rem', color: 'var(--color-text-muted)' }}>
            <i className="bi bi-x-lg" />
          </button>
        </div>
        <div className="mobile-modal-body">{children}</div>
      </div>
    </div>
  );
}

export default UjianTutor;
