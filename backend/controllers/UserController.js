// ============================================================
// controllers/UserController.js
// Mengelola akun user: buat, lihat semua, suspend, reset password.
// Hanya dapat diakses oleh Super Admin.
// ============================================================

import bcrypt from 'bcryptjs';
import UserModel from '../models/UserModel.js';

const UserController = {

  // -----------------------------------------------------------
  // GET /api/users
  // Ambil semua user di sistem
  // -----------------------------------------------------------
  getAll: async (req, res) => {
    try {
      const users = await UserModel.findAll();
      return res.status(200).json({
        success: true,
        message: `${users.length} akun ditemukan.`,
        data: users,
      });
    } catch (error) {
      console.error('[UserController.getAll] Error:', error);
      return res.status(500).json({ success: false, message: 'Gagal mengambil data user.' });
    }
  },

  // -----------------------------------------------------------
  // POST /api/users
  // Buat akun baru untuk Tutor atau Admin TU
  // Body: { nama_lengkap, email, password, role }
  // -----------------------------------------------------------
  create: async (req, res) => {
    try {
      const { nama_lengkap, email, password, role } = req.body;

      // Validasi input
      if (!nama_lengkap || !email || !password || !role) {
        return res.status(400).json({
          success: false,
          message: 'Semua field (nama_lengkap, email, password, role) wajib diisi.',
        });
      }

      // Cek apakah email sudah terdaftar
      const existing = await UserModel.findByEmail(email);
      if (existing) {
        return res.status(409).json({
          success: false,
          message: 'Email sudah terdaftar di sistem.',
        });
      }

      // Hash password sebelum disimpan (cost factor: 10)
      const password_hash = await bcrypt.hash(password, 10);

      const newId = await UserModel.create({ nama_lengkap, email, password_hash, role });

      return res.status(201).json({
        success: true,
        message: `Akun berhasil dibuat dengan ID ${newId}.`,
        data: { id: newId, nama_lengkap, email, role },
      });

    } catch (error) {
      console.error('[UserController.create] Error:', error);
      return res.status(500).json({ success: false, message: 'Gagal membuat akun.' });
    }
  },

  // -----------------------------------------------------------
  // PUT /api/users/:id/status
  // Aktifkan (1) atau Nonaktifkan (0) akun user
  // Body: { is_active: 0 | 1 }
  // -----------------------------------------------------------
  updateStatus: async (req, res) => {
    try {
      const { id } = req.params;
      const { is_active } = req.body;

      if (is_active === undefined) {
        return res.status(400).json({ success: false, message: 'Field is_active wajib diisi.' });
      }

      const affected = await UserModel.updateStatus(parseInt(id), is_active ? 1 : 0);

      if (affected === 0) {
        return res.status(404).json({ success: false, message: 'User tidak ditemukan.' });
      }

      const statusText = is_active ? 'diaktifkan' : 'dinonaktifkan';
      return res.status(200).json({ success: true, message: `Akun berhasil ${statusText}.` });

    } catch (error) {
      console.error('[UserController.updateStatus] Error:', error);
      return res.status(500).json({ success: false, message: 'Gagal mengubah status akun.' });
    }
  },

  // -----------------------------------------------------------
  // PUT /api/users/:id/password
  // Reset password user (Super Admin dapat mereset password siapapun)
  // Body: { new_password }
  // -----------------------------------------------------------
  resetPassword: async (req, res) => {
    try {
      const { id } = req.params;
      const { password_baru } = req.body;

      if (!password_baru || password_baru.length < 8) {
        return res.status(400).json({
          success: false,
          message: 'Password baru minimal 8 karakter.',
        });
      }

      const password_hash = await bcrypt.hash(password_baru, 10);
      const affected = await UserModel.updatePassword(parseInt(id), password_hash);

      if (affected === 0) {
        return res.status(404).json({ success: false, message: 'User tidak ditemukan.' });
      }

      return res.status(200).json({ success: true, message: 'Password berhasil direset.' });

    } catch (error) {
      console.error('[UserController.resetPassword] Error:', error);
      return res.status(500).json({ success: false, message: 'Gagal mereset password.' });
    }
  },
};

export default UserController;
