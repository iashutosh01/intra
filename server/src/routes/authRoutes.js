import { Router } from 'express';
import { verifyPinController } from '../controllers/authController.js';

const router = Router();

router.post('/verify-pin', verifyPinController);

export default router;
