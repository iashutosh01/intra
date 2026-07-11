import EmptyState from '../components/common/EmptyState.jsx';
import PageHeader from '../components/common/PageHeader.jsx';
import Skeleton from '../components/common/Skeleton.jsx';
import { useAsync } from '../hooks/useAsync.js';
import { endpoints } from '../services/api.js';
import { date, money } from '../utils/format.js';

const actionClass = (action = '') => {
  if (action.includes('Paid') || action.includes('Payment')) return 'bg-emerald-50 text-emerald-700 dark:bg-emerald-950 dark:text-emerald-200';
  if (action.includes('Created')) return 'bg-blue-50 text-blue-700 dark:bg-blue-950 dark:text-blue-200';
  if (action.includes('Edited') || action.includes('Updated')) return 'bg-orange-50 text-orange-700 dark:bg-orange-950 dark:text-orange-200';
  if (action.includes('Deleted')) return 'bg-red-50 text-red-700 dark:bg-red-950 dark:text-red-200';
  return 'bg-slate-100 text-slate-700 dark:bg-slate-800 dark:text-slate-200';
};

export default function History() {
  const { data = [], loading } = useAsync(() => endpoints.history(), []);
  return (
    <>
      <PageHeader title="History" description="Permanent audit trail for loan and payment actions." />
      <div className="card overflow-hidden">
        {loading ? <Skeleton className="h-96" /> : data.length ? (
          <table className="min-w-full divide-y divide-slate-200 text-sm dark:divide-slate-800">
            <thead className="bg-slate-50 text-left text-xs uppercase text-slate-500 dark:bg-slate-900">
              <tr><th className="px-4 py-3">Borrower</th><th className="px-4 py-3">Action</th><th className="px-4 py-3">Amount</th><th className="px-4 py-3">Date</th><th className="px-4 py-3">Remarks</th></tr>
            </thead>
            <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
              {data.map((item) => (
                <tr key={item.id} className="transition hover:bg-slate-50 dark:hover:bg-slate-900">
                  <td className="px-4 py-3 font-bold">{item.borrowerName || '-'}</td>
                  <td className="px-4 py-3"><span className={`rounded-full px-2.5 py-1 text-xs font-bold ${actionClass(item.action)}`}>{item.action}</span></td>
                  <td className="px-4 py-3 font-semibold">{item.amount ? money(item.amount) : '-'}</td>
                  <td className="px-4 py-3">{date(item.date || item.timestamp)}</td>
                  <td className="px-4 py-3 text-slate-500">{item.remarks || '-'}</td>
                </tr>
              ))}
            </tbody>
          </table>
        ) : <EmptyState title="No history yet" />}
      </div>
    </>
  );
}
