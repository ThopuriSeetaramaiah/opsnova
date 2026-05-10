import { ReactNode } from 'react';
import { TrendingUp, TrendingDown } from 'lucide-react';
import clsx from 'clsx';

interface StatCardProps {
  title: string;
  value: string | number;
  icon: ReactNode;
  change?: number;
  iconBg?: string;
}

export default function StatCard({ title, value, icon, change, iconBg = 'bg-blue-500' }: StatCardProps) {
  return (
    <div className="bg-white dark:bg-slate-800 rounded-xl p-6 border border-slate-200 dark:border-slate-700 shadow-sm">
      <div className="flex items-center justify-between mb-4">
        <p className="text-sm font-medium text-slate-500 dark:text-slate-400">{title}</p>
        <div className={clsx('w-10 h-10 rounded-lg flex items-center justify-center text-white', iconBg)}>
          {icon}
        </div>
      </div>
      <p className="text-2xl font-bold text-slate-900 dark:text-white">{value}</p>
      {change !== undefined && (
        <div className={clsx('flex items-center gap-1 mt-2 text-sm', change >= 0 ? 'text-green-600' : 'text-red-500')}>
          {change >= 0 ? <TrendingUp size={14} /> : <TrendingDown size={14} />}
          <span>{Math.abs(change)}% from last month</span>
        </div>
      )}
    </div>
  );
}
