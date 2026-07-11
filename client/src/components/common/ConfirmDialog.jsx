import { X } from 'lucide-react';

export default function ConfirmDialog({ open, title, message, onConfirm, onClose }) {
  if (!open) return null;
  return (
    <div className="fixed inset-0 z-50 grid place-items-center bg-slate-950/50 p-4">
      <div className="card w-full max-w-md p-5">
        <div className="flex items-start justify-between">
          <div>
            <h3 className="text-lg font-bold text-slate-950 dark:text-white">{title}</h3>
            <p className="mt-2 text-sm text-slate-500 dark:text-slate-400">{message}</p>
          </div>
          <button className="btn-secondary p-2" onClick={onClose} aria-label="Close dialog">
            <X size={16} />
          </button>
        </div>
        <div className="mt-6 flex justify-end gap-2">
          <button className="btn-secondary" onClick={onClose}>Cancel</button>
          <button className="btn-primary bg-red-600 hover:bg-red-700" onClick={onConfirm}>Confirm</button>
        </div>
      </div>
    </div>
  );
}
