export const SHEETS = {
  loans: 'Loans',
  payments: 'Payments',
  history: 'History',
  settings: 'Settings'
};

export const PAYMENT_TYPES = ['interest', 'principal', 'mixed'];
export const LOAN_STATUSES = ['active', 'closed'];

export const HISTORY_ACTIONS = {
  loanCreated: 'Loan Created',
  loanEdited: 'Loan Edited',
  loanDeleted: 'Loan Deleted',
  loanClosed: 'Loan Closed',
  interestPaid: 'Interest Paid',
  principalPaid: 'Principal Paid',
  mixedPayment: 'Mixed Payment',
  paymentUpdated: 'Payment Updated',
  paymentDeleted: 'Payment Deleted'
};

export const SHEET_HEADERS = {
  [SHEETS.loans]: [
    'id',
    'borrowerName',
    'phone',
    'address',
    'principal',
    'interestRate',
    'loanDate',
    'interestStartDate',
    'lastInterestPaidDate',
    'principalPaid',
    'interestPaid',
    'status',
    'remarks',
    'createdAt',
    'updatedAt'
  ],
  [SHEETS.payments]: ['id', 'loanId', 'paymentDate', 'amount', 'paymentType', 'notes', 'createdAt'],
  [SHEETS.history]: ['id', 'loanId', 'action', 'oldValue', 'newValue', 'timestamp', 'notes'],
  [SHEETS.settings]: ['key', 'value']
};
