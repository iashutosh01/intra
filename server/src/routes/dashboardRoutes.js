import { Router } from 'express';
import { analyticsController, dashboardController } from '../controllers/dashboardController.js';

const router = Router();

router.get('/', dashboardController);
router.get('/analytics', analyticsController);

export default router;
