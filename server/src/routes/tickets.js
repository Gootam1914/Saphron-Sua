import { Router } from 'express';
import { requireAuth } from '../middleware/auth.js';
import { requireRole } from '../middleware/rbac.js';
import { listTickets, getTicket, createTicket, updateTicket, commentTicket } from '../controllers/ticketController.js';

const router = Router();
router.use(...requireAuth);
router.get('/', listTickets);
router.post('/', createTicket);
router.get('/:id', getTicket);
router.patch('/:id', requireRole('admin'), updateTicket);
router.post('/:id/comment', commentTicket);
export default router;
