import { LoanCalculationEngine } from '../calculations/LoanCalculationEngine.js';
import { financeRepository } from '../repositories/FinanceRepository.js';
import { AppError } from '../utils/AppError.js';
import { toNumber } from '../utils/format.js';

const SETTINGS_KEYS = {
  cashInHand: 'CASH_IN_HAND',
  moneyWithMummy: 'MONEY_WITH_MUMMY',
  moneyWithPapa: 'MONEY_WITH_PAPA'
};

let memo = null;

const normalizeSettings = (rows) => {
  const byKey = Object.fromEntries(rows.map((row) => [row.key, row.value]));
  return Object.fromEntries(Object.entries(SETTINGS_KEYS).map(([field, key]) => [field, toNumber(byKey[key])]));
};

export const getFinanceSnapshot = async (asOf = new Date()) => {
  const raw = await financeRepository.readSnapshot();
  const day = LoanCalculationEngine.startOfDay(asOf).toISOString();
  if (memo && memo.day === day && memo.loans === raw.loans && memo.payments === raw.payments && memo.history === raw.history && memo.settingsRows === raw.settings) {
    return memo.value;
  }
  const value = {
    ...LoanCalculationEngine.calculatePortfolio(raw.loans, raw.payments, raw.history, normalizeSettings(raw.settings), asOf),
    generatedAt: new Date().toISOString()
  };
  memo = { day, loans: raw.loans, payments: raw.payments, history: raw.history, settingsRows: raw.settings, value };
  return value;
};

export const getLoanSummary = async (id, asOf = new Date()) => {
  const finance = await getFinanceSnapshot(asOf);
  const summary = finance.loans.find((loan) => loan.id === id);
  if (!summary) throw new AppError('Loan not found', 404);
  return summary;
};

export const queryLoanSummaries = async ({ search = '', status = '', sort = 'newest' } = {}) => {
  const { loans } = await getFinanceSnapshot();
  const query = String(search).toLowerCase();
  let result = query
    ? loans.filter((loan) => [loan.borrowerName, loan.phone, loan.remarks].some((value) => String(value).toLowerCase().includes(query)))
    : [...loans];
  if (status) result = result.filter((loan) => loan.status === status);
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
  return result.sort(sorters[sort] || sorters.newest);
};
