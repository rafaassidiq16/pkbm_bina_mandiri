// ============================================================
// models/MateriModel.js
// Model untuk Modul KBM/LMS: Materi Pembelajaran, Tugas,
// Pengumpulan Tugas, dan Jadwal KBM.
// ============================================================

import pool from '../config/db.js';

// ========================
// SUB-MODEL: Materi
// ========================
export const MateriModel = {

  findByRombel: async (rombel_id, mapel_id = null) => {
    let sql = `
      SELECT m.*, mp.nama AS nama_mapel, u.nama_lengkap AS nama_tutor
      FROM materi_pembelajaran m
      JOIN mata_pelajaran mp ON mp.id = m.mapel_id
      JOIN users u ON u.id = m.tutor_id
      WHERE m.rombel_id = ?
    `;
    const params = [rombel_id];
    if (mapel_id) { sql += ` AND m.mapel_id = ?`; params.push(mapel_id); }
    sql += ` ORDER BY m.urutan ASC, m.created_at ASC`;
    const [rows] = await pool.execute(sql, params);
    return rows;
  },

  findById: async (id) => {
    const [rows] = await pool.execute(
      `SELECT m.*, mp.nama AS nama_mapel, u.nama_lengkap AS nama_tutor
       FROM materi_pembelajaran m
       JOIN mata_pelajaran mp ON mp.id = m.mapel_id
       JOIN users u ON u.id = m.tutor_id
       WHERE m.id = ? LIMIT 1`,
      [id]
    );
    return rows[0];
  },

  create: async ({ rombel_id, mapel_id, tutor_id, judul, deskripsi, tipe, path_file, url, urutan }) => {
    const sql = `
      INSERT INTO materi_pembelajaran
        (rombel_id, mapel_id, tutor_id, judul, deskripsi, tipe, path_file, url, urutan, is_published)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, 0)
    `;
    const [result] = await pool.execute(sql, [
      rombel_id, mapel_id, tutor_id, judul,
      deskripsi || null, tipe, path_file || null, url || null, urutan || 0,
    ]);
    return result.insertId;
  },

  // Toggle publish/unpublish materi
  togglePublish: async (id, is_published) => {
    const [result] = await pool.execute(
      `UPDATE materi_pembelajaran SET is_published = ?, updated_at = NOW() WHERE id = ?`,
      [is_published ? 1 : 0, id]
    );
    return result.affectedRows;
  },

  // Catat bahwa WB sudah membuka materi ini (tracking progres)
  catatProgres: async (warga_belajar_id, materi_id, status = 'dibuka') => {
    const sql = `
      INSERT INTO progres_materi (warga_belajar_id, materi_id, status)
      VALUES (?, ?, ?)
      ON DUPLICATE KEY UPDATE
        status = IF(VALUES(status) = 'selesai', 'selesai', status),
        selesai_pada = IF(VALUES(status) = 'selesai', NOW(), selesai_pada)
    `;
    await pool.execute(sql, [warga_belajar_id, materi_id, status]);
  },
};

// ========================
// SUB-MODEL: Tugas
// ========================
export const TugasModel = {

  findByRombel: async (rombel_id, mapel_id = null) => {
    let sql = `
      SELECT t.*, mp.nama AS nama_mapel, u.nama_lengkap AS nama_tutor,
        (SELECT COUNT(*) FROM pengumpulan_tugas pt WHERE pt.tugas_id = t.id) AS jumlah_terkumpul
      FROM tugas t
      JOIN mata_pelajaran mp ON mp.id = t.mapel_id
      JOIN users u ON u.id = t.tutor_id
      WHERE t.rombel_id = ?
    `;
    const params = [rombel_id];
    if (mapel_id) { sql += ` AND t.mapel_id = ?`; params.push(mapel_id); }
    sql += ` ORDER BY t.deadline ASC`;
    const [rows] = await pool.execute(sql, params);
    return rows;
  },

  findById: async (id) => {
    const [tugas] = await pool.execute(
      `SELECT t.*, mp.nama AS nama_mapel, u.nama_lengkap AS nama_tutor
       FROM tugas t
       JOIN mata_pelajaran mp ON mp.id = t.mapel_id
       JOIN users u ON u.id = t.tutor_id
       WHERE t.id = ? LIMIT 1`,
      [id]
    );
    if (!tugas[0]) return null;

    // Ambil semua pengumpulan untuk tugas ini
    const [pengumpulan] = await pool.execute(
      `SELECT pt.*, u2.nama_lengkap, wb.nis
       FROM pengumpulan_tugas pt
       JOIN warga_belajar wb ON wb.id = pt.warga_belajar_id
       JOIN users u2 ON u2.id = wb.user_id
       WHERE pt.tugas_id = ?
       ORDER BY pt.submitted_at ASC`,
      [id]
    );
    return { ...tugas[0], pengumpulan };
  },

  create: async ({ rombel_id, mapel_id, tutor_id, judul, deskripsi, deadline, nilai_maks }) => {
    const sql = `
      INSERT INTO tugas (rombel_id, mapel_id, tutor_id, judul, deskripsi, deadline, nilai_maks)
      VALUES (?, ?, ?, ?, ?, ?, ?)
    `;
    const [result] = await pool.execute(sql, [
      rombel_id, mapel_id, tutor_id, judul, deskripsi, deadline, nilai_maks || 100,
    ]);
    return result.insertId;
  },

  // WB mengumpulkan jawaban tugas
  kumpulkanTugas: async ({ tugas_id, warga_belajar_id, path_file, nama_file, catatan_siswa }) => {
    const sql = `
      INSERT INTO pengumpulan_tugas
        (tugas_id, warga_belajar_id, path_file, nama_file, catatan_siswa, status)
      VALUES (?, ?, ?, ?, ?, 'terkumpul')
      ON DUPLICATE KEY UPDATE
        path_file = VALUES(path_file),
        nama_file = VALUES(nama_file),
        catatan_siswa = VALUES(catatan_siswa),
        submitted_at = NOW()
    `;
    const [result] = await pool.execute(sql, [
      tugas_id, warga_belajar_id, path_file, nama_file, catatan_siswa || null,
    ]);
    return result.insertId || result.affectedRows;
  },

  // Tutor menilai pengumpulan tugas
  nilaiTugas: async (pengumpulan_id, { nilai, feedback_tutor }) => {
    const sql = `
      UPDATE pengumpulan_tugas
      SET nilai = ?, feedback_tutor = ?, dinilai_at = NOW(), status = 'dinilai'
      WHERE id = ?
    `;
    const [result] = await pool.execute(sql, [nilai, feedback_tutor || null, pengumpulan_id]);
    return result.affectedRows;
  },
};

// ========================
// SUB-MODEL: Jadwal KBM
// ========================
export const JadwalModel = {

  findByRombel: async (rombel_id) => {
    const [rows] = await pool.execute(
      `SELECT j.*, mp.nama AS nama_mapel, u.nama_lengkap AS nama_tutor
       FROM jadwal_kbm j
       JOIN mata_pelajaran mp ON mp.id = j.mapel_id
       JOIN users u ON u.id = j.tutor_id
       WHERE j.rombel_id = ?
       ORDER BY j.waktu_mulai ASC`,
      [rombel_id]
    );
    return rows;
  },

  create: async ({ rombel_id, mapel_id, tutor_id, judul, waktu_mulai, waktu_selesai, jenis, link_meeting, lokasi, catatan }) => {
    const sql = `
      INSERT INTO jadwal_kbm
        (rombel_id, mapel_id, tutor_id, judul, waktu_mulai, waktu_selesai, jenis, link_meeting, lokasi, catatan)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    `;
    const [result] = await pool.execute(sql, [
      rombel_id, mapel_id, tutor_id, judul,
      waktu_mulai, waktu_selesai, jenis || 'online',
      link_meeting || null, lokasi || null, catatan || null,
    ]);
    return result.insertId;
  },
};
