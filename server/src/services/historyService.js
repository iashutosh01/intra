import { v4 as uuid } from 'uuid';
import { SHEETS } from '../constants/index.js';
import { addRow, listRows } from '../googleSheets/sheetsRepository.js';
import { toIsoDate } from '../utils/format.js';

export const createHistory = async ({ loanId = '', action, oldValue = null, newValue = null, notes = '' }) =>
  addRow(SHEETS.history, {
    id: uuid(),
    loanId,
    action,
    oldValue: oldValue ? JSON.stringify(oldValue) : '',
    newValue: newValue ? JSON.stringify(newValue) : '',
    timestamp: toIsoDate(),
    notes
  });

export const getHistory = async ({ loanId } = {}) => {
  const rows = await listRows(SHEETS.history);
  return rows
    .filter((row) => !loanId || row.loanId === loanId)
    .sort((a, b) => new Date(b.timestamp) - new Date(a.timestamp));
};
