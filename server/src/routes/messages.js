import { Router } from 'express';
import { requireAuth } from '../middleware/auth.js';
import { requireRole } from '../middleware/rbac.js';
import {
  listConversations, getConversation, startConversation, postMessage,
  listModeration, moderateMessage, broadcast, listRecipients,
} from '../controllers/messageController.js';

const router = Router();
router.use(...requireAuth);
router.get('/recipients', listRecipients);
router.get('/moderation', requireRole('teacher', 'admin'), listModeration);
router.post('/moderation/:id', requireRole('teacher', 'admin'), moderateMessage);
router.post('/broadcast', requireRole('teacher', 'admin'), broadcast);
router.get('/conversations', listConversations);
router.post('/conversations', startConversation);
router.get('/conversations/:id', getConversation);
router.post('/conversations/:id/messages', postMessage);
export default router;
