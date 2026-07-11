import { SHEETS } from '../constants/index.js';
import { listRows, upsertRow } from '../googleSheets/sheetsRepository.js';
import { AppError } from '../utils/AppError.js';
import { toNumber } from '../utils/format.js';

const SETTINGS_KEYS = {
  cashInHand: 'CASH_IN_HAND',
  moneyWithMummy: 'MONEY_WITH_MUMMY',
  moneyWithPapa: 'MONEY_WITH_PAPA'
};

export const getFinanceSettings = async () => {
  const rows = await listRows(SHEETS.settings);
  const byKey = Object.fromEntries(rows.map((row) => [row.key, row.value]));
  return {
    cashInHand: toNumber(byKey[SETTINGS_KEYS.cashInHand]),
    moneyWithMummy: toNumber(byKey[SETTINGS_KEYS.moneyWithMummy]),
    moneyWithPapa: toNumber(byKey[SETTINGS_KEYS.moneyWithPapa])
  };
};

export const updateFinanceSettings = async (payload) => {
  const updates = {
    cashInHand: toNumber(payload.cashInHand),
    moneyWithMummy: toNumber(payload.moneyWithMummy),
    moneyWithPapa: toNumber(payload.moneyWithPapa)
  };

  await Promise.all(
    Object.entries(updates).map(([field, value]) =>
      upsertRow(SHEETS.settings, 'key', SETTINGS_KEYS[field], { key: SETTINGS_KEYS[field], value })
    )
  );

  return updates;
};

export const verifyPin = async (pin) => {
  if (!pin) throw new AppError('PIN is required', 400);
  const rows = await listRows(SHEETS.settings);
  const configuredPin = rows.find((row) => row.key === 'PIN')?.value;
  if (!configuredPin) throw new AppError('PIN is not configured in Settings sheet', 503);
  if (String(pin) !== String(configuredPin)) throw new AppError('Invalid PIN', 401);
  return true;
};
