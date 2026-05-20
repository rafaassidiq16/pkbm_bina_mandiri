// ============================================================
// models/AbsensiModel.js
// Model untuk Absensi Dual-Mode:
// - Mode MANUAL: Tutor mengisi kehadiran seluruh rombel sekaligus
// - Mode MANDIRI: Tutor aktifkan sesi → WB check-in sendiri dalam timer
// ============================================================

import pool from '../config/db.js';

const AbsensiModel = {

  // -----------------------------------------------------------
  // Buka sesi absensi baru untuk satu rombel
  // Dipanggil Tutor saat memulai pertemuan
  // -----------------------------------------------------------
  bukasSesi: async ({ tutor_id, rombel_id, mapel_id, tanggal, mode, durasi_timer = null }) => {
    const sql = `
      INSERT INTO sesi_absensi
        (tutor_id, rombel_id, mapel_id, tanggal, mode, waktu_mulai, durasi_timer, status_sesi)
      VALUES (?, ?, ?, ?, ?, NOW(), ?, 'aktif')
    `;
    const [result] = await pool.execute(sql, [
      tutor_id, rombel_id, mapel_id || null,
      tanggal, mode, durasi_timer,
    ]);
    return result.insertId;
  },

  // -----------------------------------------------------------
  // Tutup sesi absensi (status menjadi 'selesai')
  // Dipanggil otomatis saat timer habis atau manual oleh Tutor
  // -----------------------------------------------------------
  tutupSesi: async (sesi_id, tutor_id = null) => {
    const sql = `
      UPDATE sesi_absensi
      SET status_sesi = 'selesai', waktu_selesai = NOW()
      WHERE id = ? AND status_sesi = 'aktif'
      ${tutor_id ? 'AND tutor_id = ?' : ''}
    `;
    const params = tutor_id ? [sesi_id, tutor_id] : [sesi_id];
    const [result] = await pool.execute(sql, params);
    return result.affectedRows;
  },

  // -----------------------------------------------------------
  // Ambil detail satu sesi absensi
  // Termasuk rekap kehadiran WB yang sudah tercatat
  // -----------------------------------------------------------
  findSesiById: async (sesi_id) => {
    const sqlSesi = `
      SELECT
        sa.*,
        r.nama_rombel,
        mp.nama AS nama_mapel,
        u.nama_lengkap AS nama_tutor,
        -- Hitung berapa detik tersisa untuk timer mandiri
        CASE
          WHEN sa.mode = 'mandiri' AND sa.status_sesi = 'aktif' AND sa.durasi_timer IS NOT NULL
          THEN GREATEST(0,
            sa.durasi_timer - TIMESTAMPDIFF(SECOND, sa.waktu_mulai, NOW())
          )
          ELSE NULL
        END AS sisa_timer_detik
      FROM sesi_absensi sa
      JOIN rombel r          ON r.id = sa.rombel_id
      JOIN users u           ON u.id = sa.tutor_id
      LEFT JOIN mata_pelajaran mp ON mp.id = sa.mapel_id
      WHERE sa.id = ?
      LIMIT 1
    `;
    const [sesi] = await pool.execute(sqlSesi, [sesi_id]);
    if (!sesi[0]) return null;

    // Ambil semua rekaman kehadiran dalam sesi ini
    const sqlRekaman = `
      SELECT
        rk.*,
        u.nama_lengkap,
        wb.nis
      FROM rekaman_kehadiran rk
      JOIN warga_belajar wb ON wb.id = rk.warga_belajar_id
      JOIN users u           ON u.id  = wb.user_id
      WHERE rk.sesi_id = ?
      ORDER BY u.nama_lengkap ASC
    `;
    const [rekaman] = await pool.execute(sqlRekaman, [sesi_id]);

    return { ...sesi[0], rekaman };
  },

  // -----------------------------------------------------------
  // Ambil semua sesi absensi untuk satu rombel
  // Opsional filter: tanggal, status_sesi
  // -----------------------------------------------------------
  findSesiByRombel: async (rombel_id, { tanggal = null, status_sesi = null } = {}) => {
    let sql = `
      SELECT sa.*, mp.nama AS nama_mapel, u.nama_lengkap AS nama_tutor,
        (SELECT COUNT(*) FROM rekaman_kehadiran rk
         WHERE rk.sesi_id = sa.id AND rk.status = 'hadir') AS jumlah_hadir
      FROM sesi_absensi sa
      JOIN users u ON u.id = sa.tutor_id
      LEFT JOIN mata_pelajaran mp ON mp.id = sa.mapel_id
      WHERE sa.rombel_id = ?
    `;
    const params = [rombel_id];

    if (tanggal) {
      sql += ` AND sa.tanggal = ?`;
      params.push(tanggal);
    }
    if (status_sesi) {
      sql += ` AND sa.status_sesi = ?`;
      params.push(status_sesi);
    }

    sql += ` ORDER BY sa.tanggal DESC, sa.created_at DESC`;
    const [rows] = await pool.execute(sql, params);
    return rows;
  },

  // -----------------------------------------------------------
  // Submit absensi MANUAL oleh Tutor
  // Menerima array kehadiran seluruh WB sekaligus
  // kehadiranList: [{ warga_belajar_id, status }]
  // -----------------------------------------------------------
  submitManual: async (sesi_id, kehadiranList) => {
    if (!kehadiranList || kehadiranList.length === 0) return 0;

    // Gunakan INSERT ... ON DUPLICATE KEY UPDATE
    // agar bisa dijalankan berulang kali tanpa error duplikat
    const values = kehadiranList.map(k => [
      sesi_id,
      k.warga_belajar_id,
      k.status,        // hadir / izin / sakit / alpa
      new Date(),      // waktu_check_in
      'manual_tutor',  // metode
    ]);

    const placeholders = values.map(() => '(?,?,?,?,?)').join(',');
    const flatParams = values.flat();

    const sql = `
      INSERT INTO rekaman_kehadiran
        (sesi_id, warga_belajar_id, status, waktu_check_in, metode)
      VALUES ${placeholders}
      ON DUPLICATE KEY UPDATE
        status          = VALUES(status),
        waktu_check_in  = VALUES(waktu_check_in),
        metode          = VALUES(metode),
        updated_at      = NOW()
    `;
    const [result] = await pool.execute(sql, flatParams);
    return result.affectedRows;
  },

  // -----------------------------------------------------------
  // Check-in MANDIRI oleh satu Warga Belajar
  // Dipanggil saat WB menekan tombol "Check-In" di halaman mereka
  // Sistem validasi: apakah sesi masih aktif & timer belum habis?
  // -----------------------------------------------------------
  checkInMandiri: async (sesi_id, warga_belajar_id) => {
    // Ambil info sesi terlebih dahulu untuk validasi
    const [sesiRows] = await pool.execute(
      `SELECT id, rombel_id, status_sesi, mode, waktu_mulai, durasi_timer
       FROM sesi_absensi WHERE id = ? LIMIT 1`,
      [sesi_id]
    );
    const sesi = sesiRows[0];

    const [wbRows] = await pool.execute(
      `SELECT id, rombel_id
       FROM warga_belajar
       WHERE id = ? LIMIT 1`,
      [warga_belajar_id]
    );
    const wargaBelajar = wbRows[0];

    // Validasi: sesi harus ada, aktif, dan mode mandiri
    if (!sesi) throw new Error('Sesi absensi tidak ditemukan.');
    if (!wargaBelajar) throw new Error('Profil Warga Belajar tidak ditemukan.');
    if (sesi.status_sesi !== 'aktif') throw new Error('Sesi absensi sudah ditutup.');
    if (sesi.mode !== 'mandiri') throw new Error('Sesi ini adalah sesi manual. Check-in mandiri tidak tersedia.');
    if (String(sesi.rombel_id) !== String(wargaBelajar.rombel_id)) {
      throw new Error('Sesi absensi ini bukan untuk rombel Anda.');
    }

    // Validasi timer: cek apakah waktu check-in masih dalam batas
    if (sesi.durasi_timer) {
      const selisihDetik = Math.floor((new Date() - new Date(sesi.waktu_mulai)) / 1000);
      if (selisihDetik > sesi.durasi_timer) {
        throw new Error(`Waktu check-in sudah habis. Timer ${sesi.durasi_timer} detik sudah terlewat.`);
      }
    }

    // Simpan rekaman check-in (INSERT IGNORE untuk cegah duplikat)
    const sql = `
      INSERT IGNORE INTO rekaman_kehadiran
        (sesi_id, warga_belajar_id, status, waktu_check_in, metode)
      VALUES (?, ?, 'hadir', NOW(), 'mandiri_wb')
    `;
    const [result] = await pool.execute(sql, [sesi_id, warga_belajar_id]);

    // affectedRows = 0 berarti WB sudah pernah check-in (IGNORE aktif)
    if (result.affectedRows === 0) {
      throw new Error('Anda sudah melakukan check-in untuk sesi ini.');
    }

    return true;
  },

  // -----------------------------------------------------------
  // Ambil rekap kehadiran satu WB untuk laporan
  // Filter opsional: rombel_id, tanggal_mulai, tanggal_selesai
  // -----------------------------------------------------------
  getRekapWb: async (warga_belajar_id, { rombel_id = null, tanggal_mulai = null, tanggal_selesai = null } = {}) => {
    let sql = `
      SELECT
        sa.tanggal,
        sa.mode,
        mp.nama         AS nama_mapel,
        r.nama_rombel,
        rk.status,
        rk.waktu_check_in,
        rk.metode
      FROM rekaman_kehadiran rk
      JOIN sesi_absensi sa ON sa.id = rk.sesi_id
      JOIN rombel r        ON r.id  = sa.rombel_id
      LEFT JOIN mata_pelajaran mp ON mp.id = sa.mapel_id
      WHERE rk.warga_belajar_id = ?
    `;
    const params = [warga_belajar_id];

    if (rombel_id) { sql += ` AND sa.rombel_id = ?`; params.push(rombel_id); }
    if (tanggal_mulai) { sql += ` AND sa.tanggal >= ?`; params.push(tanggal_mulai); }
    if (tanggal_selesai) { sql += ` AND sa.tanggal <= ?`; params.push(tanggal_selesai); }

    sql += ` ORDER BY sa.tanggal DESC`;
    const [rows] = await pool.execute(sql, params);
    return rows;
  },

  // -----------------------------------------------------------
  // Ambil sesi absensi yang sedang aktif milik satu Tutor
  // Digunakan untuk real-time monitoring di dashboard Tutor
  // -----------------------------------------------------------
  getSesiAktifTutor: async (tutor_id) => {
    // Tutup otomatis sesi mandiri yang timer-nya sudah habis
    await pool.execute(
      `UPDATE sesi_absensi
       SET status_sesi = 'selesai', waktu_selesai = COALESCE(waktu_selesai, NOW())
       WHERE tutor_id = ?
         AND status_sesi = 'aktif'
         AND mode = 'mandiri'
         AND durasi_timer IS NOT NULL
         AND TIMESTAMPDIFF(SECOND, waktu_mulai, NOW()) >= durasi_timer`,
      [tutor_id]
    );

    const sql = `
      SELECT sa.*, r.nama_rombel, mp.nama AS nama_mapel,
        CASE
          WHEN sa.mode = 'mandiri' AND sa.durasi_timer IS NOT NULL
          THEN GREATEST(0, sa.durasi_timer - TIMESTAMPDIFF(SECOND, sa.waktu_mulai, NOW()))
          ELSE NULL
        END AS sisa_timer_detik,
        (SELECT COUNT(*) FROM rekaman_kehadiran rk WHERE rk.sesi_id = sa.id AND rk.status = 'hadir') AS sudah_hadir
      FROM sesi_absensi sa
      JOIN rombel r ON r.id = sa.rombel_id
      LEFT JOIN mata_pelajaran mp ON mp.id = sa.mapel_id
      WHERE sa.tutor_id = ? AND sa.status_sesi = 'aktif'
      ORDER BY sa.created_at DESC
      LIMIT 1
    `;
    const [rows] = await pool.execute(sql, [tutor_id]);
    return rows[0] || null;
  },

  getSesiAktifWb: async ({ warga_belajar_id, rombel_id }) => {
    await pool.execute(
      `UPDATE sesi_absensi
       SET status_sesi = 'selesai', waktu_selesai = COALESCE(waktu_selesai, NOW())
       WHERE rombel_id = ?
         AND status_sesi = 'aktif'
         AND mode = 'mandiri'
         AND durasi_timer IS NOT NULL
         AND TIMESTAMPDIFF(SECOND, waktu_mulai, NOW()) >= durasi_timer`,
      [rombel_id]
    );

    const sql = `
      SELECT
        sa.*,
        r.nama_rombel,
        mp.nama AS nama_mapel,
        EXISTS(
          SELECT 1
          FROM rekaman_kehadiran rk
          WHERE rk.sesi_id = sa.id
            AND rk.warga_belajar_id = ?
        ) AS sudah_checkin
      FROM sesi_absensi sa
      JOIN rombel r ON r.id = sa.rombel_id
      LEFT JOIN mata_pelajaran mp ON mp.id = sa.mapel_id
      WHERE sa.rombel_id = ?
        AND sa.status_sesi = 'aktif'
        AND sa.mode = 'mandiri'
      ORDER BY sa.created_at DESC
      LIMIT 1
    `;
    const [rows] = await pool.execute(sql, [warga_belajar_id, rombel_id]);
    return rows[0] || null;
  },

  // -----------------------------------------------------------
  // Ambil semua WB di satu rombel beserta status check-in mereka
  // dalam satu sesi tertentu (untuk real-time list di halaman Tutor)
  // -----------------------------------------------------------
  getDaftarWbDiSesi: async (sesi_id) => {
    const sql = `
      SELECT
        wb.id AS warga_belajar_id,
        u.nama_lengkap,
        wb.nis,
        COALESCE(rk.status, 'belum') AS status_kehadiran,
        rk.waktu_check_in,
        rk.metode
      FROM warga_belajar wb
      JOIN users u ON u.id = wb.user_id
      -- Ambil rombel_id dari sesi, lalu cocokkan dengan WB di rombel itu
      JOIN sesi_absensi sa ON sa.id = ?
      LEFT JOIN rekaman_kehadiran rk
        ON rk.sesi_id = ? AND rk.warga_belajar_id = wb.id
      WHERE wb.rombel_id = sa.rombel_id
        AND wb.is_aktif = 1
      ORDER BY u.nama_lengkap ASC
    `;
    const [rows] = await pool.execute(sql, [sesi_id, sesi_id]);
    return rows;
  },
};

export default AbsensiModel;
