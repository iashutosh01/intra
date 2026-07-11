import PageHeader from '../components/common/PageHeader.jsx';

export default function Payments() {
  return (
    <>
      <PageHeader title="Payments" description="Payments are managed from each loan detail page so the ledger can show the before-and-after context." />
      <div className="card p-6 text-sm text-slate-600 dark:text-slate-300">
        Open a loan, add an Interest, Principal, or Mixed payment, and the backend will recalculate every affected value from the raw payment history.
      </div>
    </>
  );
}
