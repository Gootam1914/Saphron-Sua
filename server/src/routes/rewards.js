import { Router } from 'express';
import { requireAuth } from '../middleware/auth.js';
import { requireRole } from '../middleware/rbac.js';
import { listBadges, listRewards, grantReward, createBadge } from '../controllers/rewardController.js';

const router = Router();
router.use(...requireAuth);
router.get('/badges', listBadges);
router.post('/badges', requireRole('admin'), createBadge);
router.get('/', listRewards);
router.post('/', requireRole('teacher', 'admin'), grantReward);
export default router;
