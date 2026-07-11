export const money = (value) =>
  new Intl.NumberFormat('en-IN', {
    style: 'currency',
    currency: 'INR',
    maximumFractionDigits: 0
  }).format(Number(value || 0));

export const number = (value) => new Intl.NumberFormat('en-IN').format(Number(value || 0));

export const date = (value) => {
  if (!value) return '-';
  return new Intl.DateTimeFormat('en-IN', { day: '2-digit', month: 'short', year: 'numeric' }).format(new Date(value));
};

export const percent = (value) => `${Number(value || 0).toFixed(2)}%`;
