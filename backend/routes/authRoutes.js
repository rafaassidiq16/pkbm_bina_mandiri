// ============================================================
// routes/authRoutes.js
// Endpoint autentikasi: Login dan cek data diri user aktif.
// ============================================================

import { Router } from 'express';
import AuthController from '../controllers/AuthController.js';
import { verifyToken } from '../middlewares/authMiddleware.js';
import upload from '../config/multer.js';

const router = Router();

// POST /api/auth/login — Login dengan email & password
router.post('/login', AuthController.login);

// GET /api/auth/me — Ambil data user yang sedang login (butuh token)
router.get('/me', verifyToken, AuthController.getMe);
router.put('/me', verifyToken, AuthController.updateMe);
router.put('/me/password', verifyToken, AuthController.changeMyPassword);
router.post(
  '/me/foto',
  verifyToken,
  (req, res, next) => { req.uploadFolder = 'profil'; next(); },
  upload.single('foto'),
  AuthController.uploadFotoProfil
);

export default router;
