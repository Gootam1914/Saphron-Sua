import { Router } from 'express';
import { requireAuth } from '../middleware/auth.js';
import { requireRole } from '../middleware/rbac.js';
import { listSurveys, getSurvey, createSurvey, updateSurvey, respondSurvey, surveyAnalytics } from '../controllers/surveyController.js';

const router = Router();
router.use(...requireAuth);
router.get('/', listSurveys);
router.post('/', requireRole('teacher', 'admin'), createSurvey);
router.get('/:id', getSurvey);
router.patch('/:id', requireRole('teacher', 'admin'), updateSurvey);
router.post('/:id/respond', respondSurvey);
router.get('/:id/analytics', requireRole('teacher', 'admin'), surveyAnalytics);
export default router;
