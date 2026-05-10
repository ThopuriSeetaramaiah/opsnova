import { ReactNode } from 'react';
import { useLocation } from 'react-router-dom';
import Sidebar from './Sidebar';
import Header from './Header';

const pageTitles: Record<string, string> = {
  '/dashboard': 'Dashboard',
  '/aws-accounts': 'AWS Accounts',
  '/costs': 'Cost Analytics',
  '/kubernetes': 'Kubernetes',
  '/recommendations': 'AI Recommendations',
  '/alerts': 'Alerts',
  '/reports': 'Reports',
};

export default function MainLayout({ children }: { children: ReactNode }) {
  const { pathname } = useLocation();
  const title = pageTitles[pathname] ?? 'OpsNova';

  return (
    <div className="flex h-screen overflow-hidden bg-slate-50 dark:bg-slate-900">
      <Sidebar />
      <div className="flex flex-col flex-1 overflow-hidden">
        <Header title={title} />
        <main className="flex-1 overflow-y-auto p-6">{children}</main>
      </div>
    </div>
  );
}
