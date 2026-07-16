import { useEffect, useState } from 'react';
import { useForm } from 'react-hook-form';
import { useFinance } from '../../context/FinanceContext.jsx';
import { money } from '../../utils/format.js';

export default function PaymentForm({ loanId, initialValues = {}, onSubmit, onCancel }) {
  const { actions } = useFinance();
  const [preview, setPreview] = useState(null);
  const { register, handleSubmit, watch } = useForm({
    defaultValues: {
      loanId,
      paymentDate: new Date().toISOString().slice(0, 10),
      amount: '',
      paymentType: 'mixed',
      notes: '',
      ...initialValues
    }
  });
  const amount = watch('amount');
  const paymentDate = watch('paymentDate');
  const paymentType = watch('paymentType');

  useEffect(() => {
    if (!loanId || !amount || Number(amount) <= 0) {
      setPreview(null);
      return undefined;
    }
    const timer = setTimeout(async () => {
      try {
        setPreview(await actions.previewPayment({ loanId, amount, paymentDate, paymentType }));
      } catch {
        setPreview(null);
      }
    }, 250);
    return () => clearTimeout(timer);
  }, [actions, loanId, amount, paymentDate, paymentType]);

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="space-y-3">
      <div className="grid gap-3 md:grid-cols-[1fr_1fr_1fr_2fr_auto]">
        <input type="hidden" {...register('loanId')} />
        <input className="input" type="date" aria-label="Payment date" {...register('paymentDate', { required: true })} />
        <input className="input" type="number" min="0" step="0.01" placeholder="Amount" aria-label="Payment amount" {...register('amount', { required: true })} />
        <select className="input" aria-label="Payment type" {...register('paymentType')}>
          <option value="interest">Interest</option>
          <option value="principal">Principal</option>
          <option value="mixed">Mixed</option>
        </select>
        <input className="input" placeholder="Notes" aria-label="Payment notes" {...register('notes')} />
        <div className="flex gap-2">
          {onCancel ? <button type="button" className="btn-secondary" onClick={onCancel}>Cancel</button> : null}
          <button className="btn-primary">Save</button>
        </div>
      </div>
      {preview ? (
        <div className="rounded-lg border border-blue-100 bg-blue-50/70 p-4 text-sm dark:border-blue-900 dark:bg-blue-950/30">
          <div className="grid gap-3 md:grid-cols-3">
            <p><span className="text-slate-500">Outstanding Interest</span><br /><strong>{money(preview.outstandingInterest)}</strong></p>
            <p><span className="text-slate-500">Outstanding Principal</span><br /><strong>{money(preview.outstandingPrincipal)}</strong></p>
            <p><span className="text-slate-500">Current Total</span><br /><strong>{money(preview.currentOutstanding)}</strong></p>
          </div>
          <div className="mt-3 grid gap-2 md:grid-cols-2">
            <div className="rounded-md bg-white p-3 dark:bg-slate-900">Interest: <strong>{money(preview.interestApplied)}</strong></div>
            <div className="rounded-md bg-white p-3 dark:bg-slate-900">Principal: <strong>{money(preview.principalApplied)}</strong></div>
          </div>
          <p className="mt-3 font-semibold text-slate-700 dark:text-slate-200">
            {preview.interestRemaining <= 0 && preview.interestApplied > 0
              ? 'Interest will be fully settled.'
              : `${money(preview.interestRemaining)} interest will remain.`}
          </p>
        </div>
      ) : null}
    </form>
  );
}
