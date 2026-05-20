// ============================================================
// routes/userRoutes.js
// Endpoint manajemen akun user — hanya untuk Super Admin.
// ============================================================

import { Router } from 'express';
import UserController from '../controllers/UserController.js';
import { verifyToken, checkRole, ROLES } from '../middlewares/authMiddleware.js';

const router = Router();

// Semua route manajemen user hanya boleh diakses Super Admin
router.use(verifyToken, checkRole(ROLES.SUPER_ADMIN));

// GET  /api/users         — Ambil semua user
router.get('/',         UserController.getAll);

// POST /api/users         — Buat user baru (Tutor / Admin)
router.post('/',        UserController.create);

// PUT  /api/users/:id/status — Aktifkan / Nonaktifkan akun
router.put('/:id/status', UserController.updateStatus);

// PUT  /api/users/:id/password — Reset password user
router.put('/:id/password', UserController.resetPassword);

export default router;
