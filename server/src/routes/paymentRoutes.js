import { Router } from 'express';
import { addPaymentController, deletePaymentController, previewPaymentController, updatePaymentController } from '../controllers/paymentController.js';

const router = Router();

router.get('/preview', previewPaymentController);
router.post('/', addPaymentController);
router.patch('/:id', updatePaymentController);
router.delete('/:id', deletePaymentController);

export default router;
