import { Router } from 'express';
import AkademikController from '../controllers/AkademikController.js';
import { verifyToken, checkRole, ROLES } from '../middlewares/authMiddleware.js';
import upload from '../config/multer.js';

const router = Router();

router.use(verifyToken);

router.get('/mapel', checkRole(ROLES.ADMIN, ROLES.SUPER_ADMIN), AkademikController.getAllMapel);
router.get('/mapel/:id', checkRole(ROLES.ADMIN, ROLES.SUPER_ADMIN), AkademikController.getMapelById);
router.post('/mapel', checkRole(ROLES.SUPER_ADMIN), AkademikController.createMapel);
router.put('/mapel/:id', checkRole(ROLES.SUPER_ADMIN), AkademikController.updateMapel);
router.patch('/mapel/:id/status', checkRole(ROLES.SUPER_ADMIN), AkademikController.updateMapelStatus);

router.get('/rombel-mapel', checkRole(ROLES.ADMIN, ROLES.SUPER_ADMIN), AkademikController.getRombelMapel);
router.post('/rombel-mapel', checkRole(ROLES.SUPER_ADMIN), AkademikController.createRombelMapel);
router.put('/rombel-mapel/:id', checkRole(ROLES.SUPER_ADMIN), AkademikController.updateRombelMapel);
router.patch('/rombel-mapel/:id/visibility', checkRole(ROLES.SUPER_ADMIN), AkademikController.updateRombelMapelVisibility);
router.delete('/rombel-mapel/:id', checkRole(ROLES.SUPER_ADMIN), AkademikController.deleteRombelMapel);

router.get('/options/rombel', checkRole(ROLES.ADMIN, ROLES.SUPER_ADMIN), AkademikController.getRombelOptions);
router.get('/options/tutor', checkRole(ROLES.ADMIN, ROLES.SUPER_ADMIN), AkademikController.getTutorOptions);

// ── RPS (Rencana Pembelajaran Semester) ──────────────────
router.get('/rps', AkademikController.getRps);
router.post(
  '/rps',
  checkRole(ROLES.TUTOR, ROLES.ADMIN, ROLES.SUPER_ADMIN),
  (req, res, next) => { req.uploadFolder = 'rps'; next(); },
  upload.single('rps'),
  AkademikController.uploadRps
);

export default router;
