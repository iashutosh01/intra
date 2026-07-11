import { LogOut, ShieldCheck } from 'lucide-react';
import PageHeader from '../components/common/PageHeader.jsx';
import { useAuth } from '../context/AuthContext.jsx';

export default function Settings() {
  const { logout } = useAuth();
  return (
    <>
      <PageHeader title="Settings" description="PIN changes are made directly in the Google Sheet Settings tab." />
      <div className="card max-w-2xl p-6">
        <div className="flex items-start gap-4">
          <div className="rounded-lg bg-blue-50 p-3 text-brand-600 dark:bg-blue-950"><ShieldCheck size={24} /></div>
          <div>
            <h2 className="text-lg font-bold">PIN Authentication</h2>
            <p className="mt-1 text-sm text-slate-500 dark:text-slate-400">The app validates the entered PIN against the `PIN` key in your Settings sheet. No JWT, login, or registration is used.</p>
            <button className="btn-secondary mt-5" onClick={logout}><LogOut size={16} />Lock App</button>
          </div>
        </div>
      </div>
    </>
  );
}
