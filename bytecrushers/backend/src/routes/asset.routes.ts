import { Router } from 'express';
import { requireAuth, requireRole } from '../middleware/auth.middleware';
import * as assetController from '../controllers/asset.controller';

const router = Router();

router.use(requireAuth);

// Accessible by all authenticated users
router.get('/', assetController.listAssets);
router.get('/:id', assetController.getAssetById);

// Protected routes (AssetManager, Admin)
router.use(requireRole(['Admin', 'AssetManager']));
router.post('/', assetController.createAsset);
router.put('/:id', assetController.updateAsset);
router.delete('/:id', assetController.deleteAsset);

export default router;
