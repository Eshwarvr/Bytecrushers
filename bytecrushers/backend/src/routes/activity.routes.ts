import { Router } from 'express';
import { getLogs } from '../controllers/activity.controller';
import { requireAuth } from '../middleware/auth.middleware';
const router = Router();
router.get('/', requireAuth, getLogs);
export default router;
