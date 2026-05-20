// ============================================================
// controllers/KlubController.js
// Mengelola Klub Minat Bakat: katalog, pendaftaran anggota,
// serta CRUD admin (tambah, edit, hapus, toggle aktif).
// ============================================================

import KlubModel  from '../models/KlubModel.js';
import SiswaModel from '../models/SiswaModel.js';

const KlubController = {

  // GET /api/klub — Semua klub aktif (untuk siswa/tutor/pimpinan)
  getAll: async (req, res) => {
    try {
      const data = await KlubModel.findAll();
      return res.json({ success: true, data });
    } catch (e) {
      console.error('[KlubController.getAll]', e);
      return res.status(500).json({ success: false, message: 'Gagal mengambil daftar klub.' });
    }
  },

  // GET /api/klub/admin/semua — Semua klub termasuk nonaktif (Admin/Super Admin)
  getAllAdmin: async (req, res) => {
    try {
      const data = await KlubModel.findAllAdmin();
      return res.json({ success: true, data });
    } catch (e) {
      console.error('[KlubController.getAllAdmin]', e);
      return res.status(500).json({ success: false, message: 'Gagal mengambil daftar klub.' });
    }
  },

  // GET /api/klub/:id — Detail klub + daftar anggota
  getById: async (req, res) => {
    try {
      const klub = await KlubModel.findById(parseInt(req.params.id));
      if (!klub) return res.status(404).json({ success: false, message: 'Klub tidak ditemukan.' });
      return res.json({ success: true, data: klub });
    } catch (e) {
      console.error('[KlubController.getById]', e);
      return res.status(500).json({ success: false, message: 'Gagal mengambil detail klub.' });
    }
  },

  // GET /api/klub/saya — Klub yang diikuti WB yang sedang login
  getKlubSaya: async (req, res) => {
    try {
      const wb = await SiswaModel.findByUserId(req.user.id);
      if (!wb) return res.status(404).json({ success: false, message: 'Profil WB tidak ditemukan.' });
      const data = await KlubModel.getByWB(wb.id);
      return res.json({ success: true, data });
    } catch (e) {
      console.error('[KlubController.getKlubSaya]', e);
      return res.status(500).json({ success: false, message: 'Gagal mengambil klub Anda.' });
    }
  },

  // POST /api/klub — Admin/Super Admin buat klub baru
  // Body: { nama_klub, deskripsi, kategori, pembimbing_id, kapasitas }
  create: async (req, res) => {
    try {
      const { nama_klub, deskripsi, kategori, pembimbing_id, kapasitas } = req.body;
      if (!nama_klub) return res.status(400).json({ success: false, message: 'nama_klub wajib diisi.' });
      const id = await KlubModel.create({ nama_klub, deskripsi, kategori, pembimbing_id, kapasitas });
      return res.status(201).json({ success: true, message: 'Klub berhasil dibuat.', data: { id } });
    } catch (e) {
      console.error('[KlubController.create]', e);
      return res.status(500).json({ success: false, message: 'Gagal membuat klub.' });
    }
  },

  // PUT /api/klub/:id — Admin/Super Admin edit klub
  // Body: { nama_klub, deskripsi, kategori, pembimbing_id, kapasitas }
  update: async (req, res) => {
    try {
      const id = parseInt(req.params.id);
      const { nama_klub, deskripsi, kategori, pembimbing_id, kapasitas } = req.body;
      if (!nama_klub) return res.status(400).json({ success: false, message: 'nama_klub wajib diisi.' });

      const existing = await KlubModel.findById(id);
      if (!existing) return res.status(404).json({ success: false, message: 'Klub tidak ditemukan.' });

      await KlubModel.update(id, { nama_klub, deskripsi, kategori, pembimbing_id, kapasitas });
      return res.json({ success: true, message: 'Klub berhasil diperbarui.' });
    } catch (e) {
      console.error('[KlubController.update]', e);
      return res.status(500).json({ success: false, message: 'Gagal memperbarui klub.' });
    }
  },

  // PATCH /api/klub/:id/toggle — Admin/Super Admin toggle aktif/nonaktif
  toggleAktif: async (req, res) => {
    try {
      const id = parseInt(req.params.id);
      const { is_aktif } = req.body;
      if (is_aktif === undefined || is_aktif === null) {
        return res.status(400).json({ success: false, message: 'Field is_aktif wajib disertakan.' });
      }

      const existing = await KlubModel.findById(id);
      if (!existing) return res.status(404).json({ success: false, message: 'Klub tidak ditemukan.' });

      await KlubModel.toggleAktif(id, is_aktif);
      const statusLabel = is_aktif ? 'diaktifkan' : 'dinonaktifkan';
      return res.json({ success: true, message: `Klub berhasil ${statusLabel}.` });
    } catch (e) {
      console.error('[KlubController.toggleAktif]', e);
      return res.status(500).json({ success: false, message: 'Gagal mengubah status klub.' });
    }
  },

  // DELETE /api/klub/:id — Admin/Super Admin hapus klub
  hapus: async (req, res) => {
    try {
      const id = parseInt(req.params.id);
      const existing = await KlubModel.findById(id);
      if (!existing) return res.status(404).json({ success: false, message: 'Klub tidak ditemukan.' });

      // Cek apakah masih ada anggota aktif
      if (existing.jumlah_anggota > 0) {
        return res.status(409).json({
          success: false,
          message: `Klub tidak bisa dihapus karena masih memiliki ${existing.jumlah_anggota} anggota aktif. Nonaktifkan dulu atau keluarkan semua anggota.`,
        });
      }

      await KlubModel.delete(id);
      return res.json({ success: true, message: 'Klub berhasil dihapus.' });
    } catch (e) {
      console.error('[KlubController.hapus]', e);
      return res.status(500).json({ success: false, message: 'Gagal menghapus klub.' });
    }
  },

  // POST /api/klub/:id/daftar — WB mendaftar ke klub
  daftar: async (req, res) => {
    try {
      const wb = await SiswaModel.findByUserId(req.user.id);
      if (!wb) return res.status(404).json({ success: false, message: 'Profil WB tidak ditemukan.' });

      const klub_id = parseInt(req.params.id);
      const sudahAnggota = await KlubModel.isAnggota({ klub_id, warga_belajar_id: wb.id });
      if (sudahAnggota) return res.status(409).json({ success: false, message: 'Anda sudah terdaftar di klub ini.' });

      await KlubModel.daftar({ klub_id, warga_belajar_id: wb.id });
      return res.json({ success: true, message: 'Berhasil mendaftar ke klub.' });
    } catch (e) {
      console.error('[KlubController.daftar]', e);
      return res.status(500).json({ success: false, message: 'Gagal mendaftar ke klub.' });
    }
  },

  // DELETE /api/klub/:id/keluar — WB keluar dari klub
  keluar: async (req, res) => {
    try {
      const wb = await SiswaModel.findByUserId(req.user.id);
      if (!wb) return res.status(404).json({ success: false, message: 'Profil WB tidak ditemukan.' });
      await KlubModel.keluar({ klub_id: parseInt(req.params.id), warga_belajar_id: wb.id });
      return res.json({ success: true, message: 'Berhasil keluar dari klub.' });
    } catch (e) {
      console.error('[KlubController.keluar]', e);
      return res.status(500).json({ success: false, message: 'Gagal keluar dari klub.' });
    }
  },
};

export default KlubController;
