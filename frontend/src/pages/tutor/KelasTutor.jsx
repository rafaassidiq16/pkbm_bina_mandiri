// ============================================================
// src/pages/tutor/KelasTutor.jsx — Manajemen Kelas, Materi & Tugas
// ============================================================
// Tutor mengelola materi pembelajaran dan tugas untuk rombel
// yang diajarkannya. Halaman ini menggabungkan tiga fitur:
//   - Upload & kelola materi (dokumen/video/link)
//   - Buat tugas + nilai pengumpulan dari WB
//   - Lihat & buat jadwal pertemuan KBM
//
// API:
//   GET  /api/lms/materi/rombel/:rombelId  → daftar materi
//   POST /api/lms/materi                   → upload materi baru
//   PUT  /api/lms/materi/:id/publish       → toggle publish
//   GET  /api/lms/tugas/rombel/:rombelId   → daftar tugas
//   POST /api/lms/tugas                    → buat tugas baru
//   PUT  /api/lms/tugas/pengumpulan/:id/nilai → nilai tugas WB
//   GET  /api/lms/jadwal/rombel/:rombelId  → jadwal KBM
//   POST /api/lms/jadwal                   → buat jadwal
// ============================================================

import { useState, useEffect, useRef } from 'react';
import Sidebar from '../../components/Sidebar.jsx';
import { LmsAPI, SiswaAPI } from '../../services/api.js';

// ── Konstanta ────────────────────────────────────────────────
const TIPE_ICON = {
  dokumen:        { icon: 'bi-file-earmark-pdf', color: '#EF4444', bg: '#FEE2E2' },
  video_link:     { icon: 'bi-play-circle',      color: '#8B5CF6', bg: '#EDE9FE' },
  link_eksternal: { icon: 'bi-link-45deg',       color: '#3B82F6', bg: '#DBEAFE' },
};

function KelasTutor() {
  const user = JSON.parse(localStorage.getItem('pkbm_user') || '{}');
  const storageKey = `pkbm_tutor_rombel_${user?.id || 'default'}`;

  // ── State: Tab Utama ─────────────────────────────────────
  const [tab, setTab] = useState('materi'); // 'materi' | 'tugas' | 'jadwal'

  // ── State: Rombel Aktif ───────────────────────────────────
  const [rombelList, setRombelList] = useState([]);
  const [rombelDipilih, setRombelDipilih] = useState(() => localStorage.getItem(storageKey) || '');
  const [loadRombel, setLoadRombel] = useState(true);
  const [mapelList, setMapelList] = useState([]);
  const [loadMapel, setLoadMapel] = useState(false);

  // ── State: Materi ────────────────────────────────────────
  const [materiList,  setMateriList]  = useState([]);
  const [loadMateri,  setLoadMateri]  = useState(false);
  const [errMateri,   setErrMateri]   = useState('');

  // ── State: Form Upload Materi ────────────────────────────
  const [showFormMateri, setShowFormMateri] = useState(false);
  const [formMateri, setFormMateri] = useState({
    judul: '', deskripsi: '', mapel_id: '', tipe: 'dokumen', url: '',
  });
  const [fileMateri,     setFileMateri]     = useState(null);
  const [uploadLoading,  setUploadLoading]  = useState(false);
  const [uploadFeedback, setUploadFeedback] = useState({ type: '', msg: '' });
  const fileMateriRef = useRef(null);

  // ── State: Tugas ─────────────────────────────────────────
  const [tugasList,   setTugasList]   = useState([]);
  const [loadTugas,   setLoadTugas]   = useState(false);
  const [errTugas,    setErrTugas]    = useState('');
  const [detailTugas, setDetailTugas] = useState(null); // tugas + pengumpulan WB
  const [loadDetail,  setLoadDetail]  = useState(false);

  // ── State: Form Buat Tugas ───────────────────────────────
  const [showFormTugas, setShowFormTugas] = useState(false);
  const [formTugas, setFormTugas] = useState({
    judul: '', deskripsi: '', mapel_id: '', deadline: '', nilai_maks: 100,
  });
  const [tugasLoading,  setTugasLoading]  = useState(false);
  const [tugasFeedback, setTugasFeedback] = useState({ type: '', msg: '' });

  // ── State: Penilaian Tugas ───────────────────────────────
  const [nilaiMap,    setNilaiMap]    = useState({}); // { pengumpulanId: nilai }
  const [feedbackMap, setFeedbackMap] = useState({}); // { pengumpulanId: feedback }
  const [nilaiLoading, setNilaiLoading] = useState(null); // ID pengumpulan yang sedang dinilai

  // ── State: Jadwal ────────────────────────────────────────
  const [jadwalList,  setJadwalList]  = useState([]);
  const [loadJadwal,  setLoadJadwal]  = useState(false);
  const [showFormJadwal, setShowFormJadwal] = useState(false);
  const [formJadwal, setFormJadwal] = useState({
    judul: '', mapel_id: '', waktu_mulai: '', waktu_selesai: '',
    jenis: 'online', link_meeting: '', lokasi: '', catatan: '',
  });
  const [jadwalLoading,  setJadwalLoading]  = useState(false);
  const [jadwalFeedback, setJadwalFeedback] = useState({ type: '', msg: '' });

  // ── Fetch Materi ─────────────────────────────────────────
  const fetchMateri = async (rombelId) => {
    if (!rombelId) return;
    setLoadMateri(true);
    setErrMateri('');
    try {
      const res = await LmsAPI.getMateriByRombel(rombelId);
      setMateriList(res.data.data || []);
    } catch { setErrMateri('Gagal memuat materi.'); }
    finally  { setLoadMateri(false); }
  };

  // ── Fetch Tugas ──────────────────────────────────────────
  const fetchTugas = async (rombelId) => {
    if (!rombelId) return;
    setLoadTugas(true);
    setErrTugas('');
    try {
      const res = await LmsAPI.getTugasByRombel(rombelId);
      setTugasList(res.data.data || []);
    } catch { setErrTugas('Gagal memuat tugas.'); }
    finally  { setLoadTugas(false); }
  };

  // ── Fetch Jadwal ─────────────────────────────────────────
  const fetchJadwal = async (rombelId) => {
    if (!rombelId) return;
    setLoadJadwal(true);
    try {
      const res = await LmsAPI.getJadwalByRombel(rombelId);
      setJadwalList(res.data.data || []);
    } catch {}
    finally { setLoadJadwal(false); }
  };

  const fetchMapelOptions = async (rombelId) => {
    if (!rombelId) {
      setMapelList([]);
      return;
    }
    const rombelAktifDipilih = rombelList.find(r => String(r.id) === String(rombelId));
    try {
      setLoadMapel(true);
      const res = await SiswaAPI.getMapelOptions({
        rombel_id: rombelId,
        jenjang: rombelAktifDipilih?.jenjang || undefined,
      });
      const options = res.data.data || [];
      setMapelList(options);
    } catch {
      setMapelList([]);
    } finally {
      setLoadMapel(false);
    }
  };

  useEffect(() => {
    const fetchRombelOptions = async () => {
      try {
        setLoadRombel(true);
        const res = await SiswaAPI.getRombelOptions();
        const options = res.data.data || [];
        setRombelList(options);

        if (!options.length) {
          setRombelDipilih('');
          return;
        }

        const saved = localStorage.getItem(storageKey) || '';
        const hasSaved = saved && options.some(r => String(r.id) === String(saved));
        const fallback = String(options[0].id);
        const nextSelected = hasSaved ? String(saved) : fallback;
        setRombelDipilih(nextSelected);
      } catch {
        setRombelList([]);
      } finally {
        setLoadRombel(false);
      }
    };

    fetchRombelOptions();
  }, [storageKey]);

  // ── Reload saat rombel berubah ───────────────────────────
  useEffect(() => {
    if (!rombelDipilih) return;
    fetchMateri(rombelDipilih);
    fetchTugas(rombelDipilih);
    fetchJadwal(rombelDipilih);
    fetchMapelOptions(rombelDipilih);
  }, [rombelDipilih]);

  useEffect(() => {
    if (rombelDipilih) {
      localStorage.setItem(storageKey, rombelDipilih);
    } else {
      localStorage.removeItem(storageKey);
    }
  }, [rombelDipilih, storageKey]);

  useEffect(() => {
    if (!mapelList.length) return;
    const defaultMapelId = String(mapelList[0].id);

    setFormMateri(prev => prev.mapel_id ? prev : { ...prev, mapel_id: defaultMapelId });
    setFormTugas(prev => prev.mapel_id ? prev : { ...prev, mapel_id: defaultMapelId });
    setFormJadwal(prev => prev.mapel_id ? prev : { ...prev, mapel_id: defaultMapelId });
  }, [mapelList]);

  // ── Toggle Publish Materi ────────────────────────────────
  const handleTogglePublish = async (id, isPublished) => {
    try {
      const nextPublished = isPublished ? 0 : 1;
      await LmsAPI.togglePublishMateri(id, nextPublished);
      setMateriList(prev => prev.map(m =>
        m.id === id ? { ...m, is_published: nextPublished } : m
      ));
    } catch { alert('Gagal mengubah status publish.'); }
  };

  // ── Upload Materi ────────────────────────────────────────
  const handleUploadMateri = async () => {
    if (!rombelDipilih) { setUploadFeedback({ type: 'error', msg: 'Pilih rombel terlebih dahulu.' }); return; }
    if (!formMateri.mapel_id) { setUploadFeedback({ type: 'error', msg: 'Mapel wajib diisi.' }); return; }
    if (!formMateri.judul) { setUploadFeedback({ type: 'error', msg: 'Judul materi wajib diisi.' }); return; }
    if (formMateri.tipe === 'dokumen' && !fileMateri) { setUploadFeedback({ type: 'error', msg: 'Pilih file untuk diupload.' }); return; }
    if (formMateri.tipe !== 'dokumen' && !formMateri.url) { setUploadFeedback({ type: 'error', msg: 'URL wajib diisi.' }); return; }

    setUploadLoading(true);
    setUploadFeedback({ type: '', msg: '' });
    try {
      const fd = new FormData();
      fd.append('rombel_id', rombelDipilih);
      fd.append('judul',     formMateri.judul);
      fd.append('deskripsi', formMateri.deskripsi);
      fd.append('tipe',      formMateri.tipe);
      if (formMateri.mapel_id) fd.append('mapel_id', formMateri.mapel_id);
      if (formMateri.tipe === 'dokumen' && fileMateri) fd.append('file', fileMateri);
      else fd.append('url', formMateri.url);

      await LmsAPI.createMateri(fd);
      setUploadFeedback({ type: 'success', msg: 'Materi berhasil diupload!' });
      setFormMateri({ judul: '', deskripsi: '', mapel_id: '', tipe: 'dokumen', url: '' });
      setFileMateri(null);
      await fetchMateri(rombelDipilih);
      setTimeout(() => { setShowFormMateri(false); setUploadFeedback({ type: '', msg: '' }); }, 1500);
    } catch (err) {
      setUploadFeedback({ type: 'error', msg: err.response?.data?.message || 'Gagal upload materi.' });
    } finally { setUploadLoading(false); }
  };

  // ── Buat Tugas ───────────────────────────────────────────
  const handleBuatTugas = async () => {
    if (!rombelDipilih) { setTugasFeedback({ type: 'error', msg: 'Pilih rombel terlebih dahulu.' }); return; }
    if (!formTugas.mapel_id || !formTugas.judul || !formTugas.deskripsi || !formTugas.deadline) {
      setTugasFeedback({ type: 'error', msg: 'Mata pelajaran, judul, deskripsi, dan deadline wajib diisi.' }); return;
    }
    setTugasLoading(true);
    setTugasFeedback({ type: '', msg: '' });
    try {
      await LmsAPI.createTugas({ rombel_id: Number(rombelDipilih), ...formTugas });
      setTugasFeedback({ type: 'success', msg: 'Tugas berhasil dibuat!' });
      setFormTugas({ judul: '', deskripsi: '', mapel_id: '', deadline: '', nilai_maks: 100 });
      await fetchTugas(rombelDipilih);
      setTimeout(() => { setShowFormTugas(false); setTugasFeedback({ type: '', msg: '' }); }, 1500);
    } catch (err) {
      setTugasFeedback({ type: 'error', msg: err.response?.data?.message || 'Gagal membuat tugas.' });
    } finally { setTugasLoading(false); }
  };

  // ── Lihat Detail + Pengumpulan Tugas ────────────────────
  const bukaDetailTugas = async (id) => {
    setLoadDetail(true);
    setDetailTugas(null);
    try {
      const res = await LmsAPI.getTugasById(id);
      setDetailTugas(res.data.data);
    } catch { alert('Gagal memuat detail tugas.'); }
    finally { setLoadDetail(false); }
  };

  // ── Nilai Pengumpulan ────────────────────────────────────
  const handleNilai = async (pengumpulanId) => {
    const nilai = nilaiMap[pengumpulanId];
    if (!nilai) { alert('Masukkan nilai terlebih dahulu.'); return; }
    setNilaiLoading(pengumpulanId);
    try {
      await LmsAPI.nilaiTugas(pengumpulanId, {
        nilai: Number(nilai),
        feedback_tutor: feedbackMap[pengumpulanId] || '',
      });
      // Refresh detail tugas
      if (detailTugas) await bukaDetailTugas(detailTugas.id);
    } catch { alert('Gagal menyimpan nilai.'); }
    finally { setNilaiLoading(null); }
  };

  // ── Buat Jadwal ──────────────────────────────────────────
  const handleBuatJadwal = async () => {
    if (!formJadwal.mapel_id || !formJadwal.judul || !formJadwal.waktu_mulai || !formJadwal.waktu_selesai) {
      setJadwalFeedback({ type: 'error', msg: 'Mata pelajaran, judul, dan waktu wajib diisi.' }); return;
    }
    setJadwalLoading(true);
    setJadwalFeedback({ type: '', msg: '' });
    try {
      await LmsAPI.createJadwal({ rombel_id: Number(rombelDipilih), ...formJadwal });
      setJadwalFeedback({ type: 'success', msg: 'Jadwal berhasil dibuat!' });
      setFormJadwal({ judul: '', mapel_id: '', waktu_mulai: '', waktu_selesai: '', jenis: 'online', link_meeting: '', lokasi: '', catatan: '' });
      await fetchJadwal(rombelDipilih);
      setTimeout(() => { setShowFormJadwal(false); setJadwalFeedback({ type: '', msg: '' }); }, 1500);
    } catch (err) {
      setJadwalFeedback({ type: 'error', msg: err.response?.data?.message || 'Gagal membuat jadwal.' });
    } finally { setJadwalLoading(false); }
  };

  const formatWaktu = (w) => w ? new Date(w).toLocaleString('id-ID', { day: '2-digit', month: 'short', year: 'numeric', hour: '2-digit', minute: '2-digit' }) : '—';
  const rombelAktif = rombelList.find(r => String(r.id) === String(rombelDipilih)) || null;

  return (
    <div className="app-layout">
      <Sidebar user={user} />
      <main className="app-main">
        <div className="app-content">

          {/* ── Header ─────────────────────────────────── */}
          <div style={{ marginBottom: '2rem' }}>
            <h1 style={{ fontFamily: 'var(--font-heading)', fontSize: 'var(--text-2xl)', fontWeight: 800 }}>
              Kelas & Materi
            </h1>
            <p style={{ color: 'var(--color-text-muted)', marginTop: 4 }}>
              Kelola materi, tugas, dan jadwal pertemuan untuk kelas Anda.
            </p>
          </div>

          {/* ── Pilih Rombel ─────────────────────────────── */}
          <div className="card" style={{ marginBottom: '1.5rem' }}>
            <div className="mobile-toolbar" style={{ padding: '1rem 1.5rem' }}>
              <div className="mobile-toolbar" style={{ gap: 8, flex: 1 }}>
                <i className="bi bi-collection" style={{ color: 'var(--color-primary)', fontSize: '1.2rem' }} />
                <label style={{ fontWeight: 600, whiteSpace: 'nowrap', fontSize: '0.9rem' }}>Rombel:</label>
                <select
                  className="form-input"
                  value={rombelDipilih}
                  onChange={e => setRombelDipilih(e.target.value)}
                  disabled={loadRombel || rombelList.length === 0}
                  style={{ height: 38, maxWidth: 360 }}
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
            </div>
            {!rombelDipilih && (
              <div style={{ padding: '0 1.5rem 1rem', color: 'var(--color-text-muted)', fontSize: '0.82rem' }}>
                <i className="bi bi-info-circle" style={{ marginRight: 6 }} />
                Pilih nama rombel untuk melihat materi, tugas, dan jadwal kelas tersebut.
              </div>
            )}
          </div>

          {/* ── Navigasi Tab ─────────────────────────────── */}
          {rombelDipilih && (
            <>
              <div className="mobile-tabbar">
                {[
                  { key: 'materi', icon: 'bi-book',                 label: `Materi (${materiList.length})` },
                  { key: 'tugas',  icon: 'bi-pencil-square',         label: `Tugas (${tugasList.length})` },
                  { key: 'jadwal', icon: 'bi-calendar-event',        label: `Jadwal (${jadwalList.length})` },
                ].map(t => (
                  <button
                    key={t.key}
                    onClick={() => setTab(t.key)}
                    style={{
                      background: 'none', border: 'none', cursor: 'pointer',
                      padding: '0.6rem 1.1rem',
                      fontWeight: tab === t.key ? 700 : 500,
                      color: tab === t.key ? 'var(--color-primary)' : 'var(--color-text-muted)',
                      borderBottom: tab === t.key ? '2px solid var(--color-primary)' : '2px solid transparent',
                      marginBottom: -2, fontSize: '0.9rem',
                      display: 'flex', alignItems: 'center', gap: 6,
                    }}
                  >
                    <i className={`bi ${t.icon}`} />{t.label}
                  </button>
                ))}
              </div>

              {/* ════════════════════════════════════════════ */}
              {/* TAB 1: MATERI                               */}
              {/* ════════════════════════════════════════════ */}
              {tab === 'materi' && (
                <div className="card">
                  <div className="card-header">
                    <h3 className="card-title">Daftar Materi</h3>
                    <button className="btn btn-primary" style={{ fontSize: '0.85rem' }}
                      onClick={() => { setShowFormMateri(true); setUploadFeedback({ type: '', msg: '' }); }}>
                      <i className="bi bi-upload" /> Upload Materi
                    </button>
                  </div>

                  {loadMateri ? (
                    <div className="loading-container" style={{ padding: '3rem' }}><div className="spinner" /></div>
                  ) : errMateri ? (
                    <div className="alert alert-danger" style={{ margin: '1.5rem' }}><i className="bi bi-exclamation-triangle" /><span>{errMateri}</span></div>
                  ) : materiList.length === 0 ? (
                    <div className="empty-state">
                      <i className="bi bi-book" />
                      <h3>Belum Ada Materi</h3>
                      <p>Upload materi pertama untuk rombel ini.</p>
                    </div>
                  ) : (
                    <div style={{ padding: '0 1rem 1rem' }}>
                      {materiList.map(m => {
                        const ti = TIPE_ICON[m.tipe] || TIPE_ICON.dokumen;
                        return (
                          <div key={m.id} className="mobile-list-row" style={{
                            padding: '0.9rem 0.75rem',
                            borderBottom: '1px solid var(--color-border)',
                            transition: 'background 0.12s',
                          }}>
                            {/* Ikon Tipe */}
                            <div style={{
                              width: 44, height: 44, borderRadius: 'var(--radius-md)',
                              background: ti.bg, color: ti.color,
                              display: 'flex', alignItems: 'center', justifyContent: 'center',
                              fontSize: '1.25rem', flexShrink: 0,
                            }}>
                              <i className={`bi ${ti.icon}`} />
                            </div>

                            {/* Info */}
                            <div style={{ flex: 1, minWidth: 0 }}>
                              <div style={{ fontWeight: 600, fontSize: '0.9rem', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                                {m.judul}
                              </div>
                              <div style={{ color: 'var(--color-text-muted)', fontSize: '0.78rem', marginTop: 2 }}>
                                {m.nama_mapel || 'Umum'} · Urutan #{m.urutan}
                              </div>
                            </div>

                            {/* Status Publish */}
                            <span className={`badge ${m.is_published ? 'badge-success' : 'badge-neutral'}`}>
                              {m.is_published ? 'Publik' : 'Draft'}
                            </span>

                            {/* Tombol Toggle Publish */}
                            <button
                              className="btn btn-secondary"
                              style={{ fontSize: '0.78rem', padding: '4px 10px', whiteSpace: 'nowrap' }}
                              onClick={() => handleTogglePublish(m.id, m.is_published)}
                            >
                              {m.is_published ? <><i className="bi bi-eye-slash" /> Sembunyikan</> : <><i className="bi bi-eye" /> Publikasikan</>}
                            </button>
                          </div>
                        );
                      })}
                    </div>
                  )}
                </div>
              )}

              {/* ════════════════════════════════════════════ */}
              {/* TAB 2: TUGAS                                */}
              {/* ════════════════════════════════════════════ */}
              {tab === 'tugas' && (
                <>
                  {/* Jika detail tugas terbuka */}
                  {detailTugas ? (
                    <div className="card">
                      <div className="card-header">
                        <div>
                          <button className="btn btn-secondary" style={{ fontSize: '0.8rem', marginRight: 12 }}
                            onClick={() => setDetailTugas(null)}>
                            <i className="bi bi-arrow-left" /> Kembali
                          </button>
                          <span style={{ fontWeight: 700, fontSize: '1rem' }}>{detailTugas.judul}</span>
                        </div>
                        <span className="badge badge-info">
                          {detailTugas.pengumpulan?.length || 0} pengumpulan
                        </span>
                      </div>

                      <div style={{ padding: '0 1rem 1rem' }}>
                        {loadDetail ? (
                          <div className="loading-container" style={{ padding: '2rem' }}><div className="spinner" /></div>
                        ) : !detailTugas.pengumpulan?.length ? (
                          <div className="empty-state" style={{ padding: '2rem' }}>
                            <i className="bi bi-inbox" />
                            <h3>Belum Ada Pengumpulan</h3>
                            <p>WB belum mengumpulkan jawaban untuk tugas ini.</p>
                          </div>
                        ) : detailTugas.pengumpulan.map(p => (
                          <div key={p.id} style={{
                            padding: '1rem 0.75rem',
                            borderBottom: '1px solid var(--color-border)',
                          }}>
                            <div className="mobile-toolbar" style={{ alignItems: 'flex-start' }}>
                              {/* Info WB */}
                              <div style={{ flex: 1, minWidth: 200 }}>
                                <div style={{ fontWeight: 600, fontSize: '0.88rem' }}>{p.nama_wb || p.warga_belajar_id}</div>
                                <div style={{ color: 'var(--color-text-muted)', fontSize: '0.78rem', marginTop: 2 }}>
                                  {new Date(p.submitted_at).toLocaleDateString('id-ID', { day: '2-digit', month: 'short', year: 'numeric', hour: '2-digit', minute: '2-digit' })}
                                </div>
                                {p.catatan_siswa && (
                                  <div style={{ marginTop: 6, fontSize: '0.8rem', color: 'var(--color-text-muted)', fontStyle: 'italic' }}>
                                    "{p.catatan_siswa}"
                                  </div>
                                )}
                                {/* Link file pengumpulan */}
                                {p.path_file && (
                                  <a
                                    href={`http://localhost:3000/${p.path_file}`}
                                    target="_blank" rel="noopener noreferrer"
                                    style={{ fontSize: '0.8rem', color: 'var(--color-primary)', display: 'inline-flex', alignItems: 'center', gap: 4, marginTop: 6 }}
                                  >
                                    <i className="bi bi-file-earmark-arrow-down" /> Unduh File
                                  </a>
                                )}
                              </div>

                              {/* Form Nilai */}
                              <div style={{ display: 'flex', flexDirection: 'column', gap: 6, minWidth: 200 }}>
                                {p.status === 'dinilai' ? (
                                  <div>
                                    <span className="badge badge-success">Sudah Dinilai</span>
                                    <div style={{ fontWeight: 700, fontSize: '1.1rem', marginTop: 4 }}>
                                      Nilai: {p.nilai} / {detailTugas.nilai_maks}
                                    </div>
                                    {p.feedback_tutor && (
                                      <div style={{ fontSize: '0.78rem', color: 'var(--color-text-muted)', marginTop: 2 }}>{p.feedback_tutor}</div>
                                    )}
                                  </div>
                                ) : (
                                  <>
                                    <input
                                      type="number"
                                      className="form-input"
                                      placeholder={`Nilai (0–${detailTugas.nilai_maks})`}
                                      value={nilaiMap[p.id] || ''}
                                      onChange={e => setNilaiMap(prev => ({ ...prev, [p.id]: e.target.value }))}
                                      min={0} max={detailTugas.nilai_maks}
                                      style={{ height: 36, fontSize: '0.85rem' }}
                                    />
                                    <input
                                      type="text"
                                      className="form-input"
                                      placeholder="Feedback (opsional)"
                                      value={feedbackMap[p.id] || ''}
                                      onChange={e => setFeedbackMap(prev => ({ ...prev, [p.id]: e.target.value }))}
                                      style={{ height: 36, fontSize: '0.85rem' }}
                                    />
                                    <button
                                      className="btn btn-primary"
                                      style={{ fontSize: '0.8rem', padding: '6px 14px' }}
                                      disabled={nilaiLoading === p.id}
                                      onClick={() => handleNilai(p.id)}
                                    >
                                      {nilaiLoading === p.id
                                        ? <div className="spinner" style={{ width: 14, height: 14 }} />
                                        : <><i className="bi bi-check2-circle" /> Simpan Nilai</>
                                      }
                                    </button>
                                  </>
                                )}
                              </div>
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>
                  ) : (
                    /* Daftar Tugas */
                    <div className="card">
                      <div className="card-header">
                        <h3 className="card-title">Daftar Tugas</h3>
                        <button className="btn btn-primary" style={{ fontSize: '0.85rem' }}
                          onClick={() => { setShowFormTugas(true); setTugasFeedback({ type: '', msg: '' }); }}>
                          <i className="bi bi-plus-circle" /> Buat Tugas
                        </button>
                      </div>

                      {loadTugas ? (
                        <div className="loading-container" style={{ padding: '3rem' }}><div className="spinner" /></div>
                      ) : tugasList.length === 0 ? (
                        <div className="empty-state">
                          <i className="bi bi-pencil-square" />
                          <h3>Belum Ada Tugas</h3>
                          <p>Buat tugas pertama untuk rombel ini.</p>
                        </div>
                      ) : (
                        <div className="table-wrapper">
                          <table className="table">
                            <thead>
                              <tr>
                                <th>Judul Tugas</th>
                                <th>Deadline</th>
                                <th>Nilai Maks</th>
                                <th>Aksi</th>
                              </tr>
                            </thead>
                            <tbody>
                              {tugasList.map(t => {
                                const lewat = new Date(t.deadline) < new Date();
                                return (
                                  <tr key={t.id}>
                                    <td>
                                      <div style={{ fontWeight: 600, fontSize: '0.9rem' }}>{t.judul}</div>
                                      <div style={{ color: 'var(--color-text-muted)', fontSize: '0.78rem', marginTop: 2 }}>
                                        {t.nama_mapel || 'Umum'}
                                      </div>
                                    </td>
                                    <td style={{ fontSize: '0.88rem', color: lewat ? 'var(--color-danger)' : 'inherit' }}>
                                      {lewat && <i className="bi bi-exclamation-circle" style={{ marginRight: 4 }} />}
                                      {formatWaktu(t.deadline)}
                                    </td>
                                    <td style={{ fontWeight: 700 }}>{t.nilai_maks}</td>
                                    <td>
                                      <button
                                        className="btn btn-secondary"
                                        style={{ fontSize: '0.8rem', padding: '4px 10px' }}
                                        onClick={() => bukaDetailTugas(t.id)}
                                      >
                                        <i className="bi bi-list-check" /> Nilai Pengumpulan
                                      </button>
                                    </td>
                                  </tr>
                                );
                              })}
                            </tbody>
                          </table>
                        </div>
                      )}
                    </div>
                  )}
                </>
              )}

              {/* ════════════════════════════════════════════ */}
              {/* TAB 3: JADWAL                               */}
              {/* ════════════════════════════════════════════ */}
              {tab === 'jadwal' && (
                <div className="card">
                  <div className="card-header">
                    <h3 className="card-title">Jadwal Pertemuan</h3>
                    <button className="btn btn-primary" style={{ fontSize: '0.85rem' }}
                      onClick={() => { setShowFormJadwal(true); setJadwalFeedback({ type: '', msg: '' }); }}>
                      <i className="bi bi-plus-circle" /> Buat Jadwal
                    </button>
                  </div>

                  {loadJadwal ? (
                    <div className="loading-container" style={{ padding: '3rem' }}><div className="spinner" /></div>
                  ) : jadwalList.length === 0 ? (
                    <div className="empty-state">
                      <i className="bi bi-calendar-event" />
                      <h3>Belum Ada Jadwal</h3>
                      <p>Tambahkan jadwal pertemuan untuk rombel ini.</p>
                    </div>
                  ) : (
                    <div style={{ padding: '0 1rem 1rem' }}>
                      {jadwalList.map(j => (
                        <div key={j.id} style={{
                          padding: '1rem 0.75rem',
                          borderBottom: '1px solid var(--color-border)',
                          display: 'flex', alignItems: 'flex-start', gap: '1rem',
                        }}>
                          <div style={{
                            width: 44, height: 44, borderRadius: 'var(--radius-md)',
                            background: j.jenis === 'online' ? '#DBEAFE' : '#D1FAE5',
                            color:      j.jenis === 'online' ? '#1E40AF' : '#065F46',
                            display: 'flex', alignItems: 'center', justifyContent: 'center',
                            fontSize: '1.3rem', flexShrink: 0,
                          }}>
                            <i className={`bi ${j.jenis === 'online' ? 'bi-camera-video' : 'bi-building'}`} />
                          </div>
                          <div style={{ flex: 1 }}>
                            <div style={{ fontWeight: 600, fontSize: '0.9rem' }}>{j.judul}</div>
                            <div style={{ color: 'var(--color-text-muted)', fontSize: '0.8rem', marginTop: 3 }}>
                              {formatWaktu(j.waktu_mulai)} — {formatWaktu(j.waktu_selesai)}
                            </div>
                            {j.link_meeting && (
                              <a href={j.link_meeting} target="_blank" rel="noopener noreferrer"
                                style={{ fontSize: '0.8rem', color: 'var(--color-primary)', marginTop: 4, display: 'inline-flex', alignItems: 'center', gap: 4 }}>
                                <i className="bi bi-camera-video" /> Link Meeting
                              </a>
                            )}
                            {j.lokasi && (
                              <div style={{ fontSize: '0.8rem', color: 'var(--color-text-muted)', marginTop: 4 }}>
                                <i className="bi bi-geo-alt" style={{ marginRight: 4 }} />{j.lokasi}
                              </div>
                            )}
                          </div>
                          <span className={`badge ${j.jenis === 'online' ? 'badge-info' : 'badge-success'}`}>
                            {j.jenis === 'online' ? 'Online' : 'Tatap Muka'}
                          </span>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              )}
            </>
          )}

        </div>
      </main>

      {/* ── Modal Upload Materi ─────────────────────────── */}
      {showFormMateri && (
        <Modal title={<><i className="bi bi-upload" style={{ color: 'var(--color-primary)', marginRight: 8 }} />Upload Materi</>}
          onClose={() => setShowFormMateri(false)}>
          <div className="form-group">
            <label className="form-label">Tipe Konten <span style={{ color: 'var(--color-danger)' }}>*</span></label>
            <div className="mobile-choice-row">
              {[
                { val: 'dokumen',        label: '📄 Dokumen' },
                { val: 'video_link',     label: '▶️ Video' },
                { val: 'link_eksternal', label: '🔗 Link' },
              ].map(opt => (
                <button key={opt.val} type="button"
                  onClick={() => setFormMateri(p => ({ ...p, tipe: opt.val }))}
                  style={{
                    flex: 1, padding: '8px 4px', borderRadius: 'var(--radius-sm)',
                    border: `2px solid ${formMateri.tipe === opt.val ? 'var(--color-primary)' : 'var(--color-border)'}`,
                    background: formMateri.tipe === opt.val ? 'var(--color-primary-light)' : 'transparent',
                    cursor: 'pointer', fontSize: '0.82rem', fontWeight: formMateri.tipe === opt.val ? 700 : 400,
                  }}>{opt.label}</button>
              ))}
            </div>
          </div>
          <div className="form-group">
            <label className="form-label">Rombel Aktif</label>
            <input
              type="text"
              className="form-input"
              value={rombelAktif?.nama_rombel || ''}
              disabled
            />
          </div>
          <div className="form-group">
            <label className="form-label">Mata Pelajaran <span style={{ color: 'var(--color-danger)' }}>*</span></label>
            <select
              className="form-input"
              value={formMateri.mapel_id}
              onChange={e => setFormMateri(p => ({ ...p, mapel_id: e.target.value }))}
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
          <div className="form-group">
            <label className="form-label">Judul <span style={{ color: 'var(--color-danger)' }}>*</span></label>
            <input type="text" className="form-input" placeholder="Judul materi..." value={formMateri.judul} onChange={e => setFormMateri(p => ({ ...p, judul: e.target.value }))} />
          </div>
          <div className="form-group">
            <label className="form-label">Deskripsi</label>
            <textarea className="form-input" rows={2} placeholder="Deskripsi singkat..." value={formMateri.deskripsi} onChange={e => setFormMateri(p => ({ ...p, deskripsi: e.target.value }))} style={{ resize: 'vertical' }} />
          </div>
          {formMateri.tipe === 'dokumen' ? (
            <div className="form-group">
              <label className="form-label">File <span style={{ color: 'var(--color-danger)' }}>*</span></label>
              <input ref={fileMateriRef} type="file" accept=".pdf,.doc,.docx,video/mp4" style={{ display: 'none' }} onChange={e => setFileMateri(e.target.files[0])} />
              <button type="button" className="btn btn-secondary" onClick={() => fileMateriRef.current?.click()} style={{ width: '100%' }}>
                <i className="bi bi-upload" /> {fileMateri ? fileMateri.name : 'Pilih File (PDF/DOC/MP4)'}
              </button>
            </div>
          ) : (
            <div className="form-group">
              <label className="form-label">URL <span style={{ color: 'var(--color-danger)' }}>*</span></label>
              <input type="url" className="form-input" placeholder="https://..." value={formMateri.url} onChange={e => setFormMateri(p => ({ ...p, url: e.target.value }))} />
            </div>
          )}
          {uploadFeedback.msg && <div className={`alert ${uploadFeedback.type === 'success' ? 'alert-success' : 'alert-danger'}`} style={{ marginBottom: '1rem' }}><i className={`bi ${uploadFeedback.type === 'success' ? 'bi-check-circle' : 'bi-exclamation-circle'}`} /><span>{uploadFeedback.msg}</span></div>}
          <div className="mobile-actions">
            <button className="btn btn-secondary" onClick={() => setShowFormMateri(false)}>Batal</button>
            <button className="btn btn-primary" onClick={handleUploadMateri} disabled={uploadLoading}>
              {uploadLoading ? <><div className="spinner" style={{ width: 16, height: 16 }} /> Mengupload...</> : <><i className="bi bi-upload" /> Upload</>}
            </button>
          </div>
        </Modal>
      )}

      {/* ── Modal Buat Tugas ─────────────────────────────── */}
      {showFormTugas && (
        <Modal title={<><i className="bi bi-pencil-square" style={{ color: 'var(--color-primary)', marginRight: 8 }} />Buat Tugas Baru</>}
          onClose={() => setShowFormTugas(false)}>
          <div className="form-group">
            <label className="form-label">Judul Tugas <span style={{ color: 'var(--color-danger)' }}>*</span></label>
            <input type="text" className="form-input" placeholder="Judul tugas..." value={formTugas.judul} onChange={e => setFormTugas(p => ({ ...p, judul: e.target.value }))} />
          </div>
          <div className="form-group">
            <label className="form-label">Mata Pelajaran <span style={{ color: 'var(--color-danger)' }}>*</span></label>
            <select
              className="form-input"
              value={formTugas.mapel_id}
              onChange={e => setFormTugas(p => ({ ...p, mapel_id: e.target.value }))}
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
          <div className="form-group">
            <label className="form-label">Deskripsi / Instruksi <span style={{ color: 'var(--color-danger)' }}>*</span></label>
            <textarea className="form-input" rows={3} placeholder="Instruksi lengkap tugas..." value={formTugas.deskripsi} onChange={e => setFormTugas(p => ({ ...p, deskripsi: e.target.value }))} style={{ resize: 'vertical' }} />
          </div>
          <div className="grid-cols-2" style={{ gap: '1rem' }}>
            <div className="form-group">
              <label className="form-label">Deadline <span style={{ color: 'var(--color-danger)' }}>*</span></label>
              <input type="datetime-local" className="form-input" value={formTugas.deadline} onChange={e => setFormTugas(p => ({ ...p, deadline: e.target.value }))} />
            </div>
            <div className="form-group">
              <label className="form-label">Nilai Maksimum</label>
              <input type="number" className="form-input" value={formTugas.nilai_maks} onChange={e => setFormTugas(p => ({ ...p, nilai_maks: e.target.value }))} min={1} max={1000} />
            </div>
          </div>
          {tugasFeedback.msg && <div className={`alert ${tugasFeedback.type === 'success' ? 'alert-success' : 'alert-danger'}`} style={{ marginBottom: '1rem' }}><i className={`bi ${tugasFeedback.type === 'success' ? 'bi-check-circle' : 'bi-exclamation-circle'}`} /><span>{tugasFeedback.msg}</span></div>}
          <div className="mobile-actions">
            <button className="btn btn-secondary" onClick={() => setShowFormTugas(false)}>Batal</button>
            <button className="btn btn-primary" onClick={handleBuatTugas} disabled={tugasLoading}>
              {tugasLoading ? <><div className="spinner" style={{ width: 16, height: 16 }} /> Membuat...</> : <><i className="bi bi-check2" /> Buat Tugas</>}
            </button>
          </div>
        </Modal>
      )}

      {/* ── Modal Buat Jadwal ─────────────────────────────── */}
      {showFormJadwal && (
        <Modal title={<><i className="bi bi-calendar-plus" style={{ color: 'var(--color-primary)', marginRight: 8 }} />Buat Jadwal Pertemuan</>}
          onClose={() => setShowFormJadwal(false)}>
          <div className="form-group">
            <label className="form-label">Topik / Judul <span style={{ color: 'var(--color-danger)' }}>*</span></label>
            <input type="text" className="form-input" placeholder="Topik pertemuan..." value={formJadwal.judul} onChange={e => setFormJadwal(p => ({ ...p, judul: e.target.value }))} />
          </div>
          <div className="form-group">
            <label className="form-label">Mata Pelajaran <span style={{ color: 'var(--color-danger)' }}>*</span></label>
            <select
              className="form-input"
              value={formJadwal.mapel_id}
              onChange={e => setFormJadwal(p => ({ ...p, mapel_id: e.target.value }))}
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
          <div className="form-group">
            <label className="form-label">Jenis Pertemuan</label>
            <div className="mobile-choice-row">
              {['online', 'tatap_muka'].map(j => (
                <button key={j} type="button" onClick={() => setFormJadwal(p => ({ ...p, jenis: j }))}
                  style={{
                    flex: 1, padding: '8px', borderRadius: 'var(--radius-sm)',
                    border: `2px solid ${formJadwal.jenis === j ? 'var(--color-primary)' : 'var(--color-border)'}`,
                    background: formJadwal.jenis === j ? 'var(--color-primary-light)' : 'transparent',
                    cursor: 'pointer', fontSize: '0.85rem', fontWeight: formJadwal.jenis === j ? 700 : 400,
                  }}>
                  {j === 'online' ? '🎥 Online' : '🏫 Tatap Muka'}
                </button>
              ))}
            </div>
          </div>
          <div className="grid-cols-2" style={{ gap: '1rem' }}>
            <div className="form-group">
              <label className="form-label">Waktu Mulai <span style={{ color: 'var(--color-danger)' }}>*</span></label>
              <input type="datetime-local" className="form-input" value={formJadwal.waktu_mulai} onChange={e => setFormJadwal(p => ({ ...p, waktu_mulai: e.target.value }))} />
            </div>
            <div className="form-group">
              <label className="form-label">Waktu Selesai <span style={{ color: 'var(--color-danger)' }}>*</span></label>
              <input type="datetime-local" className="form-input" value={formJadwal.waktu_selesai} onChange={e => setFormJadwal(p => ({ ...p, waktu_selesai: e.target.value }))} />
            </div>
          </div>
          {formJadwal.jenis === 'online' ? (
            <div className="form-group">
              <label className="form-label">Link Meeting</label>
              <input type="url" className="form-input" placeholder="https://meet.google.com/..." value={formJadwal.link_meeting} onChange={e => setFormJadwal(p => ({ ...p, link_meeting: e.target.value }))} />
            </div>
          ) : (
            <div className="form-group">
              <label className="form-label">Lokasi / Ruangan</label>
              <input type="text" className="form-input" placeholder="Ruang Kelas 3A..." value={formJadwal.lokasi} onChange={e => setFormJadwal(p => ({ ...p, lokasi: e.target.value }))} />
            </div>
          )}
          {jadwalFeedback.msg && <div className={`alert ${jadwalFeedback.type === 'success' ? 'alert-success' : 'alert-danger'}`} style={{ marginBottom: '1rem' }}><i className={`bi ${jadwalFeedback.type === 'success' ? 'bi-check-circle' : 'bi-exclamation-circle'}`} /><span>{jadwalFeedback.msg}</span></div>}
          <div className="mobile-actions">
            <button className="btn btn-secondary" onClick={() => setShowFormJadwal(false)}>Batal</button>
            <button className="btn btn-primary" onClick={handleBuatJadwal} disabled={jadwalLoading}>
              {jadwalLoading ? <><div className="spinner" style={{ width: 16, height: 16 }} /> Menyimpan...</> : <><i className="bi bi-check2" /> Simpan Jadwal</>}
            </button>
          </div>
        </Modal>
      )}
    </div>
  );
}

// ── Komponen Modal Generik ───────────────────────────────────
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
          <button onClick={onClose} style={{ background: 'none', border: 'none', cursor: 'pointer', fontSize: '1.2rem', color: 'var(--color-text-muted)' }}><i className="bi bi-x-lg" /></button>
        </div>
        <div className="mobile-modal-body">{children}</div>
      </div>
    </div>
  );
}

export default KelasTutor;
