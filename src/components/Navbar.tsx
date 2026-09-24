import React, { useState } from 'react';
import { useSalesWorkflow } from '../context/SalesWorkflowContext';
import salesLogo from '../assets/images/saleslogo.jpg';
import {
  TrendingUp,
  ShieldCheck,
  Users,
  Layers,
  FileSpreadsheet,
  Terminal,
  Download,
  ChevronDown,
  UserCheck
} from 'lucide-react';

interface NavbarProps {
  activeTab: string;
  setActiveTab: (tab: string) => void;
  onOpenExportModal: () => void;
  onOpenAuthModal: () => void;
}

export const Navbar: React.FC<NavbarProps> = ({
  activeTab,
  setActiveTab,
  onOpenExportModal,
  onOpenAuthModal
}) => {
  const { currentUser, payments } = useSalesWorkflow();
  const [userDropdownOpen, setUserDropdownOpen] = useState(false);

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
    <header className="sticky top-0 z-40 w-full border-b border-slate-200 bg-white/95 backdrop-blur-md shadow-xs">
      <div className="mx-auto flex h-14 max-w-7xl items-center justify-between px-4 sm:px-6 lg:px-8">
        {/* Brand */}
        <div className="flex items-center gap-2.5">
          <img
            src={salesLogo}
            alt="TMT Sales"
            className="h-8 w-8 rounded-lg border border-emerald-200 bg-white object-cover object-center shadow-xs"
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
          <button
            onClick={onOpenExportModal}
            className="hidden sm:inline-flex items-center gap-1.5 px-2.5 py-1.5 text-xs font-medium text-slate-700 bg-white hover:bg-slate-50 border border-slate-200 rounded-lg shadow-xs transition-colors"
          >
            <Download className="h-3.5 w-3.5 text-slate-500" />
            <span>Export</span>
          </button>

          {/* User Role Switcher */}
          <div className="relative">
            <button
              onClick={() => setUserDropdownOpen(!userDropdownOpen)}
              className="flex items-center gap-2 px-2.5 py-1.5 rounded-lg border border-slate-200 bg-white hover:bg-slate-50 shadow-xs transition-colors text-left"
            >
              {currentUser.avatarUrl ? (
                <img
                  src={currentUser.avatarUrl}
                  alt={currentUser.name}
                  referrerPolicy="no-referrer"
                  className="h-6 w-6 rounded-full object-cover ring-1 ring-emerald-500"
                />
              ) : (
                <div className="h-6 w-6 rounded-full bg-emerald-100 flex items-center justify-center text-[10px] font-mono font-bold text-emerald-800 border border-emerald-300">
                  {currentUser.name.slice(0, 2).toUpperCase()}
                </div>
              )}
              <div className="hidden lg:flex flex-col">
                <span className="text-xs font-semibold text-slate-900 leading-tight">
                  {currentUser.name}
                </span>
                <span className="text-[10px] text-emerald-700 leading-tight font-mono capitalize">
                  {currentUser.role.replace('_', ' ')}
                </span>
              </div>
              <ChevronDown className="h-3 w-3 text-slate-400" />
            </button>

            {userDropdownOpen && (
              <>
                <div
                  className="fixed inset-0 z-40"
                  onClick={() => setUserDropdownOpen(false)}
                />
                <div className="absolute right-0 mt-1.5 w-56 rounded-xl border border-slate-200 bg-white p-2 shadow-xl z-50">
                  <div className="px-3 py-2 border-b border-slate-100 mb-1">
                    <p className="text-xs font-bold text-slate-900">{currentUser.name}</p>
                    <p className="text-[11px] text-slate-500 font-mono truncate">{currentUser.email}</p>
                  </div>

                  <button
                    onClick={() => {
                      setUserDropdownOpen(false);
                      onOpenAuthModal();
                    }}
                    className="w-full flex items-center gap-2 px-3 py-2 text-xs text-slate-700 hover:bg-slate-50 rounded-lg transition-colors text-left"
                  >
                    <UserCheck className="h-3.5 w-3.5 text-emerald-600" />
                    <span>Switch Role / Account</span>
                  </button>
                </div>
              </>
            )}
          </div>
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
