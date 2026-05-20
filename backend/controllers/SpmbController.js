// ============================================================
// controllers/SpmbController.js
// Menangani semua alur SPMB (Seleksi Penerimaan Murid/Warga Baru):
// - Pendaftaran publik (tanpa login)
// - Upload berkas calon WB
// - Verifikasi & keputusan Admin TU
// - Pipeline otomatis saat status = 'diterima'
// ============================================================

import SpmbModel from '../models/SpmbModel.js';
import UserModel from '../models/UserModel.js';
import SiswaModel from '../models/SiswaModel.js';
import { hashPassword, generateNIS } from '../utils/helpers.js';
import pool from '../config/db.js';

const SpmbController = {

  // -----------------------------------------------------------
  // POST /api/spmb/daftar  [PUBLIK — tanpa login]
  // Calon WB mengisi & submit form pendaftaran online
  // Body: { nama_lengkap, email, no_telp, jenjang_daftar,
  //         tanggal_lahir, jenis_kelamin, alamat, nama_wali }
  // -----------------------------------------------------------
  daftar: async (req, res) => {
    try {
      const {
        nama_lengkap, email, nik, no_telp, jenjang_daftar,
        tanggal_lahir, jenis_kelamin, alamat, nama_wali, password,
      } = req.body;

      // Validasi field wajib
      if (!nama_lengkap || !email || !no_telp || !jenjang_daftar ||
          !tanggal_lahir || !jenis_kelamin || !alamat || !nama_wali || !password) {
        return res.status(400).json({
          success: false,
          message: 'Semua field wajib diisi. Pastikan tidak ada yang kosong.',
        });
      }

      if (String(password).length < 8) {
        return res.status(400).json({
          success: false,
          message: 'Password minimal 8 karakter.',
        });
      }

      // Validasi format jenjang
      const jenjangValid = ['paket_a', 'paket_b', 'paket_c'];
      if (!jenjangValid.includes(jenjang_daftar)) {
        return res.status(400).json({
          success: false,
          message: 'Jenjang tidak valid. Pilih: paket_a, paket_b, atau paket_c.',
        });
      }

      // Ambil tahun ajaran aktif dari database
      const [taRows] = await pool.execute(
        `SELECT id FROM tahun_ajaran WHERE is_aktif = 1 LIMIT 1`
      );
      if (!taRows[0]) {
        return res.status(503).json({
          success: false,
          message: 'Pendaftaran belum dibuka. Tahun ajaran aktif belum dikonfigurasi.',
        });
      }
      const tahun_ajaran_id = taRows[0].id;

      const password_hash = await hashPassword(password);

      // Cek duplikasi: email yang sama di tahun ajaran yang sama
      const sudahDaftar = await SpmbModel.cekEmailTerdaftar(email, tahun_ajaran_id);
      if (sudahDaftar) {
        return res.status(409).json({
          success: false,
          message: 'Email ini sudah pernah mendaftar pada tahun ajaran aktif. ' +
                   'Silakan hubungi staf TU untuk informasi lebih lanjut.',
        });
      }

      // Simpan data pendaftaran ke database (status awal: 'pending')
      const pendaftarId = await SpmbModel.create({
        nama_lengkap, email, nik, no_telp, jenjang_daftar,
        tanggal_lahir, jenis_kelamin, alamat, nama_wali, password_hash, tahun_ajaran_id,
      });

      return res.status(201).json({
        success: true,
        message: 'Pendaftaran berhasil dikirim! Silakan upload berkas pendukung.',
        data: {
          pendaftar_id: pendaftarId,
          // Kembalikan ID agar frontend bisa langsung redirect ke halaman upload berkas
          pesan: 'Simpan nomor pendaftaran Anda: #' + pendaftarId,
        },
      });

    } catch (error) {
      console.error('[SpmbController.daftar] Error:', error);
      return res.status(500).json({ success: false, message: 'Gagal menyimpan pendaftaran.' });
    }
  },

  // -----------------------------------------------------------
  // POST /api/spmb/:id/berkas  [PUBLIK — tanpa login]
  // Upload berkas pendukung (KK, ijazah, foto) untuk satu pendaftar
  // Menggunakan Multer — file sudah tersimpan ke disk oleh middleware
  // -----------------------------------------------------------
  uploadBerkas: async (req, res) => {
    try {
      const { id } = req.params;
      const { jenis_berkas } = req.body;

      // Pastikan file benar-benar terupload oleh Multer
      if (!req.file) {
        return res.status(400).json({
          success: false,
          message: 'Tidak ada file yang diupload.',
        });
      }

      // Validasi jenis berkas
      const jenisValid = ['kk', 'ijazah', 'foto', 'dokumen_lain'];
      if (!jenis_berkas || !jenisValid.includes(jenis_berkas)) {
        return res.status(400).json({
          success: false,
          message: 'Jenis berkas tidak valid. Pilih: kk, ijazah, foto, atau dokumen_lain.',
        });
      }

      // Pastikan pendaftar dengan ID ini memang ada
      const pendaftar = await SpmbModel.findById(parseInt(id));
      if (!pendaftar) {
        return res.status(404).json({
          success: false,
          message: `Pendaftar dengan ID ${id} tidak ditemukan.`,
        });
      }

      // Simpan info berkas ke database
      const berkasId = await SpmbModel.tambahBerkas({
        pendaftar_id: parseInt(id),
        jenis_berkas,
        nama_file: req.file.originalname,
        // Path disimpan relatif dari root backend, akses via /uploads/spmb/namafile
        path_file: req.file.path,
      });

      return res.status(201).json({
        success: true,
        message: `Berkas '${jenis_berkas}' berhasil diupload.`,
        data: { berkas_id: berkasId, path: req.file.path },
      });

    } catch (error) {
      console.error('[SpmbController.uploadBerkas] Error:', error);
      return res.status(500).json({ success: false, message: 'Gagal mengupload berkas.' });
    }
  },

  // -----------------------------------------------------------
  // GET /api/spmb  [Admin, Super Admin]
  // Ambil semua pendaftar untuk antrian verifikasi
  // Query params opsional: ?status=pending&tahun_ajaran_id=1
  // -----------------------------------------------------------
  getAll: async (req, res) => {
    try {
      const { status, tahun_ajaran_id } = req.query;
      const pendaftar = await SpmbModel.findAll({
        status: status || null,
        tahun_ajaran_id: tahun_ajaran_id ? parseInt(tahun_ajaran_id) : null,
      });

      return res.status(200).json({
        success: true,
        message: `${pendaftar.length} data pendaftar ditemukan.`,
        data: pendaftar,
      });
    } catch (error) {
      console.error('[SpmbController.getAll] Error:', error);
      return res.status(500).json({ success: false, message: 'Gagal mengambil data pendaftar.' });
    }
  },

  // -----------------------------------------------------------
  // GET /api/spmb/statistik  [Admin, Pimpinan, Super Admin]
  // Widget angka ringkasan: total, pending, diterima, ditolak
  // -----------------------------------------------------------
  getStatistik: async (req, res) => {
    try {
      const statistik = await SpmbModel.getStatistik();
      return res.status(200).json({ success: true, data: statistik });
    } catch (error) {
      console.error('[SpmbController.getStatistik] Error:', error);
      return res.status(500).json({ success: false, message: 'Gagal mengambil statistik SPMB.' });
    }
  },

  // -----------------------------------------------------------
  // GET /api/spmb/:id  [Admin, Super Admin]
  // Detail satu pendaftar beserta semua berkas yang diupload
  // -----------------------------------------------------------
  getById: async (req, res) => {
    try {
      const { id } = req.params;
      const pendaftar = await SpmbModel.findById(parseInt(id));

      if (!pendaftar) {
        return res.status(404).json({
          success: false,
          message: `Pendaftar dengan ID ${id} tidak ditemukan.`,
        });
      }

      return res.status(200).json({ success: true, data: pendaftar });
    } catch (error) {
      console.error('[SpmbController.getById] Error:', error);
      return res.status(500).json({ success: false, message: 'Gagal mengambil detail pendaftar.' });
    }
  },

  // -----------------------------------------------------------
  // PUT /api/spmb/berkas/:berkasId/verifikasi  [Admin]
  // Admin memverifikasi satu berkas: valid atau tidak_valid
  // Body: { status_verifikasi: 'valid'|'tidak_valid', catatan }
  // -----------------------------------------------------------
  verifikasiBerkas: async (req, res) => {
    try {
      const { berkasId } = req.params;
      const { status_verifikasi, catatan } = req.body;

      const statusValid = ['valid', 'tidak_valid'];
      if (!status_verifikasi || !statusValid.includes(status_verifikasi)) {
        return res.status(400).json({
          success: false,
          message: 'Status verifikasi harus "valid" atau "tidak_valid".',
        });
      }

      const affected = await SpmbModel.updateStatusBerkas(parseInt(berkasId), {
        status_verifikasi,
        catatan: catatan || null,
      });

      if (affected === 0) {
        return res.status(404).json({ success: false, message: 'Berkas tidak ditemukan.' });
      }

      return res.status(200).json({
        success: true,
        message: `Berkas berhasil ditandai sebagai '${status_verifikasi}'.`,
      });
    } catch (error) {
      console.error('[SpmbController.verifikasiBerkas] Error:', error);
      return res.status(500).json({ success: false, message: 'Gagal memverifikasi berkas.' });
    }
  },

  // -----------------------------------------------------------
  // PUT /api/spmb/:id/keputusan  [Admin]
  // Keputusan akhir: TERIMA atau TOLAK pendaftar
  // Body: { status: 'diterima'|'ditolak', catatan_verifikasi, rombel_id }
  //
  // ⭐ PIPELINE KRITIS: Jika status = 'diterima', sistem otomatis:
  //   1. Buat akun user baru (role: warga_belajar)
  //   2. Generate NIS otomatis
  //   3. Buat profil warga_belajar dan assign ke rombel
  //   4. Catat warga_belajar_id ke pendaftar_spmb
  //   SEMUA langkah ini dalam SATU transaksi atomik (jika salah satu gagal, semua dibatalkan)
  // -----------------------------------------------------------
  buatKeputusan: async (req, res) => {
    // Mulai transaksi database untuk memastikan atomisitas
    const connection = await pool.getConnection();
    await connection.beginTransaction();

    try {
      const { id } = req.params;
      const { status, catatan_verifikasi, rombel_id } = req.body;

      // Validasi input
      const statusValid = ['diterima', 'ditolak'];
      if (!status || !statusValid.includes(status)) {
        await connection.rollback();
        connection.release();
        return res.status(400).json({
          success: false,
          message: 'Status harus "diterima" atau "ditolak".',
        });
      }

      // Ambil data pendaftar
      const pendaftar = await SpmbModel.findById(parseInt(id));
      if (!pendaftar) {
        await connection.rollback();
        connection.release();
        return res.status(404).json({ success: false, message: 'Pendaftar tidak ditemukan.' });
      }

      // Cegah verifikasi ulang jika sudah ada keputusan sebelumnya
      if (pendaftar.status !== 'pending') {
        await connection.rollback();
        connection.release();
        return res.status(409).json({
          success: false,
          message: `Pendaftar ini sudah berstatus '${pendaftar.status}'. Tidak dapat diubah lagi.`,
        });
      }

      // Update status pendaftar terlebih dahulu
      await SpmbModel.updateStatus(parseInt(id), {
        status,
        catatan_verifikasi: catatan_verifikasi || null,
        diverifikasi_oleh: req.user.id, // ID Admin yang login (dari token JWT)
      });

      // =========================================================
      // PIPELINE OTOMATIS — Hanya berjalan jika status = 'diterima'
      // =========================================================
      if (status === 'diterima') {
        if (!rombel_id) {
          await connection.rollback();
          connection.release();
          return res.status(400).json({
            success: false,
            message: 'rombel_id wajib diisi saat menerima pendaftar.',
          });
        }

        const berkasWajib = ['kk', 'ijazah', 'foto'];
        const berkasPendaftar = Array.isArray(pendaftar.berkas) ? pendaftar.berkas : [];
        const berkasBelumLengkap = berkasWajib.filter(
          (jenis) => !berkasPendaftar.some((berkas) => berkas.jenis_berkas === jenis)
        );
        const berkasBelumValid = berkasWajib.filter(
          (jenis) => !berkasPendaftar.some(
            (berkas) => berkas.jenis_berkas === jenis && berkas.status_verifikasi === 'valid'
          )
        );

        if (berkasBelumLengkap.length > 0) {
          await connection.rollback();
          connection.release();
          return res.status(400).json({
            success: false,
            message: `Pendaftar belum mengunggah semua berkas wajib: ${berkasBelumLengkap.join(', ')}.`,
          });
        }

        if (berkasBelumValid.length > 0) {
          await connection.rollback();
          connection.release();
          return res.status(400).json({
            success: false,
            message: `Semua berkas wajib harus diverifikasi valid sebelum pendaftar diterima. Berkas yang belum valid: ${berkasBelumValid.join(', ')}.`,
          });
        }

        // Langkah 1: Buat akun user baru dengan password yang dibuat saat pendaftaran.
        // Fallback ke no_telp untuk data lama yang belum punya password_hash.
        const password_hash = pendaftar.password_hash || await hashPassword(pendaftar.no_telp);

        const userId = await UserModel.create({
          nama_lengkap: pendaftar.nama_lengkap,
          email: pendaftar.email,
          password_hash,
          role: 'warga_belajar',
        });

        // Langkah 2: Generate NIS otomatis (format: PKBM-2025-0001)
        const totalWb = await SpmbModel.hitungTotalWbUntukNIS();

        // Langkah 3: Buat profil warga_belajar & assign ke rombel
        // Ambil tahun ajaran dari data pendaftar
        const [taRows] = await connection.execute(
          `SELECT id, nama_tahun_ajaran FROM tahun_ajaran WHERE is_aktif = 1 LIMIT 1`
        );
        const tahunAjaranAktif = taRows[0];
        const tahun_ajaran_id = tahunAjaranAktif?.id;
        const nis = generateNIS(totalWb + 1, tahunAjaranAktif?.nama_tahun_ajaran);

        const wbId = await SiswaModel.create({
          user_id: userId,
          nis,
          nik: pendaftar.nik,
          jenjang: pendaftar.jenjang_daftar,
          tanggal_lahir: pendaftar.tanggal_lahir,
          jenis_kelamin: pendaftar.jenis_kelamin,
          alamat: pendaftar.alamat,
          nama_wali: pendaftar.nama_wali,
          no_telp: pendaftar.no_telp,
          rombel_id: parseInt(rombel_id),
          tahun_ajaran_id,
        });

        // Langkah 4: Catat ID WB ke data pendaftar (untuk referensi)
        await SpmbModel.catatWargaBelajarId(parseInt(id), wbId);

        // Langkah 5: Daftarkan otomatis ke semua mata pelajaran di rombel tersebut
        // (Ini bagian integrasi SIAKAD → LMS)
        // Data mapel akan dibutuhkan saat WB pertama kali masuk LMS
        // Implementasi notifikasi email bisa ditambahkan di sini

        // Semua berhasil — commit transaksi
        await connection.commit();
        connection.release();

        return res.status(200).json({
          success: true,
          message: `Pendaftar '${pendaftar.nama_lengkap}' berhasil DITERIMA. ` +
                   `Akun WB telah dibuat. NIS: ${nis}.`,
          data: {
            warga_belajar_id: wbId,
            nis,
            user_id: userId,
          },
        });
      }

      // Jika ditolak, tidak ada pipeline tambahan — langsung commit
      await connection.commit();
      connection.release();

      return res.status(200).json({
        success: true,
        message: `Pendaftar '${pendaftar.nama_lengkap}' telah DITOLAK.`,
      });

    } catch (error) {
      // Rollback semua perubahan jika ada langkah yang gagal
      await connection.rollback();
      connection.release();
      console.error('[SpmbController.buatKeputusan] Error:', error);
      return res.status(500).json({
        success: false,
        message: 'Pipeline SPMB gagal. Semua perubahan dibatalkan. Error: ' + error.message,
      });
    }
  },
};

export default SpmbController;
