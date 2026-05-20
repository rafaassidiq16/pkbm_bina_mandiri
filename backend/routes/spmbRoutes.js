// ============================================================
// routes/spmbRoutes.js
// Endpoint SPMB: ada yang publik (tanpa login) dan ada yang
// butuh autentikasi Admin / Super Admin.
// ============================================================

import { Router } from 'express';
import SpmbController from '../controllers/SpmbController.js';
import { verifyToken, checkRole, ROLES } from '../middlewares/authMiddleware.js';
import upload from '../config/multer.js';

const router = Router();

// ============================================================
// ENDPOINT PUBLIK — tidak membutuhkan token JWT
// Diakses oleh calon Warga Belajar dari halaman landing page
// ============================================================

// POST /api/spmb/daftar — Submit form pendaftaran (tanpa login)
router.post('/daftar', SpmbController.daftar);

// POST /api/spmb/:id/berkas — Upload berkas pendukung (tanpa login)
// Middleware: set folder upload ke 'spmb', lalu jalankan Multer single file
router.post(
  '/:id/berkas',
  (req, res, next) => { req.uploadFolder = 'spmb'; next(); },
  upload.single('file'),
  SpmbController.uploadBerkas
);

// ============================================================
// ENDPOINT TERPROTEKSI — membutuhkan token JWT + role tertentu
// ============================================================

// GET /api/spmb/statistik — Widget ringkasan SPMB (Admin, Pimpinan, Super Admin)
// PENTING: definisikan SEBELUM /:id agar tidak dianggap sebagai ID
router.get(
  '/statistik',
  verifyToken,
  checkRole(ROLES.ADMIN, ROLES.PIMPINAN, ROLES.SUPER_ADMIN),
  SpmbController.getStatistik
);

// GET /api/spmb — Daftar semua pendaftar untuk antrian verifikasi (Admin, Super Admin)
router.get(
  '/',
  verifyToken,
  checkRole(ROLES.ADMIN, ROLES.SUPER_ADMIN),
  SpmbController.getAll
);

// GET /api/spmb/:id — Detail satu pendaftar beserta berkasnya (Admin, Super Admin)
router.get(
  '/:id',
  verifyToken,
  checkRole(ROLES.ADMIN, ROLES.SUPER_ADMIN),
  SpmbController.getById
);

// PUT /api/spmb/berkas/:berkasId/verifikasi — Verifikasi satu berkas (Admin)
router.put(
  '/berkas/:berkasId/verifikasi',
  verifyToken,
  checkRole(ROLES.ADMIN, ROLES.SUPER_ADMIN),
  SpmbController.verifikasiBerkas
);

// PUT /api/spmb/:id/keputusan — Buat keputusan terima/tolak + pipeline otomatis (Admin)
router.put(
  '/:id/keputusan',
  verifyToken,
  checkRole(ROLES.ADMIN, ROLES.SUPER_ADMIN),
  SpmbController.buatKeputusan
);

export default router;
