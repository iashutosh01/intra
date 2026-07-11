import { LOAN_STATUSES, PAYMENT_TYPES } from '../constants/index.js';
import { AppError } from '../utils/AppError.js';

const isValidDate = (value) => value && !Number.isNaN(new Date(value).getTime());
const positiveOrZero = (value) => Number(value) >= 0 && Number.isFinite(Number(value));

export const validateLoanPayload = (payload, partial = false) => {
  const required = ['borrowerName', 'principal', 'interestRate', 'loanDate', 'interestStartDate'];
  if (!partial) {
    const missing = required.filter((field) => payload[field] === undefined || payload[field] === '');
    if (missing.length) throw new AppError(`Missing required fields: ${missing.join(', ')}`, 400);
  }

  if (payload.borrowerName !== undefined && !String(payload.borrowerName).trim()) {
    throw new AppError('Borrower name is required', 400);
  }
  if (payload.principal !== undefined && !positiveOrZero(payload.principal)) {
    throw new AppError('Principal cannot be negative', 400);
  }
  if (payload.interestRate !== undefined && !positiveOrZero(payload.interestRate)) {
    throw new AppError('Interest rate cannot be negative', 400);
  }
  if (payload.loanDate !== undefined && !isValidDate(payload.loanDate)) {
    throw new AppError('Loan date is invalid', 400);
  }
  if (payload.interestStartDate !== undefined && !isValidDate(payload.interestStartDate)) {
    throw new AppError('Interest start date is invalid', 400);
  }
  if (payload.status !== undefined && !LOAN_STATUSES.includes(payload.status)) {
    throw new AppError('Invalid loan status', 400);
  }
};

export const validatePaymentPayload = (payload, partial = false) => {
  const required = ['loanId', 'paymentDate', 'amount', 'paymentType'];
  if (!partial) {
    const missing = required.filter((field) => payload[field] === undefined || payload[field] === '');
    if (missing.length) throw new AppError(`Missing required fields: ${missing.join(', ')}`, 400);
  }
  if (payload.paymentDate !== undefined && !isValidDate(payload.paymentDate)) {
    throw new AppError('Payment date is invalid', 400);
  }
  if (payload.amount !== undefined && (!Number.isFinite(Number(payload.amount)) || Number(payload.amount) <= 0)) {
    throw new AppError('Payment amount must be greater than zero', 400);
  }
  if (payload.paymentType !== undefined && !PAYMENT_TYPES.includes(payload.paymentType)) {
    throw new AppError('Invalid payment type', 400);
  }
};
