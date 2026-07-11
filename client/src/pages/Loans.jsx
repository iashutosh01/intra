import { Download, FileSpreadsheet, FileText, Plus, Search, SlidersHorizontal } from 'lucide-react';
import { useMemo, useState } from 'react';
import toast from 'react-hot-toast';
import { Link } from 'react-router-dom';
import EmptyState from '../components/common/EmptyState.jsx';
import PageHeader from '../components/common/PageHeader.jsx';
import Skeleton from '../components/common/Skeleton.jsx';
import LoanForm from '../components/loans/LoanForm.jsx';
import { useAsync } from '../hooks/useAsync.js';
import { useDebounce } from '../hooks/useDebounce.js';
import { endpoints } from '../services/api.js';
import { date, money, percent } from '../utils/format.js';

export default function Loans() {
  const [showForm, setShowForm] = useState(false);
  const [search, setSearch] = useState('');
  const [sort, setSort] = useState('newest');
  const [status, setStatus] = useState('');
  const debouncedSearch = useDebounce(search);
  const query = useMemo(() => ({ search: debouncedSearch, sort, status }), [debouncedSearch, sort, status]);
  const { data = [], loading, refresh } = useAsync(() => endpoints.loans(query), [query]);

  const create = async (payload) => {
    await endpoints.createLoan(payload);
    toast.success('Loan created');
    setShowForm(false);
    refresh();
  };

  const exportCsv = () => {
    const params = new URLSearchParams(query).toString();
    window.location.href = `${import.meta.env.VITE_API_URL || 'http://localhost:5000/api'}/loans/export?${params}`;
  };

  const exportExcel = () => {
    const rows = data.map((loan) => `<tr><td>${loan.borrowerName}</td><td>${loan.principal}</td><td>${loan.currentOutstanding}</td><td>${loan.status}</td></tr>`).join('');
    const blob = new Blob([`<table><tr><th>Name</th><th>Principal</th><th>Outstanding</th><th>Status</th></tr>${rows}</table>`], { type: 'application/vnd.ms-excel' });
    const link = document.createElement('a');
    link.href = URL.createObjectURL(blob);
    link.download = 'loans.xls';
    link.click();
  };

  return (
    <>
      <PageHeader
        title="Loans"
        description="Search, sort, filter, export, and inspect recalculated loan state."
        actions={<><button className="btn-secondary" onClick={exportCsv}><Download size={16} />CSV</button><button className="btn-secondary" onClick={exportExcel}><FileSpreadsheet size={16} />Excel</button><button className="btn-secondary" onClick={() => window.print()}><FileText size={16} />PDF</button><button className="btn-primary" onClick={() => setShowForm(true)}><Plus size={16} />Add Loan</button></>}
      />
      {showForm ? <div className="mb-6"><LoanForm onSubmit={create} onCancel={() => setShowForm(false)} /></div> : null}
      <div className="card mb-5 p-4">
        <div className="grid gap-3 lg:grid-cols-[1fr_180px_180px]">
          <label className="relative"><Search className="absolute left-3 top-2.5 text-slate-400" size={18} /><input className="input pl-10" placeholder="Search name, phone, remarks" value={search} onChange={(e) => setSearch(e.target.value)} /></label>
          <label className="relative"><SlidersHorizontal className="absolute left-3 top-2.5 text-slate-400" size={18} /><select className="input pl-10" value={sort} onChange={(e) => setSort(e.target.value)}><option value="newest">Newest</option><option value="oldest">Oldest</option><option value="name">Name</option><option value="amount">Amount</option><option value="interest">Interest</option><option value="outstanding">Outstanding</option><option value="duration">Duration</option><option value="highest">Highest</option><option value="lowest">Lowest</option></select></label>
          <select className="input" value={status} onChange={(e) => setStatus(e.target.value)}><option value="">All Status</option><option value="active">Active</option><option value="closed">Closed</option></select>
        </div>
      </div>
      <div className="card overflow-hidden">
        {loading ? <Skeleton className="h-96" /> : data.length ? (
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-slate-200 text-sm dark:divide-slate-800">
              <thead className="bg-slate-50 text-left text-xs uppercase text-slate-500 dark:bg-slate-900">
                <tr>{['Borrower', 'Principal', 'Rate', 'Loan Date', 'Duration', 'Interest', 'Remaining', 'Outstanding', 'Status', 'Actions'].map((h) => <th key={h} className="px-4 py-3 font-bold">{h}</th>)}</tr>
              </thead>
              <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
                {data.map((loan) => (
                  <tr key={loan.id} className="transition hover:bg-blue-50/60 dark:hover:bg-slate-900">
                    <td className="px-4 py-3"><p className="font-bold">{loan.borrowerName}</p><p className="text-xs text-slate-500">{loan.phone || '-'}</p></td>
                    <td className="px-4 py-3">{money(loan.principal)}</td>
                    <td className="px-4 py-3">{percent(loan.interestRate)}</td>
                    <td className="px-4 py-3">{date(loan.loanDate)}</td>
                    <td className="px-4 py-3">{loan.loanDuration}</td>
                    <td className="px-4 py-3">{money(loan.outstandingInterest)}</td>
                    <td className="px-4 py-3">{money(loan.remainingPrincipal)}</td>
                    <td className="px-4 py-3 font-bold">{money(loan.currentOutstanding)}</td>
                    <td className="px-4 py-3"><span className={`rounded-full px-2 py-1 text-xs font-bold ${loan.status === 'active' ? 'bg-blue-50 text-blue-700 dark:bg-blue-950' : 'bg-emerald-50 text-emerald-700 dark:bg-emerald-950'}`}>{loan.status}</span></td>
                    <td className="px-4 py-3"><Link className="font-bold text-brand-600" to={`/loans/${loan.id}`}>Open</Link></td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        ) : <EmptyState title="No loans found" />}
      </div>
    </>
  );
}
