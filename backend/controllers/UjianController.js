// ============================================================
// controllers/UjianController.js
// Mengelola Bank Soal, Paket Ujian, dan Sesi Ujian WB.
// ============================================================

import { BankSoalModel, PaketUjianModel, SesiUjianModel } from '../models/UjianModel.js';
import SiswaModel from '../models/SiswaModel.js';

// ── BANK SOAL ────────────────────────────────────────────────
export const BankSoalController = {

  getAll: async (req, res) => {
    try {
      const { mapel_id, jenjang, jenis } = req.query;
      const data = await BankSoalModel.findAll({
        mapel_id: mapel_id ? parseInt(mapel_id) : null,
        jenjang:  jenjang  || null,
        jenis:    jenis    || null,
      });
      return res.json({ success: true, data });
    } catch (e) {
      console.error('[BankSoalController.getAll]', e);
      return res.status(500).json({ success: false, message: 'Gagal mengambil bank soal.' });
    }
  },

  getById: async (req, res) => {
    try {
      const soal = await BankSoalModel.findById(parseInt(req.params.id));
      if (!soal) return res.status(404).json({ success: false, message: 'Soal tidak ditemukan.' });
      return res.json({ success: true, data: soal });
    } catch (e) {
      console.error('[BankSoalController.getById]', e);
      return res.status(500).json({ success: false, message: 'Gagal mengambil soal.' });
    }
  },

  create: async (req, res) => {
    try {
      const {
        mapel_id,
        jenjang,
        jenis,
        tipe,
        kategori,
        pertanyaan,
        pilihan_json,
        pilihan,
        jawaban_benar,
        kunci_jawaban,
        bobot,
        skor_benar,
        tag,
        tag_dimensi,
      } = req.body;

      const tipeFinal = tipe || jenis;
      const pilihanFinal = pilihan ?? (typeof pilihan_json === 'string' ? JSON.parse(pilihan_json) : pilihan_json);

      if (!mapel_id || !jenjang || !tipeFinal || !pertanyaan) {
        return res.status(400).json({ success: false, message: 'Field wajib: mapel_id, jenjang, tipe, pertanyaan.' });
      }
      if ((tipeFinal === 'pilihan_ganda' || tipeFinal === 'pilgan') && !(kunci_jawaban || jawaban_benar)) {
        return res.status(400).json({ success: false, message: 'Soal pilihan ganda wajib memiliki kunci jawaban.' });
      }

      const id = await BankSoalModel.create({
        mapel_id,
        jenjang,
        jenis: tipeFinal,
        kategori,
        pertanyaan,
        pilihan: pilihanFinal,
        kunci_jawaban: kunci_jawaban || jawaban_benar,
        skor_benar: skor_benar ?? bobot,
        tag_dimensi: tag_dimensi || tag,
        tutor_id: req.user.id,
      });
      return res.status(201).json({ success: true, message: 'Soal berhasil ditambahkan.', data: { id } });
    } catch (e) {
      console.error('[BankSoalController.create]', e);
      return res.status(500).json({ success: false, message: 'Gagal menambahkan soal.' });
    }
  },

  update: async (req, res) => {
    try {
      const {
        pertanyaan,
        pilihan_json,
        pilihan,
        jawaban_benar,
        kunci_jawaban,
        bobot,
        skor_benar,
        tag,
        tag_dimensi,
        kategori,
        jenis,
        tipe,
      } = req.body;

      const affected = await BankSoalModel.update(parseInt(req.params.id), {
        pertanyaan,
        pilihan: pilihan ?? (typeof pilihan_json === 'string' ? JSON.parse(pilihan_json) : pilihan_json),
        kunci_jawaban: kunci_jawaban || jawaban_benar,
        skor_benar: skor_benar ?? bobot,
        tag_dimensi: tag_dimensi || tag,
        kategori,
        jenis: tipe || jenis,
      });
      if (affected === 0) return res.status(404).json({ success: false, message: 'Soal tidak ditemukan.' });
      return res.json({ success: true, message: 'Soal berhasil diperbarui.' });
    } catch (e) {
      console.error('[BankSoalController.update]', e);
      return res.status(500).json({ success: false, message: 'Gagal memperbarui soal.' });
    }
  },

  delete: async (req, res) => {
    try {
      const affected = await BankSoalModel.delete(parseInt(req.params.id));
      if (affected === 0) return res.status(404).json({ success: false, message: 'Soal tidak ditemukan.' });
      return res.json({ success: true, message: 'Soal berhasil dihapus.' });
    } catch (e) {
      console.error('[BankSoalController.delete]', e);
      return res.status(500).json({ success: false, message: 'Gagal menghapus soal.' });
    }
  },
};

// ── PAKET UJIAN ──────────────────────────────────────────────
export const PaketUjianController = {

  getByRombel: async (req, res) => {
    try {
      let rombelId = parseInt(req.params.rombelId);
      let options = {};

      if (req.user.role === 'warga_belajar') {
        const wb = await SiswaModel.findByUserId(req.user.id);
        if (!wb || !wb.rombel_id) {
          return res.json({ success: true, data: [] });
        }
        rombelId = wb.rombel_id;
        options = { warga_belajar_id: wb.id, onlyActive: true };
      }

      const data = await PaketUjianModel.findByRombel(rombelId, options);
      return res.json({ success: true, data });
    } catch (e) {
      console.error('[PaketUjianController.getByRombel]', e);
      return res.status(500).json({ success: false, message: 'Gagal mengambil paket ujian.' });
    }
  },

  getById: async (req, res) => {
    try {
      const paket = await PaketUjianModel.findById(parseInt(req.params.id));
      if (!paket) return res.status(404).json({ success: false, message: 'Paket ujian tidak ditemukan.' });

      // Sembunyikan jawaban_benar dari WB
      if (req.user.role === 'warga_belajar') {
        const wb = await SiswaModel.findByUserId(req.user.id);
        if (!wb || String(wb.rombel_id) !== String(paket.rombel_id) || Number(paket.is_aktif) !== 1) {
          return res.status(403).json({ success: false, message: 'Paket ujian ini tidak tersedia untuk Anda.' });
        }
        paket.soal = paket.soal.map(({ kunci_jawaban, ...s }) => s);
      }
      return res.json({ success: true, data: paket });
    } catch (e) {
      console.error('[PaketUjianController.getById]', e);
      return res.status(500).json({ success: false, message: 'Gagal mengambil paket ujian.' });
    }
  },

  create: async (req, res) => {
    try {
      const {
        rombel_id,
        mapel_id,
        judul,
        deskripsi,
        sumber_ujian,
        link_google_form,
        durasi_menit,
        acak_soal,
        jenis,
        nilai_lulus,
        soal_ids,
      } = req.body;
      const sumberFinal = sumber_ujian || 'internal';

      if (!rombel_id || !judul) {
        return res.status(400).json({ success: false, message: 'Field wajib: rombel_id dan judul.' });
      }
      if (sumberFinal === 'internal' && !soal_ids?.length) {
        return res.status(400).json({ success: false, message: 'Pilih minimal 1 soal untuk ujian internal.' });
      }
      if (sumberFinal === 'google_form' && !link_google_form) {
        return res.status(400).json({ success: false, message: 'Link Google Form wajib diisi untuk mode Google Form.' });
      }
      const id = await PaketUjianModel.create({
        rombel_id,
        mapel_id,
        tutor_id: req.user.id,
        judul,
        deskripsi,
        sumber_ujian: sumberFinal,
        link_google_form,
        jenis,
        durasi_menit,
        acak_soal,
        nilai_lulus,
        soal_ids,
      });
      return res.status(201).json({ success: true, message: 'Paket ujian berhasil dibuat.', data: { id } });
    } catch (e) {
      console.error('[PaketUjianController.create]', e);
      return res.status(500).json({ success: false, message: 'Gagal membuat paket ujian.' });
    }
  },

  getRekap: async (req, res) => {
    try {
      const data = await SesiUjianModel.getRekap(parseInt(req.params.id));
      if (!data) {
        return res.status(404).json({ success: false, message: 'Paket ujian tidak ditemukan.' });
      }
      return res.json({ success: true, data });
    } catch (e) {
      console.error('[PaketUjianController.getRekap]', e);
      return res.status(500).json({ success: false, message: 'Gagal mengambil rekap ujian.' });
    }
  },

  simpanNilaiManual: async (req, res) => {
    try {
      const paketId = parseInt(req.params.id);
      const { warga_belajar_id, nilai_total } = req.body;

      if (!warga_belajar_id || nilai_total === undefined || nilai_total === null || nilai_total === '') {
        return res.status(400).json({ success: false, message: 'warga_belajar_id dan nilai_total wajib diisi.' });
      }

      const paket = await PaketUjianModel.findById(paketId);
      if (!paket) {
        return res.status(404).json({ success: false, message: 'Paket ujian tidak ditemukan.' });
      }
      if (paket.sumber_ujian !== 'google_form') {
        return res.status(400).json({ success: false, message: 'Input nilai manual hanya untuk paket Google Form.' });
      }

      const hasil = await SesiUjianModel.simpanNilaiManualGoogleForm({
        paket_id: paketId,
        warga_belajar_id: parseInt(warga_belajar_id),
        nilai_total: Number(nilai_total),
        nilai_lulus: paket.nilai_lulus,
      });

      return res.json({ success: true, message: 'Nilai manual berhasil disimpan.', data: hasil });
    } catch (e) {
      console.error('[PaketUjianController.simpanNilaiManual]', e);
      return res.status(500).json({ success: false, message: 'Gagal menyimpan nilai manual.' });
    }
  },
};

// ── SESI UJIAN (WB mengerjakan) ──────────────────────────────
export const SesiUjianController = {

  // WB mulai mengerjakan ujian
  mulai: async (req, res) => {
    try {
      const wb = await SiswaModel.findByUserId(req.user.id);
      if (!wb) return res.status(404).json({ success: false, message: 'Profil WB tidak ditemukan.' });

      const paket = await PaketUjianModel.findById(parseInt(req.params.paketId));
      if (!paket) {
        return res.status(404).json({ success: false, message: 'Paket ujian tidak ditemukan.' });
      }
      if (String(paket.rombel_id) !== String(wb.rombel_id) || Number(paket.is_aktif) !== 1) {
        return res.status(403).json({ success: false, message: 'Paket ujian ini tidak tersedia untuk rombel Anda.' });
      }
      if (paket.sumber_ujian === 'google_form') {
        return res.status(400).json({ success: false, message: 'Paket ini dibuka melalui Google Form.' });
      }

      const sesi = await SesiUjianModel.mulai({ paket_id: parseInt(req.params.paketId), warga_belajar_id: wb.id });
      const jawabanTersimpan = await SesiUjianModel.getJawabanBySesi(sesi.id);
      const jawaban = jawabanTersimpan.reduce((acc, item) => {
        acc[item.soal_id] = item.jawaban;
        return acc;
      }, {});

      const soal = paket.soal.map(({ kunci_jawaban, ...item }) => item);

      return res.json({
        success: true,
        message: 'Ujian dimulai.',
        data: {
          id: sesi.id,
          paket_id: paket.id,
          judul: paket.judul,
          durasi_menit: paket.durasi_menit,
          waktu_mulai: sesi.waktu_mulai,
          status: sesi.status,
          soal,
          jawaban,
        },
      });
    } catch (e) {
      console.error('[SesiUjianController.mulai]', e);
      return res.status(500).json({ success: false, message: 'Gagal memulai ujian.' });
    }
  },

  // WB simpan jawaban satu soal
  simpanJawaban: async (req, res) => {
    try {
      const { soal_id, jawaban_teks, jawaban_pilihan, jawaban } = req.body;
      if (!soal_id) return res.status(400).json({ success: false, message: 'soal_id wajib diisi.' });
      await SesiUjianModel.simpanJawaban({
        sesi_id: parseInt(req.params.sesiId),
        soal_id,
        jawaban: jawaban ?? jawaban_pilihan ?? jawaban_teks ?? null,
      });
      return res.json({ success: true, message: 'Jawaban tersimpan.' });
    } catch (e) {
      console.error('[SesiUjianController.simpanJawaban]', e);
      return res.status(500).json({ success: false, message: 'Gagal menyimpan jawaban.' });
    }
  },

  // WB submit ujian
  submit: async (req, res) => {
    try {
      const hasil = await SesiUjianModel.submit(parseInt(req.params.sesiId));
      return res.json({ success: true, message: 'Ujian berhasil dikumpulkan.', data: hasil });
    } catch (e) {
      console.error('[SesiUjianController.submit]', e);
      return res.status(500).json({ success: false, message: 'Gagal submit ujian.' });
    }
  },

  // Tutor nilai essay
  nilaiEssay: async (req, res) => {
    try {
      const { soal_id, nilai_essay, feedback } = req.body;
      if (!soal_id || nilai_essay === undefined) return res.status(400).json({ success: false, message: 'soal_id dan nilai_essay wajib diisi.' });
      await SesiUjianModel.nilaiEssay({ sesi_id: parseInt(req.params.sesiId), soal_id, nilai_essay, feedback });
      return res.json({ success: true, message: 'Nilai essay berhasil disimpan.' });
    } catch (e) {
      console.error('[SesiUjianController.nilaiEssay]', e);
      return res.status(500).json({ success: false, message: 'Gagal menyimpan nilai essay.' });
    }
  },
};
