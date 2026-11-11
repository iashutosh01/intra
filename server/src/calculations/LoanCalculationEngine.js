import { PAYMENT_TYPES } from '../constants/index.js';
import { LoanSummary } from '../domain/models/LoanSummary.js';
import { parseJson, roundMoney, toNumber } from '../utils/format.js';

const MS_PER_DAY = 24 * 60 * 60 * 1000;

const startOfDay = (value) => {
  const dateOnlyMatch = typeof value === 'string' ? value.match(/^(\d{4})-(\d{2})-(\d{2})$/) : null;
  const date = dateOnlyMatch
    ? new Date(Number(dateOnlyMatch[1]), Number(dateOnlyMatch[2]) - 1, Number(dateOnlyMatch[3]))
    : value ? new Date(value) : new Date();
  return new Date(date.getFullYear(), date.getMonth(), date.getDate());
};

const dateOnly = (value) => {
  const date = startOfDay(value);
  return `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}-${String(date.getDate()).padStart(2, '0')}`;
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

const monthBoundary = (anchor, monthOffset) => {
  const start = startOfDay(anchor);
  const targetMonth = start.getMonth() + monthOffset;
  const lastDay = new Date(start.getFullYear(), targetMonth + 1, 0).getDate();
  return new Date(start.getFullYear(), targetMonth, Math.min(start.getDate(), lastDay));
};

const completedPeriods = (anchor, through) => {
  const start = startOfDay(anchor);
  const end = startOfDay(through);
  if (end <= start) return 0;
  let count = Math.max(0, (end.getFullYear() - start.getFullYear()) * 12 + end.getMonth() - start.getMonth());
  while (count > 0 && monthBoundary(start, count) > end) count -= 1;
  while (monthBoundary(start, count + 1) <= end) count += 1;
  return count;
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
  roundMoney((toNumber(principal) * toNumber(monthlyRate) * completedPeriods(from, to)) / 100);

const calculateRemainingInterestDuration = (state, asOf) => {
  if (state.outstandingInterest <= 0) return '0 Days';

  let remainingDays = 0;
  for (let index = state.coveredPeriodCount; index < state.interestPeriods.length; index += 1) {
    const period = state.interestPeriods[index];
    if (period.amount <= 0 || period.unpaid <= 0) continue;
    const periodDays = (period.endDate - period.startDate) / MS_PER_DAY;
    remainingDays += periodDays * Math.min(1, period.unpaid / period.amount);
  }

  // The engine books interest at completed monthly boundaries. Include the
  // elapsed part of the current period in the duration while an older balance
  // remains due, without adding fractional interest to the balance itself.
  const lastCompletedBoundary = monthBoundary(state.interestStartDate, state.interestPeriods.length);
  const asOfDate = startOfDay(asOf);
  if (state.remainingPrincipal > 0 && state.interestRate > 0 && asOfDate > lastCompletedBoundary) {
    remainingDays += Math.floor((asOfDate - lastCompletedBoundary) / MS_PER_DAY);
  }

  let remainingMonths = 0;
  while (remainingDays > 0) {
    const periodStart = monthBoundary(state.interestStartDate, state.coveredPeriodCount + remainingMonths);
    const periodEnd = monthBoundary(state.interestStartDate, state.coveredPeriodCount + remainingMonths + 1);
    const periodDays = (periodEnd - periodStart) / MS_PER_DAY;
    if (remainingDays + 1e-9 < periodDays) break;
    remainingDays -= periodDays;
    remainingMonths += 1;
  }

  let days = Math.round(remainingDays);
  const nextStart = monthBoundary(state.interestStartDate, state.coveredPeriodCount + remainingMonths);
  const nextEnd = monthBoundary(state.interestStartDate, state.coveredPeriodCount + remainingMonths + 1);
  if (days >= (nextEnd - nextStart) / MS_PER_DAY) {
    remainingMonths += 1;
    days = 0;
  }
  const years = Math.floor(remainingMonths / 12);
  const months = remainingMonths % 12;
  const parts = [];
  if (years) parts.push(`${years} ${years === 1 ? 'Year' : 'Years'}`);
  if (months) parts.push(`${months} ${months === 1 ? 'Month' : 'Months'}`);
  if (days) parts.push(`${days} ${days === 1 ? 'Day' : 'Days'}`);
  return parts.join(' ') || '0 Days';
};

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

const refreshInterestState = (state) => {
  while (state.coveredPeriodCount < state.interestPeriods.length && state.interestPeriods[state.coveredPeriodCount].unpaid <= 0) {
    state.coveredPeriodCount += 1;
  }
  state.interestCoveredUntil = monthBoundary(state.interestStartDate, state.coveredPeriodCount);
  state.outstandingInterest = roundMoney(state.interestPeriods.reduce((total, period) => total + period.unpaid, 0));
};

const appendInterestPeriod = (state) => {
  const periodIndex = state.interestPeriods.length;
  const amount = roundMoney(state.remainingPrincipal * state.interestRate / 100);
  state.interestPeriods.push({
    period: periodIndex + 1,
    startDate: monthBoundary(state.interestStartDate, periodIndex),
    endDate: monthBoundary(state.interestStartDate, periodIndex + 1),
    amount,
    unpaid: amount
  });
};

const accrueInterestThrough = (state, date) => {
  const periodsDue = completedPeriods(state.interestStartDate, date);
  while (state.interestPeriods.length < periodsDue) appendInterestPeriod(state);
  refreshInterestState(state);
};

const allocateInterest = (state, requestedAmount, allowFuturePeriods = false) => {
  let remaining = roundMoney(requestedAmount);
  let applied = 0;
  refreshInterestState(state);
  while (remaining > 0) {
    if (state.coveredPeriodCount >= state.interestPeriods.length) {
      if (!allowFuturePeriods) break;
      const nextAmount = roundMoney(state.remainingPrincipal * state.interestRate / 100);
      if (nextAmount <= 0) break;
      appendInterestPeriod(state);
    }
    const period = state.interestPeriods[state.coveredPeriodCount];
    if (!period || period.unpaid <= 0) {
      refreshInterestState(state);
      continue;
    }
    const portion = roundMoney(Math.min(remaining, period.unpaid));
    period.unpaid = roundMoney(period.unpaid - portion);
    remaining = roundMoney(remaining - portion);
    applied = roundMoney(applied + portion);
    refreshInterestState(state);
  }
  return { applied, remaining };
};

const applyPayment = (state, payment) => {
  const normalized = normalizePayment(payment);
  accrueInterestThrough(state, normalized.paymentDate);
  const amount = roundMoney(normalized.amount);
  if (!PAYMENT_TYPES.includes(normalized.paymentType)) throw new Error(`Invalid payment type: ${normalized.paymentType}`);

  let interestApplied = 0;
  let principalApplied = 0;
  let overpayment = 0;
  if (normalized.paymentType === 'interest') {
    const allocation = allocateInterest(state, amount, true);
    interestApplied = allocation.applied;
    overpayment = allocation.remaining;
  } else if (normalized.paymentType === 'principal') {
    principalApplied = roundMoney(Math.min(amount, state.remainingPrincipal));
    overpayment = roundMoney(amount - principalApplied);
  } else {
    const allocation = allocateInterest(state, amount, false);
    interestApplied = allocation.applied;
    principalApplied = roundMoney(Math.min(amount - interestApplied, state.remainingPrincipal));
    overpayment = roundMoney(amount - interestApplied - principalApplied);
  }

  state.remainingPrincipal = roundMoney(state.remainingPrincipal - principalApplied);
  state.principalPaid = roundMoney(state.principalPaid + principalApplied);
  state.interestPaid = roundMoney(state.interestPaid + interestApplied);
  if (interestApplied > 0) state.lastInterestPaidDate = normalized.paymentDate;
  refreshInterestState(state);
  state.paymentApplications.push({
    paymentId: normalized.id,
    paymentDate: normalized.paymentDate,
    paymentType: normalized.paymentType,
    amount: normalized.amount,
    interestApplied,
    principalApplied,
    overpayment,
    outstandingInterestAfter: state.outstandingInterest,
    remainingPrincipalAfter: state.remainingPrincipal,
    currentOutstandingAfter: roundMoney(state.remainingPrincipal + state.outstandingInterest),
    interestCoveredUntilAfter: dateOnly(state.interestCoveredUntil),
    interestPeriodsSettled: state.coveredPeriodCount
  });
  return state;
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
  const asOfDate = startOfDay(asOf);
  const payments = allPayments
    .filter((payment) => payment.loanId === loan.id)
    .map(normalizePayment)
    .sort((a, b) => new Date(a.paymentDate) - new Date(b.paymentDate) || String(a.id).localeCompare(String(b.id)));
  const paymentsThroughAsOf = payments.filter((payment) => startOfDay(payment.paymentDate) <= asOfDate);
  let state = {
    remainingPrincipal: principal,
    interestRate: toNumber(loan.interestRate),
    interestStartDate: startOfDay(interestStartDate),
    interestCoveredUntil: startOfDay(interestStartDate),
    coveredPeriodCount: 0,
    interestPeriods: [],
    lastInterestPaidDate: '',
    outstandingInterest: 0,
    principalPaid: 0,
    interestPaid: 0,
    paymentApplications: []
  };
  for (const payment of paymentsThroughAsOf) state = applyPayment(state, payment);
  accrueInterestThrough(state, asOfDate);
  const interestTillToday = state.outstandingInterest;
  const outstandingInterest = state.outstandingInterest;
  const currentOutstanding = roundMoney(state.remainingPrincipal + outstandingInterest);
  const status = loan.status === 'closed' || currentOutstanding <= 0 ? 'closed' : 'active';
  const lastPaymentDate = paymentsThroughAsOf.at(-1)?.paymentDate || '';
  const daysSinceLastPayment = lastPaymentDate ? Math.max(0, Math.floor((startOfDay(asOf) - startOfDay(lastPaymentDate)) / MS_PER_DAY)) : null;
  const displayStatus = status === 'closed' ? 'closed' : outstandingInterest > 0 && Number(daysSinceLastPayment || 0) > 45 ? 'overdue' : outstandingInterest > 0 ? 'interestDue' : 'active';
  const nextInterestDue = monthBoundary(state.interestStartDate, state.coveredPeriodCount + 1);
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
    interestCoveredUntil: dateOnly(state.interestCoveredUntil),
    interestCursorDate: dateOnly(state.interestCoveredUntil),
    lastPaymentDate,
    nextInterestDue: dateOnly(nextInterestDue),
    nextInterestDueDate: dateOnly(nextInterestDue),
    paymentCount: paymentsThroughAsOf.length,
    numberOfPayments: paymentsThroughAsOf.length,
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
    interestDuration: calculateRemainingInterestDuration(state, asOfDate),
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
    const normalized = { ...payment, amount: toNumber(payment.amount), paymentType: payment.paymentType || 'mixed' };
    const distribution = paymentDistribution(normalized, summary.outstandingInterest, summary.remainingPrincipal);
    if (normalized.paymentType === 'interest') {
      const monthlyInterest = roundMoney(summary.remainingPrincipal * summary.interestRate / 100);
      const interestApplied = monthlyInterest > 0 ? normalized.amount : Math.min(normalized.amount, summary.outstandingInterest);
      distribution.interestApplied = roundMoney(interestApplied);
      distribution.principalApplied = 0;
      distribution.overpayment = roundMoney(normalized.amount - interestApplied);
    }
    return {
      outstandingInterest: summary.outstandingInterest,
      outstandingPrincipal: summary.remainingPrincipal,
      currentOutstanding: summary.currentOutstanding,
      ...distribution,
      interestRemaining: roundMoney(Math.max(0, summary.outstandingInterest - Math.min(summary.outstandingInterest, distribution.interestApplied))),
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
