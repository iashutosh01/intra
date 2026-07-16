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

const summaryWithoutPayments = calculateLoanSummary(baseLoan, [], new Date('2026-01-01'));
assert.equal(summaryWithoutPayments.interestTillToday, 360);
assert.equal(summaryWithoutPayments.currentOutstanding, 1360);

const fullySettledInterest = calculateLoanSummary(
  baseLoan,
  [{ id: 'p1', loanId: 'loan-1', paymentDate: '2026-01-01', amount: 360, paymentType: 'interest' }],
  new Date('2026-02-01')
);
assert.equal(fullySettledInterest.lastInterestPaidDate, '2026-01-01');
assert.equal(fullySettledInterest.outstandingInterest, 30);
assert.equal(fullySettledInterest.remainingPrincipal, 1000);

const partialInterest = calculateLoanSummary(
  baseLoan,
  [{ id: 'p1', loanId: 'loan-1', paymentDate: '2026-01-01', amount: 200, paymentType: 'interest' }],
  new Date('2026-02-01')
);
assert.equal(partialInterest.lastInterestPaidDate, '');
assert.equal(partialInterest.outstandingInterest, 190);
assert.equal(partialInterest.remainingPrincipal, 1000);

const mixedPayment = calculateLoanSummary(
  baseLoan,
  [{ id: 'p1', loanId: 'loan-1', paymentDate: '2026-01-01', amount: 500, paymentType: 'mixed' }],
  new Date('2026-02-01')
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
  new Date('2026-02-01')
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

console.log('Calculation tests passed');
