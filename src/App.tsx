/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useEffect, useState } from 'react';
import { SalesWorkflowProvider, useSalesWorkflow } from './context/SalesWorkflowContext';
import { salesApi } from './api/salesApi';
import { User } from './types';
import { Navbar } from './components/Navbar';
import { LandingPage } from './components/LandingPage';
import { KpiOverview } from './components/KpiOverview';
import { FinanceVerificationView } from './components/FinanceVerificationView';
import { LeadPipelineView } from './components/LeadPipelineView';
import { CloserPerformanceView } from './components/CloserPerformanceView';
import { StudentAttributionLedger } from './components/StudentAttributionLedger';
import { SalesApiSimulator } from './components/SalesApiSimulator';
import { ExportReportModal } from './components/ExportReportModal';
import { ToastContainer } from './components/ToastContainer';
import { LoaderCircle, RotateCcw } from 'lucide-react';

interface DashboardContentProps {
  currentUser: User;
  onLogout: () => Promise<void>;
}

function DashboardContent({ currentUser, onLogout }: DashboardContentProps) {
  const [activeTab, setActiveTab] = useState<string>('dashboard');
  const [isExportModalOpen, setIsExportModalOpen] = useState(false);

  const { resetToDefaults, payments, isLoading, connectionError, effectivePeriod } = useSalesWorkflow();
  const pendingCount = payments.filter((p) => p.status === 'pending').length;

  return (
    <div className="h-dvh overflow-hidden bg-[#f8fafc] text-slate-900 flex flex-col selection:bg-emerald-100 selection:text-emerald-900 relative">
      {/* Subtle Ambient Light Radiance */}
      <div className="fixed -top-40 left-1/2 -translate-x-1/2 w-[1200px] h-[700px] bg-emerald-500/[0.04] blur-[140px] rounded-full pointer-events-none -z-10" />
      <div className="fixed top-1/3 -left-48 w-[800px] h-[800px] bg-slate-200/50 blur-[160px] rounded-full pointer-events-none -z-10" />
      <div className="fixed bottom-0 -right-48 w-[850px] h-[850px] bg-emerald-500/[0.03] blur-[160px] rounded-full pointer-events-none -z-10" />

      {/* Top Bar Navigation */}
      <Navbar
        activeTab={activeTab}
        setActiveTab={setActiveTab}
        onOpenExportModal={() => setIsExportModalOpen(true)}
        currentUser={currentUser}
        onLogout={onLogout}
      />

      {/* Main Container */}
      <main className="min-h-0 flex-1 w-full overflow-y-auto overflow-x-hidden overscroll-contain px-4 sm:px-6 lg:px-8 py-5">
        {/* Sub-header with User Info and Status */}
        <div className="mb-4 flex flex-wrap items-center justify-between gap-2 text-xs font-mono">
          <div className="flex items-center gap-2">
            <span className={`h-2 w-2 rounded-full ${connectionError ? 'bg-rose-500' : isLoading ? 'bg-amber-500' : 'bg-emerald-500'}`} />
            <span className="text-slate-600">
              <strong className={connectionError ? 'text-rose-700 font-semibold' : 'text-slate-800 font-semibold'}>
                {isLoading ? 'Connecting to API…' : connectionError || `${currentUser.name} · API connected`}
              </strong>
            </span>
            {pendingCount > 0 && activeTab !== 'finance' && (
              <button
                onClick={() => setActiveTab('finance')}
                className="ml-2 px-2.5 py-0.5 rounded-full bg-amber-50 text-amber-800 border border-amber-300 hover:bg-amber-100 transition-colors text-[11px] font-semibold"
              >
                {pendingCount} Pending Review
              </button>
            )}
          </div>

          <div className="flex items-center gap-3">
            <button
              onClick={resetToDefaults}
              className="text-slate-500 hover:text-slate-900 transition-colors text-[11px] inline-flex items-center gap-1 font-sans"
              title="Reset data to initial state"
            >
              <RotateCcw className="h-3 w-3" />
              <span>Reset</span>
            </button>
          </div>
        </div>

        {/* View Switcher */}
        {activeTab === 'dashboard' && <KpiOverview onNavigateTab={setActiveTab} />}
        {activeTab === 'pipeline' && <LeadPipelineView />}
        {activeTab === 'finance' && <FinanceVerificationView />}
        {activeTab === 'closers' && <CloserPerformanceView />}
        {activeTab === 'attribution' && <StudentAttributionLedger />}
        {activeTab === 'api_sync' && <SalesApiSimulator />}
      </main>

      {/* Clean White Footer */}
      <footer className="shrink-0 border-t border-slate-200 bg-white/90 backdrop-blur-md py-4 text-xs text-slate-500">
        <div className="flex w-full items-center justify-between px-4 sm:px-6 lg:px-8">
          <div className="flex items-center gap-2">
            <span className="font-semibold text-slate-800">TMT Sales Workflow</span>
            <span>·</span>
            <span className="text-slate-500">Verified Attribution</span>
          </div>
          <div className="text-[11px] font-mono text-slate-400">
            Active Period: {effectivePeriod || 'Not configured'}
          </div>
        </div>
      </footer>

      {/* Modals & Overlays */}
      {isExportModalOpen && (
        <ExportReportModal onClose={() => setIsExportModalOpen(false)} />
      )}

      {/* Real-time Notifications */}
      <ToastContainer />
    </div>
  );
}

export default function App() {
  const [currentUser, setCurrentUser] = useState<User | null>(null);
  const [isCheckingSession, setIsCheckingSession] = useState(true);

  useEffect(() => {
    let isMounted = true;

    const expireSession = () => {
      if (isMounted) setCurrentUser(null);
    };

    window.addEventListener('sales-auth-expired', expireSession);

    if (!salesApi.hasStoredSession()) {
      setIsCheckingSession(false);
    } else {
      salesApi.currentUser()
        .then((user) => {
          if (isMounted) setCurrentUser(user);
        })
        .catch(() => {
          if (isMounted) setCurrentUser(null);
        })
        .finally(() => {
          if (isMounted) setIsCheckingSession(false);
        });
    }

    return () => {
      isMounted = false;
      window.removeEventListener('sales-auth-expired', expireSession);
    };
  }, []);

  const handleLogin = async (email: string, password: string) => {
    setCurrentUser(await salesApi.login(email, password));
  };

  const handleLogout = async () => {
    try {
      await salesApi.logout();
    } finally {
      setCurrentUser(null);
    }
  };

  if (isCheckingSession) {
    return (
      <div className="flex h-dvh items-center justify-center bg-slate-950 text-emerald-300">
        <div className="flex items-center gap-3 text-sm font-medium">
          <LoaderCircle className="h-5 w-5 animate-spin" />
          Restoring secure session…
        </div>
      </div>
    );
  }

  if (!currentUser) {
    return <LandingPage onLogin={handleLogin} />;
  }

  return (
    <SalesWorkflowProvider>
      <DashboardContent currentUser={currentUser} onLogout={handleLogout} />
    </SalesWorkflowProvider>
  );
}
