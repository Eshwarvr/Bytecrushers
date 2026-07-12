import { Router } from 'express';
import { listRequests, createRequest, updateStatus } from '../controllers/maintenance.controller';
import { requireAuth } from '../middleware/auth.middleware';
const router = Router();
router.get('/', requireAuth, listRequests);
router.post('/', requireAuth, createRequest);
router.patch('/:id/status', requireAuth, updateStatus);
export default router;
