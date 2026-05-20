// ============================================================
// models/UserModel.js
// Model untuk tabel 'users' — menangani data akun semua role.
// Semua query menggunakan Raw SQL langsung (tanpa ORM).
// ============================================================

import pool from '../config/db.js';

const UserModel = {

  // -----------------------------------------------------------
  // Cari user berdasarkan email (digunakan saat proses login)
  // Mengembalikan satu baris data user atau undefined jika tidak ada
  // -----------------------------------------------------------
  findByEmail: async (email) => {
    const sql = `
      SELECT
        u.id,
        u.nama_lengkap,
        u.email,
        u.password_hash,
        u.role,
        u.is_active,
        u.foto_profil,
        u.created_at
      FROM users u
      WHERE u.email = ?
        AND u.is_active = 1
      LIMIT 1
    `;
    // pool.execute() mengembalikan array: [rows, fields]
    // Kita hanya butuh rows[0] (baris pertama)
    const [rows] = await pool.execute(sql, [email]);
    return rows[0];
  },

  findByEmailAnyStatus: async (email) => {
    const [rows] = await pool.execute(
      `
        SELECT id, email, role, is_active
        FROM users
        WHERE email = ?
        LIMIT 1
      `,
      [email]
    );
    return rows[0];
  },

  // -----------------------------------------------------------
  // Cari user berdasarkan ID (digunakan untuk verifikasi JWT)
  // -----------------------------------------------------------
  findById: async (id) => {
    const sql = `
      SELECT
        id,
        nama_lengkap,
        email,
        role,
        is_active,
        foto_profil,
        created_at
      FROM users
      WHERE id = ?
        AND is_active = 1
      LIMIT 1
    `;
    const [rows] = await pool.execute(sql, [id]);
    return rows[0];
  },

  findByIdWithPassword: async (id) => {
    const [rows] = await pool.execute(
      `
        SELECT id, nama_lengkap, email, role, is_active, foto_profil, password_hash
        FROM users
        WHERE id = ?
        LIMIT 1
      `,
      [id]
    );
    return rows[0];
  },

  // -----------------------------------------------------------
  // Buat user baru (dipanggil otomatis saat SPMB disetujui
  // atau saat Super Admin menambah Tutor/Admin baru)
  // -----------------------------------------------------------
  create: async ({ nama_lengkap, email, password_hash, role }) => {
    const sql = `
      INSERT INTO users (nama_lengkap, email, password_hash, role, is_active, created_at)
      VALUES (?, ?, ?, ?, 1, NOW())
    `;
    const [result] = await pool.execute(sql, [nama_lengkap, email, password_hash, role]);
    // result.insertId adalah ID baris yang baru saja dibuat
    return result.insertId;
  },

  // -----------------------------------------------------------
  // Ambil semua user (hanya untuk Super Admin)
  // -----------------------------------------------------------
  findAll: async () => {
    const sql = `
      SELECT id, nama_lengkap, email, role, is_active, created_at
      FROM users
      ORDER BY created_at DESC
    `;
    const [rows] = await pool.execute(sql);
    return rows;
  },

  // -----------------------------------------------------------
  // Update status aktif/nonaktif akun (suspend/unsuspend)
  // -----------------------------------------------------------
  updateStatus: async (id, is_active) => {
    const sql = `UPDATE users SET is_active = ? WHERE id = ?`;
    const [result] = await pool.execute(sql, [is_active, id]);
    return result.affectedRows;
  },

  // -----------------------------------------------------------
  // Update password (dipanggil saat reset password)
  // -----------------------------------------------------------
  updatePassword: async (id, password_hash) => {
    const sql = `UPDATE users SET password_hash = ?, updated_at = NOW() WHERE id = ?`;
    const [result] = await pool.execute(sql, [password_hash, id]);
    return result.affectedRows;
  },
};

export default UserModel;
