import { Router } from 'express';
import { getNotifications, markRead } from '../controllers/notification.controller';
import { requireAuth } from '../middleware/auth.middleware';
const router = Router();
router.get('/', requireAuth, getNotifications);
router.post('/:id/read', requireAuth, markRead);
export default router;
