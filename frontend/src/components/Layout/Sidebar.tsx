import { useState } from 'react';
import { NavLink } from 'react-router-dom';
import {
  LayoutDashboard, Cloud, DollarSign, Server, Lightbulb,
  Bell, BarChart3, ChevronLeft, ChevronRight, Zap,
} from 'lucide-react';
import clsx from 'clsx';

const navItems = [
  { to: '/dashboard', icon: LayoutDashboard, label: 'Dashboard' },
  { to: '/aws-accounts', icon: Cloud, label: 'AWS Accounts' },
  { to: '/costs', icon: DollarSign, label: 'Cost Analytics' },
  { to: '/kubernetes', icon: Server, label: 'Kubernetes' },
  { to: '/recommendations', icon: Lightbulb, label: 'AI Recommendations' },
  { to: '/alerts', icon: Bell, label: 'Alerts' },
  { to: '/reports', icon: BarChart3, label: 'Reports' },
];

export default function Sidebar() {
  const [collapsed, setCollapsed] = useState(false);

  return (
    <aside
      className={clsx(
        'flex flex-col h-screen bg-slate-900 dark:bg-slate-950 text-white transition-all duration-300 border-r border-slate-700',
        collapsed ? 'w-16' : 'w-64'
      )}
    >
      {/* Logo */}
      <div className="flex items-center gap-3 px-4 py-5 border-b border-slate-700">
        <div className="flex-shrink-0 w-8 h-8 bg-blue-500 rounded-lg flex items-center justify-center">
          <Zap size={18} className="text-white" />
        </div>
        {!collapsed && (
          <span className="font-bold text-lg tracking-tight">OpsNova</span>
        )}
      </div>

      {/* Nav */}
      <nav className="flex-1 px-2 py-4 space-y-1 overflow-y-auto">
        {navItems.map(({ to, icon: Icon, label }) => (
          <NavLink
            key={to}
            to={to}
            className={({ isActive }) =>
              clsx(
                'flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-colors',
                isActive
                  ? 'bg-blue-600 text-white'
                  : 'text-slate-400 hover:bg-slate-800 hover:text-white'
              )
            }
          >
            <Icon size={18} className="flex-shrink-0" />
            {!collapsed && <span>{label}</span>}
          </NavLink>
        ))}
      </nav>

      {/* Collapse toggle */}
      <button
        onClick={() => setCollapsed(p => !p)}
        className="flex items-center justify-center p-3 border-t border-slate-700 text-slate-400 hover:text-white hover:bg-slate-800 transition-colors"
      >
        {collapsed ? <ChevronRight size={18} /> : <ChevronLeft size={18} />}
      </button>
    </aside>
  );
}
