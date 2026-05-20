// ============================================================
// routes/siswaRoutes.js
// Endpoint untuk manajemen data Warga Belajar.
// Semua route di sini membutuhkan autentikasi (verifyToken).
// ============================================================

import { Router } from 'express';
import SiswaController from '../controllers/SiswaController.js';
import { verifyToken, checkRole, ROLES } from '../middlewares/authMiddleware.js';

const router = Router();

// Semua route di bawah ini wajib login
router.use(verifyToken);

// GET /api/siswa — Ambil semua WB (Admin, Tutor, Super Admin)
router.get(
  '/',
  checkRole(ROLES.ADMIN, ROLES.TUTOR, ROLES.SUPER_ADMIN),
  SiswaController.getAll
);

// GET /api/siswa/statistik/per-jenjang — Rekap WB per jenjang (Dashboard Pimpinan)
// PENTING: Route spesifik ini harus didefinisikan SEBELUM route /:id
// agar Express tidak mengira 'statistik' adalah sebuah ID
router.get(
  '/statistik/per-jenjang',
  checkRole(ROLES.PIMPINAN, ROLES.ADMIN, ROLES.SUPER_ADMIN),
  SiswaController.getStatistikPerJenjang
);

// GET /api/siswa/profil/saya — WB melihat profilnya sendiri
router.get(
  '/profil/saya',
  checkRole(ROLES.WARGA_BELAJAR),
  SiswaController.getProfilSaya
);

// GET /api/siswa/rombel/options — opsi rombel aktif untuk admin SPMB
router.get(
  '/rombel/options',
  checkRole(ROLES.ADMIN, ROLES.SUPER_ADMIN, ROLES.TUTOR),
  SiswaController.getRombelOptions
);

router.get(
  '/mapel/options',
  checkRole(ROLES.ADMIN, ROLES.SUPER_ADMIN, ROLES.TUTOR),
  SiswaController.getMapelOptions
);

// GET /api/siswa/:id — Detail satu WB berdasarkan ID
router.get(
  '/:id',
  checkRole(ROLES.ADMIN, ROLES.TUTOR, ROLES.SUPER_ADMIN),
  SiswaController.getById
);

// PUT /api/siswa/:id — Update data WB (Admin & Super Admin)
router.put(
  '/:id',
  checkRole(ROLES.ADMIN, ROLES.SUPER_ADMIN),
  SiswaController.update
);

export default router;
