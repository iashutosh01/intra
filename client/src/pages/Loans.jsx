import { Download, FileSpreadsheet, FileText, Plus, Search, SlidersHorizontal } from 'lucide-react';
import { useEffect, useMemo, useRef, useState } from 'react';
import toast from 'react-hot-toast';
import EmptyState from '../components/common/EmptyState.jsx';
import PageHeader from '../components/common/PageHeader.jsx';
import Skeleton from '../components/common/Skeleton.jsx';
import LoanForm from '../components/loans/LoanForm.jsx';
import { StatusBadge } from '../components/finance/Badges.jsx';
import { useFinance } from '../context/FinanceContext.jsx';
import { date, money, percent } from '../utils/format.js';

export default function Loans() {
  const { actions, loading, openPerson, selectLoans } = useFinance();
  const [showForm, setShowForm] = useState(false);
  const [search, setSearch] = useState('');
  const [sort, setSort] = useState(() => localStorage.getItem('loans.sort') || 'newest');
  const [status, setStatus] = useState(() => localStorage.getItem('loans.status') || '');
  const [editingLoan, setEditingLoan] = useState(null);
  const [highlightId, setHighlightId] = useState('');
  const searchRef = useRef(null);
  const rowRefs = useRef({});
  const query = useMemo(() => ({ search, sort, status }), [search, sort, status]);
  const data = useMemo(() => selectLoans(query), [query, selectLoans]);

  useEffect(() => {
    localStorage.setItem('loans.sort', sort);
    localStorage.setItem('loans.status', status);
  }, [sort, status]);

  useEffect(() => {
    const onKeyDown = (event) => {
      if (event.ctrlKey && event.key.toLowerCase() === 'n') {
        event.preventDefault();
        setShowForm(true);
      }
      if (event.ctrlKey && event.key.toLowerCase() === 'f') {
        event.preventDefault();
        searchRef.current?.focus();
      }
      if (event.key === 'Escape') {
        setShowForm(false);
        setEditingLoan(null);
      }
    };
    window.addEventListener('keydown', onKeyDown);
    return () => window.removeEventListener('keydown', onKeyDown);
  }, []);

  useEffect(() => {
    if (!highlightId || loading) return;
    rowRefs.current[highlightId]?.scrollIntoView({ behavior: 'smooth', block: 'center' });
    const timer = setTimeout(() => setHighlightId(''), 1800);
    return () => clearTimeout(timer);
  }, [highlightId, loading, data]);

  const create = async (payload) => {
    const response = await actions.createLoan(payload);
    toast.success('Loan created');
    setShowForm(false);
    setHighlightId(response.id);
  };

  const update = async (payload) => {
    const response = await actions.updateLoan(editingLoan.id, payload);
    toast.success('Loan updated');
    setEditingLoan(null);
    setShowForm(false);
    setHighlightId(response.id);
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
        actions={<><button className="btn-secondary" onClick={exportCsv} title="Export CSV"><Download size={16} />CSV</button><button className="btn-secondary" onClick={exportExcel} title="Export Excel"><FileSpreadsheet size={16} />Excel</button><button className="btn-secondary" onClick={() => window.print()} title="Print PDF"><FileText size={16} />PDF</button><button className="btn-primary" onClick={() => setShowForm(true)} title="Ctrl+N"><Plus size={16} />Add Loan</button></>}
      />
      {showForm || editingLoan ? <div className="mb-6"><LoanForm initialValues={editingLoan || {}} onSubmit={editingLoan ? update : create} onCancel={() => { setShowForm(false); setEditingLoan(null); }} /></div> : null}
      <div className="card mb-5 p-4">
        <div className="grid gap-3 lg:grid-cols-[1fr_180px_180px]">
          <label className="relative"><Search className="absolute left-3 top-2.5 text-slate-400" size={18} /><input ref={searchRef} className="input pl-10" placeholder="Search name, phone, remarks" value={search} onChange={(e) => setSearch(e.target.value)} aria-label="Search loans" /></label>
          <label className="relative"><SlidersHorizontal className="absolute left-3 top-2.5 text-slate-400" size={18} /><select className="input pl-10" value={sort} onChange={(e) => setSort(e.target.value)}><option value="newest">Newest</option><option value="oldest">Oldest</option><option value="name">Name</option><option value="amount">Amount</option><option value="interest">Interest</option><option value="outstanding">Outstanding</option><option value="duration">Duration</option><option value="highest">Highest</option><option value="lowest">Lowest</option></select></label>
          <select className="input" value={status} onChange={(e) => setStatus(e.target.value)}><option value="">All Status</option><option value="active">Active</option><option value="closed">Closed</option></select>
        </div>
      </div>
      <div className="card overflow-hidden">
        {loading ? <Skeleton className="h-96" /> : data.length ? (
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-slate-200 text-sm dark:divide-slate-800">
              <thead className="sticky top-0 z-10 bg-slate-50 text-left text-xs uppercase text-slate-500 dark:bg-slate-900">
                <tr>{['Borrower', 'Principal', 'Rate', 'Loan Date', 'Duration', 'Interest', 'Remaining', 'Outstanding', 'Status', 'Actions'].map((h) => <th key={h} className="resize-x overflow-hidden px-4 py-3 font-bold">{h}</th>)}</tr>
              </thead>
              <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
                {data.map((loan) => (
                  <tr key={loan.id} ref={(node) => { rowRefs.current[loan.id] = node; }} className={`transition hover:bg-blue-50/60 dark:hover:bg-slate-900 ${highlightId === loan.id ? 'bg-emerald-50 dark:bg-emerald-950/40' : ''}`}>
                    <td className="px-4 py-3"><button className="text-left font-bold text-brand-700 hover:underline" onClick={() => openPerson(loan.id)}>{loan.borrowerName}</button><p className="text-xs text-slate-500">{loan.phone || '-'}</p></td>
                    <td className="px-4 py-3">{money(loan.principal)}</td>
                    <td className="px-4 py-3">{percent(loan.interestRate)}</td>
                    <td className="px-4 py-3">{date(loan.loanDate)}</td>
                    <td className="px-4 py-3">{loan.loanDuration}</td>
                    <td className="px-4 py-3 font-semibold text-orange-700 dark:text-orange-300">{money(loan.outstandingInterest)}</td>
                    <td className="px-4 py-3">{money(loan.remainingPrincipal)}</td>
                    <td className="px-4 py-3 font-bold text-slate-950 dark:text-white">{money(loan.currentOutstanding)}</td>
                    <td className="px-4 py-3"><StatusBadge loan={loan} /></td>
                    <td className="px-4 py-3"><button className="font-bold text-brand-600" onClick={() => openPerson(loan.id)}>Open</button></td>
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
