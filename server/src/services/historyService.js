import { v4 as uuid } from 'uuid';
import { SHEETS } from '../constants/index.js';
import { addRow } from '../googleSheets/sheetsRepository.js';
import { toIsoDate } from '../utils/format.js';
import { getFinanceSnapshot } from './financeService.js';

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
  const finance = await getFinanceSnapshot();
  return finance.history.filter((row) => !loanId || row.loanId === loanId);
};
