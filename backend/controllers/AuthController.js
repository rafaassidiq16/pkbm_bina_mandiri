// ============================================================
// controllers/AuthController.js
// Menangani proses Login dan verifikasi token (Me).
// Setiap fungsi menerima (req, res) dari Express.
// ============================================================

import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import fs from 'fs';
import UserModel from '../models/UserModel.js';
import ProfileModel from '../models/ProfileModel.js';

const AuthController = {

  // -----------------------------------------------------------
  // POST /api/auth/login
  // Menerima: { email, password }
  // Mengembalikan: token JWT + data user (tanpa password)
  // -----------------------------------------------------------
  login: async (req, res) => {
    try {
      const { email, password } = req.body;

      // Validasi input tidak boleh kosong
      if (!email || !password) {
        return res.status(400).json({
          success: false,
          message: 'Email dan password wajib diisi.',
        });
      }

      // Cari user di database berdasarkan email
      const user = await UserModel.findByEmail(email);

      // Jika user tidak ditemukan, jangan beri tahu alasan spesifik
      // (keamanan: attacker tidak tahu apakah email terdaftar atau tidak)
      if (!user) {
        return res.status(401).json({
          success: false,
          message: 'Email atau password salah.',
        });
      }

      // Bandingkan password yang diinput dengan hash di database
      const passwordCocok = await bcrypt.compare(password, user.password_hash);

      if (!passwordCocok) {
        return res.status(401).json({
          success: false,
          message: 'Email atau password salah.',
        });
      }

      // Buat token JWT yang berisi payload minimun (id & role)
      // Jangan menaruh data sensitif di payload JWT
      const token = jwt.sign(
        { id: user.id, role: user.role },
        process.env.JWT_SECRET,
        { expiresIn: process.env.JWT_EXPIRES_IN || '7d' }
      );

      // Kirim response sukses (hapus password_hash dari response)
      const { password_hash, ...userData } = user;

      return res.status(200).json({
        success: true,
        message: 'Login berhasil.',
        data: {
          token,
          user: userData,
        },
      });

    } catch (error) {
      console.error('[AuthController.login] Error:', error);
      return res.status(500).json({
        success: false,
        message: 'Terjadi kesalahan pada server.',
      });
    }
  },

  // -----------------------------------------------------------
  // GET /api/auth/me
  // Ambil data user yang sedang login (berdasarkan token)
  // Membutuhkan middleware: verifyToken
  // -----------------------------------------------------------
  getMe: async (req, res) => {
    try {
      const user = await ProfileModel.findByUserIdAndRole(req.user.id, req.user.role);

      if (!user) {
        return res.status(404).json({
          success: false,
          message: 'Akun tidak ditemukan.',
        });
      }

      return res.status(200).json({
        success: true,
        data: user,
      });

    } catch (error) {
      console.error('[AuthController.getMe] Error:', error);
      return res.status(500).json({
        success: false,
        message: 'Terjadi kesalahan pada server.',
      });
    }
  },

  updateMe: async (req, res) => {
    try {
      const { nama_lengkap, email } = req.body;

      if (!nama_lengkap || !String(nama_lengkap).trim()) {
        return res.status(400).json({
          success: false,
          message: 'Nama lengkap wajib diisi.',
        });
      }

      if (!email || !String(email).trim()) {
        return res.status(400).json({
          success: false,
          message: 'Email wajib diisi.',
        });
      }

      const emailTrimmed = String(email).trim().toLowerCase();
      const existing = await UserModel.findByEmailAnyStatus(emailTrimmed);
      if (existing && existing.id !== req.user.id) {
        return res.status(409).json({
          success: false,
          message: 'Email sudah digunakan oleh akun lain.',
        });
      }

      if (req.user.role === 'warga_belajar') {
        const { nik, tanggal_lahir, jenis_kelamin, alamat, nama_wali, no_telp } = req.body;

        if (!tanggal_lahir || !jenis_kelamin) {
          return res.status(400).json({
            success: false,
            message: 'Tanggal lahir dan jenis kelamin wajib diisi untuk warga belajar.',
          });
        }
      }

      await ProfileModel.updateUserBasic(req.user.id, {
        nama_lengkap: String(nama_lengkap).trim(),
        email: emailTrimmed,
      });

      if (req.user.role === 'warga_belajar') {
        const { nik, tanggal_lahir, jenis_kelamin, alamat, nama_wali, no_telp } = req.body;

        await ProfileModel.updateWargaBelajarProfile(req.user.id, {
          nik,
          tanggal_lahir,
          jenis_kelamin,
          alamat,
          nama_wali,
          no_telp,
        });
      }

      if (req.user.role === 'tutor') {
        const { nip, spesialisasi, no_telp } = req.body;
        await ProfileModel.upsertTutorProfile(req.user.id, {
          nip,
          spesialisasi,
          no_telp,
        });
      }

      const profile = await ProfileModel.findByUserIdAndRole(req.user.id, req.user.role);

      return res.status(200).json({
        success: true,
        message: 'Profil berhasil diperbarui.',
        data: profile,
      });
    } catch (error) {
      console.error('[AuthController.updateMe] Error:', error);
      return res.status(500).json({
        success: false,
        message: 'Gagal memperbarui profil.',
      });
    }
  },

  uploadFotoProfil: async (req, res) => {
    try {
      if (!req.file) {
        return res.status(400).json({
          success: false,
          message: 'File foto profil wajib diupload.',
        });
      }

      if (!req.file.mimetype.startsWith('image/')) {
        fs.unlink(req.file.path, () => {});
        return res.status(400).json({
          success: false,
          message: 'Foto profil harus berupa file gambar.',
        });
      }

      await ProfileModel.updateFotoProfil(req.user.id, req.file.path);
      const profile = await ProfileModel.findByUserIdAndRole(req.user.id, req.user.role);

      return res.status(200).json({
        success: true,
        message: 'Foto profil berhasil diperbarui.',
        data: profile,
      });
    } catch (error) {
      console.error('[AuthController.uploadFotoProfil] Error:', error);
      return res.status(500).json({
        success: false,
        message: 'Gagal mengupload foto profil.',
      });
    }
  },

  changeMyPassword: async (req, res) => {
    try {
      const { current_password, new_password, confirm_password } = req.body;

      if (!current_password || !new_password || !confirm_password) {
        return res.status(400).json({
          success: false,
          message: 'Password lama, password baru, dan konfirmasi password wajib diisi.',
        });
      }

      if (String(new_password).length < 8) {
        return res.status(400).json({
          success: false,
          message: 'Password baru minimal 8 karakter.',
        });
      }

      if (new_password !== confirm_password) {
        return res.status(400).json({
          success: false,
          message: 'Konfirmasi password baru tidak cocok.',
        });
      }

      const user = await UserModel.findByIdWithPassword(req.user.id);
      if (!user) {
        return res.status(404).json({
          success: false,
          message: 'Akun tidak ditemukan.',
        });
      }

      const passwordCocok = await bcrypt.compare(current_password, user.password_hash);
      if (!passwordCocok) {
        return res.status(400).json({
          success: false,
          message: 'Password lama tidak sesuai.',
        });
      }

      const password_hash = await bcrypt.hash(new_password, 10);
      await UserModel.updatePassword(req.user.id, password_hash);

      return res.status(200).json({
        success: true,
        message: 'Password berhasil diperbarui.',
      });
    } catch (error) {
      console.error('[AuthController.changeMyPassword] Error:', error);
      return res.status(500).json({
        success: false,
        message: 'Gagal memperbarui password.',
      });
    }
  },
};

export default AuthController;
