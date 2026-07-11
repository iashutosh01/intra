import { calculateDashboard } from '../calculations/loanCalculations.js';
import { SHEETS } from '../constants/index.js';
import { listRows } from '../googleSheets/sheetsRepository.js';
import { getLoans } from './loanService.js';

export const getDashboard = async () => {
  const [loans, payments, history] = await Promise.all([
    listRows(SHEETS.loans),
    listRows(SHEETS.payments),
    listRows(SHEETS.history)
  ]);
  return calculateDashboard(loans, payments, history);
};

export const getAnalytics = async () => {
  const dashboard = await getDashboard();
  const loans = await getLoans();
  return {
    charts: dashboard.charts,
    portfolioHealth: {
      activeRatio: loans.length ? dashboard.activeLoans / loans.length : 0,
      collectionRatio: dashboard.totalPrincipalGiven ? dashboard.totalReceived / dashboard.totalPrincipalGiven : 0,
      interestExposure: dashboard.currentOutstandingAmount ? dashboard.currentOutstandingInterest / dashboard.currentOutstandingAmount : 0
    }
  };
};
