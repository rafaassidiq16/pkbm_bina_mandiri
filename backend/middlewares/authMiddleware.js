// ============================================================
// middlewares/authMiddleware.js
// Middleware untuk memverifikasi token JWT dan memeriksa role.
// Dipasang di route yang membutuhkan autentikasi.
// ============================================================

import jwt from 'jsonwebtoken';

// -----------------------------------------------------------
// verifyToken
// Middleware yang memeriksa apakah request menyertakan
// token JWT yang valid di header Authorization.
// Format header: "Authorization: Bearer <token>"
// -----------------------------------------------------------
export const verifyToken = (req, res, next) => {
  // Ambil header Authorization dari request
  const authHeader = req.headers['authorization'];

  // Cek apakah header ada dan formatnya benar
  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    return res.status(401).json({
      success: false,
      message: 'Akses ditolak. Token tidak ditemukan.',
    });
  }

  // Ambil token dari header (hapus prefix "Bearer ")
  const token = authHeader.split(' ')[1];

  try {
    // Verifikasi dan decode token menggunakan secret key
    const decoded = jwt.verify(token, process.env.JWT_SECRET);

    // Simpan payload token ke req.user agar bisa diakses controller
    // Payload berisi: { id, role, iat, exp }
    req.user = decoded;

    // Lanjut ke middleware atau controller berikutnya
    next();

  } catch (error) {
    // Token tidak valid atau sudah kedaluwarsa
    return res.status(401).json({
      success: false,
      message: 'Token tidak valid atau sudah kedaluwarsa. Silakan login ulang.',
    });
  }
};

// -----------------------------------------------------------
// checkRole(...roles)
// Middleware factory yang memeriksa apakah role user
// termasuk dalam daftar role yang diizinkan.
//
// Contoh penggunaan:
//   router.get('/data', verifyToken, checkRole('admin', 'super_admin'), controller)
// -----------------------------------------------------------
export const checkRole = (...allowedRoles) => {
  return (req, res, next) => {
    // req.user harus sudah diisi oleh verifyToken sebelumnya
    if (!req.user) {
      return res.status(401).json({
        success: false,
        message: 'Autentikasi diperlukan.',
      });
    }

    // Cek apakah role user ada di daftar role yang diizinkan
    if (!allowedRoles.includes(req.user.role)) {
      return res.status(403).json({
        success: false,
        message: `Akses ditolak. Halaman ini hanya untuk: ${allowedRoles.join(', ')}.`,
      });
    }

    next();
  };
};

// Definisi role yang tersedia di sistem (untuk referensi)
export const ROLES = {
  SUPER_ADMIN:    'super_admin',
  ADMIN:          'admin',          // Admin TU & Keuangan
  TUTOR:          'tutor',
  WARGA_BELAJAR:  'warga_belajar',
  PIMPINAN:       'pimpinan',
};
