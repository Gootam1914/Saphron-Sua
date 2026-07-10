import { Router } from 'express';
import { requireAuth } from '../middleware/auth.js';
import { requireRole } from '../middleware/rbac.js';
import { listUsers, createUser, updateUser, deactivateUser, listClassrooms, getAnalytics } from '../controllers/adminController.js';

const router = Router();
router.use(...requireAuth, requireRole('admin'));
router.get('/users', listUsers);
router.post('/users', createUser);
router.patch('/users/:id', updateUser);
router.delete('/users/:id', deactivateUser);
router.get('/classrooms', listClassrooms);
router.get('/analytics', getAnalytics);
export default router;
