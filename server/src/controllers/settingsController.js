import { getFinanceSettings, updateFinanceSettings } from '../services/settingsService.js';
import { asyncHandler } from '../utils/asyncHandler.js';

export const getSettingsController = asyncHandler(async (_req, res) => {
  res.json({ success: true, data: await getFinanceSettings() });
});

export const updateSettingsController = asyncHandler(async (req, res) => {
  res.json({ success: true, data: await updateFinanceSettings(req.body) });
});
