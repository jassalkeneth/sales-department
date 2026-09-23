import React from 'react';
import { useSalesWorkflow } from '../context/SalesWorkflowContext';
import { CheckCircle2, Info, AlertTriangle, X } from 'lucide-react';

export const ToastContainer: React.FC = () => {
  const { toastMessage, dismissToast } = useSalesWorkflow();

  if (!toastMessage) return null;

  return (
    <div className="fixed bottom-5 right-5 z-50 max-w-sm w-full animate-in fade-in slide-in-from-bottom-5 duration-200">
      <div
        className={`rounded-2xl border p-4 shadow-xl bg-white flex items-start gap-3 ${
          toastMessage.type === 'success'
            ? 'border-emerald-200'
            : toastMessage.type === 'alert'
            ? 'border-rose-200'
            : 'border-indigo-200'
        }`}
      >
        <div className="shrink-0 mt-0.5">
          {toastMessage.type === 'success' && <CheckCircle2 className="h-5 w-5 text-emerald-600" />}
          {toastMessage.type === 'alert' && <AlertTriangle className="h-5 w-5 text-rose-600" />}
          {toastMessage.type === 'info' && <Info className="h-5 w-5 text-indigo-600" />}
        </div>

        <div className="flex-1">
          <h4 className="text-xs font-bold text-slate-900 tracking-tight">{toastMessage.title}</h4>
          <p className="text-[11px] text-slate-600 mt-0.5 leading-relaxed">{toastMessage.desc}</p>
        </div>

        <button
          onClick={dismissToast}
          className="shrink-0 text-slate-400 hover:text-slate-700 transition-colors"
        >
          <X className="h-4 w-4" />
        </button>
      </div>
    </div>
  );
};
