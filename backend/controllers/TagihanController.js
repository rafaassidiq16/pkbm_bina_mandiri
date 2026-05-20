// ============================================================
// controllers/TagihanController.js
// Menangani semua operasi Keuangan: tagihan SPP/modul dan pembayaran.
// ============================================================

import TagihanModel from '../models/TagihanModel.js';
import upload from '../config/multer.js';
import SiswaModel from '../models/SiswaModel.js';

const TagihanController = {

  // -----------------------------------------------------------
  // GET /api/tagihan
  // Ambil semua tagihan. Filter via query: ?status=belum_bayar&warga_belajar_id=5
  // Akses: Admin, Super Admin
  // -----------------------------------------------------------
  getAll: async (req, res) => {
    try {
      const { status, warga_belajar_id, tahun_ajaran_id } = req.query;
      let targetWbId = warga_belajar_id ? parseInt(warga_belajar_id) : null;

      // Jika yang login adalah WB, paksa hanya melihat tagihannya sendiri.
      if (req.user.role === 'warga_belajar') {
        const wb = await SiswaModel.findByUserId(req.user.id);
        if (!wb) {
          return res.status(404).json({
            success: false,
            message: 'Profil warga belajar tidak ditemukan.',
          });
        }
        targetWbId = wb.id;
      }

      const tagihan = await TagihanModel.findAll({
        status: status || null,
        warga_belajar_id: targetWbId,
        tahun_ajaran_id:  tahun_ajaran_id  ? parseInt(tahun_ajaran_id)  : null,
      });

      return res.status(200).json({
        success: true,
        message: `${tagihan.length} tagihan ditemukan.`,
        data: tagihan,
      });
    } catch (error) {
      console.error('[TagihanController.getAll] Error:', error);
      return res.status(500).json({ success: false, message: 'Gagal mengambil data tagihan.' });
    }
  },

  // -----------------------------------------------------------
  // GET /api/tagihan/tunggakan
  // Daftar WB dengan tunggakan belum bayar
  // Akses: Admin, Pimpinan, Super Admin
  // -----------------------------------------------------------
  getTunggakan: async (req, res) => {
    try {
      const tunggakan = await TagihanModel.getTunggakan();
      return res.status(200).json({ success: true, data: tunggakan });
    } catch (error) {
      console.error('[TagihanController.getTunggakan] Error:', error);
      return res.status(500).json({ success: false, message: 'Gagal mengambil data tunggakan.' });
    }
  },

  // -----------------------------------------------------------
  // GET /api/tagihan/ringkasan-bulanan
  // Rekap keuangan per bulan untuk grafik Pimpinan
  // Akses: Admin, Pimpinan, Super Admin
  // -----------------------------------------------------------
  getRingkasanBulanan: async (req, res) => {
    try {
      const data = await TagihanModel.getRingkasanBulanan();
      return res.status(200).json({ success: true, data });
    } catch (error) {
      console.error('[TagihanController.getRingkasanBulanan] Error:', error);
      return res.status(500).json({ success: false, message: 'Gagal mengambil ringkasan keuangan.' });
    }
  },

  // -----------------------------------------------------------
  // GET /api/tagihan/:id
  // Detail tagihan + riwayat pembayaran
  // Akses: Admin, Super Admin, dan WB pemilik tagihan
  // -----------------------------------------------------------
  getById: async (req, res) => {
    try {
      const tagihan = await TagihanModel.findById(parseInt(req.params.id));
      if (!tagihan) {
        return res.status(404).json({ success: false, message: 'Tagihan tidak ditemukan.' });
      }
      return res.status(200).json({ success: true, data: tagihan });
    } catch (error) {
      console.error('[TagihanController.getById] Error:', error);
      return res.status(500).json({ success: false, message: 'Gagal mengambil detail tagihan.' });
    }
  },

  // -----------------------------------------------------------
  // POST /api/tagihan
  // Buat tagihan baru untuk satu WB
  // Body: { warga_belajar_id, jenis_tagihan, keterangan, jumlah, tanggal_jatuh_tempo }
  // Akses: Admin, Super Admin
  // -----------------------------------------------------------
  create: async (req, res) => {
    try {
      const { warga_belajar_id, jenis_tagihan, keterangan, jumlah, tanggal_jatuh_tempo } = req.body;

      if (!warga_belajar_id || !jenis_tagihan || !keterangan || !jumlah || !tanggal_jatuh_tempo) {
        return res.status(400).json({
          success: false,
          message: 'Field wajib: warga_belajar_id, jenis_tagihan, keterangan, jumlah, tanggal_jatuh_tempo.',
        });
      }

      // Ambil tahun ajaran aktif
      const [taRows] = await (await import('../config/db.js')).default.execute(
        `SELECT id FROM tahun_ajaran WHERE is_aktif = 1 LIMIT 1`
      );

      const id = await TagihanModel.create({
        warga_belajar_id: parseInt(warga_belajar_id),
        jenis_tagihan,
        keterangan,
        jumlah: parseFloat(jumlah),
        tanggal_jatuh_tempo,
        tahun_ajaran_id: taRows[0]?.id || null,
        dibuat_oleh: req.user.id,
      });

      return res.status(201).json({
        success: true,
        message: 'Tagihan berhasil dibuat.',
        data: { id },
      });
    } catch (error) {
      console.error('[TagihanController.create] Error:', error);
      return res.status(500).json({ success: false, message: 'Gagal membuat tagihan.' });
    }
  },

  // -----------------------------------------------------------
  // POST /api/tagihan/massal
  // Buat tagihan SPP sekaligus untuk semua WB di satu jenjang
  // Body: { jenjang, jenis_tagihan, keterangan, jumlah, tanggal_jatuh_tempo }
  // Akses: Admin, Super Admin
  // -----------------------------------------------------------
  createMassal: async (req, res) => {
    try {
      const { jenjang, jenis_tagihan, keterangan, jumlah, tanggal_jatuh_tempo } = req.body;

      if (!jenjang || !jenis_tagihan || !keterangan || !jumlah || !tanggal_jatuh_tempo) {
        return res.status(400).json({ success: false, message: 'Semua field wajib diisi.' });
      }

      const [taRows] = await (await import('../config/db.js')).default.execute(
        `SELECT id FROM tahun_ajaran WHERE is_aktif = 1 LIMIT 1`
      );

      const jumlahTagihan = await TagihanModel.createMassal({
        jenjang,
        jenis_tagihan,
        keterangan,
        jumlah: parseFloat(jumlah),
        tanggal_jatuh_tempo,
        tahun_ajaran_id: taRows[0]?.id || null,
        dibuat_oleh: req.user.id,
      });

      return res.status(201).json({
        success: true,
        message: `${jumlahTagihan} tagihan berhasil dibuat untuk jenjang ${jenjang}.`,
        data: { jumlah_tagihan_dibuat: jumlahTagihan },
      });
    } catch (error) {
      console.error('[TagihanController.createMassal] Error:', error);
      return res.status(500).json({ success: false, message: 'Gagal membuat tagihan massal.' });
    }
  },

  // -----------------------------------------------------------
  // POST /api/tagihan/:id/bayar
  // Catat pembayaran untuk satu tagihan
  // Mendukung upload bukti transfer via Multer
  // Body (multipart/form-data): { jumlah_bayar, tanggal_bayar, metode, keterangan, file: bukti }
  // Akses: Admin, Super Admin
  // -----------------------------------------------------------
  catatPembayaran: async (req, res) => {
    try {
      const { id } = req.params;
      const { jumlah_bayar, tanggal_bayar, metode, keterangan } = req.body;

      if (!jumlah_bayar || !tanggal_bayar || !metode) {
        return res.status(400).json({
          success: false,
          message: 'Field wajib: jumlah_bayar, tanggal_bayar, metode.',
        });
      }

      const pembayaranId = await TagihanModel.catatPembayaran({
        tagihan_id:   parseInt(id),
        jumlah_bayar: parseFloat(jumlah_bayar),
        tanggal_bayar,
        metode,
        // Path bukti transfer (opsional, diisi jika ada file terupload)
        bukti_path:  req.file ? req.file.path : null,
        keterangan:  keterangan || null,
        dicatat_oleh: req.user.id,
      });

      return res.status(201).json({
        success: true,
        message: 'Pembayaran berhasil dicatat. Status tagihan diperbarui otomatis.',
        data: { pembayaran_id: pembayaranId },
      });
    } catch (error) {
      console.error('[TagihanController.catatPembayaran] Error:', error);
      return res.status(500).json({ success: false, message: 'Gagal mencatat pembayaran.' });
    }
  },
};

export default TagihanController;
