import { money, percent } from '../../utils/format.js';

export const AmountBadge = ({ value, className = '' }) => <span className={`font-bold ${className}`}>{money(value)}</span>;
export const InterestBadge = ({ value }) => <span className="font-semibold text-orange-700 dark:text-orange-300">{money(value)}</span>;
export const OutstandingBadge = ({ value }) => <span className="font-bold text-slate-950 dark:text-white">{money(value)}</span>;
export const DurationBadge = ({ value }) => <span className="whitespace-nowrap text-slate-600 dark:text-slate-300">{value || '0 Days'}</span>;
export const RateBadge = ({ value }) => <span>{percent(value)}</span>;

export function StatusBadge({ loan }) {
  const styles = {
    closed: ['Closed', 'bg-slate-100 text-slate-700 dark:bg-slate-800 dark:text-slate-200'],
    overdue: ['Overdue', 'bg-red-50 text-red-700 dark:bg-red-950 dark:text-red-200'],
    interestDue: ['Interest Due', 'bg-orange-50 text-orange-700 dark:bg-orange-950 dark:text-orange-200'],
    active: ['Active', 'bg-emerald-50 text-emerald-700 dark:bg-emerald-950 dark:text-emerald-200']
  };
  const [label, className] = styles[loan.displayStatus] || styles.active;
  return <span className={`rounded-full px-2 py-1 text-xs font-bold ${className}`}>{label}</span>;
}
