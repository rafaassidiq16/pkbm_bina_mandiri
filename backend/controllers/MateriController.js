// ============================================================
// controllers/MateriController.js
// Menangani modul KBM/LMS: Materi, Tugas, dan Jadwal KBM.
// Satu controller untuk tiga sub-modul yang saling berkaitan.
// ============================================================

import { MateriModel, TugasModel, JadwalModel } from '../models/MateriModel.js';
import SiswaModel from '../models/SiswaModel.js';
import upload from '../config/multer.js';

// ============================================================
// MATERI PEMBELAJARAN
// ============================================================
export const MateriController = {

  // GET /api/materi/rombel/:rombelId
  getByRombel: async (req, res) => {
    try {
      const { rombelId } = req.params;
      const { mapel_id } = req.query;
      const materi = await MateriModel.findByRombel(parseInt(rombelId), mapel_id ? parseInt(mapel_id) : null);
      return res.status(200).json({ success: true, data: materi });
    } catch (error) {
      console.error('[MateriController.getByRombel]', error);
      return res.status(500).json({ success: false, message: 'Gagal mengambil materi.' });
    }
  },

  // GET /api/materi/:id
  getById: async (req, res) => {
    try {
      const materi = await MateriModel.findById(parseInt(req.params.id));
      if (!materi) return res.status(404).json({ success: false, message: 'Materi tidak ditemukan.' });

      // Jika yang mengakses adalah WB, catat progres otomatis
      if (req.user.role === 'warga_belajar') {
        const wb = await SiswaModel.findByUserId(req.user.id);
        if (wb) await MateriModel.catatProgres(wb.id, materi.id, 'dibuka');
      }

      return res.status(200).json({ success: true, data: materi });
    } catch (error) {
      console.error('[MateriController.getById]', error);
      return res.status(500).json({ success: false, message: 'Gagal mengambil materi.' });
    }
  },

  // POST /api/materi
  create: async (req, res) => {
    try {
      const { rombel_id, mapel_id, judul, deskripsi, tipe, url, urutan } = req.body;

      if (!rombel_id || !mapel_id || !judul || !tipe) {
        return res.status(400).json({ success: false, message: 'Field wajib: rombel_id, mapel_id, judul, tipe.' });
      }

      const id = await MateriModel.create({
        rombel_id: parseInt(rombel_id),
        mapel_id:  parseInt(mapel_id),
        tutor_id:  req.user.id,
        judul, deskripsi, tipe,
        path_file: req.file ? req.file.path : null,
        url:       url || null,
        urutan:    urutan ? parseInt(urutan) : 0,
      });

      return res.status(201).json({ success: true, message: 'Materi berhasil ditambahkan.', data: { id } });
    } catch (error) {
      console.error('[MateriController.create]', error);
      return res.status(500).json({ success: false, message: 'Gagal menambahkan materi.' });
    }
  },

  // PUT /api/materi/:id/publish
  togglePublish: async (req, res) => {
    try {
      const { is_published } = req.body;
      const affected = await MateriModel.togglePublish(parseInt(req.params.id), is_published);
      if (affected === 0) return res.status(404).json({ success: false, message: 'Materi tidak ditemukan.' });
      const status = is_published ? 'dipublikasikan' : 'disembunyikan';
      return res.status(200).json({ success: true, message: `Materi berhasil ${status}.` });
    } catch (error) {
      console.error('[MateriController.togglePublish]', error);
      return res.status(500).json({ success: false, message: 'Gagal mengubah status materi.' });
    }
  },

  // PUT /api/materi/:id/selesai — WB tandai materi sebagai selesai
  tandaiSelesai: async (req, res) => {
    try {
      const wb = await SiswaModel.findByUserId(req.user.id);
      if (!wb) return res.status(404).json({ success: false, message: 'Profil WB tidak ditemukan.' });
      await MateriModel.catatProgres(wb.id, parseInt(req.params.id), 'selesai');
      return res.status(200).json({ success: true, message: 'Materi ditandai selesai.' });
    } catch (error) {
      console.error('[MateriController.tandaiSelesai]', error);
      return res.status(500).json({ success: false, message: 'Gagal menandai materi.' });
    }
  },
};

// ============================================================
// TUGAS & PENGUMPULAN
// ============================================================
export const TugasController = {

  // GET /api/tugas/rombel/:rombelId
  getByRombel: async (req, res) => {
    try {
      const { rombelId } = req.params;
      const { mapel_id } = req.query;
      const tugas = await TugasModel.findByRombel(parseInt(rombelId), mapel_id ? parseInt(mapel_id) : null);
      return res.status(200).json({ success: true, data: tugas });
    } catch (error) {
      console.error('[TugasController.getByRombel]', error);
      return res.status(500).json({ success: false, message: 'Gagal mengambil daftar tugas.' });
    }
  },

  // GET /api/tugas/:id — Detail tugas + semua pengumpulan (untuk Tutor)
  getById: async (req, res) => {
    try {
      const tugas = await TugasModel.findById(parseInt(req.params.id));
      if (!tugas) return res.status(404).json({ success: false, message: 'Tugas tidak ditemukan.' });
      return res.status(200).json({ success: true, data: tugas });
    } catch (error) {
      console.error('[TugasController.getById]', error);
      return res.status(500).json({ success: false, message: 'Gagal mengambil detail tugas.' });
    }
  },

  // POST /api/tugas — Tutor membuat tugas baru
  create: async (req, res) => {
    try {
      const { rombel_id, mapel_id, judul, deskripsi, deadline, nilai_maks } = req.body;
      if (!rombel_id || !mapel_id || !judul || !deskripsi || !deadline) {
        return res.status(400).json({ success: false, message: 'Field wajib: rombel_id, mapel_id, judul, deskripsi, deadline.' });
      }
      const id = await TugasModel.create({
        rombel_id: parseInt(rombel_id), mapel_id: parseInt(mapel_id),
        tutor_id: req.user.id, judul, deskripsi, deadline, nilai_maks,
      });
      return res.status(201).json({ success: true, message: 'Tugas berhasil dibuat.', data: { id } });
    } catch (error) {
      console.error('[TugasController.create]', error);
      return res.status(500).json({ success: false, message: 'Gagal membuat tugas.' });
    }
  },

  // POST /api/tugas/:id/kumpulkan — WB mengumpulkan tugas (upload file)
  kumpulkan: async (req, res) => {
    try {
      if (!req.file) return res.status(400).json({ success: false, message: 'File tugas wajib diupload.' });
      const wb = await SiswaModel.findByUserId(req.user.id);
      if (!wb) return res.status(404).json({ success: false, message: 'Profil WB tidak ditemukan.' });

      await TugasModel.kumpulkanTugas({
        tugas_id: parseInt(req.params.id),
        warga_belajar_id: wb.id,
        path_file: req.file.path,
        nama_file: req.file.originalname,
        catatan_siswa: req.body.catatan_siswa || null,
      });

      return res.status(200).json({ success: true, message: 'Tugas berhasil dikumpulkan.' });
    } catch (error) {
      console.error('[TugasController.kumpulkan]', error);
      return res.status(500).json({ success: false, message: 'Gagal mengumpulkan tugas.' });
    }
  },

  // PUT /api/tugas/pengumpulan/:pengumpulanId/nilai — Tutor menilai
  nilaiTugas: async (req, res) => {
    try {
      const { nilai, feedback_tutor } = req.body;
      if (nilai === undefined) return res.status(400).json({ success: false, message: 'Field nilai wajib diisi.' });
      const affected = await TugasModel.nilaiTugas(parseInt(req.params.pengumpulanId), { nilai: parseFloat(nilai), feedback_tutor });
      if (affected === 0) return res.status(404).json({ success: false, message: 'Pengumpulan tidak ditemukan.' });
      return res.status(200).json({ success: true, message: 'Nilai berhasil disimpan.' });
    } catch (error) {
      console.error('[TugasController.nilaiTugas]', error);
      return res.status(500).json({ success: false, message: 'Gagal menyimpan nilai.' });
    }
  },
};

// ============================================================
// JADWAL KBM
// ============================================================
export const JadwalController = {

  getByRombel: async (req, res) => {
    try {
      const jadwal = await JadwalModel.findByRombel(parseInt(req.params.rombelId));
      return res.status(200).json({ success: true, data: jadwal });
    } catch (error) {
      console.error('[JadwalController.getByRombel]', error);
      return res.status(500).json({ success: false, message: 'Gagal mengambil jadwal.' });
    }
  },

  create: async (req, res) => {
    try {
      const { rombel_id, mapel_id, judul, waktu_mulai, waktu_selesai, jenis, link_meeting, lokasi, catatan } = req.body;
      if (!rombel_id || !mapel_id || !judul || !waktu_mulai || !waktu_selesai) {
        return res.status(400).json({ success: false, message: 'Field wajib: rombel_id, mapel_id, judul, waktu_mulai, waktu_selesai.' });
      }
      const id = await JadwalModel.create({
        rombel_id: parseInt(rombel_id), mapel_id: parseInt(mapel_id),
        tutor_id: req.user.id, judul, waktu_mulai, waktu_selesai,
        jenis, link_meeting, lokasi, catatan,
      });
      return res.status(201).json({ success: true, message: 'Jadwal KBM berhasil dibuat.', data: { id } });
    } catch (error) {
      console.error('[JadwalController.create]', error);
      return res.status(500).json({ success: false, message: 'Gagal membuat jadwal.' });
    }
  },
};
