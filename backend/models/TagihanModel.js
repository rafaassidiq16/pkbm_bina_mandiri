// ============================================================
// models/TagihanModel.js
// Model untuk modul Keuangan: Tagihan SPP/Modul dan Pembayaran.
// ============================================================

import pool from '../config/db.js';

const TagihanModel = {

  // -----------------------------------------------------------
  // Ambil semua tagihan, bisa difilter per WB, status, atau bulan
  // Digunakan di dashboard Admin Keuangan
  // -----------------------------------------------------------
  findAll: async ({ warga_belajar_id = null, status = null, tahun_ajaran_id = null } = {}) => {
    let sql = `
      SELECT
        ts.id,
        ts.warga_belajar_id,
        u.nama_lengkap          AS nama_wb,
        wb.nis,
        wb.jenjang,
        ts.jenis_tagihan,
        ts.keterangan,
        ts.jumlah,
        ts.tanggal_jatuh_tempo,
        ts.status,
        ta.nama_tahun_ajaran,
        ts.created_at,
        -- Hitung total yang sudah dibayar untuk tagihan ini
        COALESCE(
          (SELECT SUM(p.jumlah_bayar)
           FROM pembayaran p
           WHERE p.tagihan_id = ts.id
             AND p.status_konfirmasi = 'terkonfirmasi'),
          0
        ) AS total_terbayar
      FROM tagihan_siswa ts
      JOIN warga_belajar wb ON wb.id = ts.warga_belajar_id
      JOIN users u           ON u.id  = wb.user_id
      LEFT JOIN tahun_ajaran ta ON ta.id = ts.tahun_ajaran_id
      WHERE 1=1
    `;
    const params = [];

    if (warga_belajar_id) {
      sql += ` AND ts.warga_belajar_id = ?`;
      params.push(warga_belajar_id);
    }
    if (status) {
      sql += ` AND ts.status = ?`;
      params.push(status);
    }
    if (tahun_ajaran_id) {
      sql += ` AND ts.tahun_ajaran_id = ?`;
      params.push(tahun_ajaran_id);
    }

    sql += ` ORDER BY ts.tanggal_jatuh_tempo ASC`;
    const [rows] = await pool.execute(sql, params);
    return rows;
  },

  // -----------------------------------------------------------
  // Detail satu tagihan beserta riwayat pembayarannya
  // -----------------------------------------------------------
  findById: async (id) => {
    const sqlTagihan = `
      SELECT
        ts.*,
        u.nama_lengkap AS nama_wb,
        wb.nis,
        wb.jenjang,
        ta.nama_tahun_ajaran
      FROM tagihan_siswa ts
      JOIN warga_belajar wb ON wb.id = ts.warga_belajar_id
      JOIN users u           ON u.id  = wb.user_id
      LEFT JOIN tahun_ajaran ta ON ta.id = ts.tahun_ajaran_id
      WHERE ts.id = ?
      LIMIT 1
    `;
    const [tagihan] = await pool.execute(sqlTagihan, [id]);
    if (!tagihan[0]) return null;

    // Ambil semua riwayat pembayaran untuk tagihan ini
    const sqlBayar = `
      SELECT p.*, u2.nama_lengkap AS dicatat_oleh_nama
      FROM pembayaran p
      LEFT JOIN users u2 ON u2.id = p.dicatat_oleh
      WHERE p.tagihan_id = ?
      ORDER BY p.created_at DESC
    `;
    const [pembayaran] = await pool.execute(sqlBayar, [id]);

    return { ...tagihan[0], pembayaran };
  },

  // -----------------------------------------------------------
  // Buat tagihan baru (SPP atau modul)
  // Dipanggil oleh Admin Keuangan atau terjadwal otomatis
  // -----------------------------------------------------------
  create: async ({ warga_belajar_id, jenis_tagihan, keterangan, jumlah, tanggal_jatuh_tempo, tahun_ajaran_id, dibuat_oleh }) => {
    const sql = `
      INSERT INTO tagihan_siswa
        (warga_belajar_id, jenis_tagihan, keterangan, jumlah, tanggal_jatuh_tempo, tahun_ajaran_id, dibuat_oleh, status)
      VALUES (?, ?, ?, ?, ?, ?, ?, 'belum_bayar')
    `;
    const [result] = await pool.execute(sql, [
      warga_belajar_id, jenis_tagihan, keterangan, jumlah,
      tanggal_jatuh_tempo, tahun_ajaran_id, dibuat_oleh,
    ]);
    return result.insertId;
  },

  // -----------------------------------------------------------
  // Buat tagihan massal untuk semua WB aktif di satu rombel/jenjang
  // Misal: generate SPP bulan Juli untuk semua WB Paket C
  // -----------------------------------------------------------
  createMassal: async ({ jenjang, jenis_tagihan, keterangan, jumlah, tanggal_jatuh_tempo, tahun_ajaran_id, dibuat_oleh }) => {
    // Ambil semua WB aktif di jenjang ini
    const [wbList] = await pool.execute(
      `SELECT id FROM warga_belajar WHERE jenjang = ? AND is_aktif = 1`,
      [jenjang]
    );

    if (wbList.length === 0) return 0;

    // Bangun query INSERT batch untuk efisiensi (satu query untuk semua)
    const values = wbList.map(wb => [
      wb.id, jenis_tagihan, keterangan, jumlah,
      tanggal_jatuh_tempo, tahun_ajaran_id, dibuat_oleh, 'belum_bayar',
    ]);

    const placeholders = values.map(() => '(?,?,?,?,?,?,?,?)').join(',');
    const flatParams = values.flat();

    const sql = `
      INSERT INTO tagihan_siswa
        (warga_belajar_id, jenis_tagihan, keterangan, jumlah, tanggal_jatuh_tempo, tahun_ajaran_id, dibuat_oleh, status)
      VALUES ${placeholders}
    `;
    const [result] = await pool.execute(sql, flatParams);
    return result.affectedRows;
  },

  // -----------------------------------------------------------
  // Catat pembayaran untuk satu tagihan
  // Setelah mencatat, otomatis cek dan update status tagihan
  // -----------------------------------------------------------
  catatPembayaran: async ({ tagihan_id, jumlah_bayar, tanggal_bayar, metode, bukti_path, keterangan, dicatat_oleh }) => {
    // Simpan record pembayaran
    const sql = `
      INSERT INTO pembayaran
        (tagihan_id, jumlah_bayar, tanggal_bayar, metode, bukti_path, keterangan, dicatat_oleh, status_konfirmasi)
      VALUES (?, ?, ?, ?, ?, ?, ?, 'terkonfirmasi')
    `;
    const [result] = await pool.execute(sql, [
      tagihan_id, jumlah_bayar, tanggal_bayar,
      metode, bukti_path || null, keterangan || null, dicatat_oleh,
    ]);

    // Setelah mencatat pembayaran, perbarui status tagihan
    // dengan membandingkan total yang sudah dibayar vs jumlah tagihan
    await TagihanModel._syncStatusTagihan(tagihan_id);

    return result.insertId;
  },

  // -----------------------------------------------------------
  // (INTERNAL) Sinkronisasi status tagihan berdasarkan total bayar
  // Dipanggil otomatis setelah setiap pembayaran dicatat
  // -----------------------------------------------------------
  _syncStatusTagihan: async (tagihan_id) => {
    const sql = `
      UPDATE tagihan_siswa ts
      SET ts.status = CASE
        WHEN (
          SELECT COALESCE(SUM(p.jumlah_bayar), 0)
          FROM pembayaran p
          WHERE p.tagihan_id = ts.id AND p.status_konfirmasi = 'terkonfirmasi'
        ) >= ts.jumlah THEN 'lunas'
        WHEN (
          SELECT COALESCE(SUM(p.jumlah_bayar), 0)
          FROM pembayaran p
          WHERE p.tagihan_id = ts.id AND p.status_konfirmasi = 'terkonfirmasi'
        ) > 0 THEN 'cicilan'
        ELSE 'belum_bayar'
      END
      WHERE ts.id = ?
    `;
    await pool.execute(sql, [tagihan_id]);
  },

  // -----------------------------------------------------------
  // Ambil daftar WB dengan tunggakan (dari view yang sudah ada)
  // Digunakan di laporan tunggakan Admin & Dashboard Pimpinan
  // -----------------------------------------------------------
  getTunggakan: async () => {
    const [rows] = await pool.execute(`SELECT * FROM v_tunggakan_per_wb`);
    return rows;
  },

  // -----------------------------------------------------------
  // Rekap keuangan bulanan (dari view yang sudah ada)
  // Digunakan di grafik keuangan Dashboard Pimpinan
  // -----------------------------------------------------------
  getRingkasanBulanan: async () => {
    const [rows] = await pool.execute(`SELECT * FROM v_ringkasan_keuangan_bulanan LIMIT 12`);
    return rows;
  },
};

export default TagihanModel;
