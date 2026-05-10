import { useState, useEffect } from 'react';
import { useQuery } from '@tanstack/react-query';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';
import { k8sApi } from '../api/endpoints';
import Badge from '../components/UI/Badge';
import StatCard from '../components/UI/StatCard';
import { Server, Cpu, Activity } from 'lucide-react';

export default function Kubernetes() {
  const [selectedCluster, setSelectedCluster] = useState<string | null>(null);

  const { data: clusters = [] } = useQuery<any[]>({
    queryKey: ['clusters'],
    queryFn: () => k8sApi.getClusters().then(r => r.data),
  });

  useEffect(() => {
    if (clusters.length && !selectedCluster) setSelectedCluster(clusters[0].id);
  }, [clusters]);

  const { data: nodes = [] } = useQuery({
    queryKey: ['nodes', selectedCluster],
    queryFn: () => k8sApi.getNodes(selectedCluster!).then(r => r.data),
    enabled: !!selectedCluster,
  });

  const { data: metrics } = useQuery({
    queryKey: ['metrics', selectedCluster],
    queryFn: () => k8sApi.getMetrics(selectedCluster!).then(r => r.data),
    enabled: !!selectedCluster,
  });

  const cluster = clusters.find((c: any) => c.id === selectedCluster);

  return (
    <div className="space-y-6">
      {/* Cluster selector */}
      <div className="flex gap-3 flex-wrap">
        {clusters.map((c: any) => (
          <button
            key={c.id}
            onClick={() => setSelectedCluster(c.id)}
            className={`px-4 py-2 rounded-lg text-sm font-medium border transition-colors ${
              selectedCluster === c.id
                ? 'bg-blue-600 text-white border-blue-600'
                : 'bg-white dark:bg-slate-800 text-slate-700 dark:text-slate-300 border-slate-200 dark:border-slate-700 hover:border-blue-400'
            }`}
          >
            {c.name}
          </button>
        ))}
      </div>

      {cluster && (
        <>
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            <StatCard title="Nodes" value={cluster.node_count} icon={<Server size={18} />} iconBg="bg-purple-500" />
            <StatCard title="CPU Utilization" value={`${cluster.cpu_utilization}%`} icon={<Cpu size={18} />} iconBg="bg-blue-500" />
            <StatCard title="Total Pods" value={cluster.pod_count} icon={<Activity size={18} />} iconBg="bg-emerald-500" />
          </div>

          <div className="grid grid-cols-1 xl:grid-cols-2 gap-6">
            {/* Pod status */}
            {metrics && (
              <div className="bg-white dark:bg-slate-800 rounded-xl p-6 border border-slate-200 dark:border-slate-700">
                <h2 className="text-base font-semibold text-slate-900 dark:text-white mb-4">Pod Status</h2>
                <div className="flex gap-4">
                  {Object.entries(metrics.pod_count).map(([status, count]) => (
                    <div key={status} className="flex-1 text-center p-4 bg-slate-50 dark:bg-slate-700/50 rounded-lg">
                      <p className="text-2xl font-bold text-slate-900 dark:text-white">{count as number}</p>
                      <p className="text-sm text-slate-500 capitalize">{status}</p>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Namespace breakdown */}
            {metrics && (
              <div className="bg-white dark:bg-slate-800 rounded-xl p-6 border border-slate-200 dark:border-slate-700">
                <h2 className="text-base font-semibold text-slate-900 dark:text-white mb-4">Namespace Breakdown</h2>
                <ResponsiveContainer width="100%" height={180}>
                  <BarChart data={metrics.namespace_breakdown}>
                    <CartesianGrid strokeDasharray="3 3" opacity={0.2} />
                    <XAxis dataKey="namespace" tick={{ fontSize: 11 }} />
                    <YAxis tick={{ fontSize: 11 }} />
                    <Tooltip />
                    <Bar dataKey="pods" fill="#8b5cf6" radius={[4, 4, 0, 0]} />
                  </BarChart>
                </ResponsiveContainer>
              </div>
            )}
          </div>

          {/* Nodes table */}
          <div className="bg-white dark:bg-slate-800 rounded-xl border border-slate-200 dark:border-slate-700">
            <div className="px-6 py-4 border-b border-slate-200 dark:border-slate-700">
              <h2 className="text-base font-semibold text-slate-900 dark:text-white">Nodes</h2>
            </div>
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-slate-200 dark:border-slate-700">
                  {['Node', 'Status', 'Instance Type', 'CPU %', 'Memory %', 'Pods'].map(h => (
                    <th key={h} className="text-left px-6 py-3 text-slate-500 font-medium">{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {nodes.map((n: any) => (
                  <tr key={n.name} className="border-b border-slate-100 dark:border-slate-700/50">
                    <td className="px-6 py-3 font-medium text-slate-900 dark:text-white">{n.name}</td>
                    <td className="px-6 py-3"><Badge variant="success">{n.status}</Badge></td>
                    <td className="px-6 py-3 text-slate-500">{n.instance_type}</td>
                    <td className="px-6 py-3">
                      <div className="flex items-center gap-2">
                        <div className="w-16 bg-slate-200 dark:bg-slate-700 rounded-full h-1.5">
                          <div className="h-1.5 rounded-full bg-blue-500" style={{ width: `${n.cpu_utilization}%` }} />
                        </div>
                        <span className="text-xs text-slate-500">{n.cpu_utilization}%</span>
                      </div>
                    </td>
                    <td className="px-6 py-3">
                      <div className="flex items-center gap-2">
                        <div className="w-16 bg-slate-200 dark:bg-slate-700 rounded-full h-1.5">
                          <div className="h-1.5 rounded-full bg-purple-500" style={{ width: `${n.memory_utilization}%` }} />
                        </div>
                        <span className="text-xs text-slate-500">{n.memory_utilization}%</span>
                      </div>
                    </td>
                    <td className="px-6 py-3 text-slate-500">{n.pod_count}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </>
      )}
    </div>
  );
}
