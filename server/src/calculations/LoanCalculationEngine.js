import { PAYMENT_TYPES } from '../constants/index.js';
import { LoanSummary } from '../domain/models/LoanSummary.js';
import { parseJson, roundMoney, toNumber } from '../utils/format.js';

const MS_PER_DAY = 24 * 60 * 60 * 1000;

const startOfDay = (value) => {
  const date = value ? new Date(value) : new Date();
  return new Date(date.getFullYear(), date.getMonth(), date.getDate());
};

const monthKey = (date) => new Date(date).toISOString().slice(0, 7);

const calculateMonths = (from, to = new Date()) => {
  const start = startOfDay(from);
  const end = startOfDay(to);
  if (end <= start) return 0;
  let months = (end.getFullYear() - start.getFullYear()) * 12 + end.getMonth() - start.getMonth();
  if (end.getDate() < start.getDate()) months -= 1;
  return Math.max(months, 0);
};

const calculateDuration = (from, to = new Date()) => {
  const start = startOfDay(from);
  const end = startOfDay(to);
  if (end <= start) return '0 Days';
  const totalMonths = calculateMonths(start, end);
  const years = Math.floor(totalMonths / 12);
  const months = totalMonths % 12;
  const cursor = new Date(start);
  cursor.setMonth(cursor.getMonth() + totalMonths);
  const days = Math.max(0, Math.floor((end - cursor) / MS_PER_DAY));
  const parts = [];
  if (years) parts.push(`${years} ${years === 1 ? 'Year' : 'Years'}`);
  if (months) parts.push(`${months} ${months === 1 ? 'Month' : 'Months'}`);
  if (!years && !months && days) parts.push(`${days} ${days === 1 ? 'Day' : 'Days'}`);
  return parts.join(' ') || '0 Days';
};

const calculateInterest = (principal, monthlyRate, from, to = new Date()) =>
  roundMoney((toNumber(principal) * toNumber(monthlyRate) * calculateMonths(from, to)) / 100);

const normalizePayment = (payment) => ({
  ...payment,
  amount: toNumber(payment.amount),
  paymentDate: payment.paymentDate || payment.createdAt
});

const paymentDistribution = (payment, outstandingInterest, remainingPrincipal) => {
  const amount = roundMoney(payment.amount);
  if (!PAYMENT_TYPES.includes(payment.paymentType)) throw new Error(`Invalid payment type: ${payment.paymentType}`);
  if (payment.paymentType === 'interest') {
    const interestApplied = Math.min(amount, outstandingInterest);
    return { interestApplied: roundMoney(interestApplied), principalApplied: 0, overpayment: roundMoney(amount - interestApplied) };
  }
  if (payment.paymentType === 'principal') {
    const principalApplied = Math.min(amount, remainingPrincipal);
    return { interestApplied: 0, principalApplied: roundMoney(principalApplied), overpayment: roundMoney(amount - principalApplied) };
  }
  const interestApplied = Math.min(amount, outstandingInterest);
  const principalApplied = Math.min(roundMoney(amount - interestApplied), remainingPrincipal);
  return {
    interestApplied: roundMoney(interestApplied),
    principalApplied: roundMoney(principalApplied),
    overpayment: roundMoney(amount - interestApplied - principalApplied)
  };
};

const applyPayment = (state, payment) => {
  const normalized = normalizePayment(payment);
  const accrued = calculateInterest(state.remainingPrincipal, state.interestRate, state.interestCursorDate, normalized.paymentDate);
  const interestBefore = roundMoney(state.outstandingInterest + accrued);
  const distribution = paymentDistribution(normalized, interestBefore, state.remainingPrincipal);
  const outstandingInterest = roundMoney(interestBefore - distribution.interestApplied);
  const remainingPrincipal = roundMoney(state.remainingPrincipal - distribution.principalApplied);
  return {
    ...state,
    remainingPrincipal,
    outstandingInterest,
    principalPaid: roundMoney(state.principalPaid + distribution.principalApplied),
    interestPaid: roundMoney(state.interestPaid + distribution.interestApplied),
    lastInterestPaidDate: outstandingInterest <= 0 && distribution.interestApplied > 0 ? normalized.paymentDate : state.lastInterestPaidDate,
    interestCursorDate: normalized.paymentDate,
    paymentApplications: [...state.paymentApplications, {
      paymentId: normalized.id,
      paymentDate: normalized.paymentDate,
      paymentType: normalized.paymentType,
      amount: normalized.amount,
      ...distribution,
      outstandingInterestAfter: outstandingInterest,
      remainingPrincipalAfter: remainingPrincipal
    }]
  };
};

const historyAmount = (row) => {
  const oldValue = parseJson(row.oldValue, null);
  const newValue = parseJson(row.newValue, null);
  return {
    oldValue,
    newValue,
    amount: toNumber(newValue?.amount ?? oldValue?.amount ?? newValue?.principal ?? oldValue?.principal),
    date: newValue?.paymentDate || oldValue?.paymentDate || row.timestamp,
    remarks: row.notes || newValue?.notes || oldValue?.notes || newValue?.remarks || oldValue?.remarks || ''
  };
};

const createSummary = (loan, allPayments, allHistory, asOf) => {
  const principal = toNumber(loan.principal);
  const interestStartDate = loan.interestStartDate || loan.loanDate;
  const payments = allPayments
    .filter((payment) => payment.loanId === loan.id)
    .map(normalizePayment)
    .sort((a, b) => new Date(a.paymentDate) - new Date(b.paymentDate) || String(a.id).localeCompare(String(b.id)));
  let state = {
    remainingPrincipal: principal,
    interestRate: toNumber(loan.interestRate),
    interestCursorDate: loan.lastInterestPaidDate || interestStartDate,
    lastInterestPaidDate: loan.lastInterestPaidDate || '',
    outstandingInterest: 0,
    principalPaid: 0,
    interestPaid: 0,
    paymentApplications: []
  };
  for (const payment of payments) state = applyPayment(state, payment);
  const interestTillToday = calculateInterest(state.remainingPrincipal, state.interestRate, state.interestCursorDate, asOf);
  const outstandingInterest = roundMoney(state.outstandingInterest + interestTillToday);
  const currentOutstanding = roundMoney(state.remainingPrincipal + outstandingInterest);
  const status = loan.status === 'closed' || currentOutstanding <= 0 ? 'closed' : 'active';
  const lastPaymentDate = payments.at(-1)?.paymentDate || '';
  const daysSinceLastPayment = lastPaymentDate ? Math.max(0, Math.floor((startOfDay(asOf) - startOfDay(lastPaymentDate)) / MS_PER_DAY)) : null;
  const displayStatus = status === 'closed' ? 'closed' : outstandingInterest > 0 && Number(daysSinceLastPayment || 0) > 45 ? 'overdue' : outstandingInterest > 0 ? 'interestDue' : 'active';
  const nextInterestDue = new Date(state.interestCursorDate || interestStartDate);
  nextInterestDue.setMonth(nextInterestDue.getMonth() + 1);
  const historyTimeline = allHistory
    .filter((item) => item.loanId === loan.id)
    .map((item) => ({ ...item, ...historyAmount(item), borrowerName: loan.borrowerName, currentOutstanding }))
    .sort((a, b) => new Date(b.timestamp) - new Date(a.timestamp));
  const paymentTimeline = [...payments].reverse();
  return LoanSummary.create({
    ...loan,
    principal,
    interestRate: toNumber(loan.interestRate),
    principalPaid: roundMoney(state.principalPaid),
    interestPaid: roundMoney(state.interestPaid),
    lastInterestPaidDate: state.lastInterestPaidDate,
    lastPaymentDate,
    nextInterestDue: nextInterestDue.toISOString(),
    nextInterestDueDate: nextInterestDue.toISOString(),
    paymentCount: payments.length,
    numberOfPayments: payments.length,
    remainingPrincipal: roundMoney(state.remainingPrincipal),
    outstandingPrincipal: roundMoney(state.remainingPrincipal),
    interestTillToday: roundMoney(interestTillToday),
    outstandingInterest,
    totalInterestGenerated: roundMoney(state.interestPaid + outstandingInterest),
    currentOutstanding,
    totalReceived: roundMoney(state.principalPaid + state.interestPaid),
    status,
    displayStatus,
    loanDuration: calculateDuration(loan.loanDate, asOf),
    interestDuration: calculateDuration(state.interestCursorDate, asOf),
    totalMonths: calculateMonths(loan.loanDate, asOf),
    totalYears: Math.floor(calculateMonths(loan.loanDate, asOf) / 12),
    daysSinceLastPayment,
    paymentApplications: state.paymentApplications,
    paymentTimeline,
    historyTimeline,
    payments: paymentTimeline,
    activity: historyTimeline
  });
};

const addBucket = (buckets, key, field, amount) => {
  if (!buckets[key]) buckets[key] = { month: key, lending: 0, collections: 0, interest: 0 };
  buckets[key][field] = roundMoney(buckets[key][field] + amount);
};

const createDashboard = (summaries, payments, history, settings, asOf) => {
  const totals = summaries.reduce((acc, loan) => ({
    totalPrincipalGiven: roundMoney(acc.totalPrincipalGiven + loan.principal),
    totalPrincipalRemaining: roundMoney(acc.totalPrincipalRemaining + loan.remainingPrincipal),
    totalInterestEarned: roundMoney(acc.totalInterestEarned + loan.interestPaid),
    currentOutstandingInterest: roundMoney(acc.currentOutstandingInterest + loan.outstandingInterest),
    currentOutstandingAmount: roundMoney(acc.currentOutstandingAmount + loan.currentOutstanding),
    totalReceived: roundMoney(acc.totalReceived + loan.totalReceived),
    activeLoans: acc.activeLoans + (loan.status === 'active' ? 1 : 0),
    closedLoans: acc.closedLoans + (loan.status === 'closed' ? 1 : 0)
  }), { totalPrincipalGiven: 0, totalPrincipalRemaining: 0, totalInterestEarned: 0, currentOutstandingInterest: 0, currentOutstandingAmount: 0, totalReceived: 0, activeLoans: 0, closedLoans: 0 });
  const buckets = {};
  for (const loan of summaries) addBucket(buckets, monthKey(loan.loanDate || loan.createdAt), 'lending', loan.principal);
  for (const payment of payments) addBucket(buckets, monthKey(payment.paymentDate || payment.createdAt), 'collections', toNumber(payment.amount));
  for (const loan of summaries) addBucket(buckets, monthKey(asOf), 'interest', loan.interestTillToday);
  const todayKey = startOfDay(asOf).toISOString().slice(0, 10);
  const currentMonth = monthKey(asOf);
  const sumPayments = (predicate) => payments.filter(predicate).reduce((sum, item) => roundMoney(sum + toNumber(item.amount)), 0);
  const familyHoldings = {
    cashInHand: roundMoney(settings.cashInHand),
    moneyWithMummy: roundMoney(settings.moneyWithMummy),
    moneyWithPapa: roundMoney(settings.moneyWithPapa)
  };
  familyHoldings.totalLiquid = roundMoney(familyHoldings.cashInHand + familyHoldings.moneyWithMummy + familyHoldings.moneyWithPapa);
  const outstandingOrder = [...summaries].sort((a, b) => b.currentOutstanding - a.currentOutstanding);
  const interestOrder = [...summaries].sort((a, b) => b.totalInterestGenerated - a.totalInterestGenerated);
  const activityOrder = [...summaries].sort((a, b) => b.paymentCount - a.paymentCount);
  return {
    ...totals,
    todayCollection: sumPayments((item) => startOfDay(item.paymentDate || item.createdAt).toISOString().slice(0, 10) === todayKey),
    monthCollection: sumPayments((item) => monthKey(item.paymentDate || item.createdAt) === currentMonth),
    familyHoldings,
    netWorth: roundMoney(familyHoldings.totalLiquid + totals.currentOutstandingAmount),
    highestOutstandingLoan: outstandingOrder[0] || null,
    highestInterestGenerated: interestOrder[0] || null,
    mostActiveBorrower: activityOrder[0] || null,
    recentlyAddedLoan: [...summaries].sort((a, b) => new Date(b.createdAt || b.loanDate) - new Date(a.createdAt || a.loanDate))[0] || null,
    recentPayments: [...payments].sort((a, b) => new Date(b.paymentDate || b.createdAt) - new Date(a.paymentDate || a.createdAt)).slice(0, 6),
    totalBorrowers: new Set(summaries.map((loan) => String(loan.borrowerName).toLowerCase())).size,
    recentActivity: history.slice(0, 8),
    upcomingInterestDue: summaries.filter((loan) => loan.status === 'active').sort((a, b) => b.outstandingInterest - a.outstandingInterest).slice(0, 6),
    charts: {
      monthly: Object.values(buckets).sort((a, b) => a.month.localeCompare(b.month)),
      outstandingDistribution: summaries.map((loan) => ({ loanId: loan.id, name: loan.borrowerName, principal: loan.remainingPrincipal, interest: loan.outstandingInterest })),
      topBorrowers: outstandingOrder.slice(0, 5).map((loan) => ({ loanId: loan.id, name: loan.borrowerName, outstanding: loan.currentOutstanding }))
    }
  };
};

export class LoanCalculationEngine {
  static startOfDay = startOfDay;
  static calculateMonths = calculateMonths;
  static calculateYears = (from, to) => Math.floor(calculateMonths(from, to) / 12);
  static calculateDuration = calculateDuration;
  static calculateInterest = calculateInterest;
  static calculatePaymentDistribution = paymentDistribution;

  static calculateLoanSummary(loan, payments = [], history = [], asOf = new Date()) {
    return createSummary(loan, payments, history, asOf);
  }

  static calculateLoanSummaries(loans = [], payments = [], history = [], asOf = new Date()) {
    return loans.map((loan) => createSummary(loan, payments, history, asOf));
  }

  static calculatePaymentPreview(summary, payment) {
    const distribution = paymentDistribution({ ...payment, amount: toNumber(payment.amount), paymentType: payment.paymentType || 'mixed' }, summary.outstandingInterest, summary.remainingPrincipal);
    return {
      outstandingInterest: summary.outstandingInterest,
      outstandingPrincipal: summary.remainingPrincipal,
      currentOutstanding: summary.currentOutstanding,
      ...distribution,
      interestRemaining: roundMoney(Math.max(0, summary.outstandingInterest - distribution.interestApplied)),
      principalRemaining: roundMoney(Math.max(0, summary.remainingPrincipal - distribution.principalApplied))
    };
  }

  static calculatePortfolio(loans = [], payments = [], rawHistory = [], settings = {}, asOf = new Date()) {
    const summaries = this.calculateLoanSummaries(loans, payments, rawHistory, asOf);
    const byId = new Map(summaries.map((loan) => [loan.id, loan]));
    const history = rawHistory.map((row) => {
      const values = historyAmount(row);
      const summary = byId.get(row.loanId);
      const source = summary || values.newValue || values.oldValue || {};
      return { ...row, ...values, borrowerName: source.borrowerName || '', currentOutstanding: summary?.currentOutstanding ?? 0, loanSummaryId: summary?.id || row.loanId };
    }).sort((a, b) => new Date(b.timestamp) - new Date(a.timestamp));
    const normalizedPayments = payments.map(normalizePayment).map((payment) => ({
      ...payment,
      borrowerName: byId.get(payment.loanId)?.borrowerName || '',
      currentOutstanding: byId.get(payment.loanId)?.currentOutstanding ?? 0,
      loanSummaryId: payment.loanId
    }));
    const dashboard = createDashboard(summaries, normalizedPayments, history, settings, asOf);
    const activeRatio = summaries.length ? dashboard.activeLoans / summaries.length : 0;
    const collectionRatio = dashboard.totalPrincipalGiven ? dashboard.totalReceived / dashboard.totalPrincipalGiven : 0;
    const interestExposure = dashboard.currentOutstandingAmount ? dashboard.currentOutstandingInterest / dashboard.currentOutstandingAmount : 0;
    const analytics = {
      charts: dashboard.charts,
      portfolioHealth: {
        activeRatio,
        collectionRatio,
        interestExposure,
        activePercentage: roundMoney(activeRatio * 100),
        collectionPercentage: roundMoney(collectionRatio * 100),
        interestExposurePercentage: roundMoney(interestExposure * 100)
      }
    };
    return { loans: summaries, payments: normalizedPayments, history, dashboard, analytics, settings: { ...settings, totalLiquid: dashboard.familyHoldings.totalLiquid } };
  }
}

export default LoanCalculationEngine;
