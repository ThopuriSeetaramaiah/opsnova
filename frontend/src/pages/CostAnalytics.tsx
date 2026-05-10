import { useQuery } from '@tanstack/react-query';
import {
  AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer,
  PieChart, Pie, Cell, Legend,
} from 'recharts';
import { costsApi } from '../api/endpoints';
import Badge from '../components/UI/Badge';
import StatCard from '../components/UI/StatCard';
import { DollarSign, TrendingUp, AlertTriangle } from 'lucide-react';

const COLORS = ['#3b82f6','#8b5cf6','#10b981','#f59e0b','#ef4444','#06b6d4','#84cc16','#f97316','#ec4899','#6366f1'];

export default function CostAnalytics() {
  const { data: summary } = useQuery({ queryKey: ['cost-summary'], queryFn: () => costsApi.getSummary().then(r => r.data) });
  const { data: byService } = useQuery({ queryKey: ['cost-by-service'], queryFn: () => costsApi.getByService().then(r => r.data) });
  const { data: trend } = useQuery({ queryKey: ['cost-trend-30'], queryFn: () => costsApi.getTrend(30).then(r => r.data) });
  const { data: anomalies } = useQuery({ queryKey: ['cost-anomalies'], queryFn: () => costsApi.getAnomalies().then(r => r.data) });

  return (
    <div className="space-y-6">
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <StatCard title="Month-to-Date" value={summary ? `$${summary.total_mtd.toLocaleString()}` : '—'} icon={<DollarSign size={18} />} iconBg="bg-emerald-500" change={summary?.mom_change_pct} />
        <StatCard title="Forecast (EOM)" value={summary ? `$${summary.forecast_eom.toLocaleString()}` : '—'} icon={<TrendingUp size={18} />} iconBg="bg-blue-500" />
        <StatCard title="Anomalies" value={anomalies?.length ?? 0} icon={<AlertTriangle size={18} />} iconBg="bg-red-500" />
      </div>

      <div className="grid grid-cols-1 xl:grid-cols-3 gap-6">
        {/* Trend */}
        <div className="xl:col-span-2 bg-white dark:bg-slate-800 rounded-xl p-6 border border-slate-200 dark:border-slate-700">
          <h2 className="text-base font-semibold text-slate-900 dark:text-white mb-4">Daily Cost Trend (30 days)</h2>
          <ResponsiveContainer width="100%" height={240}>
            <AreaChart data={trend ?? []}>
              <defs>
                <linearGradient id="cg" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="#10b981" stopOpacity={0.3} />
                  <stop offset="95%" stopColor="#10b981" stopOpacity={0} />
                </linearGradient>
              </defs>
              <CartesianGrid strokeDasharray="3 3" opacity={0.2} />
              <XAxis dataKey="date" tick={{ fontSize: 10 }} tickFormatter={v => v.slice(5)} />
              <YAxis tick={{ fontSize: 10 }} tickFormatter={v => `$${v}`} />
              <Tooltip formatter={(v: number) => [`$${v.toFixed(2)}`, 'Total']} />
              <Area type="monotone" dataKey="total" stroke="#10b981" fill="url(#cg)" strokeWidth={2} />
            </AreaChart>
          </ResponsiveContainer>
        </div>

        {/* By service pie */}
        <div className="bg-white dark:bg-slate-800 rounded-xl p-6 border border-slate-200 dark:border-slate-700">
          <h2 className="text-base font-semibold text-slate-900 dark:text-white mb-4">Cost by Service</h2>
          <ResponsiveContainer width="100%" height={240}>
            <PieChart>
              <Pie data={byService ?? []} dataKey="amount" nameKey="service" cx="50%" cy="50%" outerRadius={80} label={({ service }) => service}>
                {(byService ?? []).map((_: any, i: number) => (
                  <Cell key={i} fill={COLORS[i % COLORS.length]} />
                ))}
              </Pie>
              <Tooltip formatter={(v: number) => `$${v.toFixed(2)}`} />
            </PieChart>
          </ResponsiveContainer>
        </div>
      </div>

      {/* Anomalies */}
      <div className="bg-white dark:bg-slate-800 rounded-xl border border-slate-200 dark:border-slate-700">
        <div className="px-6 py-4 border-b border-slate-200 dark:border-slate-700">
          <h2 className="text-base font-semibold text-slate-900 dark:text-white">Cost Anomalies</h2>
        </div>
        <table className="w-full text-sm">
          <thead>
            <tr className="border-b border-slate-200 dark:border-slate-700">
              <th className="text-left px-6 py-3 text-slate-500 font-medium">Service</th>
              <th className="text-left px-6 py-3 text-slate-500 font-medium">Expected</th>
              <th className="text-left px-6 py-3 text-slate-500 font-medium">Actual</th>
              <th className="text-left px-6 py-3 text-slate-500 font-medium">Deviation</th>
              <th className="text-left px-6 py-3 text-slate-500 font-medium">Detected</th>
            </tr>
          </thead>
          <tbody>
            {(anomalies ?? []).map((a: any) => (
              <tr key={a.id} className="border-b border-slate-100 dark:border-slate-700/50">
                <td className="px-6 py-3 font-medium text-slate-900 dark:text-white">{a.service}</td>
                <td className="px-6 py-3 text-slate-500">${a.expected.toFixed(2)}</td>
                <td className="px-6 py-3 text-red-600 font-medium">${a.actual.toFixed(2)}</td>
                <td className="px-6 py-3"><Badge variant="error">+{a.deviation_pct.toFixed(1)}%</Badge></td>
                <td className="px-6 py-3 text-slate-500">{new Date(a.detected_at).toLocaleString()}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {/* Top services table */}
      <div className="bg-white dark:bg-slate-800 rounded-xl border border-slate-200 dark:border-slate-700">
        <div className="px-6 py-4 border-b border-slate-200 dark:border-slate-700">
          <h2 className="text-base font-semibold text-slate-900 dark:text-white">Top Services by Cost</h2>
        </div>
        <table className="w-full text-sm">
          <thead>
            <tr className="border-b border-slate-200 dark:border-slate-700">
              <th className="text-left px-6 py-3 text-slate-500 font-medium">Service</th>
              <th className="text-left px-6 py-3 text-slate-500 font-medium">Amount (MTD)</th>
              <th className="text-left px-6 py-3 text-slate-500 font-medium">Share</th>
            </tr>
          </thead>
          <tbody>
            {(byService ?? []).slice(0, 8).map((s: any, i: number) => {
              const total = (byService ?? []).reduce((acc: number, x: any) => acc + x.amount, 0);
              return (
                <tr key={i} className="border-b border-slate-100 dark:border-slate-700/50">
                  <td className="px-6 py-3 font-medium text-slate-900 dark:text-white">{s.service}</td>
                  <td className="px-6 py-3 text-slate-700 dark:text-slate-300">${s.amount.toLocaleString()}</td>
                  <td className="px-6 py-3">
                    <div className="flex items-center gap-2">
                      <div className="flex-1 bg-slate-200 dark:bg-slate-700 rounded-full h-1.5">
                        <div className="h-1.5 rounded-full bg-blue-500" style={{ width: `${(s.amount / total * 100).toFixed(0)}%` }} />
                      </div>
                      <span className="text-xs text-slate-500">{(s.amount / total * 100).toFixed(1)}%</span>
                    </div>
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
    </div>
  );
}
