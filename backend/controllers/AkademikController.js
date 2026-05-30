import AkademikModel from '../models/AkademikModel.js';
import SiswaModel from '../models/SiswaModel.js';
import fs from 'fs';

const VALID_JENJANG = ['paket_a', 'paket_b', 'paket_c', 'semua'];

const AkademikController = {
  getAllMapel: async (req, res) => {
    try {
      const { keyword, jenjang, is_active } = req.query;
      const data = await AkademikModel.findAllMapel({
        keyword: keyword || null,
        jenjang: jenjang || null,
        is_active: is_active !== undefined && is_active !== '' ? parseInt(is_active) : null,
      });
      return res.status(200).json({ success: true, data });
    } catch (error) {
      console.error('[AkademikController.getAllMapel] Error:', error);
      return res.status(500).json({ success: false, message: 'Gagal mengambil data master mapel.' });
    }
  },

  getMapelById: async (req, res) => {
    try {
      const data = await AkademikModel.findMapelById(parseInt(req.params.id));
      if (!data) return res.status(404).json({ success: false, message: 'Mapel tidak ditemukan.' });
      return res.status(200).json({ success: true, data });
    } catch (error) {
      console.error('[AkademikController.getMapelById] Error:', error);
      return res.status(500).json({ success: false, message: 'Gagal mengambil detail mapel.' });
    }
  },

  createMapel: async (req, res) => {
    try {
      const { kode, nama, jenjang, deskripsi, is_active = true } = req.body;
      if (!kode || !nama || !jenjang) {
        return res.status(400).json({ success: false, message: 'Kode, nama, dan jenjang mapel wajib diisi.' });
      }
      if (!VALID_JENJANG.includes(jenjang)) {
        return res.status(400).json({ success: false, message: 'Jenjang mapel tidak valid.' });
      }

      const existing = await AkademikModel.findMapelByKode(String(kode).trim());
      if (existing) {
        return res.status(409).json({ success: false, message: 'Kode mapel sudah digunakan.' });
      }

      const id = await AkademikModel.createMapel({
        kode: String(kode).trim(),
        nama: String(nama).trim(),
        jenjang,
        deskripsi: deskripsi ? String(deskripsi).trim() : null,
        is_active: Boolean(is_active),
      });
      return res.status(201).json({ success: true, message: 'Mapel berhasil ditambahkan.', data: { id } });
    } catch (error) {
      console.error('[AkademikController.createMapel] Error:', error);
      return res.status(500).json({ success: false, message: 'Gagal menambahkan mapel.' });
    }
  },

  updateMapel: async (req, res) => {
    try {
      const id = parseInt(req.params.id);
      const { kode, nama, jenjang, deskripsi, is_active = true } = req.body;
      if (!kode || !nama || !jenjang) {
        return res.status(400).json({ success: false, message: 'Kode, nama, dan jenjang mapel wajib diisi.' });
      }
      if (!VALID_JENJANG.includes(jenjang)) {
        return res.status(400).json({ success: false, message: 'Jenjang mapel tidak valid.' });
      }

      const existing = await AkademikModel.findMapelByKode(String(kode).trim());
      if (existing && existing.id !== id) {
        return res.status(409).json({ success: false, message: 'Kode mapel sudah digunakan.' });
      }

      const affectedRows = await AkademikModel.updateMapel(id, {
        kode: String(kode).trim(),
        nama: String(nama).trim(),
        jenjang,
        deskripsi: deskripsi ? String(deskripsi).trim() : null,
        is_active: Boolean(is_active),
      });

      if (affectedRows === 0) {
        return res.status(404).json({ success: false, message: 'Mapel tidak ditemukan.' });
      }

      return res.status(200).json({ success: true, message: 'Mapel berhasil diperbarui.' });
    } catch (error) {
      console.error('[AkademikController.updateMapel] Error:', error);
      return res.status(500).json({ success: false, message: 'Gagal memperbarui mapel.' });
    }
  },

  updateMapelStatus: async (req, res) => {
    try {
      const { is_active } = req.body;
      if (is_active === undefined) {
        return res.status(400).json({ success: false, message: 'Status aktif mapel wajib diisi.' });
      }

      const affectedRows = await AkademikModel.updateMapelStatus(parseInt(req.params.id), Boolean(is_active));
      if (affectedRows === 0) {
        return res.status(404).json({ success: false, message: 'Mapel tidak ditemukan.' });
      }

      return res.status(200).json({ success: true, message: 'Status mapel berhasil diperbarui.' });
    } catch (error) {
      console.error('[AkademikController.updateMapelStatus] Error:', error);
      return res.status(500).json({ success: false, message: 'Gagal memperbarui status mapel.' });
    }
  },

  getRombelMapel: async (req, res) => {
    try {
      const { rombel_id, is_visible } = req.query;
      const data = await AkademikModel.findRombelMapel({
        rombel_id: rombel_id ? parseInt(rombel_id) : null,
        is_visible: is_visible !== undefined && is_visible !== '' ? parseInt(is_visible) : null,
      });
      return res.status(200).json({ success: true, data });
    } catch (error) {
      console.error('[AkademikController.getRombelMapel] Error:', error);
      return res.status(500).json({ success: false, message: 'Gagal mengambil data mapel per rombel.' });
    }
  },

  createRombelMapel: async (req, res) => {
    try {
      const { rombel_id, mapel_id, tutor_id, is_visible = true, urutan = 0 } = req.body;
      if (!rombel_id || !mapel_id) {
        return res.status(400).json({ success: false, message: 'Rombel dan mapel wajib dipilih.' });
      }

      const existing = await AkademikModel.findExistingRombelMapel({
        rombel_id: parseInt(rombel_id),
        mapel_id: parseInt(mapel_id),
      });
      if (existing) {
        return res.status(409).json({ success: false, message: 'Mapel ini sudah terpasang pada rombel yang dipilih.' });
      }

      const mapel = await AkademikModel.findMapelById(parseInt(mapel_id));
      if (!mapel) {
        return res.status(404).json({ success: false, message: 'Mapel tidak ditemukan.' });
      }
      if (!mapel.is_active) {
        return res.status(400).json({ success: false, message: 'Mapel nonaktif tidak dapat dipasang ke rombel.' });
      }

      const id = await AkademikModel.createRombelMapel({
        rombel_id: parseInt(rombel_id),
        mapel_id: parseInt(mapel_id),
        tutor_id: tutor_id ? parseInt(tutor_id) : null,
        is_visible: Boolean(is_visible),
        urutan: parseInt(urutan) || 0,
      });
      return res.status(201).json({ success: true, message: 'Mapel berhasil dipasang ke rombel.', data: { id } });
    } catch (error) {
      console.error('[AkademikController.createRombelMapel] Error:', error);
      return res.status(500).json({ success: false, message: 'Gagal menambahkan mapel ke rombel.' });
    }
  },

  updateRombelMapel: async (req, res) => {
    try {
      const id = parseInt(req.params.id);
      const { rombel_id, mapel_id, tutor_id, is_visible = true, urutan = 0 } = req.body;
      if (!rombel_id || !mapel_id) {
        return res.status(400).json({ success: false, message: 'Rombel dan mapel wajib dipilih.' });
      }

      const existing = await AkademikModel.findExistingRombelMapel({
        rombel_id: parseInt(rombel_id),
        mapel_id: parseInt(mapel_id),
        exclude_id: id,
      });
      if (existing) {
        return res.status(409).json({ success: false, message: 'Mapel ini sudah terpasang pada rombel yang dipilih.' });
      }

      const mapel = await AkademikModel.findMapelById(parseInt(mapel_id));
      if (!mapel) {
        return res.status(404).json({ success: false, message: 'Mapel tidak ditemukan.' });
      }
      if (!mapel.is_active) {
        return res.status(400).json({ success: false, message: 'Mapel nonaktif tidak dapat dipasang ke rombel.' });
      }

      const affectedRows = await AkademikModel.updateRombelMapel(id, {
        rombel_id: parseInt(rombel_id),
        mapel_id: parseInt(mapel_id),
        tutor_id: tutor_id ? parseInt(tutor_id) : null,
        is_visible: Boolean(is_visible),
        urutan: parseInt(urutan) || 0,
      });

      if (affectedRows === 0) {
        return res.status(404).json({ success: false, message: 'Mapping mapel rombel tidak ditemukan.' });
      }

      return res.status(200).json({ success: true, message: 'Mapping mapel rombel berhasil diperbarui.' });
    } catch (error) {
      console.error('[AkademikController.updateRombelMapel] Error:', error);
      return res.status(500).json({ success: false, message: 'Gagal memperbarui mapping mapel rombel.' });
    }
  },

  updateRombelMapelVisibility: async (req, res) => {
    try {
      const { is_visible } = req.body;
      if (is_visible === undefined) {
        return res.status(400).json({ success: false, message: 'Status tampil wajib diisi.' });
      }

      const affectedRows = await AkademikModel.updateRombelMapelVisibility(parseInt(req.params.id), Boolean(is_visible));
      if (affectedRows === 0) {
        return res.status(404).json({ success: false, message: 'Mapping mapel rombel tidak ditemukan.' });
      }

      return res.status(200).json({ success: true, message: 'Status tampil mapel berhasil diperbarui.' });
    } catch (error) {
      console.error('[AkademikController.updateRombelMapelVisibility] Error:', error);
      return res.status(500).json({ success: false, message: 'Gagal memperbarui status tampil mapel.' });
    }
  },

  deleteRombelMapel: async (req, res) => {
    try {
      const affectedRows = await AkademikModel.deleteRombelMapel(parseInt(req.params.id));
      if (affectedRows === 0) {
        return res.status(404).json({ success: false, message: 'Mapping mapel rombel tidak ditemukan.' });
      }
      return res.status(200).json({ success: true, message: 'Mapping mapel berhasil dihapus dari rombel.' });
    } catch (error) {
      console.error('[AkademikController.deleteRombelMapel] Error:', error);
      return res.status(500).json({ success: false, message: 'Gagal menghapus mapping mapel rombel.' });
    }
  },

  getTutorOptions: async (req, res) => {
    try {
      const data = await AkademikModel.findTutorOptions();
      return res.status(200).json({ success: true, data });
    } catch (error) {
      console.error('[AkademikController.getTutorOptions] Error:', error);
      return res.status(500).json({ success: false, message: 'Gagal mengambil daftar tutor.' });
    }
  },

  getRombelOptions: async (req, res) => {
    try {
      const { jenjang } = req.query;
      const data = await SiswaModel.getRombelOptions({ jenjang: jenjang || null });
      return res.status(200).json({ success: true, data });
    } catch (error) {
      console.error('[AkademikController.getRombelOptions] Error:', error);
      return res.status(500).json({ success: false, message: 'Gagal mengambil daftar rombel.' });
    }
  },

  // -----------------------------------------------------------
  // RPS (Rencana Pembelajaran Semester)
  // -----------------------------------------------------------
  getRps: async (req, res) => {
    try {
      const { rombel_id, mapel_id } = req.query;
      if (!rombel_id || !mapel_id) {
        return res.status(400).json({ success: false, message: 'rombel_id dan mapel_id wajib diisi.' });
      }

      const mapping = await AkademikModel.findRombelMapelByRombelAndMapel(
        parseInt(rombel_id),
        parseInt(mapel_id)
      );

      if (!mapping) {
        return res.status(404).json({ success: false, message: 'Mapping rombel dan mapel tidak ditemukan.' });
      }

      return res.status(200).json({
        success: true,
        data: {
          id: mapping.id,
          rombel_id: mapping.rombel_id,
          mapel_id: mapping.mapel_id,
          tutor_id: mapping.tutor_id,
          nama_mapel: mapping.nama_mapel,
          nama_tutor: mapping.nama_tutor,
          rps_file_path: mapping.rps_file_path || null
        }
      });
    } catch (error) {
      console.error('[AkademikController.getRps] Error:', error);
      return res.status(500).json({ success: false, message: 'Gagal memuat RPS.' });
    }
  },

  uploadRps: async (req, res) => {
    try {
      const { rombel_id, mapel_id } = req.body;
      if (!rombel_id || !mapel_id) {
        if (req.file) fs.unlink(req.file.path, () => { });
        return res.status(400).json({ success: false, message: 'rombel_id dan mapel_id wajib diisi.' });
      }

      if (!req.file) {
        return res.status(400).json({ success: false, message: 'File RPS wajib diupload.' });
      }

      // Validasi file type (harus PDF)
      if (req.file.mimetype !== 'application/pdf') {
        fs.unlink(req.file.path, () => { });
        return res.status(400).json({ success: false, message: 'File RPS harus berformat PDF.' });
      }

      const mapping = await AkademikModel.findRombelMapelByRombelAndMapel(
        parseInt(rombel_id),
        parseInt(mapel_id)
      );

      if (!mapping) {
        fs.unlink(req.file.path, () => { });
        return res.status(404).json({ success: false, message: 'Mapping rombel dan mapel tidak ditemukan.' });
      }

      // Hapus file RPS lama jika ada
      if (mapping.rps_file_path) {
        fs.unlink(mapping.rps_file_path, () => { });
      }

      await AkademikModel.updateRpsFile(mapping.id, req.file.path);

      return res.status(200).json({
        success: true,
        message: 'RPS berhasil diunggah.',
        data: {
          rps_file_path: req.file.path
        }
      });
    } catch (error) {
      console.error('[AkademikController.uploadRps] Error:', error);
      if (req.file) fs.unlink(req.file.path, () => { });
      return res.status(500).json({ success: false, message: 'Gagal mengunggah RPS.' });
    }
  },
};

export default AkademikController;
