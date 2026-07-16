import { v4 as uuid } from 'uuid';
import { HISTORY_ACTIONS, SHEETS } from '../constants/index.js';
import { addRow, deleteRow, deleteRowsBy, listRows, updateRow } from '../googleSheets/sheetsRepository.js';
import { AppError } from '../utils/AppError.js';
import { compactObject, toIsoDate, toNumber } from '../utils/format.js';
import { validateLoanPayload } from '../validators/loanValidator.js';
import { createHistory } from './historyService.js';
import { getLoanSummary, queryLoanSummaries } from './financeService.js';

const normalizeLoan = (payload) => ({
  borrowerName: String(payload.borrowerName || '').trim(),
  phone: payload.phone || '',
  address: payload.address || '',
  principal: toNumber(payload.principal),
  interestRate: toNumber(payload.interestRate),
  loanDate: payload.loanDate,
  interestStartDate: payload.interestStartDate || payload.loanDate,
  lastInterestPaidDate: payload.lastInterestPaidDate || '',
  principalPaid: 0,
  interestPaid: 0,
  status: payload.status || 'active',
  remarks: payload.remarks || ''
});

export const getLoansRaw = async () => listRows(SHEETS.loans);
export const getPaymentsRaw = async () => listRows(SHEETS.payments);

export const getLoans = async ({ search = '', status = '', sort = 'newest' } = {}) => {
  return queryLoanSummaries({ search, status, sort });
};

export const getLoanDetails = async (id) => {
  return getLoanSummary(id);
};

export const createLoan = async (payload) => {
  validateLoanPayload(payload);
  const now = toIsoDate();
  const loan = await addRow(SHEETS.loans, {
    id: uuid(),
    ...normalizeLoan(payload),
    createdAt: now,
    updatedAt: now
  });
  await createHistory({ loanId: loan.id, action: HISTORY_ACTIONS.loanCreated, newValue: loan, notes: loan.remarks });
  return getLoanSummary(loan.id);
};

export const updateLoan = async (id, payload) => {
  validateLoanPayload(payload, true);
  const loans = await getLoansRaw();
  const existing = loans.find((loan) => loan.id === id);
  if (!existing) throw new AppError('Loan not found', 404);

  const updates = compactObject({
    borrowerName: payload.borrowerName?.trim(),
    phone: payload.phone,
    address: payload.address,
    principal: payload.principal !== undefined ? toNumber(payload.principal) : undefined,
    interestRate: payload.interestRate !== undefined ? toNumber(payload.interestRate) : undefined,
    loanDate: payload.loanDate,
    interestStartDate: payload.interestStartDate,
    status: payload.status,
    remarks: payload.remarks,
    updatedAt: toIsoDate()
  });

  const updated = await updateRow(SHEETS.loans, 'id', id, updates);
  await createHistory({ loanId: id, action: updates.status === 'closed' ? HISTORY_ACTIONS.loanClosed : HISTORY_ACTIONS.loanEdited, oldValue: existing, newValue: updated });
  return getLoanDetails(id);
};

export const deleteLoan = async (id) => {
  const deleted = await deleteRow(SHEETS.loans, 'id', id);
  if (!deleted) throw new AppError('Loan not found', 404);
  await deleteRowsBy(SHEETS.payments, 'loanId', id);
  await createHistory({ loanId: id, action: HISTORY_ACTIONS.loanDeleted, oldValue: deleted });
  return deleted;
};
