import { useState, useEffect, useCallback } from 'react';
import Sidebar from '../../components/Sidebar.jsx';
import { SiswaAPI, UjianAPI } from '../../services/api.js';

function UjianSiswa() {
  const user = JSON.parse(localStorage.getItem('pkbm_user') || '{}');

  const [profil, setProfil] = useState(null);
  const [mode, setMode] = useState('daftar');
  const [paketList, setPaketList] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  const [sesi, setSesi] = useState(null);
  const [soalIndex, setSoalIndex] = useState(0);
  const [jawaban, setJawaban] = useState({});
  const [sisaWaktu, setSisaWaktu] = useState(0);
  const [submitting, setSubmitting] = useState(false);
  const [hasilAkhir, setHasilAkhir] = useState(null);

  useEffect(() => {
    const fetchData = async () => {
      setLoading(true);
      setError('');
      try {
        const profilRes = await SiswaAPI.getProfilSaya();
        const profilSaya = profilRes.data.data || null;
        setProfil(profilSaya);

        if (!profilSaya?.rombel_id) {
          setPaketList([]);
          return;
        }

        localStorage.setItem('pkbm_user', JSON.stringify({
          ...user,
          rombel_id: profilSaya.rombel_id,
          nama_rombel: profilSaya.nama_rombel,
        }));

        const paketRes = await UjianAPI.getPaketByRombel(profilSaya.rombel_id);
        setPaketList(paketRes.data.data || []);
      } catch {
        setError('Gagal memuat daftar ujian.');
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, []); // eslint-disable-line react-hooks/exhaustive-deps

  const handleSubmitUjian = useCallback(async () => {
    if (!sesi?.id || submitting) return;
    setSubmitting(true);
    try {
      const res = await UjianAPI.submitUjian(sesi.id);
      setHasilAkhir(res.data.data);
      setMode('selesai');
    } catch (err) {
      alert(err.response?.data?.message || 'Gagal submit ujian.');
    } finally {
      setSubmitting(false);
    }
  }, [sesi, submitting]);

  useEffect(() => {
    if (mode !== 'kerjakan' || sisaWaktu <= 0) return;

    const tick = setInterval(() => {
      setSisaWaktu((prev) => {
        if (prev <= 1) {
          clearInterval(tick);
          handleSubmitUjian();
          return 0;
        }
        return prev - 1;
      });
    }, 1000);

    return () => clearInterval(tick);
  }, [mode, sisaWaktu, handleSubmitUjian]);

  const handleMulaiUjian = async (paketId, durasiMenit) => {
    try {
      const res = await UjianAPI.mulaiUjian(paketId);
      const data = res.data.data;
      setSesi(data);
      setJawaban(data.jawaban || {});
      setSoalIndex(0);
      setSisaWaktu(Number(data.durasi_menit || durasiMenit || 0) * 60);
      setMode('kerjakan');
    } catch (err) {
      alert(err.response?.data?.message || 'Gagal memulai ujian.');
    }
  };

  const handleJawab = async (soalId, jawab) => {
    setJawaban((prev) => ({ ...prev, [soalId]: jawab }));
    try {
      await UjianAPI.simpanJawaban(sesi.id, { soal_id: soalId, jawaban: jawab });
    } catch {
      // Simpan lokal dulu jika request gagal.
    }
  };

  const formatTimer = (detik) => {
    const m = Math.floor(detik / 60).toString().padStart(2, '0');
    const s = (detik % 60).toString().padStart(2, '0');
    return `${m}:${s}`;
  };

  const warnaTimer = sisaWaktu > 300 ? 'var(--color-success)'
    : sisaWaktu > 60 ? 'var(--color-warning)'
      : 'var(--color-danger)';

  if (mode === 'daftar') {
    return (
      <div className="app-layout">
        <Sidebar user={user} />
        <main className="app-main">
          <div className="app-content">
            <div style={{ marginBottom: '2rem' }}>
              <h1 style={{ fontFamily: 'var(--font-heading)', fontSize: 'var(--text-2xl)', fontWeight: 800 }}>
                Ujian Online
              </h1>
              <p style={{ color: 'var(--color-text-muted)', marginTop: 4 }}>
                Pilih ujian yang ingin Anda kerjakan{profil?.nama_rombel ? ` untuk ${profil.nama_rombel}` : ''}.
              </p>
            </div>

            {loading && <div className="loading-container"><div className="spinner"></div></div>}
            {!loading && error && <div className="alert alert-danger"><i className="bi bi-exclamation-triangle-fill"></i><span>{error}</span></div>}

            {!loading && !error && (
              paketList.length === 0 ? (
                <div className="card"><div className="empty-state">
                  <i className="bi bi-clipboard"></i>
                  <h3>Belum Ada Ujian</h3>
                  <p>Tutor belum membuat paket ujian aktif untuk rombel Anda.</p>
                </div></div>
              ) : (
                <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
                  {paketList.map((paket) => (
                    <div key={paket.id} className="card" style={{ padding: '1.25rem' }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
                        <div style={{
                          width: 44, height: 44, borderRadius: 'var(--radius-md)', flexShrink: 0,
                          background: paket.sesi_saya ? '#D1FAE5' : 'var(--color-primary-light)',
                          color: paket.sesi_saya ? 'var(--color-success)' : 'var(--color-primary)',
                          display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '1.2rem',
                        }}>
                          <i className={`bi ${paket.sesi_saya ? 'bi-patch-check-fill' : 'bi-file-earmark-text'}`}></i>
                        </div>

                        <div style={{ flex: 1 }}>
                          <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 4, flexWrap: 'wrap' }}>
                            <span style={{ fontWeight: 700 }}>{paket.judul}</span>
                            <span className={`badge ${paket.sumber_ujian === 'google_form' ? 'badge-warning' : 'badge-success'}`}>
                              {paket.sumber_ujian === 'google_form' ? 'Google Form' : 'Internal'}
                            </span>
                            {paket.sesi_saya && (
                              <span className="badge badge-success">
                                {paket.sesi_saya.nilai_total != null
                                  ? `Nilai: ${paket.sesi_saya.nilai_total}`
                                  : 'Sudah Dikerjakan'}
                              </span>
                            )}
                          </div>
                          <div style={{ display: 'flex', gap: 16, flexWrap: 'wrap', fontSize: 'var(--text-xs)', color: 'var(--color-text-muted)' }}>
                            <span><i className="bi bi-question-circle"></i> {paket.jumlah_soal} soal</span>
                            <span><i className="bi bi-clock"></i> {paket.durasi_menit} menit</span>
                            {paket.jenis && <span><i className="bi bi-tag"></i> {paket.jenis.toUpperCase()}</span>}
                            {paket.nama_mapel && <span><i className="bi bi-book"></i> {paket.nama_mapel}</span>}
                          </div>
                        </div>

                        {paket.sesi_saya ? (
                          <span style={{ fontSize: 'var(--text-xs)', color: 'var(--color-text-muted)' }}>✓ Selesai</span>
                        ) : paket.sumber_ujian === 'google_form' ? (
                          <a
                            className="btn btn-primary"
                            style={{ flexShrink: 0 }}
                            href={paket.link_google_form}
                            target="_blank"
                            rel="noopener noreferrer"
                          >
                            <i className="bi bi-box-arrow-up-right"></i> Buka Google Form
                          </a>
                        ) : (
                          <button
                            className="btn btn-primary"
                            style={{ flexShrink: 0 }}
                            onClick={() => {
                              if (window.confirm(`Mulai ujian "${paket.judul}"?\nDurasi: ${paket.durasi_menit} menit.\n\nPastikan koneksi internet Anda stabil.`)) {
                                handleMulaiUjian(paket.id, paket.durasi_menit);
                              }
                            }}
                          >
                            <i className="bi bi-play-fill"></i> Mulai
                          </button>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              )
            )}
          </div>
        </main>
      </div>
    );
  }

  if (mode === 'kerjakan' && sesi) {
    const soalList = sesi.soal || [];
    const soalAktif = soalList[soalIndex];
    const totalSoal = soalList.length;
    const sudahJawab = Object.keys(jawaban).filter((key) => {
      const nilai = jawaban[key];
      return nilai !== undefined && nilai !== null && String(nilai).trim() !== '';
    }).length;

    return (
      <div style={{ minHeight: '100vh', background: 'var(--color-bg)', display: 'flex', flexDirection: 'column' }}>
        <div style={{
          position: 'sticky', top: 0, zIndex: 50,
          background: 'white', borderBottom: '2px solid var(--color-border)',
          padding: '0.75rem 1.5rem',
          display: 'flex', alignItems: 'center', gap: '1rem',
        }}>
          <span style={{ fontFamily: 'var(--font-heading)', fontWeight: 800, fontSize: 'var(--text-lg)', flex: 1 }}>
            {sesi.judul || 'Ujian Sedang Berlangsung'}
          </span>

          <span style={{ fontSize: 'var(--text-sm)', color: 'var(--color-text-muted)', fontWeight: 600 }}>
            {sudahJawab} / {totalSoal} dijawab
          </span>

          <div style={{
            display: 'flex', alignItems: 'center', gap: 6,
            background: sisaWaktu <= 60 ? '#FEE2E2' : 'var(--color-primary-light)',
            color: warnaTimer,
            padding: '0.4rem 0.9rem', borderRadius: 'var(--radius-md)',
            fontFamily: 'var(--font-heading)', fontWeight: 800, fontSize: 'var(--text-lg)',
          }}>
            <i className="bi bi-clock-fill"></i>
            {formatTimer(sisaWaktu)}
          </div>
        </div>

        <div style={{ flex: 1, maxWidth: 720, margin: '2rem auto', padding: '0 1.5rem', width: '100%' }}>
          <div style={{ display: 'flex', flexWrap: 'wrap', gap: 6, marginBottom: '1.5rem' }}>
            {soalList.map((item, index) => (
              <button
                key={item.id}
                onClick={() => setSoalIndex(index)}
                style={{
                  width: 34, height: 34, borderRadius: 'var(--radius-sm)',
                  border: `2px solid ${index === soalIndex ? 'var(--color-primary)' : jawaban[item.id] ? 'var(--color-success)' : 'var(--color-border)'}`,
                  background: index === soalIndex ? 'var(--color-primary)' : jawaban[item.id] ? '#D1FAE5' : 'white',
                  color: index === soalIndex ? 'white' : 'var(--color-text)',
                  fontWeight: 700, fontSize: 'var(--text-xs)',
                  cursor: 'pointer', transition: 'all 0.15s',
                }}
              >
                {index + 1}
              </button>
            ))}
          </div>

          {soalAktif && (
            <div className="card" style={{ marginBottom: '1.5rem' }}>
              <div style={{ marginBottom: '1.25rem' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 8 }}>
                  <span className="badge badge-neutral">Soal {soalIndex + 1} dari {totalSoal}</span>
                  <span className="badge badge-info">{soalAktif.tipe === 'essay' ? 'Uraian' : 'Pilihan Ganda'}</span>
                </div>
                <p style={{ fontWeight: 700, fontSize: 'var(--text-base)', lineHeight: 1.7 }}>
                  {soalAktif.pertanyaan}
                </p>
              </div>

              {soalAktif.tipe === 'pilihan_ganda' && soalAktif.pilihan?.length > 0 && (
                <div style={{ display: 'flex', flexDirection: 'column', gap: '0.6rem' }}>
                  {soalAktif.pilihan.map((opsi, index) => {
                    const huruf = opsi.kunci || 'ABCDE'[index];
                    const dipilih = jawaban[soalAktif.id] === huruf;
                    return (
                      <button
                        key={huruf}
                        onClick={() => handleJawab(soalAktif.id, huruf)}
                        style={{
                          display: 'flex', alignItems: 'center', gap: '0.75rem',
                          padding: '0.85rem 1rem', borderRadius: 'var(--radius-md)',
                          border: `2px solid ${dipilih ? 'var(--color-primary)' : 'var(--color-border)'}`,
                          background: dipilih ? 'var(--color-primary-light)' : 'white',
                          cursor: 'pointer', textAlign: 'left', width: '100%',
                          transition: 'all 0.15s', fontSize: 'var(--text-sm)',
                        }}
                      >
                        <span style={{
                          width: 28, height: 28, borderRadius: '50%', flexShrink: 0,
                          display: 'flex', alignItems: 'center', justifyContent: 'center',
                          background: dipilih ? 'var(--color-primary)' : 'var(--color-bg)',
                          color: dipilih ? 'white' : 'var(--color-text)',
                          fontWeight: 800, fontSize: 'var(--text-xs)',
                        }}>
                          {huruf}
                        </span>
                        {opsi.teks || opsi}
                      </button>
                    );
                  })}
                </div>
              )}

              {soalAktif.tipe === 'essay' && (
                <textarea
                  className="form-input"
                  rows={5}
                  placeholder="Tulis jawaban Anda di sini..."
                  value={jawaban[soalAktif.id] || ''}
                  onChange={(e) => handleJawab(soalAktif.id, e.target.value)}
                  style={{ resize: 'vertical' }}
                />
              )}
            </div>
          )}

          <div style={{ display: 'flex', justifyContent: 'space-between', gap: '0.75rem' }}>
            <button
              className="btn btn-secondary"
              onClick={() => setSoalIndex((index) => Math.max(0, index - 1))}
              disabled={soalIndex === 0}
            >
              <i className="bi bi-arrow-left"></i> Sebelumnya
            </button>

            {soalIndex < totalSoal - 1 ? (
              <button
                className="btn btn-primary"
                onClick={() => setSoalIndex((index) => Math.min(totalSoal - 1, index + 1))}
              >
                Berikutnya <i className="bi bi-arrow-right"></i>
              </button>
            ) : (
              <button
                className="btn btn-primary"
                style={{ background: 'var(--color-success)' }}
                onClick={() => {
                  const belum = totalSoal - sudahJawab;
                  if (belum > 0 && !window.confirm(`Masih ada ${belum} soal yang belum dijawab. Submit sekarang?`)) {
                    return;
                  }
                  handleSubmitUjian();
                }}
                disabled={submitting}
              >
                {submitting ? <><span className="spinner-sm"></span> Menyimpan...</> : <><i className="bi bi-send-fill"></i> Submit Ujian</>}
              </button>
            )}
          </div>
        </div>
      </div>
    );
  }

  if (mode === 'selesai') {
    const nilai = hasilAkhir?.nilai_akhir ?? hasilAkhir?.nilai_total;
    const isLulus = hasilAkhir?.is_lulus;
    const lulus = isLulus == null ? nilai != null && nilai >= 70 : Number(isLulus) === 1;

    return (
      <div className="app-layout">
        <Sidebar user={user} />
        <main className="app-main">
          <div className="app-content" style={{ maxWidth: 560, margin: '0 auto' }}>
            <div className="card" style={{ textAlign: 'center', padding: '2.5rem' }}>
              <div style={{
                width: 80, height: 80, borderRadius: '50%',
                background: lulus ? '#D1FAE5' : '#FEE2E2',
                color: lulus ? 'var(--color-success)' : 'var(--color-danger)',
                display: 'flex', alignItems: 'center', justifyContent: 'center',
                fontSize: '2.5rem', margin: '0 auto 1.5rem',
              }}>
                <i className={`bi ${lulus ? 'bi-trophy-fill' : 'bi-emoji-neutral-fill'}`}></i>
              </div>

              <h2 style={{ fontFamily: 'var(--font-heading)', fontWeight: 800, marginBottom: '0.5rem' }}>
                Ujian Selesai!
              </h2>
              <p style={{ color: 'var(--color-text-muted)', marginBottom: '2rem' }}>
                Jawaban Anda telah berhasil disimpan.
              </p>

              {nilai != null && (
                <div style={{ marginBottom: '1.5rem' }}>
                  <p style={{ fontSize: 'var(--text-sm)', color: 'var(--color-text-muted)', marginBottom: 8 }}>Nilai Akhir Anda</p>
                  <div style={{ fontFamily: 'var(--font-heading)', fontSize: '4rem', fontWeight: 900, color: lulus ? 'var(--color-success)' : 'var(--color-danger)', lineHeight: 1 }}>
                    {nilai}
                  </div>
                  <div style={{ marginTop: 8 }}>
                    <span className={`badge ${lulus ? 'badge-success' : 'badge-danger'}`} style={{ fontSize: '0.75rem' }}>
                      {lulus ? '✓ Lulus KKM' : '✗ Belum mencapai KKM'}
                    </span>
                  </div>
                </div>
              )}

              {nilai == null && (
                <div className="alert alert-info" style={{ marginBottom: '1.5rem' }}>
                  <i className="bi bi-info-circle-fill"></i>
                  <span>Nilai akan muncul setelah Tutor selesai mengoreksi soal uraian.</span>
                </div>
              )}

              <button className="btn btn-primary" onClick={() => { setMode('daftar'); setHasilAkhir(null); }}>
                <i className="bi bi-arrow-left"></i> Kembali ke Daftar Ujian
              </button>
            </div>
          </div>
        </main>
      </div>
    );
  }

  return null;
}

export default UjianSiswa;
