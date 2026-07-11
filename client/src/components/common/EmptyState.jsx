import { Inbox } from 'lucide-react';

export default function EmptyState({ title = 'Nothing here yet', message = 'Records will appear here once available.' }) {
  return (
    <div className="card flex flex-col items-center justify-center px-6 py-14 text-center">
      <div className="rounded-lg bg-blue-50 p-4 text-brand-600 dark:bg-blue-950">
        <Inbox size={28} />
      </div>
      <h3 className="mt-4 text-lg font-bold text-slate-950 dark:text-white">{title}</h3>
      <p className="mt-1 max-w-md text-sm text-slate-500 dark:text-slate-400">{message}</p>
    </div>
  );
}
