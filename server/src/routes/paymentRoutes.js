import { Router } from 'express';
import { addPaymentController, deletePaymentController, updatePaymentController } from '../controllers/paymentController.js';

const router = Router();

router.post('/', addPaymentController);
router.patch('/:id', updatePaymentController);
router.delete('/:id', deletePaymentController);

export default router;
