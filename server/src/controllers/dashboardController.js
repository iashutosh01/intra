import { getAnalytics, getDashboard } from '../services/dashboardService.js';
import { asyncHandler } from '../utils/asyncHandler.js';

export const dashboardController = asyncHandler(async (_req, res) => {
  res.json({ success: true, data: await getDashboard() });
});

export const analyticsController = asyncHandler(async (_req, res) => {
  res.json({ success: true, data: await getAnalytics() });
});
