import { v4 as uuid } from 'uuid';
import { SHEETS } from '../constants/index.js';
import { addRow, listRows } from '../googleSheets/sheetsRepository.js';
import { parseJson, toIsoDate, toNumber } from '../utils/format.js';

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
  const [rows, loans] = await Promise.all([listRows(SHEETS.history), listRows(SHEETS.loans)]);
  const loansById = new Map(loans.map((loan) => [loan.id, loan]));
  return rows
    .filter((row) => !loanId || row.loanId === loanId)
    .map((row) => {
      const oldValue = parseJson(row.oldValue, null);
      const newValue = parseJson(row.newValue, null);
      const relatedLoan = loansById.get(row.loanId) || newValue || oldValue || {};
      const amount = toNumber(newValue?.amount ?? oldValue?.amount ?? newValue?.principal ?? oldValue?.principal);
      return {
        ...row,
        borrowerName: relatedLoan.borrowerName || '',
        amount,
        date: newValue?.paymentDate || oldValue?.paymentDate || row.timestamp,
        remarks: row.notes || newValue?.notes || oldValue?.notes || newValue?.remarks || oldValue?.remarks || ''
      };
    })
    .sort((a, b) => new Date(b.timestamp) - new Date(a.timestamp));
};
