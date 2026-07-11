import { ArrowLeft, Pencil, Trash2 } from 'lucide-react';
import { useState } from 'react';
import toast from 'react-hot-toast';
import { Link, useNavigate, useParams } from 'react-router-dom';
import ConfirmDialog from '../components/common/ConfirmDialog.jsx';
import EmptyState from '../components/common/EmptyState.jsx';
import PageHeader from '../components/common/PageHeader.jsx';
import Skeleton from '../components/common/Skeleton.jsx';
import LoanForm from '../components/loans/LoanForm.jsx';
import PaymentForm from '../components/loans/PaymentForm.jsx';
import { useAsync } from '../hooks/useAsync.js';
import { endpoints } from '../services/api.js';
import { date, money, percent } from '../utils/format.js';

export default function LoanDetails() {
  const { id } = useParams();
  const navigate = useNavigate();
  const [editing, setEditing] = useState(false);
  const [editingPayment, setEditingPayment] = useState(null);
  const [confirm, setConfirm] = useState(null);
  const { data: loan, loading, refresh } = useAsync(() => endpoints.loan(id), [id]);

  if (loading) return <Skeleton className="h-[70vh]" />;
  if (!loan) return <EmptyState title="Loan not found" />;

  const saveLoan = async (payload) => {
    await endpoints.updateLoan(id, payload);
    toast.success('Loan updated and recalculated');
    setEditing(false);
    refresh();
  };

  const addPayment = async (payload) => {
    await endpoints.addPayment(payload);
    toast.success('Payment recorded and recalculated');
    refresh();
  };

  const updatePayment = async (payload) => {
    await endpoints.updatePayment(editingPayment.id, payload);
    toast.success('Payment updated and recalculated');
    setEditingPayment(null);
    refresh();
  };

  const deletePayment = async (paymentId) => {
    await endpoints.deletePayment(paymentId);
    toast.success('Payment deleted and recalculated');
    setConfirm(null);
    refresh();
  };

  const deleteLoan = async () => {
    await endpoints.deleteLoan(id);
    toast.success('Loan deleted');
    navigate('/loans');
  };

  const metrics = [
    ['Principal', money(loan.principal)],
    ['Interest Rate', percent(loan.interestRate)],
    ['Last Interest Paid', date(loan.lastInterestPaidDate)],
    ['Principal Paid', money(loan.principalPaid)],
    ['Interest Paid', money(loan.interestPaid)],
    ['Outstanding Interest', money(loan.outstandingInterest)],
    ['Outstanding Principal', money(loan.remainingPrincipal)],
    ['Current Total', money(loan.currentOutstanding)],
    ['Loan Duration', loan.loanDuration],
    ['Interest Duration', loan.interestDuration],
    ['Total Months', loan.totalMonths],
    ['Total Years', loan.totalYears]
  ];

  return (
    <>
      <PageHeader
        title={loan.borrowerName}
        description={`${loan.phone || 'No phone'} • ${loan.address || 'No address'}`}
        actions={<><Link className="btn-secondary" to="/loans"><ArrowLeft size={16} />Back</Link><button className="btn-secondary" onClick={() => setEditing((v) => !v)}><Pencil size={16} />Edit</button><button className="btn-secondary text-red-600" onClick={() => setConfirm({ type: 'loan' })}><Trash2 size={16} />Delete</button></>}
      />
      {editing ? <div className="mb-6"><LoanForm initialValues={loan} onSubmit={saveLoan} onCancel={() => setEditing(false)} /></div> : null}

      <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
        {metrics.map(([label, value]) => (
          <div key={label} className="card p-4">
            <p className="text-sm text-slate-500">{label}</p>
            <p className="mt-2 text-lg font-bold">{value}</p>
          </div>
        ))}
      </div>

      <div className="mt-6 grid gap-6 xl:grid-cols-[1.2fr_0.8fr]">
        <section className="card p-5">
          <h2 className="mb-4 text-lg font-bold">Add Payment</h2>
          {editingPayment ? (
            <PaymentForm loanId={loan.id} initialValues={editingPayment} onSubmit={updatePayment} onCancel={() => setEditingPayment(null)} />
          ) : (
            <PaymentForm loanId={loan.id} onSubmit={addPayment} />
          )}
          <h2 className="mb-4 mt-8 text-lg font-bold">Payment Timeline</h2>
          {loan.payments?.length ? (
            <div className="overflow-x-auto">
              <table className="min-w-full text-sm">
                <thead className="text-left text-xs uppercase text-slate-500"><tr><th className="py-2">Date</th><th>Type</th><th>Amount</th><th>Notes</th><th></th></tr></thead>
                <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
                  {loan.payments.map((payment) => (
                    <tr key={payment.id}>
                      <td className="py-3">{date(payment.paymentDate)}</td>
                      <td className="capitalize">{payment.paymentType}</td>
                      <td className="font-bold">{money(payment.amount)}</td>
                      <td className="text-slate-500">{payment.notes || '-'}</td>
                      <td>
                        <div className="flex gap-2">
                          <button className="text-brand-600" onClick={() => setEditingPayment(payment)} aria-label="Edit payment"><Pencil size={16} /></button>
                          <button className="text-red-600" onClick={() => setConfirm({ type: 'payment', id: payment.id })} aria-label="Delete payment"><Trash2 size={16} /></button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          ) : <EmptyState title="No payments yet" />}
        </section>
        <section className="card p-5">
          <h2 className="mb-4 text-lg font-bold">Activity Timeline</h2>
          <div className="space-y-3">
            {loan.activity?.map((item) => (
              <div key={item.id} className="rounded-lg border border-slate-200 p-3 dark:border-slate-800">
                <p className="font-semibold">{item.action}</p>
                <p className="text-sm text-slate-500">{date(item.timestamp)} {item.notes ? `- ${item.notes}` : ''}</p>
              </div>
            ))}
            {!loan.activity?.length ? <EmptyState title="No history yet" /> : null}
          </div>
        </section>
      </div>

      <ConfirmDialog
        open={!!confirm}
        title={confirm?.type === 'loan' ? 'Delete loan?' : 'Delete payment?'}
        message="This will write a history record and recalculate dependent values."
        onClose={() => setConfirm(null)}
        onConfirm={() => (confirm?.type === 'loan' ? deleteLoan() : deletePayment(confirm.id))}
      />
    </>
  );
}
