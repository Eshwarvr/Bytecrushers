import { Router } from 'express';
import { getDashboardKPIs } from '../controllers/dashboard.controller';
import { requireAuth } from '../middleware/auth.middleware';
const router = Router();
router.get('/', requireAuth, getDashboardKPIs);
export default router;
