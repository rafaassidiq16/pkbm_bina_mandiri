// ============================================================
// routes/tagihanRoutes.js
// Endpoint modul Keuangan: Tagihan SPP/Modul dan Pembayaran.
// ============================================================

import { Router } from 'express';
import TagihanController from '../controllers/TagihanController.js';
import { verifyToken, checkRole, ROLES } from '../middlewares/authMiddleware.js';
import upload from '../config/multer.js';

const router = Router();

// Semua route keuangan butuh login
router.use(verifyToken);

// GET /api/tagihan/tunggakan — Laporan WB dengan tunggakan
// PENTING: definisikan SEBELUM /:id
router.get(
  '/tunggakan',
  checkRole(ROLES.ADMIN, ROLES.PIMPINAN, ROLES.SUPER_ADMIN),
  TagihanController.getTunggakan
);

// GET /api/tagihan/ringkasan-bulanan — Grafik keuangan Pimpinan
router.get(
  '/ringkasan-bulanan',
  checkRole(ROLES.ADMIN, ROLES.PIMPINAN, ROLES.SUPER_ADMIN),
  TagihanController.getRingkasanBulanan
);

// GET /api/tagihan — Daftar semua tagihan (dengan filter)
router.get(
  '/',
  checkRole(ROLES.ADMIN, ROLES.WARGA_BELAJAR, ROLES.SUPER_ADMIN),
  TagihanController.getAll
);

// GET /api/tagihan/:id — Detail tagihan + riwayat pembayaran
router.get(
  '/:id',
  checkRole(ROLES.ADMIN, ROLES.WARGA_BELAJAR, ROLES.SUPER_ADMIN),
  TagihanController.getById
);

// POST /api/tagihan — Buat tagihan baru (satu WB)
router.post(
  '/',
  checkRole(ROLES.ADMIN, ROLES.SUPER_ADMIN),
  TagihanController.create
);

// POST /api/tagihan/massal — Generate tagihan untuk satu jenjang sekaligus
router.post(
  '/massal',
  checkRole(ROLES.ADMIN, ROLES.SUPER_ADMIN),
  TagihanController.createMassal
);

// POST /api/tagihan/:id/bayar — Catat pembayaran (dengan opsional upload bukti)
router.post(
  '/:id/bayar',
  checkRole(ROLES.ADMIN, ROLES.SUPER_ADMIN),
  (req, res, next) => { req.uploadFolder = 'bukti_bayar'; next(); },
  upload.single('bukti'),
  TagihanController.catatPembayaran
);

export default router;
