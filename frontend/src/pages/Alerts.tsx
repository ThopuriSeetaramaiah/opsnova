import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { CheckCircle } from 'lucide-react';
import { alertsApi } from '../api/endpoints';
import Badge from '../components/UI/Badge';
import StatCard from '../components/UI/StatCard';
import { AlertTriangle, AlertCircle, Info } from 'lucide-react';

export default function Alerts() {
  const qc = useQueryClient();
  const [severityFilter, setSeverityFilter] = useState('');
  const [statusFilter, setStatusFilter] = useState('open');

  const { data: summary } = useQuery({
    queryKey: ['alert-summary'],
    queryFn: () => alertsApi.getSummary().then(r => r.data),
  });

  const { data: alerts = [], isLoading } = useQuery({
    queryKey: ['alerts', severityFilter, statusFilter],
    queryFn: () => alertsApi.getAll({ severity: severityFilter || undefined, status: statusFilter || undefined }).then(r => r.data),
  });

  const resolveMutation = useMutation({
    mutationFn: (id: number) => alertsApi.resolve(id),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['alerts'] });
      qc.invalidateQueries({ queryKey: ['alert-summary'] });
    },
  });

  const severityVariant = (s: string) =>
    s === 'critical' ? 'error' : s === 'warning' ? 'warning' : 'info';

  return (
    <div className="space-y-6">
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <StatCard title="Critical" value={summary?.critical ?? 0} icon={<AlertTriangle size={18} />} iconBg="bg-red-500" />
        <StatCard title="Warning" value={summary?.warning ?? 0} icon={<AlertCircle size={18} />} iconBg="bg-yellow-500" />
        <StatCard title="Info" value={summary?.info ?? 0} icon={<Info size={18} />} iconBg="bg-blue-500" />
      </div>

      {/* Filters */}
      <div className="flex gap-3 flex-wrap">
        <div className="flex gap-2">
          {['', 'critical', 'warning', 'info'].map(s => (
            <button key={s} onClick={() => setSeverityFilter(s)}
              className={`px-3 py-1.5 rounded-lg text-sm border transition-colors ${severityFilter === s ? 'bg-blue-600 text-white border-blue-600' : 'bg-white dark:bg-slate-800 text-slate-600 dark:text-slate-300 border-slate-200 dark:border-slate-700'}`}>
              {s || 'All Severity'}
            </button>
          ))}
        </div>
        <div className="flex gap-2">
          {['open', 'resolved', ''].map(s => (
            <button key={s} onClick={() => setStatusFilter(s)}
              className={`px-3 py-1.5 rounded-lg text-sm border transition-colors ${statusFilter === s ? 'bg-blue-600 text-white border-blue-600' : 'bg-white dark:bg-slate-800 text-slate-600 dark:text-slate-300 border-slate-200 dark:border-slate-700'}`}>
              {s || 'All Status'}
            </button>
          ))}
        </div>
      </div>

      <div className="bg-white dark:bg-slate-800 rounded-xl border border-slate-200 dark:border-slate-700 overflow-hidden">
        <table className="w-full text-sm">
          <thead>
            <tr className="border-b border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-700/50">
              {['Severity', 'Title', 'Resource', 'Status', 'Time', 'Action'].map(h => (
                <th key={h} className="text-left px-6 py-3 text-slate-500 font-medium">{h}</th>
              ))}
            </tr>
          </thead>
          <tbody>
            {isLoading ? (
              <tr><td colSpan={6} className="px-6 py-8 text-center text-slate-400">Loading...</td></tr>
            ) : alerts.length === 0 ? (
              <tr><td colSpan={6} className="px-6 py-8 text-center text-slate-400">No alerts found.</td></tr>
            ) : (
              alerts.map((a: any) => (
                <tr key={a.id} className="border-b border-slate-100 dark:border-slate-700/50 hover:bg-slate-50 dark:hover:bg-slate-700/30">
                  <td className="px-6 py-4"><Badge variant={severityVariant(a.severity)}>{a.severity}</Badge></td>
                  <td className="px-6 py-4 font-medium text-slate-900 dark:text-white max-w-xs">{a.title}</td>
                  <td className="px-6 py-4 text-slate-500 font-mono text-xs">{a.resource_id ?? '—'}</td>
                  <td className="px-6 py-4"><Badge variant={a.status === 'open' ? 'warning' : 'success'}>{a.status}</Badge></td>
                  <td className="px-6 py-4 text-slate-500 text-xs">{new Date(a.created_at).toLocaleString()}</td>
                  <td className="px-6 py-4">
                    {a.status === 'open' && (
                      <button
                        onClick={() => resolveMutation.mutate(a.id)}
                        className="flex items-center gap-1 px-3 py-1 text-xs bg-emerald-50 dark:bg-emerald-900/20 text-emerald-600 dark:text-emerald-400 rounded-lg hover:bg-emerald-100 dark:hover:bg-emerald-900/40 transition-colors"
                      >
                        <CheckCircle size={12} /> Resolve
                      </button>
                    )}
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}
