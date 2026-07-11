import { SHEETS } from '../constants/index.js';
import { listRows } from '../googleSheets/sheetsRepository.js';
import { AppError } from '../utils/AppError.js';

export const verifyPin = async (pin) => {
  if (!pin) throw new AppError('PIN is required', 400);
  const rows = await listRows(SHEETS.settings);
  const configuredPin = rows.find((row) => row.key === 'PIN')?.value;
  if (!configuredPin) throw new AppError('PIN is not configured in Settings sheet', 503);
  if (String(pin) !== String(configuredPin)) throw new AppError('Invalid PIN', 401);
  return true;
};
