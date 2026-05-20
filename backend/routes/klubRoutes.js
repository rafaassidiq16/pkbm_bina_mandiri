// ============================================================
// routes/klubRoutes.js
// Endpoint Klub Minat Bakat lintas jenjang
// ============================================================

import { Router } from 'express';
import KlubController from '../controllers/KlubController.js';
import { verifyToken, checkRole, ROLES } from '../middlewares/authMiddleware.js';

const router = Router();
router.use(verifyToken);

// ── Rute statis (harus SEBELUM /:id agar tidak tertimpa) ────

// GET  /api/klub/saya            — Klub yang diikuti WB
router.get('/saya',        checkRole(ROLES.WARGA_BELAJAR), KlubController.getKlubSaya);

// GET  /api/klub/admin/semua     — Semua klub termasuk nonaktif (Admin)
router.get('/admin/semua', checkRole(ROLES.ADMIN, ROLES.SUPER_ADMIN), KlubController.getAllAdmin);

// ── Rute katalog & detail ───────────────────────────────────

// GET  /api/klub                 — Katalog semua klub aktif
router.get('/',      checkRole(ROLES.WARGA_BELAJAR, ROLES.TUTOR, ROLES.ADMIN, ROLES.SUPER_ADMIN, ROLES.PIMPINAN), KlubController.getAll);

// GET  /api/klub/:id             — Detail klub + anggota
router.get('/:id',   checkRole(ROLES.WARGA_BELAJAR, ROLES.TUTOR, ROLES.ADMIN, ROLES.SUPER_ADMIN), KlubController.getById);

// ── Rute admin CRUD ─────────────────────────────────────────

// POST   /api/klub               — Buat klub baru (Admin)
router.post('/',              checkRole(ROLES.ADMIN, ROLES.SUPER_ADMIN), KlubController.create);

// PUT    /api/klub/:id           — Edit klub (Admin)
router.put('/:id',            checkRole(ROLES.ADMIN, ROLES.SUPER_ADMIN), KlubController.update);

// PATCH  /api/klub/:id/toggle    — Toggle aktif/nonaktif (Admin)
router.patch('/:id/toggle',   checkRole(ROLES.ADMIN, ROLES.SUPER_ADMIN), KlubController.toggleAktif);

// DELETE /api/klub/:id           — Hapus klub (Admin)
router.delete('/:id',         checkRole(ROLES.ADMIN, ROLES.SUPER_ADMIN), KlubController.hapus);

// ── Rute siswa ──────────────────────────────────────────────

// POST   /api/klub/:id/daftar    — WB daftar masuk klub
router.post('/:id/daftar',   checkRole(ROLES.WARGA_BELAJAR), KlubController.daftar);

// DELETE /api/klub/:id/keluar    — WB keluar dari klub
router.delete('/:id/keluar', checkRole(ROLES.WARGA_BELAJAR), KlubController.keluar);

export default router;
