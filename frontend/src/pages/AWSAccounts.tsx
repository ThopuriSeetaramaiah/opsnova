import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Plus, RefreshCw, Trash2 } from 'lucide-react';
import { awsApi } from '../api/endpoints';
import Badge from '../components/UI/Badge';
import Modal from '../components/UI/Modal';

export default function AWSAccounts() {
  const qc = useQueryClient();
  const [showModal, setShowModal] = useState(false);
  const [form, setForm] = useState({ account_id: '', account_name: '', role_arn: '', external_id: '', regions: 'us-east-1' });

  const { data: accounts = [], isLoading } = useQuery({
    queryKey: ['accounts'],
    queryFn: () => awsApi.getAccounts().then(r => r.data),
  });

  const addMutation = useMutation({
    mutationFn: () => awsApi.addAccount({ ...form, regions: form.regions.split(',').map(r => r.trim()) }),
    onSuccess: () => { qc.invalidateQueries({ queryKey: ['accounts'] }); setShowModal(false); },
  });

  const syncMutation = useMutation({
    mutationFn: (id: number) => awsApi.syncAccount(id),
    onSuccess: () => qc.invalidateQueries({ queryKey: ['accounts'] }),
  });

  const deleteMutation = useMutation({
    mutationFn: (id: number) => awsApi.deleteAccount(id),
    onSuccess: () => qc.invalidateQueries({ queryKey: ['accounts'] }),
  });

  const statusVariant = (s: string) =>
    s === 'active' ? 'success' : s === 'error' ? 'error' : s === 'syncing' ? 'info' : 'default';

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <p className="text-slate-500 dark:text-slate-400">{accounts.length} account(s) connected</p>
        <button
          onClick={() => setShowModal(true)}
          className="flex items-center gap-2 px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg text-sm font-medium transition-colors"
        >
          <Plus size={16} /> Add Account
        </button>
      </div>

      <div className="bg-white dark:bg-slate-800 rounded-xl border border-slate-200 dark:border-slate-700 overflow-hidden">
        <table className="w-full text-sm">
          <thead>
            <tr className="border-b border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-700/50">
              <th className="text-left px-6 py-3 text-slate-500 font-medium">Account</th>
              <th className="text-left px-6 py-3 text-slate-500 font-medium">Account ID</th>
              <th className="text-left px-6 py-3 text-slate-500 font-medium">Regions</th>
              <th className="text-left px-6 py-3 text-slate-500 font-medium">Status</th>
              <th className="text-left px-6 py-3 text-slate-500 font-medium">Last Synced</th>
              <th className="text-left px-6 py-3 text-slate-500 font-medium">Actions</th>
            </tr>
          </thead>
          <tbody>
            {isLoading ? (
              <tr><td colSpan={6} className="px-6 py-8 text-center text-slate-400">Loading...</td></tr>
            ) : accounts.length === 0 ? (
              <tr><td colSpan={6} className="px-6 py-8 text-center text-slate-400">No accounts yet. Add your first AWS account.</td></tr>
            ) : (
              accounts.map((a: any) => (
                <tr key={a.id} className="border-b border-slate-100 dark:border-slate-700/50 hover:bg-slate-50 dark:hover:bg-slate-700/30">
                  <td className="px-6 py-4 font-medium text-slate-900 dark:text-white">{a.account_name}</td>
                  <td className="px-6 py-4 text-slate-500 font-mono text-xs">{a.account_id}</td>
                  <td className="px-6 py-4 text-slate-500">{(a.regions ?? []).join(', ')}</td>
                  <td className="px-6 py-4"><Badge variant={statusVariant(a.status)}>{a.status}</Badge></td>
                  <td className="px-6 py-4 text-slate-500">{a.last_synced ? new Date(a.last_synced).toLocaleString() : 'Never'}</td>
                  <td className="px-6 py-4">
                    <div className="flex items-center gap-2">
                      <button onClick={() => syncMutation.mutate(a.id)} className="p-1.5 text-blue-500 hover:bg-blue-50 dark:hover:bg-blue-900/20 rounded-lg" title="Sync">
                        <RefreshCw size={14} />
                      </button>
                      <button onClick={() => deleteMutation.mutate(a.id)} className="p-1.5 text-red-500 hover:bg-red-50 dark:hover:bg-red-900/20 rounded-lg" title="Delete">
                        <Trash2 size={14} />
                      </button>
                    </div>
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>

      <Modal isOpen={showModal} onClose={() => setShowModal(false)} title="Add AWS Account">
        <div className="space-y-4">
          {[
            { label: 'Account Name', key: 'account_name', placeholder: 'Production' },
            { label: 'AWS Account ID', key: 'account_id', placeholder: '123456789012' },
            { label: 'IAM Role ARN', key: 'role_arn', placeholder: 'arn:aws:iam::123456789012:role/OpsNovaRole' },
            { label: 'External ID (optional)', key: 'external_id', placeholder: 'optional-external-id' },
            { label: 'Regions (comma-separated)', key: 'regions', placeholder: 'us-east-1, us-west-2' },
          ].map(({ label, key, placeholder }) => (
            <div key={key}>
              <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">{label}</label>
              <input
                value={(form as any)[key]}
                onChange={e => setForm(p => ({ ...p, [key]: e.target.value }))}
                placeholder={placeholder}
                className="w-full px-3 py-2 border border-slate-300 dark:border-slate-600 rounded-lg bg-white dark:bg-slate-700 text-slate-900 dark:text-white text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>
          ))}
          <div className="flex gap-3 pt-2">
            <button onClick={() => setShowModal(false)} className="flex-1 px-4 py-2 border border-slate-300 dark:border-slate-600 rounded-lg text-sm font-medium text-slate-700 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-700">
              Cancel
            </button>
            <button
              onClick={() => addMutation.mutate()}
              disabled={addMutation.isPending}
              className="flex-1 px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg text-sm font-medium disabled:opacity-50"
            >
              {addMutation.isPending ? 'Adding...' : 'Add Account'}
            </button>
          </div>
        </div>
      </Modal>
    </div>
  );
}
