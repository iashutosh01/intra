import { useForm } from 'react-hook-form';

export default function LoanForm({ initialValues = {}, onSubmit, onCancel, loading }) {
  const { register, handleSubmit } = useForm({
    defaultValues: {
      borrowerName: '',
      phone: '',
      address: '',
      principal: '',
      interestRate: '',
      loanDate: new Date().toISOString().slice(0, 10),
      interestStartDate: new Date().toISOString().slice(0, 10),
      status: 'active',
      remarks: '',
      ...initialValues
    }
  });

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="card p-5">
      <div className="grid gap-4 md:grid-cols-2">
        <label className="text-sm font-semibold">Borrower Name<input className="input mt-1" {...register('borrowerName', { required: true })} /></label>
        <label className="text-sm font-semibold">Phone<input className="input mt-1" {...register('phone')} /></label>
        <label className="text-sm font-semibold md:col-span-2">Address<input className="input mt-1" {...register('address')} /></label>
        <label className="text-sm font-semibold">Principal Amount<input className="input mt-1" type="number" min="0" step="0.01" {...register('principal', { required: true })} /></label>
        <label className="text-sm font-semibold">Monthly Interest Rate<input className="input mt-1" type="number" min="0" step="0.01" {...register('interestRate', { required: true })} /></label>
        <label className="text-sm font-semibold">Loan Date<input className="input mt-1" type="date" {...register('loanDate', { required: true })} /></label>
        <label className="text-sm font-semibold">Interest Start Date<input className="input mt-1" type="date" {...register('interestStartDate', { required: true })} /></label>
        <label className="text-sm font-semibold">Status<select className="input mt-1" {...register('status')}><option value="active">Active</option><option value="closed">Closed</option></select></label>
        <label className="text-sm font-semibold md:col-span-2">Remarks<textarea className="input mt-1 min-h-24" {...register('remarks')} /></label>
      </div>
      <div className="mt-5 flex justify-end gap-2">
        {onCancel ? <button type="button" className="btn-secondary" onClick={onCancel}>Cancel</button> : null}
        <button className="btn-primary" disabled={loading}>{loading ? 'Saving...' : 'Save Loan'}</button>
      </div>
    </form>
  );
}
