import { Router } from 'express';
import { requireAuth, requireRole } from '../middleware/auth.middleware';
import * as transferController from '../controllers/transfer.controller';

const router = Router();

router.use(requireAuth);

router.get('/', transferController.listTransferRequests);
router.post('/', transferController.createTransferRequest);

// Approve/Reject only by managers
router.post('/:id/process', requireRole(['Admin', 'AssetManager']), transferController.processTransferRequest);

export default router;
