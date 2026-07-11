import { Activity, Banknote, CalendarCheck, CircleDollarSign, Landmark, TrendingUp, Users, Wallet } from 'lucide-react';
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
        <StatCard label="Today's Collection" value={data.todayCollection} formatter={money} icon={CalendarCheck} accent="green" />
        <StatCard label="This Month Collection" value={data.monthCollection} formatter={money} icon={TrendingUp} accent="green" />
        <StatCard label="Total Liquid" value={data.familyHoldings?.totalLiquid} formatter={money} icon={Wallet} accent="slate" />
        <StatCard label="Net Worth" value={data.netWorth} formatter={money} icon={Landmark} accent="blue" />
      </div>

      <div className="mt-6 grid gap-4 md:grid-cols-2 xl:grid-cols-4">
        <div className="card p-5">
          <h2 className="text-sm font-bold uppercase text-slate-500">Family Holdings</h2>
          <div className="mt-4 space-y-3 text-sm">
            <div className="flex justify-between"><span>Cash in Hand</span><strong>{money(data.familyHoldings?.cashInHand)}</strong></div>
            <div className="flex justify-between"><span>Money with Mummy</span><strong>{money(data.familyHoldings?.moneyWithMummy)}</strong></div>
            <div className="flex justify-between"><span>Money with Papa</span><strong>{money(data.familyHoldings?.moneyWithPapa)}</strong></div>
            <div className="border-t border-slate-200 pt-3 dark:border-slate-800 flex justify-between"><span>Total Liquid</span><strong>{money(data.familyHoldings?.totalLiquid)}</strong></div>
          </div>
        </div>
        {[
          ['Highest Outstanding Loan', data.highestOutstandingLoan?.borrowerName, money(data.highestOutstandingLoan?.currentOutstanding)],
          ['Highest Interest Generated', data.highestInterestGenerated?.borrowerName, money(data.highestInterestGenerated?.totalInterestGenerated)],
          ['Most Active Borrower', data.mostActiveBorrower?.borrowerName, `${data.mostActiveBorrower?.paymentCount || 0} payments`],
          ['Recently Added Loan', data.recentlyAddedLoan?.borrowerName, date(data.recentlyAddedLoan?.loanDate)]
        ].map(([label, title, value]) => (
          <div key={label} className="card p-5">
            <p className="text-sm font-bold uppercase text-slate-500">{label}</p>
            <p className="mt-4 text-lg font-bold">{title || '-'}</p>
            <p className="mt-1 text-sm text-slate-500">{value || '-'}</p>
          </div>
        ))}
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
          <h2 className="mb-4 text-lg font-bold">Recent Payments</h2>
          <div className="space-y-3">
            {(data.recentPayments || []).map((payment) => (
              <div key={payment.id} className="flex items-center justify-between rounded-lg border border-slate-200 p-3 dark:border-slate-800">
                <div>
                  <p className="font-semibold capitalize">{payment.paymentType}</p>
                  <p className="text-sm text-slate-500">{date(payment.paymentDate)}</p>
                </div>
                <p className="font-bold text-emerald-700">{money(payment.amount)}</p>
              </div>
            ))}
            {!data.recentPayments?.length ? <EmptyState title="No payments yet" /> : null}
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
