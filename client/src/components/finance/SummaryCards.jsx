export default function SummaryCards({ items }) {
  return <div className="grid gap-3 md:grid-cols-2 xl:grid-cols-4">{items.map(([label, value]) => (
    <div key={label} className="rounded-lg bg-slate-50 p-3 dark:bg-slate-950"><p className="text-xs font-semibold uppercase text-slate-500">{label}</p><div className="mt-1 font-bold">{value}</div></div>
  ))}</div>;
}
