import { createLoan, deleteLoan, getLoanDetails, getLoans, updateLoan } from '../services/loanService.js';
import { asyncHandler } from '../utils/asyncHandler.js';

const csvEscape = (value) => `"${String(value ?? '').replace(/"/g, '""')}"`;

export const listLoansController = asyncHandler(async (req, res) => {
  const data = await getLoans(req.query);
  res.json({ success: true, data });
});

export const exportLoansController = asyncHandler(async (req, res) => {
  const loans = await getLoans(req.query);
  const fields = [
    'borrowerName',
    'principal',
    'interestRate',
    'loanDate',
    'interestStartDate',
    'loanDuration',
    'interestDuration',
    'interestTillToday',
    'outstandingInterest',
    'remainingPrincipal',
    'currentOutstanding',
    'status'
  ];
  const csv = [fields.join(','), ...loans.map((loan) => fields.map((field) => csvEscape(loan[field])).join(','))].join('\n');
  res.header('Content-Type', 'text/csv');
  res.attachment('loans.csv');
  res.send(csv);
});

export const createLoanController = asyncHandler(async (req, res) => {
  res.status(201).json({ success: true, data: await createLoan(req.body) });
});

export const updateLoanController = asyncHandler(async (req, res) => {
  res.json({ success: true, data: await updateLoan(req.params.id, req.body) });
});

export const deleteLoanController = asyncHandler(async (req, res) => {
  res.json({ success: true, data: await deleteLoan(req.params.id) });
});

export const loanDetailsController = asyncHandler(async (req, res) => {
  res.json({ success: true, data: await getLoanDetails(req.params.id) });
});
