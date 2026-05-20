import pool from '../config/db.js';

const normalizeTipeSoal = (tipe) => {
  if (!tipe) return 'pilihan_ganda';
  if (tipe === 'pilgan') return 'pilihan_ganda';
  return tipe;
};

const parsePilihan = (nilai) => {
  if (!nilai) return [];
  if (Array.isArray(nilai)) return nilai;
  try {
    return JSON.parse(nilai);
  } catch {
    return [];
  }
};

const buildDeskripsiPayload = ({ deskripsi, sumber_ujian, link_google_form }) => {
  const payload = {
    deskripsi: deskripsi || '',
    sumber_ujian: sumber_ujian || 'internal',
    link_google_form: link_google_form || '',
  };
  return JSON.stringify(payload);
};

const parseDeskripsiPayload = (nilai) => {
  if (!nilai) {
    return { deskripsi: '', sumber_ujian: 'internal', link_google_form: '' };
  }

  try {
    const parsed = JSON.parse(nilai);
    if (parsed && typeof parsed === 'object' && 'sumber_ujian' in parsed) {
      return {
        deskripsi: parsed.deskripsi || '',
        sumber_ujian: parsed.sumber_ujian || 'internal',
        link_google_form: parsed.link_google_form || '',
      };
    }
  } catch {
    // fallback ke deskripsi teks lama
  }

  return { deskripsi: nilai, sumber_ujian: 'internal', link_google_form: '' };
};

export const BankSoalModel = {
  findAll: async ({ mapel_id = null, jenjang = null, jenis = null } = {}) => {
    let sql = `
      SELECT
        bs.*,
        bs.tipe AS jenis,
        bs.pilihan,
        bs.kunci_jawaban,
        bs.skor_benar,
        bs.tag_dimensi,
        mp.nama AS nama_mapel,
        u.nama_lengkap AS nama_pembuat
      FROM bank_soal bs
      LEFT JOIN mata_pelajaran mp ON mp.id = bs.mapel_id
      JOIN users u ON u.id = bs.tutor_id
      WHERE bs.is_aktif = 1
    `;
    const params = [];

    if (mapel_id) {
      sql += ' AND bs.mapel_id = ?';
      params.push(mapel_id);
    }
    if (jenjang) {
      sql += ' AND bs.jenjang = ?';
      params.push(jenjang);
    }
    if (jenis) {
      sql += ' AND bs.tipe = ?';
      params.push(normalizeTipeSoal(jenis));
    }

    sql += ' ORDER BY bs.created_at DESC';
    const [rows] = await pool.execute(sql, params);
    return rows.map((row) => ({
      ...row,
      pilihan: parsePilihan(row.pilihan),
    }));
  },

  findById: async (id) => {
    const [rows] = await pool.execute(
      `SELECT
         bs.*,
         bs.tipe AS jenis,
         bs.pilihan,
         bs.kunci_jawaban,
         bs.skor_benar,
         bs.tag_dimensi,
         mp.nama AS nama_mapel
       FROM bank_soal bs
       LEFT JOIN mata_pelajaran mp ON mp.id = bs.mapel_id
       WHERE bs.id = ?
       LIMIT 1`,
      [id]
    );

    if (!rows[0]) return null;
    return {
      ...rows[0],
      pilihan: parsePilihan(rows[0].pilihan),
    };
  },

  create: async ({
    mapel_id,
    jenjang,
    jenis,
    kategori,
    pertanyaan,
    pilihan,
    kunci_jawaban,
    skor_benar,
    tag_dimensi,
    tutor_id,
  }) => {
    const sql = `
      INSERT INTO bank_soal
        (mapel_id, tutor_id, jenjang, tipe, kategori, pertanyaan, pilihan, kunci_jawaban, skor_benar, tag_dimensi)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    `;
    const [result] = await pool.execute(sql, [
      mapel_id || null,
      tutor_id,
      jenjang,
      normalizeTipeSoal(jenis),
      kategori || 'akademik',
      pertanyaan,
      pilihan ? JSON.stringify(pilihan) : null,
      kunci_jawaban || null,
      skor_benar || 1,
      tag_dimensi || null,
    ]);
    return result.insertId;
  },

  update: async (id, payload) => {
    const fields = [];
    const params = [];

    if (payload.pertanyaan !== undefined) {
      fields.push('pertanyaan = ?');
      params.push(payload.pertanyaan);
    }
    if (payload.pilihan !== undefined) {
      fields.push('pilihan = ?');
      params.push(payload.pilihan ? JSON.stringify(payload.pilihan) : null);
    }
    if (payload.kunci_jawaban !== undefined) {
      fields.push('kunci_jawaban = ?');
      params.push(payload.kunci_jawaban || null);
    }
    if (payload.skor_benar !== undefined) {
      fields.push('skor_benar = ?');
      params.push(payload.skor_benar || 1);
    }
    if (payload.tag_dimensi !== undefined) {
      fields.push('tag_dimensi = ?');
      params.push(payload.tag_dimensi || null);
    }
    if (payload.kategori !== undefined) {
      fields.push('kategori = ?');
      params.push(payload.kategori || 'akademik');
    }
    if (payload.jenis !== undefined) {
      fields.push('tipe = ?');
      params.push(normalizeTipeSoal(payload.jenis));
    }

    if (fields.length === 0) return 0;

    params.push(id);
    const [result] = await pool.execute(
      `UPDATE bank_soal SET ${fields.join(', ')} WHERE id = ?`,
      params
    );
    return result.affectedRows;
  },

  delete: async (id) => {
    const [result] = await pool.execute(
      'UPDATE bank_soal SET is_aktif = 0 WHERE id = ?',
      [id]
    );
    return result.affectedRows;
  },
};

export const PaketUjianModel = {
  findByRombel: async (rombel_id, { warga_belajar_id = null, onlyActive = false } = {}) => {
    const params = [rombel_id];
    let sesiJoin = '';

    if (warga_belajar_id) {
      sesiJoin = `
        LEFT JOIN (
          SELECT su.*
          FROM sesi_ujian su
          WHERE su.warga_belajar_id = ?
        ) su ON su.paket_ujian_id = pu.id
      `;
      params.push(warga_belajar_id);
    }

    let sql = `
      SELECT
        pu.*,
        mp.nama AS nama_mapel,
        r.nama_rombel,
        u.nama_lengkap AS nama_tutor,
        (
          SELECT COUNT(*)
          FROM paket_ujian_soal pus
          WHERE pus.paket_ujian_id = pu.id
        ) AS jumlah_soal
        ${warga_belajar_id ? `,
        su.id AS sesi_id,
        su.status AS status_sesi_saya,
        su.nilai_total AS nilai_saya,
        su.is_lulus AS is_lulus_saya,
        su.waktu_mulai AS mulai_saya,
        su.waktu_selesai AS selesai_saya
        ` : ''}
      FROM paket_ujian pu
      LEFT JOIN mata_pelajaran mp ON mp.id = pu.mapel_id
      LEFT JOIN rombel r ON r.id = pu.rombel_id
      JOIN users u ON u.id = pu.tutor_id
      ${sesiJoin}
      WHERE pu.rombel_id = ?
    `;

    if (onlyActive) {
      sql += ' AND pu.is_aktif = 1';
    }

    sql += ' ORDER BY pu.created_at DESC';

    const [rows] = await pool.execute(sql, params);
    return rows.map((row) => ({
      ...row,
      sesi_saya: warga_belajar_id ? (
        row.sesi_id
          ? {
              id: row.sesi_id,
              status: row.status_sesi_saya,
              nilai_total: row.nilai_saya,
              is_lulus: row.is_lulus_saya,
              waktu_mulai: row.mulai_saya,
              waktu_selesai: row.selesai_saya,
            }
          : null
      ) : undefined,
      ...parseDeskripsiPayload(row.deskripsi),
    }));
  },

  findById: async (id) => {
    const [paketRows] = await pool.execute(
      `SELECT
         pu.*,
         mp.nama AS nama_mapel,
         r.nama_rombel,
         u.nama_lengkap AS nama_tutor
       FROM paket_ujian pu
       LEFT JOIN mata_pelajaran mp ON mp.id = pu.mapel_id
       LEFT JOIN rombel r ON r.id = pu.rombel_id
       JOIN users u ON u.id = pu.tutor_id
       WHERE pu.id = ?
       LIMIT 1`,
      [id]
    );
    if (!paketRows[0]) return null;

    const [soalRows] = await pool.execute(
      `SELECT
         bs.id,
         bs.tipe,
         bs.tipe AS jenis,
         bs.pertanyaan,
         bs.pilihan,
         bs.kunci_jawaban,
         bs.skor_benar,
         pus.nomor_urut
       FROM paket_ujian_soal pus
       JOIN bank_soal bs ON bs.id = pus.soal_id
       WHERE pus.paket_ujian_id = ?
       ORDER BY pus.nomor_urut ASC, pus.id ASC`,
      [id]
    );

    const soal = soalRows.map((item) => ({
      ...item,
      pilihan: parsePilihan(item.pilihan),
    }));

    return {
      ...paketRows[0],
      ...parseDeskripsiPayload(paketRows[0].deskripsi),
      soal,
    };
  },

  create: async ({
    rombel_id,
    mapel_id,
    tutor_id,
    judul,
    deskripsi,
    sumber_ujian,
    link_google_form,
    jenis,
    durasi_menit,
    acak_soal,
    nilai_lulus,
    soal_ids,
  }) => {
    const conn = await pool.getConnection();
    try {
      await conn.beginTransaction();

      const [result] = await conn.execute(
        `INSERT INTO paket_ujian
          (rombel_id, mapel_id, tutor_id, judul, deskripsi, jenis, durasi_menit, acak_soal, nilai_lulus, is_aktif)
         VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, 1)`,
        [
          rombel_id,
          mapel_id || null,
          tutor_id,
          judul,
          buildDeskripsiPayload({ deskripsi, sumber_ujian, link_google_form }),
          jenis || 'uh',
          durasi_menit || 60,
          acak_soal ? 1 : 0,
          nilai_lulus || 60,
        ]
      );
      const paketId = result.insertId;

      if (soal_ids?.length) {
        const values = soal_ids.map((soalId, index) => [paketId, soalId, index + 1]);
        const placeholders = values.map(() => '(?,?,?)').join(',');
        await conn.execute(
          `INSERT INTO paket_ujian_soal (paket_ujian_id, soal_id, nomor_urut)
           VALUES ${placeholders}`,
          values.flat()
        );
      }

      await conn.commit();
      return paketId;
    } catch (error) {
      await conn.rollback();
      throw error;
    } finally {
      conn.release();
    }
  },
};

export const SesiUjianModel = {
  mulai: async ({ paket_id, warga_belajar_id }) => {
    const [existingRows] = await pool.execute(
      `SELECT
         su.id,
         su.paket_ujian_id,
         su.warga_belajar_id,
         su.waktu_mulai,
         su.waktu_selesai,
         su.status,
         su.nilai_total,
         su.is_lulus
       FROM sesi_ujian su
       WHERE su.paket_ujian_id = ? AND su.warga_belajar_id = ?
       LIMIT 1`,
      [paket_id, warga_belajar_id]
    );

    if (existingRows[0]) return existingRows[0];

    const [result] = await pool.execute(
      `INSERT INTO sesi_ujian (paket_ujian_id, warga_belajar_id, waktu_mulai, status)
       VALUES (?, ?, NOW(), 'sedang_berjalan')`,
      [paket_id, warga_belajar_id]
    );

    const [createdRows] = await pool.execute(
      `SELECT
         su.id,
         su.paket_ujian_id,
         su.warga_belajar_id,
         su.waktu_mulai,
         su.waktu_selesai,
         su.status,
         su.nilai_total,
         su.is_lulus
       FROM sesi_ujian su
       WHERE su.id = ?
       LIMIT 1`,
      [result.insertId]
    );

    return createdRows[0];
  },

  simpanJawaban: async ({ sesi_id, soal_id, jawaban }) => {
    await pool.execute(
      `INSERT INTO jawaban_ujian (sesi_ujian_id, soal_id, jawaban)
       VALUES (?, ?, ?)
       ON DUPLICATE KEY UPDATE
         jawaban = VALUES(jawaban)`,
      [sesi_id, soal_id, jawaban || null]
    );
  },

  getJawabanBySesi: async (sesi_id) => {
    const [rows] = await pool.execute(
      `SELECT soal_id, jawaban
       FROM jawaban_ujian
       WHERE sesi_ujian_id = ?`,
      [sesi_id]
    );
    return rows;
  },

  submit: async (sesi_id) => {
    const conn = await pool.getConnection();
    try {
      await conn.beginTransaction();

      const [sesiRows] = await conn.execute(
        `SELECT
           su.id,
           su.paket_ujian_id,
           su.status,
           pu.nilai_lulus
         FROM sesi_ujian su
         JOIN paket_ujian pu ON pu.id = su.paket_ujian_id
         WHERE su.id = ?
         LIMIT 1`,
        [sesi_id]
      );
      const sesi = sesiRows[0];
      if (!sesi) throw new Error('Sesi ujian tidak ditemukan.');

      const [jawabanRows] = await conn.execute(
        `SELECT
           ju.soal_id,
           ju.jawaban,
           bs.tipe,
           bs.kunci_jawaban,
           bs.skor_benar
         FROM jawaban_ujian ju
         JOIN bank_soal bs ON bs.id = ju.soal_id
         WHERE ju.sesi_ujian_id = ?`,
        [sesi_id]
      );

      const [paketSoalRows] = await conn.execute(
        `SELECT bs.id, bs.tipe, bs.kunci_jawaban, bs.skor_benar
         FROM paket_ujian_soal pus
         JOIN bank_soal bs ON bs.id = pus.soal_id
         WHERE pus.paket_ujian_id = ?`,
        [sesi.paket_ujian_id]
      );

      const jawabanBySoal = new Map(jawabanRows.map((row) => [String(row.soal_id), row]));
      let totalBobot = 0;
      let nilaiDapat = 0;
      let adaEssay = false;

      for (const soal of paketSoalRows) {
        const tipe = normalizeTipeSoal(soal.tipe);
        if (tipe === 'pilihan_ganda') {
          totalBobot += Number(soal.skor_benar || 1);
          const jawaban = jawabanBySoal.get(String(soal.id));
          if (jawaban && String(jawaban.jawaban || '').trim().toUpperCase() === String(soal.kunci_jawaban || '').trim().toUpperCase()) {
            nilaiDapat += Number(soal.skor_benar || 1);
          }
        } else {
          adaEssay = true;
        }
      }

      const nilaiTotal = totalBobot > 0 ? Number(((nilaiDapat / totalBobot) * 100).toFixed(2)) : null;
      const isLulus = nilaiTotal === null ? null : (nilaiTotal >= Number(sesi.nilai_lulus || 60) ? 1 : 0);
      const status = adaEssay ? 'selesai' : 'selesai';

      await conn.execute(
        `UPDATE sesi_ujian
         SET waktu_selesai = NOW(), nilai_total = ?, is_lulus = ?, status = ?
         WHERE id = ?`,
        [nilaiTotal, isLulus, status, sesi_id]
      );

      await conn.commit();
      return {
        nilai_akhir: nilaiTotal,
        nilai_total: nilaiTotal,
        is_lulus: isLulus,
        status,
        ada_essay: adaEssay,
      };
    } catch (error) {
      await conn.rollback();
      throw error;
    } finally {
      conn.release();
    }
  },

  nilaiEssay: async ({ sesi_id, soal_id, nilai_essay, feedback }) => {
    await pool.execute(
      `UPDATE jawaban_ujian
       SET skor = ?, catatan_penilai = ?, dinilai_at = NOW()
       WHERE sesi_ujian_id = ? AND soal_id = ?`,
      [nilai_essay, feedback || null, sesi_id, soal_id]
    );
  },

  simpanNilaiManualGoogleForm: async ({ paket_id, warga_belajar_id, nilai_total, nilai_lulus }) => {
    const conn = await pool.getConnection();
    try {
      await conn.beginTransaction();

      const [existingRows] = await conn.execute(
        `SELECT id
         FROM sesi_ujian
         WHERE paket_ujian_id = ? AND warga_belajar_id = ?
         LIMIT 1`,
        [paket_id, warga_belajar_id]
      );

      const isLulus = Number(nilai_total) >= Number(nilai_lulus || 60) ? 1 : 0;

      if (existingRows[0]) {
        await conn.execute(
          `UPDATE sesi_ujian
           SET nilai_total = ?, is_lulus = ?, status = 'selesai',
               waktu_mulai = COALESCE(waktu_mulai, NOW()),
               waktu_selesai = NOW()
           WHERE id = ?`,
          [nilai_total, isLulus, existingRows[0].id]
        );
      } else {
        await conn.execute(
          `INSERT INTO sesi_ujian
            (paket_ujian_id, warga_belajar_id, waktu_mulai, waktu_selesai, status, nilai_total, is_lulus)
           VALUES (?, ?, NOW(), NOW(), 'selesai', ?, ?)`,
          [paket_id, warga_belajar_id, nilai_total, isLulus]
        );
      }

      await conn.commit();
      return { nilai_total, is_lulus: isLulus };
    } catch (error) {
      await conn.rollback();
      throw error;
    } finally {
      conn.release();
    }
  },

  getRekap: async (paket_id) => {
    const [paketRows] = await pool.execute(
      `SELECT pu.id, pu.rombel_id, pu.judul, pu.nilai_lulus, pu.deskripsi
       FROM paket_ujian pu
       WHERE pu.id = ?
       LIMIT 1`,
      [paket_id]
    );
    const paket = paketRows[0];
    if (!paket) return null;

    const [peserta] = await pool.execute(
      `SELECT
         su.id AS sesi_id,
         wb.id AS warga_belajar_id,
         u.nama_lengkap,
         wb.nis,
         su.waktu_mulai,
         su.waktu_selesai,
         su.nilai_total,
         su.is_lulus,
         su.status
       FROM warga_belajar wb
       JOIN users u ON u.id = wb.user_id
       LEFT JOIN sesi_ujian su
         ON su.warga_belajar_id = wb.id
        AND su.paket_ujian_id = ?
       WHERE wb.rombel_id = ?
         AND wb.is_aktif = 1
       ORDER BY u.nama_lengkap ASC`,
      [paket_id, paket.rombel_id]
    );

    const dinilai = peserta.filter((item) => item.nilai_total !== null);
    const totalPeserta = peserta.length;
    const jumlahLulus = peserta.filter((item) => Number(item.is_lulus) === 1).length;
    const nilaiList = dinilai.map((item) => Number(item.nilai_total));

    return {
      paket_id: paket.id,
      judul: paket.judul,
      nilai_lulus_paket: paket.nilai_lulus,
      ...parseDeskripsiPayload(paket.deskripsi),
      total_peserta: totalPeserta,
      jumlah_lulus: jumlahLulus,
      nilai_tertinggi: nilaiList.length ? Math.max(...nilaiList) : null,
      nilai_terendah: nilaiList.length ? Math.min(...nilaiList) : null,
      nilai_rata_rata: nilaiList.length
        ? Number((nilaiList.reduce((sum, nilai) => sum + nilai, 0) / nilaiList.length).toFixed(2))
        : null,
      peserta,
    };
  },
};
