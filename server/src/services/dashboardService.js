import { getFinanceSnapshot } from './financeService.js';

export const getDashboard = async () => {
  const finance = await getFinanceSnapshot();
  return finance.dashboard;
};

export const getAnalytics = async () => {
  const finance = await getFinanceSnapshot();
  return finance.analytics;
};
