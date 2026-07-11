import { v4 as uuid } from 'uuid';
import { HISTORY_ACTIONS, SHEETS } from '../constants/index.js';
import { calculateLoanSummary, calculatePaymentDistribution } from '../calculations/loanCalculations.js';
import { addRow, deleteRow, listRows, updateRow } from '../googleSheets/sheetsRepository.js';
import { AppError } from '../utils/AppError.js';
import { compactObject, toIsoDate, toNumber } from '../utils/format.js';
import { validatePaymentPayload } from '../validators/loanValidator.js';
import { createHistory } from './historyService.js';
import { getLoanDetails, getLoansRaw } from './loanService.js';

const historyActionForPayment = (type) =>
  type === 'interest' ? HISTORY_ACTIONS.interestPaid : type === 'principal' ? HISTORY_ACTIONS.principalPaid : HISTORY_ACTIONS.mixedPayment;

export const addPayment = async (payload) => {
  validatePaymentPayload(payload);
  const loans = await getLoansRaw();
  const loan = loans.find((item) => item.id === payload.loanId);
  if (!loan) throw new AppError('Loan not found', 404);

  const payment = await addRow(SHEETS.payments, {
    id: uuid(),
    loanId: payload.loanId,
    paymentDate: payload.paymentDate,
    amount: toNumber(payload.amount),
    paymentType: payload.paymentType,
    notes: payload.notes || '',
    createdAt: toIsoDate()
  });
  await createHistory({ loanId: payload.loanId, action: historyActionForPayment(payload.paymentType), newValue: payment, notes: payload.notes });
  return getLoanDetails(payload.loanId);
};

export const previewPayment = async (payload) => {
  validatePaymentPayload(payload, true);
  const [loans, payments] = await Promise.all([getLoansRaw(), listRows(SHEETS.payments)]);
  const loan = loans.find((item) => item.id === payload.loanId);
  if (!loan) throw new AppError('Loan not found', 404);
  const summary = calculateLoanSummary(
    loan,
    payments.filter((payment) => payment.loanId === payload.loanId),
    payload.paymentDate ? new Date(payload.paymentDate) : new Date()
  );
  const distribution = calculatePaymentDistribution(
    { ...payload, amount: toNumber(payload.amount), paymentType: payload.paymentType || 'mixed' },
    summary.outstandingInterest,
    summary.remainingPrincipal
  );

  return {
    outstandingInterest: summary.outstandingInterest,
    outstandingPrincipal: summary.remainingPrincipal,
    currentOutstanding: summary.currentOutstanding,
    ...distribution,
    interestRemaining: Math.max(0, summary.outstandingInterest - distribution.interestApplied),
    principalRemaining: Math.max(0, summary.remainingPrincipal - distribution.principalApplied)
  };
};

export const updatePayment = async (id, payload) => {
  validatePaymentPayload(payload, true);
  const payments = await listRows(SHEETS.payments);
  const existing = payments.find((payment) => payment.id === id);
  if (!existing) throw new AppError('Payment not found', 404);

  const updates = compactObject({
    paymentDate: payload.paymentDate,
    amount: payload.amount !== undefined ? toNumber(payload.amount) : undefined,
    paymentType: payload.paymentType,
    notes: payload.notes
  });
  const updated = await updateRow(SHEETS.payments, 'id', id, updates);
  await createHistory({ loanId: existing.loanId, action: HISTORY_ACTIONS.paymentUpdated, oldValue: existing, newValue: updated });
  return getLoanDetails(existing.loanId);
};

export const deletePayment = async (id) => {
  const deleted = await deleteRow(SHEETS.payments, 'id', id);
  if (!deleted) throw new AppError('Payment not found', 404);
  await createHistory({ loanId: deleted.loanId, action: HISTORY_ACTIONS.paymentDeleted, oldValue: deleted });
  return getLoanDetails(deleted.loanId);
};
