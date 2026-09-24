import React from 'react';
import { useSalesWorkflow } from '../context/SalesWorkflowContext';
import { User } from '../types';
import salesLogo from '../assets/images/saleslogo.png';
import {
  TrendingUp,
  ShieldCheck,
  Users,
  Layers,
  FileSpreadsheet,
  Terminal,
  Download,
  LogOut
} from 'lucide-react';

interface NavbarProps {
  activeTab: string;
  setActiveTab: (tab: string) => void;
  onOpenExportModal: () => void;
  currentUser: User;
  onLogout: () => Promise<void>;
}

export const Navbar: React.FC<NavbarProps> = ({
  activeTab,
  setActiveTab,
  onOpenExportModal,
  currentUser,
  onLogout
}) => {
  const { payments } = useSalesWorkflow();

  const pendingCount = payments.filter((p) => p.status === 'pending').length;

  const navLinks = [
    { id: 'dashboard', label: 'Dashboard', icon: TrendingUp },
    { id: 'pipeline', label: 'Pipeline', icon: Layers },
    {
      id: 'finance',
      label: 'Finance',
      icon: ShieldCheck,
      badge: pendingCount > 0 ? pendingCount : null
    },
    { id: 'closers', label: 'Closers', icon: Users },
    { id: 'attribution', label: 'Ledger', icon: FileSpreadsheet },
    { id: 'api_sync', label: 'Sync & API', icon: Terminal }
  ];

  return (
    <header className="sticky top-0 z-40 w-full shrink-0 border-b border-slate-200 bg-white/95 backdrop-blur-md shadow-xs">
      <div className="flex h-16 w-full items-center justify-between px-4 sm:px-6 lg:px-8">
        {/* Brand */}
        <div className="flex items-center gap-2.5">
          <img
            src={salesLogo}
            alt="TMT Sales"
            className="h-11 w-11 object-contain"
          />
          <button
            onClick={() => setActiveTab('dashboard')}
            className="text-sm font-bold tracking-tight text-slate-900 hover:text-emerald-700 transition-colors"
          >
            Sales Engine
          </button>
        </div>

        {/* Clean nav links */}
        <nav className="hidden md:flex items-center gap-1">
          {navLinks.map((item) => {
            const Icon = item.icon;
            const isActive = activeTab === item.id;
            return (
              <button
                key={item.id}
                onClick={() => setActiveTab(item.id)}
                className={`relative flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium rounded-lg transition-all ${
                  isActive
                    ? 'bg-emerald-50 text-emerald-800 border border-emerald-200 shadow-xs font-semibold'
                    : 'text-slate-600 hover:text-slate-900 hover:bg-slate-100'
                }`}
              >
                <Icon className={`h-3.5 w-3.5 ${isActive ? 'text-emerald-600' : 'text-slate-400'}`} />
                <span>{item.label}</span>
                {item.badge !== null && item.badge !== undefined && (
                  <span className="ml-1 inline-flex items-center justify-center px-1.5 py-0.2 text-[10px] font-mono font-bold text-amber-900 bg-amber-100 border border-amber-300 rounded">
                    {item.badge}
                  </span>
                )}
              </button>
            );
          })}
        </nav>

        {/* Right Actions */}
        <div className="flex items-center gap-2.5">
          <div className="hidden xl:flex items-center gap-2 border-r border-slate-200 pr-2.5">
            <div className="flex h-7 w-7 items-center justify-center rounded-full bg-emerald-100 text-[10px] font-bold text-emerald-800 ring-1 ring-emerald-200">
              {currentUser.name.split(' ').map((part) => part[0]).join('').slice(0, 2).toUpperCase()}
            </div>
            <div className="max-w-32">
              <p className="truncate text-[11px] font-semibold text-slate-800">{currentUser.name}</p>
              <p className="truncate text-[9px] uppercase tracking-wide text-slate-400">{currentUser.role.replace('_', ' ')}</p>
            </div>
          </div>

          <button
            onClick={onOpenExportModal}
            className="hidden sm:inline-flex items-center gap-1.5 px-2.5 py-1.5 text-xs font-medium text-slate-700 bg-white hover:bg-slate-50 border border-slate-200 rounded-lg shadow-xs transition-colors"
          >
            <Download className="h-3.5 w-3.5 text-slate-500" />
            <span>Export</span>
          </button>

          <button
            type="button"
            onClick={() => void onLogout()}
            className="inline-flex items-center gap-1.5 rounded-lg border border-slate-200 bg-white p-2 text-xs font-medium text-slate-600 shadow-xs transition-colors hover:border-rose-200 hover:bg-rose-50 hover:text-rose-700 sm:px-2.5 sm:py-1.5"
            title="Sign out"
          >
            <LogOut className="h-3.5 w-3.5" />
            <span className="hidden sm:inline">Sign out</span>
          </button>
        </div>
      </div>

      {/* Mobile strip */}
      <div className="md:hidden flex items-center gap-1 overflow-x-auto px-4 py-1.5 border-t border-slate-200 bg-white">
        {navLinks.map((item) => (
          <button
            key={item.id}
            onClick={() => setActiveTab(item.id)}
            className={`flex items-center gap-1 px-2.5 py-1 text-xs whitespace-nowrap rounded-md ${
              activeTab === item.id
                ? 'bg-emerald-50 text-emerald-800 font-semibold border border-emerald-200'
                : 'text-slate-600'
            }`}
          >
            <span>{item.label}</span>
            {item.badge !== null && item.badge !== undefined && (
              <span className="px-1 text-[10px] font-mono bg-amber-100 text-amber-900 border border-amber-300 rounded font-bold">
                {item.badge}
              </span>
            )}
          </button>
        ))}
      </div>
    </header>
  );
};
