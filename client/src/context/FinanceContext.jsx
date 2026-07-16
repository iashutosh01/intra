import { createContext, useCallback, useContext, useEffect, useMemo, useRef, useState } from 'react';
import { endpoints } from '../services/api.js';
import PersonDetailModal from '../components/finance/PersonDetailModal.jsx';

const FinanceContext = createContext(null);
const STALE_MS = 60_000;

export function FinanceProvider({ children }) {
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [selectedLoanId, setSelectedLoanId] = useState(null);
  const fetchedAt = useRef(0);
  const inFlight = useRef(null);

  const refresh = useCallback(async ({ force = false } = {}) => {
    if (!force && data && Date.now() - fetchedAt.current < STALE_MS) return data;
    if (inFlight.current) return inFlight.current;
    setLoading((current) => current || !data);
    inFlight.current = endpoints.finance()
      .then((response) => {
        setData(response.data);
        fetchedAt.current = Date.now();
        setError(null);
        return response.data;
      })
      .catch((requestError) => {
        setError(requestError);
        throw requestError;
      })
      .finally(() => {
        inFlight.current = null;
        setLoading(false);
      });
    return inFlight.current;
  }, [data]);

  useEffect(() => { refresh().catch(() => {}); }, [refresh]);

  const mutate = useCallback(async (request) => {
    const response = await request();
    await refresh({ force: true });
    return response.data;
  }, [refresh]);

  const actions = useMemo(() => ({
    createLoan: (payload) => mutate(() => endpoints.createLoan(payload)),
    updateLoan: (id, payload) => mutate(() => endpoints.updateLoan(id, payload)),
    deleteLoan: (id) => mutate(() => endpoints.deleteLoan(id)),
    addPayment: (payload) => mutate(() => endpoints.addPayment(payload)),
    updatePayment: (id, payload) => mutate(() => endpoints.updatePayment(id, payload)),
    deletePayment: (id) => mutate(() => endpoints.deletePayment(id)),
    updateSettings: (payload) => mutate(() => endpoints.updateSettings(payload)),
    previewPayment: (payload) => endpoints.previewPayment(payload).then((response) => response.data)
  }), [mutate]);

  const value = useMemo(() => ({
    data,
    loans: data?.loans || [],
    payments: data?.payments || [],
    history: data?.history || [],
    dashboard: data?.dashboard || null,
    analytics: data?.analytics || null,
    settings: data?.settings || null,
    loading,
    error,
    refresh,
    actions,
    getLoan: (id) => data?.loans?.find((loan) => loan.id === id) || null,
    selectLoans: ({ search = '', status = '', sort = 'newest' } = {}) => {
      const query = String(search).toLowerCase();
      let loans = query ? (data?.loans || []).filter((loan) => [loan.borrowerName, loan.phone, loan.remarks].some((value) => String(value).toLowerCase().includes(query))) : [...(data?.loans || [])];
      if (status) loans = loans.filter((loan) => loan.status === status);
      const sorters = {
        name: (a, b) => a.borrowerName.localeCompare(b.borrowerName), amount: (a, b) => b.principal - a.principal,
        interest: (a, b) => b.outstandingInterest - a.outstandingInterest, outstanding: (a, b) => b.currentOutstanding - a.currentOutstanding,
        duration: (a, b) => b.totalMonths - a.totalMonths, oldest: (a, b) => new Date(a.loanDate) - new Date(b.loanDate),
        newest: (a, b) => new Date(b.loanDate) - new Date(a.loanDate), highest: (a, b) => b.currentOutstanding - a.currentOutstanding,
        lowest: (a, b) => a.currentOutstanding - b.currentOutstanding
      };
      return loans.sort(sorters[sort] || sorters.newest);
    },
    openPerson: (id) => setSelectedLoanId(id),
    closePerson: () => setSelectedLoanId(null)
  }), [actions, data, error, loading, refresh]);

  return (
    <FinanceContext.Provider value={value}>
      {children}
      <PersonDetailModal loanId={selectedLoanId} open={!!selectedLoanId} onClose={() => setSelectedLoanId(null)} />
    </FinanceContext.Provider>
  );
}

export const useFinance = () => {
  const context = useContext(FinanceContext);
  if (!context) throw new Error('useFinance must be used inside FinanceProvider');
  return context;
};
