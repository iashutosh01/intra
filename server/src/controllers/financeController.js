import { getFinanceSnapshot } from '../services/financeService.js';
import { asyncHandler } from '../utils/asyncHandler.js';

export const financeController = asyncHandler(async (_req, res) => {
  res.json({ success: true, data: await getFinanceSnapshot() });
});
