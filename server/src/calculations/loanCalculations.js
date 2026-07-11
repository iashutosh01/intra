import { PAYMENT_TYPES } from '../constants/index.js';
import { roundMoney, toNumber } from '../utils/format.js';

const MS_PER_DAY = 24 * 60 * 60 * 1000;

export const startOfDay = (value) => {
  const date = value ? new Date(value) : new Date();
  return new Date(date.getFullYear(), date.getMonth(), date.getDate());
};

export const calculateMonths = (from, to = new Date()) => {
  const start = startOfDay(from);
  const end = startOfDay(to);
  if (end <= start) return 0;

  let months = (end.getFullYear() - start.getFullYear()) * 12 + end.getMonth() - start.getMonth();
  if (end.getDate() < start.getDate()) months -= 1;
  return Math.max(months, 0);
};

export const calculateYears = (from, to = new Date()) => Math.floor(calculateMonths(from, to) / 12);

export const calculateDuration = (from, to = new Date()) => {
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

export const calculateInterest = (principal, monthlyRate, from, to = new Date()) => {
  const months = calculateMonths(from, to);
  return roundMoney((toNumber(principal) * toNumber(monthlyRate) * months) / 100);
};

const normalizePayment = (payment) => ({
  ...payment,
  amount: toNumber(payment.amount),
  paymentDate: payment.paymentDate || payment.createdAt
});

export const calculatePaymentDistribution = (payment, outstandingInterest, remainingPrincipal) => {
  const amount = roundMoney(payment.amount);
  if (!PAYMENT_TYPES.includes(payment.paymentType)) {
    throw new Error(`Invalid payment type: ${payment.paymentType}`);
  }

  if (payment.paymentType === 'interest') {
    const interestApplied = Math.min(amount, outstandingInterest);
    return {
      interestApplied: roundMoney(interestApplied),
      principalApplied: 0,
      overpayment: roundMoney(amount - interestApplied)
    };
  }

  if (payment.paymentType === 'principal') {
    const principalApplied = Math.min(amount, remainingPrincipal);
    return {
      interestApplied: 0,
      principalApplied: roundMoney(principalApplied),
      overpayment: roundMoney(amount - principalApplied)
    };
  }

  const interestApplied = Math.min(amount, outstandingInterest);
  const remainingAfterInterest = roundMoney(amount - interestApplied);
  const principalApplied = Math.min(remainingAfterInterest, remainingPrincipal);
  return {
    interestApplied: roundMoney(interestApplied),
    principalApplied: roundMoney(principalApplied),
    overpayment: roundMoney(amount - interestApplied - principalApplied)
  };
};

export const applyPayment = (state, payment) => {
  const normalized = normalizePayment(payment);
  const accruedInterest = calculateInterest(
    state.remainingPrincipal,
    state.interestRate,
    state.interestCursorDate,
    normalized.paymentDate
  );
  const outstandingInterestBeforePayment = roundMoney(state.outstandingInterest + accruedInterest);
  const distribution = calculatePaymentDistribution(
    normalized,
    outstandingInterestBeforePayment,
    state.remainingPrincipal
  );

  const outstandingInterest = roundMoney(outstandingInterestBeforePayment - distribution.interestApplied);
  const remainingPrincipal = roundMoney(state.remainingPrincipal - distribution.principalApplied);
  const fullyClearedInterest = outstandingInterest <= 0 && distribution.interestApplied > 0;

  return {
    ...state,
    remainingPrincipal,
    outstandingInterest,
    principalPaid: roundMoney(state.principalPaid + distribution.principalApplied),
    interestPaid: roundMoney(state.interestPaid + distribution.interestApplied),
    lastInterestPaidDate: fullyClearedInterest ? normalized.paymentDate : state.lastInterestPaidDate,
    interestCursorDate: normalized.paymentDate,
    paymentApplications: [
      ...state.paymentApplications,
      {
        paymentId: normalized.id,
        paymentDate: normalized.paymentDate,
        paymentType: normalized.paymentType,
        amount: normalized.amount,
        ...distribution,
        outstandingInterestAfter: outstandingInterest,
        remainingPrincipalAfter: remainingPrincipal
      }
    ]
  };
};

export const recalculateLoan = (loan, payments = [], asOf = new Date()) => {
  const originalPrincipal = toNumber(loan.principal);
  const interestStartDate = loan.interestStartDate || loan.loanDate;
  const sortedPayments = payments
    .map(normalizePayment)
    .filter((payment) => payment.loanId === loan.id)
    .sort((a, b) => new Date(a.paymentDate) - new Date(b.paymentDate) || String(a.id).localeCompare(String(b.id)));

  let state = {
    remainingPrincipal: originalPrincipal,
    interestRate: toNumber(loan.interestRate),
    interestCursorDate: loan.lastInterestPaidDate || interestStartDate,
    lastInterestPaidDate: loan.lastInterestPaidDate || '',
    outstandingInterest: 0,
    principalPaid: 0,
    interestPaid: 0,
    paymentApplications: []
  };

  for (const payment of sortedPayments) {
    state = applyPayment(state, payment);
  }

  const liveInterest = calculateInterest(state.remainingPrincipal, state.interestRate, state.interestCursorDate, asOf);
  const outstandingInterest = roundMoney(state.outstandingInterest + liveInterest);
  const currentOutstanding = roundMoney(state.remainingPrincipal + outstandingInterest);
  const status = loan.status === 'closed' || currentOutstanding <= 0 ? 'closed' : 'active';
  const lastPayment = sortedPayments.at(-1);
  const lastPaymentDate = lastPayment?.paymentDate || '';
  const nextInterestDueDate = new Date(state.interestCursorDate || interestStartDate);
  nextInterestDueDate.setMonth(nextInterestDueDate.getMonth() + 1);
  const daysSinceLastPayment = lastPaymentDate
    ? Math.max(0, Math.floor((startOfDay(asOf) - startOfDay(lastPaymentDate)) / MS_PER_DAY))
    : null;

  return {
    ...loan,
    principal: originalPrincipal,
    interestRate: toNumber(loan.interestRate),
    principalPaid: roundMoney(state.principalPaid),
    interestPaid: roundMoney(state.interestPaid),
    lastInterestPaidDate: state.lastInterestPaidDate,
    lastPaymentDate,
    nextInterestDueDate: nextInterestDueDate.toISOString(),
    numberOfPayments: sortedPayments.length,
    remainingPrincipal: roundMoney(state.remainingPrincipal),
    outstandingPrincipal: roundMoney(state.remainingPrincipal),
    interestTillToday: roundMoney(liveInterest),
    outstandingInterest,
    totalInterestGenerated: roundMoney(state.interestPaid + outstandingInterest),
    currentOutstanding,
    totalReceived: roundMoney(state.principalPaid + state.interestPaid),
    status,
    loanDuration: calculateDuration(loan.loanDate, asOf),
    interestDuration: calculateDuration(state.interestCursorDate, asOf),
    totalMonths: calculateMonths(loan.loanDate, asOf),
    totalYears: calculateYears(loan.loanDate, asOf),
    daysSinceLastPayment,
    paymentApplications: state.paymentApplications
  };
};

export const calculateLoanSummary = (loan, payments, asOf = new Date()) => recalculateLoan(loan, payments, asOf);

export const calculateOutstanding = (loan, payments, asOf = new Date()) => {
  const summary = calculateLoanSummary(loan, payments, asOf);
  return {
    outstandingInterest: summary.outstandingInterest,
    remainingPrincipal: summary.remainingPrincipal,
    currentOutstanding: summary.currentOutstanding
  };
};

const monthKey = (date) => new Date(date).toISOString().slice(0, 7);

const addToBucket = (buckets, key, field, amount) => {
  if (!buckets[key]) buckets[key] = { month: key, lending: 0, collections: 0, interest: 0 };
  buckets[key][field] = roundMoney(buckets[key][field] + amount);
};

export const calculateDashboard = (loans = [], payments = [], history = [], settings = {}, asOf = new Date()) => {
  const summaries = loans.map((loan) => calculateLoanSummary(loan, payments, asOf));
  const buckets = {};

  for (const loan of loans) addToBucket(buckets, monthKey(loan.loanDate || loan.createdAt), 'lending', toNumber(loan.principal));
  for (const payment of payments) addToBucket(buckets, monthKey(payment.paymentDate || payment.createdAt), 'collections', toNumber(payment.amount));
  for (const summary of summaries) addToBucket(buckets, monthKey(asOf), 'interest', summary.interestTillToday);

  const totals = summaries.reduce(
    (acc, loan) => ({
      totalPrincipalGiven: roundMoney(acc.totalPrincipalGiven + loan.principal),
      totalPrincipalRemaining: roundMoney(acc.totalPrincipalRemaining + loan.remainingPrincipal),
      totalInterestEarned: roundMoney(acc.totalInterestEarned + loan.interestPaid),
      currentOutstandingInterest: roundMoney(acc.currentOutstandingInterest + loan.outstandingInterest),
      currentOutstandingAmount: roundMoney(acc.currentOutstandingAmount + loan.currentOutstanding),
      totalReceived: roundMoney(acc.totalReceived + loan.totalReceived),
      activeLoans: acc.activeLoans + (loan.status === 'active' ? 1 : 0),
      closedLoans: acc.closedLoans + (loan.status === 'closed' ? 1 : 0)
    }),
    {
      totalPrincipalGiven: 0,
      totalPrincipalRemaining: 0,
      totalInterestEarned: 0,
      currentOutstandingInterest: 0,
      currentOutstandingAmount: 0,
      totalReceived: 0,
      activeLoans: 0,
      closedLoans: 0
    }
  );
  const todayKey = startOfDay(asOf).toISOString().slice(0, 10);
  const currentMonth = monthKey(asOf);
  const todayCollection = payments
    .filter((payment) => startOfDay(payment.paymentDate || payment.createdAt).toISOString().slice(0, 10) === todayKey)
    .reduce((sum, payment) => roundMoney(sum + toNumber(payment.amount)), 0);
  const monthCollection = payments
    .filter((payment) => monthKey(payment.paymentDate || payment.createdAt) === currentMonth)
    .reduce((sum, payment) => roundMoney(sum + toNumber(payment.amount)), 0);
  const liquidCash = {
    cashInHand: roundMoney(settings.cashInHand),
    moneyWithMummy: roundMoney(settings.moneyWithMummy),
    moneyWithPapa: roundMoney(settings.moneyWithPapa)
  };
  liquidCash.totalLiquid = roundMoney(liquidCash.cashInHand + liquidCash.moneyWithMummy + liquidCash.moneyWithPapa);
  const sortedByOutstanding = [...summaries].sort((a, b) => b.currentOutstanding - a.currentOutstanding);
  const sortedByInterest = [...summaries].sort((a, b) => b.totalInterestGenerated - a.totalInterestGenerated);
  const paymentCounts = payments.reduce((acc, payment) => {
    acc[payment.loanId] = (acc[payment.loanId] || 0) + 1;
    return acc;
  }, {});
  const mostActiveBorrower = [...summaries].sort((a, b) => (paymentCounts[b.id] || 0) - (paymentCounts[a.id] || 0))[0] || null;

  return {
    ...totals,
    todayCollection,
    monthCollection,
    familyHoldings: liquidCash,
    netWorth: roundMoney(liquidCash.totalLiquid + totals.currentOutstandingAmount),
    highestOutstandingLoan: sortedByOutstanding[0] || null,
    highestInterestGenerated: sortedByInterest[0] || null,
    mostActiveBorrower: mostActiveBorrower ? { ...mostActiveBorrower, paymentCount: paymentCounts[mostActiveBorrower.id] || 0 } : null,
    recentlyAddedLoan: [...summaries].sort((a, b) => new Date(b.createdAt || b.loanDate) - new Date(a.createdAt || a.loanDate))[0] || null,
    recentPayments: [...payments].sort((a, b) => new Date(b.paymentDate || b.createdAt) - new Date(a.paymentDate || a.createdAt)).slice(0, 6),
    totalBorrowers: new Set(loans.map((loan) => String(loan.borrowerName).toLowerCase())).size,
    recentActivity: history.slice(-8).reverse(),
    upcomingInterestDue: summaries
      .filter((loan) => loan.status === 'active')
      .sort((a, b) => b.outstandingInterest - a.outstandingInterest)
      .slice(0, 6),
    charts: {
      monthly: Object.values(buckets).sort((a, b) => a.month.localeCompare(b.month)),
      outstandingDistribution: summaries.map((loan) => ({
        name: loan.borrowerName,
        principal: loan.remainingPrincipal,
        interest: loan.outstandingInterest
      })),
      topBorrowers: summaries
        .sort((a, b) => b.currentOutstanding - a.currentOutstanding)
        .slice(0, 5)
        .map((loan) => ({ name: loan.borrowerName, outstanding: loan.currentOutstanding }))
    }
  };
};
