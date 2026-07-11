import { Router } from 'express';
import authRoutes from './authRoutes.js';
import dashboardRoutes from './dashboardRoutes.js';
import historyRoutes from './historyRoutes.js';
import loanRoutes from './loanRoutes.js';
import paymentRoutes from './paymentRoutes.js';

const router = Router();

router.use('/auth', authRoutes);
router.use('/dashboard', dashboardRoutes);
router.use('/loans', loanRoutes);
router.use('/payments', paymentRoutes);
router.use('/history', historyRoutes);

export default router;
