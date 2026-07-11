import { Download, FileSpreadsheet, FileText, Plus, Search, SlidersHorizontal } from 'lucide-react';
import { useEffect, useMemo, useRef, useState } from 'react';
import toast from 'react-hot-toast';
import { Link } from 'react-router-dom';
import ConfirmDialog from '../components/common/ConfirmDialog.jsx';
import EmptyState from '../components/common/EmptyState.jsx';
import PageHeader from '../components/common/PageHeader.jsx';
import Skeleton from '../components/common/Skeleton.jsx';
import BorrowerQuickView from '../components/loans/BorrowerQuickView.jsx';
import LoanForm from '../components/loans/LoanForm.jsx';
import { useAsync } from '../hooks/useAsync.js';
import { endpoints } from '../services/api.js';
import { date, money, percent } from '../utils/format.js';

const getLoanStatus = (loan) => {
  if (loan.status === 'closed') return { label: 'Closed', className: 'bg-slate-100 text-slate-700 dark:bg-slate-800 dark:text-slate-200' };
  if (loan.outstandingInterest > 0 && Number(loan.daysSinceLastPayment || 0) > 45) return { label: 'Overdue', className: 'bg-red-50 text-red-700 dark:bg-red-950 dark:text-red-200' };
  if (loan.outstandingInterest > 0) return { label: 'Interest Due', className: 'bg-orange-50 text-orange-700 dark:bg-orange-950 dark:text-orange-200' };
  return { label: 'Active', className: 'bg-emerald-50 text-emerald-700 dark:bg-emerald-950 dark:text-emerald-200' };
};

export default function Loans() {
  const [showForm, setShowForm] = useState(false);
  const [search, setSearch] = useState('');
  const [sort, setSort] = useState(() => localStorage.getItem('loans.sort') || 'newest');
  const [status, setStatus] = useState(() => localStorage.getItem('loans.status') || '');
  const [editingLoan, setEditingLoan] = useState(null);
  const [quickView, setQuickView] = useState({ open: false, id: '', loan: null, loading: false });
  const [confirmDelete, setConfirmDelete] = useState(null);
  const [highlightId, setHighlightId] = useState('');
  const searchRef = useRef(null);
  const rowRefs = useRef({});
  const query = useMemo(() => ({ search, sort, status }), [search, sort, status]);
  const { data = [], loading, refresh } = useAsync(() => endpoints.loans(query), [query]);

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
        setQuickView((value) => ({ ...value, open: false }));
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
    const response = await endpoints.createLoan(payload);
    toast.success('Loan created');
    setShowForm(false);
    setHighlightId(response.data.id);
    refresh();
  };

  const update = async (payload) => {
    const response = await endpoints.updateLoan(editingLoan.id, payload);
    toast.success('Loan updated');
    setEditingLoan(null);
    setShowForm(false);
    setHighlightId(response.data.id);
    refresh();
  };

  const openQuickView = async (loan) => {
    setQuickView({ open: true, id: loan.id, loan, loading: true });
    try {
      const response = await endpoints.loan(loan.id);
      setQuickView({ open: true, id: loan.id, loan: response.data, loading: false });
    } catch (error) {
      toast.error(error.message);
      setQuickView({ open: false, id: '', loan: null, loading: false });
    }
  };

  const deleteLoan = async () => {
    await endpoints.deleteLoan(confirmDelete.id);
    toast.success('Loan deleted');
    setConfirmDelete(null);
    setQuickView({ open: false, id: '', loan: null, loading: false });
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
                    <td className="px-4 py-3"><button className="text-left font-bold text-brand-700 hover:underline" onClick={() => openQuickView(loan)}>{loan.borrowerName}</button><p className="text-xs text-slate-500">{loan.phone || '-'}</p></td>
                    <td className="px-4 py-3">{money(loan.principal)}</td>
                    <td className="px-4 py-3">{percent(loan.interestRate)}</td>
                    <td className="px-4 py-3">{date(loan.loanDate)}</td>
                    <td className="px-4 py-3">{loan.loanDuration}</td>
                    <td className="px-4 py-3 font-semibold text-orange-700 dark:text-orange-300">{money(loan.outstandingInterest)}</td>
                    <td className="px-4 py-3">{money(loan.remainingPrincipal)}</td>
                    <td className="px-4 py-3 font-bold text-slate-950 dark:text-white">{money(loan.currentOutstanding)}</td>
                    <td className="px-4 py-3"><span className={`rounded-full px-2 py-1 text-xs font-bold ${getLoanStatus(loan).className}`}>{getLoanStatus(loan).label}</span></td>
                    <td className="px-4 py-3"><Link className="font-bold text-brand-600" to={`/loans/${loan.id}`}>Open</Link></td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        ) : <EmptyState title="No loans found" />}
      </div>
      <BorrowerQuickView
        open={quickView.open}
        loan={quickView.loan}
        loading={quickView.loading}
        onClose={() => setQuickView({ open: false, id: '', loan: null, loading: false })}
        onEdit={() => {
          setEditingLoan(quickView.loan);
          setQuickView({ open: false, id: '', loan: null, loading: false });
        }}
        onDelete={() => setConfirmDelete(quickView.loan)}
      />
      <ConfirmDialog
        open={!!confirmDelete}
        title="Delete loan?"
        message="This will delete the loan, remove its payments, and write a history record."
        onClose={() => setConfirmDelete(null)}
        onConfirm={deleteLoan}
      />
    </>
  );
}
