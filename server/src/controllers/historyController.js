import { getHistory } from '../services/historyService.js';
import { asyncHandler } from '../utils/asyncHandler.js';

export const historyController = asyncHandler(async (req, res) => {
  res.json({ success: true, data: await getHistory(req.query) });
});
