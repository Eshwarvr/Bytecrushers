import { Router } from 'express';
import { requireAuth, requireRole } from '../middleware/auth.middleware';
import * as allocationController from '../controllers/allocation.controller';

const router = Router();

router.use(requireAuth);

router.get('/', allocationController.listAllocations);

router.use(requireRole(['Admin', 'AssetManager']));
router.post('/', allocationController.createAllocation);
router.post('/:id/return', allocationController.returnAllocation);

export default router;
