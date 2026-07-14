import { Router } from 'express';
import { requireAuth } from '../middleware/auth.js';
import { getMe, updateMe, getPublicConfig, getOrg } from '../controllers/authController.js';

const router = Router();
router.get('/config', getPublicConfig); // public
router.get('/me', ...requireAuth, getMe);
router.patch('/me', ...requireAuth, updateMe);
router.get('/org', ...requireAuth, getOrg);
export default router;
