// ============================================================
// controllers/SiswaController.js
// Menangani semua request yang berhubungan dengan Warga Belajar.
// Controller HANYA bertugas: terima request → panggil model → kirim response.
// Logika bisnis ada di model, validasi ada di middleware.
// ============================================================

import SiswaModel from '../models/SiswaModel.js';

const SiswaController = {

  // -----------------------------------------------------------
  // GET /api/siswa
  // Ambil semua Warga Belajar
  // Query params opsional: ?jenjang=paket_a&is_aktif=1
  // Akses: Admin, Tutor, Super Admin
  // -----------------------------------------------------------
  getAll: async (req, res) => {
    try {
      // Ambil filter dari query string (opsional)
      const { jenjang, is_aktif } = req.query;

      const filter = {
        jenjang: jenjang || null,
        // Konversi string '1'/'0' ke boolean/number
        is_aktif: is_aktif !== undefined ? parseInt(is_aktif) : null,
      };

      const siswaList = await SiswaModel.findAll(filter);

      return res.status(200).json({
        success: true,
        message: `${siswaList.length} data warga belajar ditemukan.`,
        data: siswaList,
      });

    } catch (error) {
      console.error('[SiswaController.getAll] Error:', error);
      return res.status(500).json({
        success: false,
        message: 'Gagal mengambil data warga belajar.',
      });
    }
  },

  // -----------------------------------------------------------
  // GET /api/siswa/:id
  // Ambil detail satu Warga Belajar berdasarkan ID
  // Akses: Admin, Tutor, Super Admin, dan WB itu sendiri
  // -----------------------------------------------------------
  getById: async (req, res) => {
    try {
      const { id } = req.params;

      // Validasi ID harus angka
      if (isNaN(id)) {
        return res.status(400).json({
          success: false,
          message: 'ID tidak valid.',
        });
      }

      const siswa = await SiswaModel.findById(parseInt(id));

      if (!siswa) {
        return res.status(404).json({
          success: false,
          message: `Warga belajar dengan ID ${id} tidak ditemukan.`,
        });
      }

      return res.status(200).json({
        success: true,
        data: siswa,
      });

    } catch (error) {
      console.error('[SiswaController.getById] Error:', error);
      return res.status(500).json({
        success: false,
        message: 'Gagal mengambil detail warga belajar.',
      });
    }
  },

  // -----------------------------------------------------------
  // GET /api/siswa/profil/saya
  // WB melihat profilnya sendiri (berdasarkan token JWT)
  // Akses: Warga Belajar
  // -----------------------------------------------------------
  getProfilSaya: async (req, res) => {
    try {
      // req.user.id diisi oleh middleware verifyToken
      const siswa = await SiswaModel.findByUserId(req.user.id);

      if (!siswa) {
        return res.status(404).json({
          success: false,
          message: 'Profil warga belajar tidak ditemukan.',
        });
      }

      return res.status(200).json({
        success: true,
        data: siswa,
      });

    } catch (error) {
      console.error('[SiswaController.getProfilSaya] Error:', error);
      return res.status(500).json({
        success: false,
        message: 'Gagal mengambil profil.',
      });
    }
  },

  // -----------------------------------------------------------
  // PUT /api/siswa/:id
  // Update data Warga Belajar (alamat, wali, no telp, rombel)
  // Akses: Admin, Super Admin
  // -----------------------------------------------------------
  update: async (req, res) => {
    try {
      const { id } = req.params;
      const { alamat, nama_wali, no_telp, rombel_id } = req.body;

      const affectedRows = await SiswaModel.update(parseInt(id), {
        alamat,
        nama_wali,
        no_telp,
        rombel_id,
      });

      if (affectedRows === 0) {
        return res.status(404).json({
          success: false,
          message: `Warga belajar dengan ID ${id} tidak ditemukan.`,
        });
      }

      return res.status(200).json({
        success: true,
        message: 'Data warga belajar berhasil diperbarui.',
      });

    } catch (error) {
      console.error('[SiswaController.update] Error:', error);
      return res.status(500).json({
        success: false,
        message: 'Gagal memperbarui data warga belajar.',
      });
    }
  },

  // -----------------------------------------------------------
  // GET /api/siswa/statistik/per-jenjang
  // Rekap jumlah WB per jenjang (untuk Dashboard Pimpinan)
  // Akses: Pimpinan, Admin, Super Admin
  // -----------------------------------------------------------
  getStatistikPerJenjang: async (req, res) => {
    try {
      const statistik = await SiswaModel.countByJenjang();

      return res.status(200).json({
        success: true,
        data: statistik,
      });

    } catch (error) {
      console.error('[SiswaController.getStatistikPerJenjang] Error:', error);
      return res.status(500).json({
        success: false,
        message: 'Gagal mengambil statistik.',
      });
    }
  },

  // -----------------------------------------------------------
  // GET /api/siswa/rombel/options
  // Ambil daftar rombel aktif untuk dropdown penempatan SPMB
  // Akses: Admin, Super Admin
  // -----------------------------------------------------------
  getRombelOptions: async (req, res) => {
    try {
      const { jenjang } = req.query;
      const rombel = await SiswaModel.getRombelOptions({ jenjang: jenjang || null });

      return res.status(200).json({
        success: true,
        data: rombel,
      });
    } catch (error) {
      console.error('[SiswaController.getRombelOptions] Error:', error);
      return res.status(500).json({
        success: false,
        message: 'Gagal mengambil daftar rombel.',
      });
    }
  },

  // -----------------------------------------------------------
  // GET /api/siswa/mapel/options
  // Ambil daftar mata pelajaran untuk dropdown form tutor/admin
  // Akses: Admin, Super Admin, Tutor
  // -----------------------------------------------------------
  getMapelOptions: async (req, res) => {
    try {
      const { jenjang, rombel_id } = req.query;
      const mapel = await SiswaModel.getMapelOptions({
        jenjang: jenjang || null,
        rombel_id: rombel_id ? parseInt(rombel_id) : null,
      });

      return res.status(200).json({
        success: true,
        data: mapel,
      });
    } catch (error) {
      console.error('[SiswaController.getMapelOptions] Error:', error);
      return res.status(500).json({
        success: false,
        message: 'Gagal mengambil daftar mata pelajaran.',
      });
    }
  },
};

export default SiswaController;
