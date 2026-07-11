import { v4 as uuid } from 'uuid';
import { HISTORY_ACTIONS, SHEETS } from '../constants/index.js';
import { calculateLoanSummary } from '../calculations/loanCalculations.js';
import { addRow, deleteRow, deleteRowsBy, listRows, updateRow } from '../googleSheets/sheetsRepository.js';
import { AppError } from '../utils/AppError.js';
import { compactObject, toIsoDate, toNumber } from '../utils/format.js';
import { validateLoanPayload } from '../validators/loanValidator.js';
import { createHistory } from './historyService.js';

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
  const [loans, payments] = await Promise.all([getLoansRaw(), getPaymentsRaw()]);
  const query = String(search).toLowerCase();
  let summaries = loans.map((loan) => calculateLoanSummary(loan, payments));

  if (query) {
    summaries = summaries.filter((loan) =>
      [loan.borrowerName, loan.phone, loan.remarks].some((value) => String(value).toLowerCase().includes(query))
    );
  }
  if (status) summaries = summaries.filter((loan) => loan.status === status);

  const sorters = {
    name: (a, b) => a.borrowerName.localeCompare(b.borrowerName),
    amount: (a, b) => b.principal - a.principal,
    interest: (a, b) => b.outstandingInterest - a.outstandingInterest,
    outstanding: (a, b) => b.currentOutstanding - a.currentOutstanding,
    duration: (a, b) => b.totalMonths - a.totalMonths,
    oldest: (a, b) => new Date(a.loanDate) - new Date(b.loanDate),
    newest: (a, b) => new Date(b.loanDate) - new Date(a.loanDate),
    highest: (a, b) => b.currentOutstanding - a.currentOutstanding,
    lowest: (a, b) => a.currentOutstanding - b.currentOutstanding
  };
  return summaries.sort(sorters[sort] || sorters.newest);
};

export const getLoanDetails = async (id) => {
  const [loans, payments, history] = await Promise.all([getLoansRaw(), getPaymentsRaw(), listRows(SHEETS.history)]);
  const loan = loans.find((item) => item.id === id);
  if (!loan) throw new AppError('Loan not found', 404);
  const loanPayments = payments.filter((payment) => payment.loanId === id);
  return {
    ...calculateLoanSummary(loan, loanPayments),
    payments: loanPayments.sort((a, b) => new Date(b.paymentDate) - new Date(a.paymentDate)),
    activity: history.filter((item) => item.loanId === id).sort((a, b) => new Date(b.timestamp) - new Date(a.timestamp))
  };
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
  return calculateLoanSummary(loan, []);
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
