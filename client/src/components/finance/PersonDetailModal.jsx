import { Pencil, Trash2, X } from 'lucide-react';
import { useEffect, useState } from 'react';
import toast from 'react-hot-toast';
import { useFinance } from '../../context/FinanceContext.jsx';
import { date, money, percent } from '../../utils/format.js';
import ConfirmDialog from '../common/ConfirmDialog.jsx';
import EmptyState from '../common/EmptyState.jsx';
import LoanForm from '../loans/LoanForm.jsx';
import PaymentForm from '../loans/PaymentForm.jsx';
import HistoryTimeline from './HistoryTimeline.jsx';
import PaymentTimeline from './PaymentTimeline.jsx';
import SummaryCards from './SummaryCards.jsx';
import { StatusBadge } from './Badges.jsx';

export default function PersonDetailModal({ loanId, open, onClose }) {
  const { getLoan, actions } = useFinance();
  const loan = getLoan(loanId);
  const [editingLoan, setEditingLoan] = useState(false);
  const [editingPayment, setEditingPayment] = useState(null);
  const [confirm, setConfirm] = useState(null);

  useEffect(() => {
    if (!open) return undefined;
    const onKeyDown = (event) => { if (event.key === 'Escape') onClose(); };
    window.addEventListener('keydown', onKeyDown);
    return () => window.removeEventListener('keydown', onKeyDown);
  }, [onClose, open]);

  useEffect(() => { setEditingLoan(false); setEditingPayment(null); setConfirm(null); }, [loanId]);
  if (!open) return null;

  const saveLoan = async (payload) => {
    await actions.updateLoan(loan.id, payload);
    setEditingLoan(false);
    toast.success('Loan updated and recalculated');
  };
  const savePayment = async (payload) => {
    if (editingPayment) await actions.updatePayment(editingPayment.id, payload);
    else await actions.addPayment(payload);
    setEditingPayment(null);
    toast.success(editingPayment ? 'Payment updated and recalculated' : 'Payment recorded and recalculated');
  };
  const remove = async () => {
    if (confirm?.type === 'payment') {
      await actions.deletePayment(confirm.id);
      toast.success('Payment deleted and recalculated');
      setConfirm(null);
      return;
    }
    await actions.deleteLoan(loan.id);
    toast.success('Loan deleted');
    onClose();
  };

  const summaryItems = loan ? [
    ['Principal', money(loan.principal)],
    ['Interest Rate', percent(loan.interestRate)],
    ['Principal Paid', money(loan.principalPaid)],
    ['Interest Paid', money(loan.interestPaid)],
    ['Outstanding Interest', money(loan.outstandingInterest)],
    ['Outstanding Principal', money(loan.remainingPrincipal)],
    ['Current Outstanding', money(loan.currentOutstanding)],
    ['Total Interest Generated', money(loan.totalInterestGenerated)],
    ['Loan Date', date(loan.loanDate)],
    ['Interest Start Date', date(loan.interestStartDate)],
    ['Last Payment Date', date(loan.lastPaymentDate)],
    ['Next Interest Due', date(loan.nextInterestDue)],
    ['Loan Duration', loan.loanDuration],
    ['Interest Duration', loan.interestDuration],
    ['Payment Count', loan.paymentCount],
    ['Days Since Last Payment', loan.daysSinceLastPayment ?? '-']
  ] : [];

  return <div className="fixed inset-0 z-50 grid place-items-center bg-slate-950/50 p-4" onMouseDown={onClose}>
    <section className="card max-h-[94vh] w-full max-w-6xl overflow-hidden" role="dialog" aria-modal="true" aria-label="Person details" onMouseDown={(event) => event.stopPropagation()}>
      <header className="flex items-start justify-between border-b border-slate-200 p-5 dark:border-slate-800">
        <div><p className="text-sm text-slate-500">Person Detail</p><div className="flex items-center gap-3"><h2 className="text-2xl font-bold">{loan?.borrowerName || 'Loan not found'}</h2>{loan ? <StatusBadge loan={loan} /> : null}</div><p className="mt-1 text-sm text-slate-500">{loan?.phone || '-'} · {loan?.address || '-'}</p></div>
        <button className="btn-secondary p-2" onClick={onClose} aria-label="Close person detail"><X size={18} /></button>
      </header>
      {!loan ? <div className="p-6"><EmptyState title="Loan not found" /></div> : <div className="max-h-[calc(94vh-92px)] space-y-6 overflow-y-auto p-5">
        <div className="flex flex-wrap justify-end gap-2"><button className="btn-secondary" onClick={() => setEditingLoan((value) => !value)}><Pencil size={16} />Edit Loan</button><button className="btn-secondary text-red-600" onClick={() => setConfirm({ type: 'loan' })}><Trash2 size={16} />Delete Loan</button></div>
        {editingLoan ? <LoanForm initialValues={loan} onSubmit={saveLoan} onCancel={() => setEditingLoan(false)} /> : null}
        <section><h3 className="mb-3 text-lg font-bold">Financial & Loan Summary</h3><SummaryCards items={summaryItems} /></section>
        <section className="rounded-lg border border-slate-200 p-4 dark:border-slate-800"><h3 className="font-bold">Remarks</h3><p className="mt-2 text-sm text-slate-600 dark:text-slate-300">{loan.remarks || 'No remarks'}</p></section>
        <section className="card p-4"><h3 className="mb-4 text-lg font-bold">{editingPayment ? 'Edit Payment' : 'Add Payment'}</h3><PaymentForm loanId={loan.id} initialValues={editingPayment || {}} onSubmit={savePayment} onCancel={editingPayment ? () => setEditingPayment(null) : undefined} /></section>
        <div className="grid gap-6 xl:grid-cols-2"><section><h3 className="mb-3 text-lg font-bold">Payment Timeline</h3><PaymentTimeline items={loan.paymentTimeline} onEdit={setEditingPayment} onDelete={(payment) => setConfirm({ type: 'payment', id: payment.id })} /></section><section><h3 className="mb-3 text-lg font-bold">History Timeline</h3><HistoryTimeline items={loan.historyTimeline} /></section></div>
      </div>}
    </section>
    <ConfirmDialog open={!!confirm} title={confirm?.type === 'loan' ? 'Delete loan?' : 'Delete payment?'} message="This will write a history record and recalculate dependent values." onClose={() => setConfirm(null)} onConfirm={remove} />
  </div>;
}
