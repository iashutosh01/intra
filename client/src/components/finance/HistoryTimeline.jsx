import EmptyState from '../common/EmptyState.jsx';
import { date, money } from '../../utils/format.js';

export default function HistoryTimeline({ items = [] }) {
  if (!items.length) return <EmptyState title="No history yet" />;
  return <div className="space-y-2">{items.map((item) => <div key={item.id} className="rounded-lg border border-slate-200 p-3 text-sm dark:border-slate-800"><div className="flex justify-between gap-3"><p className="font-semibold">{item.action}</p>{item.amount ? <strong>{money(item.amount)}</strong> : null}</div><p className="text-slate-500">{date(item.date || item.timestamp)}{item.remarks ? ` - ${item.remarks}` : ''}</p></div>)}</div>;
}
