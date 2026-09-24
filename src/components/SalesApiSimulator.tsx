import React, { useEffect, useState } from 'react';
import { useSalesWorkflow } from '../context/SalesWorkflowContext';
import { salesApi } from '../api/salesApi';
import {
  RefreshCw,
  Copy,
  Check
} from 'lucide-react';

export const SalesApiSimulator: React.FC = () => {
  const {
    syncEvents
  } = useSalesWorkflow();

  const [selectedEndpoint, setSelectedEndpoint] = useState<string>('/performance');
  const [copied, setCopied] = useState(false);
  const [responseJson, setResponseJson] = useState('');
  const [responseStatus, setResponseStatus] = useState<number | null>(null);
  const [isRequesting, setIsRequesting] = useState(false);
  const [refreshCounter, setRefreshCounter] = useState(0);

  useEffect(() => {
    let isMounted = true;
    setIsRequesting(true);
    salesApi.inspect(selectedEndpoint)
      .then((data) => {
        if (!isMounted) return;
        setResponseStatus(200);
        setResponseJson(JSON.stringify(data, null, 2));
      })
      .catch((error) => {
        if (!isMounted) return;
        setResponseStatus('status' in error ? Number(error.status) : 500);
        setResponseJson(JSON.stringify({ message: error instanceof Error ? error.message : 'Request failed.' }, null, 2));
      })
      .finally(() => {
        if (isMounted) setIsRequesting(false);
      });

    return () => {
      isMounted = false;
    };
  }, [refreshCounter, selectedEndpoint]);

  const handleCopy = () => {
    navigator.clipboard.writeText(responseJson);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const endpoints = [
    { path: '/closers', desc: 'List of admissions closers and active quota profiles' },
    { path: '/leads', desc: 'Lead pipeline records and current stages' },
    { path: '/students', desc: 'Student enrollment attribution ledger records' },
    { path: '/payments', desc: 'Finance verification and collection records' },
    { path: '/performance', desc: 'Ranked closer performance and quota results' },
    { path: '/sync-events', desc: 'Payment-to-sales synchronization events' },
    { path: '/audit-logs', desc: 'Finance verification audit trail' }
  ];

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-slate-200 pb-4">
        <div>
          <div className="flex items-center gap-2">
            <h2 className="text-xl font-bold text-slate-900 tracking-tight">
              Sales Data Sync &amp; API Console
            </h2>
            <span className="px-2 py-0.5 text-xs font-mono font-semibold rounded bg-indigo-50 text-indigo-800 border border-indigo-200">
              REST v1 Engine
            </span>
          </div>
          <p className="text-xs text-slate-500 mt-0.5">
            Authenticated responses from the live Laravel API and connected database.
          </p>
        </div>
      </div>

      {/* Sync Events Stream */}
      <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-xs">
        <div className="flex items-center justify-between mb-3">
          <div className="flex items-center gap-2">
            <RefreshCw className="h-4 w-4 text-indigo-600 animate-spin" />
            <h3 className="text-sm font-bold text-slate-900">
              Real-Time Sales Data Sync Stream
            </h3>
          </div>
          <span className="text-[11px] font-mono text-emerald-800 bg-emerald-50 px-2 py-0.5 rounded-full border border-emerald-200 font-semibold flex items-center gap-1.5">
            <span className="h-2 w-2 rounded-full bg-emerald-500 animate-pulse" />
            Pipeline Connected
          </span>
        </div>

        <p className="text-xs text-slate-500 mb-4">
          Incoming payments verified in Finance are validated for duplicates, matched to student &amp; closer profiles, and pushed to the Sales Reporting DB.
        </p>

        <div className="space-y-2 font-mono text-xs max-h-48 overflow-y-auto pr-1">
          {syncEvents.map((evt) => (
            <div
              key={evt.id}
              className="p-2.5 rounded-xl bg-slate-50 border border-slate-200 flex flex-col sm:flex-row sm:items-center justify-between gap-2"
            >
              <div className="flex items-center gap-2">
                <span className="px-1.5 py-0.5 text-[10px] font-bold rounded bg-indigo-100 text-indigo-900 border border-indigo-200">
                  {evt.status}
                </span>
                <span className="text-slate-900 font-semibold">{evt.transactionRef}</span>
                <span className="text-slate-400">·</span>
                <span className="text-slate-700 font-sans">{evt.details}</span>
              </div>
              <div className="flex items-center gap-3 text-[10px] text-slate-500 shrink-0">
                <span>{evt.verificationLatencyMs}ms</span>
                <span>{new Date(evt.timestamp).toLocaleTimeString()}</span>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* API Endpoints & Live Console */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* Endpoint Selector (4 cols) */}
        <div className="lg:col-span-4 rounded-2xl border border-slate-200 bg-white p-5 shadow-xs">
          <h3 className="text-sm font-bold text-slate-900 tracking-tight mb-3">
            Sales API Endpoints
          </h3>
          <div className="space-y-1.5 font-mono text-xs">
            {endpoints.map((ep) => {
              const isSelected = selectedEndpoint === ep.path;
              return (
                <button
                  key={ep.path}
                  onClick={() => setSelectedEndpoint(ep.path)}
                  className={`w-full text-left p-3 rounded-xl border transition-all ${
                    isSelected
                      ? 'border-indigo-300 bg-indigo-50/70 text-slate-900 shadow-xs'
                      : 'border-slate-200 bg-white text-slate-700 hover:border-slate-300 hover:bg-slate-50'
                  }`}
                >
                  <div className="flex items-center justify-between">
                    <span className="font-semibold text-indigo-700">GET {ep.path}</span>
                    <span className="text-[10px] text-emerald-800 bg-emerald-100 px-1.5 py-0.2 rounded font-bold">
                      LIVE
                    </span>
                  </div>
                  <p className="text-[11px] font-sans text-slate-500 mt-1">{ep.desc}</p>
                </button>
              );
            })}
          </div>
        </div>

        {/* Live Response Viewer (8 cols) */}
        <div className="lg:col-span-8 rounded-2xl border border-slate-200 bg-white p-5 flex flex-col shadow-xs">
          <div className="flex items-center justify-between mb-3 border-b border-slate-100 pb-3">
            <div className="flex items-center gap-2 font-mono text-xs">
              <span className="px-2 py-0.5 rounded bg-emerald-50 text-emerald-800 border border-emerald-200 font-bold">
                {isRequesting ? 'GET…' : 'GET'}
              </span>
              <span className="text-slate-900 font-semibold">/api{selectedEndpoint}</span>
              {responseStatus && <span className="text-slate-500">{responseStatus}</span>}
            </div>

            <div className="flex items-center gap-2">
              <button onClick={() => setRefreshCounter((value) => value + 1)} className="px-2.5 py-1 text-xs text-slate-700 bg-slate-100 hover:bg-slate-200 rounded-lg">Refresh</button>
              <button
                onClick={handleCopy}
                className="flex items-center gap-1 px-2.5 py-1 text-xs text-slate-700 bg-slate-100 hover:bg-slate-200 rounded-lg transition-colors font-sans font-medium"
              >
                {copied ? <Check className="h-3.5 w-3.5 text-emerald-600" /> : <Copy className="h-3.5 w-3.5" />}
                <span>{copied ? 'Copied' : 'Copy JSON'}</span>
              </button>
            </div>
          </div>

          <div className="p-4 rounded-xl bg-slate-50 border border-slate-200 font-mono text-xs text-slate-800 overflow-x-auto max-h-[460px] flex-1">
            <pre>{responseJson}</pre>
          </div>
        </div>
      </div>
    </div>
  );
};
