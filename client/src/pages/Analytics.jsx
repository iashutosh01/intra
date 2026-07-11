import { Pie, PieChart, ResponsiveContainer, Tooltip, Cell, Legend } from 'recharts';
import PageHeader from '../components/common/PageHeader.jsx';
import Skeleton from '../components/common/Skeleton.jsx';
import { useAsync } from '../hooks/useAsync.js';
import { endpoints } from '../services/api.js';
import { money, percent } from '../utils/format.js';

const COLORS = ['#2563eb', '#60a5fa', '#94a3b8', '#22c55e', '#0f172a'];

export default function Analytics() {
  const { data, loading } = useAsync(endpoints.analytics, []);
  if (loading) return <Skeleton className="h-[70vh]" />;
  const distribution = data?.charts?.outstandingDistribution || [];
  return (
    <>
      <PageHeader title="Analytics" description="Portfolio distribution and health metrics derived by the backend." />
      <div className="grid gap-4 md:grid-cols-3">
        <div className="card p-5"><p className="text-sm text-slate-500">Active Ratio</p><p className="mt-2 text-2xl font-bold">{percent((data.portfolioHealth.activeRatio || 0) * 100)}</p></div>
        <div className="card p-5"><p className="text-sm text-slate-500">Collection Ratio</p><p className="mt-2 text-2xl font-bold">{percent((data.portfolioHealth.collectionRatio || 0) * 100)}</p></div>
        <div className="card p-5"><p className="text-sm text-slate-500">Interest Exposure</p><p className="mt-2 text-2xl font-bold">{percent((data.portfolioHealth.interestExposure || 0) * 100)}</p></div>
      </div>
      <div className="card mt-6 p-5">
        <h2 className="mb-4 text-lg font-bold">Outstanding Distribution</h2>
        <ResponsiveContainer width="100%" height={360}>
          <PieChart>
            <Pie data={distribution} dataKey="principal" nameKey="name" outerRadius={130} label>
              {distribution.map((_, index) => <Cell key={index} fill={COLORS[index % COLORS.length]} />)}
            </Pie>
            <Tooltip formatter={(value) => money(value)} />
            <Legend />
          </PieChart>
        </ResponsiveContainer>
      </div>
    </>
  );
}
