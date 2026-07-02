// ============================================================
// COMPLETE api.js — Semua API yang dipakai frontend
// ============================================================

import axios from "axios";

const api = axios.create({
  baseURL: import.meta.env.VITE_API_URL || "http://212.85.24.112/api",
  withCredentials: false,
  headers: { "Content-Type": "application/json" },
});

// ============================================================
// AUTH
// ============================================================
export const AuthAPI = {
  login: (email, password) => api.post("/auth/login", { email, password }),
};

// ============================================================
// SPMB
// ============================================================
export const SpmbAPI = {
  daftar: (data) => api.post("/spmb/daftar", data),
  cekStatus: (email) => api.get(`/spmb/status?email=${email}`),
  uploadBerkas: (data) =>
    api.post("/spmb/upload-berkas", data, {
      headers: { "Content-Type": "multipart/form-data" },
    }),
};

// ============================================================
// SISWA
// ============================================================
export const SiswaAPI = {
  getProfile: () => api.get("/siswa/profile"),
  updateProfile: (data) => api.put("/siswa/profile", data),
  getMapel: () => api.get("/siswa/mapel"),
  getTugas: () => api.get("/siswa/tugas"),
  getMateri: () => api.get("/siswa/materi"),
  getUjian: () => api.get("/siswa/ujian"),
};

// ============================================================
// ABSENSI
// ============================================================
export const AbsensiAPI = {
  getHariIni: () => api.get("/absensi/hari-ini"),
  absenMasuk: () => api.post("/absensi/masuk"),
  absenPulang: () => api.post("/absensi/pulang"),
  riwayat: () => api.get("/absensi/riwayat"),
};

// ============================================================
// TAGIHAN (SPP)
// ============================================================
export const TagihanAPI = {
  getTagihan: () => api.get("/tagihan"),
  bayarTagihan: (data) =>
    api.post("/tagihan/bayar", data, {
      headers: { "Content-Type": "multipart/form-data" },
    }),
};

// ============================================================
// AKADEMIK (kelas terpadu, rombel, jadwal, dsb)
// ============================================================
export const AkademikAPI = {
  getRombel: () => api.get("/akademik/rombel"),
  getMapelRombel: (rombelId) =>
    api.get(`/akademik/rombel/${rombelId}/mapel`),
  getJadwal: () => api.get("/akademik/jadwal"),
};

// ============================================================
// LMS (materi belajar)
// ============================================================
export const LmsAPI = {
  getMateri: (mapelId) => api.get(`/lms/materi/${mapelId}`),
  getMateriDetail: (materiId) => api.get(`/lms/materi/detail/${materiId}`),
};

// ============================================================
// PERTEMUAN / KELAS TERPADU
// ============================================================
export const PertemuanAPI = {
  getPertemuan: (kelasId) => api.get(`/pertemuan/${kelasId}`),
  getDetail: (pertemuanId) => api.get(`/pertemuan/detail/${pertemuanId}`),
};

// ============================================================
// UJIAN
// ============================================================
export const UjianAPI = {
  listByMapel: (mapelId) => api.get(`/ujian/list/${mapelId}`),
  mulai: (ujianId) => api.post(`/ujian/${ujianId}/mulai`),
  submit: (ujianId, data) => api.post(`/ujian/${ujianId}/submit`, data),
};
// ... (isi sebelumnya tetap sama)

export const KlubAPI = {
  getKlubList: () => api.get("/klub/list"),
  getKlubDetail: (id) => api.get(`/klub/${id}`),
  joinKlub: (id) => api.post(`/klub/${id}/join`),
  leaveKlub: (id) => api.post(`/klub/${id}/leave`),
};
// ============================================================
// USER ADMIN API
// ============================================================
export const UserAPI = {
  getUsers: () => api.get("/user"),
  getUserById: (id) => api.get(`/user/${id}`),
  createUser: (data) => api.post("/user", data),
  updateUser: (id, data) => api.put(`/user/${id}`, data),
  deleteUser: (id) => api.delete(`/user/${id}`),
};

// ============================================================
export default api;
