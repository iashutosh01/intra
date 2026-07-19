import { BarChart3, CircleDollarSign, CreditCard, History, LayoutDashboard, Lock, Menu, Moon, Plus, Settings, Sun, WalletCards, X } from 'lucide-react';
import { useCallback, useEffect, useState } from 'react';
import { NavLink, Outlet, useLocation } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext.jsx';
import { FinanceProvider } from '../../context/FinanceContext.jsx';
import QuickAccessModal from '../finance/QuickAccessModal.jsx';

const nav = [
  { to: '/', label: 'Dashboard', icon: LayoutDashboard },
  { to: '/loans', label: 'Loans', icon: WalletCards },
  { to: '/payments', label: 'Payments', icon: CreditCard },
  { to: '/history', label: 'History', icon: History },
  { to: '/analytics', label: 'Analytics', icon: BarChart3 },
  { to: '/settings', label: 'Settings', icon: Settings }
];

function Sidebar({ open, onClose, onQuickAdd }) {
  return (
    <>
      <div className={`fixed inset-0 z-30 bg-slate-950/40 lg:hidden ${open ? 'block' : 'hidden'}`} onClick={onClose} />
      <aside
        className={`fixed inset-y-0 left-0 z-40 w-72 transform border-r border-slate-200 bg-white transition lg:static lg:translate-x-0 dark:border-slate-800 dark:bg-slate-950 ${
          open ? 'translate-x-0' : '-translate-x-full'
        }`}
      >
        <div className="flex h-16 items-center justify-between border-b border-slate-200 px-5 dark:border-slate-800">
          <div>
            <p className="text-xs font-semibold uppercase tracking-wide text-brand-600">Loan Ledger</p>
            <h1 className="text-lg font-bold text-slate-950 dark:text-white">Finance Desk</h1>
          </div>
          <button className="btn-secondary p-2 lg:hidden" onClick={onClose} aria-label="Close sidebar">
            <X size={18} />
          </button>
        </div>
        <nav className="space-y-1 p-4">
          {nav.map((item) => (
            <NavLink
              key={item.to}
              to={item.to}
              end={item.to === '/'}
              onClick={onClose}
              className={({ isActive }) =>
                `flex items-center gap-3 rounded-lg px-3 py-2.5 text-sm font-semibold transition ${
                  isActive
                    ? 'bg-blue-50 text-brand-700 dark:bg-blue-950/60 dark:text-blue-200'
                    : 'text-slate-600 hover:bg-slate-50 dark:text-slate-300 dark:hover:bg-slate-900'
                }`
              }
            >
              <item.icon size={19} />
              {item.label}
            </NavLink>
          ))}
          <div className="my-3 border-t border-slate-200 dark:border-slate-800" />
          <button
            type="button"
            className="flex w-full items-center gap-3 rounded-lg px-3 py-2.5 text-sm font-semibold text-slate-600 transition hover:bg-slate-50 dark:text-slate-300 dark:hover:bg-slate-900"
            onClick={() => { onQuickAdd('loan'); onClose(); }}
          >
            <Plus size={19} />Add Loan
          </button>
          <button
            type="button"
            className="flex w-full items-center gap-3 rounded-lg px-3 py-2.5 text-sm font-semibold text-slate-600 transition hover:bg-slate-50 dark:text-slate-300 dark:hover:bg-slate-900"
            onClick={() => { onQuickAdd('payment'); onClose(); }}
          >
            <CircleDollarSign size={19} />Add Payment
          </button>
        </nav>
      </aside>
    </>
  );
}

export default function AppLayout() {
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [quickMode, setQuickMode] = useState(null);
  const [dark, setDark] = useState(() => localStorage.getItem('theme') === 'dark');
  const closeQuickAccess = useCallback(() => setQuickMode(null), []);
  const { lock } = useAuth();
  const location = useLocation();
  const title = nav.find((item) => item.to === location.pathname)?.label || 'Loan Details';

  useEffect(() => {
    document.documentElement.classList.toggle('dark', dark);
    localStorage.setItem('theme', dark ? 'dark' : 'light');
  }, [dark]);

  return (
    <div className="min-h-screen bg-slate-50 text-slate-900 dark:bg-slate-950 dark:text-slate-100">
      <div className="flex min-h-screen">
        <Sidebar open={sidebarOpen} onClose={() => setSidebarOpen(false)} onQuickAdd={setQuickMode} />
        <div className="min-w-0 flex-1">
          <header className="sticky top-0 z-20 flex h-16 items-center justify-between border-b border-slate-200 bg-white/90 px-4 backdrop-blur dark:border-slate-800 dark:bg-slate-950/90 lg:px-8">
            <div className="flex items-center gap-3">
              <button className="btn-secondary p-2 lg:hidden" onClick={() => setSidebarOpen(true)} aria-label="Open sidebar">
                <Menu size={18} />
              </button>
              <div>
                <p className="text-xs font-medium text-slate-500">Personal banking ledger</p>
                <h2 className="text-xl font-bold">{title}</h2>
              </div>
            </div>
            <div className="flex items-center gap-2">
              <button className="btn-secondary p-2" onClick={() => setDark((value) => !value)} aria-label="Toggle dark mode" title="Toggle dark mode">
                {dark ? <Sun size={18} /> : <Moon size={18} />}
              </button>
              <button className="btn-secondary p-2 text-red-600" onClick={lock} aria-label="Lock app" title="Lock app">
                <Lock size={18} />
              </button>
            </div>
          </header>
          <FinanceProvider>
            <main className="p-4 lg:p-8"><Outlet /></main>
            <QuickAccessModal mode={quickMode} onClose={closeQuickAccess} />
          </FinanceProvider>
        </div>
      </div>
    </div>
  );
}
