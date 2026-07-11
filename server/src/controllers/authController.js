import { asyncHandler } from '../utils/asyncHandler.js';
import { verifyPin } from '../services/settingsService.js';

export const verifyPinController = asyncHandler(async (req, res) => {
  await verifyPin(req.body.pin);
  res.json({ success: true, message: 'PIN verified' });
});
