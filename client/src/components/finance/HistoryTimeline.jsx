import { useState } from 'react';
import toast from 'react-hot-toast';
import ConfirmDialog from '../common/ConfirmDialog.jsx';
import EmptyState from '../common/EmptyState.jsx';
import { date, money } from '../../utils/format.js';

export default function HistoryTimeline({ items = [], onDelete }) {
  const [selectedIds, setSelectedIds] = useState([]);
  const [confirmOpen, setConfirmOpen] = useState(false);
  const [confirmed, setConfirmed] = useState(false);
  const [deleting, setDeleting] = useState(false);

  const toggleSelected = (id) => setSelectedIds((current) =>
    current.includes(id) ? current.filter((itemId) => itemId !== id) : [...current, id]
  );

  const deleteSelected = async () => {
    if (!confirmed || !selectedIds.length || deleting) return;
    setDeleting(true);
    try {
      await onDelete(selectedIds);
      setSelectedIds([]);
      setConfirmOpen(false);
      setConfirmed(false);
    } catch (error) {
      toast.error(error.message || 'Could not delete history entries');
    } finally {
      setDeleting(false);
    }
  };

  if (!items.length) return <EmptyState title="No history yet" />;
  return <>
    {onDelete && selectedIds.length ? <div className="mb-3 flex justify-end">
      <button className="btn-secondary text-red-600" onClick={() => setConfirmOpen(true)} disabled={deleting}>Delete selected ({selectedIds.length})</button>
    </div> : null}
    <div className="space-y-2">{items.map((item) => <div key={item.id} className="flex items-start gap-3 rounded-lg border border-slate-200 p-3 text-sm dark:border-slate-800">
      {onDelete ? <input type="checkbox" className="mt-1 h-4 w-4 rounded border-slate-300 text-red-600 focus:ring-red-500" aria-label={`Select history entry ${item.action}`} checked={selectedIds.includes(item.id)} onChange={() => toggleSelected(item.id)} /> : null}
      <div className="min-w-0 flex-1"><div className="flex justify-between gap-3"><p className="font-semibold">{item.action}</p>{item.amount ? <strong>{money(item.amount)}</strong> : null}</div><p className="text-slate-500">{date(item.date || item.timestamp)}{item.remarks ? ` - ${item.remarks}` : ''}</p></div>
    </div>)}</div>
    <ConfirmDialog
      open={confirmOpen}
      title="Delete selected history entries?"
      message={`This permanently removes ${selectedIds.length} selected ${selectedIds.length === 1 ? 'entry' : 'entries'} from the audit history.`}
      confirmationLabel="I understand these history entries will be permanently deleted."
      confirmationChecked={confirmed}
      onConfirmationChange={setConfirmed}
      confirmDisabled={!confirmed}
      confirmLabel="Delete"
      busy={deleting}
      onClose={() => { setConfirmOpen(false); setConfirmed(false); }}
      onConfirm={deleteSelected}
    />
  </>;
}
