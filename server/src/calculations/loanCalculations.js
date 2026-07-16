// Compatibility exports. Financial logic exists only in LoanCalculationEngine.
import { LoanCalculationEngine } from './LoanCalculationEngine.js';

export const startOfDay = LoanCalculationEngine.startOfDay;
export const calculateMonths = LoanCalculationEngine.calculateMonths;
export const calculateYears = LoanCalculationEngine.calculateYears;
export const calculateDuration = LoanCalculationEngine.calculateDuration;
export const calculateInterest = LoanCalculationEngine.calculateInterest;
export const calculatePaymentDistribution = LoanCalculationEngine.calculatePaymentDistribution;
export const calculateLoanSummary = (loan, payments, asOf) => LoanCalculationEngine.calculateLoanSummary(loan, payments, [], asOf);
export const calculateOutstanding = (loan, payments, asOf) => {
  const summary = LoanCalculationEngine.calculateLoanSummary(loan, payments, [], asOf);
  return { outstandingInterest: summary.outstandingInterest, remainingPrincipal: summary.remainingPrincipal, currentOutstanding: summary.currentOutstanding };
};
export const calculateDashboard = (loans, payments, history, settings, asOf) =>
  LoanCalculationEngine.calculatePortfolio(loans, payments, history, settings, asOf).dashboard;
