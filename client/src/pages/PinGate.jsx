import { LockKeyhole } from 'lucide-react';
import { useState } from 'react';
import { useForm } from 'react-hook-form';
import toast from 'react-hot-toast';
import { Navigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext.jsx';

export default function PinGate() {
  const { verified, verify } = useAuth();
  const [loading, setLoading] = useState(false);
  const { register, handleSubmit } = useForm();

  if (verified) return <Navigate to="/" replace />;

  const submit = async ({ pin }) => {
    setLoading(true);
    try {
      await verify(pin);
      toast.success('PIN verified');
    } catch (err) {
      toast.error(err.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="grid min-h-screen place-items-center bg-slate-50 px-4 dark:bg-slate-950">
      <form onSubmit={handleSubmit(submit)} className="card w-full max-w-sm p-7">
        <div className="mb-6 flex items-center gap-3">
          <div className="rounded-lg bg-blue-50 p-3 text-brand-600 dark:bg-blue-950">
            <LockKeyhole size={24} />
          </div>
          <div>
            <h1 className="text-xl font-bold text-slate-950 dark:text-white">Enter PIN</h1>
            <p className="text-sm text-slate-500">Validated from your Settings sheet.</p>
          </div>
        </div>
        <input className="input text-center text-2xl tracking-[0.35em]" type="password" maxLength="12" {...register('pin', { required: true })} />
        <button className="btn-primary mt-5 w-full" disabled={loading}>{loading ? 'Verifying...' : 'Unlock ledger'}</button>
      </form>
    </div>
  );
}
