import pool from '../config/db.js';

const AkademikModel = {
  findAllMapel: async ({ keyword = null, jenjang = null, is_active = null } = {}) => {
    let sql = `
      SELECT
        mp.id,
        mp.kode,
        mp.nama,
        mp.jenjang,
        mp.deskripsi,
        mp.is_active,
        mp.created_at,
        COUNT(rm.id) AS jumlah_rombel
      FROM mata_pelajaran mp
      LEFT JOIN rombel_mapel rm ON rm.mapel_id = mp.id
      WHERE 1=1
    `;
    const params = [];

    if (keyword) {
      sql += ` AND (mp.nama LIKE ? OR mp.kode LIKE ?)`;
      params.push(`%${keyword}%`, `%${keyword}%`);
    }

    if (jenjang) {
      sql += ` AND mp.jenjang = ?`;
      params.push(jenjang);
    }

    if (is_active !== null) {
      sql += ` AND mp.is_active = ?`;
      params.push(is_active);
    }

    sql += `
      GROUP BY mp.id, mp.kode, mp.nama, mp.jenjang, mp.deskripsi, mp.is_active, mp.created_at
      ORDER BY mp.nama ASC
    `;

    const [rows] = await pool.execute(sql, params);
    return rows;
  },

  findMapelById: async (id) => {
    const [rows] = await pool.execute(
      `
        SELECT id, kode, nama, jenjang, deskripsi, is_active, created_at
        FROM mata_pelajaran
        WHERE id = ?
        LIMIT 1
      `,
      [id]
    );
    return rows[0] || null;
  },

  createMapel: async ({ kode, nama, jenjang, deskripsi, is_active }) => {
    const [result] = await pool.execute(
      `
        INSERT INTO mata_pelajaran (kode, nama, jenjang, deskripsi, is_active, created_at)
        VALUES (?, ?, ?, ?, ?, NOW())
      `,
      [kode, nama, jenjang, deskripsi || null, is_active ? 1 : 0]
    );
    return result.insertId;
  },

  updateMapel: async (id, { kode, nama, jenjang, deskripsi, is_active }) => {
    const [result] = await pool.execute(
      `
        UPDATE mata_pelajaran
        SET kode = ?, nama = ?, jenjang = ?, deskripsi = ?, is_active = ?
        WHERE id = ?
      `,
      [kode, nama, jenjang, deskripsi || null, is_active ? 1 : 0, id]
    );
    return result.affectedRows;
  },

  updateMapelStatus: async (id, is_active) => {
    const [result] = await pool.execute(
      `
        UPDATE mata_pelajaran
        SET is_active = ?
        WHERE id = ?
      `,
      [is_active ? 1 : 0, id]
    );
    return result.affectedRows;
  },

  findMapelByKode: async (kode) => {
    const [rows] = await pool.execute(
      `
        SELECT id, kode
        FROM mata_pelajaran
        WHERE kode = ?
        LIMIT 1
      `,
      [kode]
    );
    return rows[0] || null;
  },

  findRombelMapel: async ({ rombel_id = null, is_visible = null } = {}) => {
    let sql = `
      SELECT
        rm.id,
        rm.rombel_id,
        rm.mapel_id,
        rm.tutor_id,
        rm.is_visible,
        rm.urutan,
        rm.rps_file_path,
        rm.created_at,
        r.nama_rombel,
        r.jenjang AS jenjang_rombel,
        mp.kode AS kode_mapel,
        mp.nama AS nama_mapel,
        mp.jenjang AS jenjang_mapel,
        mp.is_active AS mapel_is_active,
        u.nama_lengkap AS nama_tutor
      FROM rombel_mapel rm
      JOIN rombel r ON r.id = rm.rombel_id
      JOIN mata_pelajaran mp ON mp.id = rm.mapel_id
      LEFT JOIN users u ON u.id = rm.tutor_id
      WHERE 1=1
    `;
    const params = [];

    if (rombel_id) {
      sql += ` AND rm.rombel_id = ?`;
      params.push(rombel_id);
    }

    if (is_visible !== null) {
      sql += ` AND rm.is_visible = ?`;
      params.push(is_visible);
    }

    sql += ` ORDER BY r.nama_rombel ASC, rm.urutan ASC, mp.nama ASC`;
    const [rows] = await pool.execute(sql, params);
    return rows;
  },

  findRombelMapelById: async (id) => {
    const [rows] = await pool.execute(
      `
        SELECT id, rombel_id, mapel_id, tutor_id, is_visible, urutan, created_at
        FROM rombel_mapel
        WHERE id = ?
        LIMIT 1
      `,
      [id]
    );
    return rows[0] || null;
  },

  findExistingRombelMapel: async ({ rombel_id, mapel_id, exclude_id = null }) => {
    let sql = `
      SELECT id
      FROM rombel_mapel
      WHERE rombel_id = ? AND mapel_id = ?
    `;
    const params = [rombel_id, mapel_id];

    if (exclude_id) {
      sql += ` AND id <> ?`;
      params.push(exclude_id);
    }

    sql += ` LIMIT 1`;
    const [rows] = await pool.execute(sql, params);
    return rows[0] || null;
  },

  createRombelMapel: async ({ rombel_id, mapel_id, tutor_id, is_visible, urutan }) => {
    const [result] = await pool.execute(
      `
        INSERT INTO rombel_mapel (rombel_id, mapel_id, tutor_id, is_visible, urutan, created_at)
        VALUES (?, ?, ?, ?, ?, NOW())
      `,
      [rombel_id, mapel_id, tutor_id || null, is_visible ? 1 : 0, urutan || 0]
    );
    return result.insertId;
  },

  updateRombelMapel: async (id, { rombel_id, mapel_id, tutor_id, is_visible, urutan }) => {
    const [result] = await pool.execute(
      `
        UPDATE rombel_mapel
        SET rombel_id = ?, mapel_id = ?, tutor_id = ?, is_visible = ?, urutan = ?
        WHERE id = ?
      `,
      [rombel_id, mapel_id, tutor_id || null, is_visible ? 1 : 0, urutan || 0, id]
    );
    return result.affectedRows;
  },

  updateRombelMapelVisibility: async (id, is_visible) => {
    const [result] = await pool.execute(
      `
        UPDATE rombel_mapel
        SET is_visible = ?
        WHERE id = ?
      `,
      [is_visible ? 1 : 0, id]
    );
    return result.affectedRows;
  },

  deleteRombelMapel: async (id) => {
    const [result] = await pool.execute(`DELETE FROM rombel_mapel WHERE id = ?`, [id]);
    return result.affectedRows;
  },

  // -----------------------------------------------------------
  // RPS (Rencana Pembelajaran Semester)
  // -----------------------------------------------------------
  findRombelMapelByRombelAndMapel: async (rombel_id, mapel_id) => {
    const [rows] = await pool.execute(
      `
        SELECT rm.id, rm.rombel_id, rm.mapel_id, rm.tutor_id, rm.rps_file_path,
               mp.nama AS nama_mapel, u.nama_lengkap AS nama_tutor
        FROM rombel_mapel rm
        JOIN mata_pelajaran mp ON mp.id = rm.mapel_id
        LEFT JOIN users u ON u.id = rm.tutor_id
        WHERE rm.rombel_id = ? AND rm.mapel_id = ?
        LIMIT 1
      `,
      [rombel_id, mapel_id]
    );
    return rows[0] || null;
  },

  updateRpsFile: async (id, rps_file_path) => {
    const [result] = await pool.execute(
      `UPDATE rombel_mapel SET rps_file_path = ? WHERE id = ?`,
      [rps_file_path, id]
    );
    return result.affectedRows;
  },

  findTutorOptions: async () => {
    const [rows] = await pool.execute(
      `
        SELECT id, nama_lengkap, role
        FROM users
        WHERE role IN ('tutor', 'super_admin') AND is_active = 1
        ORDER BY nama_lengkap ASC
      `
    );
    return rows;
  },
};

export default AkademikModel;
