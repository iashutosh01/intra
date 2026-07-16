import { Pencil, Trash2 } from 'lucide-react';
import EmptyState from '../common/EmptyState.jsx';
import { date, money } from '../../utils/format.js';

export default function PaymentTimeline({ items = [], onEdit, onDelete }) {
  if (!items.length) return <EmptyState title="No payments yet" />;
  return <div className="overflow-x-auto"><table className="min-w-full text-sm"><thead className="text-left text-xs uppercase text-slate-500"><tr><th className="py-2">Date</th><th>Type</th><th>Amount</th><th>Notes</th>{onEdit || onDelete ? <th /> : null}</tr></thead><tbody className="divide-y divide-slate-100 dark:divide-slate-800">{items.map((payment) => <tr key={payment.id}><td className="py-3">{date(payment.paymentDate)}</td><td className="capitalize">{payment.paymentType}</td><td className="font-bold">{money(payment.amount)}</td><td className="text-slate-500">{payment.notes || '-'}</td>{onEdit || onDelete ? <td><div className="flex gap-2">{onEdit ? <button className="text-brand-600" onClick={() => onEdit(payment)} aria-label="Edit payment"><Pencil size={16} /></button> : null}{onDelete ? <button className="text-red-600" onClick={() => onDelete(payment)} aria-label="Delete payment"><Trash2 size={16} /></button> : null}</div></td> : null}</tr>)}</tbody></table></div>;
}
