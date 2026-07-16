import EmptyState from '../components/common/EmptyState.jsx';
import PageHeader from '../components/common/PageHeader.jsx';
import Skeleton from '../components/common/Skeleton.jsx';
import { useFinance } from '../context/FinanceContext.jsx';
import { date, money } from '../utils/format.js';

export default function Payments() {
  const { payments, loading, openPerson } = useFinance();
  return <>
    <PageHeader title="Payments" description="Canonical payment ledger linked to each complete loan summary." />
    <div className="card overflow-hidden">{loading ? <Skeleton className="h-96" /> : payments.length ? <div className="overflow-x-auto"><table className="min-w-full divide-y divide-slate-200 text-sm dark:divide-slate-800"><thead className="bg-slate-50 text-left text-xs uppercase text-slate-500 dark:bg-slate-900"><tr><th className="px-4 py-3">Borrower</th><th className="px-4 py-3">Date</th><th className="px-4 py-3">Type</th><th className="px-4 py-3">Amount</th><th className="px-4 py-3">Current Outstanding</th><th className="px-4 py-3">Remarks</th></tr></thead><tbody className="divide-y divide-slate-100 dark:divide-slate-800">{payments.map((payment) => <tr key={payment.id} className="hover:bg-slate-50 dark:hover:bg-slate-900"><td className="px-4 py-3"><button className="font-bold text-brand-700 hover:underline" onClick={() => openPerson(payment.loanId)}>{payment.borrowerName || '-'}</button></td><td className="px-4 py-3">{date(payment.paymentDate)}</td><td className="px-4 py-3 capitalize">{payment.paymentType}</td><td className="px-4 py-3 font-bold text-emerald-700">{money(payment.amount)}</td><td className="px-4 py-3 font-bold">{money(payment.currentOutstanding)}</td><td className="px-4 py-3 text-slate-500">{payment.notes || '-'}</td></tr>)}</tbody></table></div> : <EmptyState title="No payments yet" />}</div>
  </>;
}
