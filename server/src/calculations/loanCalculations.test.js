import assert from 'node:assert/strict';
import { calculateLoanSummary } from './loanCalculations.js';
import { LoanCalculationEngine } from './LoanCalculationEngine.js';
import { LoanSummary } from '../domain/models/LoanSummary.js';

const baseLoan = {
  id: 'loan-1',
  borrowerName: 'Test Borrower',
  principal: 1000,
  interestRate: 3,
  loanDate: '2025-01-01',
  interestStartDate: '2025-01-01',
  status: 'active'
};

const summaryWithoutPayments = calculateLoanSummary(baseLoan, [], '2026-01-01');
assert.equal(summaryWithoutPayments.interestTillToday, 360);
assert.equal(summaryWithoutPayments.currentOutstanding, 1360);

const fullySettledInterest = calculateLoanSummary(
  baseLoan,
  [{ id: 'p1', loanId: 'loan-1', paymentDate: '2026-01-01', amount: 360, paymentType: 'interest' }],
  '2026-02-01'
);
assert.equal(fullySettledInterest.lastInterestPaidDate, '2026-01-01');
assert.equal(fullySettledInterest.outstandingInterest, 30);
assert.equal(fullySettledInterest.remainingPrincipal, 1000);

const partialInterest = calculateLoanSummary(
  baseLoan,
  [{ id: 'p1', loanId: 'loan-1', paymentDate: '2026-01-01', amount: 200, paymentType: 'interest' }],
  '2026-02-01'
);
assert.equal(partialInterest.lastInterestPaidDate, '2026-01-01');
assert.equal(partialInterest.outstandingInterest, 190);
assert.equal(partialInterest.remainingPrincipal, 1000);

const mixedPayment = calculateLoanSummary(
  baseLoan,
  [{ id: 'p1', loanId: 'loan-1', paymentDate: '2026-01-01', amount: 500, paymentType: 'mixed' }],
  '2026-02-01'
);
assert.equal(mixedPayment.interestPaid, 360);
assert.equal(mixedPayment.principalPaid, 140);
assert.equal(mixedPayment.remainingPrincipal, 860);
assert.equal(mixedPayment.outstandingInterest, 25.8);

const history = [{ id: 'h1', loanId: 'loan-1', action: 'Loan Created', newValue: JSON.stringify(baseLoan), timestamp: '2025-01-01', notes: '' }];
const portfolio = LoanCalculationEngine.calculatePortfolio(
  [baseLoan],
  [{ id: 'p1', loanId: 'loan-1', paymentDate: '2026-01-01', amount: 360, paymentType: 'interest' }],
  history,
  { cashInHand: 100, moneyWithMummy: 200, moneyWithPapa: 300 },
  '2026-02-01'
);
assert.ok(portfolio.loans[0] instanceof LoanSummary);
assert.equal(portfolio.loans[0].paymentTimeline.length, 1);
assert.equal(portfolio.loans[0].historyTimeline.length, 1);
assert.equal(portfolio.history[0].currentOutstanding, portfolio.loans[0].currentOutstanding);
assert.equal(portfolio.dashboard.highestOutstandingLoan, portfolio.loans[0]);
assert.equal(portfolio.settings.totalLiquid, 600);
assert.equal(portfolio.analytics.portfolioHealth.activePercentage, 100);

const preview = LoanCalculationEngine.calculatePaymentPreview(portfolio.loans[0], { amount: 50, paymentType: 'mixed' });
assert.equal(preview.interestApplied, 30);
assert.equal(preview.principalApplied, 20);

const anchoredLoan = {
  ...baseLoan,
  id: 'anchored-loan',
  principal: 10000,
  interestRate: 3,
  loanDate: '2025-06-01',
  interestStartDate: '2025-06-01'
};
const mainSettlement = calculateLoanSummary(anchoredLoan, [{
  id: 'main-payment', loanId: anchoredLoan.id, paymentDate: '2026-07-10', amount: 3600, paymentType: 'interest'
}], '2026-09-01');
assert.equal(mainSettlement.interestPaid, 3600);
assert.equal(mainSettlement.outstandingInterest, 900);
assert.equal(mainSettlement.remainingPrincipal, 10000);
assert.equal(mainSettlement.currentOutstanding, 10900);
assert.equal(mainSettlement.lastPaymentDate, '2026-07-10');
assert.match(mainSettlement.interestCoveredUntil, /^2026-06-01/);
assert.match(mainSettlement.nextInterestDueDate, /^2026-07-01/);
assert.match(mainSettlement.paymentApplications[0].interestCoveredUntilAfter, /^2026-06-01/);
assert.equal(mainSettlement.paymentApplications[0].outstandingInterestAfter, 300);

const earlyLoan = {
  ...anchoredLoan,
  id: 'early-loan',
  loanDate: '2025-04-20',
  interestStartDate: '2025-04-20'
};
const earlySettlement = calculateLoanSummary(earlyLoan, [{
  id: 'early-payment', loanId: earlyLoan.id, paymentDate: '2026-07-19', amount: 4500, paymentType: 'interest'
}], '2026-07-19');
assert.equal(earlySettlement.interestPaid, 4500);
assert.equal(earlySettlement.outstandingInterest, 0);
assert.match(earlySettlement.interestCoveredUntil, /^2026-07-20/);
assert.equal(earlySettlement.lastPaymentDate, '2026-07-19');
assert.match(earlySettlement.nextInterestDueDate, /^2026-08-20/);
const earlyPreview = LoanCalculationEngine.calculatePaymentPreview(
  calculateLoanSummary(earlyLoan, [], '2026-07-19'),
  { amount: 4500, paymentType: 'interest' }
);
assert.equal(earlyPreview.interestApplied, 4500);
assert.equal(earlyPreview.interestRemaining, 0);
assert.equal(earlyPreview.overpayment, 0);

for (const paymentDate of ['2026-07-10', '2026-07-15', '2026-07-19', '2026-07-30']) {
  const summary = calculateLoanSummary({ ...earlyLoan, id: `date-${paymentDate}` }, [{
    id: `payment-${paymentDate}`, loanId: `date-${paymentDate}`, paymentDate, amount: 4500, paymentType: 'interest'
  }], paymentDate);
  assert.equal(summary.interestPaid, 4500);
  assert.match(summary.interestCoveredUntil, /^2026-07-20/);
  assert.equal(summary.outstandingInterest, 0);
}

const partialPeriodLoan = { ...baseLoan, id: 'partial-period-loan', principal: 10000, loanDate: '2025-01-01', interestStartDate: '2025-01-01' };
const partialPeriodPayment = calculateLoanSummary(partialPeriodLoan, [{
  id: 'partial-period-payment', loanId: partialPeriodLoan.id, paymentDate: '2025-04-01', amount: 500, paymentType: 'interest'
}], '2025-04-01');
assert.equal(partialPeriodPayment.interestPaid, 500);
assert.equal(partialPeriodPayment.outstandingInterest, 400);
assert.match(partialPeriodPayment.interestCoveredUntil, /^2025-02-01/);

const principalPayment = calculateLoanSummary({ ...partialPeriodLoan, id: 'principal-period-loan' }, [{
  id: 'principal-period-payment', loanId: 'principal-period-loan', paymentDate: '2025-02-15', amount: 500, paymentType: 'principal'
}], '2025-03-01');
assert.equal(principalPayment.remainingPrincipal, 9500);
assert.equal(principalPayment.outstandingInterest, 585);
assert.match(principalPayment.interestCoveredUntil, /^2025-01-01/);
assert.equal(principalPayment.interestPaid, 0);

const mixedPaymentSummary = calculateLoanSummary({ ...partialPeriodLoan, id: 'mixed-period-loan' }, [{
  id: 'mixed-period-payment', loanId: 'mixed-period-loan', paymentDate: '2025-04-01', amount: 1000, paymentType: 'mixed'
}], '2025-05-01');
assert.equal(mixedPaymentSummary.interestPaid, 900);
assert.equal(mixedPaymentSummary.principalPaid, 100);
assert.equal(mixedPaymentSummary.remainingPrincipal, 9900);
assert.equal(mixedPaymentSummary.outstandingInterest, 297);
assert.match(mixedPaymentSummary.interestCoveredUntil, /^2025-04-01/);

const chronologicalLoan = { ...partialPeriodLoan, id: 'chronological-loan' };
const chronologicalSummary = calculateLoanSummary(chronologicalLoan, [
  { id: 'later-payment', loanId: chronologicalLoan.id, paymentDate: '2025-03-01', amount: 300, paymentType: 'interest' },
  { id: 'earlier-payment', loanId: chronologicalLoan.id, paymentDate: '2025-02-01', amount: 300, paymentType: 'interest' }
], '2025-04-01');
assert.deepEqual(chronologicalSummary.paymentApplications.map((item) => item.paymentId), ['earlier-payment', 'later-payment']);
assert.equal(chronologicalSummary.interestPaid, 600);
assert.equal(chronologicalSummary.outstandingInterest, 300);
assert.match(chronologicalSummary.interestCoveredUntil, /^2025-03-01/);

const fullySettledDuration = calculateLoanSummary(baseLoan, [{
  id: 'duration-settled', loanId: baseLoan.id, paymentDate: '2026-01-01', amount: 360, paymentType: 'interest'
}], '2026-01-01');
assert.equal(fullySettledDuration.outstandingInterest, 0);
assert.equal(fullySettledDuration.interestDuration, '0 Days');

const partialDurationLoan = { ...baseLoan, id: 'duration-partial', principal: 10000, loanDate: '2025-01-01', interestStartDate: '2025-01-01' };
const partialDuration = calculateLoanSummary(partialDurationLoan, [{
  id: 'duration-partial-payment', loanId: partialDurationLoan.id, paymentDate: '2025-04-01', amount: 500, paymentType: 'interest'
}], '2025-04-01');
assert.equal(partialDuration.outstandingInterest, 400);
assert.equal(partialDuration.interestDuration, '1 Month 12 Days');

const differentRateLoan = { ...partialDurationLoan, id: 'duration-rate', interestRate: 4 };
const differentRate = calculateLoanSummary(differentRateLoan, [{
  id: 'duration-rate-payment', loanId: differentRateLoan.id, paymentDate: '2025-06-01', amount: 1200, paymentType: 'interest'
}], '2025-06-01');
assert.equal(differentRate.outstandingInterest, 800);
assert.equal(differentRate.interestDuration, '2 Months');

const sharvanLoan = {
  id: 'sharvan', principal: 10000, interestRate: 3, loanDate: '2025-06-01',
  interestStartDate: '2025-06-01', status: 'active'
};
const sharvan = calculateLoanSummary(sharvanLoan, [
  { id: 'sharvan-p1', loanId: 'sharvan', paymentDate: '2026-06-03', amount: 3600, paymentType: 'interest' },
  { id: 'sharvan-p2', loanId: 'sharvan', paymentDate: '2026-11-11', amount: 900, paymentType: 'interest' }
], '2026-11-11');
assert.equal(sharvan.totalInterestGenerated, 5100);
assert.equal(sharvan.interestPaid, 4500);
assert.equal(sharvan.outstandingInterest, 600);
assert.equal(sharvan.currentOutstanding, 10600);
assert.equal(sharvan.interestDuration, '2 Months 10 Days');

console.log('Calculation tests passed');
