import { ChevronDown, Clock3, Search, X } from 'lucide-react';
import { useEffect, useMemo, useRef, useState } from 'react';
import toast from 'react-hot-toast';
import { useFinance } from '../../context/FinanceContext.jsx';
import { date, money } from '../../utils/format.js';
import LoanForm from '../loans/LoanForm.jsx';
import PaymentForm from '../loans/PaymentForm.jsx';

export default function QuickAccessModal({ mode, onClose }) {
  const { actions, loans, payments } = useFinance();
  const [selectedLoanId, setSelectedLoanId] = useState('');
  const [editingPayment, setEditingPayment] = useState(null);
  const [search, setSearch] = useState('');
  const [dropdownOpen, setDropdownOpen] = useState(false);
  const [showRecent, setShowRecent] = useState(true);
  const [saving, setSaving] = useState(false);
  const dialogRef = useRef(null);
  const searchRef = useRef(null);
  const previousFocusRef = useRef(null);

  const selectedLoan = loans.find((loan) => loan.id === selectedLoanId) || null;
  const sortedLoans = useMemo(() => [...loans].sort((a, b) =>
    String(a.borrowerName).localeCompare(String(b.borrowerName), undefined, { sensitivity: 'base' })
  ), [loans]);
  const filteredLoans = useMemo(() => {
    const query = search.trim().toLowerCase();
    if (!query) return sortedLoans;
    return sortedLoans.filter((loan) => [loan.borrowerName, loan.loanDate, loan.currentOutstanding]
      .some((value) => String(value ?? '').toLowerCase().includes(query)));
  }, [search, sortedLoans]);
  const recentPayments = useMemo(() => {
    if (!selectedLoanId) return [];
    const cached = payments.filter((payment) => payment.loanId === selectedLoanId);
    const items = cached.length ? cached : (selectedLoan?.paymentTimeline || []);
    return [...items].sort((a, b) => new Date(b.paymentDate) - new Date(a.paymentDate)).slice(0, 5);
  }, [payments, selectedLoan, selectedLoanId]);

  useEffect(() => {
    if (!mode) return undefined;
    previousFocusRef.current = document.activeElement;
    const onKeyDown = (event) => {
      if (event.key === 'Escape') onClose();
    };
    window.addEventListener('keydown', onKeyDown);
    requestAnimationFrame(() => dialogRef.current?.focus());
    return () => {
      window.removeEventListener('keydown', onKeyDown);
      previousFocusRef.current?.focus?.();
    };
  }, [mode, onClose]);

  useEffect(() => {
    setSelectedLoanId('');
    setEditingPayment(null);
    setSearch('');
    setDropdownOpen(false);
    setShowRecent(true);
  }, [mode]);

  if (!mode) return null;

  const createLoan = async (payload) => {
    setSaving(true);
    try {
      await actions.createLoan(payload);
      toast.success('Loan created');
      onClose();
    } catch (error) {
      toast.error(error.message || 'Unable to create loan');
    } finally {
      setSaving(false);
    }
  };

  const savePayment = async (payload) => {
    setSaving(true);
    try {
      if (editingPayment) {
        await actions.updatePayment(editingPayment.id, payload);
        toast.success('Payment updated and recalculated');
      } else {
        await actions.addPayment(payload);
        toast.success('Payment recorded and recalculated');
      }
      onClose();
    } catch (error) {
      toast.error(error.message || 'Unable to save payment');
    } finally {
      setSaving(false);
    }
  };

  const selectLoan = (loan) => {
    setSelectedLoanId(loan.id);
    setEditingPayment(null);
    setSearch('');
    setDropdownOpen(false);
    setShowRecent(true);
  };

  const title = mode === 'loan' ? 'Create Loan' : (editingPayment ? 'Edit Payment' : 'Add Payment');

  return (
    <div className="fixed inset-0 z-50 grid place-items-center bg-slate-950/50 p-4" onMouseDown={onClose}>
      <section
        ref={dialogRef}
        className="card max-h-[94vh] w-full max-w-4xl overflow-hidden"
        role="dialog"
        aria-modal="true"
        aria-labelledby="quick-access-title"
        tabIndex={-1}
        onMouseDown={(event) => event.stopPropagation()}
      >
        <header className="flex items-center justify-between border-b border-slate-200 p-5 dark:border-slate-800">
          <div>
            <p className="text-sm text-slate-500">Quick access</p>
            <h2 id="quick-access-title" className="text-2xl font-bold">{title}</h2>
          </div>
          <button className="btn-secondary p-2" onClick={onClose} aria-label={`Close ${title}`}><X size={18} /></button>
        </header>

        <div className="max-h-[calc(94vh-89px)] overflow-y-auto p-5">
          {mode === 'loan' ? (
            <LoanForm onSubmit={createLoan} onCancel={onClose} loading={saving} />
          ) : (
            <div className="space-y-5">
              <div>
                <label className="text-sm font-semibold" id="borrower-label">Borrower</label>
                <div className="relative mt-1">
                  <button
                    type="button"
                    className="input flex items-center justify-between gap-3 text-left"
                    aria-labelledby="borrower-label"
                    aria-haspopup="listbox"
                    aria-expanded={dropdownOpen}
                    onClick={() => {
                      setDropdownOpen((value) => !value);
                      requestAnimationFrame(() => searchRef.current?.focus());
                    }}
                  >
                    <span className={selectedLoan ? '' : 'text-slate-500'}>
                      {selectedLoan
                        ? `${selectedLoan.borrowerName} · Outstanding: ${money(selectedLoan.currentOutstanding)} · Loan Date: ${date(selectedLoan.loanDate)}`
                        : 'Search and select a borrower'}
                    </span>
                    <ChevronDown size={18} className="shrink-0 text-slate-400" />
                  </button>
                  {dropdownOpen ? (
                    <div className="absolute z-10 mt-2 w-full overflow-hidden rounded-lg border border-slate-200 bg-white shadow-lg dark:border-slate-700 dark:bg-slate-900">
                      <label className="relative block border-b border-slate-200 p-2 dark:border-slate-700">
                        <Search className="absolute left-5 top-4 text-slate-400" size={17} />
                        <input
                          ref={searchRef}
                          className="input pl-9"
                          value={search}
                          onChange={(event) => setSearch(event.target.value)}
                          placeholder="Search borrower"
                          aria-label="Search borrowers"
                        />
                      </label>
                      <div className="max-h-64 overflow-y-auto p-1" role="listbox" aria-labelledby="borrower-label">
                        {filteredLoans.length ? filteredLoans.map((loan) => (
                          <button
                            key={loan.id}
                            type="button"
                            role="option"
                            aria-selected={loan.id === selectedLoanId}
                            className="block w-full rounded-md px-3 py-2 text-left text-sm hover:bg-blue-50 dark:hover:bg-slate-800"
                            onClick={() => selectLoan(loan)}
                          >
                            <strong>{loan.borrowerName}</strong>
                            <span className="ml-2 text-slate-500">Outstanding: {money(loan.currentOutstanding)} · Loan Date: {date(loan.loanDate)}</span>
                          </button>
                        )) : <p className="px-3 py-4 text-center text-sm text-slate-500">No borrowers found</p>}
                      </div>
                    </div>
                  ) : null}
                </div>
              </div>

              {selectedLoan ? (
                <>
                  <section className="rounded-lg border border-slate-200 p-4 dark:border-slate-800">
                    <div className="mb-4 flex flex-wrap items-center justify-between gap-3">
                      <div>
                        <p className="text-xs font-semibold uppercase tracking-wide text-slate-500">Borrower</p>
                        <p className="font-bold">{selectedLoan.borrowerName}</p>
                      </div>
                      <button type="button" className="btn-secondary" onClick={() => setShowRecent((value) => !value)} aria-expanded={showRecent}>
                        <Clock3 size={16} />Recent Payments
                      </button>
                    </div>
                    {showRecent ? (
                      recentPayments.length ? (
                        <div className="grid gap-2 sm:grid-cols-2">
                          {recentPayments.map((payment) => (
                            <button
                              key={payment.id}
                              type="button"
                              className={`rounded-lg border p-3 text-left text-sm transition hover:border-brand-500 hover:bg-blue-50 dark:hover:bg-slate-800 ${editingPayment?.id === payment.id ? 'border-brand-500 bg-blue-50 dark:bg-blue-950/40' : 'border-slate-200 dark:border-slate-700'}`}
                              onClick={() => setEditingPayment(payment)}
                            >
                              <span className="font-bold capitalize">{payment.paymentType}</span>{' '}
                              <span className="font-bold">{money(payment.amount)}</span>{' '}
                              <span className="text-slate-500">{date(payment.paymentDate)}</span>
                            </button>
                          ))}
                        </div>
                      ) : <p className="text-sm text-slate-500">No recent payments</p>
                    ) : null}
                  </section>

                  <section className="card p-4">
                    <div className="mb-4 flex items-center justify-between gap-3">
                      <h3 className="text-lg font-bold">{editingPayment ? 'Edit Payment' : 'Add Payment'}</h3>
                      {editingPayment ? <button type="button" className="btn-secondary" onClick={() => setEditingPayment(null)}>Add New Instead</button> : null}
                    </div>
                    <PaymentForm
                      key={`${selectedLoan.id}-${editingPayment?.id || 'new'}`}
                      loanId={selectedLoan.id}
                      initialValues={editingPayment || {}}
                      onSubmit={savePayment}
                      onCancel={editingPayment ? () => setEditingPayment(null) : onClose}
                      loading={saving}
                    />
                  </section>
                </>
              ) : null}
            </div>
          )}
        </div>
      </section>
    </div>
  );
}
