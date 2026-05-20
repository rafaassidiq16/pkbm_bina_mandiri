// ============================================================
// routes/materiRoutes.js
// Endpoint untuk modul KBM/LMS: Materi, Tugas, dan Jadwal.
// ============================================================

import { Router } from 'express';
import { MateriController, TugasController, JadwalController } from '../controllers/MateriController.js';
import { verifyToken, checkRole, ROLES } from '../middlewares/authMiddleware.js';
import upload from '../config/multer.js';

const router = Router();
router.use(verifyToken);

// ============================================================
// MATERI PEMBELAJARAN
// ============================================================

// GET /api/materi/rombel/:rombelId — Daftar materi satu rombel
router.get(
  '/materi/rombel/:rombelId',
  checkRole(ROLES.TUTOR, ROLES.WARGA_BELAJAR, ROLES.ADMIN, ROLES.SUPER_ADMIN),
  MateriController.getByRombel
);

// GET /api/materi/:id — Detail materi (otomatis catat progres WB)
router.get(
  '/materi/:id',
  checkRole(ROLES.TUTOR, ROLES.WARGA_BELAJAR, ROLES.ADMIN, ROLES.SUPER_ADMIN),
  MateriController.getById
);

// POST /api/materi — Tutor upload materi baru
router.post(
  '/materi',
  checkRole(ROLES.TUTOR, ROLES.SUPER_ADMIN),
  (req, res, next) => { req.uploadFolder = 'materi'; next(); },
  upload.single('file'),
  MateriController.create
);

// PUT /api/materi/:id/publish — Toggle publish/draft
router.put(
  '/materi/:id/publish',
  checkRole(ROLES.TUTOR, ROLES.SUPER_ADMIN),
  MateriController.togglePublish
);

// PUT /api/materi/:id/selesai — WB tandai materi selesai dibaca
router.put(
  '/materi/:id/selesai',
  checkRole(ROLES.WARGA_BELAJAR),
  MateriController.tandaiSelesai
);

// ============================================================
// TUGAS & PENGUMPULAN
// ============================================================

// GET /api/tugas/rombel/:rombelId — Daftar tugas satu rombel
router.get(
  '/tugas/rombel/:rombelId',
  checkRole(ROLES.TUTOR, ROLES.WARGA_BELAJAR, ROLES.ADMIN, ROLES.SUPER_ADMIN),
  TugasController.getByRombel
);

// GET /api/tugas/:id — Detail tugas + pengumpulan (untuk Tutor)
router.get(
  '/tugas/:id',
  checkRole(ROLES.TUTOR, ROLES.WARGA_BELAJAR, ROLES.SUPER_ADMIN),
  TugasController.getById
);

// POST /api/tugas — Tutor buat tugas baru
router.post(
  '/tugas',
  checkRole(ROLES.TUTOR, ROLES.SUPER_ADMIN),
  TugasController.create
);

// POST /api/tugas/:id/kumpulkan — WB upload pengumpulan tugas
router.post(
  '/tugas/:id/kumpulkan',
  checkRole(ROLES.WARGA_BELAJAR),
  (req, res, next) => { req.uploadFolder = 'tugas'; next(); },
  upload.single('file'),
  TugasController.kumpulkan
);

// PUT /api/tugas/pengumpulan/:pengumpulanId/nilai — Tutor menilai
router.put(
  '/tugas/pengumpulan/:pengumpulanId/nilai',
  checkRole(ROLES.TUTOR, ROLES.SUPER_ADMIN),
  TugasController.nilaiTugas
);

// ============================================================
// JADWAL KBM
// ============================================================

// GET /api/jadwal/rombel/:rombelId — Jadwal satu rombel
router.get(
  '/jadwal/rombel/:rombelId',
  checkRole(ROLES.TUTOR, ROLES.WARGA_BELAJAR, ROLES.ADMIN, ROLES.SUPER_ADMIN),
  JadwalController.getByRombel
);

// POST /api/jadwal — Tutor buat jadwal pertemuan
router.post(
  '/jadwal',
  checkRole(ROLES.TUTOR, ROLES.SUPER_ADMIN),
  JadwalController.create
);

export default router;
