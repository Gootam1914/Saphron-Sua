import { Router } from 'express';
import { requireAuth } from '../middleware/auth.js';
import { requireRole } from '../middleware/rbac.js';
import { upload } from '../config/upload.js';
import { listDocuments, uploadDocument, downloadDocument, acknowledgeDocument } from '../controllers/documentController.js';

const router = Router();
router.use(...requireAuth);
router.get('/', listDocuments);
router.post('/', requireRole('teacher', 'admin'), upload.single('file'), uploadDocument);
router.get('/:id/download', downloadDocument);
router.post('/:id/acknowledge', acknowledgeDocument);
export default router;
