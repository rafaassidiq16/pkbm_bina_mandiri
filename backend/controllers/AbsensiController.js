// ============================================================
// controllers/AbsensiController.js
// Menangani seluruh alur Absensi Dual-Mode:
// - Buka/tutup sesi (Tutor)
// - Submit manual (Tutor isi semua WB sekaligus)
// - Check-in mandiri (WB menekan tombol sendiri dalam timer)
// - Laporan dan rekap kehadiran
// ============================================================

import AbsensiModel from '../models/AbsensiModel.js';
import SiswaModel from '../models/SiswaModel.js';

const AbsensiController = {

  // -----------------------------------------------------------
  // POST /api/absensi/sesi
  // Tutor membuka sesi absensi baru untuk rombel-nya
  // Body: { rombel_id, mapel_id, tanggal, mode, durasi_timer }
  // mode: 'manual' atau 'mandiri'
  // durasi_timer: detik (contoh: 300 = 5 menit), wajib jika mode=mandiri
  // Akses: Tutor
  // -----------------------------------------------------------
  bukaSesi: async (req, res) => {
    try {
      const { rombel_id, mapel_id, tanggal, mode, durasi_timer } = req.body;

      if (!rombel_id || !tanggal || !mode) {
        return res.status(400).json({
          success: false,
          message: 'Field wajib: rombel_id, tanggal, mode (manual/mandiri).',
        });
      }

      if (mode === 'mandiri' && !durasi_timer) {
        return res.status(400).json({
          success: false,
          message: 'durasi_timer wajib diisi untuk mode mandiri (dalam detik, contoh: 300).',
        });
      }

      const sesiId = await AbsensiModel.bukasSesi({
        tutor_id: req.user.id,
        rombel_id: parseInt(rombel_id),
        mapel_id: mapel_id ? parseInt(mapel_id) : null,
        tanggal,
        mode,
        durasi_timer: durasi_timer ? parseInt(durasi_timer) : null,
      });

      return res.status(201).json({
        success: true,
        message: `Sesi absensi ${mode} berhasil dibuka.`,
        data: {
          sesi_id: sesiId,
          mode,
          // Kirim waktu mulai agar frontend bisa menghitung countdown timer
          waktu_mulai: new Date().toISOString(),
          durasi_timer: durasi_timer || null,
        },
      });
    } catch (error) {
      console.error('[AbsensiController.bukaSesi] Error:', error);
      return res.status(500).json({ success: false, message: 'Gagal membuka sesi absensi.' });
    }
  },

  // -----------------------------------------------------------
  // PUT /api/absensi/sesi/:sesiId/tutup
  // Tutor menutup sesi absensi secara manual
  // (Sesi mandiri juga bisa ditutup otomatis via timer di frontend)
  // Akses: Tutor
  // -----------------------------------------------------------
  tutupSesi: async (req, res) => {
    try {
      const { sesiId } = req.params;
      const affected = await AbsensiModel.tutupSesi(parseInt(sesiId), req.user.id);

      if (affected === 0) {
        return res.status(404).json({
          success: false,
          message: 'Sesi tidak ditemukan, bukan milik Anda, atau sudah ditutup sebelumnya.',
        });
      }

      return res.status(200).json({
        success: true,
        message: 'Sesi absensi berhasil ditutup.',
      });
    } catch (error) {
      console.error('[AbsensiController.tutupSesi] Error:', error);
      return res.status(500).json({ success: false, message: 'Gagal menutup sesi.' });
    }
  },

  // -----------------------------------------------------------
  // GET /api/absensi/sesi/:sesiId
  // Detail satu sesi beserta daftar kehadiran WB
  // Digunakan Tutor untuk melihat rekap real-time
  // Akses: Tutor, Admin
  // -----------------------------------------------------------
  getSesiById: async (req, res) => {
    try {
      const sesi = await AbsensiModel.findSesiById(parseInt(req.params.sesiId));
      if (!sesi) {
        return res.status(404).json({ success: false, message: 'Sesi tidak ditemukan.' });
      }
      return res.status(200).json({ success: true, data: sesi });
    } catch (error) {
      console.error('[AbsensiController.getSesiById] Error:', error);
      return res.status(500).json({ success: false, message: 'Gagal mengambil detail sesi.' });
    }
  },

  // -----------------------------------------------------------
  // GET /api/absensi/sesi/:sesiId/daftar-wb
  // Daftar semua WB di sesi ini dengan status check-in masing-masing
  // Endpoint ini dipanggil polling/WebSocket oleh frontend Tutor
  // untuk melihat siapa yang sudah/belum check-in secara real-time
  // Akses: Tutor
  // -----------------------------------------------------------
  getDaftarWbDiSesi: async (req, res) => {
    try {
      const { sesiId } = req.params;
      const daftar = await AbsensiModel.getDaftarWbDiSesi(parseInt(sesiId));
      return res.status(200).json({ success: true, data: daftar });
    } catch (error) {
      console.error('[AbsensiController.getDaftarWbDiSesi] Error:', error);
      return res.status(500).json({ success: false, message: 'Gagal mengambil daftar WB.' });
    }
  },

  // -----------------------------------------------------------
  // GET /api/absensi/sesi-aktif
  // Ambil sesi yang sedang aktif milik Tutor yang login
  // Berguna saat Tutor refresh halaman — cek apakah ada sesi yang masih berjalan
  // Akses: Tutor
  // -----------------------------------------------------------
  getSesiAktif: async (req, res) => {
    try {
      let sesi = null;

      if (req.user.role === 'warga_belajar') {
        const wb = await SiswaModel.findByUserId(req.user.id);
        if (!wb || !wb.rombel_id) {
          return res.status(200).json({ success: true, data: null });
        }
        sesi = await AbsensiModel.getSesiAktifWb({
          warga_belajar_id: wb.id,
          rombel_id: wb.rombel_id,
        });
      } else {
        sesi = await AbsensiModel.getSesiAktifTutor(req.user.id);
      }

      return res.status(200).json({ success: true, data: sesi });
    } catch (error) {
      console.error('[AbsensiController.getSesiAktif] Error:', error);
      return res.status(500).json({ success: false, message: 'Gagal mengambil sesi aktif.' });
    }
  },

  // -----------------------------------------------------------
  // POST /api/absensi/sesi/:sesiId/submit-manual
  // Tutor mengumpulkan absensi manual (isi status semua WB sekaligus)
  // Body: { kehadiran: [{ warga_belajar_id, status }] }
  // status: hadir / izin / sakit / alpa
  // Akses: Tutor
  // -----------------------------------------------------------
  submitManual: async (req, res) => {
    try {
      const { sesiId } = req.params;
      const { kehadiran } = req.body;

      if (!kehadiran || !Array.isArray(kehadiran) || kehadiran.length === 0) {
        return res.status(400).json({
          success: false,
          message: 'Field kehadiran wajib berupa array dan tidak boleh kosong.',
        });
      }

      // Validasi setiap item dalam array
      const statusValid = ['hadir', 'izin', 'sakit', 'alpa'];
      for (const item of kehadiran) {
        if (!item.warga_belajar_id || !statusValid.includes(item.status)) {
          return res.status(400).json({
            success: false,
            message: 'Setiap item harus punya warga_belajar_id dan status (hadir/izin/sakit/alpa).',
          });
        }
      }

      const jumlah = await AbsensiModel.submitManual(parseInt(sesiId), kehadiran);

      return res.status(200).json({
        success: true,
        message: `Absensi manual berhasil disimpan untuk ${jumlah} Warga Belajar.`,
      });
    } catch (error) {
      console.error('[AbsensiController.submitManual] Error:', error);
      return res.status(500).json({ success: false, message: 'Gagal menyimpan absensi manual.' });
    }
  },

  // -----------------------------------------------------------
  // POST /api/absensi/sesi/:sesiId/checkin
  // Warga Belajar melakukan check-in mandiri
  // Tidak perlu body — user_id diambil dari JWT token
  // Akses: Warga Belajar
  // -----------------------------------------------------------
  checkInMandiri: async (req, res) => {
    try {
      const { sesiId } = req.params;

      // Dapatkan profil WB dari user yang login
      const wb = await SiswaModel.findByUserId(req.user.id);
      if (!wb) {
        return res.status(403).json({
          success: false,
          message: 'Profil Warga Belajar tidak ditemukan untuk akun ini.',
        });
      }

      // Proses check-in (validasi timer ada di model)
      await AbsensiModel.checkInMandiri(parseInt(sesiId), wb.id);

      return res.status(200).json({
        success: true,
        message: 'Check-in berhasil! Kehadiran Anda telah tercatat.',
        data: { waktu_check_in: new Date().toISOString() },
      });

    } catch (error) {
      // Error dari validasi (timer habis, sudah check-in, dll.) dikembalikan ke user
      console.error('[AbsensiController.checkInMandiri] Error:', error.message);
      return res.status(400).json({
        success: false,
        message: error.message || 'Gagal melakukan check-in.',
      });
    }
  },

  // -----------------------------------------------------------
  // GET /api/absensi/rombel/:rombelId
  // Riwayat semua sesi absensi di satu rombel
  // Akses: Tutor, Admin
  // -----------------------------------------------------------
  getSesiByRombel: async (req, res) => {
    try {
      const { rombelId } = req.params;
      const { tanggal, status_sesi } = req.query;

      const sesi = await AbsensiModel.findSesiByRombel(parseInt(rombelId), {
        tanggal: tanggal || null,
        status_sesi: status_sesi || null,
      });

      return res.status(200).json({ success: true, data: sesi });
    } catch (error) {
      console.error('[AbsensiController.getSesiByRombel] Error:', error);
      return res.status(500).json({ success: false, message: 'Gagal mengambil riwayat sesi.' });
    }
  },

  // -----------------------------------------------------------
  // GET /api/absensi/rekap/saya
  // WB melihat rekap kehadiran pribadinya sendiri
  // Akses: Warga Belajar
  // -----------------------------------------------------------
  getRekapSaya: async (req, res) => {
    try {
      const wb = await SiswaModel.findByUserId(req.user.id);
      if (!wb) {
        return res.status(404).json({ success: false, message: 'Profil WB tidak ditemukan.' });
      }

      const { tanggal_mulai, tanggal_selesai } = req.query;
      const riwayat = await AbsensiModel.getRekapWb(wb.id, {
        rombel_id: wb.rombel_id,
        tanggal_mulai: tanggal_mulai || null,
        tanggal_selesai: tanggal_selesai || null,
      });

      const ringkasan = riwayat.reduce((acc, item) => {
        acc.total_pertemuan += 1;

        if (item.status === 'hadir') acc.hadir += 1;
        else if (item.status === 'izin') acc.izin += 1;
        else if (item.status === 'sakit') acc.sakit += 1;
        else if (item.status === 'alpa') acc.alpa += 1;

        return acc;
      }, {
        total_pertemuan: 0,
        hadir: 0,
        izin: 0,
        sakit: 0,
        alpa: 0,
      });

      const persentase_hadir = ringkasan.total_pertemuan > 0
        ? Math.round((ringkasan.hadir / ringkasan.total_pertemuan) * 100)
        : 0;

      return res.status(200).json({
        success: true,
        data: {
          ...ringkasan,
          persentase_hadir,
          riwayat,
        },
      });
    } catch (error) {
      console.error('[AbsensiController.getRekapSaya] Error:', error);
      return res.status(500).json({ success: false, message: 'Gagal mengambil rekap kehadiran.' });
    }
  },
};

export default AbsensiController;
