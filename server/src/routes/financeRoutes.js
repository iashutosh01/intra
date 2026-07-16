import { Router } from 'express';
import { financeController } from '../controllers/financeController.js';

const router = Router();
router.get('/', financeController);
export default router;
