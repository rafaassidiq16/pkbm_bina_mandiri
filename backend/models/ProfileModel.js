import pool from '../config/db.js';

const ProfileModel = {
  findByUserIdAndRole: async (userId, role) => {
    if (role === 'warga_belajar') {
      const [rows] = await pool.execute(
        `
          SELECT
            u.id,
            u.nama_lengkap,
            u.email,
            u.role,
            u.is_active,
            u.foto_profil,
            wb.id AS profil_id,
            wb.nis,
            wb.nik,
            wb.jenjang,
            wb.tanggal_lahir,
            wb.jenis_kelamin,
            wb.alamat,
            wb.nama_wali,
            wb.no_telp,
            wb.rombel_id,
            wb.tahun_ajaran_id,
            wb.is_aktif,
            r.nama_rombel,
            ta.nama_tahun_ajaran
          FROM users u
          LEFT JOIN warga_belajar wb ON wb.user_id = u.id
          LEFT JOIN rombel r ON r.id = wb.rombel_id
          LEFT JOIN tahun_ajaran ta ON ta.id = wb.tahun_ajaran_id
          WHERE u.id = ?
          LIMIT 1
        `,
        [userId]
      );
      return rows[0];
    }

    if (role === 'tutor') {
      const [rows] = await pool.execute(
        `
          SELECT
            u.id,
            u.nama_lengkap,
            u.email,
            u.role,
            u.is_active,
            u.foto_profil,
            t.id AS profil_id,
            t.nip,
            t.spesialisasi,
            t.no_telp
          FROM users u
          LEFT JOIN tutor t ON t.user_id = u.id
          WHERE u.id = ?
          LIMIT 1
        `,
        [userId]
      );
      return rows[0];
    }

    const [rows] = await pool.execute(
      `
        SELECT
          id,
          nama_lengkap,
          email,
          role,
          is_active,
          foto_profil,
          created_at,
          updated_at
        FROM users
        WHERE id = ?
        LIMIT 1
      `,
      [userId]
    );
    return rows[0];
  },

  updateUserBasic: async (userId, { nama_lengkap, email }) => {
    const [result] = await pool.execute(
      `
        UPDATE users
        SET nama_lengkap = ?, email = ?, updated_at = NOW()
        WHERE id = ?
      `,
      [nama_lengkap, email, userId]
    );
    return result.affectedRows;
  },

  updateWargaBelajarProfile: async (
    userId,
    { nik, tanggal_lahir, jenis_kelamin, alamat, nama_wali, no_telp }
  ) => {
    const [result] = await pool.execute(
      `
        UPDATE warga_belajar
        SET
          nik = ?,
          tanggal_lahir = ?,
          jenis_kelamin = ?,
          alamat = ?,
          nama_wali = ?,
          no_telp = ?,
          updated_at = NOW()
        WHERE user_id = ?
      `,
      [nik || null, tanggal_lahir, jenis_kelamin, alamat || null, nama_wali || null, no_telp || null, userId]
    );
    return result.affectedRows;
  },

  upsertTutorProfile: async (userId, { nip, spesialisasi, no_telp }) => {
    const [result] = await pool.execute(
      `
        INSERT INTO tutor (user_id, nip, spesialisasi, no_telp, created_at)
        VALUES (?, ?, ?, ?, NOW())
        ON DUPLICATE KEY UPDATE
          nip = VALUES(nip),
          spesialisasi = VALUES(spesialisasi),
          no_telp = VALUES(no_telp)
      `,
      [userId, nip || null, spesialisasi || null, no_telp || null]
    );
    return result.affectedRows;
  },

  updateFotoProfil: async (userId, foto_profil) => {
    const [result] = await pool.execute(
      `
        UPDATE users
        SET foto_profil = ?, updated_at = NOW()
        WHERE id = ?
      `,
      [foto_profil, userId]
    );
    return result.affectedRows;
  },
};

export default ProfileModel;
