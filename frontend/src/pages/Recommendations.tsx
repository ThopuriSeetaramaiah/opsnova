import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Sparkles, Check, X } from 'lucide-react';
import { recommendationsApi } from '../api/endpoints';
import Badge from '../components/UI/Badge';

const categoryColors: Record<string, string> = {
  cost: 'bg-emerald-100 text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-400',
  security: 'bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400',
  performance: 'bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-400',
};

export default function Recommendations() {
  const qc = useQueryClient();
  const [filter, setFilter] = useState('');

  const { data: recs = [], isLoading } = useQuery({
    queryKey: ['recommendations', filter],
    queryFn: () => recommendationsApi.getAll(filter || undefined).then(r => r.data),
  });

  const generateMutation = useMutation({
    mutationFn: () => recommendationsApi.generate(),
    onSuccess: () => qc.invalidateQueries({ queryKey: ['recommendations'] }),
  });

  const statusMutation = useMutation({
    mutationFn: ({ id, status }: { id: number; status: string }) => recommendationsApi.updateStatus(id, status),
    onSuccess: () => qc.invalidateQueries({ queryKey: ['recommendations'] }),
  });

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between flex-wrap gap-3">
        <div className="flex gap-2">
          {['', 'cost', 'security', 'performance'].map(cat => (
            <button
              key={cat}
              onClick={() => setFilter(cat)}
              className={`px-3 py-1.5 rounded-lg text-sm font-medium border transition-colors ${
                filter === cat
                  ? 'bg-blue-600 text-white border-blue-600'
                  : 'bg-white dark:bg-slate-800 text-slate-600 dark:text-slate-300 border-slate-200 dark:border-slate-700'
              }`}
            >
              {cat || 'All'}
            </button>
          ))}
        </div>
        <button
          onClick={() => generateMutation.mutate()}
          disabled={generateMutation.isPending}
          className="flex items-center gap-2 px-4 py-2 bg-purple-600 hover:bg-purple-700 disabled:opacity-50 text-white rounded-lg text-sm font-medium transition-colors"
        >
          <Sparkles size={16} />
          {generateMutation.isPending ? 'Generating...' : 'Generate with AI'}
        </button>
      </div>

      {isLoading ? (
        <div className="text-center py-12 text-slate-400">Loading recommendations...</div>
      ) : recs.length === 0 ? (
        <div className="text-center py-12 bg-white dark:bg-slate-800 rounded-xl border border-slate-200 dark:border-slate-700">
          <Sparkles size={40} className="mx-auto text-slate-300 mb-3" />
          <p className="text-slate-500">No recommendations yet. Click "Generate with AI" to get started.</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
          {recs.filter((r: any) => r.status === 'open').map((r: any) => (
            <div key={r.id} className="bg-white dark:bg-slate-800 rounded-xl p-5 border border-slate-200 dark:border-slate-700">
              <div className="flex items-start justify-between gap-3 mb-3">
                <div className="flex items-center gap-2 flex-wrap">
                  <span className={`px-2 py-0.5 rounded-md text-xs font-medium ${categoryColors[r.category] ?? ''}`}>
                    {r.category}
                  </span>
                  <Badge variant={r.priority === 'high' ? 'error' : r.priority === 'medium' ? 'warning' : 'info'}>
                    {r.priority}
                  </Badge>
                </div>
                <div className="flex gap-1 flex-shrink-0">
                  <button
                    onClick={() => statusMutation.mutate({ id: r.id, status: 'accepted' })}
                    className="p-1.5 text-emerald-500 hover:bg-emerald-50 dark:hover:bg-emerald-900/20 rounded-lg"
                    title="Accept"
                  >
                    <Check size={14} />
                  </button>
                  <button
                    onClick={() => statusMutation.mutate({ id: r.id, status: 'dismissed' })}
                    className="p-1.5 text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-700 rounded-lg"
                    title="Dismiss"
                  >
                    <X size={14} />
                  </button>
                </div>
              </div>
              <h3 className="font-semibold text-slate-900 dark:text-white mb-2">{r.title}</h3>
              <p className="text-sm text-slate-500 dark:text-slate-400">{r.description}</p>
              {r.estimated_savings > 0 && (
                <div className="mt-3 pt-3 border-t border-slate-100 dark:border-slate-700">
                  <span className="text-sm font-medium text-emerald-600 dark:text-emerald-400">
                    💰 Estimated savings: ${r.estimated_savings}/month
                  </span>
                </div>
              )}
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
