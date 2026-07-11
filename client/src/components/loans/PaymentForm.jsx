import { useForm } from 'react-hook-form';

export default function PaymentForm({ loanId, initialValues = {}, onSubmit, onCancel }) {
  const { register, handleSubmit } = useForm({
    defaultValues: {
      loanId,
      paymentDate: new Date().toISOString().slice(0, 10),
      amount: '',
      paymentType: 'mixed',
      notes: '',
      ...initialValues
    }
  });

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="grid gap-3 md:grid-cols-[1fr_1fr_1fr_2fr_auto]">
      <input type="hidden" {...register('loanId')} />
      <input className="input" type="date" {...register('paymentDate', { required: true })} />
      <input className="input" type="number" min="0" step="0.01" placeholder="Amount" {...register('amount', { required: true })} />
      <select className="input" {...register('paymentType')}>
        <option value="interest">Interest</option>
        <option value="principal">Principal</option>
        <option value="mixed">Mixed</option>
      </select>
      <input className="input" placeholder="Notes" {...register('notes')} />
      <div className="flex gap-2">
        {onCancel ? <button type="button" className="btn-secondary" onClick={onCancel}>Cancel</button> : null}
        <button className="btn-primary">Save</button>
      </div>
    </form>
  );
}
