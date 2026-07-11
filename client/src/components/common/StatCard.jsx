import { useEffect, useState } from 'react';

export default function StatCard({ label, value, icon: Icon, accent = 'blue', formatter = (item) => item }) {
  const [display, setDisplay] = useState(0);
  const numeric = Number(value || 0);

  useEffect(() => {
    let frame;
    const start = performance.now();
    const tick = (now) => {
      const progress = Math.min((now - start) / 700, 1);
      setDisplay(numeric * progress);
      if (progress < 1) frame = requestAnimationFrame(tick);
    };
    frame = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(frame);
  }, [numeric]);

  const accents = {
    blue: 'bg-blue-50 text-blue-700 dark:bg-blue-950 dark:text-blue-200',
    slate: 'bg-slate-100 text-slate-700 dark:bg-slate-800 dark:text-slate-200',
    green: 'bg-emerald-50 text-emerald-700 dark:bg-emerald-950 dark:text-emerald-200'
  };

  return (
    <div className="card p-5 transition hover:-translate-y-0.5">
      <div className="flex items-start justify-between gap-4">
        <div>
          <p className="text-sm font-medium text-slate-500 dark:text-slate-400">{label}</p>
          <p className="mt-3 text-2xl font-bold text-slate-950 dark:text-white">{formatter(display)}</p>
        </div>
        {Icon ? (
          <div className={`rounded-lg p-3 ${accents[accent] || accents.blue}`}>
            <Icon size={21} />
          </div>
        ) : null}
      </div>
    </div>
  );
}
