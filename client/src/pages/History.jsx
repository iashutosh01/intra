import EmptyState from '../components/common/EmptyState.jsx';
import PageHeader from '../components/common/PageHeader.jsx';
import Skeleton from '../components/common/Skeleton.jsx';
import { useAsync } from '../hooks/useAsync.js';
import { endpoints } from '../services/api.js';
import { date } from '../utils/format.js';

export default function History() {
  const { data = [], loading } = useAsync(() => endpoints.history(), []);
  return (
    <>
      <PageHeader title="History" description="Permanent audit trail for loan and payment actions." />
      <div className="card overflow-hidden">
        {loading ? <Skeleton className="h-96" /> : data.length ? (
          <table className="min-w-full divide-y divide-slate-200 text-sm dark:divide-slate-800">
            <thead className="bg-slate-50 text-left text-xs uppercase text-slate-500 dark:bg-slate-900">
              <tr><th className="px-4 py-3">Timestamp</th><th className="px-4 py-3">Action</th><th className="px-4 py-3">Loan ID</th><th className="px-4 py-3">Remarks</th></tr>
            </thead>
            <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
              {data.map((item) => (
                <tr key={item.id}><td className="px-4 py-3">{date(item.timestamp)}</td><td className="px-4 py-3 font-bold">{item.action}</td><td className="px-4 py-3">{item.loanId}</td><td className="px-4 py-3 text-slate-500">{item.notes || '-'}</td></tr>
              ))}
            </tbody>
          </table>
        ) : <EmptyState title="No history yet" />}
      </div>
    </>
  );
}
