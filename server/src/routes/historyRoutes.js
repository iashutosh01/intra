import { Router } from 'express';
import { deleteHistoryController, historyController } from '../controllers/historyController.js';

const router = Router();

router.get('/', historyController);
router.delete('/:id', deleteHistoryController);

export default router;
