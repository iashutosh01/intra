import { Router } from 'express';
import { historyController } from '../controllers/historyController.js';

const router = Router();

router.get('/', historyController);

export default router;
