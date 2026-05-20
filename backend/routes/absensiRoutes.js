// ============================================================
// routes/absensiRoutes.js
// Endpoint modul Absensi Dual-Mode.
// ============================================================

import { Router } from 'express';
import AbsensiController from '../controllers/AbsensiController.js';
import { verifyToken, checkRole, ROLES } from '../middlewares/authMiddleware.js';

const router = Router();

// Semua route absensi butuh login
router.use(verifyToken);

// ---- ENDPOINT TUTOR ----

// POST /api/absensi/sesi — Buka sesi absensi baru
router.post(
  '/sesi',
  checkRole(ROLES.TUTOR, ROLES.SUPER_ADMIN),
  AbsensiController.bukaSesi
);

// GET /api/absensi/sesi-aktif — Cek sesi yang sedang berjalan milik Tutor login
router.get(
  '/sesi-aktif',
  checkRole(ROLES.TUTOR, ROLES.WARGA_BELAJAR),
  AbsensiController.getSesiAktif
);

// PUT /api/absensi/sesi/:sesiId/tutup — Tutup sesi secara manual
router.put(
  '/sesi/:sesiId/tutup',
  checkRole(ROLES.TUTOR, ROLES.SUPER_ADMIN),
  AbsensiController.tutupSesi
);

// GET /api/absensi/sesi/:sesiId — Detail sesi + rekaman kehadiran
router.get(
  '/sesi/:sesiId',
  checkRole(ROLES.TUTOR, ROLES.ADMIN, ROLES.SUPER_ADMIN),
  AbsensiController.getSesiById
);

// GET /api/absensi/sesi/:sesiId/daftar-wb — Daftar WB + status check-in real-time
// Endpoint ini di-polling oleh frontend Tutor setiap beberapa detik
router.get(
  '/sesi/:sesiId/daftar-wb',
  checkRole(ROLES.TUTOR, ROLES.SUPER_ADMIN),
  AbsensiController.getDaftarWbDiSesi
);

// POST /api/absensi/sesi/:sesiId/submit-manual — Submit absensi manual (isi semua WB)
router.post(
  '/sesi/:sesiId/submit-manual',
  checkRole(ROLES.TUTOR, ROLES.SUPER_ADMIN),
  AbsensiController.submitManual
);

// GET /api/absensi/rombel/:rombelId — Riwayat sesi di satu rombel
router.get(
  '/rombel/:rombelId',
  checkRole(ROLES.TUTOR, ROLES.ADMIN, ROLES.SUPER_ADMIN),
  AbsensiController.getSesiByRombel
);

// ---- ENDPOINT WARGA BELAJAR ----

// POST /api/absensi/sesi/:sesiId/checkin — WB check-in mandiri
router.post(
  '/sesi/:sesiId/checkin',
  checkRole(ROLES.WARGA_BELAJAR),
  AbsensiController.checkInMandiri
);

// GET /api/absensi/rekap/saya — WB lihat rekap kehadiran pribadi
router.get(
  '/rekap/saya',
  checkRole(ROLES.WARGA_BELAJAR),
  AbsensiController.getRekapSaya
);

export default router;
