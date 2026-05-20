// ============================================================
// src/services/api.js — Konfigurasi Axios & Semua Fungsi API
// ============================================================
// File ini adalah "jembatan" antara frontend React dan backend
// Express. Semua pemanggilan HTTP ke backend HARUS melalui file
// ini — jangan pernah menulis fetch/axios langsung di komponen.
//
// Kenapa pakai Axios?
//   - Auto-parse JSON response
//   - Bisa pasang interceptor (sisipkan token di semua request)
//   - Penanganan error lebih mudah
// ============================================================

import axios from 'axios';

// ── 1. BUAT INSTANCE AXIOS ──────────────────────────────────
// baseURL diambil dari .env (VITE_API_URL).
// Semua request dari instance ini otomatis prefix URL-nya.
// Contoh: apiClient.get('/siswa') → GET http://localhost:3000/api/siswa
const apiClient = axios.create({
  baseURL: import.meta.env.VITE_API_URL, // Baca dari file .env
  headers: {
    'Content-Type': 'application/json',
  },
  timeout: 10000, // Batas waktu request: 10 detik
});


// ── 2. REQUEST INTERCEPTOR ──────────────────────────────────
// Interceptor ini berjalan SEBELUM setiap request dikirim.
// Tugasnya: menambahkan token JWT ke header Authorization
// agar backend tahu siapa yang sedang membuat request.
apiClient.interceptors.request.use(
  (config) => {
    // Ambil token yang tersimpan di localStorage saat login
    const token = localStorage.getItem('pkbm_token');

    if (token) {
      // Tambahkan token ke header dengan format "Bearer <token>"
      // Sesuai dengan yang dibaca oleh authMiddleware.js di backend
      config.headers['Authorization'] = `Bearer ${token}`;
    }

    return config; // Kembalikan config yang sudah dimodifikasi
  },
  (error) => {
    // Jika ada error saat menyiapkan request, teruskan errornya
    return Promise.reject(error);
  }
);


// ── 3. RESPONSE INTERCEPTOR ─────────────────────────────────
// Interceptor ini berjalan SETELAH setiap response diterima.
// Tugasnya: menangani error global, khususnya token kedaluwarsa.
apiClient.interceptors.response.use(
  (response) => {
    // Response sukses (2xx): langsung teruskan
    return response;
  },
  (error) => {
    // Jika backend mengembalikan 401 (Unauthorized / token expired)
    if (error.response && error.response.status === 401) {
      // Hapus data sesi yang tersimpan di localStorage
      localStorage.removeItem('pkbm_token');
      localStorage.removeItem('pkbm_user');

      // Arahkan paksa ke halaman login
      // (window.location dipakai karena di luar konteks React Router)
      window.location.href = '/';
    }

    // Teruskan error agar bisa ditangani di level komponen
    return Promise.reject(error);
  }
);


// ============================================================
// ── 4. FUNGSI-FUNGSI API (dikelompokkan per modul) ──────────
// ============================================================
// Setiap fungsi mengembalikan Promise.
// Gunakan async/await saat memanggilnya di komponen.
// Contoh: const { data } = await AuthAPI.login(email, pass);
// ============================================================


// ── AUTH ────────────────────────────────────────────────────
export const AuthAPI = {

  // POST /api/auth/login
  // Payload: { email, password }
  // Response: { success, data: { token, user } }
  login: (email, password) =>
    apiClient.post('/auth/login', { email, password }),

  // GET /api/auth/me
  // Ambil profil user yang sedang login (berdasarkan token di header)
  getMe: () =>
    apiClient.get('/auth/me'),

  // PUT /api/auth/me
  updateMe: (payload) =>
    apiClient.put('/auth/me', payload),

  changeMyPassword: (payload) =>
    apiClient.put('/auth/me/password', payload),

  // POST /api/auth/me/foto
  uploadFotoProfil: (formData) =>
    apiClient.post('/auth/me/foto', formData, {
      headers: { 'Content-Type': 'multipart/form-data' },
    }),
};


// ── SISWA (Warga Belajar) ────────────────────────────────────
export const SiswaAPI = {

  // GET /api/siswa?jenjang=paket_a&is_aktif=1
  // params: objek opsional { jenjang, is_aktif }
  // Response: { success, data: [ ...listSiswa ] }
  getAll: (params = {}) =>
    apiClient.get('/siswa', { params }),

  // GET /api/siswa/:id
  // Response: { success, data: { ...dataSiswa } }
  getById: (id) =>
    apiClient.get(`/siswa/${id}`),

  // GET /api/siswa/profil/saya
  // Khusus WB — mengambil profilnya sendiri
  getProfilSaya: () =>
    apiClient.get('/siswa/profil/saya'),

  // GET /api/siswa/statistik/per-jenjang
  // Khusus Admin & Pimpinan
  getStatistikPerJenjang: () =>
    apiClient.get('/siswa/statistik/per-jenjang'),

  // GET /api/siswa/rombel/options?jenjang=paket_c
  // Untuk dropdown penempatan rombel saat SPMB diterima
  getRombelOptions: (params = {}) =>
    apiClient.get('/siswa/rombel/options', { params }),

  getMapelOptions: (params = {}) =>
    apiClient.get('/siswa/mapel/options', { params }),

  // PUT /api/siswa/:id
  // Payload: { alamat, nama_wali, no_telp, rombel_id }
  update: (id, payload) =>
    apiClient.put(`/siswa/${id}`, payload),
};


// ── USER (Manajemen Akun oleh Super Admin) ───────────────────
export const UserAPI = {

  // GET /api/users
  getAll: () =>
    apiClient.get('/users'),

  // POST /api/users
  // Payload: { nama, email, password, role }
  create: (payload) =>
    apiClient.post('/users', payload),

  // PUT /api/users/:id/status
  // Payload: { is_aktif: true/false }
  updateStatus: (id, is_aktif) =>
    apiClient.put(`/users/${id}/status`, { is_aktif }),

  // PUT /api/users/:id/password
  // Payload: { password_baru }
  resetPassword: (id, password_baru) =>
    apiClient.put(`/users/${id}/password`, { password_baru }),
};


// ── SPMB (Penerimaan Siswa Baru) ─────────────────────────────
export const SpmbAPI = {

  // POST /api/spmb/daftar — PUBLIK, tidak butuh token
  // Payload: { nama_lengkap, nik, tanggal_lahir, jenjang_dituju, ... }
  daftar: (payload) =>
    apiClient.post('/spmb/daftar', payload),

  // POST /api/spmb/:id/berkas — Upload berkas (FormData)
  // Gunakan FormData karena ini multipart/form-data
  uploadBerkas: (id, formData) =>
    apiClient.post(`/spmb/${id}/berkas`, formData, {
      headers: { 'Content-Type': 'multipart/form-data' },
    }),

  // GET /api/spmb — Daftar semua pendaftar (Admin)
  getAll: (params = {}) =>
    apiClient.get('/spmb', { params }),

  // GET /api/spmb/statistik
  getStatistik: () =>
    apiClient.get('/spmb/statistik'),

  // GET /api/spmb/:id — Detail pendaftar
  getById: (id) =>
    apiClient.get(`/spmb/${id}`),

  // PUT /api/spmb/berkas/:berkasId/verifikasi
  // Payload: { status_verifikasi: 'valid'/'tidak_valid', catatan }
  verifikasiBerkas: (berkasId, payload) =>
    apiClient.put(`/spmb/berkas/${berkasId}/verifikasi`, payload),

  // PUT /api/spmb/:id/keputusan
  // Payload: { status: 'diterima'/'ditolak', catatan_verifikasi, rombel_id }
  buatKeputusan: (id, payload) =>
    apiClient.put(`/spmb/${id}/keputusan`, payload),
};


// ── TAGIHAN & KEUANGAN ───────────────────────────────────────
export const TagihanAPI = {

  // GET /api/tagihan
  getAll: (params = {}) =>
    apiClient.get('/tagihan', { params }),

  // GET /api/tagihan/tunggakan
  getTunggakan: () =>
    apiClient.get('/tagihan/tunggakan'),

  // GET /api/tagihan/ringkasan-bulanan
  getRingkasanBulanan: () =>
    apiClient.get('/tagihan/ringkasan-bulanan'),

  // GET /api/tagihan/:id
  getById: (id) =>
    apiClient.get(`/tagihan/${id}`),

  // POST /api/tagihan
  // Payload: { siswa_id, jenis, jumlah, bulan, tahun }
  create: (payload) =>
    apiClient.post('/tagihan', payload),

  // POST /api/tagihan/massal
  // Payload: { jenjang, jenis, jumlah, bulan, tahun }
  createMassal: (payload) =>
    apiClient.post('/tagihan/massal', payload),

  // POST /api/tagihan/:id/bayar — Catat pembayaran (bisa + bukti)
  catatPembayaran: (id, formData) =>
    apiClient.post(`/tagihan/${id}/bayar`, formData, {
      headers: { 'Content-Type': 'multipart/form-data' },
    }),
};


// ── ABSENSI ──────────────────────────────────────────────────
export const AbsensiAPI = {

  // POST /api/absensi/sesi — Tutor buka sesi baru
  // Payload: { rombel_id, mode: 'manual'/'mandiri', durasi_timer }
  bukaSesi: (payload) =>
    apiClient.post('/absensi/sesi', payload),

  // GET /api/absensi/sesi-aktif — Tutor cek sesi yang sedang berjalan
  getSesiAktif: () =>
    apiClient.get('/absensi/sesi-aktif'),

  // PUT /api/absensi/sesi/:sesiId/tutup
  tutupSesi: (sesiId) =>
    apiClient.put(`/absensi/sesi/${sesiId}/tutup`),

  // GET /api/absensi/sesi/:sesiId — Detail sesi
  getSesiById: (sesiId) =>
    apiClient.get(`/absensi/sesi/${sesiId}`),

  // GET /api/absensi/sesi/:sesiId/daftar-wb — Real-time list WB
  getDaftarWbDiSesi: (sesiId) =>
    apiClient.get(`/absensi/sesi/${sesiId}/daftar-wb`),

  // POST /api/absensi/sesi/:sesiId/submit-manual — Absensi manual
  submitManual: (sesiId, payload) =>
    apiClient.post(`/absensi/sesi/${sesiId}/submit-manual`, payload),

  // GET /api/absensi/rombel/:rombelId — Riwayat sesi rombel
  getSesiByRombel: (rombelId) =>
    apiClient.get(`/absensi/rombel/${rombelId}`),

  // POST /api/absensi/sesi/:sesiId/checkin — WB check-in mandiri
  checkIn: (sesiId) =>
    apiClient.post(`/absensi/sesi/${sesiId}/checkin`),

  // GET /api/absensi/rekap/saya — Rekap kehadiran pribadi WB
  getRekapSaya: () =>
    apiClient.get('/absensi/rekap/saya'),
};


// ── LMS: MATERI, TUGAS, JADWAL ───────────────────────────────
export const LmsAPI = {

  // MATERI
  getMateriByRombel: (rombelId) =>
    apiClient.get(`/lms/materi/rombel/${rombelId}`),

  getMateriById: (id) =>
    apiClient.get(`/lms/materi/${id}`),

  createMateri: (formData) =>
    apiClient.post('/lms/materi', formData, {
      headers: { 'Content-Type': 'multipart/form-data' },
    }),

  togglePublishMateri: (id, is_published) =>
    apiClient.put(`/lms/materi/${id}/publish`, { is_published }),

  tandaiMateriSelesai: (id) =>
    apiClient.put(`/lms/materi/${id}/selesai`),

  // TUGAS
  getTugasByRombel: (rombelId) =>
    apiClient.get(`/lms/tugas/rombel/${rombelId}`),

  getTugasById: (id) =>
    apiClient.get(`/lms/tugas/${id}`),

  createTugas: (payload) =>
    apiClient.post('/lms/tugas', payload),

  kumpulkanTugas: (id, formData) =>
    apiClient.post(`/lms/tugas/${id}/kumpulkan`, formData, {
      headers: { 'Content-Type': 'multipart/form-data' },
    }),

  nilaiTugas: (pengumpulanId, payload) =>
    apiClient.put(`/lms/tugas/pengumpulan/${pengumpulanId}/nilai`, payload),

  // JADWAL KBM
  getJadwalByRombel: (rombelId) =>
    apiClient.get(`/lms/jadwal/rombel/${rombelId}`),

  createJadwal: (payload) =>
    apiClient.post('/lms/jadwal', payload),
};


// ── UJIAN ONLINE ─────────────────────────────────────────────
export const UjianAPI = {

  // Bank Soal
  getAllSoal: (params = {}) =>
    apiClient.get('/ujian/soal', { params }),

  getSoalById: (id) =>
    apiClient.get(`/ujian/soal/${id}`),

  createSoal: (payload) =>
    apiClient.post('/ujian/soal', payload),

  updateSoal: (id, payload) =>
    apiClient.put(`/ujian/soal/${id}`, payload),

  deleteSoal: (id) =>
    apiClient.delete(`/ujian/soal/${id}`),

  // Paket Ujian
  getPaketByRombel: (rombelId) =>
    apiClient.get(`/ujian/paket/rombel/${rombelId}`),

  getPaketById: (id) =>
    apiClient.get(`/ujian/paket/${id}`),

  createPaket: (payload) =>
    apiClient.post('/ujian/paket', payload),

  getRekapPaket: (id) =>
    apiClient.get(`/ujian/paket/${id}/rekap`),

  simpanNilaiManualPaket: (id, payload) =>
    apiClient.put(`/ujian/paket/${id}/nilai-manual`, payload),

  // Sesi Ujian (WB mengerjakan)
  mulaiUjian: (paketId) =>
    apiClient.post(`/ujian/sesi/mulai/${paketId}`),

  simpanJawaban: (sesiId, payload) =>
    apiClient.post(`/ujian/sesi/${sesiId}/jawaban`, payload),

  submitUjian: (sesiId) =>
    apiClient.post(`/ujian/sesi/${sesiId}/submit`),

  nilaiEssay: (sesiId, payload) =>
    apiClient.put(`/ujian/sesi/${sesiId}/nilai-essay`, payload),
};


// ── KLUB MINAT BAKAT ─────────────────────────────────────────
export const KlubAPI = {

  // ── Endpoint Siswa ──────────────────────────────────────────

  // GET /api/klub — Semua klub aktif (untuk siswa)
  getAll: () =>
    apiClient.get('/klub'),

  // GET /api/klub/saya — Klub yang diikuti WB
  getKlubSaya: () =>
    apiClient.get('/klub/saya'),

  // GET /api/klub/:id — Detail klub + anggota
  getById: (id) =>
    apiClient.get(`/klub/${id}`),

  // POST /api/klub/:id/daftar — WB mendaftar ke klub
  daftar: (id) =>
    apiClient.post(`/klub/${id}/daftar`),

  // DELETE /api/klub/:id/keluar — WB keluar dari klub
  keluar: (id) =>
    apiClient.delete(`/klub/${id}/keluar`),

  // ── Endpoint Admin CRUD ─────────────────────────────────────

  // GET /api/klub/admin/semua — Semua klub termasuk nonaktif
  getAllAdmin: () =>
    apiClient.get('/klub/admin/semua'),

  // POST /api/klub — Buat klub baru
  // Payload: { nama_klub, deskripsi, kategori, pembimbing_id, kapasitas }
  create: (payload) =>
    apiClient.post('/klub', payload),

  // PUT /api/klub/:id — Edit klub
  // Payload: { nama_klub, deskripsi, kategori, pembimbing_id, kapasitas }
  update: (id, payload) =>
    apiClient.put(`/klub/${id}`, payload),

  // PATCH /api/klub/:id/toggle — Toggle aktif/nonaktif
  // Payload: { is_aktif: true/false }
  toggleAktif: (id, is_aktif) =>
    apiClient.patch(`/klub/${id}/toggle`, { is_aktif }),

  // DELETE /api/klub/:id — Hapus klub
  hapus: (id) =>
    apiClient.delete(`/klub/${id}`),
};


// Export instance Axios mentah juga, untuk kebutuhan custom request
export default apiClient;
