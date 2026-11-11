const currency = new Intl.NumberFormat('en-IN', {
  style: 'currency',
  currency: 'INR',
  minimumFractionDigits: 0,
  maximumFractionDigits: 2
});

export const monthlyInterest = (loan) => {
  if (!loan || loan.status === 'closed') return 0;
  const principal = Math.max(0, Number(loan.remainingPrincipal) || 0);
  const rate = Math.max(0, Number(loan.interestRate) || 0);
  return principal * rate / 100;
};

export const formatMonthlyInterest = (amount) => currency.format(Number(amount) || 0);

export const completeDuration = (durationValue, startDate) => {
  const duration = String(durationValue || '');
  const years = Number(duration.match(/(\d+)\s+Years?/i)?.[1] || 0);
  const months = Number(duration.match(/(\d+)\s+Months?/i)?.[1] || 0);
  let days = Number(duration.match(/(\d+)\s+Days?/i)?.[1] || 0);

  // The API's duration omits the day remainder when it has years or months.
  // Fill that display-only remainder using the same calendar-month convention.
  if (!/\d+\s+Days?/i.test(duration) && startDate) {
    const start = new Date(startDate);
    const end = new Date();
    const from = new Date(start.getFullYear(), start.getMonth(), start.getDate());
    const to = new Date(end.getFullYear(), end.getMonth(), end.getDate());
    if (!Number.isNaN(from.getTime()) && to > from) {
      const totalMonths = (to.getFullYear() - from.getFullYear()) * 12 + to.getMonth() - from.getMonth() - (to.getDate() < from.getDate() ? 1 : 0);
      const cursor = new Date(from);
      cursor.setMonth(cursor.getMonth() + Math.max(0, totalMonths));
      days = Math.max(0, Math.floor((to - cursor) / 86400000));
    }
  }

  return `${years} ${years === 1 ? 'Year' : 'Years'} ${months} ${months === 1 ? 'Month' : 'Months'} ${days} ${days === 1 ? 'Day' : 'Days'}`;
};

export const completeLoanDuration = (loan) => completeDuration(loan?.loanDuration, loan?.loanDate);
