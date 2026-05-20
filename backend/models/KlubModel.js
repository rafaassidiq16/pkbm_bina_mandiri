// ============================================================
// models/KlubModel.js
// Model untuk Klub Minat Bakat lintas jenjang.
// ============================================================

import pool from '../config/db.js';

const KlubModel = {

  // Untuk halaman siswa: hanya tampilkan klub aktif
  findAll: async () => {
    const [rows] = await pool.execute(
      `SELECT
         k.id,
         k.nama AS nama_klub,
         k.deskripsi,
         k.kategori AS jenis,
         k.kapasitas,
         k.is_aktif,
         k.pembimbing_id,
         u.nama_lengkap AS tutor_nama,
        (SELECT COUNT(*) FROM anggota_klub ak WHERE ak.klub_id = k.id AND ak.status = 'aktif') AS jumlah_anggota
       FROM klub_minat_bakat k
       LEFT JOIN users u ON u.id = k.pembimbing_id
       WHERE k.is_aktif = 1
       ORDER BY k.nama ASC`
    );
    return rows;
  },

  // Untuk halaman admin: tampilkan semua klub (termasuk nonaktif)
  findAllAdmin: async () => {
    const [rows] = await pool.execute(
      `SELECT
         k.id,
         k.nama AS nama_klub,
         k.deskripsi,
         k.kategori AS jenis,
         k.kapasitas,
         k.is_aktif,
         k.pembimbing_id,
         u.nama_lengkap AS tutor_nama,
        (SELECT COUNT(*) FROM anggota_klub ak WHERE ak.klub_id = k.id AND ak.status = 'aktif') AS jumlah_anggota
       FROM klub_minat_bakat k
       LEFT JOIN users u ON u.id = k.pembimbing_id
       ORDER BY k.nama ASC`
    );
    return rows;
  },

  findById: async (id) => {
    const [klub] = await pool.execute(
      `SELECT
         k.id,
         k.nama AS nama_klub,
         k.deskripsi,
         k.kategori AS jenis,
         k.kapasitas,
         k.is_aktif,
         u.nama_lengkap AS tutor_nama
       FROM klub_minat_bakat k
       LEFT JOIN users u ON u.id = k.pembimbing_id
       WHERE k.id = ? LIMIT 1`,
      [id]
    );
    if (!klub[0]) return null;

    const [anggota] = await pool.execute(
      `SELECT ak.id, ak.status, ak.tanggal_daftar, u2.nama_lengkap, wb.nis, wb.jenjang
       FROM anggota_klub ak
       JOIN warga_belajar wb ON wb.id = ak.warga_belajar_id
       JOIN users u2 ON u2.id = wb.user_id
       WHERE ak.klub_id = ?
       ORDER BY u2.nama_lengkap ASC`,
      [id]
    );
    return { ...klub[0], anggota };
  },

  create: async ({ nama_klub, deskripsi, kategori, pembimbing_id, kapasitas }) => {
    const [result] = await pool.execute(
      `INSERT INTO klub_minat_bakat (nama, deskripsi, kategori, pembimbing_id, kapasitas)
       VALUES (?, ?, ?, ?, ?)`,
      [nama_klub, deskripsi || null, kategori || null, pembimbing_id || null, kapasitas || 20]
    );
    return result.insertId;
  },

  // Update data klub (Admin/Super Admin)
  update: async (id, { nama_klub, deskripsi, kategori, pembimbing_id, kapasitas }) => {
    await pool.execute(
      `UPDATE klub_minat_bakat
       SET nama = ?, deskripsi = ?, kategori = ?, pembimbing_id = ?, kapasitas = ?
       WHERE id = ?`,
      [nama_klub, deskripsi || null, kategori || null, pembimbing_id || null, kapasitas || 20, id]
    );
  },

  // Toggle status aktif/nonaktif klub
  toggleAktif: async (id, is_aktif) => {
    await pool.execute(
      `UPDATE klub_minat_bakat SET is_aktif = ? WHERE id = ?`,
      [is_aktif ? 1 : 0, id]
    );
  },

  // Hapus klub (hard delete — hanya jika tidak ada anggota aktif)
  delete: async (id) => {
    await pool.execute(
      `DELETE FROM klub_minat_bakat WHERE id = ?`,
      [id]
    );
  },

  getTahunAjaranAktifId: async () => {
    const [rows] = await pool.execute(
      `SELECT id FROM tahun_ajaran WHERE is_aktif = 1 LIMIT 1`
    );
    return rows[0]?.id || null;
  },

  // WB mendaftar ke klub
  daftar: async ({ klub_id, warga_belajar_id }) => {
    const tahun_ajaran_id = await KlubModel.getTahunAjaranAktifId();
    if (!tahun_ajaran_id) {
      throw new Error('Tahun ajaran aktif tidak ditemukan.');
    }

    const sql = `
      INSERT INTO anggota_klub (klub_id, warga_belajar_id, tahun_ajaran_id, status, tanggal_daftar)
      VALUES (?, ?, ?, 'aktif', CURDATE())
      ON DUPLICATE KEY UPDATE status = 'aktif', tanggal_daftar = CURDATE()
    `;
    await pool.execute(sql, [klub_id, warga_belajar_id, tahun_ajaran_id]);
  },

  // WB keluar dari klub
  keluar: async ({ klub_id, warga_belajar_id }) => {
    await pool.execute(
      `UPDATE anggota_klub SET status = 'tidak_aktif' WHERE klub_id = ? AND warga_belajar_id = ?`,
      [klub_id, warga_belajar_id]
    );
  },

  // Cek apakah WB sudah terdaftar
  isAnggota: async ({ klub_id, warga_belajar_id }) => {
    const [rows] = await pool.execute(
      `SELECT id FROM anggota_klub WHERE klub_id = ? AND warga_belajar_id = ? AND status = 'aktif' LIMIT 1`,
      [klub_id, warga_belajar_id]
    );
    return !!rows[0];
  },

  // Ambil klub yang diikuti WB
  getByWB: async (warga_belajar_id) => {
    const [rows] = await pool.execute(
      `SELECT
         k.id,
         k.nama AS nama_klub,
         k.deskripsi,
         k.kategori AS jenis,
         ak.tanggal_daftar
       FROM anggota_klub ak
       JOIN klub_minat_bakat k ON k.id = ak.klub_id
       WHERE ak.warga_belajar_id = ? AND ak.status = 'aktif'
       ORDER BY k.nama ASC`,
      [warga_belajar_id]
    );
    return rows;
  },
};

export default KlubModel;
