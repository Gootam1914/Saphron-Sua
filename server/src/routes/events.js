import { Router } from 'express';
import { requireAuth } from '../middleware/auth.js';
import { requireRole } from '../middleware/rbac.js';
import { listEvents, createEvent, updateEvent, deleteEvent, rsvp } from '../controllers/eventController.js';

const router = Router();
router.use(...requireAuth);
router.get('/', listEvents);
router.post('/', requireRole('teacher', 'admin'), createEvent);
router.patch('/:id', requireRole('teacher', 'admin'), updateEvent);
router.delete('/:id', requireRole('teacher', 'admin'), deleteEvent);
router.post('/:id/rsvp', rsvp);
export default router;
