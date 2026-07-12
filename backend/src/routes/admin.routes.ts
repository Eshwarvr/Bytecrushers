import { Router } from 'express';
import { requireAuth, requireRole } from '../middleware/auth.middleware';
import * as adminController from '../controllers/admin.controller';

const router = Router();

// All routes under /api/admin/* require authentication AND the Admin role
router.use(requireAuth);
router.use(requireRole(['Admin']));

// Employee Directory & Promotion
router.get('/employees', adminController.listEmployees);
router.post('/employees', adminController.createEmployee);
router.put('/employees/:id', adminController.updateEmployee);

// Department Management
router.get('/departments', adminController.listDepartments);
router.post('/departments', adminController.createDepartment);
router.put('/departments/:id', adminController.updateDepartment);

// Asset Category Management
router.get('/categories', adminController.listCategories);
router.post('/categories', adminController.createCategory);
router.put('/categories/:id', adminController.updateCategory);
router.delete('/categories/:id', adminController.deleteCategory);

export default router;
