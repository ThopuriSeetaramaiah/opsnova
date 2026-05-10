import { useQuery } from '@tanstack/react-query';
import { Cloud, DollarSign, Bell, Server } from 'lucide-react';
import {
  AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, BarChart, Bar,
} from 'recharts';
import StatCard from '../components/UI/StatCard';
import Badge from '../components/UI/Badge';
import { costsApi, alertsApi, awsApi, k8sApi, recommendationsApi } from '../api/endpoints';

export default function Dashboard() {
  const { data: costSummary } = useQuery({ queryKey: ['cost-summary'], queryFn: () => costsApi.getSummary().then(r => r.data) });
  const { data: costTrend } = useQuery({ queryKey: ['cost-trend'], queryFn: () => costsApi.getTrend(14).then(r => r.data) });
  const { data: alertSummary } = useQuery({ queryKey: ['alert-summary'], queryFn: () => alertsApi.getSummary().then(r => r.data) });
  const { data: accounts } = useQuery({ queryKey: ['accounts'], queryFn: () => awsApi.getAccounts().then(r => r.data) });
  const { data: clusters } = useQuery({ queryKey: ['clusters'], queryFn: () => k8sApi.getClusters().then(r => r.data) });
  const { data: recommendations } = useQuery({ queryKey: ['recommendations'], queryFn: () => recommendationsApi.getAll().then(r => r.data) });
  const { data: alerts } = useQuery({ queryKey: ['alerts'], queryFn: () => alertsApi.getAll({ status: 'open' }).then(r => r.data) });

  const severityVariant = (s: string) =>
    s === 'critical' ? 'error' : s === 'warning' ? 'warning' : 'info';

  return (
    <div className="space-y-6">
      {/* Stat cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-4 gap-4">
        <StatCard title="AWS Accounts" value={accounts?.length ?? 0} icon={<Cloud size={18} />} iconBg="bg-blue-500" />
        <StatCard
          title="Monthly Cost"
          value={costSummary ? `$${costSummary.total_mtd.toLocaleString()}` : '—'}
          icon={<DollarSign size={18} />}
          iconBg="bg-emerald-500"
          change={costSummary?.mom_change_pct}
        />
        <StatCard title="Active Alerts" value={alertSummary?.total_open ?? 0} icon={<Bell size={18} />} iconBg="bg-red-500" />
        <StatCard title="K8s Clusters" value={clusters?.length ?? 0} icon={<Server size={18} />} iconBg="bg-purple-500" />
      </div>

      <div className="grid grid-cols-1 xl:grid-cols-3 gap-6">
        {/* Cost trend */}
        <div className="xl:col-span-2 bg-white dark:bg-slate-800 rounded-xl p-6 border border-slate-200 dark:border-slate-700">
          <h2 className="text-base font-semibold text-slate-900 dark:text-white mb-4">Cost Trend (14 days)</h2>
          <ResponsiveContainer width="100%" height={220}>
            <AreaChart data={costTrend ?? []}>
              <defs>
                <linearGradient id="costGrad" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="#3b82f6" stopOpacity={0.3} />
                  <stop offset="95%" stopColor="#3b82f6" stopOpacity={0} />
                </linearGradient>
              </defs>
              <CartesianGrid strokeDasharray="3 3" stroke="#334155" opacity={0.3} />
              <XAxis dataKey="date" tick={{ fontSize: 11 }} tickFormatter={v => v.slice(5)} />
              <YAxis tick={{ fontSize: 11 }} tickFormatter={v => `$${v}`} />
              <Tooltip formatter={(v: number) => [`$${v.toFixed(2)}`, 'Total']} />
              <Area type="monotone" dataKey="total" stroke="#3b82f6" fill="url(#costGrad)" strokeWidth={2} />
            </AreaChart>
          </ResponsiveContainer>
        </div>

        {/* Top recommendations */}
        <div className="bg-white dark:bg-slate-800 rounded-xl p-6 border border-slate-200 dark:border-slate-700">
          <h2 className="text-base font-semibold text-slate-900 dark:text-white mb-4">Top Recommendations</h2>
          <div className="space-y-3">
            {(recommendations ?? []).slice(0, 4).map((r: any) => (
              <div key={r.id} className="p-3 bg-slate-50 dark:bg-slate-700/50 rounded-lg">
                <div className="flex items-start justify-between gap-2">
                  <p className="text-sm font-medium text-slate-900 dark:text-white line-clamp-2">{r.title}</p>
                  <Badge variant={r.priority === 'high' ? 'error' : r.priority === 'medium' ? 'warning' : 'info'}>
                    {r.priority}
                  </Badge>
                </div>
                {r.estimated_savings > 0 && (
                  <p className="text-xs text-emerald-600 dark:text-emerald-400 mt-1">
                    Save ${r.estimated_savings}/mo
                  </p>
                )}
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Recent alerts */}
      <div className="bg-white dark:bg-slate-800 rounded-xl border border-slate-200 dark:border-slate-700">
        <div className="px-6 py-4 border-b border-slate-200 dark:border-slate-700">
          <h2 className="text-base font-semibold text-slate-900 dark:text-white">Recent Alerts</h2>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-slate-200 dark:border-slate-700">
                <th className="text-left px-6 py-3 text-slate-500 font-medium">Severity</th>
                <th className="text-left px-6 py-3 text-slate-500 font-medium">Title</th>
                <th className="text-left px-6 py-3 text-slate-500 font-medium">Resource</th>
                <th className="text-left px-6 py-3 text-slate-500 font-medium">Status</th>
              </tr>
            </thead>
            <tbody>
              {(alerts ?? []).slice(0, 5).map((a: any) => (
                <tr key={a.id} className="border-b border-slate-100 dark:border-slate-700/50 hover:bg-slate-50 dark:hover:bg-slate-700/30">
                  <td className="px-6 py-3">
                    <Badge variant={severityVariant(a.severity)}>{a.severity}</Badge>
                  </td>
                  <td className="px-6 py-3 text-slate-900 dark:text-white">{a.title}</td>
                  <td className="px-6 py-3 text-slate-500">{a.resource_id ?? '—'}</td>
                  <td className="px-6 py-3">
                    <Badge variant={a.status === 'open' ? 'warning' : 'success'}>{a.status}</Badge>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
