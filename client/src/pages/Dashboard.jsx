import { Activity, Banknote, CircleDollarSign, Landmark, Users, Wallet } from 'lucide-react';
import { Area, AreaChart, Bar, BarChart, CartesianGrid, ResponsiveContainer, Tooltip, XAxis, YAxis } from 'recharts';
import EmptyState from '../components/common/EmptyState.jsx';
import PageHeader from '../components/common/PageHeader.jsx';
import Skeleton from '../components/common/Skeleton.jsx';
import StatCard from '../components/common/StatCard.jsx';
import { useAsync } from '../hooks/useAsync.js';
import { endpoints } from '../services/api.js';
import { date, money } from '../utils/format.js';

export default function Dashboard() {
  const { data, loading } = useAsync(endpoints.dashboard, []);

  if (loading) {
    return <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">{Array.from({ length: 8 }).map((_, i) => <Skeleton key={i} className="h-32" />)}</div>;
  }

  const monthly = data?.charts?.monthly || [];

  return (
    <>
      <PageHeader title="Dashboard" description="Live portfolio numbers recalculated from raw loan and payment records." />
      <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
        <StatCard label="Total Principal Given" value={data.totalPrincipalGiven} formatter={money} icon={Landmark} />
        <StatCard label="Principal Remaining" value={data.totalPrincipalRemaining} formatter={money} icon={Wallet} />
        <StatCard label="Interest Earned" value={data.totalInterestEarned} formatter={money} icon={CircleDollarSign} accent="green" />
        <StatCard label="Outstanding Interest" value={data.currentOutstandingInterest} formatter={money} icon={Activity} />
        <StatCard label="Current Outstanding" value={data.currentOutstandingAmount} formatter={money} icon={Banknote} />
        <StatCard label="Total Received" value={data.totalReceived} formatter={money} icon={CircleDollarSign} accent="green" />
        <StatCard label="Active Loans" value={data.activeLoans} icon={Wallet} formatter={(v) => Math.round(v)} />
        <StatCard label="Total Borrowers" value={data.totalBorrowers} icon={Users} formatter={(v) => Math.round(v)} />
      </div>

      <div className="mt-6 grid gap-6 xl:grid-cols-[2fr_1fr]">
        <div className="card p-5">
          <h2 className="mb-4 text-lg font-bold">Monthly Lending and Collections</h2>
          {monthly.length ? (
            <ResponsiveContainer width="100%" height={320}>
              <AreaChart data={monthly}>
                <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" />
                <XAxis dataKey="month" />
                <YAxis />
                <Tooltip formatter={(value) => money(value)} />
                <Area dataKey="lending" stroke="#2563eb" fill="#dbeafe" name="Lending" />
                <Area dataKey="collections" stroke="#059669" fill="#dcfce7" name="Collections" />
              </AreaChart>
            </ResponsiveContainer>
          ) : <EmptyState title="No monthly activity" />}
        </div>

        <div className="card p-5">
          <h2 className="mb-4 text-lg font-bold">Top Borrowers</h2>
          <ResponsiveContainer width="100%" height={320}>
            <BarChart data={data.charts.topBorrowers || []} layout="vertical">
              <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" />
              <XAxis type="number" hide />
              <YAxis type="category" dataKey="name" width={90} />
              <Tooltip formatter={(value) => money(value)} />
              <Bar dataKey="outstanding" fill="#2563eb" radius={[0, 6, 6, 0]} />
            </BarChart>
          </ResponsiveContainer>
        </div>
      </div>

      <div className="mt-6 grid gap-6 xl:grid-cols-2">
        <div className="card p-5">
          <h2 className="mb-4 text-lg font-bold">Recent Activity</h2>
          <div className="space-y-3">
            {(data.recentActivity || []).map((item) => (
              <div key={item.id} className="rounded-lg border border-slate-200 p-3 text-sm dark:border-slate-800">
                <p className="font-semibold">{item.action}</p>
                <p className="text-slate-500">{date(item.timestamp)} {item.notes ? `- ${item.notes}` : ''}</p>
              </div>
            ))}
            {!data.recentActivity?.length ? <EmptyState title="No activity yet" /> : null}
          </div>
        </div>
        <div className="card p-5">
          <h2 className="mb-4 text-lg font-bold">Upcoming Interest Due</h2>
          <div className="space-y-3">
            {(data.upcomingInterestDue || []).map((loan) => (
              <div key={loan.id} className="flex items-center justify-between rounded-lg border border-slate-200 p-3 dark:border-slate-800">
                <div>
                  <p className="font-semibold">{loan.borrowerName}</p>
                  <p className="text-sm text-slate-500">{loan.interestDuration}</p>
                </div>
                <p className="font-bold text-brand-600">{money(loan.outstandingInterest)}</p>
              </div>
            ))}
            {!data.upcomingInterestDue?.length ? <EmptyState title="No active interest due" /> : null}
          </div>
        </div>
      </div>
    </>
  );
}
