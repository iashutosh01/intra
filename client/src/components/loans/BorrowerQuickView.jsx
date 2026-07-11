import { X } from 'lucide-react';
import { useEffect } from 'react';
import { Link } from 'react-router-dom';
import EmptyState from '../common/EmptyState.jsx';
import Skeleton from '../common/Skeleton.jsx';
import { date, money, percent } from '../../utils/format.js';

const Metric = ({ label, value }) => (
  <div className="rounded-lg bg-slate-50 p-3 dark:bg-slate-950">
    <p className="text-xs font-semibold uppercase text-slate-500">{label}</p>
    <p className="mt-1 font-bold">{value}</p>
  </div>
);

export default function BorrowerQuickView({ open, loan, loading, onClose, onEdit, onDelete }) {
  useEffect(() => {
    if (!open) return undefined;
    const onKeyDown = (event) => {
      if (event.key === 'Escape') onClose();
    };
    window.addEventListener('keydown', onKeyDown);
    return () => window.removeEventListener('keydown', onKeyDown);
  }, [open, onClose]);

  if (!open) return null;

  return (
    <div className="fixed inset-0 z-50 grid place-items-center bg-slate-950/50 p-4" onMouseDown={onClose}>
      <section
        className="card max-h-[90vh] w-full max-w-5xl overflow-hidden animate-[fadeIn_.18s_ease-out]"
        role="dialog"
        aria-modal="true"
        aria-label="Borrower quick view"
        onMouseDown={(event) => event.stopPropagation()}
      >
        <div className="flex items-start justify-between border-b border-slate-200 p-5 dark:border-slate-800">
          <div>
            <p className="text-sm text-slate-500">Borrower Quick View</p>
            <h2 className="text-2xl font-bold">{loan?.borrowerName || 'Loading...'}</h2>
            <p className="mt-1 text-sm text-slate-500">{loan?.phone || '-'} - {loan?.address || '-'}</p>
          </div>
          <button className="btn-secondary p-2" onClick={onClose} aria-label="Close borrower quick view" title="Close">
            <X size={18} />
          </button>
        </div>

        {loading ? <div className="p-5"><Skeleton className="h-[60vh]" /></div> : loan ? (
          <div className="max-h-[calc(90vh-88px)] overflow-y-auto p-5">
            <div className="grid gap-3 md:grid-cols-2 xl:grid-cols-4">
              <Metric label="Loan Date" value={date(loan.loanDate)} />
              <Metric label="Interest Start" value={date(loan.interestStartDate)} />
              <Metric label="Principal" value={money(loan.principal)} />
              <Metric label="Interest Rate" value={percent(loan.interestRate)} />
              <Metric label="Current Interest" value={money(loan.outstandingInterest)} />
              <Metric label="Interest Paid" value={money(loan.interestPaid)} />
              <Metric label="Principal Paid" value={money(loan.principalPaid)} />
              <Metric label="Outstanding Principal" value={money(loan.outstandingPrincipal ?? loan.remainingPrincipal)} />
              <Metric label="Current Outstanding" value={money(loan.currentOutstanding)} />
              <Metric label="Loan Duration" value={loan.loanDuration} />
              <Metric label="Interest Duration" value={loan.interestDuration} />
              <Metric label="Last Payment" value={date(loan.lastPaymentDate)} />
            </div>

            <div className="mt-6 grid gap-6 xl:grid-cols-2">
              <div>
                <h3 className="mb-3 font-bold">Recent Payments</h3>
                <div className="space-y-2">
                  {(loan.payments || []).slice(0, 5).map((payment) => (
                    <div key={payment.id} className="flex justify-between rounded-lg border border-slate-200 p-3 text-sm dark:border-slate-800">
                      <span>{date(payment.paymentDate)} - {payment.paymentType}</span>
                      <strong>{money(payment.amount)}</strong>
                    </div>
                  ))}
                  {!loan.payments?.length ? <EmptyState title="No payments yet" /> : null}
                </div>
              </div>
              <div>
                <h3 className="mb-3 font-bold">Activity Timeline</h3>
                <div className="space-y-2">
                  {(loan.activity || []).slice(0, 5).map((item) => (
                    <div key={item.id} className="rounded-lg border border-slate-200 p-3 text-sm dark:border-slate-800">
                      <p className="font-semibold">{item.action}</p>
                      <p className="text-slate-500">{date(item.timestamp)} {item.notes ? `- ${item.notes}` : ''}</p>
                    </div>
                  ))}
                  {!loan.activity?.length ? <EmptyState title="No activity yet" /> : null}
                </div>
              </div>
            </div>

            <div className="mt-6 flex flex-wrap justify-end gap-2">
              <button className="btn-secondary" onClick={onEdit}>Edit Loan</button>
              <button className="btn-secondary text-red-600" onClick={onDelete}>Delete Loan</button>
              <Link className="btn-primary" to={`/loans/${loan.id}`}>View Full Details</Link>
            </div>
          </div>
        ) : <div className="p-5"><EmptyState title="Loan not found" /></div>}
      </section>
    </div>
  );
}
