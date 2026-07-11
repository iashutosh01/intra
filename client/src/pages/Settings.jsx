import { LogOut, ShieldCheck, Wallet } from 'lucide-react';
import { useEffect } from 'react';
import { useForm } from 'react-hook-form';
import toast from 'react-hot-toast';
import PageHeader from '../components/common/PageHeader.jsx';
import Skeleton from '../components/common/Skeleton.jsx';
import { useAuth } from '../context/AuthContext.jsx';
import { useAsync } from '../hooks/useAsync.js';
import { endpoints } from '../services/api.js';
import { money } from '../utils/format.js';

export default function Settings() {
  const { lock } = useAuth();
  const { data, loading, refresh } = useAsync(endpoints.settings, []);
  const { register, handleSubmit, reset, watch } = useForm({
    defaultValues: { cashInHand: 0, moneyWithMummy: 0, moneyWithPapa: 0 }
  });
  const values = watch();
  const totalLiquid = Number(values.cashInHand || 0) + Number(values.moneyWithMummy || 0) + Number(values.moneyWithPapa || 0);

  useEffect(() => {
    if (data) reset(data);
  }, [data, reset]);

  const save = async (payload) => {
    await endpoints.updateSettings(payload);
    toast.success('Settings saved');
    refresh();
  };

  return (
    <>
      <PageHeader title="Settings" description="PIN changes are made directly in the Google Sheet Settings tab." />
      <div className="grid gap-6 xl:grid-cols-2">
      <div className="card p-6">
        <div className="flex items-start gap-4">
          <div className="rounded-lg bg-blue-50 p-3 text-brand-600 dark:bg-blue-950"><ShieldCheck size={24} /></div>
          <div>
            <h2 className="text-lg font-bold">PIN Authentication</h2>
            <p className="mt-1 text-sm text-slate-500 dark:text-slate-400">The app validates the entered PIN against the `PIN` key in your Settings sheet. No JWT, login, or registration is used.</p>
            <button className="btn-secondary mt-5" onClick={lock}><LogOut size={16} />Lock App</button>
          </div>
        </div>
      </div>
      <div className="card p-6">
        <div className="mb-5 flex items-center gap-3">
          <div className="rounded-lg bg-emerald-50 p-3 text-emerald-700 dark:bg-emerald-950 dark:text-emerald-200"><Wallet size={22} /></div>
          <div>
            <h2 className="text-lg font-bold">Liquid Cash</h2>
            <p className="text-sm text-slate-500">Saved in Settings sheet as key/value rows.</p>
          </div>
        </div>
        {loading ? <Skeleton className="h-64" /> : (
          <form onSubmit={handleSubmit(save)} className="space-y-4">
            <label className="text-sm font-semibold">Cash in Hand<input className="input mt-1" type="number" min="0" step="0.01" {...register('cashInHand')} /></label>
            <label className="text-sm font-semibold">Money with Mummy<input className="input mt-1" type="number" min="0" step="0.01" {...register('moneyWithMummy')} /></label>
            <label className="text-sm font-semibold">Money with Papa<input className="input mt-1" type="number" min="0" step="0.01" {...register('moneyWithPapa')} /></label>
            <div className="rounded-lg bg-slate-50 p-4 dark:bg-slate-950">
              <p className="text-sm text-slate-500">Total Liquid</p>
              <p className="text-2xl font-bold">{money(totalLiquid)}</p>
            </div>
            <button className="btn-primary">Save Settings</button>
          </form>
        )}
      </div>
      </div>
    </>
  );
}
