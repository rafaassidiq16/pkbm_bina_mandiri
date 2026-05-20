// ============================================================
// src/pages/admin/SpmbAdmin.jsx - Verifikasi Pendaftar SPMB
// ============================================================

import { useEffect, useState } from 'react';
import Sidebar from '../../components/Sidebar.jsx';
import { SiswaAPI, SpmbAPI } from '../../services/api.js';

function SpmbAdmin() {
  const user = JSON.parse(localStorage.getItem('pkbm_user') || '{}');

  const [list, setList] = useState([]);
  const [stat, setStat] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [filterStatus, setFilterStatus] = useState('pending');

  const [detail, setDetail] = useState(null);
  const [loadDetail, setLoadDetail] = useState(false);
  const [rombelOptions, setRombelOptions] = useState([]);
  const [selectedRombelId, setSelectedRombelId] = useState('');
  const [loadingRombel, setLoadingRombel] = useState(false);

  const [catatan, setCatatan] = useState('');
  const [processing, setProcessing] = useState(false);

  useEffect(() => {
    const fetchAll = async () => {
      try {
        const [resList, resStat] = await Promise.all([
          SpmbAPI.getAll({ status: filterStatus || undefined }),
          SpmbAPI.getStatistik(),
        ]);
        setList(resList.data.data || []);
        setStat(resStat.data.data);
      } catch {
        setError('Gagal memuat data SPMB.');
      } finally {
        setLoading(false);
      }
    };

    fetchAll();
  }, [filterStatus]);

  const fetchRombelOptions = async (jenjang) => {
    if (!jenjang) {
      setRombelOptions([]);
      setSelectedRombelId('');
      return;
    }

    setLoadingRombel(true);
    try {
      const res = await SiswaAPI.getRombelOptions({ jenjang });
      setRombelOptions(res.data.data || []);
      setSelectedRombelId('');
    } catch {
      setRombelOptions([]);
      alert('Gagal memuat daftar rombel.');
    } finally {
      setLoadingRombel(false);
    }
  };

  const bukaDetail = async (id) => {
    setLoadDetail(true);
    setDetail(null);
    setCatatan('');
    setRombelOptions([]);
    setSelectedRombelId('');

    try {
      const res = await SpmbAPI.getById(id);
      const detailData = res.data.data;
      setDetail(detailData);

      if (detailData?.status === 'pending') {
        await fetchRombelOptions(detailData.jenjang_daftar);
      }
    } catch {
      alert('Gagal memuat detail pendaftar.');
    } finally {
      setLoadDetail(false);
    }
  };

  const handleVerifikasiBerkas = async (berkasId, statusVerifikasi) => {
    try {
      await SpmbAPI.verifikasiBerkas(berkasId, { status_verifikasi: statusVerifikasi });
      if (detail) await bukaDetail(detail.id);
    } catch (err) {
      alert(err.response?.data?.message || 'Gagal verifikasi berkas.');
    }
  };

  const handleKeputusan = async (status) => {
    if (!detail) return;

    if (status === 'diterima' && !selectedRombelId) {
      alert('Pilih rombel terlebih dahulu sebelum menerima pendaftar.');
      return;
    }

    const konfirmasi = window.confirm(
      `${status === 'diterima' ? 'TERIMA' : 'TOLAK'} pendaftaran ${detail.nama_lengkap}?\n\n` +
      (status === 'diterima'
        ? 'Akun dan rombel WB akan dibuat otomatis.'
        : 'Tindakan ini tidak dapat dibatalkan.')
    );
    if (!konfirmasi) return;

    setProcessing(true);
    try {
      const payload = {
        status,
        catatan_verifikasi: catatan.trim() || null,
      };

      if (status === 'diterima') {
        payload.rombel_id = Number(selectedRombelId);
      }

      await SpmbAPI.buatKeputusan(detail.id, payload);

      const [resList, resStat, resDetail] = await Promise.all([
        SpmbAPI.getAll({ status: filterStatus || undefined }),
        SpmbAPI.getStatistik(),
        SpmbAPI.getById(detail.id),
      ]);

      setList(resList.data.data || []);
      setStat(resStat.data.data);
      setDetail(resDetail.data.data);
      setCatatan('');

      alert(
        status === 'diterima'
          ? 'Pendaftar berhasil diterima. Akun WB sudah dibuat.'
          : 'Pendaftar berhasil ditolak.'
      );
    } catch (err) {
      alert(err.response?.data?.message || 'Gagal membuat keputusan.');
    } finally {
      setProcessing(false);
    }
  };

  const formatTanggal = (tanggal) =>
    tanggal
      ? new Date(tanggal).toLocaleDateString('id-ID', {
          day: 'numeric',
          month: 'long',
          year: 'numeric',
        })
      : '—';

  const labelJenjang = {
    paket_a: 'Paket A',
    paket_b: 'Paket B',
    paket_c: 'Paket C',
  };

  const getBadgeClass = (status) => {
    if (status === 'pending') return 'badge-warning';
    if (status === 'diterima' || status === 'valid') return 'badge-success';
    if (status === 'ditolak' || status === 'tidak_valid') return 'badge-danger';
    return 'badge-neutral';
  };

  return (
    <div className="app-layout">
      <Sidebar user={user} />
      <main className="app-main">
        <div className="app-content">
          <div style={{ marginBottom: '1.5rem' }}>
            <h1 style={{ fontFamily: 'var(--font-heading)', fontSize: 'var(--text-2xl)', fontWeight: 800 }}>
              Verifikasi SPMB
            </h1>
            <p style={{ color: 'var(--color-text-muted)', marginTop: 4 }}>
              Tinjau berkas dan buat keputusan penerimaan Warga Belajar baru.
            </p>
          </div>

          {stat && (
            <div className="grid-cols-4" style={{ marginBottom: '1.5rem' }}>
              {[
                { label: 'Total', value: stat.total_pendaftar, icon: 'bi-people', color: '#DBEAFE', ic: 'var(--color-siswa)' },
                { label: 'Pending', value: stat.pending, icon: 'bi-hourglass-split', color: '#FEF3C7', ic: 'var(--color-accent-dark)' },
                { label: 'Diterima', value: stat.diterima, icon: 'bi-check-circle', color: '#D1FAE5', ic: 'var(--color-success)' },
                { label: 'Ditolak', value: stat.ditolak, icon: 'bi-x-circle', color: '#FEE2E2', ic: 'var(--color-danger)' },
              ].map((item) => (
                <div key={item.label} className="stat-card">
                  <div className="stat-icon" style={{ background: item.color, color: item.ic }}>
                    <i className={`bi ${item.icon}`}></i>
                  </div>
                  <div className="stat-body">
                    <div className="stat-value">{item.value ?? '—'}</div>
                    <div className="stat-label">{item.label}</div>
                  </div>
                </div>
              ))}
            </div>
          )}

          <div style={{ display: 'grid', gridTemplateColumns: detail ? '1fr 1.2fr' : '1fr', gap: '1.5rem', alignItems: 'start' }}>
            <div>
              <div style={{ display: 'flex', gap: 4, marginBottom: '1rem', flexWrap: 'wrap' }}>
                {[
                  { val: 'pending', label: 'Menunggu' },
                  { val: 'diterima', label: 'Diterima' },
                  { val: 'ditolak', label: 'Ditolak' },
                  { val: '', label: 'Semua' },
                ].map((item) => (
                  <button
                    key={item.val}
                    onClick={() => {
                      setFilterStatus(item.val);
                      setDetail(null);
                      setLoading(true);
                    }}
                    className={`btn ${filterStatus === item.val ? 'btn-primary' : 'btn-secondary'}`}
                    style={{ padding: '0.4rem 0.9rem', fontSize: 'var(--text-xs)' }}
                  >
                    {item.label}
                  </button>
                ))}
              </div>

              {loading && (
                <div className="loading-container">
                  <div className="spinner"></div>
                </div>
              )}

              {!loading && error && (
                <div className="alert alert-danger">
                  <i className="bi bi-exclamation-triangle-fill"></i>
                  <span>{error}</span>
                </div>
              )}

              {!loading && !error && (
                list.length === 0 ? (
                  <div className="card">
                    <div className="empty-state">
                      <i className="bi bi-inbox"></i>
                      <h3>Tidak Ada Pendaftar</h3>
                      <p>Belum ada pendaftar dengan status ini.</p>
                    </div>
                  </div>
                ) : (
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
                    {list.map((pendaftar) => (
                      <div
                        key={pendaftar.id}
                        className="card"
                        style={{
                          padding: '1rem',
                          cursor: 'pointer',
                          border: detail?.id === pendaftar.id ? '2px solid var(--color-primary)' : '1px solid var(--color-border)',
                        }}
                        onClick={() => bukaDetail(pendaftar.id)}
                      >
                        <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
                          <div
                            style={{
                              width: 38,
                              height: 38,
                              borderRadius: '50%',
                              flexShrink: 0,
                              background: 'var(--color-primary-light)',
                              color: 'var(--color-primary)',
                              display: 'flex',
                              alignItems: 'center',
                              justifyContent: 'center',
                              fontWeight: 800,
                              fontFamily: 'var(--font-heading)',
                            }}
                          >
                            {pendaftar.nama_lengkap?.charAt(0)?.toUpperCase()}
                          </div>
                          <div style={{ flex: 1, minWidth: 0 }}>
                            <div style={{ fontWeight: 700, fontSize: 'var(--text-sm)', marginBottom: 2 }}>
                              {pendaftar.nama_lengkap}
                            </div>
                            <div style={{ fontSize: 'var(--text-xs)', color: 'var(--color-text-muted)' }}>
                              {labelJenjang[pendaftar.jenjang_daftar] || pendaftar.jenjang_daftar} • {formatTanggal(pendaftar.created_at)}
                            </div>
                          </div>
                          <span className={`badge ${getBadgeClass(pendaftar.status)}`}>{pendaftar.status}</span>
                        </div>
                      </div>
                    ))}
                  </div>
                )
              )}
            </div>

            {(detail || loadDetail) && (
              <div className="card" style={{ position: 'sticky', top: '1rem' }}>
                {loadDetail ? (
                  <div className="loading-container">
                    <div className="spinner"></div>
                  </div>
                ) : detail && (
                  <>
                    <div className="card-header" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                      <h3 className="card-title">{detail.nama_lengkap}</h3>
                      <button
                        onClick={() => setDetail(null)}
                        style={{ background: 'none', border: 'none', cursor: 'pointer', color: 'var(--color-text-muted)', fontSize: '1.1rem' }}
                      >
                        <i className="bi bi-x-lg"></i>
                      </button>
                    </div>

                    <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 8, marginBottom: '1rem' }}>
                      {[
                        { label: 'Email', value: detail.email },
                        { label: 'Jenjang', value: labelJenjang[detail.jenjang_daftar] || detail.jenjang_daftar },
                        { label: 'Tanggal Lahir', value: formatTanggal(detail.tanggal_lahir) },
                        { label: 'Jenis Kelamin', value: detail.jenis_kelamin === 'L' ? 'Laki-laki' : 'Perempuan' },
                        { label: 'Nama Wali', value: detail.nama_wali || '—' },
                        { label: 'No. HP', value: detail.no_telp || '—' },
                      ].map((item) => (
                        <div
                          key={item.label}
                          style={{
                            padding: '0.5rem 0.75rem',
                            background: 'var(--color-bg)',
                            borderRadius: 'var(--radius-sm)',
                            border: '1px solid var(--color-border)',
                          }}
                        >
                          <div style={{ fontSize: 'var(--text-xs)', color: 'var(--color-text-muted)', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.05em' }}>
                            {item.label}
                          </div>
                          <div style={{ fontSize: 'var(--text-sm)', fontWeight: 600 }}>{item.value || '—'}</div>
                        </div>
                      ))}
                    </div>

                    <div style={{ marginBottom: '1rem' }}>
                      <p style={{ fontWeight: 700, fontSize: 'var(--text-sm)', marginBottom: '0.5rem' }}>
                        <i className="bi bi-paperclip"></i> Berkas Pendukung
                      </p>
                      {!detail.berkas || detail.berkas.length === 0 ? (
                        <p style={{ fontSize: 'var(--text-sm)', color: 'var(--color-text-muted)' }}>
                          Belum ada berkas yang diupload.
                        </p>
                      ) : (
                        detail.berkas.map((berkas) => {
                          const statusBerkas = berkas.status_verifikasi;
                          return (
                            <div
                              key={berkas.id}
                              style={{
                                display: 'flex',
                                alignItems: 'center',
                                gap: '0.75rem',
                                padding: '0.5rem 0.75rem',
                                marginBottom: 6,
                                background:
                                  statusBerkas === 'valid'
                                    ? '#F0FDF4'
                                    : statusBerkas === 'tidak_valid'
                                      ? '#FEF2F2'
                                      : 'var(--color-bg)',
                                border: `1px solid ${
                                  statusBerkas === 'valid'
                                    ? 'var(--color-success)'
                                    : statusBerkas === 'tidak_valid'
                                      ? 'var(--color-danger)'
                                      : 'var(--color-border)'
                                }`,
                                borderRadius: 'var(--radius-sm)',
                              }}
                            >
                              <i className="bi bi-file-earmark" style={{ color: 'var(--color-text-muted)' }}></i>
                              <span style={{ flex: 1, fontSize: 'var(--text-sm)', textTransform: 'capitalize' }}>
                                {berkas.jenis_berkas?.replace('_', ' ') || 'Berkas'}
                              </span>

                              {berkas.path_file && (
                                <a
                                  href={`http://localhost:3000/${berkas.path_file.replace(/\\/g, '/')}`}
                                  target="_blank"
                                  rel="noopener noreferrer"
                                  className="btn btn-secondary"
                                  style={{ padding: '0.25rem 0.6rem', fontSize: 'var(--text-xs)' }}
                                >
                                  <i className="bi bi-eye"></i> Lihat
                                </a>
                              )}

                              {detail.status === 'pending' && statusBerkas !== 'valid' && (
                                <button
                                  className="btn btn-secondary"
                                  style={{ padding: '0.25rem 0.6rem', fontSize: 'var(--text-xs)', color: 'var(--color-success)' }}
                                  onClick={() => handleVerifikasiBerkas(berkas.id, 'valid')}
                                >
                                  <i className="bi bi-check"></i> Valid
                                </button>
                              )}

                              {detail.status === 'pending' && statusBerkas !== 'tidak_valid' && (
                                <button
                                  className="btn btn-danger"
                                  style={{ padding: '0.25rem 0.6rem', fontSize: 'var(--text-xs)' }}
                                  onClick={() => handleVerifikasiBerkas(berkas.id, 'tidak_valid')}
                                >
                                  <i className="bi bi-x"></i> Tolak
                                </button>
                              )}

                              {statusBerkas && (
                                <span className={`badge ${getBadgeClass(statusBerkas)}`} style={{ fontSize: '0.6rem' }}>
                                  {statusBerkas}
                                </span>
                              )}
                            </div>
                          );
                        })
                      )}
                    </div>

                    {detail.status === 'pending' && (
                      <div style={{ borderTop: '2px solid var(--color-border)', paddingTop: '1rem' }}>
                        <p style={{ fontWeight: 700, fontSize: 'var(--text-sm)', marginBottom: '0.5rem' }}>
                          <i className="bi bi-gavel"></i> Buat Keputusan
                        </p>

                        <div className="form-group">
                          <label className="form-label">
                            Penempatan Rombel <span className="required">*</span>
                          </label>
                          <select
                            className="form-input"
                            value={selectedRombelId}
                            onChange={(e) => setSelectedRombelId(e.target.value)}
                            disabled={loadingRombel || processing}
                            style={{ cursor: 'pointer' }}
                          >
                            <option value="">
                              {loadingRombel ? 'Memuat rombel...' : 'Pilih rombel untuk pendaftar ini'}
                            </option>
                            {rombelOptions.map((rombel) => (
                              <option key={rombel.id} value={rombel.id}>
                                {rombel.nama_rombel}
                              </option>
                            ))}
                          </select>
                          <p style={{ fontSize: 'var(--text-xs)', color: 'var(--color-text-muted)', marginTop: 6 }}>
                            Wajib dipilih jika pendaftar akan diterima.
                          </p>
                        </div>

                        <textarea
                          className="form-input"
                          placeholder="Catatan keputusan (opsional)"
                          value={catatan}
                          onChange={(e) => setCatatan(e.target.value)}
                          rows={2}
                          style={{ marginBottom: '0.75rem', resize: 'vertical', fontSize: 'var(--text-sm)' }}
                        />

                        <div style={{ display: 'flex', gap: '0.75rem' }}>
                          <button
                            className="btn btn-primary"
                            style={{ flex: 1, background: 'var(--color-success)' }}
                            onClick={() => handleKeputusan('diterima')}
                            disabled={processing || loadingRombel}
                          >
                            {processing ? <span className="spinner-sm"></span> : <i className="bi bi-check-circle-fill"></i>}
                            {' '}Terima
                          </button>
                          <button
                            className="btn btn-danger"
                            style={{ flex: 1 }}
                            onClick={() => handleKeputusan('ditolak')}
                            disabled={processing}
                          >
                            {processing ? <span className="spinner-sm" style={{ borderTopColor: 'var(--color-danger)' }}></span> : <i className="bi bi-x-circle-fill"></i>}
                            {' '}Tolak
                          </button>
                        </div>
                      </div>
                    )}

                    {detail.status !== 'pending' && (
                      <div className={`alert alert-${detail.status === 'diterima' ? 'success' : 'danger'}`}>
                        <i className={`bi ${detail.status === 'diterima' ? 'bi-check-circle-fill' : 'bi-x-circle-fill'}`}></i>
                        <div>
                          <strong>Sudah {detail.status === 'diterima' ? 'Diterima' : 'Ditolak'}</strong>
                          {detail.catatan_verifikasi && (
                            <p style={{ margin: '4px 0 0', fontSize: 'var(--text-xs)' }}>
                              Catatan: {detail.catatan_verifikasi}
                            </p>
                          )}
                        </div>
                      </div>
                    )}
                  </>
                )}
              </div>
            )}
          </div>
        </div>
      </main>
    </div>
  );
}

export default SpmbAdmin;
