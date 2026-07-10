import { Router } from 'express';
import { requireAuth } from '../middleware/auth.js';
import { listNotifications, markRead, markAllRead, getSettings, updateSettings } from '../controllers/notificationController.js';

const router = Router();
router.use(...requireAuth);
router.get('/', listNotifications);
router.get('/settings', getSettings);
router.patch('/settings', updateSettings);
router.post('/read-all', markAllRead);
router.post('/:id/read', markRead);
export default router;
