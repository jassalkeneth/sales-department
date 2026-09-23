/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState } from 'react';
import { SalesWorkflowProvider, useSalesWorkflow } from './context/SalesWorkflowContext';
import { Navbar } from './components/Navbar';
import { KpiOverview } from './components/KpiOverview';
import { FinanceVerificationView } from './components/FinanceVerificationView';
import { LeadPipelineView } from './components/LeadPipelineView';
import { CloserPerformanceView } from './components/CloserPerformanceView';
import { StudentAttributionLedger } from './components/StudentAttributionLedger';
import { SalesApiSimulator } from './components/SalesApiSimulator';
import { ExportReportModal } from './components/ExportReportModal';
import { AuthModal } from './components/AuthModal';
import { ToastContainer } from './components/ToastContainer';
import { RotateCcw } from 'lucide-react';

function DashboardContent() {
  const [activeTab, setActiveTab] = useState<string>('dashboard');
  const [isExportModalOpen, setIsExportModalOpen] = useState(false);
  const [isAuthModalOpen, setIsAuthModalOpen] = useState(false);

  const { resetToDefaults, payments, currentUser } = useSalesWorkflow();
  const pendingCount = payments.filter((p) => p.status === 'pending').length;

  return (
    <div className="min-h-screen bg-[#f8fafc] text-slate-900 flex flex-col selection:bg-emerald-100 selection:text-emerald-900 relative overflow-x-hidden">
      {/* Subtle Ambient Light Radiance */}
      <div className="fixed -top-40 left-1/2 -translate-x-1/2 w-[1200px] h-[700px] bg-emerald-500/[0.04] blur-[140px] rounded-full pointer-events-none -z-10" />
      <div className="fixed top-1/3 -left-48 w-[800px] h-[800px] bg-slate-200/50 blur-[160px] rounded-full pointer-events-none -z-10" />
      <div className="fixed bottom-0 -right-48 w-[850px] h-[850px] bg-emerald-500/[0.03] blur-[160px] rounded-full pointer-events-none -z-10" />

      {/* Top Bar Navigation */}
      <Navbar
        activeTab={activeTab}
        setActiveTab={setActiveTab}
        onOpenExportModal={() => setIsExportModalOpen(true)}
        onOpenAuthModal={() => setIsAuthModalOpen(true)}
      />

      {/* Main Container */}
      <main className="flex-1 mx-auto max-w-7xl w-full px-4 sm:px-6 lg:px-8 py-5">
        {/* Sub-header with User Info and Status */}
        <div className="mb-4 flex flex-wrap items-center justify-between gap-2 text-xs font-mono">
          <div className="flex items-center gap-2">
            <span className="h-2 w-2 rounded-full bg-emerald-500" />
            <span className="text-slate-600 capitalize">
              <strong className="text-slate-800 font-semibold">{currentUser.role.replace('_', ' ')}</strong> · {currentUser.name}
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
      <footer className="border-t border-slate-200 bg-white/90 backdrop-blur-md py-4 text-xs text-slate-500">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <span className="font-semibold text-slate-800">TMT Sales Workflow</span>
            <span>·</span>
            <span className="text-slate-500">Verified Attribution</span>
          </div>
          <div className="text-[11px] font-mono text-slate-400">
            Active Cohort: Sept 2026
          </div>
        </div>
      </footer>

      {/* Modals & Overlays */}
      {isExportModalOpen && (
        <ExportReportModal onClose={() => setIsExportModalOpen(false)} />
      )}

      {isAuthModalOpen && (
        <AuthModal onClose={() => setIsAuthModalOpen(false)} />
      )}

      {/* Real-time Notifications */}
      <ToastContainer />
    </div>
  );
}

export default function App() {
  return (
    <SalesWorkflowProvider>
      <DashboardContent />
    </SalesWorkflowProvider>
  );
}
