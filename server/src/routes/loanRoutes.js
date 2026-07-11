import { Router } from 'express';
import {
  createLoanController,
  deleteLoanController,
  exportLoansController,
  listLoansController,
  loanDetailsController,
  updateLoanController
} from '../controllers/loanController.js';

const router = Router();

router.get('/', listLoansController);
router.get('/export', exportLoansController);
router.post('/', createLoanController);
router.get('/:id', loanDetailsController);
router.patch('/:id', updateLoanController);
router.delete('/:id', deleteLoanController);

export default router;
