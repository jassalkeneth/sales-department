import React, { useState } from 'react';
import { useSalesWorkflow } from '../context/SalesWorkflowContext';
import {
  CheckCircle2,
  RefreshCw,
  Database,
  BarChart3,
  UserCheck,
  CreditCard,
  ChevronDown,
  ChevronUp
} from 'lucide-react';

interface WorkflowVisualizerProps {
  onSelectStage: (stageTab: string) => void;
}

export const WorkflowVisualizer: React.FC<WorkflowVisualizerProps> = ({ onSelectStage }) => {
  const { leads, students, payments, totalVerifiedCollections, totalVerifiedSales } = useSalesWorkflow();
  const [isExpanded, setIsExpanded] = useState(false);

  const pendingCount = payments.filter((p) => p.status === 'pending').length;
  const verifiedCount = payments.filter((p) => p.status === 'verified').length;

  const steps = [
    { id: 'step-lead', title: '1. Leads', count: `${leads.length}`, targetTab: 'pipeline', icon: UserCheck },
    { id: 'step-enroll', title: '2. Enrolled', count: `${students.length}`, targetTab: 'attribution', icon: CheckCircle2 },
    { id: 'step-finance', title: '3. Finance Queue', count: `${pendingCount} pend · ${verifiedCount} ver`, targetTab: 'finance', icon: CreditCard, highlight: pendingCount > 0 },
    { id: 'step-sync', title: '4. Data Sync', count: 'Real-time', targetTab: 'api_sync', icon: RefreshCw },
    { id: 'step-reporting', title: '5. Attribution DB', count: `$${(totalVerifiedSales / 1000).toFixed(0)}k Booked`, targetTab: 'attribution', icon: Database },
    { id: 'step-kpi', title: '6. Quota Engine', count: `$${(totalVerifiedCollections / 1000).toFixed(0)}k Cash`, targetTab: 'dashboard', icon: BarChart3 }
  ];

  return (
    <div className="w-full border-b border-slate-200 bg-white">
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 py-2">
        <div className="flex items-center justify-between">
          {/* Minimalist Pipeline Stream */}
          <div className="flex items-center gap-2 overflow-x-auto py-0.5 text-xs font-mono">
            <span className="text-[11px] font-bold text-slate-700 font-sans mr-1 flex items-center gap-1.5">
              <span className="h-2 w-2 rounded-full bg-emerald-500" />
              Workflow:
            </span>

            {steps.map((step, idx) => (
              <React.Fragment key={step.id}>
                <button
                  onClick={() => onSelectStage(step.targetTab)}
                  className={`px-2 py-0.5 rounded-md transition-all whitespace-nowrap text-xs flex items-center gap-1.5 ${
                    step.highlight
                      ? 'bg-amber-50 text-amber-900 border border-amber-300 font-semibold shadow-xs'
                      : 'text-slate-600 hover:text-slate-900 hover:bg-slate-100'
                  }`}
                >
                  <span>{step.title}</span>
                  <span className="text-[10px] text-slate-500">({step.count})</span>
                </button>
                {idx < steps.length - 1 && <span className="text-slate-300">→</span>}
              </React.Fragment>
            ))}
          </div>

          <button
            onClick={() => setIsExpanded(!isExpanded)}
            className="hidden sm:flex items-center gap-1 text-[11px] text-slate-500 hover:text-slate-800 transition-colors ml-2"
          >
            <span>{isExpanded ? 'Hide Details' : 'Diagram'}</span>
            {isExpanded ? <ChevronUp className="h-3 w-3" /> : <ChevronDown className="h-3 w-3" />}
          </button>
        </div>

        {/* Detailed Card view */}
        {isExpanded && (
          <div className="mt-2.5 pt-2.5 border-t border-slate-200 grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-2">
            {steps.map((step) => {
              const Icon = step.icon;
              return (
                <button
                  key={step.id}
                  onClick={() => onSelectStage(step.targetTab)}
                  className={`p-2.5 rounded-xl border text-left transition-all ${
                    step.highlight
                      ? 'border-amber-300 bg-amber-50 text-amber-900 shadow-xs'
                      : 'border-slate-200 bg-slate-50/80 text-slate-700 hover:border-slate-300 hover:bg-white shadow-xs'
                  }`}
                >
                  <div className="flex items-center justify-between mb-1">
                    <span className="text-xs font-bold text-slate-900 truncate">{step.title}</span>
                    <Icon className="h-3.5 w-3.5 text-emerald-600" />
                  </div>
                  <div className="text-[11px] font-mono text-slate-600 font-medium">
                    {step.count}
                  </div>
                </button>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
};
